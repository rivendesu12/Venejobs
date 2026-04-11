import { useState, useEffect } from 'react';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string | number;
  body: string;
  sent_at: string;
  sender_name?: string;
  sender_avatar?: string;
};

export function useMessages(conversationId: string, currentUserId: string | number) {
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch initial messages and mark as read whenever conversationId changes
  useEffect(() => {
    if (!conversationId) return;

    async function load(): Promise<void> {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        const data = await res.json();
        setMessages(data.messages ?? []);
      } catch (err) {
        console.error('[useMessages] Failed to load messages', err);
      }

      try {
        await fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' });
      } catch {
        // non-critical
      }
    }

    load();
  }, [conversationId]);

  // SSE listener — separate effect so it can be cleaned up independently
  useEffect(() => {
    if (!conversationId) return;

    const eventSource = new EventSource(`/api/conversations/${conversationId}/stream`);

    eventSource.onmessage = (event: MessageEvent) => {
      let msg: Message;
      try {
        msg = JSON.parse(event.data as string) as Message;
      } catch {
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(msg.id))) return prev;
        return [...prev, msg];
      });

      // Mark as read if the message is from the other party
      if (String(msg.sender_id) !== String(currentUserId)) {
        fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(() => undefined);
      }
    };

    eventSource.onerror = () => {
      console.warn('[useMessages] SSE error — browser will reconnect automatically');
    };

    return () => {
      eventSource.close();
    };
  }, [conversationId, currentUserId]);

  async function sendMessage(body: string): Promise<void> {
    const optimisticId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      sent_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      // On success: do nothing — SSE delivers the real row which deduplicates by id
    } catch {
      // On failure: remove the optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    }
  }

  return { messages, sendMessage };
}
