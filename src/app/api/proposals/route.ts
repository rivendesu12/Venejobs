import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, coverLetter, offeredPrice, estimatedDays } = body ?? {};

    if (!jobId || !coverLetter || offeredPrice == null || estimatedDays == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch job
    const jobs = await sql<{ id: number; client_id: number; status: string }[]>`
      SELECT id, client_id, status FROM jobs WHERE id = ${jobId} LIMIT 1
    `;
    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const job = jobs[0];

    if (job.status !== 'published') {
      return NextResponse.json({ error: 'Job is not accepting proposals' }, { status: 400 });
    }

    if (session.user.id === job.client_id) {
      return NextResponse.json({ error: 'You cannot apply to your own job' }, { status: 400 });
    }

    // Check for existing proposal
    const existing = await sql`
      SELECT id FROM proposals
      WHERE job_id = ${jobId} AND freelancer_id = ${session.user.id}
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'You have already submitted a proposal for this job' }, { status: 409 });
    }

    // Insert proposal + conversation in a transaction
    const result = await sql.begin(async (tx) => {
      const [proposal] = await tx`
        INSERT INTO proposals (job_id, freelancer_id, cover_letter, proposed_amount, estimated_duration, created_at, updated_at)
        VALUES (${jobId}, ${session.user.id}, ${coverLetter}, ${offeredPrice}, ${String(estimatedDays)}, NOW(), NOW())
        RETURNING id
      `;
      await tx`
        INSERT INTO conversations (proposal_id)
        VALUES (${proposal.id})
      `;
      return proposal;
    });

    return NextResponse.json({ proposalId: result.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/proposals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
