'use client';
import { Search, SlidersHorizontal, MoreHorizontal } from 'lucide-react';
import type { Conversation } from './types';
import ChatItem from './ChatItem';
import { ChatListSkeleton } from './LoadingSkeleton';

type Props = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function ChatList({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  setSearchQuery,
  isLoading,
  error,
  onRetry,
}: Props) {
  const filtered = conversations.filter((c) =>
    c.other_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <span className="text-[15px] font-semibold text-[#111827]">Chats</span>
        <MoreHorizontal size={20} className="text-[#6B7280] cursor-pointer" />
      </div>

      {/* Search */}
      <div className="px-3 pb-3 shrink-0">
        <div className="relative flex items-center h-9 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
          <Search size={14} className="absolute left-3 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full h-full bg-transparent pl-8 pr-8 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
          />
          <SlidersHorizontal size={14} className="absolute right-3 text-[#6B7280] pointer-events-none" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <ChatListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-[13px] text-[#6B7280] text-center">Failed to load. Try again.</p>
            <button
              onClick={onRetry}
              className="text-[13px] text-[#1E3A5F] font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-[#6B7280] text-center py-10">No conversations found.</p>
        ) : (
          filtered.map((conv) => (
            <ChatItem
              key={conv.conversation_id}
              conversation={conv}
              isActive={selectedId === conv.conversation_id}
              onClick={() => onSelect(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
}
