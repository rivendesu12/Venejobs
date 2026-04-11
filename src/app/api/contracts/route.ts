import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

interface CreateContractBody {
  conversationId: string;
  title: string;
  scope: string;
  deliverables: string;
  price: number;
  currency: string;
  deadline: string;
  paymentTerms: string;
  additionalTerms?: string;
}

/** POST /api/contracts — create a new contract in a conversation */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateContractBody;
  try {
    body = (await req.json()) as CreateContractBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    conversationId,
    title,
    scope,
    deliverables,
    price,
    currency,
    deadline,
    paymentTerms,
    additionalTerms,
  } = body;

  // Validate required fields
  if (!conversationId || !title?.trim() || !scope?.trim() || !deliverables?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!price || price <= 0) {
    return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
  }
  if (!currency?.trim() || !deadline?.trim() || !paymentTerms?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate deadline is in the future
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
    return NextResponse.json({ error: 'Deadline must be a valid future date' }, { status: 400 });
  }

  // Check conversation access
  if (!(await assertConversationAccess(conversationId, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = session.user.id;

  // 1. Create the contract
  const [contract] = await sql<{ id: string }[]>`
    INSERT INTO contracts (conversation_id, created_by, status)
    VALUES (${conversationId}::uuid, ${userId}, 'pending_review')
    RETURNING id::text
  `;

  // 2. Create the first revision
  const [revision] = await sql<{ id: string }[]>`
    INSERT INTO contract_revisions (
      contract_id, proposed_by, revision_number,
      title, scope, deliverables, price, currency,
      deadline, payment_terms, additional_terms, change_summary
    )
    VALUES (
      ${contract.id}::uuid, ${userId}, 1,
      ${title.trim()}, ${scope.trim()}, ${deliverables.trim()},
      ${price}, ${currency.trim()}, ${deadline},
      ${paymentTerms.trim()},
      ${additionalTerms?.trim() || null},
      ${'Initial contract'}
    )
    RETURNING id::text
  `;

  // 3. Update contract with current_revision_id
  await sql`
    UPDATE contracts
    SET current_revision_id = ${revision.id}::uuid, updated_at = now()
    WHERE id = ${contract.id}::uuid
  `;

  // 4. Insert a contract message into messages table
  const [msg] = await sql<{ id: string }[]>`
    INSERT INTO messages (conversation_id, sender_id, body, message_type)
    VALUES (${conversationId}::uuid, ${userId}, NULL, 'contract')
    RETURNING id::text
  `;

  // 5. Update contract with message_id
  await sql`
    UPDATE contracts
    SET message_id = ${msg.id}::uuid, updated_at = now()
    WHERE id = ${contract.id}::uuid
  `;

  // 6. Fetch and return the full contract
  const fullContract = await fetchFullContract(contract.id);
  if (!fullContract) {
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }

  // 7. Broadcast over WS
  broadcastContract(conversationId, 'new_contract', fullContract).catch(() => undefined);

  return NextResponse.json({ contract: fullContract }, { status: 201 });
}
