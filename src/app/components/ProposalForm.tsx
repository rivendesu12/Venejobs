'use client';

import { useState, FormEvent } from 'react';

interface ProposalFormProps {
  jobId: string | number;
  onSuccess?: (proposalId: number) => void;
}

export default function ProposalForm({ jobId, onSuccess }: ProposalFormProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          coverLetter,
          offeredPrice: parseFloat(offeredPrice),
          estimatedDays: parseInt(estimatedDays, 10),
        }),
      });

      const data = await res.json() as { proposalId?: number; error?: string };

      if (res.status === 201) {
        setStatus('success');
        onSuccess?.(data.proposalId!);
        return;
      }

      if (res.status === 409) {
        setErrorMsg('You have already submitted a proposal for this job.');
      } else {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
      }
      setStatus('error');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          background: 'var(--color-lightborder)',
          color: 'var(--color-heading)',
          fontSize: '14px',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        Your proposal was submitted successfully!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-heading)',
          }}
        >
          Cover Letter
        </label>
        <textarea
          required
          rows={6}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Describe why you're the best fit for this job…"
          style={{
            border: '1px solid var(--color-lightborder)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: 'var(--color-heading)',
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-heading)',
            }}
          >
            Offered Price ($)
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={offeredPrice}
            onChange={(e) => setOfferedPrice(e.target.value)}
            placeholder="e.g. 250.00"
            style={{
              border: '1px solid var(--color-lightborder)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              color: 'var(--color-heading)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-heading)',
            }}
          >
            Estimated Days
          </label>
          <input
            type="number"
            required
            min="1"
            step="1"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            placeholder="e.g. 14"
            style={{
              border: '1px solid var(--color-lightborder)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              color: 'var(--color-heading)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {status === 'error' && (
        <p
          style={{
            fontSize: '13px',
            color: '#c0392b',
            background: '#fdf0ef',
            padding: '10px 12px',
            borderRadius: '6px',
          }}
        >
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          background: status === 'submitting' ? 'var(--color-paragraph)' : 'var(--color-secondary)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Proposal'}
      </button>
    </form>
  );
}
