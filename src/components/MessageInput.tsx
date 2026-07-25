import { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Mic, Send, X, CornerUpLeft, Trash2, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadMedia, imageDimensions } from '@/lib/storage';
import { sendMediaMessage, sendTextMessage } from '@/lib/chat';
import type { Message } from '@/types/database';

interface MessageInputProps {
  conversationId: string;
  replyTo: Message | null;
  onReplyClear: () => void;
  onSent: (m: Message) => void;
  onTyping: (typing: boolean) => void;
}

type AttachTab = 'image' | 'document';

export function MessageInput({ conversationId, replyTo, onReplyClear, onSent, onTyping }: MessageInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const fileImageRef = useRef<HTMLInputElement>(null);
  const fileDocRef = useRef<HTMLInputElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    return () => {
      if (recTimerRef.current) window.clearInterval(recTimerRef.current);
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTyping = () => {
    onTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => onTyping(false), 1500);
  };

  const sendText = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    onTyping(false);
    try {
      const msg = await sendTextMessage(conversationId, trimmed, replyTo?.id ?? null);
      onSent(msg);
      onReplyClear();
    } catch (err) {
      console.error('sendText error:', err);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setAttachOpen(false);
    if (!file) return;
    setSending(true);
    try {
      const dims = await imageDimensions(file);
      const { data: me } = await supabase.auth.getUser();
      const full = await uploadMedia(file, me.user!.id, 'images');
      // Also upload a thumbnail? For simplicity use the same image (Supabase serves it).
      const msg = await sendMediaMessage(conversationId, {
        type: 'image',
        mediaUrl: full.url,
        mediaType: full.contentType,
        mediaName: file.name,
        mediaSize: full.size,
        mediaWidth: dims.width,
        mediaHeight: dims.height,
        replyTo: replyTo?.id ?? null,
      });
      onSent(msg);
      onReplyClear();
    } catch (err) {
      console.error('image upload error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setAttachOpen(false);
    if (!file) return;
    setSending(true);
    try {
      const { data: me } = await supabase.auth.getUser();
      const up = await uploadMedia(file, me.user!.id, 'documents');
      const msg = await sendMediaMessage(conversationId, {
        type: 'document',
        mediaUrl: up.url,
        mediaType: up.contentType,
        mediaName: file.name,
        mediaSize: up.size,
        replyTo: replyTo?.id ?? null,
      });
      onSent(msg);
      onReplyClear();
    } catch (err) {
      console.error('document upload error:', err);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size < 1000) {
          setRecording(false);
          setRecordSecs(0);
          return;
        }
        setSending(true);
        try {
          const { data: me } = await supabase.auth.getUser();
          const up = await uploadMedia(blob, me.user!.id, 'audio');
          const msg = await sendMediaMessage(conversationId, {
            type: 'audio',
            mediaUrl: up.url,
            mediaType: 'audio/webm',
            mediaName: 'voice-message.webm',
            mediaSize: up.size,
            durationSec: recordSecs,
            replyTo: replyTo?.id ?? null,
          });
          onSent(msg);
          onReplyClear();
        } catch (err) {
          console.error('voice upload error:', err);
        } finally {
          setSending(false);
          setRecordSecs(0);
        }
      };
      rec.start();
      mediaRecRef.current = rec;
      setRecording(true);
      setRecordSecs(0);
      recTimerRef.current = window.setInterval(() => {
        setRecordSecs((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('mic access error:', err);
      alert('Microphone access is required to record voice messages.');
    }
  };

  const stopRecording = (cancel: boolean) => {
    if (recTimerRef.current) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    const rec = mediaRecRef.current;
    if (rec && rec.state !== 'inactive') {
      if (cancel) {
        rec.onstop = null;
        rec.stop();
        setRecording(false);
        setRecordSecs(0);
      } else {
        rec.stop();
      }
    }
    mediaRecRef.current = null;
  };

  if (recording) {
    return (
      <div className="px-4 py-3 bg-[#f0f2f5] flex items-center gap-3 border-t border-[#e9edef]">
        <button
          onClick={() => stopRecording(true)}
          className="w-10 h-10 rounded-full bg-[#d93025] text-white flex items-center justify-center"
          title="Cancel"
        >
          <Trash2 size={18} />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#d93025] animate-rec-pulse" />
          <span className="text-sm text-[#667781] tabular-nums">
            {formatRecTime(recordSecs)}
          </span>
          <div className="flex-1 h-1 bg-[#e9edef] rounded-full overflow-hidden">
            <div className="h-full bg-[#d93025] w-1/3 animate-pulse" />
          </div>
        </div>
        <button
          onClick={() => stopRecording(false)}
          className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center"
          title="Send"
        >
          <Mic size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 bg-[#f0f2f5] border-t border-[#e9edef]">
      {replyTo && (
        <div className="mb-2 flex items-start gap-2 bg-white rounded-md px-3 py-2 border-l-4 border-[#008069]">
          <CornerUpLeft size={16} className="mt-0.5 text-[#667781]" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#008069]">
              {replyTo.sender_id === 'self' ? 'You' : 'Reply'}
            </div>
            <div className="text-sm text-[#667781] truncate">
              {replyTo.type === 'text' ? replyTo.body : `[${replyTo.type}]`}
            </div>
          </div>
          <button onClick={onReplyClear} className="text-[#667781] hover:text-[#111b21]">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative">
          <button
            onClick={() => setAttachOpen((v) => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#667781] hover:bg-[#e9edef] transition-colors"
            title="Attach"
          >
            <Paperclip size={20} />
          </button>
          {attachOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAttachOpen(false)} />
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-[#e9edef] py-2 min-w-[160px] z-20">
                <AttachItem icon={<ImageIcon size={18} />} label="Photos" color="#bf59cf" onClick={() => fileImageRef.current?.click()} />
                <AttachItem icon={<Paperclip size={18} />} label="Document" color="#0095dd" onClick={() => fileDocRef.current?.click()} />
              </div>
            </>
          )}
        </div>

        <div className="flex-1 bg-white rounded-lg px-3 py-2 flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            placeholder="Type a message"
            rows={1}
            className="flex-1 outline-none text-sm text-[#111b21] resize-none max-h-24 leading-relaxed"
            style={{ minHeight: '20px' }}
          />
          <Smile size={20} className="text-[#667781] shrink-0 mb-0.5" />
        </div>

        {text.trim() ? (
          <button
            onClick={sendText}
            disabled={sending}
            className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center hover:bg-[#005c4b] transition-colors disabled:opacity-60"
            title="Send"
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={sending}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#667781] hover:bg-[#e9edef] transition-colors disabled:opacity-60"
            title="Voice message"
          >
            <Mic size={20} />
          </button>
        )}
      </div>

      <input ref={fileImageRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      <input ref={fileDocRef} type="file" className="hidden" onChange={handleDocument} />
    </div>
  );
}

function AttachItem({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f0f2f5] text-sm text-[#111b21]"
    >
      <span style={{ color }} className="flex items-center justify-center">
        {icon}
      </span>
      {label}
    </button>
  );
}

function formatRecTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
