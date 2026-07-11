// Vercel serverless function.
// Runs on the server only — this is where your Paystack SECRET key belongs.
// Set it in Vercel: Project → Settings → Environment Variables → PAYSTACK_SECRET_KEY
// Never put the secret key in index.html or any file the browser downloads.

export default async function handler(req, res) {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ status: false, message: "Missing reference" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ status: false, message: "Server is missing PAYSTACK_SECRET_KEY" });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const data = await paystackRes.json();

    if (data.status && data.data && data.data.status === "success") {
      return res.status(200).json({
        status: true,
        reference: data.data.reference,
        amount: data.data.amount,       // in pesewas (GHS subunit)
        currency: data.data.currency,
        paidAt: data.data.paid_at
      });
    }

    return res.status(200).json({
      status: false,
      message: (data.data && data.data.gateway_response) || data.message || "Payment not successful"
    });
  } catch (err) {
    return res.status(502).json({ status: false, message: "Could not reach Paystack" });
  }
}
