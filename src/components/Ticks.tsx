import { Check, CheckCheck } from 'lucide-react';
import type { MessageStatus } from '@/types/database';

interface TicksProps {
  status?: MessageStatus;
  out: boolean;
  color?: string;
  size?: number;
}

/**
 * Renders WhatsApp-style message ticks.
 * - outgoing single check = sent (gray)
 * - outgoing double check = delivered (gray)
 * - outgoing double check blue = read
 * - incoming messages show no ticks
 */
export function Ticks({ status, out, color, size = 16 }: TicksProps) {
  if (!out) return null;
  const isRead = status === 'read';
  const isDelivered = status === 'delivered' || isRead;
  const c = color ?? (isRead ? '#53bdeb' : '#667781');
  if (isDelivered) {
    return <CheckCheck size={size} color={c} strokeWidth={2.5} className="shrink-0" />;
  }
  return <Check size={size} color={c} strokeWidth={2.5} className="shrink-0" />;
}
