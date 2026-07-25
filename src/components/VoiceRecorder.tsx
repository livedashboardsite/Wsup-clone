import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Square, Send, Trash2 } from 'lucide-react';
import type { VoiceNote } from '@/lib/localStore';

interface VoiceRecorderProps {
  onCancel: () => void;
  onSend: (note: VoiceNote) => void;
  theme: 'light' | 'dark';
}

function makeWaveform(len = 28): number[] {
  return Array.from({ length: len }, () => 0.3 + Math.random() * 0.7);
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoiceRecorder({ onCancel, onSend, theme }: VoiceRecorderProps) {
  const isDark = theme === 'dark';
  const [elapsed, setElapsed] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>(() => makeWaveform());
  const [recording, setRecording] = useState<null | 'recording' | 'ready'>('recording');
  const [error, setError] = useState<string | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const intervalRef = useRef<number | null>(null);
  const waveTimer = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let destroyed = false;
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('No mics available.');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        let mr: MediaRecorder;
        try {
          mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        } catch {
          mr = new MediaRecorder(stream);
        }
        mediaRecRef.current = mr;
        chunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = URL.createObjectURL(blob);
          if (!destroyed) setRecording('ready');
        };
        mr.start(100);
      } catch (e: any) {
        if (!destroyed) {
          setError(e?.message || 'Could not access microphone. Simulated recording will be used.');
          setRecording('ready');
        }
      }
    };
    start();

    intervalRef.current = window.setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    waveTimer.current = window.setInterval(() => {
      setLiveWave((prev) => [...prev.slice(1), 0.35 + Math.random() * 0.65]);
    }, 120);

    return () => {
      destroyed = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (waveTimer.current) window.clearInterval(waveTimer.current);
      if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
        try { mediaRecRef.current.stop(); } catch {}
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecRef.current && mediaRecRef.current.state === 'recording') {
      try { mediaRecRef.current.stop(); } catch {}
    } else {
      setRecording('ready');
    }
  };

  const doSend = () => {
    const finalUrl = urlRef.current ?? '';
    const note: VoiceNote = {
      url: finalUrl,
      duration_sec: Math.max(1, elapsed),
      waveform: liveWave,
    };
    onSend(note);
  };

  const inputBg = isDark ? 'bg-[#2a3942]' : 'bg-white';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-[#2a3942] border-white/10' : 'bg-white border-white/70'}`}>
      <button
        onClick={onCancel}
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isDark ? 'text-white/70 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-900/5'}`}
        title="Cancel"
      >
        <Trash2 size={18} />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${recording === 'recording' ? 'bg-red-500' : 'bg-emerald-500/30'} text-white`}>
          {recording === 'recording' ? (
            <span className="w-2.5 h-2.5 bg-white rounded-sm animate-rec-pulse" />
          ) : (
            <Mic size={14} />
          )}
        </div>
        <div className="flex-1 flex items-center gap-1 overflow-hidden">
          <div className="flex items-end gap-0.5 flex-1 h-8 px-2 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            {liveWave.map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-150"
                style={{
                  height: `${Math.max(4, h * 26)}px`,
                  background:
                    recording === 'recording'
                      ? 'linear-gradient(180deg, #ef4444, #f97316)'
                      : 'linear-gradient(180deg, #00a884, #25d366)',
                }}
              />
            ))}
          </div>
        </div>
        <span className={`text-xs font-mono shrink-0 px-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{fmt(elapsed)}</span>
      </div>

      {error && (
        <div className={`text-[10px] max-w-[140px] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
          {error}
        </div>
      )}

      {recording === 'recording' ? (
        <button
          onClick={stopRecording}
          className="w-11 h-11 shrink-0 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 spring-hover"
          title="Stop"
        >
          <Square size={16} fill="currentColor" />
        </button>
      ) : (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={stopRecording}
            disabled
            className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center opacity-0 pointer-events-none"
          />
          <button
            onClick={doSend}
            className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 spring-hover"
            style={{ background: 'linear-gradient(135deg, #00a884, #059669)' }}
            title="Send voice note"
          >
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
