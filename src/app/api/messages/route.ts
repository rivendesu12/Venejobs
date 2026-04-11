import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';

interface AttachmentInput {
  url: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
}

interface MessageBody {
  conversationId?: string;
  body?: string;
  replyToId?: string;
  attachments?: AttachmentInput[];
}

/** POST /api/messages — create a new message with optional attachments */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: MessageBody;
  try {
    payload = (await req.json()) as MessageBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { conversationId, body, replyToId, attachments } = payload;

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  if (!body?.trim() && (!attachments || attachments.length === 0)) {
    return NextResponse.json(
      { error: 'Message must have a body or at least one attachment' },
      { status: 400 },
    );
  }

  if (!(await assertConversationAccess(conversationId, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Insert the message
  const [msg] = await sql<{ id: string; sent_at: string }[]>`
    INSERT INTO messages (conversation_id, sender_id, body, reply_to_id)
    VALUES (
      ${conversationId}::uuid,
      ${session.user.id},
      ${body?.trim() ?? null},
      ${replyToId ? sql`${replyToId}::uuid` : sql`NULL`}
    )
    RETURNING id::text, sent_at
  `;

  // Insert attachments if provided
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      await sql`
        INSERT INTO message_attachments (message_id, url, file_name, file_type, mime_type, size_bytes)
        VALUES (
          ${msg.id}::uuid,
          ${att.url},
          ${att.fileName},
          ${att.fileType},
          ${att.mimeType},
          ${att.sizeBytes}
        )
      `;
    }
  }

  // Fetch the full message (with sender info, attachments, replyTo)
  const fullMessage = await fetchFullMessage(msg.id);

  // Broadcast to WS clients (non-blocking — fire and forget)
  broadcastNewMessage(conversationId, fullMessage).catch(() => undefined);

  return NextResponse.json({ message: fullMessage }, { status: 201 });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchFullMessage(messageId: string) {
  const rows = await sql<RawMessageRow[]>`
    SELECT
      m.id::text,
      m.conversation_id::text,
      m.sender_id,
      m.body,
      m.is_deleted,
      m.reply_to_id::text,
      m.sent_at,
      u.name              AS sender_name,
      u.profile_picture   AS sender_avatar,
      -- Reply preview
      rm.body             AS reply_body,
      rm.is_deleted       AS reply_is_deleted,
      ru.name             AS reply_sender_name,
      -- Attachments
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
      -- Reactions (empty for new message)
      '[]'::json AS reactions,
      -- Read by (empty for new message)
      '{}'::int[] AS read_by
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    LEFT JOIN messages rm ON rm.id = m.reply_to_id
    LEFT JOIN users  ru ON ru.id = rm.sender_id
    WHERE m.id = ${messageId}::uuid
  `;

  if (rows.length === 0) return null;
  return shapeMessage(rows[0]);
}

interface RawMessageRow {
  id: string;
  conversation_id: string;
  sender_id: number;
  body: string | null;
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
    is_deleted: row.is_deleted,
    reply_to_id: row.reply_to_id,
    reply_to:
      row.reply_to_id
        ? {
            id: row.reply_to_id,
            body: row.reply_is_deleted ? null : row.reply_body,
            sender_name: row.reply_sender_name,
          }
        : null,
    sent_at: row.sent_at,
    attachments: row.attachments ?? [],
    reactions: row.reactions ?? [],
    read_by: row.read_by ?? [],
  };
}

async function broadcastNewMessage(
  conversationId: string,
  message: ReturnType<typeof shapeMessage> | null,
): Promise<void> {
  if (!message) return;
  const internalUrl = process.env.WS_INTERNAL_URL ?? 'http://localhost:4001';
  await fetch(`${internalUrl}/internal/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.WS_INTERNAL_SECRET ?? '',
    },
    body: JSON.stringify({
      conversationId,
      payload: { type: 'new_message', message },
    }),
  });
}
