'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  url: string;
  file_name: string;
  file_type: 'image' | 'file';
  mime_type: string;
  size_bytes: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: number[];
}

export interface ReplyPreview {
  id: string;
  body: string | null;
  sender_name: string;
}

export interface ContractRevision {
  id: string;
  contractId: string;
  proposedBy: number;
  proposedByName: string;
  revisionNumber: number;
  title: string;
  scope: string;
  deliverables: string;
  price: string;
  currency: string;
  deadline: string;
  paymentTerms: string;
  additionalTerms: string | null;
  changeSummary: string | null;
  createdAt: string;
}

export interface ContractSignature {
  userId: number;
  typedName: string;
  signedAt: string;
}

export interface ContractData {
  id: string;
  conversationId: string;
  createdBy: number;
  createdByName: string;
  status: string;
  messageId: string | null;
  currentRevision: ContractRevision | null;
  revisionHistory: ContractRevision[];
  signatures: ContractSignature[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_name?: string;
  sender_avatar?: string | null;
  body: string | null;
  message_type?: 'text' | 'contract';
  contract?: ContractData;
  is_deleted: boolean;
  reply_to_id: string | null;
  reply_to: ReplyPreview | null;
  sent_at: string;
  attachments: Attachment[];
  reactions: Reaction[];
  read_by: number[];
}

export interface AttachmentInput {
  url: string;
  fileName: string;
  fileType: 'image' | 'file';
  mimeType: string;
  sizeBytes: number;
}

interface SendMessageParams {
  body?: string;
  replyToId?: string;
  attachments?: AttachmentInput[];
}

type WsIncoming =
  | { type: 'pong' }
  | { type: 'new_message'; message: Message }
  | { type: 'typing'; userId: number; conversationId: string }
  | { type: 'typing_stop'; userId: number; conversationId: string }
  | { type: 'read_receipt'; messageIds: string[]; userId: number; conversationId: string }
  | { type: 'reaction_update'; messageId: string; reactions: Reaction[] }
  | { type: 'message_deleted'; messageId: string; conversationId: string }
  | { type: 'new_contract'; conversationId: string; contract: ContractData }
  | { type: 'contract_updated'; contractId: string; contract: ContractData };

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessages(conversationId: string | null, currentUserId: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // ── WebSocket connection ────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    if (!conversationId) {
      setMessages([]);
      setTypingUsers([]);
      return;
    }

    let ws: WebSocket | null = null;
    let cancelled = false;

    // Load initial messages
    fetch(`/api/messages/${conversationId}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d: { messages: Message[] }) => {
        if (!cancelled) setMessages(d.messages ?? []);
      })
      .catch(() => undefined);

    // Open WebSocket
    async function connect() {
      try {
        const tokenRes = await fetch('/api/ws-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        });
        if (!tokenRes.ok || cancelled) return;
        const { token } = (await tokenRes.json()) as { token: string };

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4002';
        ws = new WebSocket(
          `${wsUrl}?token=${encodeURIComponent(token)}&conversationId=${encodeURIComponent(conversationId!)}`,
        );
        if (cancelled) {
          ws.close();
          return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
          if (!cancelled) setConnected(true);
        };
        ws.onclose = () => {
          if (!cancelled) setConnected(false);
        };
        ws.onerror = () => {
          if (!cancelled) setConnected(false);
        };
        ws.onmessage = (evt) => {
          if (cancelled) return;
          let msg: WsIncoming;
          try {
            msg = JSON.parse(evt.data as string) as WsIncoming;
          } catch {
            return;
          }
          handleWsMessage(msg);
        };
      } catch {
        // silently ignore — connection failed
      }
    }

    connect();

    return () => {
      cancelled = true;
      ws?.close();
      wsRef.current = null;
      setConnected(false);
      setTypingUsers([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ── WS message handler ──────────────────────────────────────────────────────

  function handleWsMessage(msg: WsIncoming) {
    switch (msg.type) {
      case 'new_message':
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.message.id)) return prev;
          return [...prev, msg.message];
        });
        break;

      case 'typing':
        setTypingUsers((prev) =>
          prev.includes(msg.userId) ? prev : [...prev, msg.userId],
        );
        break;

      case 'typing_stop':
        setTypingUsers((prev) => prev.filter((id) => id !== msg.userId));
        break;

      case 'read_receipt':
        setMessages((prev) =>
          prev.map((m) =>
            msg.messageIds.includes(m.id)
              ? { ...m, read_by: Array.from(new Set([...m.read_by, msg.userId])) }
              : m,
          ),
        );
        break;

      case 'reaction_update':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.messageId ? { ...m, reactions: msg.reactions } : m,
          ),
        );
        break;

      case 'message_deleted':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.messageId ? { ...m, is_deleted: true, body: null } : m,
          ),
        );
        break;

      case 'new_contract': {
        const c = msg.contract;
        setMessages((prev) => {
          // If a message with this message_id already exists, attach contract
          if (c.messageId) {
            const idx = prev.findIndex((m) => m.id === c.messageId);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], contract: c, message_type: 'contract' };
              return updated;
            }
          }
          // Otherwise append a synthetic message
          return [
            ...prev,
            {
              id: c.messageId ?? c.id,
              conversation_id: c.conversationId,
              sender_id: c.createdBy,
              body: null,
              message_type: 'contract' as const,
              contract: c,
              is_deleted: false,
              reply_to_id: null,
              reply_to: null,
              sent_at: c.createdAt,
              attachments: [],
              reactions: [],
              read_by: [],
            },
          ];
        });
        break;
      }

      case 'contract_updated': {
        const c = msg.contract;
        setMessages((prev) =>
          prev.map((m) =>
            (m.contract && m.contract.id === c.id) ? { ...m, contract: c } : m,
          ),
        );
        break;
      }
    }
  }

  // ── sendMessage ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async ({ body, replyToId, attachments }: SendMessageParams) => {
      if (!conversationId) return;

      const tempId = crypto.randomUUID();
      const optimistic: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        body: body ?? null,
        is_deleted: false,
        reply_to_id: replyToId ?? null,
        reply_to: null,
        sent_at: new Date().toISOString(),
        attachments: [],
        reactions: [],
        read_by: [],
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, body, replyToId, attachments }),
        });

        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          return;
        }

        const { message: real } = (await res.json()) as { message: Message };
        // Replace optimistic with real; WS delivery will deduplicate
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? real : m)),
        );
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [conversationId, currentUserId],
  );

  // ── markRead ────────────────────────────────────────────────────────────────

  const markRead = useCallback((messageIds: string[]) => {
    if (messageIds.length === 0) return;
    wsRef.current?.send(JSON.stringify({ type: 'mark_read', messageIds }));
  }, []);

  // ── typing ──────────────────────────────────────────────────────────────────

  const sendTypingStart = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'typing_start' }));
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({ type: 'typing_stop' }));
    }, 3000);
  }, []);

  const sendTypingStop = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    wsRef.current?.send(JSON.stringify({ type: 'typing_stop' }));
  }, []);

  // ── reactions ───────────────────────────────────────────────────────────────

  const addReaction = useCallback((messageId: string, emoji: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'reaction_add', messageId, emoji }));
  }, []);

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'reaction_remove', messageId, emoji }));
  }, []);

  // ── deleteMessage ────────────────────────────────────────────────────────────

  const deleteMessage = useCallback(async (messageId: string) => {
    await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    // WS broadcast handles the state update; optimistically mark deleted locally too
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, body: null } : m)),
    );
  }, []);

  // ── uploadFile ───────────────────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (file: File, convId: string): Promise<AttachmentInput> => {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = (await presignRes.json()) as { error?: string };
        throw new Error(err.error ?? 'Failed to get upload URL');
      }

      const { presignedUrl, publicUrl } = (await presignRes.json()) as {
        presignedUrl: string;
        publicUrl: string;
      };

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('Upload to R2 failed');

      return {
        url: publicUrl,
        fileName: file.name,
        fileType: file.type.startsWith('image/') ? 'image' : 'file',
        mimeType: file.type,
        sizeBytes: file.size,
      };
    },
    [],
  );

  return {
    messages,
    setMessages,
    typingUsers,
    connected,
    sendMessage,
    markRead,
    sendTypingStart,
    sendTypingStop,
    addReaction,
    removeReaction,
    deleteMessage,
    uploadFile,
  };
}
