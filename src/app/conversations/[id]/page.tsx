'use client';

import { use, useEffect, useState } from 'react';
import ChatPane from '@/app/components/ChatPane';
import userApiStore from '@/app/store/userStore';
import Link from 'next/link';

interface InboxRow {
  conversation_id: string;
  job_title: string;
  other_name: string;
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = userApiStore() as { user: { id: number; name: string } | null };
  const [meta, setMeta] = useState<InboxRow | null>(null);

  // Fetch inbox to get job title + other party name for this conversation
  useEffect(() => {
    async function loadMeta(): Promise<void> {
      try {
        const res = await fetch('/api/inbox');
        if (!res.ok) return;
        const data = await res.json() as { inbox: InboxRow[] };
        const found = (data.inbox ?? []).find((r) => r.conversation_id === id);
        if (found) setMeta(found);
      } catch {
        // non-critical — header will just be blank
      }
    }
    loadMeta();
  }, [id]);

  if (!user) {
    return (
      <main style={{ padding: '40px 24px' }}>
        <p style={{ color: 'var(--color-paragraph)', fontSize: '14px' }}>
          Please sign in to view this conversation.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-lightborder)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <Link
          href="/inbox"
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontSize: '20px',
            fontWeight: 300,
            lineHeight: 1,
          }}
          aria-label="Back to inbox"
        >
          ←
        </Link>

        <div>
          {meta ? (
            <>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--color-heading)',
                }}
              >
                {meta.other_name}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '12px',
                  color: 'var(--color-paragraph)',
                }}
              >
                {meta.job_title}
              </p>
            </>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--color-paragraph)',
              }}
            >
              Conversation
            </p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatPane conversationId={id} currentUserId={user.id} currentUserName={user.name} />
      </div>
    </main>
  );
}
