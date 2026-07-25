import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  fetchMessages,
  decryptMessages,
  markReceipts,
  updateLastRead,
  deleteMessage,
} from '@/lib/chat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { formatDateSeparator, sameDay, displayName, formatLastSeen } from '@/lib/format';
import type { ConversationWithMeta, Message, Profile, MessageStatus } from '@/types/database';

interface ConversationViewProps {
  conversation: ConversationWithMeta;
  onBack: () => void;
  onInfo: () => void;
}

type PresenceMap = Record<string, { is_online: boolean; last_seen: string }>;
type ReceiptMap = Record<string, Record<string, MessageStatus>>;

export function ConversationView({ conversation, onBack, onInfo }: ConversationViewProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typing, setTyping] = useState(false);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [receipts, setReceipts] = useState<ReceiptMap>({});
  const [members, setMembers] = useState<Profile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastReadAt = conversation.members.find((m) => m.user_id === profile?.id)?.last_read_at;

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    setReceipts({});

    (async () => {
      const mems = conversation.members.map((m) => m.profile).filter(Boolean) as Profile[];
      setMembers(mems);
      const raw = await fetchMessages(conversation.id);
      if (cancelled) return;
      const decrypted = await decryptMessages(conversation.id, conversation.is_group, mems, raw);
      if (cancelled) return;
      setMessages(decrypted);
      setLoading(false);

      // Mark delivered + read
      await markReceipts(conversation.id, 'delivered');
      await markReceipts(conversation.id, 'read');
      await updateLastRead(conversation.id);

      // Load receipts for these messages
      await loadReceipts(decrypted);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Realtime: new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch sender profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .maybeSingle();
          const enriched: Message = { ...newMsg, sender: sender as Profile | undefined };
          const decrypted = await decryptMessages(conversation.id, conversation.is_group, members, [enriched]);
          setMessages((prev) => [...prev, decrypted[0]]);
          if (newMsg.sender_id !== profile?.id) {
            await markReceipts(conversation.id, 'delivered');
            await markReceipts(conversation.id, 'read');
            await updateLastRead(conversation.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const deleted = payload.old as Message;
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, members, profile?.id]);

  // Realtime: presence for other members
  useEffect(() => {
    const otherIds = conversation.members
      .filter((m) => m.user_id !== profile?.id)
      .map((m) => m.user_id);
    if (otherIds.length === 0) return;

    const init: PresenceMap = {};
    otherIds.forEach((id) => {
      const m = conversation.members.find((mm) => mm.user_id === id);
      if (m?.profile) init[id] = { is_online: m.profile.is_online, last_seen: m.profile.last_seen };
    });
    setPresence(init);

    const channel = supabase
      .channel(`presence:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=in.(${otherIds.join(',')})` },
        (payload) => {
          const p = payload.new as Profile;
          setPresence((prev) => ({
            ...prev,
            [p.id]: { is_online: p.is_online, last_seen: p.last_seen },
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, conversation.members.length, profile?.id]);

  // Realtime: typing indicator via broadcast
  useEffect(() => {
    const channel = supabase.channel(`typing:${conversation.id}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { userId, typing: t } = payload.payload as { userId: string; typing: boolean };
      if (userId !== profile?.id) {
        setTyping(t);
        if (t) {
          window.setTimeout(() => setTyping(false), 3000);
        }
      }
    });

    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, profile?.id]);

  // Realtime: receipts
  useEffect(() => {
    const channel = supabase
      .channel(`receipts:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_receipts' },
        (payload) => {
          const row = payload.new as { message_id: string; user_id: string; status: MessageStatus };
          if (row.user_id !== profile?.id) {
            setReceipts((prev) => ({
              ...prev,
              [row.message_id]: { ...prev[row.message_id], [row.user_id]: row.status },
            }));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, profile?.id]);

  const loadReceipts = useCallback(async (msgs: Message[]) => {
    const ids = msgs.map((m) => m.id);
    if (ids.length === 0) return;
    const { data } = await supabase
      .from('message_receipts')
      .select('message_id, user_id, status')
      .in('message_id', ids);
    if (!data) return;
    const map: ReceiptMap = {};
    for (const r of data) {
      if (!map[r.message_id]) map[r.message_id] = {};
      map[r.message_id][r.user_id] = r.status as MessageStatus;
    }
    setReceipts(map);
  }, []);

  const sendTyping = (t: boolean) => {
    const channel = supabase.channel(`typing:${conversation.id}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: profile?.id, typing: t },
        });
      }
    });
  };

  const handleSent = (m: Message) => {
    setMessages((prev) => [...prev, m]);
  };

  const handleDelete = async (m: Message) => {
    try {
      await deleteMessage(m.id);
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) {
      console.error('delete error:', err);
    }
  };

  // Compute the receipt status to display for an outgoing message:
  // read if any recipient marked read; else delivered if any marked delivered;
  // else sent.
  const receiptStatusFor = (msg: Message): MessageStatus | undefined => {
    if (msg.sender_id !== profile?.id) return undefined;
    const r = receipts[msg.id];
    if (!r) return 'sent';
    const statuses = Object.values(r);
    if (statuses.some((s) => s === 'read')) return 'read';
    if (statuses.some((s) => s === 'delivered')) return 'delivered';
    return 'sent';
  };

  const otherProfile = conversation.members.find((m) => m.user_id !== profile?.id)?.profile;
  const otherPresence = otherProfile ? presence[otherProfile.id] : undefined;
  const presenceText = conversation.is_group
    ? `${conversation.members.length} members`
    : otherPresence
      ? otherPresence.is_online
        ? 'online'
        : formatLastSeen({ ...otherProfile!, is_online: otherPresence.is_online, last_seen: otherPresence.last_seen })
      : formatLastSeen(otherProfile);

  return (
    <div className="flex flex-col h-full wa-chat-bg">
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onInfo={onInfo}
        presenceText={presenceText}
        typing={typing}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#667781] text-sm">
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6 text-center">
            <div className="bg-[#fff6d1] text-[#54462a] text-xs px-3 py-2 rounded-lg shadow-sm max-w-xs">
              Messages are end-to-end encrypted. No one outside of this chat can read them.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const showDateSep = !prev || !sameDay(prev.created_at, m.created_at);
              const showName = conversation.is_group && m.sender_id !== profile?.id && (!prev || prev.sender_id !== m.sender_id);
              const showAvatar = conversation.is_group && m.sender_id !== profile?.id && (!next || next.sender_id !== m.sender_id);
              const sender = m.sender ?? members.find((mem) => mem.id === m.sender_id);
              const replyToMsg = m.reply_to ? messages.find((x) => x.id === m.reply_to) : null;
              return (
                <div key={m.id}>
                  {showDateSep && (
                    <div className="flex justify-center my-3">
                      <span className="bg-[#fff6d1] text-[#54462a] text-xs px-3 py-1 rounded-lg shadow-sm">
                        {formatDateSeparator(m.created_at)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={m}
                    out={m.sender_id === profile?.id}
                    showAvatar={showAvatar}
                    showName={showName}
                    isGroup={conversation.is_group}
                    sender={sender}
                    replyTo={replyToMsg}
                    receiptsStatus={receiptStatusFor(m)}
                    onReply={setReplyTo}
                    onDelete={m.sender_id === profile?.id ? handleDelete : undefined}
                  />
                </div>
              );
            })}
            {typing && (
              <div className="flex px-3 py-1">
                <div className="bubble-in rounded-lg px-3 py-2 shadow-sm ml-1">
                  <div className="flex gap-1">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#667781]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#667781]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#667781]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageInput
        conversationId={conversation.id}
        replyTo={replyTo}
        onReplyClear={() => setReplyTo(null)}
        onSent={handleSent}
        onTyping={sendTyping}
      />
    </div>
  );
}
