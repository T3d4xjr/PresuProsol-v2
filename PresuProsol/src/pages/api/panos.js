// src/pages/api/panos.js
import { supabase } from "../../lib/supabaseClient";

// 📦 Catálogo panos: modelos, acabados, accesorios
export async function fetchCatalogoPanos() {
  console.log("📦 [API PANOS] Cargando catálogo…");

  // MODELOS
  let modelos = [];
  const { data: m, error: mErr } = await supabase
    .from("panos_modelos")
    .select("id,tipo,nombre,activo")
    .eq("activo", true)
    .order("tipo")
    .order("nombre");

  if (mErr) {
    console.error("[API panos_modelos] error:", mErr);
  } else {
    console.log("✅ [API PANOS] modelos cargados:", m?.length || 0);
    modelos = m || [];
  }

  // ACABADOS
  let acabados = [];
  const { data: a, error: aErr } = await supabase
    .from("panos_acabados")
    .select("id,clave,nombre,activo,orden")
    .eq("activo", true)
    .order("orden");

  if (aErr) {
    console.error("[API panos_acabados] error:", aErr);
  } else {
    console.log("✅ [API PANOS] acabados cargados:", a?.length || 0);
    acabados = a || [];
  }

  // ACCESORIOS
  let accesorios = [];
  const { data: acc, error: accErr } = await supabase
    .from("panos_accesorios")
    .select("id,nombre,unidad,pvp,activo")
    .eq("activo", true)
    .order("nombre");

  if (accErr) {
    console.error("[API panos_accesorios] error:", accErr);
  } else {
    console.log("✅ [API PANOS] accesorios cargados:", acc?.length || 0);
    accesorios = acc || [];
  }

  return { modelos, acabados, accesorios };
}

// 💸 Descuento cliente
export async function fetchDescuentoClientePanos(userId) {
  if (!userId) return 0;

  try {
    console.log("[API panos descuento] buscando para auth_user_id:", userId);

    const { data, error, status } = await supabase
      .from("administracion_usuarios")
      .select("id, auth_user_id, descuento, descuento_cliente")
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    console.log("[API panos descuento] status:", status, "data:", data);

    if (error) {
      console.warn("[API panos descuento] error:", error);
      return 0;
    }

    const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
    console.log("[API panos descuento] aplicado =", pct, "%");
    return Number.isFinite(pct) ? pct : 0;
  } catch (e) {
    console.error("[API panos descuento] exception:", e);
    return 0;
  }
}

// 🧾 Insertar presupuesto panos
export async function insertarPresupuestoPanos(payload) {
  const { data, error, status } = await supabase
    .from("presupuestos")
    .insert([payload])
    .select("id")
    .maybeSingle();

  console.log("[API insertar presupuesto panos] status:", status, "data:", data);

  if (error) {
    console.error("[API insertar presupuesto panos] error:", error);
  }

  return { data, error, status };
}
