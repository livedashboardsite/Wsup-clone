import { MessageCircle, Lock } from 'lucide-react';
import type { Theme } from '@/lib/localStore';

export function EmptyState({ theme }: { theme: Theme }) {
  const themeBg = theme === 'dark' ? 'bg-[#222e35]' : 'bg-[#f0f2f5]';
  const themeBorder = theme === 'dark' ? 'border-[#222d34]' : 'border-[#e9edef]';
  const themeTextPrimary = theme === 'dark' ? 'text-[#e9edef]' : 'text-[#111b21]';
  const themeTextSecondary = theme === 'dark' ? 'text-[#8696a0]' : 'text-[#667781]';
  const themeCircleBg = theme === 'dark' ? 'bg-[#111b21]' : 'bg-[#e9edef]';
  const themeIconColor = theme === 'dark' ? 'text-[#8696a0]' : 'text-[#667781]';

  return (
    <div
      className={`flex flex-col items-center justify-center h-full ${themeBg} text-center px-8 border-l ${themeBorder}`}
    >
      <div className={`w-64 h-64 rounded-full ${themeCircleBg} flex items-center justify-center mb-6`}>
        <MessageCircle size={120} className={`${themeIconColor} opacity-40`} />
      </div>
      <h1 className={`text-3xl font-light ${themeTextPrimary} mb-3`}>WhatsApp Web</h1>
      <p className={`text-sm ${themeTextSecondary} max-w-md mb-6`}>
        Send and receive messages without keeping your phone online. All messages are
        end-to-end encrypted for your security and privacy.
      </p>
      <div className={`flex items-center gap-2 text-xs ${themeTextSecondary}`}>
        <Lock size={14} />
        <span>Your personal messages are end-to-end encrypted</span>
      </div>
    </div>
  );
}
