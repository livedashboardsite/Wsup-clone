import { X, Bell, BellOff, Lock, Trash2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuth } from '@/lib/auth';
import { displayName, formatLastSeen } from '@/lib/format';
import type { ConversationWithMeta } from '@/types/database';

interface InfoPanelProps {
  conversation: ConversationWithMeta;
  onClose: () => void;
}

export function InfoPanel({ conversation, onClose }: InfoPanelProps) {
  const { profile } = useAuth();
  const other = conversation.members.find((m) => m.user_id !== profile?.id)?.profile;
  const name = conversation.is_group ? conversation.name ?? 'Group' : displayName(other);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 rounded-full p-1">
          <X size={20} />
        </button>
        <h1 className="text-lg font-medium">{conversation.is_group ? 'Group info' : 'Contact info'}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center py-8 bg-[#f0f2f5]">
          <Avatar
            name={name}
            id={conversation.is_group ? conversation.id : (other?.id ?? conversation.id)}
            src={conversation.is_group ? conversation.avatar_url : other?.avatar_url}
            size={140}
          />
          <h2 className="text-xl font-medium mt-4">{name}</h2>
          {conversation.is_group ? (
            <p className="text-sm text-[#667781] mt-1">{conversation.members.length} members</p>
          ) : (
            <p className="text-sm text-[#667781] mt-1">
              {other?.is_online ? 'online' : formatLastSeen(other)}
            </p>
          )}
          {conversation.is_group && conversation.description && (
            <p className="text-sm text-[#667781] mt-2 px-6 text-center">{conversation.description}</p>
          )}
        </div>

        {!conversation.is_group && other && (
          <div className="px-4 py-3 border-b border-[#e9edef]">
            <div className="text-xs text-[#667781] mb-1">About</div>
            <div className="text-sm">{other.about}</div>
          </div>
        )}

        <div className="px-4 py-3 border-b border-[#e9edef] flex items-center gap-3">
          <Bell size={20} className="text-[#667781]" />
          <span className="text-sm flex-1">Notifications</span>
          <span className="text-xs text-[#667781]">On</span>
        </div>

        <div className="px-4 py-3 border-b border-[#e9edef] flex items-start gap-3">
          <Lock size={20} className="text-[#667781] mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium">End-to-end encrypted</div>
            <div className="text-xs text-[#667781]">
              Messages in this chat are secured with E2EE.
            </div>
          </div>
        </div>

        {conversation.is_group && (
          <div className="px-4 py-3">
            <div className="text-xs text-[#667781] mb-2">{conversation.members.length} members</div>
            <div className="space-y-1">
              {conversation.members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 py-2">
                  <Avatar name={displayName(m.profile)} id={m.user_id} src={m.profile?.avatar_url} size={40} online={m.profile?.is_online} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {displayName(m.profile)}
                      {m.user_id === profile?.id && <span className="text-[#667781] text-xs ml-1">(you)</span>}
                    </div>
                    <div className="text-xs text-[#667781] truncate">
                      {m.profile?.is_online ? 'online' : formatLastSeen(m.profile)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
