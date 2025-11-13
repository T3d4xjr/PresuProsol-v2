// src/lib/pricingPanos.js
import { supabase } from "../lib/supabaseClient";

// precio base €/m² del modelo+acabado
export async function getPanoPricePerM2(modeloId, acabadoId) {
  const { data, error } = await supabase
    .from("panos_precios")
    .select("precio_m2")
    .eq("modelo_id", modeloId)
    .eq("acabado_id", acabadoId)
    .maybeSingle();
  if (error) throw error;
  return data?.precio_m2 ?? null; // null => “Consultar”
}

// superficie en m²
export const calcAreaM2 = (alto_mm, ancho_mm) =>
  Math.max(0, (Number(alto_mm) || 0) * (Number(ancho_mm) || 0) / 1_000_000);

// accesorios total
export const calcAccesoriosTotal = (arr = []) =>
  arr.reduce((s, a) => s + (Number(a.pvp) || 0) * (Number(a.unidades) || 0), 0);

// aplica descuento (%) a un subtotal
export const applyDiscount = (subtotal, descuentoPct) =>
  +(subtotal * (1 - (Number(descuentoPct) || 0) / 100)).toFixed(2);
