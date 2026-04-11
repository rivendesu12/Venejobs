import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local so DATABASE_URL is available when running via tsx
config({ path: resolve(process.cwd(), '.env.local') });

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Add it to .env.local or export it before running.');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function migrate(): Promise<void> {
  // 1. proposals
  console.log('→ Creating proposals table...');
  await sql`
    CREATE TABLE IF NOT EXISTS proposals (
      id             SERIAL PRIMARY KEY,
      job_id         INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      freelancer_id  INTEGER REFERENCES users(id),
      cover_letter   TEXT NOT NULL,
      offered_price  NUMERIC(10,2) NOT NULL,
      estimated_days INT NOT NULL,
      status         TEXT DEFAULT 'pending',
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(job_id, freelancer_id)
    )
  `;
  console.log('✓ proposals ready');

  // 2. conversations
  console.log('→ Creating conversations table...');
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      proposal_id  INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ conversations ready');

  // 3. messages
  console.log('→ Creating messages table...');
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id  UUID REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id        INTEGER REFERENCES users(id),
      body             TEXT NOT NULL,
      read_at          TIMESTAMPTZ,
      sent_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ messages ready');

  // 4. indexes
  console.log('→ Creating indexes...');
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_conv_sent     ON messages(conversation_id, sent_at ASC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_proposals_job_id       ON proposals(job_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_proposals_freelancer_id ON proposals(freelancer_id)`;
  console.log('✓ indexes ready');

  // 5. trigger function
  console.log('→ Creating notify_new_message function...');
  await sql`
    CREATE OR REPLACE FUNCTION notify_new_message()
    RETURNS trigger AS $$
    BEGIN
      PERFORM pg_notify(
        'new_message',
        json_build_object(
          'id',              NEW.id,
          'conversation_id', NEW.conversation_id,
          'sender_id',       NEW.sender_id,
          'body',            NEW.body,
          'sent_at',         NEW.sent_at
        )::text
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;
  console.log('✓ notify_new_message function ready');

  // 6. trigger
  console.log('→ Setting up on_message_insert trigger...');
  await sql`DROP TRIGGER IF EXISTS on_message_insert ON messages`;
  await sql`
    CREATE TRIGGER on_message_insert
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION notify_new_message()
  `;
  console.log('✓ on_message_insert trigger ready');

  console.log('\nMigration complete.');
  await sql.end();
  process.exit(0);
}

migrate().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
