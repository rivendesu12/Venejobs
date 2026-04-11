'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import userApiStore from '@/app/store/userStore';

interface InboxRow {
  conversation_id: string;
  proposal_id: number;
  proposal_status: string;
  offered_price: string;
  job_title: string;
  other_name: string;
  other_avatar: string | null;
  last_message_body: string | null;
  last_message_sent_at: string | null;
  unread_count: number;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function InboxPage() {
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = userApiStore() as { user: { id: number } | null };

  async function fetchInbox(): Promise<void> {
    try {
      const res = await fetch('/api/inbox');
      if (res.ok) {
        const data = await res.json() as { inbox: InboxRow[] };
        setInbox(data.inbox ?? []);
      }
    } catch {
      // silent — will retry on next interval
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 15_000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ color: 'var(--color-paragraph)', fontSize: '14px' }}>
          Please sign in to view your inbox.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px 24px', maxWidth: '720px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--color-heading)',
          marginBottom: '24px',
        }}
      >
        Inbox
      </h1>

      {loading && (
        <p style={{ color: 'var(--color-paragraph)', fontSize: '14px' }}>Loading…</p>
      )}

      {!loading && inbox.length === 0 && (
        <p style={{ color: 'var(--color-paragraph)', fontSize: '14px' }}>
          No conversations yet.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {inbox.map((row) => (
          <Link
            key={row.conversation_id}
            href={`/conversations/${row.conversation_id}`}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '10px',
                background: row.unread_count > 0 ? 'var(--color-lightborder)' : 'transparent',
                transition: 'background 0.15s',
                cursor: 'pointer',
              }}
            >
              {/* Avatar initials */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials(row.other_name ?? '?')}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: row.unread_count > 0 ? 700 : 500,
                      fontSize: '14px',
                      color: 'var(--color-heading)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.other_name}
                  </span>
                  {row.last_message_sent_at && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-paragraph)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {timeAgo(row.last_message_sent_at)}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-paragraph)',
                    margin: '2px 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.job_title}
                </p>

                {(row.last_message_body !== undefined) && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-paragraph)',
                      margin: '2px 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontStyle: row.last_message_body === null ? 'italic' : 'normal',
                    }}
                  >
                    {row.last_message_body ?? 'Message deleted'}
                  </p>
                )}
              </div>

              {/* Unread badge */}
              {row.unread_count > 0 && (
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {row.unread_count > 99 ? '99+' : row.unread_count}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
