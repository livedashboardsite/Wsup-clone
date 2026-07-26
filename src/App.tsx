import { useState, useEffect, useCallback } from 'react';
import { ChatList } from '@/components/ChatList';
import { ConversationView } from '@/components/ConversationView';
import { Showcase } from '@/components/Showcase';
import { CallModal } from '@/components/CallModal';
import { StatusViewer } from '@/components/StatusViewer';
import {
  seedIfNeeded,
  getCurrentUser,
  getConversations,
  getTheme,
  saveTheme,
  resetAllData,
  getOrCreateConversation,
  getProfile,
  getStatuses,
  type Theme,
  type Conversation,
  type Profile,
} from '@/lib/localStore';

function parseHashActive(): string | null {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return null;
  if (raw.startsWith('chat/')) {
    return raw.slice(5);
  }
  if (raw.startsWith('profile/')) {
    const profileId = raw.slice(8);
    const conv = getOrCreateConversation(profileId);
    return conv.id;
  }
  return null;
}

function setHashActive(convId: string | null) {
  if (!convId) {
    if (window.location.hash !== '#/' && window.location.hash !== '') {
      window.location.hash = '#/';
    }
  } else {
    window.location.hash = `#/chat/${encodeURIComponent(convId)}`;
  }
}

function AppInner() {
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return parseHashActive();
    } catch {
      return null;
    }
  });
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [refreshKey, setRefreshKey] = useState(0);
  const [showcaseKey, setShowcaseKey] = useState(0);

  // Call modal state
  const [callOpen, setCallOpen] = useState(false);
  const [callKind, setCallKind] = useState<'voice' | 'video'>('voice');
  const [callPeer, setCallPeer] = useState<Profile | null>(null);
  const [callGroupName, setCallGroupName] = useState<string | null>(null);

  // Status viewer state
  const [statusOpenId, setStatusOpenId] = useState<string | null>(null);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleReloadShowcase = useCallback(() => {
    setActiveId(null);
    setHashActive(null);
    setShowcaseKey((k) => k + 1);
    bumpRefresh();
  }, [bumpRefresh]);

  useEffect(() => {
    seedIfNeeded();
    getCurrentUser();
  }, []);

  useEffect(() => {
    saveTheme(theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  useEffect(() => {
    const onHashChange = () => {
      try {
        const next = parseHashActive();
        if (next !== activeId) setActiveId(next);
      } catch {
        // ignore
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activeId]);

  const handleSelect = (convId: string) => {
    setActiveId(convId);
    setHashActive(convId);
    bumpRefresh();
  };

  const toggleTheme = () => {
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'));
  };

  const handleResetData = () => {
    if (window.confirm('Reset all chat history, statuses, and preferences?')) {
      resetAllData();
      setActiveId(null);
      setHashActive(null);
      bumpRefresh();
    }
  };

  const handleCall = (conv: Conversation, kind: 'voice' | 'video') => {
    const me = getCurrentUser();
    if (conv.is_group) {
      setCallPeer(null);
      setCallGroupName(conv.name ?? 'Group Call');
    } else {
      const otherId = conv.member_ids.find((id) => id !== me.id);
      setCallPeer(otherId ? getProfile(otherId) ?? null : null);
      setCallGroupName(null);
    }
    setCallKind(kind);
    setCallOpen(true);
  };

  const handleOpenStatus = (statusId: string) => {
    setStatusOpenId(statusId);
  };

  const handleTryDemoChat = () => {
    const convs = getConversations();
    const favorite = convs.find((c) => {
      if (c.is_group) return false;
      const me = getCurrentUser();
      const otherId = c.member_ids.find((id) => id !== me.id);
      if (!otherId) return false;
      const p = getProfile(otherId);
      return !!p?.is_favorite;
    });
    const target = favorite ?? convs[0];
    if (target) handleSelect(target.id);
  };

  const handleViewCode = () => {
    window.open('https://github.com/livedashboardsite/Wsup-clone', '_blank', 'noopener,noreferrer');
  };

  const conversations: Conversation[] = getConversations();
  const active = activeId ? conversations.find((c) => c.id === activeId) ?? null : null;

  const statuses = getStatuses();
  const advanceStatus = useCallback(() => {
    if (!statusOpenId) return;
    const idx = statuses.findIndex((s) => s.id === statusOpenId);
    if (idx < 0) return;
    if (idx >= statuses.length - 1) {
      setStatusOpenId(null);
    } else {
      setStatusOpenId(statuses[idx + 1].id);
    }
  }, [statusOpenId, statuses]);

  return (
    <div className="h-screen flex w-screen overflow-hidden app-glass-shell">
      <div
        className={`w-full md:w-[420px] md:border-r border-white/10 shrink-0 flex flex-col glass-strong md:rounded-r-[28px] overflow-hidden ${
          activeId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatList
          activeId={activeId}
          onSelect={handleSelect}
          theme={theme}
          onToggleTheme={toggleTheme}
          onResetData={handleResetData}
          refreshKey={refreshKey}
          onOpenStatus={handleOpenStatus}
          onReloadShowcase={handleReloadShowcase}
        />
      </div>

      <div className={`flex-1 flex flex-col overflow-hidden ${!activeId ? 'hidden md:flex' : 'flex'} relative`}>
        {active ? (
          <ConversationView
            conversation={active}
            onBack={() => {
              setActiveId(null);
              setHashActive(null);
              bumpRefresh();
            }}
            theme={theme}
            onNewMessage={bumpRefresh}
            onChange={bumpRefresh}
            onCall={(kind) => handleCall(active, kind)}
            onReloadShowcase={handleReloadShowcase}
          />
        ) : (
          <Showcase
            key={showcaseKey}
            theme={theme}
            onToggleTheme={toggleTheme}
            onTryDemoChat={handleTryDemoChat}
            onViewCode={handleViewCode}
            onReloadShowcase={handleReloadShowcase}
          />
        )}
      </div>

      <CallModal
        open={callOpen}
        kind={callKind}
        peer={callPeer}
        groupName={callGroupName}
        theme={theme}
        onClose={() => setCallOpen(false)}
      />

      <StatusViewer
        open={statusOpenId != null}
        stories={statuses}
        activeId={statusOpenId}
        onClose={() => setStatusOpenId(null)}
        onAdvance={advanceStatus}
      />
    </div>
  );
}

export default function App() {
  return <AppInner />;
}
