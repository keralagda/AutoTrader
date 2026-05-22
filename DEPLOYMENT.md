# Auto Trade - Vercel Deployment Guide

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Neon PostgreSQL Database](https://neon.tech) (already configured)
- [cron-job.org Account](https://cron-job.org) (for automated profit distribution)
- GitHub repository: https://github.com/keralagda/AutoTrader

---

## Quick Deploy (One-Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/keralagda/AutoTrader&env=DATABASE_URL,CRON_SECRET,NEXT_PUBLIC_APP_URL,CRONJOB_API_KEY)

---

## Step-by-Step Deployment

### 1. Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select `keralagda/AutoTrader` from your GitHub
4. Click **Import**

### 2. Configure Environment Variables

In the Vercel project settings, add these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string (pooled) | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | ✅ |
| `CRON_SECRET` | Any random string (e.g., `autotrade-cron-2026`) | ✅ |
| `CRONJOB_API_KEY` | Your cron-job.org API key | ✅ |

**Your current DATABASE_URL:**
```
postgresql://neondb_owner:npg_CbEKj0m5QXiL@ep-lucky-star-ao63t239-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Deploy

Click **"Deploy"** — Vercel will:
1. Install dependencies (`npm install`)
2. Generate Prisma client (`prisma generate`)
3. Build the Next.js app (`next build`)
4. Deploy to edge network

### 4. Run Database Migration

After first deployment, run the migration:

```bash
# Option A: Using Vercel CLI
npx vercel env pull .env.local
npx prisma migrate deploy

# Option B: Using Prisma directly with your DATABASE_URL
DATABASE_URL="your-connection-string" npx prisma migrate deploy
```

### 5. Seed the Database

Visit your deployed app and it will auto-seed on first load, OR:

```bash
curl -X POST https://your-project.vercel.app/api/seed
```

This creates:
- Admin user (admin@autotrade.com / admin123)
- 7 investment plans
- 6 payment gateways
- 14 challenges, 15 badges
- Default settings

### 6. Configure Cron Job (Profit Distribution)

**Option A: Vercel Cron (included in vercel.json)**

The `vercel.json` already includes a cron configuration that runs every hour:
```json
{
  "crons": [{
    "path": "/api/cron/distribute-profits",
    "schedule": "0 * * * *"
  }]
}
```
> Note: Vercel Cron is available on Pro plan. On Hobby plan, use cron-job.org.

**Option B: cron-job.org (Free)**

1. Go to [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL**: `https://your-project.vercel.app/api/cron/distribute-profits`
   - **Schedule**: Every hour (or your preference)
   - **Method**: POST
   - **Headers**: Add `x-cron-secret: autotrade-cron-2026` (your CRON_SECRET value)
3. Or use the Admin Panel → Auto Profits (Cron) tab to create jobs via API

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (27 models)
│   └── migrations/            # SQL migrations
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── src/
│   ├── app/
│   │   ├── api/               # 85+ API routes
│   │   ├── layout.tsx         # Root layout with PWA
│   │   └── page.tsx           # Main SPA entry
│   ├── components/
│   │   ├── admin/             # Admin dashboard (23 tabs)
│   │   ├── dashboard/         # User dashboard (13 tabs)
│   │   └── landing/           # Landing page sections
│   └── lib/
│       ├── db.ts              # Prisma client
│       ├── store.ts           # Zustand state
│       ├── i18n.ts            # Multi-language
│       └── types.ts           # TypeScript types
├── vercel.json                # Vercel configuration
├── next.config.ts             # Next.js config
└── package.json
```

---

## Environment Variables Reference

### Required for Deployment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon pooled URL) |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL |
| `CRON_SECRET` | Secret for authenticating cron job requests |
| `CRONJOB_API_KEY` | cron-job.org API key for managing external crons |

### Optional (Payment Gateways)

| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay API key for UPI payments |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |

---

## Post-Deployment Checklist

- [ ] Verify app loads at your Vercel URL
- [ ] Login as admin (admin@autotrade.com / admin123)
- [ ] Change admin password immediately
- [ ] Update `NEXT_PUBLIC_APP_URL` to your actual domain
- [ ] Configure payment gateways in Admin → Payment Gateways
- [ ] Set up cron job for profit distribution
- [ ] Configure withdrawal limits in Admin → Withdrawal Limits
- [ ] Update legal documents in Admin → Settings or via footer
- [ ] Set up custom domain in Vercel (optional)
- [ ] Enable 2FA on admin account

---

## Custom Domain Setup

1. Go to Vercel Project → Settings → Domains
2. Add your domain (e.g., `autotrade.app`)
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` env var to your custom domain
5. Redeploy

---

## Troubleshooting

### Build Fails with Prisma Error
```bash
# Ensure prisma generate runs before build
# This is handled by postinstall script and vercel.json buildCommand
```

### Database Connection Issues
- Ensure `DATABASE_URL` uses the **pooled** connection string (with `-pooler` in hostname)
- Add `?sslmode=require` to the connection string
- Check Neon dashboard for connection limits

### Cron Job Not Running
- Verify `CRON_SECRET` matches in both .env and cron-job.org headers
- Check cron-job.org execution history for HTTP errors
- Test manually: `curl -X POST -H "x-cron-secret: your-secret" https://your-app.vercel.app/api/cron/distribute-profits`

### Function Timeout
- Vercel Hobby plan: 10s max execution
- Vercel Pro plan: 60s max execution
- For large profit distributions, consider Pro plan or batch processing

---

## Updating the App

```bash
# Make changes locally
git add -A
git commit -m "your changes"
git push origin main
# Vercel auto-deploys on push to main
```

### Database Schema Changes
```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Deploy migration to production
npx prisma migrate deploy
```

---

## Security Notes

- Change default admin password after first login
- Use strong `CRON_SECRET` value in production
- Never commit `.env` file (it's in .gitignore)
- Enable 2FA for all admin accounts
- Review KYC submissions regularly
- Monitor withdrawal requests daily
