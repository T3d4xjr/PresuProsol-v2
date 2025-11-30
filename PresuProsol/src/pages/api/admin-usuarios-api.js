// src/pages/api/admin-usuarios-api.js
import { supabase } from "./supabaseClient";

/** 📥 Listar usuarios de administración */
export async function fetchAdminUsuarios() {
  try {
    const { data, error } = await supabase
      .from("administracion_usuarios")
      .select("id, usuario, email, cif, rol, habilitado, created_at, descuento")
      .order("created_at", { ascending: false });

    return { data: data || [], error };
  } catch (e) {
    console.error("💥 [fetchAdminUsuarios] exception:", e);
    return { data: [], error: e };
  }
}

/** 🟢 Habilitar usuario (admin + operativa) */
export async function habilitarUsuarioDb(u) {
  try {
    const now = new Date().toISOString();

    const { error: upErr } = await supabase
      .from("administracion_usuarios")
      .update({ habilitado: true })
      .eq("id", u.id);
    if (upErr) throw upErr;

    const { error: insErr } = await supabase
      .from("usuarios")
      .upsert(
        [
          {
            id: u.id,
            usuario: u.usuario,
            email: u.email,
            cif: u.cif,
            habilitado: true,
            rol: u.rol || "usuario",
            created_at: now,
            updated_at: now,
          },
        ],
        { onConflict: "id" }
      );
    if (insErr) throw insErr;

    return { error: null };
  } catch (e) {
    console.error("💥 [habilitarUsuarioDb] exception:", e);
    return { error: e };
  }
}

/** 🔴 Deshabilitar usuario (admin + operativa) */
export async function deshabilitarUsuarioDb(u) {
  try {
    const { error: upErr } = await supabase
      .from("administracion_usuarios")
      .update({ habilitado: false })
      .eq("id", u.id);
    if (upErr) throw upErr;

    const { error: delErr } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", u.id);
    if (delErr) throw delErr;

    return { error: null };
  } catch (e) {
    console.error("💥 [deshabilitarUsuarioDb] exception:", e);
    return { error: e };
  }
}

/** 🔁 Cambiar rol */
export async function cambiarRolDb(u, nuevoRol) {
  try {
    const role = nuevoRol === "admin" ? "admin" : "usuario";

    const { error: upAdminErr } = await supabase
      .from("administracion_usuarios")
      .update({ rol: role })
      .eq("id", u.id);
    if (upAdminErr) throw upAdminErr;

    if (u.habilitado) {
      const { error: upUserErr } = await supabase
        .from("usuarios")
        .update({ rol: role })
        .eq("id", u.id);
      if (upUserErr) throw upUserErr;
    }

    return { error: null };
  } catch (e) {
    console.error("💥 [cambiarRolDb] exception:", e);
    return { error: e };
  }
}

/** 💸 Cambiar descuento */
export async function cambiarDescuentoDb(id, descuentoNum) {
  try {
    const { error } = await supabase
      .from("administracion_usuarios")
      .update({ descuento: Number(descuentoNum.toFixed(2)) })
      .eq("id", id);

    return { error };
  } catch (e) {
    console.error("💥 [cambiarDescuentoDb] exception:", e);
    return { error: e };
  }
}
