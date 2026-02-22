import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';

export async function Header() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  async function signOut() {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-slate-900 no-underline">
          Claim Copilot
        </Link>
        {data.user ? (
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
