import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (ignore) return;
      setSession(session);

      if (session?.user?.id) {
        const { data } = await supabase
          .from("usuarios")
          .select(
            "id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url"
          )
          .eq("id", session.user.id)
          .maybeSingle();

        setProfile(data ?? null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      if (!sess?.user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }
      supabase
        .from("usuarios")
        .select(
          "id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url"
        )
        .eq("id", sess.user.id)
        .maybeSingle()
        .then(({ data }) => {
          setProfile(data ?? null);
          setLoading(false);
        });
    });

    return () => {
      ignore = true;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const refreshProfile = (newData) => {
    setProfile((prev) => ({ ...prev, ...newData }));
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("[signOut]", error);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
