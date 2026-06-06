// ─── Help Center Data ─────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string
  options: string[]
  answerIndex: number
}

export interface HelpGuide {
  id: string
  title: string
  category: string
  content: string
  audience: 'admin' | 'user' | 'both'
  quiz?: QuizQuestion[]
}

export const ADMIN_HELP_GUIDES: HelpGuide[] = [
  // ─── Getting Started
  { id: 'a1', title: 'Admin Dashboard Overview', category: 'Getting Started', audience: 'admin', content: 'The admin dashboard is your central control panel. Navigate using the left sidebar which is organized into groups: Dashboard & Analytics, User Management, Finance, Trading & Plans, Site Builder, Content, Support, and Settings. Each section contains specific management tools.' },
  { id: 'a2', title: 'First-Time Setup Checklist', category: 'Getting Started', audience: 'admin', content: '1. Set up Payment Gateways (Finance section)\n2. Create Investment Plans (Plan Builder)\n3. Configure Risk Categories\n4. Set up Referral System percentages\n5. Customize Landing Page (Templates)\n6. Configure Nova Points rewards\n7. Add Testimonials and Fake Profiles\n8. Set up Cron Jobs for auto-profit distribution\n9. Configure Feature Flags\n10. Test the full user flow' },
  { id: 'a3', title: 'Understanding Roles & Permissions', category: 'Getting Started', audience: 'admin', content: 'The platform has 5 roles: Super Admin (full access), Admin (management without deletion), Moderator (content + user moderation), Support (tickets + KYC), User (standard). Assign roles from User Management → Roles & Permissions. Each role has granular CRUD permissions per module.' },

  // ─── User Management
  { id: 'a4', title: 'Managing Users', category: 'User Management', audience: 'admin', content: 'View all real users in User Management → All Users. Fake profiles are managed separately. Actions: View details, Spectate (view as user), Toggle active/inactive, Adjust balance, Delete user. Users start as inactive and become active after their first deposit is approved.' },
  { id: 'a5', title: 'Spectate Mode (View as User)', category: 'User Management', audience: 'admin', content: 'Click the monitor icon (👁️) on any user to open their dashboard in a new tab. You\'ll see exactly what they see — their balances, investments, earnings. A violet banner shows you\'re in spectate mode. Click "Exit Spectate" to close.' },
  { id: 'a6', title: 'Adjusting User Balances', category: 'User Management', audience: 'admin', content: 'Click the $ icon on a user to add or subtract balance. Choose Trading or Withdrawal wallet. Add remarks for audit trail. Positive amounts activate inactive users. All adjustments are logged in Activity Log and the user receives a notification.' },
  { id: 'a7', title: 'Resetting User Earnings', category: 'User Management', audience: 'admin', content: 'In user detail view, use "Reset Earnings" to zero out a user\'s totalEarnings, tradingBalance, and withdrawalBalance. This is useful for correcting errors or resetting test accounts. The action is logged.' },
  { id: 'a8', title: 'Deleting Users', category: 'User Management', audience: 'admin', content: 'Click the trash icon to soft-delete a user. This deactivates the account, wipes personal data (name, email, phone, wallet), and zeros balances. The user ID is preserved for referral chain integrity. Admin accounts cannot be deleted.' },
  { id: 'a9', title: 'KYC Verification', category: 'User Management', audience: 'admin', content: 'Review KYC submissions in User Management → KYC Verification. Users submit document type, number, and photo. Approve or reject with a reason. KYC status affects withdrawal limits.' },
  { id: 'a10', title: 'Risk Categories', category: 'User Management', audience: 'admin', content: 'Assign users to Low/Medium/High risk categories. Each category has min/max daily return percentages. You can also set custom win% per user to override category defaults. Risk level determines how much profit the cron distributes.' },
  { id: 'a11', title: 'Duplicate Detection', category: 'User Management', audience: 'admin', content: 'Check for duplicate accounts by address, KYC details, or wallet address. Helps identify users creating multiple accounts to abuse referral bonuses.' },
  { id: 'a12', title: 'Bulk Operations', category: 'User Management', audience: 'admin', content: 'Perform mass actions: bulk activate/deactivate users, bulk assign risk categories, bulk send notifications. Select users with checkboxes and apply the action.' },

  // ─── Finance
  { id: 'a13', title: 'Deposit Approvals', category: 'Finance', audience: 'admin', content: 'All user deposits require admin approval. Go to Finance → Deposit Approvals to see pending deposits. Each shows amount, payment method, TX hash, and proof screenshot. Approve to credit the user\'s trading wallet, or reject to notify them.' },
  { id: 'a14', title: 'Investment Approvals', category: 'Finance', audience: 'admin', content: 'When users invest in a plan, the deposit starts as "pending". Approve from the Earnings section to activate it and start profit distribution. Reject to refund the amount back to their trading wallet.' },
  { id: 'a15', title: 'Withdrawal Management', category: 'Finance', audience: 'admin', content: 'Review withdrawal requests in Finance → Withdrawals. Approve to mark as processed (you handle the actual transfer manually). Reject with a reason. Set withdrawal limits in Settings → Withdrawal Limits.' },
  { id: 'a16', title: 'Payment Gateways', category: 'Finance', audience: 'admin', content: 'Configure crypto payment gateways: MetaMask, CoinPayments, NOWPayments, USDC (BEP-20), and EU/US Wire Transfer. Set wallet addresses, API keys, min/max amounts, and fees. Enable/disable each gateway.' },


  // ─── Trading & Plans
  { id: 'a17', title: 'Creating Investment Plans', category: 'Trading & Plans', audience: 'admin', content: 'Click "Add New Plan" to open the full-page plan builder. Configure: name, entry fee, min/max deposit, daily earning %, max earning limit, return type (hourly/daily/weekly), duration, capital return method, stacking, lock period, and distribution percentages.' },
  { id: 'a18', title: 'Plan Risk Levels', category: 'Trading & Plans', audience: 'admin', content: 'Each plan can support Low/Medium/High risk levels with different min/max daily percentages. Users choose their risk level when investing. The cron uses these ranges (skewed toward minimum) for profit calculation.' },
  { id: 'a19', title: 'Logic Builder', category: 'Trading & Plans', audience: 'admin', content: 'Stack rules that control profit distribution: base risk calculation, skew-to-minimum curve, weekday-only trading, random loss/bonus days, streak bonuses, VIP multipliers, daily caps. Also configure calculator display rules and time-based patterns (gradual increase, wave, decay).' },
  { id: 'a20', title: 'Referral System Configuration', category: 'Trading & Plans', audience: 'admin', content: 'Configure 7-level referral commissions for: deposit commission, profit share, and subscription fee share. Set qualification rules (min referrals per level), VIP tier multipliers, contest multiplier, and signup bonus toggle.' },
  { id: 'a21', title: 'Auto Profit Distribution (Cron)', category: 'Trading & Plans', audience: 'admin', content: 'The cron job runs automatically (via Vercel Cron or cron-job.org) to distribute daily profits. It processes all active deposits, calculates variable returns based on risk category, and credits user wallets. Configure schedule in Cron tab.' },
  { id: 'a22', title: 'Trading Config', category: 'Trading & Plans', audience: 'admin', content: 'Configure the trading simulator settings: chart patterns, win/loss ratios, session duration, and visual effects. This controls what users see in the Live Trading tab.' },

  // ─── Site Builder
  { id: 'a23', title: 'Landing Page Templates', category: 'Site Builder', audience: 'admin', content: 'Choose from 7 built-in templates (Crypto Dark, DeFi Gradient, Trading Pro, Neon Pulse, Aurora Gradient, Quantum Dark, Hologram UI). Each applies unique colors, fonts, and hero content. Click "Apply" to activate. Create custom templates with the PUT endpoint.' },
  { id: 'a24', title: 'Page Builder', category: 'Site Builder', audience: 'admin', content: 'Visual drag-and-drop page builder with 31 widgets across 7 categories (Basic, Layout, Content, Media, Sections, Interactive, Advanced). Create custom pages, add blocks, configure properties, preview in desktop/mobile, and publish.' },
  { id: 'a25', title: 'Landing Sections Editor', category: 'Site Builder', audience: 'admin', content: 'Edit individual landing page sections: Hero (headline, subtitle, CTAs, stats), Navbar (logo, links), Stats, Testimonials (add/remove items), Plans (title), Referral (title), Footer (company info, links, socials). Toggle visibility per section.' },

  // ─── Content
  { id: 'a26', title: 'Managing News', category: 'Content', audience: 'admin', content: 'Create news articles with title, content, category (general/update/promotion/alert), and publish status. Published news appears in the user dashboard News tab.' },
  { id: 'a27', title: 'Promotions & Countdown Timers', category: 'Content', audience: 'admin', content: 'Create time-limited promotions with title, description, multiplier (e.g., 2x referral bonus), start/end dates. Show on landing page and/or dashboard. Active promotions display countdown timers.' },
  { id: 'a28', title: 'Testimonials Management', category: 'Content', audience: 'admin', content: 'Add testimonials with name, role, content, rating (1-5), earnings display, and avatar. They appear on the landing page with auto-assigned country flags. Manage from Content → Testimonials.' },
  { id: 'a29', title: 'Challenges & Badges', category: 'Content', audience: 'admin', content: 'Create challenges with: title, description, category (daily/weekly/milestone/streak/referral/deposit/special), target value, USDC reward, NP reward, difficulty, color theme, recurrence. Badges are earned by completing challenges or reaching XP thresholds.' },
  { id: 'a30', title: 'Nova Points Pool', category: 'Content', audience: 'admin', content: 'Configure NP earning rates (check-in rewards, streak bonuses), store items (costs, descriptions, enable/disable), lucky spin prizes (amounts and weights), conversion rate (NP per $1), and challenge multiplier. All values are admin-configurable.' },
  { id: 'a31', title: 'Ecommerce / Products', category: 'Content', audience: 'admin', content: 'Manage promotional materials and branded merchandise. Add products with name, category, price, image, description, colors, stock. Free items (price $0) appear as downloadable resources. Paid items show in the merch store.' },
  { id: 'a32', title: 'Fake Profiles & Notifications', category: 'Content', audience: 'admin', content: 'Create fake user profiles (international names, avatars) that appear in social proof elements. Fake notifications show toast messages like "John invested $500 in Gold plan" to create urgency. Configure delay intervals.' },

  // ─── Support
  { id: 'a33', title: 'Support Tickets', category: 'Support', audience: 'admin', content: 'View and manage user support tickets. Update status (open/in_progress/resolved/closed), assign to staff, set priority. Reply to tickets. Delete resolved tickets to keep the queue clean.' },
  { id: 'a34', title: 'Messages', category: 'Support', audience: 'admin', content: 'Send direct messages to individual users or broadcast to all active users. Messages appear in the user\'s Message Centre. Edit or delete sent messages.' },
  { id: 'a35', title: 'Nova AI Chatbot', category: 'Support', audience: 'admin', content: 'Configure the AI chatbot: set name, personality, greeting message, AI model (Groq/Mistral/NVIDIA/OpenRouter), temperature, max tokens. Add custom knowledge base text that the bot uses to answer questions about your platform.' },
  { id: 'a36', title: 'Activity Log', category: 'Support', audience: 'admin', content: 'View all admin actions: deposit approvals, user modifications, balance adjustments, role changes, etc. Each entry shows who did what, when, and details. Use for audit trails and accountability.' },

  // ─── Settings
  { id: 'a37', title: 'General Settings', category: 'Settings', audience: 'admin', content: 'Configure platform-wide settings: site name, logo, contact email, social links, legal pages (terms, privacy, risk disclaimer), withdrawal limits, and more.' },
  { id: 'a38', title: 'Feature Flags', category: 'Settings', audience: 'admin', content: '40+ toggleable features organized by category (Landing Page, User Dashboard, Finance, Security, AI, Platform). Toggle any feature on/off instantly without code changes. Includes maintenance mode and registration control.' },
  { id: 'a39', title: 'Geo-Blocking', category: 'Settings', audience: 'admin', content: 'Block access from specific countries. Users from blocked regions see a restriction page. Useful for regulatory compliance. Configure allowed/blocked country lists.' },
  { id: 'a40', title: 'Notification Templates', category: 'Settings', audience: 'admin', content: 'Pre-built notification templates for common events: welcome, deposit confirmed, withdrawal approved/rejected, KYC status, profit credited, referral bonus, maintenance. Customize text and send to users.' },
  { id: 'a41', title: 'Roles & Permissions', category: 'Settings', audience: 'admin', content: 'Create custom roles, assign permissions per module (CRUD), view the full permission matrix. Assign roles to users to give them admin panel access. Built-in roles: Super Admin, Admin, Moderator, Support.' },
  { id: 'a42', title: 'Reset Platform Data', category: 'Settings', audience: 'admin', content: 'Reset all user data to zero state for client handover. Deletes: users (except admin), deposits, earnings, withdrawals, transactions, messages, tickets, etc. Preserves: plans, settings, templates, feature flags, payment gateways, challenges, badges.' },

  // ─── Analytics & Monitoring
  { id: 'a43', title: 'Analytics Dashboard', category: 'Analytics', audience: 'admin', content: 'View platform metrics: total users, active investors, total deposits, platform revenue, pending withdrawals, earnings distributed, new users. Chart shows deposits by day. Fake profiles are excluded from all totals.' },
  { id: 'a44', title: 'System Health', category: 'Analytics', audience: 'admin', content: 'Monitor system status: database connection, API response times, cron job last run, active deposits count, pending items. Alerts for any issues.' },

  // ─── Advanced
  { id: 'a45', title: 'Cron Job Setup (cron-job.org)', category: 'Advanced', audience: 'admin', content: 'Create and manage cron jobs on cron-job.org. The profit distribution cron should run every hour (or as configured). Set the URL to your /api/cron/distribute-profits endpoint with the x-cron-secret header.' },
  { id: 'a46', title: 'Email Drip Sequences', category: 'Advanced', audience: 'admin', content: 'Automated email sequences triggered by user milestones: welcome (day 0), first deposit reminder (day 1), investment guide (day 3), referral prompt (day 7), VIP upgrade (day 14), re-engagement (day 30).' },
  { id: 'a47', title: 'VIP Tier System', category: 'Advanced', audience: 'admin', content: 'Users progress through tiers (Bronze → Silver → Gold → Platinum → Diamond) based on NP earned. Each tier provides cashback on deposits. Tiers are automatic based on XP thresholds.' },
  { id: 'a48', title: 'Referral Contests', category: 'Advanced', audience: 'admin', content: 'Create time-limited referral contests with prizes. Set start/end dates and prize structure. Leaderboard shows top referrers during the contest period. Contests can have multipliers that boost referral earnings.' },
  { id: 'a49', title: 'Multi-Language Support', category: 'Advanced', audience: 'admin', content: 'The platform supports 10 languages: English, Arabic, French, Spanish, Portuguese, Russian, Turkish, Hindi, Indonesian, Chinese. Auto-detection by geo-IP. RTL support for Arabic. Translations in src/lib/i18n.ts.' },
  { id: 'a50', title: 'PWA & Mobile Experience', category: 'Advanced', audience: 'admin', content: 'The platform is a Progressive Web App. Users can install it on mobile for app-like experience. Bottom navigation on mobile, safe areas, no-bounce scroll, app-like transitions. Configure in public/manifest.json.' },
  { id: 'a51', title: 'AI Features Overview', category: 'Advanced', audience: 'admin', content: 'AI capabilities: Trading Signals (Groq), Market Commentary, Content Generator, Nova AI Chatbot (landing page), AIChatbot (dashboard), Auto-Translation (NVIDIA). All use API keys from .env. Configure models in Chatbot settings.' },
  { id: 'a52', title: 'Deployment & Environment', category: 'Advanced', audience: 'admin', content: 'Deployed on Vercel with Neon PostgreSQL. Environment variables in .env: DATABASE_URL, JWT_SECRET, CRON_SECRET, AI API keys, payment gateway keys. Deploy with: git push origin main && npx vercel --prod.' },
]

export const USER_HELP_GUIDES: HelpGuide[] = [
  // ─── Getting Started
  { id: 'u1', title: 'Welcome to Black Nova FX', category: 'Getting Started', audience: 'user', content: 'Black Nova FX is an AI-powered crypto investment platform. You can earn daily returns by investing in our trading plans. Start by depositing funds, choosing a plan, and watching your earnings grow automatically.' },
  { id: 'u2', title: 'Creating Your Account', category: 'Getting Started', audience: 'user', content: 'Register with your email, name, and password. Optionally enter a referral code to join someone\'s team. After registration, your account is inactive until you make your first deposit.' },
  { id: 'u3', title: 'Dashboard Overview', category: 'Getting Started', audience: 'user', content: 'Your dashboard shows: Trading Wallet (for investments), Withdrawal Wallet (for cashouts), Total Earnings, and active investments. Use the sidebar to navigate between sections.' },

  // ─── Deposits
  { id: 'u4', title: 'How to Deposit Funds', category: 'Deposits', audience: 'user', content: '1. Go to Deposit tab\n2. Choose a payment method (MetaMask, CoinPayments, NOWPayments, USDT, USDC, or Wire Transfer)\n3. Enter the amount and provide TX hash + proof screenshot\n4. Submit and wait for admin approval (usually within 24 hours)\n5. Once approved, funds appear in your Trading Wallet' },
  { id: 'u5', title: 'Supported Payment Methods', category: 'Deposits', audience: 'user', content: 'Crypto: MetaMask (BSC/BEP-20), CoinPayments (multi-crypto), NOWPayments (100+ coins), USDC (BEP-20). Wire Transfer: EU banks (SEPA) and US banks (ACH/Fedwire) with SWIFT support. Minimum deposit: $10.' },

  { id: 'u6', title: 'EU/US Wire Transfer', category: 'Deposits', audience: 'user', content: 'Click "EU/US Wire Transfer" in the deposit section. Copy the receiving bank details (IBAN, SWIFT). Send the wire from your bank with your BNFX reference code. Submit the transaction reference number. Processing: 1-3 business days.' },
  { id: 'u7', title: 'Deposit Approval Process', category: 'Deposits', audience: 'user', content: 'All deposits require admin verification. After submitting, your deposit shows as "Pending". Once approved, funds are credited to your Trading Wallet and you receive a notification. If rejected, you\'ll be notified with a reason.' },

  // ─── Investing
  { id: 'u8', title: 'How to Invest in a Plan', category: 'Investing', audience: 'user', content: '1. Go to Investment tab\n2. Browse available plans (each shows daily return range, min/max deposit, risk levels)\n3. Select a plan and enter your investment amount\n4. Choose your risk level (Low/Medium/High)\n5. Confirm — your investment starts after admin approval\n6. Earnings are distributed automatically by the system' },
  { id: 'u9', title: 'Understanding Risk Levels', category: 'Investing', audience: 'user', content: 'Low Risk: Stable, lower returns (0.3%-1.2% daily). Medium Risk: Balanced returns (1.0%-3.0% daily). High Risk: Higher potential but more variable (2.5%-8.0% daily). Choose based on your risk tolerance. Returns are variable within the range.' },
  { id: 'u10', title: 'How Earnings Work', category: 'Investing', audience: 'user', content: 'Once your investment is approved, the system automatically calculates and credits your daily earnings to your Trading Wallet. Earnings are based on your risk level and plan configuration. You don\'t need to log in to earn — it\'s fully automated.' },
  { id: 'u11', title: 'Reinvesting Earnings', category: 'Investing', audience: 'user', content: 'Reinvest to compound your returns. When you reinvest, the system takes your original deposit + all earnings from that deposit and creates a new, larger investment. Example: $100 invested + $30 earned = $130 reinvested. Plus you get a 2% reinvestment bonus.' },
  { id: 'u12', title: 'Stacking Deposits', category: 'Investing', audience: 'user', content: 'Some plans allow stacking — multiple deposits on the same plan. Each additional stack earns a bonus on the daily rate. Check if a plan shows "Stackable" badge. Maximum stacks vary by plan.' },

  // ─── Withdrawals
  { id: 'u13', title: 'How to Withdraw', category: 'Withdrawals', audience: 'user', content: '1. Transfer funds from Trading Wallet to Withdrawal Wallet using the Transfer button\n2. Go to Withdrawal tab\n3. Enter amount and your wallet address\n4. Submit withdrawal request\n5. Admin processes within 24-48 hours\n6. Funds sent to your wallet' },
  { id: 'u14', title: 'Wallet Transfer (Trading → Withdrawal)', category: 'Withdrawals', audience: 'user', content: 'Your earnings go to the Trading Wallet. To withdraw, first transfer to the Withdrawal Wallet using the ↔️ Transfer button in the header. You can transfer any amount up to your balance. Then request a withdrawal from the Withdrawal Wallet.' },
  { id: 'u15', title: 'Withdrawal Limits & Fees', category: 'Withdrawals', audience: 'user', content: 'Minimum withdrawal varies by method. Processing time: 24-48 hours. KYC may be required for larger amounts. Check the withdrawal page for current limits and any applicable fees.' },

  // ─── Nova Points
  { id: 'u16', title: 'What are Nova Points?', category: 'Nova Points', audience: 'user', content: 'Nova Points (NP) are the platform\'s reward currency. Earn NP from daily check-ins, challenges, screen time, and achievements. Redeem NP in the Rewards Store for real rewards like USDC, fee waivers, earning boosts, and more.' },
  { id: 'u17', title: 'Earning Nova Points', category: 'Nova Points', audience: 'user', content: 'Ways to earn NP:\n• Daily Check-in: 2-12 NP based on streak\n• Screen Time: 1 NP per 2 minutes (max 30/day)\n• Challenges: Complete tasks for NP rewards\n• Streak Bonuses: Longer streaks = more NP\n• Milestones: Bonus NP at 7 and 30 check-ins' },
  { id: 'u18', title: 'Rewards Store', category: 'Nova Points', audience: 'user', content: 'Redeem NP for:\n• Convert to USDC (1000 NP = $1)\n• Withdrawal Fee Waiver (500 NP)\n• Priority Withdrawal (200 NP)\n• 2x Earnings 24h (2000 NP)\n• Lucky Spin (50 NP)\n• Exclusive Badge (3000 NP)\n• Skip Cooldown (300 NP)' },
  { id: 'u19', title: 'Lucky Spin', category: 'Nova Points', audience: 'user', content: 'Spend 50 NP to spin the wheel. Win between $0.10 and $10.00 in USDC, credited instantly to your Trading Wallet. Higher prizes are rarer but possible!' },

  // ─── Referrals
  { id: 'u20', title: 'Referral System', category: 'Referrals', audience: 'user', content: 'Earn from 7 levels of referrals. Share your referral code (found in sidebar). When your referrals invest, you earn a percentage of their subscription fees and ongoing profit share. The deeper your network, the more you earn.' },
  { id: 'u21', title: 'Referral Earnings Breakdown', category: 'Referrals', audience: 'user', content: 'Level 1: 25% | Level 2: 20% | Level 3: 15% | Level 4: 10% | Level 5: 10% | Level 6: 10% | Level 7: 10% — of the referral pool (80% of subscription fee). Plus ongoing profit share from their daily earnings.' },
  { id: 'u22', title: 'Sharing Your Referral Code', category: 'Referrals', audience: 'user', content: 'Find your unique referral code in the sidebar. Copy it and share via social media, messaging apps, or email. When someone registers with your code, they join your Level 1 team. Use the Resources page for promotional banners and materials.' },

  // ─── Security
  { id: 'u23', title: 'Two-Factor Authentication (2FA)', category: 'Security', audience: 'user', content: 'Enable 2FA in Security tab for extra protection. Scan the QR code with Google Authenticator or similar app. Enter the 6-digit code to verify. After enabling, you\'ll need the code every time you log in.' },
  { id: 'u24', title: 'KYC Verification', category: 'Security', audience: 'user', content: 'Submit your identity document (passport, ID card, or driver\'s license) for verification. KYC may be required for larger withdrawals. Go to Security → KYC, upload your document and a selfie, then wait for admin review.' },
  { id: 'u25', title: 'Account Security Tips', category: 'Security', audience: 'user', content: '• Use a strong, unique password\n• Enable 2FA\n• Never share your login credentials\n• Check login history regularly\n• Log out on shared devices\n• Be wary of phishing links' },

  // ─── Resources & Support
  { id: 'u26', title: 'Promotional Resources', category: 'Resources', audience: 'user', content: 'Download free banners, PDFs, and logo packs from the Resources tab. Use them to promote your referral link on social media. Available in multiple sizes for different platforms (Instagram, Facebook, WhatsApp stories).' },
  { id: 'u27', title: 'Branded Merchandise', category: 'Resources', audience: 'user', content: 'Order official Black Nova FX merchandise: T-shirts, caps, pens, diaries, keychains, and watches. Pay with USDC or trading wallet balance. Contact support to place orders. Shipping worldwide.' },
  { id: 'u28', title: 'Getting Help', category: 'Resources', audience: 'user', content: 'Need help? Options:\n• Nova AI Chatbot (instant answers)\n• Support Tickets (for account issues)\n• Message Centre (direct admin contact)\n• This Help Center (guides and FAQs)' },
  
  // ─── Venture & Incubations
  {
    id: 'u29',
    title: 'Introduction to Venture Capital',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Venture Capital (VC) is a form of private equity financing provided by investment firms to early-stage, high-growth-potential startups. VCs provide capital in exchange for equity (ownership), targeting substantial returns when the startup goes public (IPO) or gets acquired.',
    quiz: [
      { question: 'What is Venture Capital (VC)?', options: ['A form of private equity financing', 'A public bank loan', 'A corporate tax', 'A charity donation'], answerIndex: 0 },
      { question: 'VCs invest in exchange for what?', options: ['Higher interest rates', 'Equity or ownership stake', 'Free advertising', 'Physical products'], answerIndex: 1 },
      { question: 'When do VCs typically expect substantial returns?', options: ['Immediately upon investing', 'Upon startup exit via IPO or acquisition', 'Monthly through dividends', 'On tax day'], answerIndex: 1 }
    ]
  },
  {
    id: 'u30',
    title: 'Seed Funding vs. Series A',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Seed funding is the initial capital used to prove a concept, build a prototype, and conduct early market research. Series A funding is the next stage, aimed at scaling the business, optimizing product-market fit, and expanding team operations once traction is established.',
    quiz: [
      { question: 'What is the primary purpose of Seed Funding?', options: ['To go public on a stock exchange', 'To prove a concept and build a prototype', 'To hire late-stage VPs', 'To buy competitor startups'], answerIndex: 1 },
      { question: 'When is Series A funding raised?', options: ['Before the concept is created', 'After the concept has traction and product-market fit', 'During bankruptcy', 'At IPO'], answerIndex: 1 },
      { question: 'Which funding round is typically larger?', options: ['Pre-seed', 'Seed', 'Series A', 'Family round'], answerIndex: 2 }
    ]
  },
  {
    id: 'u31',
    title: 'What is Startup Incubation?',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Startup incubators support early-stage startups during their development phase. They offer physical workspace, shared resources, mentorship, and business training in exchange for equity or a program fee, helping founders build their ideas from scratch.',
    quiz: [
      { question: 'What do startup incubators primarily do?', options: ['Buy companies completely', 'Support early-stage startups during development', 'Manage public stocks', 'Close failing projects'], answerIndex: 1 },
      { question: 'How do incubators charge or take returns?', options: ['Fixed daily interest', 'Equity stake or program fee', 'Product sales', 'They do it for free'], answerIndex: 1 },
      { question: 'What stage of startup is incubation best suited for?', options: ['Late stage', 'Post-IPO', 'Early-stage/ideation', 'M&A stage'], answerIndex: 2 }
    ]
  },
  {
    id: 'u32',
    title: 'Venture Incubator vs. Accelerator',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Incubators focus on early-stage ideation and product-building with open-ended timelines. Accelerators focus on rapid growth, offering intense, structured, cohort-based programs (usually 3-6 months) ending in a \'Demo Day\' to raise capital from investors.',
    quiz: [
      { question: 'What is the timeline of an Accelerator program?', options: ['Unlimited years', 'Open-ended', 'Intense and structured (typically 3-6 months)', '24 hours'], answerIndex: 2 },
      { question: 'Which program typically ends with a \'Demo Day\'?', options: ['Incubator', 'Accelerator', 'Bank loan', 'Seed round'], answerIndex: 1 },
      { question: 'Incubators focus on which phase of a startup?', options: ['Rapid scale and exit', 'Ideation and product-building', 'Public listing', 'Bankruptcy'], answerIndex: 1 }
    ]
  },
  {
    id: 'u33',
    title: 'Angel Investing Basics',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Angel investors are high-net-worth individuals who invest their personal funds into early-stage startups. They often invest smaller amounts than VCs, provide hands-on mentorship, and take higher risks in exchange for convertible debt or equity.',
    quiz: [
      { question: 'Who is an Angel Investor?', options: ['A government agency', 'A high-net-worth individual investing personal funds', 'An institutional VC fund', 'A charity manager'], answerIndex: 1 },
      { question: 'Do angels typically invest larger or smaller amounts than VCs?', options: ['Larger', 'Smaller', 'The exact same', 'Millions of dollars more'], answerIndex: 1 },
      { question: 'What do angel investors receive in exchange for capital?', options: ['Monthly interest payments', 'Convertible debt or equity', 'Company products', 'Free consultations'], answerIndex: 1 }
    ]
  },
  {
    id: 'u34',
    title: 'Understanding Pre-Seed Funding',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Pre-seed funding is the earliest stage of fundraising, occurring before seed rounds. It is typically used to support early product development, hire initial engineers, and get the product ready for beta testing. Sources include founders, family, and angels.',
    quiz: [
      { question: 'When does Pre-Seed funding occur?', options: ['After Series A', 'Before the concept exists', 'Before the seed round (earliest stage)', 'At IPO'], answerIndex: 2 },
      { question: 'What is pre-seed funding typically used for?', options: ['Global marketing campaigns', 'Initial product development and hiring', 'M&As', 'Dividends'], answerIndex: 1 },
      { question: 'Who are the common sources of pre-seed funding?', options: ['Institutional banks', 'Mutual funds', 'Founders, family, and angels', 'Stock brokers'], answerIndex: 2 }
    ]
  },
  {
    id: 'u35',
    title: 'Equity Dilution in Venture Capital',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Equity dilution occurs when a company issues new shares to investors, reducing the ownership percentage of existing shareholders. While founders own a smaller percentage of the company, the overall value of their shares increases if the startup grows.',
    quiz: [
      { question: 'What is Equity Dilution?', options: ['When a company closes down', 'When a company issues new shares reducing existing ownership %', 'When a company splits its stock', 'When taxes increase'], answerIndex: 1 },
      { question: 'Does dilution always decrease the total value of founder shares?', options: ['Yes always', 'No, not if the company\'s valuation grows', 'Dilution has no impact on value', 'Yes, it zeros them out'], answerIndex: 1 },
      { question: 'Why does a company issue new shares?', options: ['To raise capital from new investors', 'To pay employee taxes', 'To reduce total shares', 'To pay bank debt'], answerIndex: 0 }
    ]
  },
  {
    id: 'u36',
    title: 'Venture Debt vs. Venture Equity',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Venture equity involves selling ownership shares to investors in exchange for capital. Venture debt is a form of debt financing designed for venture-backed startups, allowing them to raise capital without diluting equity, usually repaid with interest.',
    quiz: [
      { question: 'What is the key difference between Venture Equity and Venture Debt?', options: ['Equity does not exist', 'Equity sells ownership while debt must be repaid with interest', 'Debt sells ownership while equity is repaid', 'They are identical'], answerIndex: 1 },
      { question: 'What is the main benefit of Venture Debt?', options: ['It dilutes equity', 'It raises capital without diluting equity ownership', 'It is free money', 'It never has to be repaid'], answerIndex: 1 },
      { question: 'Who is venture debt designed for?', options: ['Late-stage public conglomerates', 'Venture-backed startups', 'Brand new ideas', 'Government institutions'], answerIndex: 1 }
    ]
  },
  {
    id: 'u37',
    title: 'What is a SAFE Note?',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'A SAFE (Simple Agreement for Future Equity) is a financial instrument created by Y Combinator. It allows investors to provide capital today in exchange for the right to receive equity in a future priced round, avoiding the need to value the startup immediately.',
    quiz: [
      { question: 'What does SAFE stand for?', options: ['Secure Asset and Financial Equity', 'Simple Agreement for Future Equity', 'Standard Agreement for Funding Startups', 'Stock Allocation and Financial Exchange'], answerIndex: 1 },
      { question: 'Who created the SAFE note?', options: ['Y Combinator', 'Harvard University', 'Chase Bank', 'NASDAQ'], answerIndex: 0 },
      { question: 'Why is a SAFE note used?', options: ['To pay immediate dividends', 'To delay valuing the startup until a future priced round', 'To sell public shares', 'To take bank loans'], answerIndex: 1 }
    ]
  },
  {
    id: 'u38',
    title: 'Convertible Notes Explained',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'A convertible note is a short-term debt instrument that converts into equity during a future priced round. It behaves like debt initially (accruing interest and having a maturity date) but converts to shares once a venture round is raised.',
    quiz: [
      { question: 'What is a Convertible Note?', options: ['A bank check', 'A short-term debt instrument that converts into equity later', 'A stock certificate', 'A credit card contract'], answerIndex: 1 },
      { question: 'Initially, how does a convertible note behave?', options: ['Like equity', 'Like debt (accruing interest and having a maturity date)', 'Like cash', 'Like a grant'], answerIndex: 1 },
      { question: 'When does a convertible note convert to shares?', options: ['Immediately', 'Once a future priced venture round is raised', 'On the founder\'s birthday', 'At IPO'], answerIndex: 1 }
    ]
  },
  {
    id: 'u39',
    title: 'Valuation Methods for Early-Stage Startups',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Valuing early-stage startups without revenue uses methods like: Berkus Method (assigns value to qualitative milestones), Scorecard Method (compares to similar startups), Risk Factor Summation, and Cost-to-Duplicate.',
    quiz: [
      { question: 'Why are standard cash-flow methods hard to use for early startups?', options: ['Startups have too much profit', 'They lack revenue/history to project cash flow', 'VCs do not like math', 'Startups are public'], answerIndex: 1 },
      { question: 'What is the Berkus Method?', options: ['A method that assigns value to qualitative milestones', 'A public stock pricing tool', 'A DCF calculation', 'An asset valuation'], answerIndex: 0 },
      { question: 'What does the Scorecard Method compare?', options: ['Startup to public corporations', 'Startup to similar early-stage startups in the region', 'Startup assets to liabilities', 'Stock price to bond yields'], answerIndex: 1 }
    ]
  },
  {
    id: 'u40',
    title: 'Due Diligence in Venture Deals',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Due diligence is the comprehensive review conducted by investors before making an investment. It involves verifying legal compliance, researching the market, analyzing product technology, interviewing customers, and auditing financial statements.',
    quiz: [
      { question: 'What is Due Diligence?', options: ['The final payout to founders', 'The comprehensive review conducted by investors before investing', 'The public listing fee', 'A tax audit'], answerIndex: 1 },
      { question: 'What is analyzed during technical due diligence?', options: ['Legal contracts', 'Product technology and source code', 'Team salaries', 'Bank balances'], answerIndex: 1 },
      { question: 'Who conducts due diligence?', options: ['Startups on other startups', 'Investors on potential target startups', 'Public consumers', 'Auditors on governments'], answerIndex: 1 }
    ]
  },
  {
    id: 'u41',
    title: 'The Lifecycle of a Venture Capital Fund',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'VC funds typically have a 10-year lifecycle. Years 1-3: Fundraising and sourcing investments. Years 4-5: Follow-on funding for portfolio companies. Years 6-10: Exiting investments through IPOs or acquisitions and returning capital to Limited Partners.',
    quiz: [
      { question: 'What is the typical lifecycle duration of a VC fund?', options: ['1 year', '10 years', '50 years', 'Indefinite'], answerIndex: 1 },
      { question: 'What happens during years 1-3 of a VC fund?', options: ['The fund is closed', 'Fundraising and sourcing initial investments', 'IPO exits only', 'The fund liquidates'], answerIndex: 1 },
      { question: 'Who receives capital returns when a fund exits its portfolio companies?', options: ['The General Partners only', 'The Limited Partners (investors)', 'The banks', 'The government'], answerIndex: 1 }
    ]
  },
  {
    id: 'u42',
    title: 'Term Sheets: Key Terms to Know',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'A term sheet is a non-binding agreement outlining the terms of an investment. Key clauses include: Valuation (pre-money vs post-money), Liquidation Preference (payout order), Board Seats, Protective Provisions, and Anti-dilution clauses.',
    quiz: [
      { question: 'Is a Term Sheet a binding contract?', options: ['Yes', 'No (it is a non-binding outline of terms)', 'Only for the bank', 'Yes, for 10 years'], answerIndex: 1 },
      { question: 'What does Liquidation Preference determine?', options: ['Startup valuation', 'The payout order when the company is sold/liquidated', 'Board seat count', 'Tax rates'], answerIndex: 1 },
      { question: 'Pre-money valuation refers to what?', options: ['Value after investment', 'Value of startup before receiving new investment', 'Total bank assets', 'Stock price'], answerIndex: 1 }
    ]
  },
  {
    id: 'u43',
    title: 'Exit Strategies: IPOs and M&As',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Startups exit to return capital to investors. Mergers & Acquisitions (M&A) involve another company buying the startup. Initial Public Offerings (IPO) involve listing the startup\'s shares on a public stock exchange.',
    quiz: [
      { question: 'What does M&A stand for?', options: ['Management and Auditing', 'Mergers & Acquisitions', 'Marketing & Advertising', 'Money & Assets'], answerIndex: 1 },
      { question: 'What is an IPO?', options: ['Initial Public Offering (listing shares on public exchange)', 'Investment Portfolio Optimization', 'International Payment Order', 'Internal Profit Organization'], answerIndex: 0 },
      { question: 'Why are exit strategies important for venture investors?', options: ['To pay company taxes', 'To return capital and cash out their investments', 'To change company name', 'To hire new developers'], answerIndex: 1 }
    ]
  },
  {
    id: 'u44',
    title: 'LP (Limited Partner) vs. GP (General Partner)',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'LPs are passive investors (pension funds, family offices) who provide the capital for a VC fund. GPs are the fund managers who make investment decisions, manage the portfolio, and earn a management fee and carried interest (profit share).',
    quiz: [
      { question: 'Who are Limited Partners (LPs)?', options: ['Startups receiving funds', 'Passive investors who provide capital for the VC fund', 'The fund managers making decisions', 'Financial auditors'], answerIndex: 1 },
      { question: 'What is the role of General Partners (GPs)?', options: ['Provide 100% of capital', 'Manage the fund, source deals, and run portfolio management', 'Audit the bank accounts', 'Write software'], answerIndex: 1 },
      { question: 'What is "carried interest"?', options: ['Bank interest on fund deposits', 'The GPs\' share of the fund profits (usually 20%)', 'An LP management fee', 'Startup entry fee'], answerIndex: 1 }
    ]
  },
  {
    id: 'u45',
    title: 'Syndicate Investing Explained',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'A syndicate is a temporary alliance of angel investors who pool their capital to invest in a startup. Lead angels source and negotiate the deal, while backing angels contribute funds, allowing smaller investors to access premium venture deals.',
    quiz: [
      { question: 'What is a Syndicate in early-stage investing?', options: ['A competitive VC firm', 'A temporary alliance of angels pooling capital for a deal', 'A bank branch', 'A startup builder'], answerIndex: 1 },
      { question: 'Who manages and negotiates the syndicate deal?', options: ['All investors equally', 'The Lead Angel', 'The startup CEO', 'The broker'], answerIndex: 1 },
      { question: 'What is the main benefit for backing angels in a syndicate?', options: ['Access to premium deals sourced by lead investors', 'Free equity', 'Monthly interest', 'Voting rights'], answerIndex: 0 }
    ]
  },
  {
    id: 'u46',
    title: 'Venture Studio vs. Incubator',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Incubators support external founders\' ideas. Venture studios (or startup builders) generate ideas internally, build initial prototypes, hire management teams to run them, and spin them off as independent venture-backed startups.',
    quiz: [
      { question: 'How does a Venture Studio differ from an Incubator?', options: ['Studios are completely public', 'Studios generate ideas internally and build them from scratch', 'Incubators fund late-stage tech', 'They are exactly the same'], answerIndex: 1 },
      { question: 'Who runs the startup built by a Venture Studio initially?', options: ['The LPs', 'The studio\'s internal team before hiring founders', 'The bank', 'The government'], answerIndex: 1 },
      { question: 'Venture studios are also known as what?', options: ['Accelerators', 'Startup builders or venture builders', 'Venture funds', 'Incubators'], answerIndex: 1 }
    ]
  },
  {
    id: 'u47',
    title: 'Equity Crowdfunding vs. Venture Capital',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Venture Capital comes from institutional funds. Equity crowdfunding allows public retail investors to buy small shares of early-stage startups online via platforms like WeFunder or Republic, regulated by securities commissions.',
    quiz: [
      { question: 'Who can invest in Equity Crowdfunding?', options: ['Only accredited VCs', 'The general retail public', 'Only banks', 'Only government entities'], answerIndex: 1 },
      { question: 'Where does Venture Capital funding come from?', options: ['Public retail campaigns', 'Institutional venture funds', 'Bank loans', 'Small business grants'], answerIndex: 1 },
      { question: 'Is equity crowdfunding regulated?', options: ['No', 'Yes by securities commissions (like SEC)', 'Only by banks', 'Only by startups themselves'], answerIndex: 1 }
    ]
  },
  {
    id: 'u48',
    title: 'Diversification in Startup Portfolios',
    category: 'Venture & Incubations',
    audience: 'user',
    content: 'Early-stage investing has a high failure rate (over 70%). To mitigate risk, investors diversify by building a portfolio of 15-20+ startups across different industries and vintages, aiming for 1 or 2 outlier winners to return the portfolio.',
    quiz: [
      { question: 'What is the estimated failure rate of early-stage startups?', options: ['Less than 10%', 'Over 70%', '0%', '50%'], answerIndex: 1 },
      { question: 'How do investors mitigate high failure rates?', options: ['By investing in only 1 startup', 'By diversifying across 15-20+ startups', 'By taking bank loans', 'By not investing'], answerIndex: 1 },
      { question: 'What is the goal of diversification in VC?', options: ['To make 10% on every startup', 'To find 1 or 2 outlier winners that return the portfolio', 'To pay less tax', 'To have many average returns'], answerIndex: 1 }
    ]
  },
]
