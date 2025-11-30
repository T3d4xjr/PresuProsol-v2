// ./api/politicaPrivacidad.js
import { supabase } from "./supabaseClient";

export async function fetchPoliticaPrivacidadActiva() {
  console.log("🔐 [API] Cargando política de privacidad");

  const { data, error } = await supabase
    .from("politica_privacidad")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("❌ [API] Error cargando política:", error);
    throw error;
  }

  console.log("✅ [API] Política cargada:", data?.length);
  return data || [];
}
