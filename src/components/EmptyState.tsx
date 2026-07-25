import { MessageCircle, Lock } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#f0f2f5] text-center px-8 border-l border-[#e9edef]">
      <div className="w-64 h-64 rounded-full bg-[#e9edef] flex items-center justify-center mb-6">
        <MessageCircle size={120} className="text-[#667781] opacity-40" />
      </div>
      <h1 className="text-3xl font-light text-[#111b21] mb-3">WhatsApp Web</h1>
      <p className="text-sm text-[#667781] max-w-md mb-6">
        Send and receive messages without keeping your phone online. All messages are
        end-to-end encrypted for your security and privacy.
      </p>
      <div className="flex items-center gap-2 text-xs text-[#667781]">
        <Lock size={14} />
        <span>Your personal messages are end-to-end encrypted</span>
      </div>
    </div>
  );
}
