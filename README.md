# Aisle

Retail operations for a store network. Next.js, Supabase Auth, and Postgres. Each company is its own organization: stores, catalog, stock, purchasing, and orders stay inside that company.

One catalog. Stock by store. Purchase orders, goods receipts, and orders from the shop floor, the web shop, and a marketplace. Demand for the next buy comes from the last 28 days of sales. Stock changes only inside Postgres functions.

## Setup

Supabase runs on this machine through Docker. The images stay on disk, so a new app does not need a cloud project.

1. Start Docker Desktop.
2. From this folder:

```
supabase start
npm install
npm run dev
```

`supabase start` applies the migrations. `.env.local` already points at the local API. Email confirmation is off.

3. Create an account and name the company. Add stores, or choose **Load Harbor & Rye** for a grocery sample.

Studio is at http://127.0.0.1:54323. Stop this stack with `supabase stop`.

### Another app

```
supabase init
supabase start
```

Copy `API_URL` and `ANON_KEY` from `supabase status` into that app’s `.env.local`. Two apps cannot use the default ports at the same time. Stop this stack first, or change `project_id` and the ports in the other app’s `supabase/config.toml`.

Harbor & Rye is a sample grocer: four stores in Portland and Seattle, a grocery catalog, suppliers, open purchase orders, and about a month of sales.

## What posts stock

| Action | Function |
| --- | --- |
| Fulfill an order | `create_sale` |
| Void an order | `void_sale` |
| Receive a purchase order | `receive_purchase_order` |
| Move units between stores | `transfer_stock` |

The signed-in user can read stock and sales. They cannot edit on-hand quantities from the API. Row level security limits every table to the user’s organization.

## Give it to a retailer

Create a Supabase project for that company (or one project, and each retailer signs up as their own organization). In the SQL editor, run the files in `supabase/migrations` in order. In Authentication, turn off email confirmation for a private rollout, or set the site URL to the deployed app.

Set these on the host before the app is built. `NEXT_PUBLIC_` values are baked in at build time.

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Do not put the service role key in the app.

Vercel: import this folder, add the two variables, deploy.

Docker, from this folder:

```
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
  -t aisle .
docker run --rm -p 3000:3000 aisle
```

Harbor & Rye stays optional sample data. A retailer can ignore it and enter their own stores, products, suppliers, and orders. Prices use the currency saved on Company.
