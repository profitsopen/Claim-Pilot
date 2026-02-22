import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createClient } from '@/lib/supabase-server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: claim } = await supabase.from('claims').select('*').eq('id', params.id).eq('user_id', user.id).single();
  if (!claim) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: areas } = await supabase.from('areas').select('id,name').eq('claim_id', claim.id);
  const areaMap = new Map((areas || []).map((a) => [a.id, a.name]));
  const { data: damageItems } = await supabase.from('damage_items').select('*').eq('claim_id', claim.id).order('created_at');
  const { data: evidence } = await supabase.from('evidence').select('*').eq('claim_id', claim.id).order('created_at');

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([612, 792]);
  let y = 760;
  const line = (text: string, opts?: { size?: number; bold?: boolean }) => {
    const size = opts?.size ?? 11;
    page.drawText(text, { x: 40, y, size, font: opts?.bold ? bold : regular, color: rgb(0, 0, 0) });
    y -= size + 8;
  };

  line('Claim Copilot - Claim Packet', { size: 18, bold: true });
  line(`Title: ${claim.title}`, { bold: true });
  line(`Loss Date: ${claim.loss_date}`);
  line(`Cause: ${claim.loss_cause}`);
  line(`Location: ${claim.location}`);
  line('Narrative:', { bold: true });
  for (const chunk of (claim.narrative || 'No narrative').match(/.{1,95}(\s|$)/g) || []) {
    line(chunk.trim());
  }

  y -= 8;
  line('Damage Inventory', { size: 14, bold: true });
  line('Area | Category | Description | Qty | Notes | Est. Cost', { bold: true, size: 10 });

  for (const item of damageItems || []) {
    if (y < 60) {
      page = pdf.addPage([612, 792]);
      y = 760;
    }
    const row = `${areaMap.get(item.area_id) || 'Unknown'} | ${item.category} | ${item.description} | ${item.qty} ${item.unit} | ${(item.condition_notes || '').slice(0, 28)} | $${item.est_replacement_cost ?? 0}`;
    for (const chunk of row.match(/.{1,105}(\s|$)/g) || []) {
      line(chunk.trim(), { size: 9 });
    }
  }

  page = pdf.addPage([612, 792]);
  y = 760;
  line('Photo Appendix', { size: 16, bold: true });

  for (const ev of evidence || []) {
    if (!ev.file_type.startsWith('image/')) continue;
    const publicUrl = supabase.storage.from('claim-evidence').getPublicUrl(ev.file_path).data.publicUrl;
    const response = await fetch(publicUrl);
    if (!response.ok) continue;
    const bytes = await response.arrayBuffer();
    let image;
    try {
      image = ev.file_type.includes('png') ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    } catch {
      continue;
    }

    if (y < 220) {
      page = pdf.addPage([612, 792]);
      y = 760;
    }

    const imgDims = image.scale(160 / image.width);
    page.drawImage(image, { x: 40, y: y - imgDims.height, width: imgDims.width, height: imgDims.height });
    page.drawText(ev.caption || 'No caption', { x: 220, y: y - 20, size: 10, font: regular });
    y -= Math.max(imgDims.height + 24, 180);
  }

  const output = await pdf.save();

  return new NextResponse(Buffer.from(output), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="claim-packet-${claim.id}.pdf"`
    }
  });
}
