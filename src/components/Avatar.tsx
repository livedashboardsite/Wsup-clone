import { initials, colorForId } from '@/lib/format';

interface AvatarProps {
  name: string;
  id: string;
  src?: string | null;
  size?: number;
  online?: boolean;
  className?: string;
}

export function Avatar({ name, id, src, size = 48, online, className = '' }: AvatarProps) {
  const dim = { width: size, height: size, minWidth: size, minHeight: size };
  const fontSize = Math.max(11, Math.floor(size * 0.4));
  return (
    <div className={`relative inline-block ${className}`} style={dim}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover"
          style={dim}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white font-medium select-none"
          style={{ ...dim, backgroundColor: colorForId(id), fontSize }}
        >
          {initials(name)}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 block rounded-full bg-[#25d366] border-2 border-white"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
