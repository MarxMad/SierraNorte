import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Vercel Cron: libera apartados vencidos cada hora.
// Configura CRON_SECRET en el entorno y en vercel.json.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('liberar_apartados_vencidos');

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, liberados: data });
}
