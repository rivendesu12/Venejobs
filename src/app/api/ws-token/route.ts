import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';
import { assertConversationAccess } from '@/lib/assertions';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let conversationId: string;
  try {
    const body = await req.json() as { conversationId?: string };
    conversationId = body.conversationId ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  if (!(await assertConversationAccess(conversationId, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = jwt.sign(
    { userId: session.user.id, conversationId },
    process.env.WS_SECRET!,
    { expiresIn: '30s' },
  );

  return NextResponse.json({ token });
}
