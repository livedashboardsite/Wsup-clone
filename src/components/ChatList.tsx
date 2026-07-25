import { useMemo, useState } from 'react';
import {
  Search,
  MessageSquarePlus,
  Users,
  MoreVertical,
  Sun,
  Moon,
  Trash2,
  User,
  MessageCircle,
  CircleOff,
  Star,
  CircleUser,
  Circle,
  Radio,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { Ticks } from './Ticks';
import {
  getProfiles,
  getConversations,
  getMessages,
  getCurrentUser,
  getProfile,
  getOrCreateConversation,
  getStatuses,
  saveActiveTab,
  getActiveTab,
  type Profile as LocalProfile,
  type Conversation as LocalConversation,
  type Message as LocalMessage,
  type Theme,
  type SidebarTab,
  CURRENT_USER_ID,
} from '@/lib/localStore';
import { formatChatListTime, previewText } from '@/lib/format';

interface ChatListProps {
  activeId: string | null;
  onSelect: (convId: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onResetData: () => void;
  refreshKey: number;
  onOpenStatus: (statusId: string) => void;
}

const TABS: { id: SidebarTab; label: string; icon: typeof MessageCircle; badge?: string }[] = [
  { id: 'all', label: 'All', icon: MessageCircle },
  { id: 'unread', label: 'Unread', icon: CircleOff },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'favorites', label: 'Favs', icon: Star },
  { id: 'status', label: 'Status', icon: Radio },
];

function convDisplayName(conv: LocalConversation, me: LocalProfile): string {
  if (conv.is_group) return conv.name ?? 'Group';
  const otherId = conv.member_ids.find((id) => id !== me.id);
  const p = otherId ? getProfile(otherId) : undefined;
  return p?.name ?? 'Unknown';
}
function convAvatar(conv: LocalConversation, me: LocalProfile): string | undefined {
  if (conv.is_group) return conv.avatar_url;
  const otherId = conv.member_ids.find((id) => id !== me.id);
  const p = otherId ? getProfile(otherId) : undefined;
  return p?.avatar_url;
}
function convOnline(conv: LocalConversation, me: LocalProfile): boolean {
  if (conv.is_group) return false;
  const otherId = conv.member_ids.find((id) => id !== me.id);
  const p = otherId ? getProfile(otherId) : undefined;
  return p?.is_online ?? false;
}
function convOtherProfile(conv: LocalConversation, me: LocalProfile): LocalProfile | undefined {
  const otherId = conv.member_ids.find((id) => id !== me.id);
  return otherId ? getProfile(otherId) : undefined;
}
function lastMessage(convId: string, msgs: LocalMessage[]) {
  const convMsgs = msgs.filter((m) => m.conversation_id === convId);
  return convMsgs[convMsgs.length - 1];
}

function GroupAvatars({ conv, me, size }: { conv: LocalConversation; me: LocalProfile; size: number }) {
  const ids = conv.member_ids.filter((id) => id !== me.id).slice(0, 3);
  const profiles = ids.map((id) => getProfile(id)).filter(Boolean) as LocalProfile[];
  const pad = 4;
  const overlap = Math.floor(size * 0.4);
  const width = size + pad + Math.max(0, profiles.length - 1) * overlap;
  return (
    <div className="shrink-0" style={{ width, height: size }}>
      {profiles.map((p, i) => (
        <div
          key={p.id}
          className="absolute"
          style={{ left: i * overlap, top: 0 }}
        >
          <div
            className="rounded-full border-2 shadow-sm overflow-hidden"
            style={{
              width: size,
              height: size,
              borderColor: 'var(--glass-bg-strong-light, white)',
            }}
          >
            <Avatar name={p.name} id={p.id} src={p.avatar_url} size={size} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatList({
  activeId,
  onSelect,
  theme,
  onToggleTheme,
  onResetData,
  refreshKey,
  onOpenStatus,
}: ChatListProps) {
  const me = getCurrentUser();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<SidebarTab>(() => getActiveTab());

  const setTabAndSave = (t: SidebarTab) => {
    setTab(t);
    saveActiveTab(t);
  };

  const profiles = useMemo(() => getProfiles(), [refreshKey]);
  const statuses = useMemo(
    () =>
      getStatuses().sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [refreshKey]
  );
  const conversations = useMemo(
    () =>
      getConversations().sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      ),
    [refreshKey]
  );
  const allMessages = useMemo(() => getMessages(), [refreshKey]);

  const convIdsInChat = new Set(
    conversations.filter((c) => !c.is_group).flatMap((c) => c.member_ids)
  );
  const otherProfiles = profiles.filter((p) => !convIdsInChat.has(p.id));

  const matchesQuery = (name: string) =>
    !query || name.toLowerCase().includes(query.toLowerCase());

  let filteredConversations = conversations.filter((c) => matchesQuery(convDisplayName(c, me)));
  let filteredNewProfiles = otherProfiles.filter((p) => matchesQuery(p.name));

  if (tab === 'unread') {
    filteredConversations = filteredConversations.filter((c) => c.unread_count > 0);
    filteredNewProfiles = [];
  } else if (tab === 'groups') {
    filteredConversations = filteredConversations.filter((c) => c.is_group);
    filteredNewProfiles = [];
  } else if (tab === 'favorites') {
    filteredConversations = filteredConversations.filter((c) => {
      if (c.is_group) return true; // keep groups mixed or hide? Hide to match profile favs.
      const otherId = c.member_ids.find((id) => id !== me.id);
      const p = otherId ? getProfile(otherId) : undefined;
      return !!p?.is_favorite;
    });
    filteredNewProfiles = filteredNewProfiles.filter((p) => p.is_favorite);
  }

  const isDark = theme === 'dark';
  const themeBg = isDark ? 'bg-[#111b21]/80' : 'bg-white/70';
  const themeHeaderBg = isDark ? 'bg-[#202c33]/90' : 'bg-[#f0f2f5]/85';
  const themeTextPrimary = isDark ? 'text-white' : 'text-[#111b21]';
  const themeTextSecondary = isDark ? 'text-white/65' : 'text-[#667781]';
  const themeSearchBg = isDark ? 'bg-white/[0.05]' : 'bg-white/70';
  const themeHover = isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-white/90';
  const themeActive = isDark ? 'bg-white/[0.07]' : 'bg-white';
  const themeBorder = isDark ? 'border-white/[0.06]' : 'border-white/60';
  const themeInputText = isDark ? 'text-white placeholder:text-white/40' : 'text-slate-800 placeholder:text-slate-500';

  if (tab === 'status') {
    const unviewed = statuses.filter((s) => !s.viewed);
    const viewed = statuses.filter((s) => s.viewed);
    const filtered = statuses.filter((s) => {
      const author = getProfile(s.profile_id);
      return matchesQuery(author?.name ?? 'Status');
    });
    return (
      <div className={`flex flex-col h-full glass-strong rounded-r-[28px] ${themeBg}`}>
        <div className={`${themeHeaderBg} px-4 py-2.5 flex items-center justify-between shrink-0 border-b ${themeBorder}`}>
          <h1 className={`text-lg font-semibold ${themeTextPrimary}`}>Status</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${themeTextSecondary} ${themeHover}`}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setTabAndSave('all')}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${themeTextSecondary} ${themeHover}`}
              title="Back to chats"
            >
              <MessageCircle size={20} />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${themeTextSecondary} ${themeHover}`}
              >
                <MoreVertical size={20} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className={`absolute right-0 top-full mt-1 rounded-lg shadow-lg z-20 glass-strong min-w-[180px] py-1`}>
                    <button
                      onClick={() => { setMenuOpen(false); onResetData(); }}
                      className={`w-full text-left text-sm px-4 py-2 ${themeHover} flex items-center gap-2 ${isDark ? 'text-[#f97676]' : 'text-[#d93025]'}`}
                    >
                      <Trash2 size={14} /> Reset chat history
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="px-3 py-2 shrink-0">
          <div className={`flex items-center gap-2 ${themeSearchBg} rounded-xl px-3 py-1.5 border ${themeBorder}`}>
            <Search size={16} className={themeTextSecondary} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search statuses"
              className={`flex-1 outline-none text-sm bg-transparent ${themeInputText}`}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {filtered.length === 0 ? (
            <div className={`px-4 py-10 text-center text-sm ${themeTextSecondary}`}>No status updates yet.</div>
          ) : (
            <>
              {unviewed.filter((s) => filtered.includes(s)).length > 0 && (
                <div className={`px-2 text-[11px] font-semibold mb-1 ${themeTextSecondary}`}>Recent</div>
              )}
              {filtered.map((s) => {
                const author = getProfile(s.profile_id);
                const isUnviewed = !s.viewed;
                return (
                  <button
                    key={s.id}
                    onClick={() => onOpenStatus(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl ${themeHover} text-left transition`}
                  >
                    <div
                      className={`p-[3px] rounded-full ${
                        isUnviewed
                          ? 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-500'
                          : 'bg-white/20 dark:bg-white/10'
                      }`}
                    >
                      <img
                        src={author?.avatar_url}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={`font-medium truncate ${themeTextPrimary}`}>{author?.name ?? 'Unknown'}</div>
                      <div className={`text-xs truncate ${themeTextSecondary}`}>
                        {new Date(s.created_at).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full glass-strong rounded-r-[28px] ${themeBg}`}>
      <div className={`${themeHeaderBg} px-4 py-2.5 flex items-center justify-between shrink-0 border-b ${themeBorder}`}>
        <h1 className={`text-lg font-semibold ${themeTextPrimary}`}>Chats</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${themeTextSecondary} ${themeHover} transition-colors`}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => onOpenStatus(statuses[0]?.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${themeTextSecondary} ${themeHover} transition-colors relative`}
            title="Status / Stories"
          >
            <Radio size={20} />
            {unviewedCount() > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>
          <button
            className={`w-9 h-9 rounded-full flex items-center justify-center ${themeTextSecondary} ${themeHover} transition-colors`}
            title="New group"
          >
            <Users size={20} />
          </button>
          <button
            className={`w-9 h-9 rounded-full flex items-center justify-center ${themeTextSecondary} ${themeHover} transition-colors`}
            title="New chat"
          >
            <MessageSquarePlus size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${themeTextSecondary} ${themeHover} transition-colors`}
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className={`absolute right-0 top-full mt-1 rounded-md shadow-lg border ${themeBorder} glass-strong py-1 min-w-[180px] z-20`}>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className={`w-full text-left text-sm px-4 py-2 ${themeHover} flex items-center gap-2 ${themeTextPrimary}`}
                  >
                    <User size={14} /> Profile
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onResetData(); }}
                    className={`w-full text-left text-sm px-4 py-2 ${themeHover} flex items-center gap-2 ${isDark ? 'text-[#f97676]' : 'text-[#d93025]'}`}
                  >
                    <Trash2 size={14} /> Reset chat history
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`px-3 py-2 shrink-0 border-b ${themeBorder}`}>
        <div className={`flex items-center gap-2 ${themeSearchBg} rounded-xl px-3 py-1.5 border ${themeBorder}`}>
          <Search size={16} className={themeTextSecondary} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className={`flex-1 outline-none text-sm bg-transparent ${themeInputText}`}
          />
        </div>
      </div>

      <div className={`px-3 pt-3 shrink-0 flex items-center gap-1 overflow-x-auto`}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTabAndSave(t.id)}
              className={`tab-active-shrink tab-item px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                active
                  ? `tab-active ${isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm'}`
                  : `${themeTextSecondary} ${themeHover}`
              }`}
              style={active ? { position: 'relative' } : undefined}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {filteredConversations.length === 0 && filteredNewProfiles.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full px-6 text-center ${themeTextSecondary} text-sm`}>
            <CircleUser size={34} className="opacity-60 mb-2" />
            <p>No chats match your filter.</p>
          </div>
        ) : (
          <>
            {filteredConversations.map((c) => {
              const name = convDisplayName(c, me);
              const last = lastMessage(c.id, allMessages);
              const avatarSrc = convAvatar(c, me);
              const online = convOnline(c, me);
              const otherProfile = convOtherProfile(c, me);
              const isOut = last?.sender_id === me.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left ${themeHover} ${
                    activeId === c.id ? themeActive : ''
                  }`}
                >
                  {c.is_group ? (
                    <div className="relative shrink-0" style={{ width: 53, height: 49 }}>
                      <GroupAvatars conv={c} me={me} size={32} />
                      <div className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center text-[9px] font-bold shadow border border-white/60">
                        {Math.max(0, c.member_ids.length - 1)}
                      </div>
                    </div>
                  ) : (
                    <Avatar
                      name={name}
                      id={otherProfile?.id ?? c.id}
                      src={avatarSrc}
                      size={49}
                      online={online}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold truncate ${themeTextPrimary}`}>{name}</span>
                      {last && (
                        <span className={`text-[11px] shrink-0 ml-2 ${c.unread_count ? 'text-[#00a884] font-semibold' : themeTextSecondary}`}>
                          {formatChatListTime(last.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-sm truncate flex items-center gap-1 ${themeTextSecondary}`}>
                        {isOut && last && <Ticks status={last.status as any} out size={14} />}
                        {c.is_group && last && !isOut ? (
                          <span className="truncate">
                            <span style={{ color: getProfile(last.sender_id)?.avatar_color ?? '#00a884' }}>
                              {getProfile(last.sender_id)?.name.split(' ')[0]}
                            </span>
                            : {previewText({ ...last, body: last?.body ?? '' } as any)}
                          </span>
                        ) : last?.type === 'voice' ? (
                          <span className="inline-flex items-center gap-1">🎤 Voice message · {last.duration_sec ?? 0}s</span>
                        ) : last?.type === 'poll' ? (
                          <span className="inline-flex items-center gap-1">📊 Poll · {last.poll?.question ?? ''}</span>
                        ) : last?.type === 'image' ? (
                          <span className="inline-flex items-center gap-1">🖼️ {last.body || 'Photo'}</span>
                        ) : (
                          <span>{previewText({ ...last, body: last?.body ?? '' } as any)}</span>
                        )}
                      </span>
                      {c.unread_count ? (
                        <span className="ml-2 shrink-0 min-w-[22px] h-5 px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-sm shadow-emerald-500/20"
                          style={{ background: 'linear-gradient(135deg, #00a884, #25d366)' }}
                        >
                          {c.unread_count > 99 ? '99+' : c.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredNewProfiles.length > 0 && (
              <>
                <div className={`px-3 pt-3 pb-1 text-[11px] font-semibold ${isDark ? 'text-emerald-300' : 'text-[#00a884]'}`}>
                  {filteredConversations.length > 0 ? 'Other contacts' : 'Contacts'}
                </div>
                {filteredNewProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const conv = getOrCreateConversation(p.id);
                      onSelect(conv.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl ${themeHover} transition-colors text-left`}
                  >
                    <Avatar name={p.name} id={p.id} src={p.avatar_url} size={49} online={p.is_online} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${themeTextPrimary}`}>{p.name}</div>
                      <div className={`text-sm truncate ${themeTextSecondary}`}>Tap to start chat</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className={`shrink-0 flex items-center gap-3 px-3 py-2.5 border-t ${themeBorder} ${themeHover}`}>
        <Avatar name={me.name} id={me.id} src={me.avatar_url} size={36} online />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate ${themeTextPrimary}`}>{me.name}</div>
          <div className={`text-xs truncate ${themeTextSecondary}`}>{me.about}</div>
        </div>
        <Circle size={14} className={`${themeTextSecondary} opacity-40`} />
      </div>
    </div>
  );

  function unviewedCount() {
    return statuses.filter((s) => !s.viewed).length;
  }
}
