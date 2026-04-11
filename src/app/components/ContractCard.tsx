'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import type { ContractData, ContractRevision } from '@/app/hooks/useMessages';

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  contract: ContractData;
  currentUserId: number;
  currentUserName: string;
  onContractUpdate: (contract: ContractData) => void;
}

// ─── Status badge ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Draft' },
  pending_review: { bg: '#FEF3C7', text: '#92400E', label: 'Pending Review' },
  revision_requested: { bg: '#DBEAFE', text: '#1E40AF', label: 'Revision Requested' },
  accepted: { bg: '#D1FAE5', text: '#065F46', label: 'Signed' },
  declined: { bg: '#FEE2E2', text: '#991B1B', label: 'Declined' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatPrice(price: string, currency: string): string {
  return `${currency} ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Diff view for single field ─────────────────────────────────────────────

function FieldDiff({
  label,
  oldValue,
  newValue,
}: {
  label: string;
  oldValue: string;
  newValue: string;
}) {
  if (oldValue === newValue) {
    return (
      <div className="mb-3">
        <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-[13px] text-[#111827] whitespace-pre-wrap">{newValue}</p>
      </div>
    );
  }
  return (
    <div className="mb-3 border-l-2 border-amber-400 pl-2.5">
      <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-[13px] text-red-600 line-through whitespace-pre-wrap">{oldValue}</p>
      <p className="text-[13px] text-green-700 whitespace-pre-wrap">{newValue}</p>
    </div>
  );
}

// ─── Read-only field ────────────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-[13px] text-[#111827] whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// ─── Inline edit form ───────────────────────────────────────────────────────

interface EditFormState {
  title: string;
  scope: string;
  deliverables: string;
  price: string;
  currency: string;
  deadline: string;
  paymentTerms: string;
  additionalTerms: string;
  changeSummary: string;
}

function InlineEditForm({
  revision,
  contractId,
  onSuccess,
  onCancel,
}: {
  revision: ContractRevision;
  contractId: string;
  onSuccess: (c: ContractData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EditFormState>({
    title: revision.title,
    scope: revision.scope,
    deliverables: revision.deliverables,
    price: revision.price,
    currency: revision.currency,
    deadline: revision.deadline,
    paymentTerms: revision.paymentTerms,
    additionalTerms: revision.additionalTerms ?? '',
    changeSummary: '',
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof EditFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function isChanged(field: keyof EditFormState): boolean {
    const original = field === 'additionalTerms' ? (revision.additionalTerms ?? '') : (revision as unknown as Record<string, string>)[field] ?? '';
    return form[field] !== original;
  }

  async function handleSubmit() {
    if (!form.changeSummary.trim()) {
      toast.error('Please describe what you changed');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          scope: form.scope,
          deliverables: form.deliverables,
          price: Number(form.price),
          currency: form.currency,
          deadline: form.deadline,
          paymentTerms: form.paymentTerms,
          additionalTerms: form.additionalTerms || undefined,
          changeSummary: form.changeSummary,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to send revision');
        return;
      }
      const data = await res.json() as { contract: ContractData };
      onSuccess(data.contract);
    } catch {
      toast.error('Failed to send revision');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-2.5 py-1.5 text-[13px] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]';
  const textareaClass = `${inputClass} resize-none`;

  return (
    <div className="mt-3 space-y-3">
      <div className={isChanged('title') ? 'border-l-2 border-amber-400 pl-2.5' : ''}>
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
          Title
        </label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />
      </div>

      <div className={isChanged('scope') ? 'border-l-2 border-amber-400 pl-2.5' : ''}>
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
          Scope
        </label>
        <AutoTextarea className={textareaClass} value={form.scope} onChange={(v) => update('scope', v)} />
      </div>

      <div className={isChanged('deliverables') ? 'border-l-2 border-amber-400 pl-2.5' : ''}>
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
          Deliverables
        </label>
        <AutoTextarea
          className={textareaClass}
          value={form.deliverables}
          onChange={(v) => update('deliverables', v)}
        />
      </div>

      <div className="flex gap-2">
        <div className={`flex-1 ${isChanged('price') ? 'border-l-2 border-amber-400 pl-2.5' : ''}`}>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
            Price
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={inputClass}
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
          />
        </div>
        <div className={`w-24 ${isChanged('currency') ? 'border-l-2 border-amber-400 pl-2.5' : ''}`}>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
            Currency
          </label>
          <select
            className={inputClass}
            value={form.currency}
            onChange={(e) => update('currency', e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="VES">VES</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div className={isChanged('deadline') ? 'border-l-2 border-amber-400 pl-2.5' : ''}>
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
          Deadline
        </label>
        <input
          type="date"
          className={inputClass}
          value={form.deadline}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => update('deadline', e.target.value)}
        />
      </div>

      <div className={isChanged('paymentTerms') ? 'border-l-2 border-amber-400 pl-2.5' : ''}>
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
          Payment Terms
        </label>
        <AutoTextarea
          className={textareaClass}
          value={form.paymentTerms}
          onChange={(v) => update('paymentTerms', v)}
        />
      </div>

      <div className={isChanged('additionalTerms') ? 'border-l-2 border-amber-400 pl-2.5' : ''}>
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
          Additional Terms (optional)
        </label>
        <AutoTextarea
          className={textareaClass}
          value={form.additionalTerms}
          onChange={(v) => update('additionalTerms', v)}
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
          What did you change? *
        </label>
        <input
          className={inputClass}
          placeholder="Describe what you changed"
          value={form.changeSummary}
          onChange={(e) => update('changeSummary', e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 px-3 py-2 bg-[#1E3A5F] text-white text-[13px] font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? 'Sending...' : 'Send revision'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 border border-[#D1D5DB] text-[#374151] text-[13px] rounded-lg hover:bg-[#F3F4F6] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Auto-resizing textarea ─────────────────────────────────────────────────

function AutoTextarea({
  className,
  value,
  onChange,
  placeholder,
}: {
  className?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={2}
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ─── Signature modal ────────────────────────────────────────────────────────

function SignatureModal({
  contract,
  currentUserName,
  onSuccess,
  onClose,
}: {
  contract: ContractData;
  currentUserName: string;
  onSuccess: (c: ContractData) => void;
  onClose: () => void;
}) {
  const [typedName, setTypedName] = useState('');
  const [signing, setSigning] = useState(false);
  const rev = contract.currentRevision;

  const nameMatches =
    typedName.trim().toLowerCase() === currentUserName.trim().toLowerCase();

  async function handleSign() {
    if (!nameMatches) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typedName: typedName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to sign');
        return;
      }
      const data = await res.json() as { contract: ContractData };
      onSuccess(data.contract);
      onClose();
    } catch {
      toast.error('Failed to sign contract');
    } finally {
      setSigning(false);
    }
  }

  if (!rev) return null;

  return (
    <div
      className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center p-4"
      style={{ minHeight: '100%' }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-[#111827]">Sign Contract</h3>
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#6B7280]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contract summary */}
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3 mb-4 space-y-2 text-[12px]">
            <p><strong>Title:</strong> {rev.title}</p>
            <p><strong>Scope:</strong> {rev.scope}</p>
            <p><strong>Deliverables:</strong> {rev.deliverables}</p>
            <p><strong>Price:</strong> {formatPrice(rev.price, rev.currency)}</p>
            <p><strong>Deadline:</strong> {formatDate(rev.deadline)}</p>
            <p><strong>Payment Terms:</strong> {rev.paymentTerms}</p>
            {rev.additionalTerms && (
              <p><strong>Additional Terms:</strong> {rev.additionalTerms}</p>
            )}
          </div>

          <p className="text-[12px] text-[#6B7280] mb-3">
            By signing, you agree to the terms above.
          </p>

          <div className="mb-4">
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
              Type your full name to sign
            </label>
            <input
              className="w-full px-2.5 py-2 text-[13px] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] mt-1"
              placeholder={currentUserName}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
            />
            {typedName.trim() && !nameMatches && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={11} />
                Name must match your profile name
              </p>
            )}
          </div>

          <button
            onClick={handleSign}
            disabled={!nameMatches || signing}
            className="w-full px-3 py-2.5 bg-green-600 text-white text-[13px] font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {signing ? 'Signing...' : 'Sign & Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Revision history drawer ────────────────────────────────────────────────

function RevisionHistory({ revisions }: { revisions: ContractRevision[] }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);

  if (revisions.length <= 1) return null;

  return (
    <div className="mt-3 border-t border-[#E5E7EB] pt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[12px] text-[#1E3A5F] hover:underline font-medium"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        View history ({revisions.length} versions)
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {revisions.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2.5 text-[12px]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[#111827]">
                  Version {rev.revisionNumber}
                </span>
                <span className="text-[#9CA3AF]">{formatDate(rev.createdAt)}</span>
              </div>
              <p className="text-[#6B7280] mb-1">
                Proposed by {rev.proposedByName}
              </p>
              <p className="text-[#374151]">
                <strong>Price:</strong> {formatPrice(rev.price, rev.currency)}
                {' · '}
                <strong>Deadline:</strong> {formatDate(rev.deadline)}
              </p>
              {rev.changeSummary && (
                <p className="text-[#6B7280] italic mt-0.5">{rev.changeSummary}</p>
              )}
              <button
                onClick={() =>
                  setExpandedRevision(expandedRevision === rev.id ? null : rev.id)
                }
                className="text-[11px] text-[#1E3A5F] hover:underline mt-1"
              >
                {expandedRevision === rev.id ? 'Hide details' : 'View full version'}
              </button>
              {expandedRevision === rev.id && (
                <div className="mt-2 space-y-1 text-[#374151] border-t border-[#E5E7EB] pt-2">
                  <p><strong>Title:</strong> {rev.title}</p>
                  <p><strong>Scope:</strong> {rev.scope}</p>
                  <p><strong>Deliverables:</strong> {rev.deliverables}</p>
                  <p><strong>Payment Terms:</strong> {rev.paymentTerms}</p>
                  {rev.additionalTerms && (
                    <p><strong>Additional Terms:</strong> {rev.additionalTerms}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ContractCard ──────────────────────────────────────────────────────

export default function ContractCard({
  contract,
  currentUserId,
  currentUserName,
  onContractUpdate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const rev = contract.currentRevision;
  const status = contract.status;
  const isCreator = contract.createdBy === currentUserId;
  const lastProposedByMe = rev?.proposedBy === currentUserId;
  const isTerminal = status === 'accepted' || status === 'declined' || status === 'cancelled';

  // Find the previous revision for diff view
  const prevRevision =
    contract.revisionHistory.length >= 2
      ? contract.revisionHistory.find(
          (r) => r.revisionNumber === (rev?.revisionNumber ?? 1) - 1,
        )
      : null;

  // Should we show diff view? When status is revision_requested and the current user
  // is NOT the one who proposed the revision (they are seeing the other's changes)
  const showDiff = status === 'revision_requested' && !lastProposedByMe && prevRevision && rev;

  const callAction = useCallback(
    async (action: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/contracts/${contract.id}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          const err = await res.json() as { error?: string };
          toast.error(err.error ?? `Failed to ${action}`);
          return;
        }
        const data = await res.json() as { contract: ContractData };
        onContractUpdate(data.contract);
      } catch {
        toast.error(`Failed to ${action}`);
      } finally {
        setLoading(false);
      }
    },
    [contract.id, onContractUpdate],
  );

  if (!rev) return null;

  // ── Accepted state ────────────────────────────────────────────────────────
  if (status === 'accepted') {
    return (
      <div className="my-2 mx-auto w-full max-w-[420px]">
        <div className="border border-green-300 bg-green-50 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-green-700" />
            <span className="text-[14px] font-bold text-[#111827] flex-1">{rev.title}</span>
            <StatusBadge status={status} />
          </div>

          <ReadOnlyField label="Scope" value={rev.scope} />
          <ReadOnlyField label="Deliverables" value={rev.deliverables} />
          <ReadOnlyField label="Price" value={formatPrice(rev.price, rev.currency)} />
          <ReadOnlyField label="Deadline" value={formatDate(rev.deadline)} />
          <ReadOnlyField label="Payment Terms" value={rev.paymentTerms} />
          {rev.additionalTerms && (
            <ReadOnlyField label="Additional Terms" value={rev.additionalTerms} />
          )}

          {/* Signatures */}
          <div className="mt-3 border-t border-green-200 pt-3">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
              Signatures
            </p>
            {contract.signatures.map((sig) => (
              <div key={sig.userId} className="flex items-center gap-2 mb-1.5 text-[12px]">
                <Check size={13} className="text-green-600 shrink-0" />
                <span className="text-[#111827] font-medium">{sig.typedName}</span>
                <span className="text-[#9CA3AF]">
                  Signed {formatDateTime(sig.signedAt)}
                </span>
              </div>
            ))}
          </div>

          <RevisionHistory revisions={contract.revisionHistory} />
        </div>
      </div>
    );
  }

  // ── Declined / Cancelled state ────────────────────────────────────────────
  if (status === 'declined' || status === 'cancelled') {
    return (
      <div className="my-2 mx-auto w-full max-w-[420px]">
        <div className="border border-[#E5E7EB] bg-[#F9FAFB] rounded-xl p-4 shadow-sm opacity-70">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[#9CA3AF]" />
            <span className="text-[14px] font-bold text-[#6B7280] flex-1">{rev.title}</span>
            <StatusBadge status={status} />
          </div>

          <div className="text-[#9CA3AF]">
            <ReadOnlyField label="Scope" value={rev.scope} />
            <ReadOnlyField label="Price" value={formatPrice(rev.price, rev.currency)} />
            <ReadOnlyField label="Deadline" value={formatDate(rev.deadline)} />
          </div>

          <RevisionHistory revisions={contract.revisionHistory} />
        </div>
      </div>
    );
  }

  // ── Active states (pending_review, revision_requested) ────────────────────
  return (
    <div className="my-2 mx-auto w-full max-w-[420px] relative">
      <div className="border border-[#D1D5DB] bg-white rounded-xl p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-[#1E3A5F]" />
          <span className="text-[14px] font-bold text-[#111827] flex-1">{rev.title}</span>
          <StatusBadge status={status} />
        </div>

        {/* Version indicator */}
        <p className="text-[11px] text-[#9CA3AF] mb-3">
          Version {rev.revisionNumber} · Proposed by {rev.proposedByName}
        </p>

        {/* Editing mode */}
        {editing ? (
          <InlineEditForm
            revision={rev}
            contractId={contract.id}
            onSuccess={(c) => {
              onContractUpdate(c);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : showDiff && prevRevision ? (
          /* Diff view */
          <>
            <FieldDiff label="Scope" oldValue={prevRevision.scope} newValue={rev.scope} />
            <FieldDiff
              label="Deliverables"
              oldValue={prevRevision.deliverables}
              newValue={rev.deliverables}
            />
            <FieldDiff
              label="Price"
              oldValue={formatPrice(prevRevision.price, prevRevision.currency)}
              newValue={formatPrice(rev.price, rev.currency)}
            />
            <FieldDiff
              label="Deadline"
              oldValue={formatDate(prevRevision.deadline)}
              newValue={formatDate(rev.deadline)}
            />
            <FieldDiff
              label="Payment Terms"
              oldValue={prevRevision.paymentTerms}
              newValue={rev.paymentTerms}
            />
            <FieldDiff
              label="Additional Terms"
              oldValue={prevRevision.additionalTerms ?? ''}
              newValue={rev.additionalTerms ?? ''}
            />
            {rev.changeSummary && (
              <p className="text-[12px] text-[#6B7280] italic mt-1 mb-2">
                Change: {rev.changeSummary}
              </p>
            )}
          </>
        ) : (
          /* Read-only view */
          <>
            <ReadOnlyField label="Scope" value={rev.scope} />
            <ReadOnlyField label="Deliverables" value={rev.deliverables} />
            <ReadOnlyField label="Price" value={formatPrice(rev.price, rev.currency)} />
            <ReadOnlyField label="Deadline" value={formatDate(rev.deadline)} />
            <ReadOnlyField label="Payment Terms" value={rev.paymentTerms} />
            {rev.additionalTerms && (
              <ReadOnlyField label="Additional Terms" value={rev.additionalTerms} />
            )}
          </>
        )}

        {/* Action buttons */}
        {!editing && !isTerminal && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#E5E7EB]">
            {/* Case: I did NOT send the last revision, status is pending_review */}
            {!lastProposedByMe && status === 'pending_review' && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-[#F3F4F6] transition-colors"
                >
                  <Edit3 size={12} />
                  Propose edits
                </button>
                <button
                  onClick={() => setShowSignModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={12} />
                  Sign & Accept
                </button>
                <button
                  onClick={() => callAction('decline')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <X size={12} />
                  Decline
                </button>
              </>
            )}

            {/* Case: I DID send the last revision — awaiting */}
            {lastProposedByMe && (status === 'pending_review' || status === 'revision_requested') && (
              <p className="text-[12px] text-[#9CA3AF] italic">
                Awaiting response from the other party
              </p>
            )}

            {/* Case: revision_requested, I did NOT send the revision */}
            {!lastProposedByMe && status === 'revision_requested' && (
              <>
                <button
                  onClick={() => callAction('approve-revision')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-[#1E3A5F] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Check size={12} />
                  Approve revision
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-[#F3F4F6] transition-colors"
                >
                  <Edit3 size={12} />
                  Propose edits
                </button>
                <button
                  onClick={() => callAction('decline')}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <X size={12} />
                  Decline
                </button>
              </>
            )}

            {/* Cancel button — only for the creator */}
            {isCreator && lastProposedByMe && (
              <button
                onClick={() => callAction('cancel')}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-[#D1D5DB] text-[#6B7280] rounded-lg hover:bg-[#F3F4F6] disabled:opacity-50 transition-colors"
              >
                Cancel contract
              </button>
            )}
          </div>
        )}

        {/* Existing signatures */}
        {contract.signatures.length > 0 && (
          <div className="mt-3 pt-2 border-t border-[#E5E7EB]">
            {contract.signatures.map((sig) => (
              <div key={sig.userId} className="flex items-center gap-2 mb-1 text-[12px]">
                <Check size={13} className="text-green-600 shrink-0" />
                <span className="text-[#111827] font-medium">{sig.typedName}</span>
                <span className="text-[#9CA3AF]">
                  Signed {formatDateTime(sig.signedAt)}
                </span>
              </div>
            ))}
          </div>
        )}

        <RevisionHistory revisions={contract.revisionHistory} />
      </div>

      {/* Signature modal */}
      {showSignModal && (
        <SignatureModal
          contract={contract}
          currentUserName={currentUserName}
          onSuccess={onContractUpdate}
          onClose={() => setShowSignModal(false)}
        />
      )}
    </div>
  );
}
