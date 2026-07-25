import type { Profile, Message } from '@/types/database';

const AVATAR_COLORS = [
  '#128C7E', '#075E54', '#25D366', '#34B7F1', '#7E57C2',
  '#EC407A', '#EF5350', '#FF7043', '#FFA726', '#66BB6A',
  '#26A69A', '#5C6BC0', '#AB47BC', '#26C6DA', '#9CCC65',
];

export function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function displayName(p: Profile | undefined | null): string {
  if (!p) return 'Unknown';
  return p.name?.trim() || p.phone_display || 'Unknown';
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatChatListTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return formatTime(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatLastSeen(p: Profile | undefined | null): string {
  if (!p) return '';
  if (p.is_online) return 'online';
  const d = new Date(p.last_seen);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `last seen today at ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString())
    return `last seen yesterday at ${time}`;
  return `last seen ${d.toLocaleDateString([], {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })}`;
}

export function previewText(m: Message | null | undefined): string {
  if (!m) return '';
  switch (m.type) {
    case 'image': return 'Photo';
    case 'video': return 'Video';
    case 'audio': return 'Voice message';
    case 'document': return m.media_name || 'Document';
    default: return m.body || '';
  }
}

export function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function isReversed(m1: Message | undefined, m2: Message | undefined): boolean {
  if (!m1 || !m2) return false;
  return new Date(m2.created_at).getTime() - new Date(m1.created_at).getTime() < 60000;
}
