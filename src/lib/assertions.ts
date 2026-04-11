import { sql } from '@/lib/db';

/**
 * Returns true if userId is either the freelancer on the proposal
 * or the client on the job linked to this conversation.
 */
export async function assertConversationAccess(
  conversationId: string,
  userId: number,
): Promise<boolean> {
  const rows = await sql`
    SELECT c.id
    FROM conversations c
    JOIN proposals p ON p.id = c.proposal_id
    JOIN jobs j ON j.id = p.job_id
    WHERE c.id = ${conversationId}
      AND (p.freelancer_id = ${userId} OR j.client_id = ${userId})
    LIMIT 1
  `;
  return rows.length > 0;
}
