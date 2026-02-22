import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export default async function ExportPage({ params }: { params: { id: string } }) {
  const { user, supabase } = await requireUser();
  const { data: claim } = await supabase.from('claims').select('id,title').eq('id', params.id).eq('user_id', user.id).single();

  if (!claim) notFound();

  return (
    <div className="space-y-4 rounded bg-white p-4 shadow">
      <h1 className="text-2xl font-semibold">Export Claim Packet</h1>
      <p className="text-sm text-slate-700">Generate a PDF summary with damage inventory and photo appendix.</p>
      <Link href={`/claims/${claim.id}/export/pdf`} className="inline-block rounded-md bg-slate-900 px-4 py-2 text-white no-underline">
        Download Claim Packet PDF
      </Link>
    </div>
  );
}
