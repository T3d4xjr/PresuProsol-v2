// src/pages/api/loginUsuario.js
import { supabase } from "../../lib/supabaseClient";

// Login con email y password (wrapper directo de Supabase)
export function signInWithEmailPassword({ email, password }) {
  // Devolvemos la promesa tal cual para poder usar .then/.catch en el componente
  return supabase.auth.signInWithPassword({ email, password });
}

// Leer fila en administracion_usuarios por email
export async function fetchAdminUsuarioByEmail(email) {
  const { data, error } = await supabase
    .from("administracion_usuarios")
    .select("id, usuario, email, cif, habilitado, rol")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[API LOGIN] ❌ Error leyendo administracion_usuarios:", error);
    throw error;
  }

  return data; // puede ser null si no existe
}

// Leer perfil en usuarios por id
export async function fetchPerfilUsuarioById(userId) {
  const { data, error } = await supabase
    .from("usuarios")
    .select(
      "id, usuario, email, cif, habilitado, rol, telefono, direccion, nacionalidad, foto_url"
    )
    .eq("id", userId)
    .maybeSingle();

  // Aquí NO lanzamos error a propósito, igual que hacías antes:
  // devolvemos ambos y decides en el componente qué hacer
  return { perfil: data, error };
}

// Crear perfil en usuarios a partir de los datos de administracion_usuarios
export async function createPerfilUsuarioDesdeAdmin(userId, adminRow) {
  const { error } = await supabase.from("usuarios").insert({
    id: userId,
    usuario: adminRow.usuario,
    email: adminRow.email,
    cif: adminRow.cif,
    habilitado: adminRow.habilitado,
    rol: adminRow.rol,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[API LOGIN] ⚠️ Error creando perfil de usuario:", error);
    throw error;
  }

  return true;
}
