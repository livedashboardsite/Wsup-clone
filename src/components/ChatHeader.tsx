import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, MoreVertical, Phone, Video, Search,
} from 'lucide-react';
import { Avatar } from './Avatar';
import {
  getCurrentUser, getProfile,
  type Conversation as LocalConversation,
  type Theme,
} from '@/lib/localStore';

interface ChatHeaderProps {
  conversation: LocalConversation;
  onBack: () => void;
  presenceText: string;
  typing: boolean;
  theme: Theme;
  onCall: (kind: 'voice' | 'video') => void;
}

export function ChatHeader({ conversation, onBack, presenceText, typing, theme, onCall }: ChatHeaderProps) {
  const me = getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const otherId = conversation.member_ids.find((m) => m !== me.id);
  const other = otherId ? getProfile(otherId) : undefined;

  const name = conversation.is_group ? conversation.name ?? 'Group' : other?.name ?? 'Unknown';
  const avatarSrc = conversation.is_group ? conversation.avatar_url : other?.avatar_url;
  const online = !conversation.is_group && other?.is_online;

  const subtitle = typing
    ? <span className="text-emerald-500">typing…</span>
    : <span>{presenceText}</span>;

  const isDark = theme === 'dark';
  const themeBg = isDark ? 'bg-[#202c33]/90' : 'bg-white/80';
  const themeTextPrimary = isDark ? 'text-white' : 'text-[#111b21]';
  const themeTextSecondary = isDark ? 'text-white/65' : 'text-[#667781]';
  const themeIconColor = isDark ? 'text-white/70' : 'text-[#667781]';
  const themeHover = isDark ? 'hover:bg-white/10' : 'hover:bg-slate-900/5';
  const themeBorder = isDark ? 'border-white/[0.06]' : 'border-white/60';
  const themeMenuBg = isDark ? 'bg-[#233138]/95' : 'bg-white/95';
  const menuItemHover = isDark ? 'hover:bg-white/10' : 'hover:bg-slate-900/5';

  // Stacked avatars for groups (mini previews)
  const groupMemberAvatars = conversation.is_group
    ? conversation.member_ids
        .filter((id) => id !== me.id)
        .slice(0, 3)
        .map((id) => getProfile(id))
        .filter(Boolean)
    : [];

  return (
    <div className={`${themeBg} backdrop-blur-xl px-3 py-2 flex items-center gap-3 shrink-0 border-b ${themeBorder}`}>
      <button
        onClick={onBack}
        className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center ${themeIconColor} ${themeHover}`}
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
        {conversation.is_group ? (
          <div className="relative shrink-0" style={{ width: 48, height: 40 }}>
            {groupMemberAvatars.map((p, i) => (
              p ? (
                <div
                  key={p.id}
                  className="absolute"
                  style={{ left: i * 14, top: i === 1 ? 4 : 0 }}
                >
                  <div className="rounded-full border-2 overflow-hidden shadow-sm" style={{ width: 32, height: 32, borderColor: isDark ? '#202c33' : '#ffffff' }}>
                    <Avatar name={p.name} id={p.id} src={p.avatar_url} size={32} />
                  </div>
                </div>
              ) : null
            ))}
          </div>
        ) : (
          <Avatar
            name={name}
            id={other?.id ?? conversation.id}
            src={avatarSrc}
            size={40}
            online={online}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold truncate ${themeTextPrimary}`}>{name}</div>
          <div className={`text-xs truncate ${themeTextSecondary}`}>{subtitle}</div>
        </div>
      </div>
      <div className={`flex items-center gap-1 ${themeIconColor}`}>
        <button
          onClick={() => onCall('video')}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${themeHover} spring-hover`}
          title="Video call"
        >
          <Video size={20} />
        </button>
        <button
          onClick={() => onCall('voice')}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${themeHover} spring-hover`}
          title="Voice call"
        >
          <Phone size={18} />
        </button>
        <button className={`w-9 h-9 rounded-full flex items-center justify-center ${themeHover}`} title="Search">
          <Search size={18} />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${themeHover}`}
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className={`absolute right-0 top-full mt-1 ${themeMenuBg} backdrop-blur-xl rounded-md shadow-lg border ${themeBorder} py-1 min-w-[160px] z-20 animate-pop`}>
                <button onClick={() => setMenuOpen(false)} className={`w-full text-left text-sm px-4 py-2 ${menuItemHover} ${themeTextPrimary}`}>
                  Contact info
                </button>
                <button onClick={() => setMenuOpen(false)} className={`w-full text-left text-sm px-4 py-2 ${menuItemHover} ${themeTextPrimary}`}>
                  Select messages
                </button>
                <button onClick={() => setMenuOpen(false)} className={`w-full text-left text-sm px-4 py-2 ${menuItemHover} ${themeTextPrimary}`}>
                  Mute notifications
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
