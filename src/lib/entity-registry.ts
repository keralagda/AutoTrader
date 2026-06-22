// System-wide Entity Registry Module
// Defines all core financial entities, their purposes, relations, database fields, and 5W1H mappings.

export interface EntityDefinition {
  name: string;
  dbField: string;
  purpose: string;
  relations: string[];
  fiveW1H: {
    who: string;
    what: string;
    where: string;
    when: string;
    why: string;
    how: string;
  };
}

export const ENTITY_REGISTRY: Record<string, EntityDefinition> = {
  deposit: {
    name: "Deposit (Wallet Funding)",
    dbField: "Payment model (type: 'deposit')",
    purpose: "Funding the user's wallet balance from external blockchain gateways to support plan activation and active investments.",
    relations: [
      "Increments User.tradingBalance",
      "Deducted from balance to pay Plan Activation Fee",
      "Deducted from balance to create an Active Investment Plan Fee"
    ],
    fiveW1H: {
      who: "Initiated by the User; verified/approved by Admin or automated payment gateways (e.g. MetaMask, CoinPayments).",
      what: "A blockchain transaction that adds USD-equivalent funds to the user's balance.",
      where: "Created in Payment table (type: 'deposit', status: 'approved'). Updates User.tradingBalance.",
      when: "Triggered whenever a user sends crypto to the platform's deposit address and the on-chain txn is confirmed.",
      why: "To inject external liquidity into the user's platform account so they can engage with plans and trading.",
      how: "User chooses payment gateway and amount -> pays crypto to deposit address -> system matches txn -> increments User.tradingBalance."
    }
  },
  activationFee: {
    name: "Activation Fee (Joining Fee / Entry Fee)",
    dbField: "Plan.entryFee",
    purpose: "One-time upfront fee paid by the user to activate/select any investment plan. It acts as the gateway to participate in the plan's earnings and referral network.",
    relations: [
      "Deducted from User.tradingBalance upon plan selection",
      "Base for upline registration referral commission distribution (subscriptionReferralPercent)",
      "Acts as the base for the Daily Cap Multiplier calculations (Joining Fee * X)"
    ],
    fiveW1H: {
      who: "Paid by the User; distributed to upline referrers, rewards pool, and platform fees.",
      what: "A fixed USD fee configured per Plan (e.g. $100).",
      where: "Defined as Plan.entryFee in the database. Deducted from User.tradingBalance.",
      when: "Charged at the exact moment the user clicks 'Activate Plan' inside the dashboard.",
      why: "To qualify the user for the plan's daily yields, enable stacking, and generate immediate commission flow for the referral structure.",
      how: "User activates plan -> system verifies balance >= Plan.entryFee -> deducts fee -> marks plan active for user -> pays upline commissions."
    }
  },
  investmentPlanFee: {
    name: "Investment Plan Fee (Trading Investment)",
    dbField: "Deposit.amount (Deposit model represents active investments)",
    purpose: "The actual trading capital placed by the user into the plan to participate in daily trades and generate variable/fixed yields.",
    relations: [
      "Funded from User.tradingBalance",
      "Subject to Daily Earning Cap limits",
      "Yield payout is computed as a percentage of this active investment amount"
    ],
    fiveW1H: {
      who: "Invested by the User from their remaining trading balance into the activated plan.",
      what: "The trading capital (must be within Plan.minDeposit and Plan.maxDeposit).",
      where: "Stored in Deposit table (status: 'active').",
      when: "Created when user enters an investment amount and submits it under an activated plan.",
      why: "To generate the trading profit yield, which is calculated daily based on this investment amount.",
      how: "User inputs investment amount -> system checks if plan is activated and amount is valid -> creates active Deposit record -> deducts from User.tradingBalance."
    }
  },
  dailyEarningCapValue: {
    name: "Daily Earning Cap Value",
    dbField: "Plan.dailyEarningCapPercent",
    purpose: "Stores the numerical configuration limit for the daily profit yield.",
    relations: [
      "Decided by Plan.cappingType (multiplier, percentage, or fixed)"
    ],
    fiveW1H: {
      who: "Configured by Admin in Plan Builder.",
      what: "A positive float representing multiplier factor, yield cap percentage, or fixed USD amount.",
      where: "Stored in Plan.dailyEarningCapPercent.",
      when: "Created/modified when editing plans in Admin Panel. Referenced during daily profit distribution.",
      why: "To prevent excessive daily payouts that could jeopardize platform stability and system sustainability.",
      how: "Admin edits plan -> selects capping mode and enters value -> value is stored as float -> backend checks this value during profit calculation."
    }
  },
  dailyEarningCapMode: {
    name: "Daily Earning Capping Mode",
    dbField: "Plan.cappingType",
    purpose: "Determines how the daily cap limit is calculated and applied to daily payouts.",
    relations: [
      "multiplier (X), percentage (%), or fixed ($)"
    ],
    fiveW1H: {
      who: "Configured by Admin in Plan Builder.",
      what: "Enum string: 'multiplier', 'percentage', 'fixed'.",
      where: "Stored in Plan.cappingType.",
      when: "Created/modified when editing plans in Admin Panel. Referenced during daily profit distribution.",
      why: "To provide flexibility to support diverse investment models (e.g. X times the Joining Fee, cap percentage, or fixed dollar amount limit).",
      how: "Admin selects capping mode -> system stores mode string -> distributor checks mode -> applies respective calculation formula."
    }
  },
  dailyYield: {
    name: "Daily Yield (Trading Profit)",
    dbField: "Plan.dailyEarningPercent / dailyPercent",
    purpose: "The interest/profit rate generated from the daily trading operations.",
    relations: [
      "Applied to Investment Plan Fee to compute payout amount",
      "Clamped by Daily Earning Cap limits"
    ],
    fiveW1H: {
      who: "Calculated by backend profit distributor based on plan volatility, risk settings, and bonus boosters.",
      what: "A percentage rate (e.g. 2.5%). Yield payout = Investment Amount * (dailyPercent / 100).",
      where: "Calculated in-memory during profit distribution and saved as PnL logs.",
      when: "Calculated and distributed daily or hourly according to the plan's return schedule.",
      why: "To pay the user their share of trading profits generated by the system.",
      how: "Distributor runs -> computes dailyPercent -> clamps based on cap mode/value -> computes profitAmount -> distributes profit splits."
    }
  },
  withdrawals: {
    name: "Withdrawals",
    dbField: "Withdrawal model",
    purpose: "Transferring user's earned profits from their withdrawal balance back to their external blockchain wallet.",
    relations: [
      "Deducted from User.withdrawalBalance",
      "Subject to withdrawal fee and daily limits"
    ],
    fiveW1H: {
      who: "Requested by the User, approved by Admin (or auto-approved based on configuration settings).",
      what: "A negative transaction deducting USD balance and sending crypto on-chain.",
      where: "Created in Withdrawal table. Decrements User.withdrawalBalance.",
      when: "Requested by user at any time (subject to lock periods or minimum withdrawal thresholds).",
      why: "To allow users to realize and withdraw their returns from the platform.",
      how: "User requests withdrawal -> system verifies User.withdrawalBalance >= amount -> deducts amount -> triggers admin review/gateway transaction."
    }
  }
};
