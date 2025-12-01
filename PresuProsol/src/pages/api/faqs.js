// ./api/faqs.js
import { supabase } from "../../lib/supabaseClient";

export async function fetchFaqsActivas() {
  console.log("📚 [API] Cargando FAQs");

  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("❌ [API] Error cargando FAQs:", error);
    throw error;
  }

  console.log("✅ [API] FAQs cargadas:", data?.length);
  return data || [];
}
