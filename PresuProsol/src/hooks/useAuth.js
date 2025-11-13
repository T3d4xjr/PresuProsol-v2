import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const useAuth = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (ignore) return;

      setSession(session);

      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('usuarios')
          .select(
            'id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url'
          )
          .eq('id', session.user.id)
          .maybeSingle();

        if (!ignore) {
          if (error) console.error('[useAuth] error cargando perfil:', error);
          setProfile(data ?? null);
        }
      } else {
        setProfile(null);
      }

      if (!ignore) setLoading(false);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      setSession(sess);
      setLoading(true);

      if (!sess?.user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select(
          'id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url'
        )
        .eq('id', sess.user.id)
        .maybeSingle();

      if (error) console.error('[useAuth] error onAuth:', error);
      setProfile(data ?? null);
      setLoading(false);
    });

    return () => {
      ignore = true;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // 👇 Añadido: función de logout para usar en Header
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[useAuth] error signOut:', error);
      return;
    }
    setSession(null);
    setProfile(null);
  };

  return { session, profile, loading, signOut };
};

export default useAuth;
export { useAuth };