import { useState, useEffect, useCallback } from 'react';
import { X, Search, Check, ArrowLeft, Users } from 'lucide-react';
import { Avatar } from './Avatar';
import { listAllProfiles, createDirectConversation, createGroupConversation } from '@/lib/chat';
import { useAuth } from '@/lib/auth';
import { displayName } from '@/lib/format';
import type { Profile } from '@/types/database';

interface NewChatModalProps {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function NewChatModal({ onClose, onCreated }: NewChatModalProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [step, setStep] = useState<'pick' | 'name'>('pick');
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  useEffect(() => {
    let active = true;
    listAllProfiles().then((p) => {
      if (active) {
        setContacts(p);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const filtered = contacts.filter((c) =>
    !query || displayName(c).toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startDirect = async (otherId: string) => {
    setCreating(true);
    try {
      const conv = await createDirectConversation(otherId);
      onCreated(conv.id);
    } catch (err) {
      console.error('createDirect error:', err);
    } finally {
      setCreating(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.size === 0) return;
    setCreating(true);
    try {
      const conv = await createGroupConversation(groupName.trim(), Array.from(selected));
      onCreated(conv.id);
    } catch (err) {
      console.error('createGroup error:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 mist-modal-overlay flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${
        closing ? 'opacity-0' : 'opacity-100 animate-fade-in'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="New chat"
    >
      <div
        className={`mist-modal-bg rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] border transition-all duration-200 ease-out border-white/40 ${
          closing ? 'scale-95 opacity-0 translate-y-2' : 'scale-100 opacity-100 translate-y-0 animate-slide-up'
        }`}
      >
        {step === 'name' ? (
          <>
            <div className="px-4 py-3 text-white flex items-center gap-3 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #008069 0%, #0284c7 100%)' }}>
              <button
                onClick={() => setStep('pick')}
                className="spring-hover hover:bg-white/10 active:scale-95 rounded-full p-1.5 transition-all"
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold">New group</h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#008069] flex items-center justify-center text-white">
                  <Users size={22} />
                </div>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  autoFocus
                  className="flex-1 border-b border-[#e9edef] outline-none py-2 text-sm focus:border-[#008069]"
                />
              </div>
              <div className="text-xs text-[#667781] mb-2">{selected.size} members selected</div>
              <div className="space-y-1">
                {contacts.filter((c) => selected.has(c.id)).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2">
                    <Avatar name={displayName(c)} id={c.id} src={c.avatar_url} size={36} />
                    <span className="text-sm">{displayName(c)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-[#e9edef]">
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || creating}
                className="w-full bg-[#008069] hover:bg-[#005c4b] disabled:opacity-60 text-white font-medium py-2.5 rounded-md"
              >
                {creating ? 'Creating…' : 'Create group'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="px-4 py-3 text-white flex items-center justify-between rounded-t-2xl"
              style={{ background: 'linear-gradient(135deg, #008069 0%, #0284c7 100%)' }}
            >
              <h2 className="text-lg font-semibold">{groupMode ? 'Add group members' : 'New chat'}</h2>
              <button
                onClick={handleClose}
                className="spring-hover hover:bg-white/10 active:scale-95 rounded-full p-1.5 transition-all"
                aria-label="Close"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClose();
                  }
                }}
              >
                <X size={20} strokeWidth={2.25} />
              </button>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-lg px-3 py-2">
                <Search size={16} className="text-[#667781]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search contacts"
                  className="flex-1 outline-none text-sm bg-transparent"
                />
              </div>
            </div>
            {!groupMode && (
              <button
                onClick={() => setGroupMode(true)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0f2f5] transition-colors w-full text-left border-b border-[#f0f2f5]"
              >
                <div className="w-12 h-12 rounded-full bg-[#008069] text-white flex items-center justify-center">
                  <Users size={22} />
                </div>
                <span className="font-medium text-sm">New group</span>
              </button>
            )}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-sm text-[#667781]">Loading contacts…</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#667781]">
                  {query ? 'No contacts found.' : 'No contacts yet. Invite someone to join!'}
                </div>
              ) : (
                filtered.map((c) => {
                  const isSel = selected.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => (groupMode ? toggle(c.id) : startDirect(c.id))}
                      disabled={creating}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f2f5] transition-colors text-left disabled:opacity-60"
                    >
                      <Avatar name={displayName(c)} id={c.id} src={c.avatar_url} size={44} online={c.is_online} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{displayName(c)}</div>
                        <div className="text-xs text-[#667781] truncate">{c.about}</div>
                      </div>
                      {groupMode && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSel ? 'bg-[#008069] border-[#008069]' : 'border-[#e9edef]'}`}>
                          {isSel && <Check size={14} className="text-white" />}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            {groupMode && (
              <div className="p-3 border-t border-[#e9edef]">
                <button
                  onClick={() => setStep('name')}
                  disabled={selected.size === 0}
                  className="w-full bg-[#008069] hover:bg-[#005c4b] disabled:opacity-60 text-white font-medium py-2.5 rounded-md flex items-center justify-center gap-2"
                >
                  Next ({selected.size})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
