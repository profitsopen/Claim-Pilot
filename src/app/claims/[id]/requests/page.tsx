import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { extractAsks } from '@/lib/request-parser';

export default async function RequestsPage({ params }: { params: { id: string } }) {
  const { user, supabase } = await requireUser();
  const { data: claim } = await supabase.from('claims').select('id,title').eq('id', params.id).eq('user_id', user.id).single();
  if (!claim) notFound();

  async function createRequest(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claimId = String(formData.get('claim_id'));
    const request_text = String(formData.get('request_text') || '').trim();
    const due_date = String(formData.get('due_date') || '') || null;
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim || !request_text) return;
    const { data: req } = await supabase
      .from('insurer_requests')
      .insert({ claim_id: claimId, request_text, due_date, status: 'open' })
      .select('id')
      .single();
    await supabase.from('tasks').insert({ claim_id: claimId, insurer_request_id: req?.id ?? null, title: `Provide: ${request_text}`, due_date, status: 'open' });
    revalidatePath(`/claims/${claimId}/requests`);
  }

  async function createTask(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claimId = String(formData.get('claim_id'));
    const title = String(formData.get('title') || '').trim();
    const due_date = String(formData.get('due_date') || '') || null;
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim || !title) return;
    await supabase.from('tasks').insert({ claim_id: claimId, title, due_date, status: 'open' });
    revalidatePath(`/claims/${claimId}/requests`);
  }

  async function parseRequestText(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claimId = String(formData.get('claim_id'));
    const bulkText = String(formData.get('bulk_text') || '');
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim || !bulkText.trim()) return;
    const asks = extractAsks(bulkText);

    for (const ask of asks) {
      const { data: req } = await supabase
        .from('insurer_requests')
        .insert({ claim_id: claimId, request_text: ask, status: 'open' })
        .select('id')
        .single();
      await supabase.from('tasks').insert({ claim_id: claimId, insurer_request_id: req?.id ?? null, title: `Provide: ${ask}`, status: 'open' });
    }

    revalidatePath(`/claims/${claimId}/requests`);
  }

  async function updateRequest(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claimId = String(formData.get('claim_id'));
    const id = String(formData.get('id'));
    const status = String(formData.get('status'));
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim) return;
    await supabase.from('insurer_requests').update({ status }).eq('id', id).eq('claim_id', claimId);
    revalidatePath(`/claims/${claimId}/requests`);
  }

  async function deleteRequest(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claimId = String(formData.get('claim_id'));
    const id = String(formData.get('id'));
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim) return;
    await supabase.from('insurer_requests').delete().eq('id', id).eq('claim_id', claimId);
    revalidatePath(`/claims/${claimId}/requests`);
  }

  async function updateTask(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claimId = String(formData.get('claim_id'));
    const id = String(formData.get('id'));
    const status = String(formData.get('status'));
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim) return;
    await supabase.from('tasks').update({ status }).eq('id', id).eq('claim_id', claimId);
    revalidatePath(`/claims/${claimId}/requests`);
  }

  async function deleteTask(formData: FormData) {
    'use server';
    const { user, supabase } = await requireUser();
    const claimId = String(formData.get('claim_id'));
    const id = String(formData.get('id'));
    const { data: ownerClaim } = await supabase.from('claims').select('id').eq('id', claimId).eq('user_id', user.id).single();
    if (!ownerClaim) return;
    await supabase.from('tasks').delete().eq('id', id).eq('claim_id', claimId);
    revalidatePath(`/claims/${claimId}/requests`);
  }

  const { data: requests } = await supabase.from('insurer_requests').select('*').eq('claim_id', claim.id).order('created_at', { ascending: false });
  const { data: tasks } = await supabase.from('tasks').select('*').eq('claim_id', claim.id).order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Insurer Requests · {claim.title}</h1>

      <form action={parseRequestText} className="rounded bg-white p-4 shadow space-y-3">
        <input type="hidden" name="claim_id" value={claim.id} />
        <h2 className="font-semibold">Paste insurer email/letter</h2>
        <textarea name="bulk_text" required placeholder="Paste text to extract asks" />
        <button type="submit">Extract into requests + tasks</button>
      </form>

      <form action={createRequest} className="grid gap-3 rounded bg-white p-4 shadow md:grid-cols-2">
        <input type="hidden" name="claim_id" value={claim.id} />
        <input name="request_text" required placeholder="Single request" className="md:col-span-2" />
        <input name="due_date" type="date" />
        <div className="md:col-span-2"><button type="submit">Add request</button></div>
      </form>

      <form action={createTask} className="grid gap-3 rounded bg-white p-4 shadow md:grid-cols-2">
        <input type="hidden" name="claim_id" value={claim.id} />
        <input name="title" required placeholder="Manual task title" className="md:col-span-2" />
        <input name="due_date" type="date" />
        <div className="md:col-span-2"><button type="submit">Add task</button></div>
      </form>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Requests</h2>
        <ul className="space-y-2 text-sm">
          {requests?.map((req) => (
            <li key={req.id} className="rounded border p-2 flex justify-between gap-2 items-center">
              <div>{req.request_text} · {req.status} {req.due_date ? `· due ${req.due_date}` : ''}</div>
              <div className="flex gap-2">
                <form action={updateRequest} className="flex gap-2 items-center">
                  <input type="hidden" name="claim_id" value={claim.id} />
                  <input type="hidden" name="id" value={req.id} />
                  <select name="status" defaultValue={req.status}>
                    <option value="open">open</option><option value="in_progress">in_progress</option><option value="closed">closed</option>
                  </select>
                  <button>Save</button>
                </form>
                <form action={deleteRequest}>
                  <input type="hidden" name="claim_id" value={claim.id} />
                  <input type="hidden" name="id" value={req.id} />
                  <button className="bg-red-700">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Tasks</h2>
        <ul className="space-y-2 text-sm">
          {tasks?.map((task) => (
            <li key={task.id} className="rounded border p-2 flex justify-between gap-2 items-center">
              <div>{task.title} · {task.status} {task.due_date ? `· due ${task.due_date}` : ''}</div>
              <div className="flex gap-2">
                <form action={updateTask} className="flex gap-2 items-center">
                  <input type="hidden" name="claim_id" value={claim.id} />
                  <input type="hidden" name="id" value={task.id} />
                  <select name="status" defaultValue={task.status}>
                    <option value="open">open</option><option value="in_progress">in_progress</option><option value="done">done</option>
                  </select>
                  <button>Save</button>
                </form>
                <form action={deleteTask}>
                  <input type="hidden" name="claim_id" value={claim.id} />
                  <input type="hidden" name="id" value={task.id} />
                  <button className="bg-red-700">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
