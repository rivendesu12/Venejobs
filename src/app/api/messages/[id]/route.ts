import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract } from '@/lib/contracts';

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/messages/[id] ───────────────────────────────────────────────────
// [id] is treated as conversationId.
// Returns cursor-paginated messages (30 per page), oldest-first within the page.
// Query params: ?cursor=<ISO timestamp>  (omit for the latest page)

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId } = await params;

  if (!(await assertConversationAccess(conversationId, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cursor = req.nextUrl.searchParams.get('cursor') ?? null;

  // Fetch 30 messages newest-first (for cursor pagination), then reverse for display.
  const rows = await sql<RawMessageRow[]>`
    SELECT
      m.id::text,
      m.conversation_id::text,
      m.sender_id,
      m.body,
      m.message_type,
      m.is_deleted,
      m.reply_to_id::text,
      m.sent_at,
      u.name              AS sender_name,
      u.profile_picture   AS sender_avatar,
      rm.body             AS reply_body,
      rm.is_deleted       AS reply_is_deleted,
      ru.name             AS reply_sender_name,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id',         a.id,
            'url',        a.url,
            'file_name',  a.file_name,
            'file_type',  a.file_type,
            'mime_type',  a.mime_type,
            'size_bytes', a.size_bytes
          ) ORDER BY a.created_at
        )
        FROM message_attachments a
        WHERE a.message_id = m.id
      ), '[]'::json) AS attachments,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'emoji',    r.emoji,
            'count',    r.cnt,
            'userIds',  r.user_ids
          )
        )
        FROM (
          SELECT emoji, COUNT(*)::int AS cnt, array_agg(user_id) AS user_ids
          FROM message_reactions
          WHERE message_id = m.id
          GROUP BY emoji
        ) r
      ), '[]'::json) AS reactions,
      COALESCE((
        SELECT array_agg(mr.user_id)
        FROM message_reads mr
        WHERE mr.message_id = m.id
      ), '{}'::int[]) AS read_by
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    LEFT JOIN messages rm ON rm.id = m.reply_to_id
    LEFT JOIN users  ru ON ru.id = rm.sender_id
    WHERE m.conversation_id = ${conversationId}::uuid
      ${cursor ? sql`AND m.sent_at < ${cursor}::timestamptz` : sql``}
    ORDER BY m.sent_at DESC
    LIMIT 30
  `;

  // Reverse so the page is returned oldest-first for display
  const shaped = rows.reverse().map(shapeMessage);

  // Hydrate contract messages with full contract data
  const messages = await Promise.all(
    shaped.map(async (msg) => {
      if (msg.message_type !== 'contract') return msg;
      // Find the contract that references this message
      const contractRows = await sql<{ id: string }[]>`
        SELECT id::text FROM contracts WHERE message_id = ${msg.id}::uuid LIMIT 1
      `;
      if (contractRows.length === 0) return msg;
      const contract = await fetchFullContract(contractRows[0].id);
      return { ...msg, contract: contract ?? undefined };
    }),
  );

  // nextCursor is the sent_at of the oldest message returned (for previous pages)
  const nextCursor = rows.length === 30 ? (rows[0]?.sent_at ?? null) : null;

  return NextResponse.json({ messages, nextCursor });
}

// ─── DELETE /api/messages/[id] ────────────────────────────────────────────────
// [id] is treated as messageId.
// Soft-deletes the message (only the sender can delete their own).

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: messageId } = await params;

  // Look up the message to verify ownership and get conversationId
  const [row] = await sql<{ conversation_id: string; sender_id: number }[]>`
    SELECT conversation_id::text, sender_id
    FROM messages
    WHERE id = ${messageId}::uuid
    LIMIT 1
  `;

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (row.sender_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await sql`
    UPDATE messages
    SET is_deleted = true, body = NULL
    WHERE id = ${messageId}::uuid
  `;

  // Broadcast to WS clients (non-blocking)
  broadcastDeleted(row.conversation_id, messageId).catch(() => undefined);

  return NextResponse.json({ ok: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface RawMessageRow {
  id: string;
  conversation_id: string;
  sender_id: number;
  body: string | null;
  message_type: string;
  is_deleted: boolean;
  reply_to_id: string | null;
  sent_at: string;
  sender_name: string;
  sender_avatar: string | null;
  reply_body: string | null;
  reply_is_deleted: boolean | null;
  reply_sender_name: string | null;
  attachments: unknown;
  reactions: unknown;
  read_by: number[];
}

function shapeMessage(row: RawMessageRow) {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_name: row.sender_name,
    sender_avatar: row.sender_avatar,
    body: row.is_deleted ? null : row.body,
    message_type: row.message_type ?? 'text',
    is_deleted: row.is_deleted,
    reply_to_id: row.reply_to_id,
    reply_to: row.reply_to_id
      ? {
          id: row.reply_to_id,
          body: row.reply_is_deleted ? null : row.reply_body,
          sender_name: row.reply_sender_name ?? '',
        }
      : null,
    sent_at: row.sent_at,
    attachments: row.attachments ?? [],
    reactions: row.reactions ?? [],
    read_by: row.read_by ?? [],
  };
}

async function broadcastDeleted(conversationId: string, messageId: string): Promise<void> {
  const internalUrl = process.env.WS_INTERNAL_URL ?? 'http://localhost:4001';
  await fetch(`${internalUrl}/internal/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.WS_INTERNAL_SECRET ?? '',
    },
    body: JSON.stringify({
      conversationId,
      payload: { type: 'message_deleted', messageId, conversationId },
    }),
  });
}
