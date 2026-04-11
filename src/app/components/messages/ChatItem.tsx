'use client';
import type { Conversation } from './types';
import { initials, formatChatTime } from './utils';

type Props = {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
};

export default function ChatItem({ conversation, isActive, onClick }: Props) {
  const { other_name, other_avatar, last_message_body, last_message_sent_at, unread_count } =
    conversation;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer transition-colors select-none
        ${isActive ? 'bg-[#1E3A5F]' : 'hover:bg-[#F9FAFB]'}`}
      style={{ minHeight: '64px' }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-semibold text-sm overflow-hidden">
          {other_avatar ? (
            <img src={other_avatar} alt={other_name} className="w-full h-full object-cover" />
          ) : (
            initials(other_name)
          )}
        </div>
        {unread_count > 0 && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5 pr-1">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[13px] font-semibold truncate leading-none ${
              isActive ? 'text-white' : 'text-[#111827]'
            }`}
          >
            {other_name}
          </span>
          <span
            className={`text-[11px] shrink-0 ${isActive ? 'text-[#93C5FD]' : 'text-[#6B7280]'}`}
          >
            {formatChatTime(last_message_sent_at)}
          </span>
        </div>
        <span
          className={`text-[12px] truncate ${isActive ? 'text-[#BFDBFE]' : 'text-[#6B7280]'}`}
        >
          {last_message_body ?? 'No messages yet'}
        </span>
      </div>

      {/* Unread badge */}
      {unread_count > 0 && !isActive && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] rounded-full bg-[#1E3A5F] text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
          {unread_count > 99 ? '99+' : unread_count}
        </span>
      )}
    </div>
  );
}
