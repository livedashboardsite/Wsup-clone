import { useEffect, useRef, useState, useCallback } from 'react';
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
  const [closing, setClosing] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    setPaused(true);
    cancelRaf();
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 220);
  }, [cancelRaf, onClose]);

  useEffect(() => {
    if (!story || !open || closing) {
      cancelRaf();
      return;
    }
    markStatusViewed(story.id);
    setProgress(0);
    startRef.current = performance.now();
    lastRef.current = 0;

    const tick = (t: number) => {
      if (paused || closing) {
        startRef.current = t - lastRef.current;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = t - startRef.current;
      lastRef.current = elapsed;
      const pct = Math.min(100, (elapsed / story.duration_ms) * 100);
      setProgress(pct);
      if (pct >= 100) {
        cancelRaf();
        onAdvance();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return cancelRaf;
  }, [story?.id, open, paused, closing, onAdvance, cancelRaf]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onAdvance();
      }
      if (e.key === ' ') {
        e.preventDefault();
        setPaused((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose, onAdvance]);

  useEffect(() => {
    return () => {
      cancelRaf();
    };
  }, [cancelRaf]);

  if (!open && !closing) return null;
  if (!story) return null;
  const author: Profile | undefined = getProfile(story.profile_id);
  const total = stories.length;
  const isLast = storyIdx >= total - 1;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-2xl saturate-150 flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${
        closing ? 'opacity-0' : 'opacity-100 animate-fade-in'
      }`}
      style={{ WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Status viewer"
    >
      <div
        className={`w-full max-w-lg h-[88vh] max-h-[820px] relative rounded-[32px] overflow-hidden shadow-2xl transition-all duration-200 ease-out ${
          closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-pop'
        }`}
      >
        <img
          src={story.media_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

        <div className="absolute top-3 left-3 right-3 flex gap-1.5 z-10">
          {stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
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

        <div className="absolute top-7 left-4 right-4 flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full ring-2 ring-white/60 overflow-hidden shrink-0 backdrop-blur-sm">
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
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-2xl border border-white/20 flex items-center justify-center transition-all duration-200 shadow-lg"
            style={{ WebkitBackdropFilter: 'blur(20px)' }}
            aria-label="Close status"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClose();
              }
            }}
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>

        <button
          onClick={() => setPaused((v) => !v)}
          className="absolute inset-0 w-full h-full z-[1]"
          aria-label="Pause/play"
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (storyIdx > 0) {
              const prev = stories[storyIdx - 1];
              onAdvance();
              window.setTimeout(() => {
                const ev = new CustomEvent('status:seek', { detail: { id: prev.id } });
                window.dispatchEvent(ev);
              }, 0);
            }
          }}
          className="absolute left-0 top-[15%] bottom-[15%] w-[22%] text-white/50 hover:text-white/90 flex items-center justify-start pl-2 z-[2]"
          aria-label="Previous status"
        >
          <ChevronLeft size={36} strokeWidth={1.5} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdvance();
          }}
          className="absolute right-0 top-[15%] bottom-[15%] w-[22%] text-white/50 hover:text-white/90 flex items-center justify-end pr-2 z-[2]"
          aria-label="Next status"
        >
          <ChevronRight size={36} strokeWidth={1.5} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setPaused((v) => !v);
          }}
          className="absolute bottom-28 right-6 w-12 h-12 rounded-full bg-white/12 hover:bg-white/22 active:scale-95 backdrop-blur-2xl border border-white/20 text-white flex items-center justify-center transition-all duration-200 z-10 shadow-lg"
          style={{ WebkitBackdropFilter: 'blur(20px)' }}
          aria-label={paused ? 'Play status' : 'Pause status'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setPaused((v) => !v);
            }
          }}
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>

        {story.caption && (
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 px-4 py-3" style={{ WebkitBackdropFilter: 'blur(20px)' }}>
              <p className="text-white text-base font-medium drop-shadow-lg">{story.caption}</p>
            </div>
          </div>
        )}

        {isLast && progress > 92 && !closing && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center z-20 animate-fade-up">
            <button
              onClick={handleClose}
              className="spring-hover px-6 py-3 rounded-full bg-white/90 hover:bg-white text-slate-900 text-sm font-semibold shadow-2xl backdrop-blur-xl border border-white/50 transition-all"
              style={{ WebkitBackdropFilter: 'blur(20px)' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
