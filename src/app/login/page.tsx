'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const supabase = createClient();

  async function signIn(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = '/';
  }

  async function signUp(e: FormEvent) {
    e.preventDefault();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo }
    });
    setMessage(error ? error.message : 'Check your email to confirm, then log in.');
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-slate-600">Use email/password. New users can sign up below.</p>
      <form className="space-y-3" onSubmit={signIn}>
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button type="submit">Sign in</button>
          <button type="button" onClick={signUp} className="bg-slate-700">
            Sign up
          </button>
        </div>
      </form>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
