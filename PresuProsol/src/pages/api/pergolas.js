// src/pages/api/pergolas.js
import { supabase } from "../../lib/supabaseClient";

// 📦 Cargar catálogo (medidas, colores, accesorios)
export async function fetchCatalogoPergolas() {
  console.log("🔄 [API] Cargando catálogo pérgolas…");

  // MEDIDAS
  let medidas = [];
  const { data: m, error: mErr } = await supabase
    .from("pergolas_medidas")
    .select("*");

  console.log("📏 [API MEDIDAS]", { total: m?.length || 0 });

  if (mErr) {
    console.error("[API pergolas_medidas] error:", mErr);
  } else {
    const activos = (m || []).filter((x) => x.activo === true);
    console.log("✅ [API MEDIDAS] activas:", activos.length);
    medidas = activos.sort((a, b) => {
      if (a.ancho_mm !== b.ancho_mm) return a.ancho_mm - b.ancho_mm;
      return a.fondo_mm - b.fondo_mm;
    });
  }

  // COLORES
  let colores = [];
  const { data: c, error: cErr } = await supabase
    .from("pergolas_colores")
    .select("*");

  console.log("🎨 [API COLORES]", { total: c?.length || 0 });

  if (cErr) {
    console.error("[API pergolas_colores] error:", cErr);
  } else {
    const activos = (c || []).filter((x) => x.activo === true);
    console.log("✅ [API COLORES] activos:", activos.length);
    colores = activos.sort(
      (a, b) => (a.incremento_eur_m2 || 0) - (b.incremento_eur_m2 || 0)
    );
  }

  // ACCESORIOS
  let accesorios = [];
  const { data: acc, error: accErr } = await supabase
    .from("pergolas_accesorios")
    .select("*");

  console.log("🔧 [API ACCESORIOS]", { total: acc?.length || 0 });

  if (accErr) {
    console.error("[API pergolas_accesorios] error:", accErr);
  } else {
    const activos = (acc || []).filter((x) => x.activo === true);
    console.log("✅ [API ACCESORIOS] activos:", activos.length);
    accesorios = activos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return { medidas, colores, accesorios };
}

// 💸 Descuento cliente
export async function fetchDescuentoClientePergolas(userId) {
  if (!userId) return 0;

  try {
    console.log("[API pergolas descuento] buscando para auth_user_id:", userId);

    const { data, error, status } = await supabase
      .from("administracion_usuarios")
      .select("id, auth_user_id, descuento, descuento_cliente")
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    console.log("[API pergolas descuento] status:", status, "data:", data);

    if (error) {
      console.warn("[API pergolas descuento] error:", error);
      return 0;
    }

    if (!data) {
      console.warn("[API pergolas descuento] no se encontró usuario");
      return 0;
    }

    const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
    console.log("[API pergolas descuento] aplicado =", pct, "%");

    return Number.isFinite(pct) ? pct : 0;
  } catch (e) {
    console.error("[API pergolas descuento] exception:", e);
    return 0;
  }
}

// 💰 Precio base + incremento color
export async function fetchPrecioPergola({ ancho_mm, fondo_mm, colorId }) {
  if (!ancho_mm || !fondo_mm || !colorId) {
    return { precio: null, incrementoColor: 0 };
  }

  try {
    console.log("💰 [API PRECIO PÉRGOLA] buscando:", {
      ancho_mm,
      fondo_mm,
      colorId,
    });

    const { data, error } = await supabase
      .from("pergolas_precios")
      .select(
        `
        *,
        color:pergolas_colores(*)
      `
      )
      .eq("ancho_mm", ancho_mm)
      .eq("fondo_mm", fondo_mm)
      .eq("color_id", colorId)
      .maybeSingle();

    console.log("🎯 [API PRECIO PÉRGOLA] resultado:", { data, error });

    if (error || !data) {
      console.warn("⚠️ [API PRECIO PÉRGOLA] no encontrado");
      return { precio: null, incrementoColor: 0 };
    }

    const areaM2 = (ancho_mm * fondo_mm) / 1_000_000;
    const precioCalculado = Number(data.precio_m2 || 0) * areaM2;

    let incrementoColor = 0;
    if (data.color?.incremento_eur_m2) {
      incrementoColor =
        Number(data.color.incremento_eur_m2 || 0) * areaM2;
    }

    console.log("✅ [API PRECIO PÉRGOLA] calculado:", {
      areaM2,
      precio_m2: data.precio_m2,
      precioCalculado,
      incrementoColor,
    });

    return {
      precio: +precioCalculado.toFixed(2),
      incrementoColor: +incrementoColor.toFixed(2),
    };
  } catch (e) {
    console.error("💥 [API PRECIO PÉRGOLA] exception:", e);
    return { precio: null, incrementoColor: 0 };
  }
}

// 🧾 Insertar presupuesto
export async function insertarPresupuestoPergola(payload) {
  const { error } = await supabase.from("presupuestos").insert([payload]);

  if (error) {
    console.error("[API insertar presupuesto pérgola]", error);
    throw error;
  }

  return true;
}
