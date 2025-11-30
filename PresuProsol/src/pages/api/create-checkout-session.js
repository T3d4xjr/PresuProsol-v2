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
    const { presupuestoId, amount, userId } = req.body;

    console.log("📝 Procesando pago:", { presupuestoId, amount, userId });

    // 1. Verificar que el presupuesto existe
    const { data: presupuesto, error: presupuestoError } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", presupuestoId)
      .single();

    if (presupuestoError || !presupuesto) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    // 2. Marcar presupuesto como pagado
    const { error: updateError } = await supabase
      .from("presupuestos")
      .update({ pagado: true })
      .eq("id", presupuestoId);

    if (updateError) {
      console.error("Error actualizando presupuesto:", updateError);
      return res.status(500).json({ error: "Error actualizando presupuesto" });
    }

    // 3. Crear pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        user_id: userId,
        presupuesto_id: presupuestoId,
        estado: "En proceso",
        total: amount,
      })
      .select()
      .single();

    if (pedidoError) {
      console.error("Error creando pedido:", pedidoError);
      return res.status(500).json({ error: "Error creando pedido" });
    }

    console.log("✅ Pedido creado:", pedido);

    // 4. Retornar URL de éxito
    const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/pago-exitoso?presupuesto_id=${presupuestoId}`;

    return res.status(200).json({ url: successUrl });

  } catch (error) {
    console.error("❌ Error en create-checkout-session:", error);
    return res.status(500).json({ error: error.message });
  }
}