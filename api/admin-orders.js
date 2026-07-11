// Admin-only endpoint — returns every order. Protected by a shared password
// sent in the x-admin-password header, checked against ADMIN_PASSWORD env var.

export default async function handler(req, res) {
  const suppliedPassword = req.headers["x-admin-password"];
  if (!process.env.ADMIN_PASSWORD || suppliedPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ status: false, message: "Unauthorized" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ status: false, message: "Server is missing Supabase configuration" });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("Supabase fetch failed:", errText);
      return res.status(500).json({ status: false, message: "Could not load orders" });
    }

    const data = await r.json();
    return res.status(200).json({ status: true, orders: data });
  } catch (err) {
    console.error("admin-orders error:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}
