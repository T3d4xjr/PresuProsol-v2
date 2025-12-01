// src/pages/api/compactos-api.js
import { supabase } from "../../lib/supabaseClient";

/** ================================
 * 📦 Cargar catálogo compactos
 * ================================ */
export async function fetchCompactosCatalog() {
  try {
    const { data: modelos, error: mErr } = await supabase
      .from("compactos_modelos")
      .select("*")
      .eq("activo", true)
      .order("nombre");

    const { data: acabados, error: aErr } = await supabase
      .from("compactos_acabados")
      .select("*")
      .eq("activo", true)
      .order("orden");

    const { data: accesorios, error: accErr } = await supabase
      .from("compactos_accesorios")
      .select("*")
      .eq("activo", true)
      .order("nombre");

    const error = mErr || aErr || accErr || null;

    return {
      modelos: modelos || [],
      acabados: acabados || [],
      accesorios: accesorios || [],
      error,
    };
  } catch (e) {
    console.error("💥 [fetchCompactosCatalog] exception:", e);
    return {
      modelos: [],
      acabados: [],
      accesorios: [],
      error: e,
    };
  }
}

/** ================================
 * 🎟️ Descuento cliente
 * ================================ */
export async function fetchCompactosDescuento(userId) {
  try {
    const { data, error, status } = await supabase
      .from("administracion_usuarios")
      .select("id, auth_user_id, descuento, descuento_cliente")
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    console.log("[compactos descuento] status:", status, "data:", data, "error:", error);

    if (error || !data) {
      return { descuento: 0, error: error || null };
    }

    const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
    return {
      descuento: Number.isFinite(pct) ? pct : 0,
      error: null,
    };
  } catch (e) {
    console.error("💥 [fetchCompactosDescuento] exception:", e);
    return { descuento: 0, error: e };
  }
}

/** ================================
 * 💰 Precio guía €/ml
 * ================================ */
export async function fetchPrecioGuiaMl(modeloId, acabadoId) {
  try {
    const { data, error } = await supabase
      .from("compactos_guias_precios")
      .select("precio_ml")
      .eq("modelo_id", modeloId)
      .eq("acabado_id", acabadoId)
      .maybeSingle();

    if (error || !data) {
      console.warn("[fetchPrecioGuiaMl] sin precio para:", { modeloId, acabadoId, error });
      return { precioMl: null, error: error || null };
    }

    return {
      precioMl: Number(data.precio_ml || 0),
      error: null,
    };
  } catch (e) {
    console.error("💥 [fetchPrecioGuiaMl] exception:", e);
    return { precioMl: null, error: e };
  }
}

/** ================================
 * 💾 Insertar presupuesto compacto
 * ================================ */
export async function insertarPresupuestoCompacto(payload) {
  try {
    const { data, error, status } = await supabase
      .from("presupuestos")
      .insert([payload])
      .select("id")
      .maybeSingle();

    console.log("[insertarPresupuestoCompacto] status:", status, "data:", data, "error:", error);
    return { data, error, status };
  } catch (e) {
    console.error("💥 [insertarPresupuestoCompacto] exception:", e);
    return { data: null, error: e, status: 500 };
  }
}
