import { useState, useEffect, useRef, useMemo } from 'react';
import {
  getMessagesForConversation,
  sendMessage as storeSendMessage,
  sendImage as storeSendImage,
  sendVoice as storeSendVoice,
  sendPoll as storeSendPoll,
  markConversationRead,
  updateMessageStatus,
  incrementUnread,
  getProfile,
  getCurrentUser,
  scheduleAutoReply,
  deleteMessage,
  type Message as LocalMessage,
  type Conversation as LocalConversation,
  type Theme,
  type PollData,
  type VoiceNote,
  CURRENT_USER_ID,
} from '@/lib/localStore';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { formatDateSeparator, sameDay, formatLastSeen, displayName } from '@/lib/format';
import type { MessageStatus } from '@/types/database';

interface ConversationViewProps {
  conversation: LocalConversation;
  onBack: () => void;
  theme: Theme;
  onNewMessage: () => void;
  onChange: () => void;
  onCall: (kind: 'voice' | 'video') => void;
  onReloadShowcase: () => void;
}

export function ConversationView({
  conversation, onBack, theme, onNewMessage, onChange, onCall, onReloadShowcase,
}: ConversationViewProps) {
  const me = getCurrentUser();
  const otherProfileId = useMemo(
    () => conversation.member_ids.find((id) => id !== me.id),
    [conversation.id, me.id]
  );
  const otherProfile = useMemo(
    () => (otherProfileId ? getProfile(otherProfileId) : undefined),
    [otherProfileId]
  );

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [replyTo, setReplyTo] = useState<LocalMessage | null>(null);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoReplyPendingRef = useRef<boolean>(false);

  const reloadMessages = () => {
    const msgs = getMessagesForConversation(conversation.id);
    setMessages(msgs);
  };

  useEffect(() => {
    reloadMessages();
    markConversationRead(conversation.id);
    onNewMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages.length, conversation.id]);

  const handleSent = (msg: LocalMessage) => {
    setMessages((prev) => [...prev, msg]);
    onNewMessage();
    onChange();

    setTimeout(() => {
      updateMessageStatus(msg.id, 'delivered');
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'delivered' } : m)));
    }, 450);
    setTimeout(() => {
      updateMessageStatus(msg.id, 'read');
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'read' } : m)));
    }, 1700);

    if (!autoReplyPendingRef.current && otherProfileId && !conversation.is_group) {
      autoReplyPendingRef.current = true;
      setTyping(true);

      scheduleAutoReply(conversation.id, otherProfileId).then((replyMsg) => {
        setTyping(false);
        autoReplyPendingRef.current = false;
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === replyMsg.id);
          if (exists) return prev;
          return [...prev, replyMsg];
        });
        onNewMessage();
        onChange();
      });
    }
  };

  const handleDelete = (m: LocalMessage) => {
    deleteMessage(m.id);
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    onNewMessage();
    onChange();
  };

  const handleSendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg = storeSendMessage(conversation.id, trimmed, replyTo?.id ?? null);
    setReplyTo(null);
    handleSent(msg);
  };

  const handleSendImage = (url: string, caption?: string) => {
    const msg = storeSendImage(conversation.id, url, caption || '');
    handleSent(msg);
  };

  const handleSendVoice = (v: VoiceNote) => {
    const msg = storeSendVoice(conversation.id, v);
    handleSent(msg);
  };

  const handleSendPoll = (p: PollData) => {
    const msg = storeSendPoll(conversation.id, p);
    handleSent(msg);
  };

  const handleBubbleChange = () => {
    reloadMessages();
    onChange();
  };

  const presenceText = conversation.is_group
    ? `${conversation.member_ids.length} members`
    : otherProfile
      ? formatLastSeen(otherProfile as any)
      : '';

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full wa-chat-bg">
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        presenceText={presenceText}
        typing={typing}
        theme={theme}
        onCall={onCall}
        onReloadShowcase={onReloadShowcase}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 px-2 md:px-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6 text-center">
            <div className="glass-card px-5 py-3 rounded-2xl max-w-sm animate-pop">
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                Messages are end-to-end encrypted. No one outside of this chat can read them.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-w-4xl mx-auto">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const showDateSep = !prev || !sameDay(prev.created_at, m.created_at);
              const replyToMsg = m.reply_to ? messages.find((x) => x.id === m.reply_to) : null;
              const out = m.sender_id === me.id;
              const senderProfile = m.sender_id === me.id ? undefined : getProfile(m.sender_id);
              const showAvatar =
                conversation.is_group && !out &&
                  (i === messages.length - 1 || messages[i + 1]?.sender_id !== m.sender_id);
              const showName = conversation.is_group && !out &&
                (!prev || prev.sender_id !== m.sender_id);
              return (
                <div key={m.id}>
                  {showDateSep && (
                    <div className="flex justify-center my-4">
                      <span className="glass-card px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-sm">
                        {formatDateSeparator(m.created_at)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={m}
                    out={out}
                    showAvatar={!!showAvatar}
                    showName={showName}
                    isGroup={conversation.is_group}
                    sender={senderProfile}
                    replyTo={replyToMsg ?? null}
                    receiptsStatus={m.status as MessageStatus | undefined}
                    onReply={setReplyTo}
                    onDelete={out ? handleDelete : undefined}
                    theme={theme}
                    onChange={handleBubbleChange}
                  />
                </div>
              );
            })}
            {typing && (
              <div className="flex px-3 py-1.5 animate-msg-in">
                <div className="rounded-2xl px-4 py-2.5 shadow-sm ml-1 glass-bubble-in">
                  <div className="flex gap-1 items-center h-5">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageInput
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        onSendVoice={handleSendVoice}
        onSendPoll={handleSendPoll}
        replyTo={replyTo ? {
          id: replyTo.id,
          sender_id: replyTo.sender_id,
          body: replyTo.body ?? '',
          type: replyTo.type,
        } : null}
        onReplyClear={() => setReplyTo(null)}
        theme={theme}
      />
    </div>
  );
}
