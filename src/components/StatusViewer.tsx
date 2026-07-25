import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { StatusStory } from '@/lib/localStore';
import { getProfile, markStatusViewed, type Profile, CURRENT_USER_ID } from '@/lib/localStore';

interface StatusViewerProps {
  stories: StatusStory[];
  open: boolean;
  onClose: () => void;
  onAdvance: () => void;
  activeId: string | null;
}

export function StatusViewer({ stories, open, onClose, onAdvance, activeId }: StatusViewerProps) {
  const storyIdx = Math.max(
    0,
    stories.findIndex((s) => s.id === activeId)
  );
  const story = stories[storyIdx];
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!story || !open) return;
    markStatusViewed(story.id);
    setProgress(0);
    startRef.current = performance.now();
    lastRef.current = 0;

    const tick = (t: number) => {
      if (paused) {
        startRef.current = t - lastRef.current;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = t - startRef.current;
      lastRef.current = elapsed;
      const pct = Math.min(100, (elapsed / story.duration_ms) * 100);
      setProgress(pct);
      if (pct >= 100) {
        onAdvance();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [story?.id, open, paused, onAdvance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onAdvance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onAdvance]);

  if (!open || !story) return null;
  const author: Profile | undefined = getProfile(story.profile_id);
  const total = stories.length;
  const isLast = storyIdx >= total - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-fade-in flex items-center justify-center p-4">
      <div className="w-full max-w-lg h-[88vh] max-h-[820px] relative rounded-[32px] overflow-hidden shadow-2xl animate-pop">
        <img
          src={story.media_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent 60% to-black/70" />

        <div className="absolute top-3 left-3 right-3 flex gap-1.5">
          {stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width:
                    i < storyIdx
                      ? '100%'
                      : i === storyIdx
                        ? `${progress}%`
                        : '0%',
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-7 left-4 right-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full ring-2 ring-white/60 overflow-hidden shrink-0">
            <img src={author?.avatar_url} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 text-white">
            <div className="text-sm font-semibold truncate">{author?.name ?? 'Unknown'}</div>
            <div className="text-[11px] text-white/75">
              {new Date(story.created_at).toLocaleString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/15 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        <button
          onClick={() => setPaused((v) => !v)}
          className="absolute inset-0 w-full h-full"
          aria-label="Pause/play"
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (storyIdx > 0) {
              const prev = stories[storyIdx - 1];
              onAdvance();
              // Replace progress by triggering via URL hash would be complex. Hack: seek via reset
              window.setTimeout(() => {
                const ev = new CustomEvent('status:seek', { detail: { id: prev.id } });
                window.dispatchEvent(ev);
              }, 0);
            }
          }}
          className="absolute left-0 top-[15%] bottom-[15%] w-[22%] text-white/50 hover:text-white/90 flex items-center justify-start pl-2"
        >
          <ChevronLeft size={36} strokeWidth={1.5} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdvance();
          }}
          className="absolute right-0 top-[15%] bottom-[15%] w-[22%] text-white/50 hover:text-white/90 flex items-center justify-end pr-2"
        >
          <ChevronRight size={36} strokeWidth={1.5} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setPaused((v) => !v);
          }}
          className="absolute bottom-28 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center"
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>

        {story.caption && (
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-white text-lg font-medium drop-shadow-lg">{story.caption}</p>
          </div>
        )}

        {isLast && progress > 92 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-semibold shadow-xl"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
