import { useState, useRef, useEffect } from 'react';
import {
  Smile, Paperclip, Mic, Send, X, CornerUpLeft, Image as ImageIcon,
  FileText, BarChart3, Trash2, StopCircle, Check,
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import type {
  Theme, PollData, PollOption, VoiceNote, Message as LocalMessage,
} from '@/lib/localStore';

interface ReplyMessageLike {
  id: string;
  sender_id: string;
  body: string;
  type: string;
}

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: (url: string, caption?: string) => void;
  onSendVoice: (v: VoiceNote) => void;
  onSendPoll: (p: PollData) => void;
  replyTo: ReplyMessageLike | null;
  onReplyClear: () => void;
  theme: Theme;
}

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
];

export function MessageInput({
  onSendText, onSendImage, onSendVoice, onSendPoll,
  replyTo, onReplyClear, theme,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark = theme === 'dark';
  const t = {
    rowBg: isDark ? 'bg-white/[0.04]' : 'bg-white/60',
    border: isDark ? 'border-white/[0.07]' : 'border-white/60',
    iconColor: isDark ? 'text-white/70' : 'text-slate-600',
    iconHover: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-900/5',
    panelBg: isDark ? 'bg-[#1a2332]/95 border-white/10' : 'bg-white/95 border-white/80',
    textPrimary: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-white/60' : 'text-slate-500',
    inputBg: isDark ? 'bg-white/[0.05] text-white placeholder:text-white/40' : 'bg-white text-slate-900 placeholder:text-slate-400',
  };

  const sendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, '']);
  };
  const removePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };
  const changePollOption = (idx: number, v: string) => {
    const copy = [...pollOptions];
    copy[idx] = v;
    setPollOptions(copy);
  };

  const submitPoll = () => {
    const q = pollQuestion.trim();
    const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) return;
    const poll: PollData = {
      question: q,
      allow_multiple: false,
      created_by: 'self',
      options: opts.map<PollOption>((t, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text: t,
        voter_ids: [],
      })),
    };
    onSendPoll(poll);
    setPollOpen(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const sendDemoImage = (url: string) => {
    onSendImage(url, text.trim() || undefined);
    setText('');
    setAttachOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAttachOpen(false);
        setEmojiOpen(false);
        setPollOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`px-3 py-2.5 ${t.rowBg} border-t ${t.border} backdrop-blur-xl shrink-0`}>
      {replyTo && (
        <div className={`mb-2 flex items-start gap-2 rounded-xl px-3 py-2 border-l-4 border-emerald-500 ${isDark ? 'bg-white/5' : 'bg-white/80'}`}>
          <CornerUpLeft size={15} className={`mt-0.5 ${t.iconColor}`} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-emerald-500">
              {replyTo.sender_id === 'self' ? 'You' : 'Reply to'}
            </div>
            <div className={`text-sm truncate ${t.textSecondary}`}>
              {replyTo.type === 'text' ? replyTo.body : `[${replyTo.type}]`}
            </div>
          </div>
          <button onClick={onReplyClear} className={`${t.iconColor} hover:opacity-80`}>
            <X size={16} />
          </button>
        </div>
      )}

      {recording && (
        <VoiceRecorder
          theme={theme}
          onCancel={() => setRecording(false)}
          onSend={(v) => {
            onSendVoice(v);
            setRecording(false);
          }}
        />
      )}

      {!recording && (
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => { setAttachOpen((v) => !v); setEmojiOpen(false); setPollOpen(false); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${t.iconColor} ${t.iconHover} spring-hover`}
              title="Attach"
            >
              <Paperclip size={20} />
            </button>
            {attachOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAttachOpen(false)} />
                <div className={`absolute bottom-full left-0 mb-2 ${t.panelBg} rounded-2xl shadow-2xl border py-2 min-w-[220px] z-20 animate-pop backdrop-blur-2xl`}>
                  <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase opacity-60">Photos (demo)</div>
                  <div className="grid grid-cols-4 gap-1.5 px-2 pb-2">
                    {DEMO_IMAGES.map((url) => (
                      <button
                        key={url}
                        onClick={() => sendDemoImage(url)}
                        className="rounded-lg overflow-hidden w-12 h-12 hover:scale-110 transition-transform ring-1 ring-black/5 hover:ring-emerald-400/60"
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="h-px opacity-10 bg-white mx-2 my-1" />
                  <button
                    onClick={() => { sendDemoImage(DEMO_IMAGES[0]); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${t.textPrimary} ${t.iconHover}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white">
                      <ImageIcon size={14} />
                    </div>
                    <div>
                      <div className="font-medium">Send Photo</div>
                      <div className={`text-xs opacity-60 ${t.textSecondary}`}>Random scenic demo image</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSendImage(DEMO_IMAGES[1], text.trim() || 'Here is the document preview:');
                      setText('');
                      setAttachOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${t.textPrimary} ${t.iconHover}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white">
                      <FileText size={14} />
                    </div>
                    <div>
                      <div className="font-medium">Document (demo)</div>
                      <div className={`text-xs opacity-60 ${t.textSecondary}`}>Mock PDF attachment with preview</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setPollOpen(true);
                      setAttachOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${t.textPrimary} ${t.iconHover}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                      <BarChart3 size={14} />
                    </div>
                    <div>
                      <div className="font-medium">Create Poll</div>
                      <div className={`text-xs opacity-60 ${t.textSecondary}`}>Interactive live vote question</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative flex-1">
            <div className={`${isDark ? 'bg-white/[0.05]' : 'bg-white'} rounded-2xl px-3 py-2 flex items-end gap-2 border ${t.border}`}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  autoResize(e.currentTarget);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                placeholder="Type a message"
                rows={1}
                className={`flex-1 outline-none text-sm resize-none leading-relaxed bg-transparent ${t.inputBg}`}
                style={{ minHeight: '20px', maxHeight: '120px' }}
              />
              <div className="relative">
                <button
                  onClick={() => { setEmojiOpen((v) => !v); setAttachOpen(false); setPollOpen(false); }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${t.iconColor} ${t.iconHover} mb-1`}
                  title="Emoji"
                >
                  <Smile size={20} />
                </button>
                {emojiOpen && (
                  <EmojiPicker
                    anchor="bottom"
                    theme={theme}
                    onClose={() => setEmojiOpen(false)}
                    onPick={(e) => {
                      setText((prev) => (prev + e));
                      textareaRef.current?.focus();
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {text.trim() ? (
            <button
              onClick={sendText}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all"
              title="Send"
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              onClick={() => { setRecording(true); setAttachOpen(false); setEmojiOpen(false); setPollOpen(false); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-500/20 spring-hover`}
              title="Voice message"
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      )}

      {pollOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setPollOpen(false)} />
          <div className={`absolute left-0 right-0 bottom-20 mx-auto max-w-md ${t.panelBg} backdrop-blur-2xl rounded-2xl p-5 border shadow-2xl z-40 animate-pop`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-lg ${t.textPrimary} flex items-center gap-2`}>
                <BarChart3 size={18} className="text-amber-500" /> Create Poll
              </h3>
              <button onClick={() => setPollOpen(false)} className={`w-8 h-8 rounded-full flex items-center justify-center ${t.iconColor} ${t.iconHover}`}>
                <X size={16} />
              </button>
            </div>
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className={`w-full rounded-xl px-3 py-2.5 border ${t.border} ${t.inputBg} mb-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
            />
            <div className="space-y-2 mb-3">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</div>
                  <input
                    value={opt}
                    onChange={(e) => changePollOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className={`flex-1 rounded-xl px-3 py-2 border ${t.border} ${t.inputBg} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(i)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500/10`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={addPollOption}
                disabled={pollOptions.length >= 6}
                className={`text-sm px-3 py-1.5 rounded-xl font-medium ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} disabled:opacity-40`}
              >
                + Add option
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setPollOpen(false); setPollQuestion(''); setPollOptions(['', '']); }}
                  className={`text-sm px-4 py-1.5 rounded-xl font-medium ${t.iconHover} ${t.textSecondary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={submitPoll}
                  disabled={!pollQuestion.trim() || pollOptions.filter(Boolean).length < 2}
                  className="text-sm px-4 py-1.5 rounded-xl font-medium text-white bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check size={14} /> Send Poll
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
