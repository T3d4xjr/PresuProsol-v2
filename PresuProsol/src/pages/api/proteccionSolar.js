// src/pages/api/proteccionSolar.js
import { supabase } from "./supabaseClient";

// 📦 Cargar catálogo (modelos, colores, accesorios)
export async function fetchCatalogoProteccionSolar() {
  console.log("🔄 [API] Cargando catálogo protección solar…");

  // MODELOS
  let modelos = [];
  const { data: m, error: mErr } = await supabase
    .from("proteccionsolar_modelos")
    .select("*");

  console.log("📊 [API MODELOS] Total registros:", m?.length || 0);

  if (mErr) {
    console.error("[API proteccionsolar_modelos] error:", mErr);
  } else {
    const activos = (m || []).filter((x) => x.activo === true);
    console.log("✅ [API MODELOS] activos:", activos.length);
    modelos = activos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  // COLORES / ESTRUCTURA
  let colores = [];
  const { data: c, error: cErr } = await supabase
    .from("proteccionsolar_colores_estructura")
    .select("*");

  if (cErr) {
    console.error("[API proteccionsolar_colores_estructura] error:", cErr);
  } else {
    const activos = (c || []).filter((x) => x.activo === true);
    colores = activos.sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }

  // ACCESORIOS
  let accesorios = [];
  const { data: acc, error: accErr } = await supabase
    .from("proteccionsolar_accesorios")
    .select("*");

  if (accErr) {
    console.error("[API proteccionsolar_accesorios] error:", accErr);
  } else {
    const activos = (acc || []).filter((x) => x.activo === true);
    accesorios = activos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return { modelos, colores, accesorios };
}

// 💸 Descuento cliente
export async function fetchDescuentoClienteProteccionSolar(userId) {
  if (!userId) return 0;

  try {
    console.log(
      "[API proteccion-solar descuento] buscando para auth_user_id:",
      userId
    );

    const { data, error, status } = await supabase
      .from("administracion_usuarios")
      .select("id, auth_user_id, descuento, descuento_cliente")
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    console.log(
      "[API proteccion-solar descuento] status:",
      status,
      "data:",
      data,
      "error:",
      error
    );

    if (error) {
      console.warn("[API proteccion-solar descuento] error:", error);
      return 0;
    }

    if (!data) {
      console.warn("[API proteccion-solar descuento] no se encontró usuario");
      return 0;
    }

    const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
    console.log("[API proteccion-solar descuento] aplicado =", pct, "%", {
      descuento: data?.descuento,
      descuento_cliente: data?.descuento_cliente,
      calculado: pct,
    });

    return Number.isFinite(pct) ? pct : 0;
  } catch (e) {
    console.error("[API proteccion-solar descuento] exception:", e);
    return 0;
  }
}

// 💰 Precio base + incremento color
export async function fetchPrecioProteccionSolar({ modeloId, colorId }) {
  if (!modeloId || !colorId) {
    return { precio: null, incrementoColor: 0 };
  }

  try {
    const { data, error } = await supabase
      .from("proteccionsolar_precios")
      .select("*")
      .eq("modelo_id", modeloId)
      .eq("color_id", colorId)
      .maybeSingle();

    if (error) {
      console.error("❌ [API precio proteccion-solar] error:", error);
      return { precio: null, incrementoColor: 0 };
    }

    if (!data) {
      console.warn(
        "⚠️ [API precio proteccion-solar] NO ENCONTRADO para modelo/color:",
        modeloId,
        colorId
      );
      return { precio: null, incrementoColor: 0 };
    }

    const precioValue = data.precio_m2 ?? data.precio ?? 0;
    console.log("✅ [API precio proteccion-solar] encontrado:", precioValue, "€");

    const precio = Number(precioValue || 0);
    let incrementoColor = 0;

    // El incremento viene del color (€/m2 ya precalculado)
    if (data.incremento_m2 && data.incremento_m2 > 0) {
      incrementoColor = Number(data.incremento_m2);
    }

    return { precio, incrementoColor };
  } catch (e) {
    console.error("💥 [API precio proteccion-solar] exception:", e);
    return { precio: null, incrementoColor: 0 };
  }
}

// 🧾 Insertar presupuesto
export async function insertarPresupuestoProteccionSolar(payload) {
  const { error } = await supabase.from("presupuestos").insert([payload]);

  if (error) {
    console.error("[API insertar presupuesto proteccion-solar]", error);
    throw error;
  }

  return true;
}
