export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { to, from, subject, text } = req.body;

  console.log("📧 [API] Recibiendo solicitud de email:", { to, from, subject });

  try {
    // Verificar variables de entorno
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("❌ Variables de entorno no configuradas");
      return res.status(500).json({ error: "Configuración de email no disponible" });
    }

    const nodemailer = require("nodemailer");

    // Configurar transporter de Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    console.log("📤 [API] Enviando email...");

    // Enviar email
    const info = await transporter.sendMail({
      from: `PresuProsol <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      replyTo: from,
    });

    console.log("✅ [API] Email enviado:", info.messageId);

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("❌ [API] Error enviando email:", error);
    return res.status(500).json({ 
      error: "Error al enviar el email",
      details: error.message 
    });
  }
}