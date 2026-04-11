import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!(await assertConversationAccess(id, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await sql`
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.body,
        m.read_at,
        m.sent_at,
        u.name            AS sender_name,
        u.profile_picture AS sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = ${id}
      ORDER BY m.sent_at ASC
    `;

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[GET /api/conversations/[id]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!(await assertConversationAccess(id, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const text: string = body?.body ?? '';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const [message] = await sql`
      INSERT INTO messages (conversation_id, sender_id, body)
      VALUES (${id}, ${session.user.id}, ${text.trim()})
      RETURNING id, conversation_id, sender_id, body, read_at, sent_at
    `;

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/conversations/[id]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
