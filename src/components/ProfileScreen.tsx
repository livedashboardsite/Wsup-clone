import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Edit2, Check, X, LogOut, Lock } from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuth } from '@/lib/auth';
import { updateProfile } from '@/lib/chat';
import { uploadMedia } from '@/lib/storage';
import { displayName } from '@/lib/format';

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { profile, signOut, refreshProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [about, setAbout] = useState(profile?.about ?? '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const saveName = async () => {
    try {
      await updateProfile({ name });
      await refreshProfile();
      setEditingName(false);
    } catch (err) {
      console.error('saveName error:', err);
    }
  };

  const saveAbout = async () => {
    try {
      await updateProfile({ about });
      await refreshProfile();
      setEditingAbout(false);
    } catch (err) {
      console.error('saveAbout error:', err);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const up = await uploadMedia(file, profile.id, 'avatars');
      await updateProfile({ avatar_url: up.url });
      await refreshProfile();
    } catch (err) {
      console.error('avatar upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="hover:bg-white/10 rounded-full p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-medium">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center py-8 bg-[#f0f2f5]">
          <div className="relative">
            <Avatar
              name={displayName(profile)}
              id={profile.id}
              src={profile.avatar_url}
              size={140}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center shadow-lg hover:bg-[#005c4b] disabled:opacity-60"
            >
              <Camera size={18} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
          {uploading && <p className="text-xs text-[#667781] mt-2">Uploading…</p>}
        </div>

        {/* Name */}
        <div className="px-4 py-3 border-b border-[#e9edef]">
          <div className="text-xs text-[#667781] mb-1">Your name</div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="flex-1 border-b border-[#008069] outline-none py-1 text-sm"
              />
              <button onClick={saveName} className="text-[#008069] p-1"><Check size={18} /></button>
              <button onClick={() => { setEditingName(false); setName(profile.name); }} className="text-[#667781] p-1"><X size={18} /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm">{profile.name || 'Add a name'}</span>
              <button onClick={() => setEditingName(true)} className="text-[#667781] hover:text-[#111b21]"><Edit2 size={16} /></button>
            </div>
          )}
        </div>

        {/* About */}
        <div className="px-4 py-3 border-b border-[#e9edef]">
          <div className="text-xs text-[#667781] mb-1">About</div>
          {editingAbout ? (
            <div className="flex items-center gap-2">
              <input
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                autoFocus
                className="flex-1 border-b border-[#008069] outline-none py-1 text-sm"
              />
              <button onClick={saveAbout} className="text-[#008069] p-1"><Check size={18} /></button>
              <button onClick={() => { setEditingAbout(false); setAbout(profile.about); }} className="text-[#667781] p-1"><X size={18} /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm">{profile.about}</span>
              <button onClick={() => setEditingAbout(true)} className="text-[#667781] hover:text-[#111b21]"><Edit2 size={16} /></button>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="px-4 py-3 border-b border-[#e9edef]">
          <div className="text-xs text-[#667781] mb-1">Phone</div>
          <div className="text-sm">{profile.phone_display || 'Not set'}</div>
        </div>

        {/* Encryption note */}
        <div className="px-4 py-4 flex items-start gap-2 text-xs text-[#667781]">
          <Lock size={14} className="mt-0.5 shrink-0" />
          <p>
            Your private encryption key is stored only in this browser. Messages are
            end-to-end encrypted; the server only relays encrypted data.
          </p>
        </div>

        <div className="px-4 py-3">
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-[#d93025] hover:bg-[#fce8e6] w-full px-3 py-2.5 rounded-md text-sm font-medium"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
