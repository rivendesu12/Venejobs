'use client';
import { useState, type FormEvent } from 'react';
import { X, FileText } from 'lucide-react';

type Props = {
  defaultTitle: string;
  defaultPrice: number | null;
  onSend: (details: ContractDetails) => Promise<void>;
  onClose: () => void;
};

export type ContractDetails = {
  title: string;
  description: string;
  amount: string;
  deadline: string;
};

export default function SendContractModal({ defaultTitle, defaultPrice, onSend, onClose }: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(defaultPrice != null ? String(defaultPrice) : '');
  const [deadline, setDeadline] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount.trim() || !deadline) return;
    setIsSending(true);
    try {
      await onSend({ title: title.trim(), description: description.trim(), amount: amount.trim(), deadline });
      onClose();
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#1E3A5F]" />
              <span className="text-[15px] font-semibold text-[#111827]">Send Contract</span>
            </div>
            <button onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#374151]">Project title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Website redesign"
                className="h-9 px-3 border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] outline-none focus:border-[#1E3A5F] transition-colors"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#374151]">
                Deliverables <span className="font-normal text-[#9CA3AF]">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what you'll deliver..."
                className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] resize-none outline-none focus:border-[#1E3A5F] transition-colors"
              />
            </div>

            {/* Amount + Deadline row */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[12px] font-semibold text-[#374151]">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6B7280]">$</span>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full h-9 pl-6 pr-3 border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] outline-none focus:border-[#1E3A5F] transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[12px] font-semibold text-[#374151]">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="h-9 px-3 border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] outline-none focus:border-[#1E3A5F] transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-9 rounded-lg border border-[#E5E7EB] text-[13px] font-semibold text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !title.trim() || !amount.trim() || !deadline}
                className="flex-1 h-9 rounded-lg bg-[#1E3A5F] text-[13px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSending ? 'Sending…' : 'Send Contract'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
