// ./api/pedidos.js
import { supabase } from "./supabaseClient";

export async function fetchPedidosUsuario(userId) {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, presupuestos(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API PEDIDOS] ❌ Error cargando pedidos:", error);
    throw error;
  }

  return data || [];
}
