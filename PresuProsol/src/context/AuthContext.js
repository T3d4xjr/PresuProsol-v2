// context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId) => {
      const { data, error } = await supabase
        .from("usuarios")
        .select(
          "id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url"
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AuthContext] Error cargando perfil:", error);
      }

      if (mounted) {
        setProfile(data ?? null);
      }
    };

    const initSession = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthContext] Error obteniendo sesión:", error);
          if (mounted) {
            setSession(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        setSession(currentSession);

        if (currentSession?.user?.id) {
          await loadProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("[AuthContext] Exception en initSession:", err);
        if (mounted) {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);

      if (currentSession?.user?.id) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const refreshProfile = async (newData) => {
    if (newData) {
      setProfile((prev) => ({ ...(prev || {}), ...newData }));
      return;
    }

    if (session?.user?.id) {
      const { data } = await supabase
        .from("usuarios")
        .select(
          "id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url"
        )
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile(data ?? null);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error("[AuthContext] Error en signOut:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
