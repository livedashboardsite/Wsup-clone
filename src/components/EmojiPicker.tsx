import { useState } from 'react';
import { Smile, ThumbsUp, Heart, Laugh, Flame, Plus, Search } from 'lucide-react';

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
  anchor: 'bottom' | 'inline';
  theme: 'light' | 'dark';
}

const QUICK = ['❤️', '👍', '😂', '🔥'];
const CATEGORIES: { name: string; icon: typeof Smile; emojis: string[] }[] = [
  {
    name: 'Smileys',
    icon: Smile,
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'],
  },
  {
    name: 'Love',
    icon: Heart,
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💌','💋','💯','💢','💥','💫','💦','💨','🕳️','💭','💬','🗨️','🗯️','💤'],
  },
  {
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: ['👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','✋','🤚','🖐️','🖖','👋','🤝','🙏','💪','🦾','🦵','🦶','👂','🦻','👀','👁️','👅','👄','🫀','🫁','🧠','🦷','🦴','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵'],
  },
  {
    name: 'Objects',
    icon: Laugh,
    emojis: ['🎉','🎊','🎈','🎁','🎀','🎗️','🎟️','🎫','🏆','🥇','🥈','🥉','🏅','⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥏','🎣','🏹','🎯','🪀','🎮','🕹️','🎲','🧩','🎰','🎸','🎹','🥁','🎺','🎷','🎵','🎶','🎧','🎤','🎼','🎬','🎞️','🎥','📽️','🎬','📺','📻','🎙️','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','💾','💿','📀','📼','📷','📸','📹','📽️','📞','☎️','📟','📠','🔋','🔌','💡','🔦','🕯️','🧯','🛢️','💸','💵','💴','💶','💷','💰','💳','🧾','💎'],
  },
  {
    name: 'Nature',
    icon: Flame,
    emojis: ['🔥','✨','🌟','⭐','💫','🌙','☀️','⛅','🌈','☁️','🌧️','⛈️','❄️','💨','🌪️','🌊','💧','💦','☔','🌱','🌿','🍀','🍁','🍂','🌻','🌷','🌹','🥀','🌴','🌵','🌳','🌲','🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🍆','🌽','🥕','🧅','🥔','🍞','🥐','🥨','🥯','🧀','🥚','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥗','🍝','🍜','🍣','🍤','🍙','🍚','🍛','🥘','🍲','🥣','🍰','🧁','🎂','🍮','🍭','🍬','🍫','🍩','🍪','🥤','🧋','☕','🍵','🍺','🍻','🥂','🍷','🍾'],
  },
];

export function EmojiPicker({ onPick, onClose, anchor, theme }: EmojiPickerProps) {
  const [cat, setCat] = useState(0);
  const [q, setQ] = useState('');
  const isDark = theme === 'dark';

  const emojis = q.trim()
    ? CATEGORIES.flatMap((c) => c.emojis).filter((e) => e.includes(q))
    : CATEGORIES[cat].emojis;

  const menuBg = isDark
    ? 'bg-[#233138]/95 border-white/10'
    : 'bg-white/95 border-white/70';
  const activeCatBg = isDark ? 'bg-white/10' : 'bg-emerald-500/15';

  return (
    <div
      className={`z-30 ${
        anchor === 'bottom' ? 'absolute bottom-full mb-3 left-0 w-[360px] max-w-[calc(100vw-2rem)]' : 'absolute inset-x-2 bottom-20'
      } glass-strong rounded-2xl p-3 ${menuBg} border animate-pop shadow-2xl`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
          <Search size={14} className={isDark ? 'text-white/50' : 'text-slate-500'} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search emojis…"
            className={`flex-1 text-xs outline-none bg-transparent ${isDark ? 'text-white placeholder:text-white/40' : 'text-slate-700 placeholder:text-slate-400'}`}
          />
          <button onClick={onClose} className={`${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'} text-xs px-1`}>
            ✕
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setCat(i)}
            title={c.name}
            className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition ${
              i === cat ? activeCatBg : ''
            } ${isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'}`}
          >
            <c.icon size={16} />
          </button>
        ))}
        <button
          onClick={() => onPick('➕')}
          className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
            isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-900/5'
          }`}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 mb-2 p-1 rounded-xl" style={{ background: isDark ? 'rgba(0,168,132,0.1)' : 'rgba(0,168,132,0.06)' }}>
        <span className={`text-[11px] px-2 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Quick</span>
        <div className="flex gap-1 ml-auto">
          {QUICK.map((e) => (
            <button
              key={e}
              onClick={() => onPick(e)}
              className="w-8 h-8 rounded-lg text-lg hover:scale-110 transition-transform"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[230px] overflow-y-auto grid grid-cols-8 gap-1 p-1">
        {emojis.slice(0, 320).map((e, i) => (
          <button
            key={`${e}-${i}`}
            onClick={() => onPick(e)}
            className="aspect-square rounded-lg text-xl hover:scale-110 hover:bg-white/50 dark:hover:bg-white/10 transition"
          >
            {e}
          </button>
        ))}
        {emojis.length === 0 && (
          <div className={`col-span-8 py-8 text-center text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            No matching emojis.
          </div>
        )}
      </div>
    </div>
  );
}
