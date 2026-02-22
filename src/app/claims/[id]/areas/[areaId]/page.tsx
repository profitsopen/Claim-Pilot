import Image from 'next/image';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';

export default async function AreaDetailPage({ params }: { params: { id: string; areaId: string } }) {
  const { user, supabase } = await requireUser();

  const { data: claim } = await supabase.from('claims').select('id,title').eq('id', params.id).eq('user_id', user.id).single();
  if (!claim) notFound();

  const { data: area } = await supabase
    .from('areas')
    .select('*')
    .eq('id', params.areaId)
    .eq('claim_id', claim.id)
    .single();
  if (!area) notFound();

  async function createDamageItem(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claim_id = String(formData.get('claim_id'));
    const area_id = String(formData.get('area_id'));

    const category = String(formData.get('category') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const qty = Number(formData.get('qty') || 1);
    const unit = String(formData.get('unit') || 'item').trim();
    const dimensions = String(formData.get('dimensions') || '').trim();
    const condition_notes = String(formData.get('condition_notes') || '').trim();
    const status = String(formData.get('status') || 'documented').trim();
    const est_replacement_cost = formData.get('est_replacement_cost')
      ? Number(formData.get('est_replacement_cost'))
      : null;

    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claim_id).eq('user_id', user.id).single();
    if (!ownerClaim || !category || !description) return;

    await supabase.from('damage_items').insert({
      claim_id,
      area_id,
      category,
      description,
      qty,
      unit,
      dimensions,
      condition_notes,
      status,
      est_replacement_cost
    });

    revalidatePath(`/claims/${claim_id}/areas/${area_id}`);
  }


  async function deleteDamageItem(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claim_id = String(formData.get('claim_id'));
    const area_id = String(formData.get('area_id'));
    const item_id = String(formData.get('item_id'));
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claim_id).eq('user_id', user.id).single();
    if (!ownerClaim) return;
    await supabase.from('damage_items').delete().eq('id', item_id).eq('claim_id', claim_id);
    revalidatePath(`/claims/${claim_id}/areas/${area_id}`);
  }

  async function uploadEvidence(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claim_id = String(formData.get('claim_id'));
    const damage_item_id = String(formData.get('damage_item_id') || '') || null;
    const caption = String(formData.get('caption') || '').trim();
    const file = formData.get('file') as File;

    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claim_id).eq('user_id', user.id).single();
    if (!ownerClaim || !file) return;

    const fileExt = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${claim_id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`;

    const { error } = await supabase.storage.from('claim-evidence').upload(path, file, { upsert: false });
    if (error) return;

    await supabase.from('evidence').insert({
      claim_id,
      damage_item_id,
      file_path: path,
      file_type: file.type || 'application/octet-stream',
      caption
    });

    revalidatePath(`/claims/${claim_id}/areas/${params.areaId}`);
  }

  const { data: damageItems } = await supabase.from('damage_items').select('*').eq('area_id', area.id).order('created_at');
  const { data: evidence } = await supabase
    .from('evidence')
    .select('*')
    .eq('claim_id', claim.id)
    .order('created_at', { ascending: false });

  const evidenceWithUrls =
    evidence?.map((ev) => ({
      ...ev,
      url: supabase.storage.from('claim-evidence').getPublicUrl(ev.file_path).data.publicUrl
    })) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{claim.title} · {area.name}</h1>
      <form action={createDamageItem} className="grid gap-3 rounded bg-white p-4 shadow md:grid-cols-2">
        <input type="hidden" name="claim_id" value={claim.id} />
        <input type="hidden" name="area_id" value={area.id} />
        <input name="category" required placeholder="Category (flooring, drywall)" />
        <input name="description" required placeholder="Item description" />
        <input name="qty" type="number" min={1} defaultValue={1} />
        <input name="unit" defaultValue="item" />
        <input name="dimensions" placeholder="Dimensions" />
        <input name="status" defaultValue="documented" placeholder="Status" />
        <textarea className="md:col-span-2" name="condition_notes" placeholder="Condition notes" />
        <input name="est_replacement_cost" type="number" step="0.01" placeholder="Estimated replacement cost" />
        <div className="md:col-span-2">
          <button type="submit">Add damage item</button>
        </div>
      </form>

      <form action={uploadEvidence} className="grid gap-3 rounded bg-white p-4 shadow md:grid-cols-2">
        <input type="hidden" name="claim_id" value={claim.id} />
        <select name="damage_item_id">
          <option value="">General claim evidence</option>
          {damageItems?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.category} - {item.description}
            </option>
          ))}
        </select>
        <input name="caption" placeholder="Caption" />
        <input type="file" name="file" accept="image/*,application/pdf" required className="md:col-span-2" />
        <div className="md:col-span-2">
          <button type="submit">Upload evidence</button>
        </div>
      </form>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Damage items</h2>
        <div className="space-y-3">
          {damageItems?.map((item) => (
            <div key={item.id} className="rounded border p-3 text-sm flex justify-between gap-2">
              <div>
                <p className="font-medium">{item.category}: {item.description}</p>
                <p>
                  Qty {item.qty} {item.unit} · {item.status} · ${item.est_replacement_cost ?? 0}
                </p>
                <p className="text-slate-600">{item.condition_notes}</p>
              </div>
              <form action={deleteDamageItem}>
                <input type="hidden" name="claim_id" value={claim.id} />
                <input type="hidden" name="area_id" value={area.id} />
                <input type="hidden" name="item_id" value={item.id} />
                <button className="bg-red-700">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Evidence</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {evidenceWithUrls.map((ev) => (
            <figure key={ev.id} className="rounded border p-2">
              {ev.file_type.startsWith('image/') ? (
                <Image src={ev.url} alt={ev.caption || 'evidence'} width={320} height={220} className="h-40 w-full object-cover" />
              ) : (
                <a href={ev.url} target="_blank">View file</a>
              )}
              <figcaption className="text-xs text-slate-600">{ev.caption || 'No caption'}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
