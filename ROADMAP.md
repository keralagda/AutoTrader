# BNFX Platform — Feature Roadmap & Implementation Plan

## Current Status
- **Live URL:** https://bnfx.eu.cc
- **Repo:** https://github.com/keralagda/AutoTrader
- **Stack:** Next.js 16, React 19, Prisma, PostgreSQL (Neon), Vercel
- **AI:** Groq (Llama 3.3 70B), NVIDIA (Nemotron 70B)
- **Payments:** MetaMask, CoinPayments, NOWPayments, USDT, USDC, BTC

---

## Phase 3: Trust & Conversions (Priority: HIGH)

### 3.1 Withdrawal Proof Feed
- **What:** Public page + landing page ticker showing recent successful withdrawals
- **UI:** Scrolling ticker on landing page: "John D. withdrew $500 • 2 min ago"
- **API:** `/api/withdrawal-proofs` — returns last 20 completed withdrawals (anonymized)
- **Admin:** Toggle to enable/disable, configure how many to show
- **Effort:** 2-3 hours
- **Files:**
  - `src/app/api/withdrawal-proofs/route.ts`
  - `src/components/landing/WithdrawalProofTicker.tsx`
  - Add to `LandingPage.tsx`

### 3.2 Live Earnings Counter
- **What:** Animated counter on user dashboard showing earnings ticking up in real-time
- **UI:** Large animated number that increments every few seconds based on plan rate
- **Logic:** Calculate expected earnings per second from active deposits, animate visually
- **Effort:** 1-2 hours
- **Files:**
  - `src/components/dashboard/LiveEarningsCounter.tsx`
  - Add to `OverviewTab.tsx`

### 3.3 Deposit Success Page
- **What:** Full-screen success page after deposit with confetti, next steps, share button
- **UI:** Confetti animation, "Your deposit is being verified", progress steps, share referral CTA
- **Effort:** 2 hours
- **Files:**
  - `src/components/dashboard/DepositSuccess.tsx`
  - Update `DepositTab.tsx` to show after submission

### 3.4 Referral Earnings Calculator
- **What:** Interactive calculator on landing page: "If you refer X people investing $Y..."
- **UI:** Sliders for number of referrals and average investment, shows projected monthly income
- **Effort:** 2 hours
- **Files:**
  - `src/components/landing/ReferralCalculator.tsx`
  - Add to `LandingPage.tsx` after ReferralSection

### 3.5 Live Chat Widget
- **What:** Integrate Tawk.to or Crisp for human support
- **Implementation:** Add script tag to layout, configure in admin settings
- **Effort:** 30 minutes
- **Files:**
  - Update `src/app/layout.tsx` with chat widget script
  - Add toggle in admin Settings

---

## Phase 4: Retention & Engagement (Priority: HIGH)

### 4.1 Email Drip Sequence
- **What:** Automated email series triggered by user actions
- **Sequences:**
  - Day 0: Welcome email (already done)
  - Day 1: "How to make your first deposit"
  - Day 3: "Your first profit was credited!" (triggered by cron)
  - Day 7: "Upgrade to a higher plan for better returns"
  - Day 14: "Refer a friend and earn 5% commission"
  - Day 30: "You've earned $X this month! Here's your summary"
- **Implementation:** Cron job checks user milestones, sends via Resend
- **Effort:** 4-5 hours
- **Files:**
  - `src/app/api/cron/email-drip/route.ts`
  - `src/lib/email.ts` (add new templates)
  - Add cron job on cron-job.org

### 4.2 Browser Push Notifications
- **What:** Push notifications for profit credits, withdrawal approvals, promotions
- **Implementation:** Use existing service worker, add push subscription API
- **Effort:** 3-4 hours
- **Files:**
  - `src/app/api/push/subscribe/route.ts`
  - `src/app/api/push/send/route.ts`
  - Update `public/sw.js` push handler
  - `src/components/PushNotificationPrompt.tsx`

### 4.3 Telegram Bot
- **What:** Bot that sends balance updates, allows checking earnings, share referral link
- **Commands:** `/balance`, `/earnings`, `/withdraw`, `/referral`, `/support`
- **Implementation:** Telegram Bot API + webhook endpoint
- **Effort:** 6-8 hours
- **Files:**
  - `src/app/api/telegram/webhook/route.ts`
  - `src/lib/telegram.ts`
  - Admin setting for bot token
  - User setting to link Telegram account

### 4.4 Reinvestment Incentive
- **What:** Bonus % when user reinvests earnings instead of withdrawing
- **UI:** "Reinvest and get +2% bonus" button on earnings
- **Logic:** When reinvesting, apply bonus multiplier to the new deposit
- **Effort:** 2 hours
- **Files:**
  - Update `src/app/api/reinvest/route.ts` to add bonus
  - Update `InvestmentTab.tsx` to show reinvest bonus

### 4.5 VIP Tier System
- **What:** Automatic tier based on total deposited amount
- **Tiers:**
  - Bronze: $0-$499 (base rates)
  - Silver: $500-$4,999 (+0.5% daily bonus)
  - Gold: $5,000-$24,999 (+1% daily bonus)
  - Platinum: $25,000+ (+2% daily bonus, priority withdrawals)
- **UI:** Tier badge on profile, tier progress bar, benefits list
- **Effort:** 3-4 hours
- **Files:**
  - `src/app/api/user/tier/route.ts`
  - `src/components/dashboard/TierBadge.tsx`
  - Update cron to apply tier bonuses

---

## Phase 5: Growth & Virality (Priority: MEDIUM)

### 5.1 Referral Contest/Tournament
- **What:** Monthly leaderboard with prizes for top referrers
- **UI:** Dedicated contest page with countdown, prizes, current standings
- **Admin:** Create contests with start/end date, prize pool, rules
- **Effort:** 5-6 hours
- **Files:**
  - `src/app/api/admin/contests/route.ts`
  - `src/components/dashboard/ContestTab.tsx`
  - `src/components/landing/ContestBanner.tsx`

### 5.2 Investment Certificate
- **What:** Downloadable PDF showing plan details, expected returns
- **UI:** "Download Certificate" button on active investments
- **Implementation:** Generate PDF using html-to-canvas or jsPDF
- **Effort:** 3 hours
- **Files:**
  - `src/app/api/certificate/route.ts`
  - `src/components/dashboard/InvestmentCertificate.tsx`

### 5.3 QR Code for Referral
- **What:** Generate QR code containing referral link
- **UI:** QR code display in Team tab, downloadable as image
- **Implementation:** Use `qrcode` package (already installed)
- **Effort:** 1 hour
- **Files:**
  - Update `src/components/dashboard/TeamTab.tsx`
  - Update `src/components/dashboard/ReferralShare.tsx`

### 5.4 Social Proof Counters
- **What:** "X people are viewing this plan" on plan cards
- **UI:** Animated counter with eye icon on each plan
- **Logic:** Random number between 5-50, refreshes every 30s
- **Effort:** 30 minutes
- **Files:**
  - Update `src/components/landing/PlansSection.tsx`

### 5.5 Countdown/Urgency on Plans
- **What:** "Only 12 spots left at this rate" or "Price increases in 2h 34m"
- **UI:** Red countdown badge on plan cards
- **Admin:** Configure per plan in Plan Builder
- **Effort:** 1-2 hours
- **Files:**
  - Update `PlansSection.tsx`
  - Add fields to Plan model

---

## Phase 6: Compliance & Safety (Priority: MEDIUM)

### 6.1 Terms Acceptance on Signup
- **What:** Checkbox "I agree to Terms of Service and Risk Disclosure"
- **UI:** Checkbox in register form, links to legal docs
- **Logic:** Cannot register without checking
- **Effort:** 30 minutes
- **Files:**
  - Update `src/components/auth/AuthModal.tsx`

### 6.2 Cookie Consent Banner
- **What:** GDPR-compliant cookie consent popup
- **UI:** Bottom banner with Accept/Reject, remembers choice
- **Effort:** 1 hour
- **Files:**
  - `src/components/CookieConsent.tsx`
  - Add to `layout.tsx`

### 6.3 IP-based Login Alerts
- **What:** Email alert when login from new IP/location
- **Logic:** Compare current login IP with previous, send email if different
- **Effort:** 2 hours
- **Files:**
  - Update `src/app/api/auth/login/route.ts`
  - Add email template in `src/lib/email.ts`

### 6.4 Withdrawal Address Whitelist
- **What:** Users must add addresses 24h before withdrawing to them
- **UI:** "Manage Addresses" in security tab, 24h cooldown indicator
- **Effort:** 3-4 hours
- **Files:**
  - `src/app/api/withdrawal-addresses/route.ts`
  - `src/components/dashboard/WithdrawalAddresses.tsx`
  - Update withdrawal flow to check whitelist

### 6.5 Session Timeout
- **What:** Auto-logout after configurable inactivity period
- **Logic:** Track last activity, show warning at 25min, logout at 30min
- **Effort:** 2 hours
- **Files:**
  - `src/components/SessionTimeout.tsx`
  - Add to dashboard layout

### 6.6 Anti-Fraud Velocity Checks
- **What:** Flag accounts that deposit and immediately try to withdraw
- **Logic:** Minimum hold period before first withdrawal (configurable)
- **Admin:** Set minimum days before first withdrawal per plan
- **Effort:** 2 hours
- **Files:**
  - Update withdrawal API with hold period check
  - Add setting in admin

---

## Phase 7: Mobile Experience (Priority: MEDIUM)

### 7.1 Biometric Login (WebAuthn)
- **What:** Face ID / Fingerprint for returning users
- **Implementation:** WebAuthn API for passkey registration and authentication
- **Effort:** 4-5 hours
- **Files:**
  - `src/app/api/auth/webauthn/register/route.ts`
  - `src/app/api/auth/webauthn/verify/route.ts`
  - `src/components/BiometricLogin.tsx`

### 7.2 Swipe Gestures
- **What:** Swipe left/right between dashboard tabs
- **Implementation:** Touch event handlers or use `react-swipeable`
- **Effort:** 2 hours
- **Files:**
  - Update `UserDashboard.tsx` with swipe detection

### 7.3 Offline Mode Enhancement
- **What:** Show cached balance and last earnings without internet
- **Implementation:** Cache API responses in service worker, show stale data with "offline" badge
- **Effort:** 3 hours
- **Files:**
  - Update `public/sw.js` with API caching strategy
  - Add offline indicator component

### 7.4 App Store Listing (TWA)
- **What:** Publish as Android app on Play Store using Trusted Web Activity
- **Implementation:** Generate TWA wrapper using Bubblewrap CLI
- **Effort:** 2-3 hours (mostly configuration)
- **Deliverable:** APK file for Play Store submission

---

## Phase 8: Advanced Features (Priority: LOW)

### 8.1 Multi-Currency Display
- **What:** Show balances in USD, EUR, AED, INR based on locale
- **Implementation:** Fetch exchange rates from free API, convert on display
- **Effort:** 2 hours
- **Files:**
  - `src/app/api/exchange-rates/route.ts`
  - `src/hooks/use-currency.ts`

### 8.2 Auto-Withdrawal
- **What:** "When withdrawal wallet reaches $X, auto-send to my address"
- **Implementation:** Cron job checks thresholds, creates withdrawal requests
- **Effort:** 3 hours
- **Files:**
  - `src/app/api/auto-withdrawal/route.ts`
  - Settings in user Security tab

### 8.3 Profit Calendar
- **What:** Visual calendar showing daily profit amounts
- **UI:** Month view with green/red cells, click for details
- **Effort:** 3-4 hours
- **Files:**
  - `src/components/dashboard/ProfitCalendar.tsx`
  - Add to EarningsTab

### 8.4 Affiliate Dashboard
- **What:** Dedicated page for power referrers with advanced stats
- **UI:** Team tree visualization, commission breakdown by level, export
- **Effort:** 5-6 hours
- **Files:**
  - `src/app/affiliate/page.tsx`
  - `src/components/affiliate/AffiliateDashboard.tsx`

### 8.5 On-Chain Wallet Balance
- **What:** Show user's actual USDT/USDC balance from their connected MetaMask
- **Implementation:** Call ERC-20 `balanceOf` via ethers.js
- **Effort:** 2-3 hours
- **Files:**
  - `src/lib/web3.ts`
  - Update `MetaMaskConnect.tsx`

---

## Implementation Priority Order

### Sprint 1 (Week 1) — Trust & Quick Wins
1. ✅ Withdrawal Proof Ticker (2h)
2. ✅ Terms Checkbox on Signup (30min)
3. ✅ Cookie Consent Banner (1h)
4. ✅ Social Proof Counters on Plans (30min)
5. ✅ QR Code for Referral (1h)
6. ✅ Live Earnings Counter (2h)
7. ✅ Confetti on Deposit (1h)

**Total: ~8 hours**

### Sprint 2 (Week 2) — Retention
1. Email Drip Sequence (5h)
2. Reinvestment Incentive (2h)
3. VIP Tier System (4h)
4. Session Timeout (2h)
5. IP Login Alerts (2h)

**Total: ~15 hours**

### Sprint 3 (Week 3) — Growth
1. Referral Contest (6h)
2. Referral Calculator on Landing (2h)
3. Investment Certificate PDF (3h)
4. Telegram Bot (8h)
5. Browser Push Notifications (4h)

**Total: ~23 hours**

### Sprint 4 (Week 4) — Mobile & Advanced
1. Biometric Login (5h)
2. Swipe Gestures (2h)
3. Profit Calendar (4h)
4. Multi-Currency (2h)
5. Auto-Withdrawal (3h)
6. Affiliate Dashboard (6h)

**Total: ~22 hours**

---

## Technical Dependencies

| Feature | Requires |
|---------|----------|
| Email Drip | Resend API (already configured) |
| Push Notifications | VAPID keys (generate once) |
| Telegram Bot | Bot token from @BotFather |
| Biometric | HTTPS (already on Vercel) |
| Certificate PDF | `jspdf` or `@react-pdf/renderer` package |
| On-Chain Balance | `ethers` package |
| Exchange Rates | Free API (exchangerate-api.com) |
| Live Chat | Tawk.to or Crisp account |

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Signup → First Deposit | >30% | Track in analytics |
| Daily Active Users | >50% of registered | Login history |
| Referral Rate | >20% of users refer someone | Referral count |
| Withdrawal Success Rate | 100% within 48h | Admin dashboard |
| Average Session Duration | >5 minutes | Analytics |
| Plan Upgrade Rate | >15% upgrade within 30 days | Deposit history |

---

## Notes

- All features should maintain the dark crypto theme
- Mobile-first approach for all new UI
- AI features should use Groq for speed (< 1s response)
- All admin-configurable features should have toggles in Settings
- New features should not break existing functionality
- Each feature should be deployable independently
