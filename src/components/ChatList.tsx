import { useState } from 'react';
import { Search, MessageSquarePlus, Users, MoreVertical, LogOut, Archive, UserPlus } from 'lucide-react';
import { Avatar } from './Avatar';
import { Ticks } from './Ticks';
import { useAuth } from '@/lib/auth';
import { displayName, formatChatListTime, previewText } from '@/lib/format';
import type { ConversationWithMeta, Profile } from '@/types/database';

interface ChatListProps {
  conversations: ConversationWithMeta[];
  profiles: Profile[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onStartDirect: (userId: string) => void;
  startingId: string | null;
  onNewChat: () => void;
  onNewGroup: () => void;
  onProfile: () => void;
}

export function ChatList({
  conversations,
  profiles,
  activeId,
  onSelect,
  onStartDirect,
  startingId,
  onNewChat,
  onNewGroup,
  onProfile,
}: ChatListProps) {
  const { profile, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // IDs of users the current user already has a 1:1 conversation with
  const existingDirectIds = new Set(
    conversations
      .filter((c) => !c.is_group)
      .flatMap((c) => c.members.map((m) => m.user_id))
      .filter((id) => id !== profile?.id)
  );

  // Profiles with no existing 1:1 conversation — shown below chats so anyone
  // who signs up can be reached directly from the panel.
  const newProfiles = profiles.filter((p) => !existingDirectIds.has(p.id));

  const matchesQuery = (name: string) =>
    !query || name.toLowerCase().includes(query.toLowerCase());

  const filteredConversations = conversations.filter((c) =>
    matchesQuery(convName(c))
  );
  const filteredNewProfiles = newProfiles.filter((p) =>
    matchesQuery(displayName(p))
  );

  const hasConversations = filteredConversations.length > 0;
  const hasNewProfiles = filteredNewProfiles.length > 0;
  const isEmpty = !hasConversations && !hasNewProfiles;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold text-[#111b21]">Chats</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewGroup}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#667781] hover:bg-[#e9edef] transition-colors"
            title="New group"
          >
            <Users size={20} />
          </button>
          <button
            onClick={onNewChat}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#667781] hover:bg-[#e9edef] transition-colors"
            title="New chat"
          >
            <MessageSquarePlus size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#667781] hover:bg-[#e9edef] transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-[#e9edef] py-1 min-w-[160px] z-20">
                  <button
                    onClick={() => { setMenuOpen(false); onProfile(); }}
                    className="w-full text-left text-sm px-4 py-2 hover:bg-[#f0f2f5] flex items-center gap-2"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="w-full text-left text-sm px-4 py-2 hover:bg-[#f0f2f5] text-[#d93025] flex items-center gap-2"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-lg px-3 py-1.5">
          <Search size={16} className="text-[#667781]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="flex-1 outline-none text-sm bg-transparent text-[#111b21] placeholder:text-[#667781]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center text-[#667781]">
            <Archive size={40} className="mb-3 opacity-40" />
            <p className="text-sm">
              {query ? 'No contacts match your search.' : 'No conversations yet. Start a new chat!'}
            </p>
          </div>
        ) : (
          <>
            {hasConversations &&
              filteredConversations.map((c) => {
                const name = convName(c);
                const last = c.last_message;
                const other = c.members.find((m) => m.user_id !== profile?.id)?.profile;
                const online = !c.is_group && other?.is_online;
                const isOut = last?.sender_id === profile?.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#f5f6f6] transition-colors text-left border-b border-[#f0f2f5] ${
                      activeId === c.id ? 'bg-[#f0f2f5]' : ''
                    }`}
                  >
                    <Avatar
                      name={name}
                      id={c.is_group ? c.id : (other?.id ?? c.id)}
                      src={c.is_group ? c.avatar_url : other?.avatar_url}
                      size={49}
                      online={online}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#111b21] truncate">{name}</span>
                        {last && (
                          <span className={`text-xs shrink-0 ml-2 ${c.unread_count ? 'text-[#008069] font-medium' : 'text-[#667781]'}`}>
                            {formatChatListTime(last.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-sm text-[#667781] truncate flex items-center gap-1">
                          {isOut && last && <Ticks status={lastReceiptStatus(last)} out size={14} />}
                          {previewText(last)}
                        </span>
                        {c.unread_count ? (
                          <span className="ml-2 shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#25d366] text-white text-xs font-medium flex items-center justify-center">
                            {c.unread_count > 99 ? '99+' : c.unread_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}

            {hasNewProfiles && (
              <>
                <div className="px-4 py-2 text-xs font-medium text-[#008069] bg-[#f0f2f5] sticky top-0">
                  {hasConversations ? 'Other contacts' : 'Contacts'}
                </div>
                {filteredNewProfiles.map((p) => {
                  const isStarting = startingId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onStartDirect(p.id)}
                      disabled={isStarting}
                      className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#f5f6f6] transition-colors text-left border-b border-[#f0f2f5] disabled:opacity-60 ${
                        activeId === `new:${p.id}` ? 'bg-[#f0f2f5]' : ''
                      }`}
                    >
                      <Avatar
                        name={displayName(p)}
                        id={p.id}
                        src={p.avatar_url}
                        size={49}
                        online={p.is_online}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#111b21] truncate">{displayName(p)}</div>
                        <div className="text-sm text-[#667781] truncate flex items-center gap-1">
                          <UserPlus size={13} className="shrink-0" />
                          {isStarting ? 'Starting chat…' : 'Tap to start chat'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Profile footer */}
      <button
        onClick={onProfile}
        className="shrink-0 flex items-center gap-3 px-3 py-2.5 border-t border-[#e9edef] hover:bg-[#f0f2f5] transition-colors text-left"
      >
        <Avatar
          name={displayName(profile)}
          id={profile?.id ?? 'me'}
          src={profile?.avatar_url}
          size={36}
          online
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{displayName(profile)}</div>
          <div className="text-xs text-[#667781] truncate">{profile?.about}</div>
        </div>
      </button>
    </div>
  );
}

function convName(c: ConversationWithMeta): string {
  if (c.is_group) return c.name ?? 'Group';
  return c.members.filter((m) => true).map((m) => displayName(m.profile))[0] ?? 'Unknown';
}

// Best-effort: derive receipt status from the last message (real status comes from the detail view)
function lastReceiptStatus(_m: ConversationWithMeta['last_message']): 'sent' | 'delivered' | 'read' | undefined {
  return undefined;
}
