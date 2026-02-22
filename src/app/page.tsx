import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function DashboardPage() {
  const { user, supabase } = await requireUser();

  async function createClaim(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();

    const title = String(formData.get('title') || '').trim();
    const loss_date = String(formData.get('loss_date') || '');
    const loss_cause = String(formData.get('loss_cause') || '').trim();
    const location = String(formData.get('location') || '').trim();
    const narrative = String(formData.get('narrative') || '').trim();

    if (!title || !loss_date || !loss_cause || !location) return;

    const { data } = await supabase
      .from('claims')
      .insert({ title, loss_date, loss_cause, location, narrative, user_id: user.id })
      .select('id')
      .single();

    if (data?.id) redirect(`/claims/${data.id}`);
  }

  async function deleteClaim(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const id = String(formData.get('id'));
    await supabase.from('claims').delete().eq('id', id).eq('user_id', user.id);
    revalidatePath('/');
  }

  const { data: claims } = await supabase
    .from('claims')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-white p-4 shadow">
        <h1 className="mb-4 text-2xl font-semibold">Create Claim</h1>
        <form action={createClaim} className="grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Claim title" />
          <input name="loss_date" required type="date" />
          <input name="loss_cause" required placeholder="Cause (water leak, flood...)" />
          <input name="location" required placeholder="Property address" />
          <textarea name="narrative" placeholder="What happened?" className="md:col-span-2" />
          <div className="md:col-span-2">
            <button type="submit">Create claim</button>
          </div>
        </form>
      </section>

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-xl font-semibold">Your claims</h2>
        <ul className="space-y-2">
          {claims?.map((claim) => (
            <li key={claim.id} className="flex items-start justify-between rounded border p-3 gap-3">
              <div>
                <Link href={`/claims/${claim.id}`} className="font-medium">
                  {claim.title}
                </Link>
                <p className="text-sm text-slate-600">
                  {claim.loss_date} · {claim.loss_cause} · {claim.location}
                </p>
              </div>
              <form action={deleteClaim}>
                <input type="hidden" name="id" value={claim.id} />
                <button type="submit" className="bg-red-700">Delete</button>
              </form>
            </li>
          ))}
          {!claims?.length ? <p className="text-sm text-slate-600">No claims yet.</p> : null}
        </ul>
      </section>
    </div>
  );
}
