import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export default async function ClaimOverviewPage({ params }: { params: { id: string } }) {
  const { user, supabase } = await requireUser();
  const { data: claim } = await supabase
    .from('claims')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!claim) notFound();

  const [{ count: areaCount }, { count: itemCount }, { count: requestCount }, { count: taskCount }] = await Promise.all([
    supabase.from('areas').select('*', { count: 'exact', head: true }).eq('claim_id', claim.id),
    supabase.from('damage_items').select('*', { count: 'exact', head: true }).eq('claim_id', claim.id),
    supabase.from('insurer_requests').select('*', { count: 'exact', head: true }).eq('claim_id', claim.id),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('claim_id', claim.id)
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{claim.title}</h1>
      <p className="text-sm text-slate-700">{claim.loss_date} · {claim.loss_cause}</p>
      <p className="text-sm text-slate-700">{claim.location}</p>
      <p className="rounded bg-white p-4 shadow">{claim.narrative || 'No narrative yet.'}</p>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href={`/claims/${claim.id}/areas`} className="rounded bg-white p-4 shadow no-underline">
          Areas ({areaCount ?? 0}) / Damage Items ({itemCount ?? 0})
        </Link>
        <Link href={`/claims/${claim.id}/requests`} className="rounded bg-white p-4 shadow no-underline">
          Insurer Requests ({requestCount ?? 0}) / Tasks ({taskCount ?? 0})
        </Link>
        <Link href={`/claims/${claim.id}/export`} className="rounded bg-white p-4 shadow no-underline md:col-span-2">
          Export Claim Packet PDF
        </Link>
      </div>
    </div>
  );
}
