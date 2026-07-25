import { useState } from 'react';
import { Download, Play, Pause, FileText, CornerUpLeft } from 'lucide-react';
import { Avatar } from './Avatar';
import { Ticks } from './Ticks';
import { formatBytes, formatDuration } from '@/lib/storage';
import { formatTime, displayName } from '@/lib/format';
import type { Message, Profile, MessageStatus } from '@/types/database';

interface MessageBubbleProps {
  message: Message;
  out: boolean;
  showAvatar: boolean;
  showName: boolean;
  isGroup: boolean;
  sender: Profile | undefined;
  replyTo?: Message | null;
  receiptsStatus?: MessageStatus;
  onReply?: (m: Message) => void;
  onDelete?: (m: Message) => void;
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
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isMedia = message.type !== 'text';
  const bubbleClass = out ? 'bubble-out' : 'bubble-in';
  const align = out ? 'items-end' : 'items-start';
  const maxW = isMedia ? 'max-w-[320px]' : 'max-w-[420px]';

  return (
    <div className={`flex flex-col ${align} px-3 animate-msg-in group`}>
      <div className={`flex ${out ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 ${maxW}`}>
        {isGroup && !out && (
          <div className="w-8 shrink-0">
            {showAvatar && sender && <Avatar name={displayName(sender)} id={sender.id} src={sender.avatar_url} size={32} />}
          </div>
        )}

        <div
          className={`relative ${bubbleClass} rounded-lg px-2.5 py-1.5 shadow-sm ${out ? 'mr-1' : 'ml-1'}`}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenuOpen((v) => !v);
          }}
        >
          {showName && isGroup && !out && sender && (
            <div
              className="text-xs font-medium mb-0.5"
              style={{ color: sender.avatar_color }}
            >
              {displayName(sender)}
            </div>
          )}

          {replyTo && (
            <div
              className={`mb-1.5 pl-2 border-l-2 rounded-sm py-1 px-1.5 text-xs bg-black/5 ${
                out ? 'border-[#008069]' : 'border-[#25d366]'
              }`}
            >
              <div className="font-medium text-[#008069]">
                {replyTo.sender_id === message.sender_id ? 'You' : displayName(replyTo.sender)}
              </div>
              <div className="text-[#667781] truncate">
                {replyTo.type === 'text' ? replyTo.body : `[${replyTo.type}]`}
              </div>
            </div>
          )}

          {renderContent()}

          <div className={`flex items-center gap-1 ${isMedia ? 'justify-end' : 'justify-end'} mt-0.5 -mb-0.5`}>
            <span className="text-[10px] text-[#667781] leading-none">
              {formatTime(message.created_at)}
            </span>
            <Ticks status={receiptsStatus} out={out} size={14} />
          </div>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className={`absolute z-20 top-full ${out ? 'right-0' : 'left-0'} mt-1 bg-white rounded-md shadow-lg border border-[#e9edef] py-1 min-w-[140px]`}>
                {onReply && (
                  <button
                    onClick={() => { onReply(message); setMenuOpen(false); }}
                    className="w-full text-left text-sm px-3 py-1.5 hover:bg-[#f0f2f5] flex items-center gap-2"
                  >
                    <CornerUpLeft size={14} /> Reply
                  </button>
                )}
                {out && onDelete && (
                  <button
                    onClick={() => { onDelete(message); setMenuOpen(false); }}
                    className="w-full text-left text-sm px-3 py-1.5 hover:bg-[#fce8e6] text-[#d93025] flex items-center gap-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  function renderContent() {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            {message.media_url && (
              <img
                src={message.media_url}
                alt={message.media_name ?? 'photo'}
                className="rounded-md max-h-80 max-w-[300px] object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            {message.body && (
              <div className="text-sm text-[#111b21] mt-1">{message.body}</div>
            )}
          </div>
        );
      case 'video':
        return (
          <div>
            {message.media_url && (
              <video
                src={message.media_url}
                controls
                className="rounded-md max-h-80 max-w-[300px]"
              />
            )}
            {message.body && <div className="text-sm mt-1">{message.body}</div>}
          </div>
        );
      case 'audio':
        return <VoicePlayer url={message.media_url ?? ''} duration={message.duration_sec ?? 0} />;
      case 'document':
        return (
          <a
            href={message.media_url ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 py-1.5 pr-2"
          >
            <div className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate max-w-[200px]">
                {message.media_name ?? 'Document'}
              </div>
              <div className="text-xs text-[#667781]">
                {message.media_size ? formatBytes(message.media_size) : ''}
              </div>
            </div>
            <Download size={16} className="text-[#667781] shrink-0" />
          </a>
        );
      default:
        return <div className="text-sm text-[#111b21] whitespace-pre-wrap break-words pr-1">{message.body}</div>;
    }
  }
}

function VoicePlayer({ url, duration }: { url: string; duration: number }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audio) {
      const a = new Audio(url);
      a.addEventListener('timeupdate', () => {
        setProgress(a.duration ? a.currentTime / a.duration : 0);
      });
      a.addEventListener('ended', () => {
        setPlaying(false);
        setProgress(0);
      });
      setAudio(a);
      a.play();
      setPlaying(true);
    } else if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1 min-w-[180px]">
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-[#008069] text-white flex items-center justify-center shrink-0"
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={progress}
        onChange={(e) => {
          if (audio && audio.duration) {
            audio.currentTime = Number(e.target.value) * audio.duration;
            setProgress(Number(e.target.value));
          }
        }}
        className="voice-slider flex-1"
      />
      <span className="text-xs text-[#667781] tabular-nums">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
