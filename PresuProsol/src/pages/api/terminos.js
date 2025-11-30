// ./api/terminos.js
import { supabase } from "./supabaseClient";

export async function fetchTerminosActivos() {
  console.log("📄 [API] Cargando términos");

  const { data, error } = await supabase
    .from("terminos_condiciones")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("❌ [API] Error cargando términos:", error);
    throw error;
  }

  return data || [];
}
