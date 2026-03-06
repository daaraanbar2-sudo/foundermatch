import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { priceId, userId, email } = req.body;

  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://foundermatch-xn17.vercel.app?checkout=success`,
      cancel_url:  `${process.env.VITE_APP_URL || "https://foundermatch-xn17.vercel.app"}?checkout=cancelled`,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
}
