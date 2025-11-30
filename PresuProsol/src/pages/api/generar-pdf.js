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
    const { presupuestoId } = req.body;

    // Obtener datos del presupuesto
    const { data: presupuesto, error } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", presupuestoId)
      .single();

    if (error || !presupuesto) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    // Generar HTML del presupuesto
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Presupuesto ${presupuestoId}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { 
            color: #ff6600;
            border-bottom: 3px solid #ff6600;
            padding-bottom: 10px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
          }
          th {
            background-color: #f5f5f5;
          }
          .total { 
            font-size: 20px; 
            font-weight: bold; 
            color: #ff6600; 
          }
          .info-box {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <h1>PresuProsol - Presupuesto</h1>
        
        <div class="info-box">
          <p><strong>Cliente:</strong> ${presupuesto.cliente || "N/A"}</p>
          <p><strong>Email:</strong> ${presupuesto.email || "N/A"}</p>
          <p><strong>CIF:</strong> ${presupuesto.cif || "N/A"}</p>
          <p><strong>Fecha:</strong> ${new Date(presupuesto.created_at).toLocaleDateString("es-ES")}</p>
        </div>

        <h2>Detalle del Presupuesto</h2>
        <p><strong>Categoría:</strong> ${presupuesto.tipo || "N/A"}</p>
        ${presupuesto.color ? `<p><strong>Color:</strong> ${presupuesto.color}</p>` : ""}
        
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th style="text-align: right;">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Precio base</td>
              <td style="text-align: right;">${(presupuesto.medida_precio || 0).toFixed(2)} €</td>
            </tr>
            ${presupuesto.color_precio > 0 ? `
            <tr>
              <td>Incremento color</td>
              <td style="text-align: right;">${presupuesto.color_precio.toFixed(2)} €</td>
            </tr>
            ` : ""}
            ${presupuesto.accesorios && presupuesto.accesorios.length > 0 ? 
              presupuesto.accesorios.map(acc => `
              <tr>
                <td>${acc.nombre} (${acc.unidades}x ${acc.precio_unit.toFixed(2)} €)</td>
                <td style="text-align: right;">${(acc.precio_unit * acc.unidades).toFixed(2)} €</td>
              </tr>
              `).join("") : ""}
            <tr>
              <td><strong>Subtotal</strong></td>
              <td style="text-align: right;"><strong>${(presupuesto.subtotal || 0).toFixed(2)} €</strong></td>
            </tr>
            <tr>
              <td>Descuento (${presupuesto.descuento_cliente || 0}%)</td>
              <td style="text-align: right;">-${(((presupuesto.subtotal || 0) * (presupuesto.descuento_cliente || 0)) / 100).toFixed(2)} €</td>
            </tr>
            <tr style="background-color: #fff3e0;">
              <td class="total">TOTAL</td>
              <td class="total" style="text-align: right;">${(presupuesto.total || 0).toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          <p>PresuProsol - Todos los derechos reservados</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=presupuesto-${presupuestoId.substring(0, 8)}.html`
    );
    res.status(200).send(html);

  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ error: "Error generando PDF" });
  }
}