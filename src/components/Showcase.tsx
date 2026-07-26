import { useState, useCallback } from 'react';
import {
  MessageSquare, Bot, Mic, BarChart3, Video, Palette,
  Phone, Play, Shield, Zap, ChevronRight, ArrowRight, Sparkles,
  Sun, Moon, Github, Info,
} from 'lucide-react';
import type { Theme } from '@/lib/localStore';

interface ShowcaseProps {
  theme: Theme;
  onToggleTheme: () => void;
  onTryDemoChat: () => void;
  onViewCode: () => void;
  onReloadShowcase?: () => void;
}

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Dynamic Auto-Replies',
    desc: 'Context-aware simulated responses with typing indicators and realistic delay timings.',
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Mic,
    title: 'Voice Notes Simulator',
    desc: 'Record live clips via MediaRecorder API or send simulated voice notes with waveform playback.',
    accent: 'from-pink-400 to-rose-500',
  },
  {
    icon: BarChart3,
    title: 'Interactive Group Polls',
    desc: 'Animated live vote percentage bars in group chats with multi-option toggles.',
    accent: 'from-amber-400 to-orange-500',
  },
  {
    icon: Video,
    title: 'Frosted Calls Overlay',
    desc: 'Glassmorphism video & audio call modals with dynamic timer and mute controls.',
    accent: 'from-sky-400 to-blue-500',
  },
  {
    icon: Palette,
    title: 'Glass Theme Engine',
    desc: 'Single-click Dark Glass ↔ Light Glass with silk-smooth transitions everywhere.',
    accent: 'from-violet-400 to-indigo-500',
  },
  {
    icon: Zap,
    title: 'Stories & Status',
    desc: 'Animated progress bar story viewer with tap-to-skip, autoplay and memory of views.',
    accent: 'from-fuchsia-400 to-purple-500',
  },
];

export function Showcase({ theme, onToggleTheme, onTryDemoChat, onViewCode, onReloadShowcase }: ShowcaseProps) {
  const isDark = theme === 'dark';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleInfoClick = useCallback(() => {
    if (onReloadShowcase) {
      onReloadShowcase();
    }
  }, [onReloadShowcase]);

  return (
    <div className="h-full w-full overflow-y-auto animate-fade-up">
      {/* Top navigation bar */}
      <div className={`sticky top-0 z-30 px-4 md:px-8 py-3 mist-nav-bg backdrop-blur-2xl border-b ${isDark ? 'border-white/[0.06]' : 'border-white/60'}`} style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <MessageSquare size={16} className="text-white" />
            </div>
            <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Made by Prathamesh Thakur · Vedam School Of Technology Bootcamp · Mentored by Gunjan Ma'am
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleInfoClick}
              className={`spring-hover w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95
                ${isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              title="Reload showcase"
              aria-label="Reload showcase and info page"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleInfoClick();
                }
              }}
            >
              <Info size={19} strokeWidth={2} />
            </button>
            <button
              onClick={onToggleTheme}
              className={`spring-hover w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95
                ${isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light glass mode' : 'Switch to dark glass mode'}
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              onClick={onViewCode}
              className={`spring-hover w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95
                ${isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              title="View source code"
              aria-label="View source code on GitHub"
            >
              <Github size={19} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="glass-card p-8 md:p-10 md:mb-8 animate-pop">
          <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-xs font-medium text-emerald-600 dark:text-emerald-300 mb-4">
                <Sparkles size={14} />
                <span>Quick Start Guide</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                WhatsApp <span className="gradient-text">Next‑Gen Glass Edition</span>
              </h1>
              <p className={`text-lg md:text-xl mb-6 ${isDark ? 'text-white/70' : 'text-slate-700/80'}`}>
                Production‑ready, Apple‑style Glassmorphism WhatsApp clone. Packed with interactive chats,
                polls, voice notes, call overlays, stories, and a premium dual‑theme engine — all persisted offline.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onTryDemoChat}
                  className="spring-hover inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-emerald-500/30"
                  style={{
                    background: 'linear-gradient(135deg, #00a884 0%, #008069 55%, #059669 100%)',
                  }}
                >
                  <Play size={16} /> Try Demo Chat <ChevronRight size={16} />
                </button>
                <button
                  onClick={onToggleTheme}
                  className={`spring-hover inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border ${
                    isDark
                      ? 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                      : 'bg-white/60 border-white/70 text-slate-800 hover:bg-white/80'
                  } backdrop-blur-md shadow-sm`}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? 'Toggle Light Glass' : 'Toggle Dark Glass'}
                </button>
                <button
                  onClick={onViewCode}
                  className={`spring-hover inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border ${
                    isDark
                      ? 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                      : 'bg-white/60 border-white/70 text-slate-800 hover:bg-white/80'
                  } backdrop-blur-md shadow-sm`}
                >
                  <Github size={16} /> View Code
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-8">
                {[
                  { icon: Shield, label: 'End‑to‑end encrypted' },
                  { icon: Zap, label: 'Instant message delivery' },
                  { icon: MessageSquare, label: 'Persistent chat history' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-500/30 border border-emerald-300/40 flex items-center justify-center">
                      <s.icon size={14} className="text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <span className={`${isDark ? 'text-white/75' : 'text-slate-700'}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-[360px] shrink-0 aspect-square relative">
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-emerald-400/40 via-teal-500/30 to-violet-500/40 blur-2xl animate-fade-in" />
              <div className="relative glass-strong rounded-[28px] p-4 h-full flex flex-col">
                <div className="flex items-center gap-2 px-2 py-1 mb-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className={`ml-auto text-[10px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>wa-web · preview</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/60"
                    alt="avatar"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">Sophia Martinez</div>
                    <div className="text-[10px] text-emerald-500">● online</div>
                  </div>
                  <div className="flex gap-1 items-center text-emerald-500">
                    <Phone size={12} /> <Video size={12} />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <div className="bubble-in max-w-[82%] self-start rounded-xl px-3 py-2 text-xs animate-fade-in" style={{ animationDelay: '80ms' }}>
                    Hey! Ready to try the demo? 🚀
                  </div>
                  <div className="bubble-out max-w-[82%] self-end rounded-xl px-3 py-2 text-xs animate-fade-in" style={{ animationDelay: '260ms' }}>
                    Let's do it! This glass UI is unreal 🤩
                  </div>
                  <div className="bubble-in max-w-[82%] self-start rounded-xl px-3 py-2 text-xs animate-fade-in" style={{ animationDelay: '500ms' }}>
                    Try sending a message, voting in group polls, or the calls!
                  </div>
                  <div className="bubble-in max-w-[60%] self-start rounded-xl px-3 py-2 flex items-center gap-2 animate-fade-in" style={{ animationDelay: '720ms' }}>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Mic size={12} className="text-emerald-600" />
                    </div>
                    <div className="flex gap-0.5 items-end">
                      {[0.4, 0.7, 0.5, 0.9, 0.3, 0.6, 0.8, 0.5, 0.7, 0.4].map((h, i) => (
                        <span key={i} className="w-1 rounded-full bg-emerald-500/70" style={{ height: `${h * 20}px` }} />
                      ))}
                    </div>
                    <span className={`ml-2 text-[10px] ${isDark ? 'text-white/60' : 'text-slate-500'}`}>0:06</span>
                  </div>
                </div>
                <div className="glow-divider my-2" />
                <div className={`flex items-center gap-2 px-2 py-1.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/70'} border border-white/40`}>
                  <span className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Type a message…</span>
                  <ArrowRight size={14} className="ml-auto text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <h2 className={`text-2xl md:text-3xl font-bold mb-5 px-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Everything you need, <span className="gradient-text">beautifully crafted.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {FEATURES.map((f, idx) => (
            <div
              key={f.title}
              className="glass-card p-5 cursor-default"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${f.accent} p-[1px] transition-transform duration-300 ${
                    hoveredIdx === idx ? 'scale-110 rotate-3' : ''
                  }`}
                >
                  <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isDark ? 'bg-[#111b21]' : 'bg-white/80'} backdrop-blur`}>
                    <f.icon size={22} className="text-white mix-blend-difference opacity-90" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                  <p className={`text-sm ${isDark ? 'text-white/65' : 'text-slate-600/90'}`}>{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Judge testing guide */}
        <div className="glass-card p-6 md:p-8 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Judge Testing Guide</h2>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>3 simple steps to see every feature in action</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                title: 'Pick a contact',
                desc: 'Select any profile or group from the left sidebar to open a conversation.',
                cta: 'Groups included: Design Crew 🎨 & Weekend Plans 🎉',
              },
              {
                step: 2,
                title: 'Send a message',
                desc: 'Type and hit Enter → watch the typing indicator + get a context‑aware AI reply. Try an emoji reaction!',
                cta: 'Tip: greetings, questions, and plans all get unique replies.',
              },
              {
                step: 3,
                title: 'Launch a call',
                desc: 'Click the phone or video icon in any chat header to open the frosted glass call overlay.',
                cta: 'Explore Status tab, Polls, and Voice Notes too!',
              },
            ].map((s, i) => (
              <div key={s.step} className={`p-5 rounded-2xl border ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-white/50 bg-white/40'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                    {s.step}
                  </span>
                  <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.title}</h3>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-slate-700'}`}>{s.desc}</p>
                <p className={`text-xs px-3 py-1.5 rounded-full inline-block ${isDark ? 'bg-white/5 text-white/60' : 'bg-emerald-50 text-emerald-700'}`}>
                  ✨ {s.cta}
                </p>
                {i < 2 && <div className="md:hidden glow-divider my-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA band */}
        <div
          className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5"
          style={{
            background:
              theme === 'dark'
                ? 'linear-gradient(135deg, rgba(0,168,132,0.14), rgba(94,120,255,0.14))'
                : 'linear-gradient(135deg, rgba(0,168,132,0.10), rgba(94,120,255,0.10))',
          }}
        >
          <div>
            <h3 className={`text-xl md:text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Ready to experience the future of chat?
            </h3>
            <p className={`text-sm ${isDark ? 'text-white/65' : 'text-slate-600'}`}>
              Jump straight into a conversation with a single click.
            </p>
          </div>
          <button
            onClick={onTryDemoChat}
            className="spring-hover px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-xl shadow-emerald-500/30 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00a884 0%, #0284c7 100%)' }}
          >
            <MessageSquare size={18} />
            Start Demo Chat
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
