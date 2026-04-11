import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const inbox = await sql`
      SELECT
        c.id                                                        AS conversation_id,
        p.id                                                        AS proposal_id,
        p.status                                                    AS proposal_status,
        p.proposed_amount                                           AS offered_price,
        j.title                                                     AS job_title,
        CASE
          WHEN p.freelancer_id = ${userId} THEN client.name
          ELSE freelancer.name
        END                                                         AS other_name,
        CASE
          WHEN p.freelancer_id = ${userId} THEN client.profile_picture
          ELSE freelancer.profile_picture
        END                                                         AS other_avatar,
        last_msg.body                                               AS last_message_body,
        last_msg.sent_at                                            AS last_message_sent_at,
        (
          SELECT COUNT(*)::int
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id != ${userId}
            AND m.is_deleted = false
            AND NOT EXISTS (
              SELECT 1 FROM message_reads mr
              WHERE mr.message_id = m.id AND mr.user_id = ${userId}
            )
        )                                                           AS unread_count
      FROM conversations c
      JOIN proposals p        ON p.id  = c.proposal_id
      JOIN jobs j             ON j.id  = p.job_id
      JOIN users freelancer   ON freelancer.id = p.freelancer_id
      JOIN users client       ON client.id     = j.client_id
      LEFT JOIN LATERAL (
        SELECT
          CASE WHEN is_deleted THEN NULL ELSE body END AS body,
          sent_at,
          is_deleted
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY sent_at DESC
        LIMIT 1
      ) last_msg ON true
      WHERE p.freelancer_id = ${userId}
         OR j.client_id     = ${userId}
      ORDER BY COALESCE(last_msg.sent_at, c.created_at) DESC
    `;

    return NextResponse.json({ inbox });
  } catch (err) {
    console.error('[GET /api/inbox]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
