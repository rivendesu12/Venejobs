'use client';
import type { Message } from './types';
import { initials, formatMessageTime } from './utils';

type Props = {
  message: Message;
  isOwn: boolean;
};

export default function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start gap-2.5`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-semibold overflow-hidden"
        style={{ background: isOwn ? '#1E3A5F' : '#6B7280' }}
      >
        {message.sender_avatar ? (
          <img
            src={message.sender_avatar}
            alt={message.sender_name ?? ''}
            className="w-full h-full object-cover"
          />
        ) : (
          initials(message.sender_name)
        )}
      </div>

      {/* Bubble + timestamp stacked */}
      <div className={`flex flex-col gap-1 max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className="px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words"
          style={{
            background: isOwn ? '#1E3A5F' : '#F3F4F6',
            color: isOwn ? '#fff' : '#111827',
            borderRadius: isOwn ? '12px 0 12px 12px' : '0 12px 12px 12px',
          }}
        >
          {message.body}
        </div>
        <span
          className={`text-[11px] text-[#9CA3AF] ${isOwn ? 'text-right' : ''}`}
          style={{ [isOwn ? 'marginRight' : 'marginLeft']: '0px' }}
        >
          {formatMessageTime(message.sent_at)}
        </span>
      </div>
    </div>
  );
}
