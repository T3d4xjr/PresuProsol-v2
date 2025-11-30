// ./api/perfil.js
import { supabase } from "./supabaseClient";

export async function actualizarPerfil(userId, campos) {
  const payload = {
    ...campos,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("usuarios")
    .update(payload)
    .eq("id", userId);

  if (error) {
    console.error("[API PERFIL] ❌ Error actualizando perfil:", error);
    throw error;
  }

  return true;
}
