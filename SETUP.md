# Flutter-Batter — Setup Guide

## 1. Create the Supabase project
1. Go to supabase.com → sign up → **New project**
2. Once it's created, go to **SQL Editor** → **New query** → paste this and run it:

```sql
create table orders (
  id text primary key,
  items jsonb not null,
  total numeric not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  note text,
  payment_method text,
  paystack_ref text,
  status text not null default 'received',
  created_at timestamptz not null default now()
);
```

3. Go to **Project Settings → API**. You'll need two values:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role key** (NOT the "anon" key) → this is `SUPABASE_SERVICE_KEY`
   - Keep the service_role key secret — it has full access to your database and must only live in Vercel's environment variables, never in the site's HTML/JS.

## 2. Set up Twilio for WhatsApp alerts
1. Go to twilio.com → sign up (free trial available)
2. In the Console, find **Messaging → Try it out → Send a WhatsApp message** — this gives you the Twilio Sandbox
3. Note your **Account SID** and **Auth Token** from the Console dashboard
4. The sandbox gives you a WhatsApp-enabled number like `whatsapp:+14155238886` — this is `TWILIO_WHATSAPP_FROM`
5. To receive alerts, send the join code shown on that page (e.g. "join happy-tiger") from **your own WhatsApp** (+233599538916) to that Twilio sandbox number, once. After that, Twilio can message your number.
6. Set `ADMIN_WHATSAPP_NUMBER` to `whatsapp:+233599538916`

**Note on sandbox vs production:** the sandbox is free and works immediately, but Twilio's terms intend it for testing. For a permanent, fully production WhatsApp sender, you'd apply through Twilio for an approved WhatsApp Business sender number (Twilio guides you through this; it usually takes a few business days for Meta's approval). The sandbox will keep working for you day-to-day in the meantime since you're the only recipient — if it ever stops, that's the signal to complete the approved-sender application.

## 3. Set the admin dashboard password
Pick any password only you know — this is `ADMIN_PASSWORD`. It protects `/admin.html`.

## 4. Add all environment variables in Vercel
Go to your Vercel project → **Settings → Environment Variables** and add:

| Key | Value |
|---|---|
| `PAYSTACK_SECRET_KEY` | your Paystack secret key |
| `SUPABASE_URL` | from Supabase project settings |
| `SUPABASE_SERVICE_KEY` | the service_role key from Supabase |
| `TWILIO_ACCOUNT_SID` | from Twilio console |
| `TWILIO_AUTH_TOKEN` | from Twilio console |
| `TWILIO_WHATSAPP_FROM` | e.g. `whatsapp:+14155238886` |
| `ADMIN_WHATSAPP_NUMBER` | `whatsapp:+233599538916` |
| `ADMIN_PASSWORD` | a password you choose |

After adding these, redeploy the project (Vercel → Deployments → Redeploy) so the functions pick them up.

## 5. Using the site
- **Customers:** order at `yoursite.vercel.app` — no WhatsApp app ever opens on their side. You get notified automatically.
- **You:** open `yoursite.vercel.app/admin.html`, log in with your `ADMIN_PASSWORD`, see every order, and update its status as it moves through Received → Preparing → Out for delivery → Delivered.
- **Customers tracking:** they enter their order number (e.g. `FB-20260711-4821`) at the "Track order" section on the main site to see live status.

## 6. Test it end to end
1. Place a test order on your live site (use a Paystack test card, or choose "Pay on delivery")
2. Check your WhatsApp — you should get the alert within a few seconds
3. Open `/admin.html`, confirm the order appears
4. Change its status, then check the tracking section on the main site with that order ID
