import { useEffect, useState, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, UserPlus, Volume2 } from 'lucide-react';
import type { Profile } from '@/lib/localStore';

interface CallModalProps {
  open: boolean;
  kind: 'voice' | 'video';
  peer: Profile | null;
  groupName?: string | null;
  onClose: () => void;
  theme: 'light' | 'dark';
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CallModal({ open, kind, peer, groupName, onClose, theme }: CallModalProps) {
  const [stage, setStage] = useState<'ringing' | 'active' | 'ended'>('ringing');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const ringTimer = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setStage('ringing');
      setDuration(0);
      setMuted(false);
      setVideoOff(false);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (ringTimer.current) window.clearTimeout(ringTimer.current);
      ringTimer.current = window.setTimeout(() => {
        setStage('active');
        intervalRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
      }, 2400);
    } else {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (ringTimer.current) window.clearTimeout(ringTimer.current);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (ringTimer.current) window.clearTimeout(ringTimer.current);
    };
  }, [open]);

  if (!open) return null;

  const title = groupName ?? peer?.name ?? 'Unknown';
  const avatar = peer?.avatar_url;
  const subtitle =
    stage === 'ringing'
      ? kind === 'voice'
        ? 'Calling…'
        : 'Starting video call…'
      : stage === 'active'
        ? formatDuration(duration)
        : 'Call ended';

  const videoBg = peer?.avatar_url
    ? `radial-gradient(circle at 50% 20%, rgba(0,168,132,0.5), transparent 50%), url(${peer.avatar_url}) center/cover, #0a1218`
    : 'radial-gradient(circle at 50% 40%, rgba(0,168,132,0.45), transparent 55%), #0a1218';

  return (
    <div className="fixed inset-0 z-50 call-backdrop animate-fade-in flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[85vh] max-h-[720px] rounded-[36px] overflow-hidden relative shadow-2xl animate-pop">
        <div className="absolute inset-0" style={{ backgroundImage: videoBg }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,10,16,0.2) 0%, rgba(5,10,16,0.6) 60%, rgba(5,10,16,0.95) 100%)' }} />

        <div className="relative h-full flex flex-col items-center justify-between py-10 px-6 text-white">
          <div className="w-full flex items-center justify-between">
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs">
              {kind === 'video' ? '📹 Video Call' : '📞 Voice Call'}
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  stage === 'ringing'
                    ? 'bg-amber-400 animate-rec-pulse'
                    : stage === 'active'
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                }`}
              />
              {stage === 'ringing' ? 'Connecting…' : stage === 'active' ? 'Connected' : 'Ended'}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 animate-fade-up">
            <div className="relative">
              {kind === 'video' && !videoOff ? (
                <div className="w-44 h-44 rounded-full overflow-hidden ring-4 ring-white/30 shadow-2xl">
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {stage === 'ringing' && (
                <div className="absolute inset-0 -m-2 rounded-full border-2 border-emerald-400/40 animate-ping" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-semibold drop-shadow-lg">{title}</h2>
              <p className="mt-1 text-sm text-white/80">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMuted((v) => !v)}
                className={`spring-hover w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border transition-colors ${
                  muted
                    ? 'bg-red-500/80 border-red-300/40 text-white'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                }`}
              >
                {muted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              {kind === 'video' && (
                <button
                  onClick={() => setVideoOff((v) => !v)}
                  className={`spring-hover w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border transition-colors ${
                    videoOff
                      ? 'bg-red-500/80 border-red-300/40 text-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                  }`}
                >
                  {videoOff ? <VideoOff size={22} /> : <Video size={22} />}
                </button>
              )}
              <button
                className="spring-hover w-14 h-14 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/15"
              >
                <Volume2 size={22} />
              </button>
              <button
                className="spring-hover w-14 h-14 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/15"
              >
                <UserPlus size={22} />
              </button>
              <button
                onClick={() => {
                  setStage('ended');
                  window.setTimeout(() => onClose(), 900);
                }}
                className="spring-hover w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/30"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                }}
              >
                <PhoneOff size={26} />
              </button>
            </div>
            <p className="text-xs text-white/50">Glass Call Overlay · Tap the red button to hang up</p>
          </div>
        </div>
      </div>
    </div>
  );
}
