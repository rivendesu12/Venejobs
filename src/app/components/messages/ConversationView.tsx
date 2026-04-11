'use client';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { ChevronLeft, Maximize2, Paperclip, Smile, Send, Clock, Briefcase, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Conversation, Message } from './types';
import { initials, formatChatTime, formatMessageTime } from './utils';
import MessageBubble from './MessageBubble';
import { MessagesSkeleton } from './LoadingSkeleton';
import SendContractModal, { type ContractDetails } from './SendContractModal';

type Props = {
  conversation: Conversation | null;
  currentUserId: string | number;
  isFreelancer: boolean;
  onBack: () => void;
  onOpenContact: () => void;
};

export default function ConversationView({
  conversation,
  currentUserId,
  isFreelancer,
  onBack,
  onOpenContact,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastSseAt, setLastSseAt] = useState<number | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversationId = conversation?.conversation_id ?? null;

  // Load messages on conversation change
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));

    fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(() => {});
  }, [conversationId]);

  // SSE for real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const es = new EventSource(`/api/conversations/${conversationId}/stream`);

    es.onmessage = (evt: MessageEvent) => {
      let msg: Message;
      try {
        msg = JSON.parse(evt.data as string) as Message;
      } catch {
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(msg.id))) return prev;
        return [...prev, msg];
      });
      if (String(msg.sender_id) !== String(currentUserId)) {
        setLastSseAt(Date.now());
        fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(() => {});
      }
    };

    es.onerror = () => {}; // browser auto-reconnects

    return () => es.close();
  }, [conversationId, currentUserId]);

  // Auto-clear typing indicator after 30s
  useEffect(() => {
    if (!lastSseAt) return;
    const id = setTimeout(() => setLastSseAt(null), 30_000);
    return () => clearTimeout(id);
  }, [lastSseAt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`; // max 4 rows ≈ 96px
  }, [text]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !conversationId || isSending) return;

    const optimisticId = crypto.randomUUID();
    const optimistic: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: trimmed,
      sent_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages((prev) => [...prev, optimistic]);
    setText('');
    setIsSending(true);

    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error('Failed to send');
    } finally {
      setIsSending(false);
    }
  }, [text, conversationId, currentUserId, isSending]);

  const sendContract = useCallback(async (details: ContractDetails) => {
    if (!conversationId) return;
    const body =
      `📋 **Contract Proposal**\n` +
      `**Project:** ${details.title}\n` +
      `**Amount:** $${Number(details.amount).toLocaleString()}\n` +
      `**Deadline:** ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(details.deadline))}` +
      (details.description ? `\n**Deliverables:** ${details.description}` : '');

    const optimisticId = crypto.randomUUID();
    const optimistic: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      sent_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error('Failed to send contract');
    }
  }, [conversationId, currentUserId]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showTyping = lastSseAt !== null && Date.now() - lastSseAt < 30_000;

  if (!conversation) {
    return (
      <div className="hidden lg:flex flex-1 items-center justify-center bg-white">
        <p className="text-[#6B7280] text-[15px]">Select a conversation</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white min-w-0">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB] shrink-0"
        style={{ minHeight: '64px' }}
      >
        {/* Back arrow — mobile only */}
        <button
          onClick={onBack}
          className="lg:hidden shrink-0 text-[#6B7280] hover:text-[#111827] mr-1"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden">
          {conversation.other_avatar ? (
            <img
              src={conversation.other_avatar}
              alt={conversation.other_name}
              className="w-full h-full object-cover"
            />
          ) : (
            initials(conversation.other_name)
          )}
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-[#111827] truncate">
            {conversation.other_name}
          </span>
          <div className="flex items-center gap-1.5 text-[#6B7280] text-[12px] flex-wrap">
            <Clock size={12} className="shrink-0" />
            <span className="shrink-0">
              {formatChatTime(conversation.last_message_sent_at) || 'Calculating...'}
            </span>
            <span>·</span>
            <Briefcase size={12} className="shrink-0" />
            <span className="truncate">{conversation.job_title}</span>
          </div>
        </div>

        {/* Send Contract — freelancer only */}
        {isFreelancer && (
          <button
            onClick={() => setShowContractModal(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#1E3A5F] text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            <FileText size={13} />
            <span className="hidden sm:inline">Send Contract</span>
          </button>
        )}

        {/* Maximize / contact toggle */}
        <button
          onClick={onOpenContact}
          className="shrink-0 text-[#6B7280] hover:text-[#111827]"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
        {isLoading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <p className="text-center text-[#9CA3AF] text-[13px] m-auto">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={String(msg.sender_id) === String(currentUserId)}
            />
          ))
        )}

        {/* Typing indicator */}
        {showTyping && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#22C55E] text-white flex items-center justify-center font-semibold text-sm shrink-0">
              {initials(conversation.other_name)}
            </div>
            <div
              className="flex gap-1 px-3 py-2.5 bg-[#F3F4F6]"
              style={{ borderRadius: '0 12px 12px 12px' }}
            >
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Contract modal */}
      {showContractModal && conversation && (
        <SendContractModal
          defaultTitle={conversation.job_title}
          defaultPrice={conversation.offered_price}
          onSend={sendContract}
          onClose={() => setShowContractModal(false)}
        />
      )}

      {/* Input bar */}
      <div
        className="shrink-0 border-t border-[#E5E7EB] px-4 py-2 flex items-center gap-2.5"
        style={{ minHeight: '56px' }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message here......"
          className="flex-1 resize-none border-0 outline-none text-[13px] text-[#111827] placeholder:text-[#9CA3AF] bg-transparent py-1 leading-5"
          style={{ maxHeight: '96px', overflowY: 'auto' }}
        />
        <button className="text-[#9CA3AF] hover:text-[#6B7280] shrink-0">
          <Paperclip size={18} />
        </button>
        <button className="text-[#9CA3AF] hover:text-[#6B7280] shrink-0">
          <Smile size={18} />
        </button>
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="w-9 h-9 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
