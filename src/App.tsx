import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useConversations } from '@/lib/useConversations';
import { usePresenceHeartbeat } from '@/lib/usePresence';
import { AuthScreen } from '@/components/AuthScreen';
import { ChatList } from '@/components/ChatList';
import { ConversationView } from '@/components/ConversationView';
import { EmptyState } from '@/components/EmptyState';
import { NewChatModal } from '@/components/NewChatModal';
import { ProfileScreen } from '@/components/ProfileScreen';
import { InfoPanel } from '@/components/InfoPanel';
import { Loader2 } from 'lucide-react';

type Panel = 'chat' | 'profile' | 'info';

function AppInner() {
  const { profile, loading } = useAuth();
  const { conversations, loading: convsLoading } = useConversations();
  usePresenceHeartbeat();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('chat');
  const [showNewChat, setShowNewChat] = useState(false);

  // Auto-clear active conversation if it disappears from list
  useEffect(() => {
    if (activeId && !conversations.find((c) => c.id === activeId)) {
      // Keep it active even if list hasn't refreshed yet
    }
  }, [conversations, activeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <Loader2 size={32} className="animate-spin text-[#008069]" />
      </div>
    );
  }

  if (!profile) {
    return <AuthScreen />;
  }

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const handleNewChatCreated = (id: string) => {
    setShowNewChat(false);
    setActiveId(id);
    setPanel('chat');
  };

  // Mobile: show only one pane at a time
  return (
    <div className="h-screen flex bg-[#f0f2f5] overflow-hidden">
      {/* Left pane: chat list / profile */}
      <div
        className={`w-full md:w-[400px] md:border-r border-[#e9edef] shrink-0 flex flex-col ${
          activeId && panel !== 'profile' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {panel === 'profile' ? (
          <ProfileScreen onBack={() => setPanel('chat')} />
        ) : (
          <ChatList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => { setActiveId(id); setPanel('chat'); }}
            onNewChat={() => setShowNewChat(true)}
            onNewGroup={() => setShowNewChat(true)}
            onProfile={() => setPanel('profile')}
          />
        )}
      </div>

      {/* Right pane: conversation / info / empty */}
      <div
        className={`flex-1 flex flex-col ${!activeId && panel === 'chat' ? 'hidden md:flex' : 'flex'}`}
      >
        {panel === 'info' && active ? (
          <InfoPanel conversation={active} onClose={() => setPanel('chat')} />
        ) : active ? (
          <ConversationView
            conversation={active}
            onBack={() => setActiveId(null)}
            onInfo={() => setPanel('info')}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={handleNewChatCreated}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
