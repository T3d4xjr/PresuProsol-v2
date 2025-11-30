// src/lib/pricing.js
import { supabase } from "./supabaseClient";

/**
 * Obtiene el precio base de mosquitera para una medida EXACTA (alto_mm x ancho_mm)
 * @returns {number|null} precio o null si no hay tarifa
 */
export async function getMosqBasePrice(alto_mm, ancho_mm) {
  const { data, error } = await supabase
    .from('mosq_medidas')
    .select('precio')
    .eq('alto_mm', alto_mm)
    .eq('ancho_mm', ancho_mm)
    .maybeSingle();

  if (error) {
    console.error('[getMosqBasePrice] error', error);
    return null;
  }
  return data?.precio ?? null;
}

/**
 * Cálculo de incremento por color: por perímetro (ml) * incremento_eur_ml
 * Si quieres por m2, cambia la fórmula.
 */
export function calcColorIncrement(alto_mm, ancho_mm, incremento_eur_ml = 0) {
  const perimetro_ml = (2 * (alto_mm + ancho_mm)) / 1000;
  return +(perimetro_ml * (incremento_eur_ml || 0)).toFixed(2);
}

/**
 * Suma de accesorios seleccionados
 * selectedAccs = [{ id, nombre, unidades, precio_unit }]
 */
export function calcAccesoriosTotal(selectedAccs = []) {
  const total = selectedAccs.reduce((acc, it) => acc + (it.precio_unit * (it.unidades || 0)), 0);
  return +total.toFixed(2);
}

/**
 * Aplica descuento (%) sobre subtotal
 */
export function applyDiscount(subtotal, descuentoPct = 0) {
  const total = subtotal * (1 - (descuentoPct || 0) / 100);
  return +total.toFixed(2);
}
