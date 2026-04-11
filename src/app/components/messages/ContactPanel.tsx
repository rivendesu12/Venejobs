'use client';
import { X, Star, Eye, Clock, CheckCircle2, Pencil, MessageSquare } from 'lucide-react';
import type { Conversation } from './types';
import { initials } from './utils';

type Props = {
  conversation: Conversation;
  onClose: () => void;
};

export default function ContactPanel({ conversation, onClose }: Props) {
  const { other_name, other_avatar, proposal_status } = conversation;

  const showMilestone =
    proposal_status === 'delivered' ||
    proposal_status === 'approved' ||
    proposal_status === 'accepted';
  const showEnded = proposal_status === 'approved';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="relative flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-semibold text-base shrink-0 overflow-hidden">
          {other_avatar ? (
            <img src={other_avatar} alt={other_name} className="w-full h-full object-cover" />
          ) : (
            initials(other_name)
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[15px] font-semibold text-[#111827] truncate">{other_name}</span>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
            <span className="text-[12px] text-[#6B7280]">—</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-[#6B7280] hover:text-[#111827]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#6B7280] shrink-0" />
          <span className="text-[12px] text-[#6B7280]">—</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-[#0D9488] shrink-0" />
          <span className="text-[12px] text-[#0D9488] font-medium">View Contract</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E5E7EB] my-3" />

      {/* Contract timeline */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 size={20} className="text-[#22C55E] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-[#111827]">Contract started</p>
            <p className="text-[12px] text-[#6B7280]">—</p>
          </div>
        </div>

        {showMilestone && (
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={20} className="text-[#22C55E] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Milestone 1 completed</p>
              <p className="text-[12px] text-[#6B7280]">Approved: —</p>
            </div>
          </div>
        )}

        {showEnded && (
          <>
            <div className="flex items-start gap-2.5">
              <Pencil size={20} className="text-[#9CA3AF] shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-[#111827]">Contract ended</p>
                <p className="text-[12px] text-[#6B7280]">—</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MessageSquare size={20} className="text-[#9CA3AF] shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-[#111827]">Feedback given</p>
                <p className="text-[12px] text-[#6B7280]">Total score —</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
