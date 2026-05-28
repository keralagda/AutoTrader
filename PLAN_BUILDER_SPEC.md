# Plan Builder - Advanced Configurator Specification

## Current Fields (Already Implemented)
- Name, Description, Entry Fee
- Min/Max Deposit, Daily Earning %, Max Earning Limit
- Return Type (hourly/daily/weekly/monthly/after_end)
- Return Period Hours, Total Return %, Duration Days
- Capital Return (included/end/none), Repeat Count
- Stacking (enabled, max stacks, bonus %, lock period)
- Auto-Compound, Early Exit Penalty
- Distribution % (account holder, trade profit share, rewards, platform fee)
- Subscription Distribution (referral, rewards, platform)
- Risk Levels (low/med/high min/max %)
- Rotation with stacking

## New Advanced Options Needed

### 1. Profit Schedule Configuration
- **Profit Days**: Select which days profits are credited (Mon-Sun checkboxes)
- **Profit Hours**: Specific hours when profits are credited (e.g., 9 AM, 3 PM, 9 PM)
- **Holiday Pause**: Option to pause profits on specified dates
- **Grace Period**: Days after deposit before first profit (e.g., 1 day warmup)

### 2. Withdrawal Rules (Per Plan)
- **Min Withdrawal from Plan**: Minimum amount user can withdraw from this plan's earnings
- **Withdrawal Cooldown**: Hours between withdrawals (e.g., 24h, 48h, 72h)
- **Withdrawal Fee %**: Plan-specific withdrawal fee
- **Max Daily Withdrawal**: Cap on daily withdrawal from this plan
- **Capital Lock**: Days before capital can be withdrawn (separate from earnings)

### 3. Reinvestment Configuration
- **Auto-Reinvest**: Automatically reinvest profits back into same plan
- **Reinvest Bonus %**: Extra bonus when reinvesting (e.g., +2%)
- **Min Reinvest Amount**: Minimum amount for reinvestment
- **Reinvest Lock Days**: Lock period on reinvested amount

### 4. Referral Overrides (Per Plan)
- **Custom Referral %**: Override global referral config for this plan
- **Referral Bonus on Join**: Extra bonus when someone joins this specific plan via referral
- **Team Requirement**: Minimum team size to join this plan

### 5. Risk & Volatility
- **Volatility Mode**: stable/moderate/volatile - affects daily % variation
- **Loss Days**: % chance of a "loss day" where returns are 0 or negative
- **Bonus Days**: % chance of a "bonus day" with 2x returns
- **Streak Bonus**: Extra % after X consecutive days of holding

### 6. Tier Requirements
- **Min VIP Tier**: Minimum tier to access this plan (e.g., Gold+ only)
- **Min KYC Level**: Require KYC approval to invest in this plan
- **Min Account Age**: Days since registration before user can invest

### 7. Visual & Marketing
- **Plan Color Theme**: Custom color for plan card
- **Plan Badge**: "Popular", "New", "Limited", "VIP Only"
- **Spots Limit**: Maximum number of active deposits (creates urgency)
- **Countdown Timer**: Plan expires on specific date

### 8. Advanced Stacking
- **Stack Decay**: Each stack earns slightly less (e.g., -0.5% per stack)
- **Stack Cooldown**: Hours between creating new stacks
- **Stack Merge**: Option to merge multiple stacks into one larger deposit
- **Progressive Stacking**: Each stack requires higher minimum deposit

## Implementation Priority

### Phase 1 (Add to existing Plan Builder form)
1. Profit Days (checkboxes)
2. Grace Period (number input)
3. Withdrawal Cooldown (number input)
4. Plan Badge (dropdown)
5. Min VIP Tier (dropdown)
6. Spots Limit (number input)

### Phase 2 (New section in Plan Builder)
7. Auto-Reinvest toggle + bonus %
8. Custom Referral % override
9. Volatility Mode selector
10. Loss/Bonus day percentages

### Phase 3 (Advanced)
11. Profit Hours configuration
12. Holiday Pause dates
13. Progressive Stacking rules
14. Team Requirements
15. Countdown Timer

## Schema Changes Needed

```prisma
model Plan {
  // ... existing fields ...
  
  // Phase 1
  profitDays          String   @default("mon,tue,wed,thu,fri") // Comma-separated days
  gracePeriodDays     Int      @default(0)  // Days before first profit
  withdrawalCooldown  Int      @default(24) // Hours between withdrawals
  planBadge           String?  // "popular", "new", "limited", "vip"
  minVipTier          String   @default("Bronze") // Minimum tier to access
  spotsLimit          Int      @default(0)  // 0 = unlimited
  
  // Phase 2
  autoReinvest        Boolean  @default(false)
  reinvestBonus       Float    @default(2)  // % bonus on reinvest
  customReferralPct   Float?   // Override global referral % (null = use global)
  volatilityMode      String   @default("moderate") // stable/moderate/volatile
  lossDayChance       Float    @default(0)  // % chance of 0 return day
  bonusDayChance      Float    @default(5)  // % chance of 2x return day
  
  // Phase 3
  profitHours         String?  // "9,15,21" - specific hours
  teamRequirement     Int      @default(0)  // Min team size to join
  countdownEnd        DateTime? // Plan expires on this date
}
```

## UI Layout in Plan Builder

```
┌─────────────────────────────────────────────────┐
│ Section 1: Basic Info                           │
│ [Name] [Description] [Entry Fee]                │
├─────────────────────────────────────────────────┤
│ Section 2: Deposit & Earning Rules              │
│ [Min/Max Deposit] [Variable Win %] [Max Earn]   │
│ [Risk Levels: Low/Med/High with min/max %]      │
├─────────────────────────────────────────────────┤
│ Section 3: Time Configuration                   │
│ [Return Type] [Period] [Duration] [Capital]     │
│ [Profit Days ☑Mon ☑Tue...] [Grace Period]       │
├─────────────────────────────────────────────────┤
│ Section 4: Stacking & Compound                  │
│ [Stacking] [Max Stacks] [Bonus] [Lock]          │
│ [Auto-Compound] [Auto-Reinvest] [Reinvest %]   │
├─────────────────────────────────────────────────┤
│ Section 5: Withdrawal Rules                     │
│ [Cooldown] [Min Withdrawal] [Max Daily] [Fee]   │
│ [Capital Lock Days] [Early Exit Penalty]        │
├─────────────────────────────────────────────────┤
│ Section 6: Access & Requirements                │
│ [Min VIP Tier] [Min KYC] [Team Requirement]     │
│ [Spots Limit] [Plan Badge] [Countdown]          │
├─────────────────────────────────────────────────┤
│ Section 7: Volatility & Bonus                   │
│ [Volatility Mode] [Loss Day %] [Bonus Day %]   │
│ [Streak Bonus] [Custom Referral %]              │
├─────────────────────────────────────────────────┤
│ Section 8: Distribution                         │
│ [Account Holder %] [Profit Share %]             │
│ [Rewards %] [Platform Fee %]                    │
└─────────────────────────────────────────────────┘
```
