// @/pages/api/registroUsuario.js
import { supabase } from "./supabaseClient";

export async function registrarSolicitudAcceso({ usuario, email, cif, pass }) {
  // Crear usuario en Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
  });

  if (error) {
    console.error("[API REGISTRO] ❌ Error al crear usuario:", error);
    throw error; // se captura en el componente
  }

  const authUser = data.user;
  console.log("[API REGISTRO] ✅ Usuario creado en Auth:", authUser.id);

  // Insertar solicitud en administracion_usuarios
  const { error: insertErr } = await supabase
    .from("administracion_usuarios")
    .insert({
      id: authUser.id,
      auth_user_id: authUser.id,
      usuario,
      email,
      cif,
      habilitado: false,
      rol: "usuario",
      created_at: new Date().toISOString(),
    });

  if (insertErr) {
    console.error(
      "[API REGISTRO] ❌ Error al insertar en administracion_usuarios:",
      insertErr
    );
    throw insertErr; // se captura en el componente
  }

  console.log("[API REGISTRO] ✅ Solicitud guardada correctamente");
  return { user: authUser };
}
