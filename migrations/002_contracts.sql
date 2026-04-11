-- Migration: In-chat contract system
-- Adds contracts, contract_revisions, contract_signatures tables
-- and message_type column to messages.

-- ─── Message type column ─────────────────────────────────────────────────────

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';

-- ─── Contract status enum ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM (
    'draft',
    'pending_review',
    'revision_requested',
    'accepted',
    'declined',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Contracts ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contracts (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid            NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_by          integer         NOT NULL,
  status              contract_status NOT NULL DEFAULT 'draft',
  current_revision_id uuid,
  message_id          uuid            REFERENCES messages(id) ON DELETE SET NULL,
  created_at          timestamptz     NOT NULL DEFAULT now(),
  updated_at          timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_conversation
  ON contracts(conversation_id);

-- ─── Contract revisions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contract_revisions (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     uuid          NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  proposed_by     integer       NOT NULL,
  revision_number integer       NOT NULL DEFAULT 1,
  title           text          NOT NULL,
  scope           text          NOT NULL,
  deliverables    text          NOT NULL,
  price           numeric(12,2) NOT NULL,
  currency        text          NOT NULL DEFAULT 'USD',
  deadline        date          NOT NULL,
  payment_terms   text          NOT NULL,
  additional_terms text,
  change_summary  text,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_revisions_contract
  ON contract_revisions(contract_id);

-- ─── Contract signatures ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contract_signatures (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     integer     NOT NULL,
  typed_name  text        NOT NULL,
  signed_at   timestamptz NOT NULL DEFAULT now(),
  ip_address  text,
  user_agent  text,
  UNIQUE (contract_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract
  ON contract_signatures(contract_id);

-- ─── Back-reference constraint ───────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE contracts
    ADD CONSTRAINT fk_current_revision
    FOREIGN KEY (current_revision_id)
    REFERENCES contract_revisions(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
