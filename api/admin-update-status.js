// Admin-only endpoint — updates an order's status. Protected by the same
// shared password as admin-orders.js.

const ALLOWED_STATUSES = ["received", "preparing", "out_for_delivery", "delivered"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  const suppliedPassword = req.headers["x-admin-password"];
  if (!process.env.ADMIN_PASSWORD || suppliedPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ status: false, message: "Unauthorized" });
  }

  const { id, status } = req.body || {};
  if (!id || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ status: false, message: "Invalid id or status" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ status: false, message: "Server is missing Supabase configuration" });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({ status })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("Supabase update failed:", errText);
      return res.status(500).json({ status: false, message: "Update failed" });
    }

    return res.status(200).json({ status: true });
  } catch (err) {
    console.error("admin-update-status error:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}
