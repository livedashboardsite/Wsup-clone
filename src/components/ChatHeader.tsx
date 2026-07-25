import { useState } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Search } from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuth } from '@/lib/auth';
import { displayName, formatLastSeen } from '@/lib/format';
import type { ConversationWithMeta, Profile } from '@/types/database';

interface ChatHeaderProps {
  conversation: ConversationWithMeta;
  onBack: () => void;
  onInfo: () => void;
  presenceText: string;
  typing: boolean;
}

export function ChatHeader({ conversation, onBack, onInfo, presenceText, typing }: ChatHeaderProps) {
  const { profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const other = conversation.members.find((m) => m.user_id !== profile?.id)?.profile;
  const name = conversation.is_group
    ? conversation.name ?? 'Group'
    : displayName(other);

  const subtitle = typing ? (
    <span className="text-[#008069]">typing…</span>
  ) : (
    <span>{presenceText}</span>
  );

  return (
    <div className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-3 shrink-0 border-l border-[#e9edef]">
      <button
        onClick={onBack}
        className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#667781] hover:bg-[#e9edef]"
      >
        <ArrowLeft size={20} />
      </button>
      <button onClick={onInfo} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <Avatar
          name={name}
          id={conversation.is_group ? conversation.id : (other?.id ?? conversation.id)}
          src={conversation.is_group ? conversation.avatar_url : other?.avatar_url}
          size={40}
          online={!conversation.is_group && other?.is_online}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#111b21] truncate">{name}</div>
          <div className="text-xs text-[#667781] truncate">{subtitle}</div>
        </div>
      </button>
      <div className="flex items-center gap-1 text-[#667781]">
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#e9edef]" title="Video call">
          <Video size={20} />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#e9edef]" title="Voice call">
          <Phone size={18} />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#e9edef]" title="Search">
          <Search size={18} />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#e9edef]"
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-[#e9edef] py-1 min-w-[160px] z-20">
                <button onClick={() => { setMenuOpen(false); onInfo(); }} className="w-full text-left text-sm px-4 py-2 hover:bg-[#f0f2f5]">
                  Conversation info
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
