import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, presupuestoId, userId } = req.body;

    console.log("💳 Creando PaymentIntent:", { amount, presupuestoId, userId });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe no está configurado" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: "eur",
      metadata: {
        presupuestoId,
        userId,
      },
    });

    console.log("✅ PaymentIntent creado:", paymentIntent.id);

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Error creando PaymentIntent:", error);
    res.status(500).json({ error: error.message });
  }
}