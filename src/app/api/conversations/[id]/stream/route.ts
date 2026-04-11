export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { listenSql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = await params;

  if (!(await assertConversationAccess(id, session.user.id))) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller): Promise<void> {
      // Heartbeat every 25 seconds to keep the connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 25_000);

      await listenSql.listen('new_message', (payload: string) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(payload);
        } catch {
          return;
        }
        if (msg.conversation_id !== id) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
      });

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        listenSql.unlisten('new_message').catch(() => undefined);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
