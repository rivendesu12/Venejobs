import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!(await assertConversationAccess(id, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`
      UPDATE messages
      SET read_at = NOW()
      WHERE conversation_id = ${id}
        AND sender_id != ${session.user.id}
        AND read_at IS NULL
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/conversations/[id]/read]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
