import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req);
  const sig     = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const { type, data } = event;

  if (type === "checkout.session.completed") {
    const session = data.object;
    const userId  = session.metadata?.userId;
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          subscription_status: "plus",
          stripe_customer_id:  session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq("id", userId);
    }
  }

  if (type === "customer.subscription.deleted" || type === "customer.subscription.paused") {
    const subscription = data.object;
    const userId = subscription.metadata?.userId;
    if (userId) {
      await supabase
        .from("profiles")
        .update({ subscription_status: "free" })
        .eq("id", userId);
    }
  }

  if (type === "invoice.payment_failed") {
    const invoice  = data.object;
    const custId   = invoice.customer;
    // Downgrade user on payment failure
    await supabase
      .from("profiles")
      .update({ subscription_status: "free" })
      .eq("stripe_customer_id", custId);
  }

  res.status(200).json({ received: true });
}
