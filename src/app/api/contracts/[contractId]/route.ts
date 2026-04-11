import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract } from '@/lib/contracts';

/** GET /api/contracts/[contractId] — fetch full contract with revisions & signatures */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;

  // Look up the conversation this contract belongs to
  const rows = await sql<{ conversation_id: string }[]>`
    SELECT conversation_id::text FROM contracts WHERE id = ${contractId}::uuid
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Verify access
  if (!(await assertConversationAccess(rows[0].conversation_id, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const contract = await fetchFullContract(contractId);
  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  return NextResponse.json({ contract });
}
