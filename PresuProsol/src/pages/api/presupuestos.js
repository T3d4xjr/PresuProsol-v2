// ./api/presupuestos.js
import { supabase } from "../../lib/supabaseClient";

export async function fetchPresupuestosUsuario(userId) {
  const { data, error } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API PRESUPUESTOS] ❌ Error cargando presupuestos:", error);
    throw error;
  }

  return data || [];
}

export async function eliminarPresupuesto(id) {
  const { error } = await supabase
    .from("presupuestos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[API PRESUPUESTOS] ❌ Error eliminando presupuesto:", error);
    throw error;
  }

  return true;
}
