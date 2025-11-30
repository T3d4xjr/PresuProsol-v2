import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { presupuestoId, userId } = req.body;

    console.log("✅ Confirmando pago:", { presupuestoId, userId });

    // 1. Marcar presupuesto como pagado
    const { error: updateError } = await supabase
      .from("presupuestos")
      .update({ pagado: true })
      .eq("id", presupuestoId);

    if (updateError) {
      throw updateError;
    }

    // 2. Obtener datos del presupuesto
    const { data: presupuesto, error: fetchError } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", presupuestoId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // 3. Crear pedido
    const { error: pedidoError } = await supabase.from("pedidos").insert({
      user_id: userId,
      presupuesto_id: presupuestoId,
      estado: "En proceso",
      total: presupuesto.total,
    });

    if (pedidoError) {
      throw pedidoError;
    }

    console.log("✅ Pago confirmado y pedido creado");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error confirmando pago:", error);
    res.status(500).json({ error: error.message });
  }
}