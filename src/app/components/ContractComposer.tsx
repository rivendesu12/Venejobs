'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import { toast } from 'react-toastify';
import type { ContractData } from '@/app/hooks/useMessages';

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  conversationId: string;
  onCreated: (contract: ContractData) => void;
  onClose: () => void;
}

// ─── Auto-resize textarea ───────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContractComposer({ conversationId, onCreated, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [deadline, setDeadline] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  function isValid(): boolean {
    return (
      !!title.trim() &&
      !!scope.trim() &&
      !!deliverables.trim() &&
      !!price &&
      Number(price) > 0 &&
      !!deadline &&
      deadline > today &&
      !!paymentTerms.trim()
    );
  }

  async function handleSubmit() {
    if (!isValid()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          title: title.trim(),
          scope: scope.trim(),
          deliverables: deliverables.trim(),
          price: Number(price),
          currency,
          deadline,
          paymentTerms: paymentTerms.trim(),
          additionalTerms: additionalTerms.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to send contract');
        return;
      }
      const data = await res.json() as { contract: ContractData };
      onCreated(data.contract);
      onClose();
    } catch {
      toast.error('Failed to send contract');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]';
  const textareaClass = `${inputClass} resize-none`;
  const labelClass = 'block text-[12px] font-semibold text-[#374151] mb-1';

  return (
    <div
      className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center p-4"
      style={{ minHeight: '100%' }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#1E3A5F]" />
              <h2 className="text-[16px] font-bold text-[#111827]">New Contract</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                className={inputClass}
                placeholder="e.g. Website redesign project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Scope of Work *</label>
              <AutoTextarea
                className={textareaClass}
                placeholder="Describe the scope of the project"
                value={scope}
                onChange={setScope}
              />
            </div>

            <div>
              <label className={labelClass}>Deliverables *</label>
              <AutoTextarea
                className={textareaClass}
                placeholder="List each deliverable on a new line"
                value={deliverables}
                onChange={setDeliverables}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Price *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="w-24">
                <label className={labelClass}>Currency</label>
                <select
                  className={inputClass}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Deadline *</label>
              <input
                type="date"
                className={inputClass}
                min={today}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Payment Terms *</label>
              <AutoTextarea
                className={textareaClass}
                placeholder="e.g. 50% upfront, 50% on delivery"
                value={paymentTerms}
                onChange={setPaymentTerms}
              />
            </div>

            <div>
              <label className={labelClass}>Additional Terms</label>
              <AutoTextarea
                className={textareaClass}
                placeholder="Any additional terms or conditions (optional)"
                value={additionalTerms}
                onChange={setAdditionalTerms}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-5 pt-4 border-t border-[#E5E7EB]">
            <button
              onClick={handleSubmit}
              disabled={!isValid() || submitting}
              className="flex-1 px-4 py-2.5 bg-[#1E3A5F] text-white text-[13px] font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Sending...' : 'Send contract'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-[#D1D5DB] text-[#374151] text-[13px] rounded-lg hover:bg-[#F3F4F6] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
