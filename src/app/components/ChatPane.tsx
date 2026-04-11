'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { Send, Paperclip, X, Download, Reply, Trash2, Smile, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useMessages, type Message, type AttachmentInput, type ContractData } from '@/app/hooks/useMessages';
import ContractCard from '@/app/components/ContractCard';
import ContractComposer from '@/app/components/ContractComposer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  conversationId: string;
  currentUserId: number;
  currentUserName?: string;
}

interface PendingAttachment extends AttachmentInput {
  tempId: string;
  previewUrl?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_EMOJI = [
  '👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉',
  '🤔', '😍', '😡', '💯', '✅', '🙏', '😎', '🥳',
  '👀', '🤝', '💪', '🎊',
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── EmojiPicker ─────────────────────────────────────────────────────────────

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-8 right-0 z-20 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-2"
      style={{ width: '168px' }}
    >
      <div className="grid grid-cols-5 gap-1">
        {COMMON_EMOJI.map((e) => (
          <button
            key={e}
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            className="text-lg hover:bg-[#F3F4F6] rounded p-0.5 transition-colors"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AttachmentView ───────────────────────────────────────────────────────────

function AttachmentView({
  att,
}: {
  att: { url: string; file_name: string; file_type: string; size_bytes: number };
}) {
  if (att.file_type === 'image') {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img
          src={att.url}
          alt={att.file_name}
          className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxWidth: '280px', maxHeight: '200px' }}
        />
      </a>
    );
  }
  return (
    <a
      href={att.url}
      download={att.file_name}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 mt-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-current"
    >
      <Paperclip size={14} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-[12px] font-medium truncate">{att.file_name}</p>
        <p className="text-[11px] opacity-70">{formatBytes(att.size_bytes)}</p>
      </div>
      <Download size={13} className="shrink-0 ml-1" />
    </a>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onReply,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  observeRef,
}: {
  message: Message;
  isOwn: boolean;
  currentUserId: number;
  onReply: (m: Message) => void;
  onDelete: (id: string) => void;
  onAddReaction: (msgId: string, emoji: string) => void;
  onRemoveReaction: (msgId: string, emoji: string) => void;
  observeRef: (el: HTMLDivElement | null) => void;
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTouchStart() {
    longPressTimer.current = setTimeout(() => setContextMenu({ x: 0, y: 0 }), 500);
  }
  function handleTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }
  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  if (message.is_deleted) {
    return (
      <div
        ref={observeRef}
        data-message-id={message.id}
        className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start gap-2.5`}
      >
        <div className="w-8 h-8 rounded-full shrink-0 bg-[#E5E7EB]" />
        <div
          className="px-3.5 py-2.5 italic text-[#9CA3AF] text-[13px]"
          style={{
            background: '#F9FAFB',
            borderRadius: isOwn ? '12px 0 12px 12px' : '0 12px 12px 12px',
            border: '1px solid #E5E7EB',
          }}
        >
          Message deleted
        </div>
      </div>
    );
  }

  const isOwn2 = isOwn; // for linter clarity in event handlers
  const borderRadius = isOwn2 ? '12px 0 12px 12px' : '0 12px 12px 12px';

  return (
    <div
      ref={observeRef}
      data-message-id={message.id}
      className={`flex ${isOwn2 ? 'flex-row-reverse' : 'flex-row'} items-start gap-2.5`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-semibold overflow-hidden"
        style={{ background: isOwn2 ? '#1E3A5F' : '#6B7280', flexShrink: 0 }}
      >
        {message.sender_avatar ? (
          <img
            src={message.sender_avatar}
            alt={message.sender_name ?? ''}
            className="w-full h-full object-cover"
          />
        ) : (
          (message.sender_name ?? '?')[0]?.toUpperCase()
        )}
      </div>

      {/* Bubble column */}
      <div
        className={`flex flex-col gap-1 max-w-[65%] relative ${isOwn2 ? 'items-end' : 'items-start'}`}
      >
        {/* Reply preview */}
        {message.reply_to && (
          <div
            className="px-2.5 py-1.5 text-[11px] rounded-lg mb-0.5 border-l-2 border-[#1E3A5F]"
            style={{
              background: isOwn2 ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
              maxWidth: '220px',
            }}
          >
            <p className="font-semibold text-[#1E3A5F] truncate">
              {message.reply_to.sender_name}
            </p>
            <p className="text-[#6B7280] truncate">
              {message.reply_to.body ?? 'Message deleted'}
            </p>
          </div>
        )}

        {/* Main bubble */}
        <div
          className="px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words"
          style={{
            background: isOwn2 ? '#1E3A5F' : '#F3F4F6',
            color: isOwn2 ? '#fff' : '#111827',
            borderRadius,
          }}
        >
          {message.body}
          {message.attachments?.map((att) => <AttachmentView key={att.id} att={att} />)}
        </div>

        {/* Reactions bar */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 ${isOwn2 ? 'justify-end' : 'justify-start'}`}
          >
            {message.reactions.map((r) => {
              const isMine = r.userIds.includes(currentUserId);
              return (
                <button
                  key={r.emoji}
                  onClick={() =>
                    isMine
                      ? onRemoveReaction(message.id, r.emoji)
                      : onAddReaction(message.id, r.emoji)
                  }
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[12px] border transition-colors ${
                    isMine
                      ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                      : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium">{r.count}</span>
                </button>
              );
            })}
            {/* + emoji button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="flex items-center px-1.5 py-0.5 rounded-full text-[12px] border border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
              >
                <Smile size={12} />
              </button>
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={(emoji) => onAddReaction(message.id, emoji)}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className={`text-[11px] text-[#9CA3AF] ${isOwn2 ? 'text-right' : ''}`}>
          {formatTime(message.sent_at)}
        </span>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-20 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 min-w-[140px]"
            style={
              contextMenu.x
                ? { left: contextMenu.x, top: contextMenu.y }
                : { right: '16px', bottom: '80px' }
            }
          >
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#111827] hover:bg-[#F3F4F6]"
              onClick={() => {
                onReply(message);
                setContextMenu(null);
              }}
            >
              <Reply size={14} />
              Reply
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#111827] hover:bg-[#F3F4F6]"
              onClick={() => {
                setShowEmojiPicker(true);
                setContextMenu(null);
              }}
            >
              <Smile size={14} />
              React
            </button>
            {isOwn2 && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-600 hover:bg-red-50"
                onClick={() => {
                  onDelete(message.id);
                  setContextMenu(null);
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ChatPane ─────────────────────────────────────────────────────────────────

export default function ChatPane({ conversationId, currentUserId, currentUserName }: Props) {
  const {
    messages,
    setMessages,
    typingUsers,
    sendMessage,
    markRead,
    sendTypingStart,
    sendTypingStop,
    addReaction,
    removeReaction,
    deleteMessage,
    uploadFile,
  } = useMessages(conversationId, currentUserId);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showContractComposer, setShowContractComposer] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const observersRef = useRef<Map<string, IntersectionObserver>>(new Map());
  const pendingReadRef = useRef<Set<string>>(new Set());
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
  }

  // ── IntersectionObserver (batched read receipts) ────────────────────────────

  function flushMarkRead() {
    const ids = Array.from(pendingReadRef.current);
    pendingReadRef.current.clear();
    if (ids.length > 0) markRead(ids);
  }

  const observeMessage = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const messageId = el.dataset.messageId;
      if (!messageId) return;

      // Disconnect any prior observer on this element
      observersRef.current.get(messageId)?.disconnect();

      const message = messages.find((m) => m.id === messageId);
      if (!message || message.is_deleted) return;
      if (message.sender_id === currentUserId) return;
      if (message.read_by.includes(currentUserId)) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          pendingReadRef.current.add(messageId);
          if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
          markReadTimerRef.current = setTimeout(flushMarkRead, 300);
          obs.disconnect();
          observersRef.current.delete(messageId);
        },
        { threshold: 0.5 },
      );
      obs.observe(el);
      observersRef.current.set(messageId, obs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, currentUserId],
  );

  useEffect(() => {
    return () => {
      observersRef.current.forEach((obs) => obs.disconnect());
      observersRef.current.clear();
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, []);

  // ── Auto-resize textarea ────────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  }, [text]);

  // ── Send ─────────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && pendingAttachments.length === 0) || isSending) return;

    setIsSending(true);
    sendTypingStop();

    try {
      await sendMessage({
        body: trimmed || undefined,
        replyToId: replyTo?.id,
        attachments: pendingAttachments.map(({ url, fileName, fileType, mimeType, sizeBytes }) => ({
          url,
          fileName,
          fileType,
          mimeType,
          sizeBytes,
        })),
      });
      setText('');
      setReplyTo(null);
      setPendingAttachments((prev) => {
        prev.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
        return [];
      });
      userScrolledUp.current = false;
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [text, pendingAttachments, isSending, replyTo, sendMessage, sendTypingStop]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── File upload ─────────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20 MB`);
          continue;
        }
        const meta = await uploadFile(file, conversationId);
        const previewUrl = file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined;
        setPendingAttachments((prev) => [
          ...prev,
          { ...meta, tempId: crypto.randomUUID(), previewUrl },
        ]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function removePending(tempId: string) {
    setPendingAttachments((prev) => {
      const att = prev.find((a) => a.tempId === tempId);
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return prev.filter((a) => a.tempId !== tempId);
    });
  }

  // ── Contract handlers ────────────────────────────────────────────────────────

  const handleContractUpdate = useCallback(
    (contractId: string, updated: ContractData) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.contract?.id === contractId ? { ...m, contract: updated } : m,
        ),
      );
    },
    [setMessages],
  );

  const handleContractCreated = useCallback(
    (contract: ContractData) => {
      // The WS broadcast will handle inserting the message; this is a fallback
      setMessages((prev) => {
        if (contract.messageId && prev.some((m) => m.id === contract.messageId)) return prev;
        return [
          ...prev,
          {
            id: contract.messageId ?? contract.id,
            conversation_id: contract.conversationId,
            sender_id: contract.createdBy,
            body: null,
            message_type: 'contract' as const,
            contract,
            is_deleted: false,
            reply_to_id: null,
            reply_to: null,
            sent_at: contract.createdAt,
            attachments: [],
            reactions: [],
            read_by: [],
          },
        ];
      });
      userScrolledUp.current = false;
    },
    [setMessages],
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white min-w-0 relative">
      {/* Messages list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4"
      >
        {messages.length === 0 ? (
          <p className="text-center text-[#9CA3AF] text-[13px] m-auto">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) =>
            msg.message_type === 'contract' && msg.contract ? (
              <ContractCard
                key={msg.id}
                contract={msg.contract}
                currentUserId={currentUserId}
                currentUserName={currentUserName ?? ''}
                onContractUpdate={(c) => handleContractUpdate(msg.contract!.id, c)}
              />
            ) : (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
                currentUserId={currentUserId}
                onReply={setReplyTo}
                onDelete={deleteMessage}
                onAddReaction={addReaction}
                onRemoveReaction={removeReaction}
                observeRef={observeMessage}
              />
            ),
          )
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#6B7280] flex items-center justify-center text-white text-[10px] shrink-0 font-bold">
              …
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

      {/* Pending attachment chips */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-[#E5E7EB]">
          {pendingAttachments.map((att) => (
            <div
              key={att.tempId}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[12px] text-[#1D4ED8] max-w-[160px]"
            >
              {att.fileType === 'image' && att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.fileName}
                  className="w-5 h-5 rounded object-cover shrink-0"
                />
              ) : (
                <Paperclip size={12} className="shrink-0" />
              )}
              <span className="truncate flex-1">{att.fileName}</span>
              <button
                onClick={() => removePending(att.tempId)}
                className="shrink-0 text-[#93C5FD] hover:text-[#1D4ED8]"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] border-t border-[#E5E7EB] text-[12px]">
          <Reply size={14} className="text-[#1E3A5F] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-[#1E3A5F]">
              {replyTo.sender_name ?? 'User'}
            </span>
            <span className="text-[#6B7280] ml-1 truncate">
              {replyTo.is_deleted ? 'Message deleted' : (replyTo.body ?? '[attachment]')}
            </span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-[#9CA3AF] hover:text-[#6B7280] shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div
        className="shrink-0 border-t border-[#E5E7EB] px-4 py-2 flex items-end gap-2.5"
        style={{ minHeight: '56px' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/zip"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            sendTypingStart();
          }}
          onKeyDown={handleKeyDown}
          onBlur={sendTypingStop}
          placeholder="Type a message…"
          className="flex-1 resize-none border-0 outline-none text-[13px] text-[#111827] placeholder:text-[#9CA3AF] bg-transparent py-1 leading-5"
          style={{ maxHeight: '96px', overflowY: 'auto' }}
        />

        <button
          onClick={() => setShowContractComposer(true)}
          title="Send contract"
          className="text-[#9CA3AF] hover:text-[#6B7280] shrink-0"
        >
          <FileText size={18} />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Attach file"
          className="text-[#9CA3AF] hover:text-[#6B7280] shrink-0 disabled:opacity-50"
        >
          <Paperclip size={18} />
        </button>

        <button
          onClick={handleSend}
          disabled={(!text.trim() && pendingAttachments.length === 0) || isSending}
          className="w-9 h-9 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Contract composer overlay */}
      {showContractComposer && (
        <ContractComposer
          conversationId={conversationId}
          onCreated={handleContractCreated}
          onClose={() => setShowContractComposer(false)}
        />
      )}
    </div>
  );
}
