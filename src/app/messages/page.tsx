'use client';
import { useState, useEffect, useCallback } from 'react';
import ClientLayout from '@/app/layout/ClientLayout';
import userApiStore from '@/app/store/userStore';
import type { Conversation } from '@/app/components/messages/types';
import ChatList from '@/app/components/messages/ChatList';
import ConversationView from '@/app/components/messages/ConversationView';
import ContactPanel from '@/app/components/messages/ContactPanel';

type MobileView = 'list' | 'conversation' | 'contact';

export default function MessagesPage() {
  const { user } = userApiStore() as { user: { id: number; name: string; role_name?: string; role_id?: number } | null };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(true);

  const selectedConversation =
    conversations.find((c) => c.conversation_id === selectedConversationId) ?? null;

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox');
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { inbox: Conversation[] };
      setConversations(data.inbox ?? []);
      setError(null);
    } catch {
      setError('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Poll every 10s for unread badge updates
  useEffect(() => {
    const id = setInterval(fetchInbox, 10_000);
    return () => clearInterval(id);
  }, [fetchInbox]);

  function handleSelectConversation(conv: Conversation) {
    setSelectedConversationId(conv.conversation_id);
    setMobileView('conversation');
  }

  function handleOpenContact() {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setMobileView('contact');
    } else {
      setShowContactPanel((prev) => !prev);
    }
  }

  function handleCloseContact() {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setMobileView('conversation');
    } else {
      setShowContactPanel(false);
    }
  }

  const currentUserId = user?.id ?? '';
  const isFreelancer =
    user?.role_name === 'freelancer' || user?.role_id === 3;

  return (
    <ClientLayout>
      <div className="bg-[#F3F4F6] px-4 py-6 lg:px-8" style={{ minHeight: 'calc(100vh - 72px)' }}>
        {/* Page title */}
        <h1 className="text-[28px] lg:text-[32px] font-bold text-[#111827] mb-5 max-w-[1200px] mx-auto">
          Messages
        </h1>

        {/* Card */}
        <div
          className="bg-white overflow-hidden mx-auto lg:rounded-2xl"
          style={{
            maxWidth: '1200px',
            height: '620px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex h-full">
            {/* LEFT — Chat list */}
            <div
              className={`flex-col border-r border-[#E5E7EB] bg-white h-full overflow-hidden
                ${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex`}
              style={{ width: '260px', minWidth: '260px', flexShrink: 0 }}
            >
              <ChatList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={handleSelectConversation}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isLoading={isLoadingConversations}
                error={error}
                onRetry={fetchInbox}
              />
            </div>

            {/* MIDDLE — Conversation */}
            <div
              className={`flex-col flex-1 min-w-0 h-full
                ${mobileView === 'conversation' || mobileView === 'contact' ? 'flex' : 'hidden'} lg:flex`}
            >
              <ConversationView
                conversation={selectedConversation}
                currentUserId={currentUserId}
                isFreelancer={isFreelancer}
                onBack={() => setMobileView('list')}
                onOpenContact={handleOpenContact}
              />
            </div>

            {/* RIGHT — Contact panel */}
            {selectedConversation && (
              <div
                className={`flex-col bg-white border-l border-[#E5E7EB] h-full overflow-hidden
                  ${mobileView === 'contact' ? 'flex' : 'hidden'}
                  ${showContactPanel ? 'lg:flex' : 'lg:hidden'}`}
                style={{ width: '280px', minWidth: '280px', flexShrink: 0 }}
              >
                <ContactPanel
                  conversation={selectedConversation}
                  onClose={handleCloseContact}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
