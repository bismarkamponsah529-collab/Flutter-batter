// Vercel serverless function.
// Saves the order to Supabase, then sends a WhatsApp alert to the admin's
// phone automatically via Twilio — the customer never sees or triggers this.
//
// Required environment variables (set in Vercel → Settings → Environment Variables):
//   SUPABASE_URL              e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY       the "service_role" key from Supabase (NOT the anon key)
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM        e.g. whatsapp:+14155238886 (Twilio sandbox) or your approved sender
//   ADMIN_WHATSAPP_NUMBER       e.g. whatsapp:+233599538916

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  const { id, items, total, name, phone, address, note, payment, paystackRef } = req.body || {};

  if (!id || !items || !Array.isArray(items) || !total || !name || !phone || !address) {
    return res.status(400).json({ status: false, message: "Missing required order fields" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ status: false, message: "Server is missing Supabase configuration" });
  }

  // 1. Save the order to the database
  try {
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify([{
        id,
        items,
        total,
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        note: note || "",
        payment_method: payment,
        paystack_ref: paystackRef || null,
        status: "received"
      }])
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error("Supabase insert failed:", errText);
      return res.status(500).json({ status: false, message: "Could not save order" });
    }
  } catch (err) {
    console.error("Supabase insert error:", err);
    return res.status(500).json({ status: false, message: "Database error" });
  }

  // 2. Send WhatsApp alert to the admin automatically (best-effort — order is already saved)
  try {
    await sendAdminWhatsAppAlert({ id, items, total, name, phone, address, note, payment });
  } catch (err) {
    console.error("WhatsApp alert failed:", err);
    // Don't fail the order just because the alert didn't send — it's already saved and
    // visible on the admin dashboard.
  }

  return res.status(200).json({ status: true, id });
}

async function sendAdminWhatsAppAlert(order) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.ADMIN_WHATSAPP_NUMBER;

  if (!sid || !token || !from || !to) {
    throw new Error("Twilio WhatsApp environment variables are not fully set");
  }

  const itemLines = order.items.map(it => `${it.name} x${it.qty}`).join(", ");
  const body =
    `New Flutter-Batter order ${order.id}\n` +
    `${itemLines}\n` +
    `Total: GHS ${order.total}\n` +
    `Customer: ${order.name} (${order.phone})\n` +
    `Address: ${order.address}\n` +
    `Payment: ${order.payment === "paystack" ? "Paid online" : "Pay on delivery"}` +
    (order.note ? `\nNote: ${order.note}` : "");

  const params = new URLSearchParams();
  params.append("From", from);
  params.append("To", to);
  params.append("Body", body);

  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error("Twilio error: " + t);
  }
}
