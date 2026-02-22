import { redirect } from 'next/navigation';
import { createClient } from './supabase-server';

export async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  return { user: data.user, supabase };
}
