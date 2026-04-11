-- Migration: Advanced messaging system v2
-- Idempotent — safe to re-run.
--
-- The Neon DB already has `conversations` and `messages` from the earlier
-- SSE-based system (both with uuid ids, and conversations.proposal_id already
-- FK'd to proposals.id). This migration only adds what the WS-based system
-- needs on top of that: two new columns on `messages`, and three support
-- tables (attachments / read receipts / reactions).

-- ─── Messages: new columns ───────────────────────────────────────────────────

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL;

-- Indexes on the existing messages table (no-op if they already exist).
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id);

-- ─── Attachments ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS message_attachments (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid    NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url        text    NOT NULL,
  file_name  text    NOT NULL,
  file_type  text    NOT NULL,   -- 'image' | 'file'
  mime_type  text    NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message
  ON message_attachments(message_id);

-- ─── Read receipts (per message, per user) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS message_reads (
  message_id uuid    NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_message
  ON message_reads(message_id);

-- ─── Emoji reactions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS message_reactions (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid    NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      text    NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message
  ON message_reactions(message_id);

-- ─── Notes ───────────────────────────────────────────────────────────────────
-- The old SSE system's `on_message_insert` trigger (which calls
-- notify_new_message()) is left in place — harmless, since nothing LISTENs on
-- that channel in the new WS-based system. Drop it manually if desired:
--   DROP TRIGGER IF EXISTS on_message_insert ON messages;
--   DROP FUNCTION IF EXISTS notify_new_message();
