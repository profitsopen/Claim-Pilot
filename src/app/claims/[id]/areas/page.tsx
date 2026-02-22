import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';

export default async function AreasPage({ params }: { params: { id: string } }) {
  const { user, supabase } = await requireUser();
  const { data: claim } = await supabase.from('claims').select('id,title').eq('id', params.id).eq('user_id', user.id).single();

  if (!claim) notFound();

  async function createArea(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claimId = String(formData.get('claim_id'));
    const name = String(formData.get('name') || '').trim();
    const notes = String(formData.get('notes') || '').trim();

    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim || !name) return;

    await supabase.from('areas').insert({ claim_id: claimId, name, notes });
    revalidatePath(`/claims/${claimId}/areas`);
  }

  async function deleteArea(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const areaId = String(formData.get('area_id'));
    const claimId = String(formData.get('claim_id'));
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim) return;
    await supabase.from('areas').delete().eq('id', areaId).eq('claim_id', claimId);
    revalidatePath(`/claims/${claimId}/areas`);
  }

  const { data: areas } = await supabase.from('areas').select('*').eq('claim_id', claim.id).order('created_at');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Areas · {claim.title}</h1>
      <form action={createArea} className="rounded bg-white p-4 shadow space-y-3">
        <input type="hidden" name="claim_id" value={claim.id} />
        <input name="name" required placeholder="Area name (Kitchen)" />
        <textarea name="notes" placeholder="Area notes" />
        <button type="submit">Add area</button>
      </form>

      <ul className="space-y-2">
        {areas?.map((area) => (
          <li key={area.id} className="flex justify-between gap-3 rounded border bg-white p-3">
            <div>
              <Link href={`/claims/${claim.id}/areas/${area.id}`} className="font-medium">
                {area.name}
              </Link>
              <p className="text-sm text-slate-600">{area.notes || 'No notes.'}</p>
            </div>
            <form action={deleteArea}>
              <input type="hidden" name="area_id" value={area.id} />
              <input type="hidden" name="claim_id" value={claim.id} />
              <button className="bg-red-700">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
