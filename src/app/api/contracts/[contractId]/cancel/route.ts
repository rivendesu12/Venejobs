import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

/** POST /api/contracts/[contractId]/cancel — only the creator can cancel, and only if not accepted */
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
    created_by: number;
  }[]>`
    SELECT id::text, conversation_id::text, status::text, created_by
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

  if (contract.created_by !== userId) {
    return NextResponse.json({ error: 'Only the contract creator can cancel' }, { status: 403 });
  }

  if (contract.status === 'accepted') {
    return NextResponse.json({ error: 'Accepted contracts cannot be cancelled' }, { status: 400 });
  }

  if (contract.status === 'cancelled') {
    return NextResponse.json({ error: 'Contract is already cancelled' }, { status: 400 });
  }

  await sql`
    UPDATE contracts SET status = 'cancelled', updated_at = now()
    WHERE id = ${contractId}::uuid
  `;

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  broadcastContract(contract.conversation_id, 'contract_updated', fullContract).catch(() => undefined);

  return NextResponse.json({ contract: fullContract });
}
