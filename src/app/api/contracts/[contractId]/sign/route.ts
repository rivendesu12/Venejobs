import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract, getConversationParticipants } from '@/lib/contracts';

interface SignBody {
  typedName: string;
}

/** POST /api/contracts/[contractId]/sign */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;
  const userId = session.user.id;

  let body: SignBody;
  try {
    body = (await req.json()) as SignBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { typedName } = body;
  if (!typedName?.trim()) {
    return NextResponse.json({ error: 'Typed name is required' }, { status: 400 });
  }

  // Validate typed name matches user's profile name (case-insensitive)
  const users = await sql<{ name: string }[]>`
    SELECT name FROM users WHERE id = ${userId}
  `;
  if (users.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (users[0].name.trim().toLowerCase() !== typedName.trim().toLowerCase()) {
    return NextResponse.json(
      { error: 'Typed name must match your profile name' },
      { status: 400 },
    );
  }

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

  // Only signable if pending_review
  if (contract.status !== 'pending_review') {
    return NextResponse.json({ error: 'Contract is not in a signable state' }, { status: 400 });
  }

  // The signer must NOT be the one who proposed the current revision
  if (contract.current_revision_id) {
    const [rev] = await sql<{ proposed_by: number }[]>`
      SELECT proposed_by FROM contract_revisions WHERE id = ${contract.current_revision_id}::uuid
    `;
    if (rev.proposed_by === userId) {
      return NextResponse.json(
        { error: 'You cannot sign your own proposal. The other party must sign first.' },
        { status: 400 },
      );
    }
  }

  // Check if user has already signed
  const existingSigs = await sql<{ id: string }[]>`
    SELECT id::text FROM contract_signatures
    WHERE contract_id = ${contractId}::uuid AND user_id = ${userId}
  `;
  if (existingSigs.length > 0) {
    return NextResponse.json({ error: 'You have already signed this contract' }, { status: 400 });
  }

  // Get IP and user agent
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;
  const userAgent = req.headers.get('user-agent') ?? null;

  // Insert signature
  await sql`
    INSERT INTO contract_signatures (contract_id, user_id, typed_name, ip_address, user_agent)
    VALUES (${contractId}::uuid, ${userId}, ${typedName.trim()}, ${ipAddress}, ${userAgent})
  `;

  // Check if both parties have now signed
  const participants = await getConversationParticipants(contract.conversation_id);
  if (participants) {
    const allSigs = await sql<{ user_id: number }[]>`
      SELECT user_id FROM contract_signatures WHERE contract_id = ${contractId}::uuid
    `;
    const signerIds = new Set(allSigs.map((s) => s.user_id));
    if (signerIds.has(participants.freelancerId) && signerIds.has(participants.clientId)) {
      await sql`
        UPDATE contracts SET status = 'accepted', updated_at = now()
        WHERE id = ${contractId}::uuid
      `;
    }
  }

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  broadcastContract(contract.conversation_id, 'contract_updated', fullContract).catch(() => undefined);

  return NextResponse.json({ contract: fullContract });
}
