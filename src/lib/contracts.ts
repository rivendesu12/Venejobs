import { sql } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContractRevision {
  id: string;
  contractId: string;
  proposedBy: number;
  proposedByName: string;
  revisionNumber: number;
  title: string;
  scope: string;
  deliverables: string;
  price: string;
  currency: string;
  deadline: string;
  paymentTerms: string;
  additionalTerms: string | null;
  changeSummary: string | null;
  createdAt: string;
}

export interface ContractSignature {
  userId: number;
  typedName: string;
  signedAt: string;
}

export interface Contract {
  id: string;
  conversationId: string;
  createdBy: number;
  createdByName: string;
  status: string;
  messageId: string | null;
  currentRevision: ContractRevision | null;
  revisionHistory: ContractRevision[];
  signatures: ContractSignature[];
  createdAt: string;
  updatedAt: string;
}

// ─── Fetch full contract ────────────────────────────────────────────────────

export async function fetchFullContract(contractId: string): Promise<Contract | null> {
  // Base contract
  const contracts = await sql<{
    id: string;
    conversation_id: string;
    created_by: number;
    created_by_name: string;
    status: string;
    current_revision_id: string | null;
    message_id: string | null;
    created_at: string;
    updated_at: string;
  }[]>`
    SELECT
      c.id::text,
      c.conversation_id::text,
      c.created_by,
      u.name AS created_by_name,
      c.status::text,
      c.current_revision_id::text,
      c.message_id::text,
      c.created_at,
      c.updated_at
    FROM contracts c
    JOIN users u ON u.id = c.created_by
    WHERE c.id = ${contractId}::uuid
  `;

  if (contracts.length === 0) return null;
  const row = contracts[0];

  // All revisions (newest first)
  const revisions = await sql<{
    id: string;
    contract_id: string;
    proposed_by: number;
    proposed_by_name: string;
    revision_number: number;
    title: string;
    scope: string;
    deliverables: string;
    price: string;
    currency: string;
    deadline: string;
    payment_terms: string;
    additional_terms: string | null;
    change_summary: string | null;
    created_at: string;
  }[]>`
    SELECT
      cr.id::text,
      cr.contract_id::text,
      cr.proposed_by,
      u.name AS proposed_by_name,
      cr.revision_number,
      cr.title,
      cr.scope,
      cr.deliverables,
      cr.price::text,
      cr.currency,
      cr.deadline::text,
      cr.payment_terms,
      cr.additional_terms,
      cr.change_summary,
      cr.created_at
    FROM contract_revisions cr
    JOIN users u ON u.id = cr.proposed_by
    WHERE cr.contract_id = ${contractId}::uuid
    ORDER BY cr.revision_number DESC
  `;

  // Signatures
  const signatures = await sql<{
    user_id: number;
    typed_name: string;
    signed_at: string;
  }[]>`
    SELECT user_id, typed_name, signed_at
    FROM contract_signatures
    WHERE contract_id = ${contractId}::uuid
    ORDER BY signed_at ASC
  `;

  const currentRevision = revisions.find((r) => r.id === row.current_revision_id) ?? null;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    status: row.status,
    messageId: row.message_id,
    currentRevision: currentRevision ? shapeRevision(currentRevision) : null,
    revisionHistory: revisions.map(shapeRevision),
    signatures: signatures.map((s) => ({
      userId: s.user_id,
      typedName: s.typed_name,
      signedAt: s.signed_at,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeRevision(r: {
  id: string;
  contract_id: string;
  proposed_by: number;
  proposed_by_name: string;
  revision_number: number;
  title: string;
  scope: string;
  deliverables: string;
  price: string;
  currency: string;
  deadline: string;
  payment_terms: string;
  additional_terms: string | null;
  change_summary: string | null;
  created_at: string;
}): ContractRevision {
  return {
    id: r.id,
    contractId: r.contract_id,
    proposedBy: r.proposed_by,
    proposedByName: r.proposed_by_name,
    revisionNumber: r.revision_number,
    title: r.title,
    scope: r.scope,
    deliverables: r.deliverables,
    price: r.price,
    currency: r.currency,
    deadline: r.deadline,
    paymentTerms: r.payment_terms,
    additionalTerms: r.additional_terms,
    changeSummary: r.change_summary,
    createdAt: r.created_at,
  };
}

// ─── WS broadcast helper ────────────────────────────────────────────────────

export async function broadcastContract(
  conversationId: string,
  type: 'new_contract' | 'contract_updated',
  contract: Contract,
): Promise<void> {
  const internalUrl = process.env.WS_INTERNAL_URL ?? 'http://localhost:4001';
  await fetch(`${internalUrl}/internal/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.WS_INTERNAL_SECRET ?? '',
    },
    body: JSON.stringify({
      conversationId,
      payload: { type, conversationId, contract },
    }),
  });
}

// ─── Get both conversation participant IDs ──────────────────────────────────

export async function getConversationParticipants(
  conversationId: string,
): Promise<{ freelancerId: number; clientId: number } | null> {
  const rows = await sql<{ freelancer_id: number; client_id: number }[]>`
    SELECT p.freelancer_id, j.client_id
    FROM conversations c
    JOIN proposals p ON p.id = c.proposal_id
    JOIN jobs j ON j.id = p.job_id
    WHERE c.id = ${conversationId}::uuid
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { freelancerId: rows[0].freelancer_id, clientId: rows[0].client_id };
}
