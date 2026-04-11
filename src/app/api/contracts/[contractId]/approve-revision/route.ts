import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

/** POST /api/contracts/[contractId]/approve-revision */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;
  const userId = session.user.id;

  const contracts = await sql<{
    id: string;
    conversation_id: string;
    status: string;
    current_revision_id: string | null;
  }[]>`
    SELECT id::text, conversation_id::text, status::text, current_revision_id::text
    FROM contracts
    WHERE id = ${contractId}::uuid
  `;
  if (contracts.length === 0) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }
  const contract = contracts[0];

  if (!(await assertConversationAccess(contract.conversation_id, userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (contract.status !== 'revision_requested') {
    return NextResponse.json({ error: 'No revision to approve' }, { status: 400 });
  }

  // Only the person who did NOT propose the current revision can approve
  if (contract.current_revision_id) {
    const [rev] = await sql<{ proposed_by: number }[]>`
      SELECT proposed_by FROM contract_revisions WHERE id = ${contract.current_revision_id}::uuid
    `;
    if (rev.proposed_by === userId) {
      return NextResponse.json(
        { error: 'You cannot approve your own revision' },
        { status: 400 },
      );
    }
  }

  await sql`
    UPDATE contracts
    SET status = 'pending_review', updated_at = now()
    WHERE id = ${contractId}::uuid
  `;

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  broadcastContract(contract.conversation_id, 'contract_updated', fullContract).catch(() => undefined);

  return NextResponse.json({ contract: fullContract });
}
