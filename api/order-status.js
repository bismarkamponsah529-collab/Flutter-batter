// Public endpoint — customers use this to check their order status.
// Only returns non-sensitive fields (no address/phone) since anyone with the order ID can query it.

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ status: false, message: "Order id required" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ status: false, message: "Server is missing Supabase configuration" });
  }

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=id,items,total,status,created_at`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await r.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ status: false, message: "Order not found" });
    }

    return res.status(200).json({ status: true, order: data[0] });
  } catch (err) {
    console.error("order-status error:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}
