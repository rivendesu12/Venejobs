import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

/** POST /api/contracts/[contractId]/decline */
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

  const contracts = await sql<{ id: string; conversation_id: string; status: string }[]>`
    SELECT id::text, conversation_id::text, status::text
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

  if (contract.status === 'accepted' || contract.status === 'cancelled' || contract.status === 'declined') {
    return NextResponse.json({ error: 'Contract cannot be declined in its current state' }, { status: 400 });
  }

  await sql`
    UPDATE contracts SET status = 'declined', updated_at = now()
    WHERE id = ${contractId}::uuid
  `;

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  broadcastContract(contract.conversation_id, 'contract_updated', fullContract).catch(() => undefined);

  return NextResponse.json({ contract: fullContract });
}
