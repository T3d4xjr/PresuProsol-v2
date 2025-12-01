// src/pages/api/puertasSeccionales.js
import { supabase } from "../../lib/supabaseClient";

// 📦 Cargar catálogo (medidas, colores, accesorios)
export async function fetchCatalogoPuertasSeccionales() {
  console.log("🔄 [API] Cargando catálogo puertas seccionales…");

  // MEDIDAS
  let medidas = [];
  const { data: m, error: mErr } = await supabase
    .from("puertas_medidas")
    .select("*");

  if (mErr) {
    console.error("[API puertas_medidas] error:", mErr);
  } else {
    const sorted = (m || []).sort((a, b) => {
      if (a.ancho_mm !== b.ancho_mm) return a.ancho_mm - b.ancho_mm;
      return a.alto_mm - b.alto_mm;
    });
    medidas = sorted;
  }

  // COLORES
  let colores = [];
  const { data: c, error: cErr } = await supabase
    .from("puertas_colores")
    .select("*");

  if (cErr) {
    console.error("[API puertas_colores] error:", cErr);
  } else {
    colores = (c || []).filter((x) => x.activo === true);
  }

  // ACCESORIOS
  let accesorios = [];
  const { data: acc, error: accErr } = await supabase
    .from("puertas_accesorios")
    .select("*");

  if (accErr) {
    console.error("[API puertas_accesorios] error:", accErr);
  } else {
    accesorios = (acc || []).filter((x) => x.activo === true);
  }

  return { medidas, colores, accesorios };
}

// 💸 Descuento cliente para puertas (administracion_usuarios)
export async function fetchDescuentoClientePuertas(userId) {
  if (!userId) return 0;

  try {
    const { data, error } = await supabase
      .from("administracion_usuarios")
      .select("id, auth_user_id, descuento, descuento_cliente")
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error("[API puertas descuento] error:", error);
      }
      return 0;
    }

    const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
    return Number.isFinite(pct) ? pct : 0;
  } catch (e) {
    console.error("[API puertas descuento] exception:", e);
    return 0;
  }
}

// 💰 Precio base + incremento color
export async function fetchPrecioPuertaSeccional({
  ancho_mm,
  alto_mm,
  colorId,
}) {
  if (!ancho_mm || !alto_mm || !colorId) {
    return { precio: null, incrementoColor: 0 };
  }

  try {
    const { data, error } = await supabase
      .from("puertas_precios")
      .select(
        `
        *,
        color:puertas_colores(*)
      `
      )
      .eq("ancho_mm", ancho_mm)
      .eq("alto_mm", alto_mm)
      .eq("color_id", colorId)
      .maybeSingle();

    if (error || !data) {
      console.warn("[API precio puertas] no encontrado:", error);
      return { precio: null, incrementoColor: 0 };
    }

    const precio = Number(data.precio || 0);

    let incrementoColor = 0;
    if (data.color?.incremento_eur_m2) {
      const area = (ancho_mm * alto_mm) / 1_000_000; // m²
      incrementoColor = area * Number(data.color.incremento_eur_m2);
      incrementoColor = +incrementoColor.toFixed(2);
    }

    return { precio, incrementoColor };
  } catch (e) {
    console.error("[API precio puertas] exception:", e);
    return { precio: null, incrementoColor: 0 };
  }
}

// 🧾 Insertar presupuesto de puerta seccional
export async function insertarPresupuestoPuertaSeccional(payload) {
  const { error } = await supabase.from("presupuestos").insert([payload]);

  if (error) {
    console.error("[API insertar presupuesto puerta]", error);
    throw error;
  }

  return true;
}
