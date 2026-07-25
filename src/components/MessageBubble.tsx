import { useEffect, useRef, useState } from 'react';
import {
  CornerUpLeft, Trash2, SmilePlus, Play, Pause, Check, Heart, Laugh, Flame, ThumbsUp,
  Image as ImageIcon, FileText, Users, Download, Maximize2,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { Ticks } from './Ticks';
import { formatTime, displayName } from '@/lib/format';
import type { Message, MessageStatus } from '@/types/database';
import type { Theme, Message as LocalMessage, Profile as LocalProfile } from '@/lib/localStore';
import {
  CURRENT_USER_ID,
  toggleReaction,
  castPollVote,
  type Reaction,
  type PollData,
  type VoiceNote,
} from '@/lib/localStore';
import { EmojiPicker } from './EmojiPicker';

interface MessageBubbleProps {
  message: LocalMessage;
  out: boolean;
  showAvatar: boolean;
  showName: boolean;
  isGroup: boolean;
  sender: LocalProfile | undefined;
  replyTo?: LocalMessage | null;
  receiptsStatus?: MessageStatus;
  onReply?: (m: LocalMessage) => void;
  onDelete?: (m: LocalMessage) => void;
  theme: Theme;
  onChange: () => void;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '🔥'];

function ReactionBar({ onPick, onClose, theme }: { onPick: (e: string) => void; onClose: () => void; theme: Theme }) {
  const [expand, setExpand] = useState(false);
  const isDark = theme === 'dark';
  return (
    <div
      className={`absolute z-20 flex items-center gap-1 rounded-full px-2 py-1 shadow-xl animate-pop border ${
        isDark ? 'bg-[#233138]/95 border-white/10' : 'bg-white/95 border-white/60'
      } backdrop-blur-xl`}
      style={{ top: '-16px', left: '10px' }}
      onClick={(e) => e.stopPropagation()}
    >
      {QUICK_REACTIONS.map((e) => (
        <button
          key={e}
          onClick={() => { onPick(e); onClose(); }}
          className="text-xl hover:scale-125 transition w-8 h-8 rounded-full hover:bg-white/5"
        >
          {e}
        </button>
      ))}
      <button
        onClick={() => setExpand((v) => !v)}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'text-white/60 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-900/5'}`}
      >
        <SmilePlus size={15} />
      </button>
      {expand && (
        <EmojiPicker onPick={(e) => { onPick(e); onClose(); }} onClose={onClose} anchor="bottom" theme={theme} />
      )}
    </div>
  );
}

function VoiceRow({ voice, theme }: { voice: VoiceNote; theme: Theme }) {
  const isDark = theme === 'dark';
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!voice.url) return;
    const a = new Audio(voice.url);
    audioRef.current = a;
    a.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
    });
    const tick = () => {
      if (a.currentTime && a.duration) {
        setProgress(Math.min(100, (a.currentTime / a.duration) * 100));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      a.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [voice.url]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const togglePlay = () => {
    if (!voice.url) {
      // Simulated playback
      if (playing) return;
      setPlaying(true);
      setProgress(0);
      const start = performance.now();
      const totalMs = voice.duration_sec * 1000;
      const loop = () => {
        const pct = Math.min(100, ((performance.now() - start) / totalMs) * 100);
        setProgress(pct);
        if (pct >= 100) {
          setPlaying(false);
          return;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[220px]">
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20"
        style={{ background: 'linear-gradient(135deg, #00a884, #0284c7)' }}
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="flex-1 flex items-end gap-0.5 h-8 px-2 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
        {voice.waveform.map((h, i) => {
          const wfIndex = i / Math.max(1, voice.waveform.length - 1) * 100;
          const active = wfIndex <= progress;
          return (
            <span
              key={i}
              className="w-1 rounded-full"
              style={{
                height: `${Math.max(4, h * 28)}px`,
                background: active
                  ? 'linear-gradient(180deg, #00a884, #25d366)'
                  : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
              }}
            />
          );
        })}
      </div>
      <span className={`text-[11px] shrink-0 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
        {fmt(voice.duration_sec)}
      </span>
    </div>
  );
}

function PollBlock({ poll, message, out, onChange, theme }: { poll: PollData; message: LocalMessage; out: boolean; onChange: () => void; theme: Theme }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voter_ids.length, 0);
  const isDark = theme === 'dark';
  return (
    <div className={`rounded-xl p-3 my-1 min-w-[260px] ${isDark ? 'bg-black/15' : 'bg-white/70'} backdrop-blur-sm`} style={{ border: out ? 'none' : '1px solid rgba(255,255,255,0.5)' }}>
      <div className={`flex items-start gap-2 mb-2`}>
        <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-white">
          <Users size={16} />
        </div>
        <div className="flex-1">
          <div className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Poll</div>
          <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{poll.question}</div>
        </div>
      </div>
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct = totalVotes > 0 ? (opt.voter_ids.length / totalVotes) * 100 : 0;
          const voted = opt.voter_ids.includes(CURRENT_USER_ID);
          return (
            <button
              key={opt.id}
              onClick={() => { castPollVote(message.id, opt.id, CURRENT_USER_ID); onChange(); }}
              className={`w-full relative overflow-hidden rounded-xl px-3 py-2 text-left text-sm transition-all border ${
                voted
                  ? isDark ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-emerald-500/60 bg-emerald-50'
                  : isDark ? 'border-white/10 hover:border-white/20 bg-white/[0.03]' : 'border-white/70 hover:border-slate-200 bg-white/50'
              }`}
            >
              <div className="poll-bar absolute inset-0" style={{ transform: `scaleX(${pct / 100})` }}>
                <div className="poll-bar-fill" />
              </div>
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {voted ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)' }} />
                  )}
                  <span className={`truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{opt.text}</span>
                </div>
                <span className={`text-[11px] font-semibold shrink-0 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  {totalVotes > 0 ? `${opt.voter_ids.length} · ${pct.toFixed(0)}%` : '0'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <div className={`mt-2 text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
        {totalVotes} vote{totalVotes === 1 ? '' : 's'} · Tap an option to vote
      </div>
    </div>
  );
}

export function MessageBubble({
  message,
  out,
  showAvatar,
  showName,
  isGroup,
  sender,
  replyTo,
  receiptsStatus,
  onReply,
  onDelete,
  theme,
  onChange,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [reactionBar, setReactionBar] = useState(false);
  const isDark = theme === 'dark';
  const bubbleClass = out ? 'bubble-out' : 'bubble-in';
  const align = out ? 'items-end' : 'items-start';
  const textColor = isDark ? 'text-white' : 'text-[#111b21]';
  const timeColor = isDark ? 'text-white/60' : 'text-[#667781]';
  const menuBg = isDark ? 'bg-[#233138]/95' : 'bg-white/95';
  const menuBorder = isDark ? 'border-white/10' : 'border-white/70';
  const menuItemHover = isDark ? 'hover:bg-white/10' : 'hover:bg-slate-900/5';
  const menuItemText = isDark ? 'text-white' : 'text-[#111b21]';
  const replyBg = isDark ? 'bg-black/25' : 'bg-black/5';

  const reactionsMap = new Map<string, number>();
  (message.reactions || []).forEach((r) => {
    reactionsMap.set(r.emoji, (reactionsMap.get(r.emoji) ?? 0) + r.count);
  });
  const chips = Array.from(reactionsMap.entries());

  const doReaction = (e: string) => {
    toggleReaction(message.id, e, CURRENT_USER_ID);
    onChange();
  };

  return (
    <div
      className={`flex flex-col ${align} px-3 py-0.5 animate-msg-in group relative`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setReactionBar(false); setMenuOpen(false); }}
    >
      <div className={`flex relative ${out ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[520px] w-full`}>
        {isGroup && !out && (
          <div className="w-8 shrink-0">
            {showAvatar && sender && <Avatar name={displayName(sender as any)} id={sender.id} src={sender.avatar_url} size={32} />}
          </div>
        )}

        <div className={`relative ${bubbleClass} rounded-2xl px-3 py-1.5 shadow-sm ${out ? 'mr-0' : 'ml-0'} max-w-full`}>
          {showName && isGroup && !out && sender && (
            <div className="text-xs font-semibold mb-0.5" style={{ color: sender.avatar_color }}>
              {displayName(sender as any)}
            </div>
          )}

          {replyTo && (
            <div
              className={`mb-1.5 pl-2 border-l-[3px] rounded-md py-1 px-2 text-xs ${replyBg} ${
                out ? 'border-[#00a884]' : 'border-[#25d366]'
              }`}
            >
              <div className="font-medium text-emerald-600 dark:text-emerald-400">
                {replyTo.sender_id === message.sender_id ? 'You' : displayName(getProfile(replyTo.sender_id) as any)}
              </div>
              <div className={`${timeColor} truncate`}>
                {replyTo.type === 'text' ? replyTo.body : replyTo.type === 'poll' ? '📊 Poll' : replyTo.type === 'voice' ? '🎤 Voice note' : replyTo.type === 'image' ? '🖼️ Photo' : replyTo.type}
              </div>
            </div>
          )}

          {message.type === 'image' && (
            <div className="mb-1 -mx-3 mt-[-6px]">
              <button
                onClick={() => setImgOpen(true)}
                className="relative block w-full rounded-xl overflow-hidden"
              >
                <img src={message.media_url} alt="" className="w-full max-h-[320px] object-cover" />
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                  <Maximize2 size={14} />
                </div>
              </button>
              {message.body && <div className={`mt-1.5 text-sm ${textColor} whitespace-pre-wrap break-words`}>{message.body}</div>}
            </div>
          )}

          {message.type === 'voice' && message.voice && (
            <VoiceRow voice={message.voice} theme={theme} />
          )}

          {message.type === 'poll' && message.poll && (
            <PollBlock poll={message.poll} message={message} out={out} onChange={onChange} theme={theme} />
          )}

          {message.type === 'text' && (
            <div className={`text-[15px] leading-snug ${textColor} whitespace-pre-wrap break-words pr-1`}>{message.body}</div>
          )}

          {/* Chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {chips.map(([e, n]) => (
                <button
                  key={e}
                  onClick={() => doReaction(e)}
                  className="reaction-chip"
                >
                  <span>{e}</span>
                  {n > 1 && <span className={`${timeColor} font-medium`}>{n}</span>}
                </button>
              ))}
            </div>
          )}

          <div className={`flex items-center gap-1 justify-end mt-0.5`}>
            <span className={`text-[10px] ${timeColor} leading-none`}>
              {formatTime(message.created_at)}
            </span>
            <Ticks status={receiptsStatus} out={out} size={14} />
          </div>

          {/* Hover quick-reaction */}
          {hovered && !reactionBar && (
            <button
              onClick={() => setReactionBar(true)}
              className={`absolute z-10 w-8 h-8 rounded-full shadow-md spring-hover border flex items-center justify-center ${
                isDark ? 'bg-[#233138] border-white/10 text-white/80' : 'bg-white border-white/80 text-slate-600'
              } ${out ? '-left-10' : '-right-10'} top-2 backdrop-blur-xl`}
            >
              <SmilePlus size={15} />
            </button>
          )}

          {reactionBar && (
            <ReactionBar
              onPick={doReaction}
              onClose={() => setReactionBar(false)}
              theme={theme}
            />
          )}

          {/* Hover actions */}
          {hovered && (
            <div className={`absolute z-10 flex items-center gap-1 rounded-full shadow-md px-1.5 py-1 backdrop-blur-xl border ${
              isDark ? 'bg-[#233138]/95 border-white/10' : 'bg-white/95 border-white/70'
            } ${out ? 'left-[-112px]' : 'right-[-96px]'} top-2`}>
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${menuItemText} ${menuItemHover}`}
                  title="Reply"
                >
                  <CornerUpLeft size={14} />
                </button>
              )}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={`w-7 h-7 rounded-full flex items-center justify-center ${menuItemText} ${menuItemHover}`}
                title="More"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className={`absolute z-30 ${out ? 'right-full mr-2' : 'left-full ml-2'} top-0 rounded-xl shadow-xl py-1 min-w-[160px] animate-pop border ${menuBorder} ${menuBg}`}>
                    {onReply && (
                      <button
                        onClick={() => { onReply(message); setMenuOpen(false); }}
                        className={`w-full text-left text-sm px-4 py-2 flex items-center gap-2 ${menuItemHover} ${menuItemText}`}
                      >
                        <CornerUpLeft size={14} /> Reply
                      </button>
                    )}
                    <button
                      onClick={() => { doReaction('❤️'); setMenuOpen(false); }}
                      className={`w-full text-left text-sm px-4 py-2 flex items-center gap-2 ${menuItemHover} ${menuItemText}`}
                    >
                      <Heart size={14} /> React ❤️
                    </button>
                    <button
                      onClick={() => { doReaction('👍'); setMenuOpen(false); }}
                      className={`w-full text-left text-sm px-4 py-2 flex items-center gap-2 ${menuItemHover} ${menuItemText}`}
                    >
                      <ThumbsUp size={14} /> React 👍
                    </button>
                    <button
                      onClick={() => { doReaction('😂'); setMenuOpen(false); }}
                      className={`w-full text-left text-sm px-4 py-2 flex items-center gap-2 ${menuItemHover} ${menuItemText}`}
                    >
                      <Laugh size={14} /> React 😂
                    </button>
                    <button
                      onClick={() => { doReaction('🔥'); setMenuOpen(false); }}
                      className={`w-full text-left text-sm px-4 py-2 flex items-center gap-2 ${menuItemHover} ${menuItemText}`}
                    >
                      <Flame size={14} /> React 🔥
                    </button>
                    {out && onDelete && (
                      <>
                        <div className={`h-px mx-2 ${isDark ? 'bg-white/10' : 'bg-slate-900/10'}`} />
                        <button
                          onClick={() => {
                            if (confirm('Delete this message?')) {
                              onDelete(message);
                            }
                            setMenuOpen(false);
                          }}
                          className="w-full text-left text-sm px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image full screen */}
      {imgOpen && message.type === 'image' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-fade-in flex items-center justify-center p-6" onClick={() => setImgOpen(false)}>
          <div className="relative max-w-5xl w-full max-h-full">
            <img src={message.media_url} alt="" className="w-full h-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-pop" />
            <button onClick={(e) => { e.stopPropagation(); setImgOpen(false); }} className="absolute -top-12 right-0 text-white/80 hover:text-white">
              <Trash2 size={20} className="rotate-45" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
