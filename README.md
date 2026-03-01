# Danskys Pesach Lettuce

Pre-order website for kosher Pesach lettuce. Next.js 16, Tailwind 4, Supabase, Blink Payment, Resend.

---

## Setup

### 1. Fill in environment variables

Edit `.env.local` and add your real API keys:

```env
# Supabase — https://app.supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Blink Payment — https://dashboard.blinkpayment.co.uk
BLINK_API_KEY=
BLINK_SECRET_KEY=
BLINK_API_URL=https://api.blinkpayment.co.uk

# Resend — https://resend.com
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@yourdomain.com

# Admin — email address of the admin Supabase account
ADMIN_EMAIL=admin@yourdomain.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com

# Site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 2. Set up the database

1. Go to your Supabase project → SQL Editor
2. Run the full contents of `supabase/schema.sql`
3. This creates: `products`, `orders`, `order_items` tables + RLS policies + seed data

### 3. Run in development

```bash
npm run dev    # starts on http://localhost:3003
```

### 4. Build for production

```bash
npm run build
npm run start  # starts on port 3003
```

### 5. Run with PM2

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### 6. Nginx

```bash
# Edit /etc/nginx/sites-available/danskys — replace YOUR_DOMAIN_HERE with real domain
# Then enable the site:
ln -s /etc/nginx/sites-available/danskys /etc/nginx/sites-enabled/danskys
nginx -t && systemctl reload nginx

# SSL (after DNS is pointed)
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, bento grid, featured products |
| `/order` | Products + cart + checkout form |
| `/faq` | 8 FAQ cards |
| `/terms` | Full T&C |
| `/my-account` | Supabase Auth login + order history |
| `/admin` | Admin panel — requires `ADMIN_EMAIL` account |

## API Routes

| Route | Description |
|-------|-------------|
| `POST /api/orders` | Create order + Blink preauth + confirmation email |
| `POST /api/admin/capture` | Capture Blink payment + ready email |
| `POST /api/admin/cancel` | Void preauth + cancel order |
| `GET /api/admin/export?type=delivery\|pickup` | Download CSV |

---

## Architecture Notes

- **Payment flow**: Card pre-authorised on order → captured by admin when ready — customer never charged until order is prepared
- **Delivery**: NE postcodes only — validated server-side
- **Admin access**: Supabase Auth account whose email matches `ADMIN_EMAIL`
- **No card data stored**: All card processing goes through Blink API server-side
