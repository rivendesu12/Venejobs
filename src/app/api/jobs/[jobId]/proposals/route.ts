import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    const jobs = await sql<{ client_id: number }[]>`
      SELECT client_id FROM jobs WHERE id = ${jobId} LIMIT 1
    `;
    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (jobs[0].client_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const proposals = await sql`
      SELECT
        p.id,
        p.cover_letter,
        p.proposed_amount      AS offered_price,
        p.estimated_duration   AS estimated_days,
        p.status,
        p.created_at,
        u.name        AS freelancer_name,
        u.profile_picture AS avatar_url,
        c.id          AS conversation_id
      FROM proposals p
      JOIN users u ON u.id = p.freelancer_id
      LEFT JOIN conversations c ON c.proposal_id = p.id
      WHERE p.job_id = ${jobId}
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json({ proposals });
  } catch (err) {
    console.error('[GET /api/jobs/[jobId]/proposals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
