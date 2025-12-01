// src/pages/api/mosquiteras.js
import { supabase } from "../../lib/supabaseClient";

/* ========= Helpers internos ========= */

function guessHexFromName(nombre = "") {
  const n = (nombre || "").toLowerCase();
  if (/blanco/.test(n)) return "#FFFFFF";
  if (/plata/.test(n) || /anodiz/.test(n)) return "#C0C0C0";
  if (/bronce/.test(n)) return "#8C6239";
  if (/ral\s*est[aá]ndar/.test(n)) return "#4F4F4F";
  if (/ral\s*especial/.test(n)) return "#7C3AED";
  return "#2D2A6E";
}

function normalizeHex(v) {
  if (!v) return null;
  let s = String(v).trim();
  if (!s) return null;
  if (!s.startsWith("#")) s = "#" + s;
  const ok = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
  return ok ? s.toUpperCase() : null;
}

/* ========= Pricing base ========= */

export async function getMosqBasePrice(alto, ancho) {
  console.log("[getMosqBasePrice] buscar precio para:", { alto, ancho });

  const { data, error, status } = await supabase
    .from("mosq_medidas")
    .select("precio")
    .eq("alto_mm", alto)
    .eq("ancho_mm", ancho)
    .maybeSingle();

  console.log("[getMosqBasePrice] status:", status, "data:", data, "error:", error);
  if (error) return null;
  return data?.precio ?? null;
}

/* ========= Catálogo medidas ========= */

export async function fetchMosqMedidas() {
  const { data, error, status } = await supabase
    .from("mosq_medidas")
    .select("alto_mm, ancho_mm");

  console.log("[fetchMosqMedidas] status:", status, "error:", error, "rows:", data?.length);

  if (error || !data) {
    return { altos: [], anchos: [] };
  }

  const uniqueAltos = [...new Set(data.map((d) => d.alto_mm))].sort((a, b) => a - b);
  const uniqueAnchos = [...new Set(data.map((d) => d.ancho_mm))].sort((a, b) => a - b);

  console.log("[fetchMosqMedidas] altos:", uniqueAltos, "anchos:", uniqueAnchos);

  return { altos: uniqueAltos, anchos: uniqueAnchos };
}

/* ========= Colores + accesorios ========= */

export async function fetchMosqOptions() {
  try {
    console.log("📦 [API MOSQ] cargando colores y accesorios…");

    // Colores
    const { data: col, error: colErr, status: colStatus } = await supabase
      .from("mosq_colores")
      .select("id, color, precio, precio_ml, incremento_ml, activo, hex");

    console.log("[API mosq_colores] status:", colStatus, "count:", col?.length, "error:", colErr);

    const colores = (col || [])
      .filter((c) => c.activo === true)
      .map((c) => {
        const hexNorm = normalizeHex(c.hex) || guessHexFromName(c.color);
        return {
          id: String(c.id),
          nombre: c.color,
          incremento_eur_ml: Number(c.precio_ml ?? c.incremento_ml ?? c.precio ?? 0),
          hex: hexNorm,
        };
      });

    console.log("✅ [API MOSQ] colores cargados:", colores.length);
    console.table(colores);

    // Accesorios
    const { data: acc, error: accErr, status: accStatus } = await supabase
      .from("mosq_accesorios")
      .select("*");

    console.log(
      "[API mosq_accesorios] status:",
      accStatus,
      "count:",
      acc?.length,
      "error:",
      accErr
    );

    const accesorios = (acc || [])
      .filter((a) => a.activo === true)
      .map((a) => ({
        id: a.id,
        nombre: a.nombre,
        unidad: a.unidad || "ud",
        perimetral: Boolean(a.perimetral),
        precio_unit: Number(a.precio_unit ?? a.precio ?? a.precio_ud ?? 0),
      }));

    console.log("✅ [API MOSQ] accesorios cargados:", accesorios.length);
    console.table(accesorios);

    return { colores, accesorios };
  } catch (e) {
    console.error("💥 [API MOSQ fetchMosqOptions] exception:", e);
    return { colores: [], accesorios: [] };
  }
}

/* ========= Descuento cliente ========= */

export async function fetchMosqDescuentoCliente(userId) {
  if (!userId) return 0;

  try {
    console.log("[API mosq descuento] buscando para auth_user_id:", userId);

    const { data, error, status } = await supabase
      .from("administracion_usuarios")
      .select("id, auth_user_id, descuento, descuento_cliente")
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    console.log("[API mosq descuento] status:", status, "data:", data, "error:", error);

    if (error || !data) {
      console.warn("[API mosq descuento] error o sin usuario:", error);
      return 0;
    }

    const pct = Number(data?.descuento ?? data?.descuento_cliente ?? 0);
    console.log("[API mosq descuento] aplicado =", pct, "%");
    return Number.isFinite(pct) ? pct : 0;
  } catch (e) {
    console.error("[API mosq descuento] exception:", e);
    return 0;
  }
}

/* ========= Insert presupuesto ========= */

export async function insertarPresupuestoMosq(payload) {
  const { data, error, status } = await supabase
    .from("presupuestos")
    .insert([payload])
    .select("id")
    .maybeSingle();

  console.log("[API insertar presupuesto MOSQ] status:", status, "data:", data);

  if (error) {
    console.error("[API insertar presupuesto MOSQ] error:", error);
  }

  return { data, error, status };
}
