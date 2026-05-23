import { useState, useEffect } from 'react';
import { supabase, hastaIdAl } from '../lib/supabase';
import type { Hasta } from '../types';

export function useHasta() {
  const [hasta, setHasta] = useState<Hasta | null>(null);
  const [hastaId, setHastaId] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let aktif = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user || !aktif) { setYukleniyor(false); return; }

      const hId = await hastaIdAl(session.user.id);
      if (!hId || !aktif) { setYukleniyor(false); return; }

      setHastaId(hId);

      const { data } = await supabase
        .from('hastalar_mobil')
        .select('*')
        .eq('id', hId)
        .single();

      if (aktif) {
        setHasta(data);
        setYukleniyor(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) { setHasta(null); setHastaId(null); return; }
        const hId = await hastaIdAl(session.user.id);
        setHastaId(hId);
      }
    );

    return () => {
      aktif = false;
      subscription.unsubscribe();
    };
  }, []);

  return { hasta, hastaId, yukleniyor };
}
