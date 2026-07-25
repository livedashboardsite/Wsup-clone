import { useState } from 'react';
import { MessageCircle, Lock, Mail, Phone, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'signin' ? signIn : () => signUp(email, password, name, phone);
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5]">
      {/* Header band */}
      <div className="bg-[#008069] text-white py-6 px-6 shadow-md">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <MessageCircle size={32} className="shrink-0" />
          <div>
            <h1 className="text-xl font-semibold">WhatsApp Web</h1>
            <p className="text-sm text-white/80">Secure, simple messaging</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 animate-slide-up">
          <h2 className="text-2xl font-light text-center text-[#111b21] mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-center text-sm text-[#667781] mb-6">
            {mode === 'signin'
              ? 'Sign in to continue to WhatsApp Web'
              : 'Join WhatsApp to start messaging securely'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Field
                  icon={<UserIcon size={18} />}
                  label="Display name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Jane Doe"
                  required
                />
                <Field
                  icon={<Phone size={18} />}
                  label="Phone number"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+1 555 000 0000"
                  type="tel"
                  required
                />
              </>
            )}
            <Field
              icon={<Mail size={18} />}
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              type="email"
              required
            />
            <Field
              icon={<Lock size={18} />}
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
              required
            />

            {error && (
              <div className="text-sm text-[#d93025] bg-[#fce8e6] rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008069] hover:bg-[#005c4b] disabled:opacity-60 text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#667781]">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-[#008069] hover:text-[#005c4b] font-medium"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#e9edef] flex items-start gap-2 text-xs text-[#667781]">
            <Lock size={14} className="mt-0.5 shrink-0" />
            <p>
              Messages are end-to-end encrypted on your device. Your private key never
              leaves this browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

function Field({ icon, label, value, onChange, placeholder, type = 'text', required }: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#667781] mb-1 block">{label}</span>
      <div className="flex items-center gap-2 border border-[#e9edef] rounded-md px-3 py-2.5 focus-within:border-[#008069] transition-colors">
        <span className="text-[#667781]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 outline-none text-sm text-[#111b21] bg-transparent"
        />
      </div>
    </label>
  );
}
