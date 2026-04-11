'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ClientLayout from '@/app/layout/ClientLayout';

interface Proposal {
  id: number;
  cover_letter: string;
  offered_price: string;
  estimated_days: number;
  status: string;
  created_at: string;
  freelancer_name: string;
  avatar_url: string | null;
  conversation_id: string | null;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function statusColor(status: string): string {
  if (status === 'accepted') return 'var(--color-secondary)';
  if (status === 'rejected') return '#c0392b';
  return 'var(--color-paragraph)';
}

export default function ProposalsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const res = await fetch(`/api/jobs/${jobId}/proposals`);
        if (res.status === 403) {
          setError('You do not have permission to view these proposals.');
          return;
        }
        if (!res.ok) {
          setError('Failed to load proposals.');
          return;
        }
        const data = await res.json() as { proposals: Proposal[] };
        setProposals(data.proposals ?? []);
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  return (
    <ClientLayout>
      <div
        style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '0 24px',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-heading)',
            marginBottom: '24px',
          }}
        >
          Proposals
        </h1>

        {loading && (
          <p style={{ color: 'var(--color-paragraph)', fontSize: '14px' }}>
            Loading proposals…
          </p>
        )}

        {error && (
          <p style={{ color: '#c0392b', fontSize: '14px' }}>{error}</p>
        )}

        {!loading && !error && proposals.length === 0 && (
          <p style={{ color: 'var(--color-paragraph)', fontSize: '14px' }}>
            No proposals yet.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {proposals.map((p) => (
            <div
              key={p.id}
              style={{
                border: '1px solid var(--color-lightborder)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {initials(p.freelancer_name ?? '?')}
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: '15px',
                      color: 'var(--color-heading)',
                      margin: 0,
                    }}
                  >
                    {p.freelancer_name}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: statusColor(p.status),
                    textTransform: 'capitalize',
                    background: 'var(--color-lightborder)',
                    padding: '3px 10px',
                    borderRadius: '20px',
                  }}
                >
                  {p.status}
                </span>
              </div>

              {/* Cover letter excerpt */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-paragraph)',
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                {p.cover_letter.slice(0, 120)}
                {p.cover_letter.length > 120 ? '…' : ''}
              </p>

              {/* Price + days */}
              <div style={{ display: 'flex', gap: '24px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-heading)', fontWeight: 600 }}>
                  ${parseFloat(p.offered_price).toLocaleString()}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-paragraph)' }}>
                  {p.estimated_days} day{p.estimated_days !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Chat link */}
              {p.conversation_id && (
                <Link
                  href={`/conversations/${p.conversation_id}`}
                  style={{
                    display: 'inline-block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    alignSelf: 'flex-start',
                  }}
                >
                  Open conversation →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
}
