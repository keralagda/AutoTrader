import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default legal documents
const defaultDocs: Record<string, { title: string; content: string }> = {
  terms: {
    title: 'Terms of Service',
    content: `# Terms of Service

**Last Updated: May 2026**

## 1. Acceptance of Terms
By accessing and using BNFX ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.

## 2. Eligibility
- You must be at least 18 years old
- You must provide accurate registration information
- You must complete KYC verification for withdrawals above $500

## 3. Account Responsibilities
- You are responsible for maintaining the confidentiality of your account
- You must enable 2FA for enhanced security
- You must not share your account credentials

## 4. Investment Plans
- All investment plans carry inherent risk
- Past performance does not guarantee future results
- Returns are subject to market conditions
- The platform reserves the right to modify plan terms

## 5. Deposits & Withdrawals
- Minimum deposit amounts vary by plan
- Withdrawals are processed within 24-48 hours
- Withdrawal fees may apply based on amount and method
- KYC verification is required for withdrawals

## 6. Referral Program
- Referral bonuses are credited upon successful referral deposits
- Abuse of the referral system will result in account suspension
- Multi-level referral earnings are subject to platform rules

## 7. Prohibited Activities
- Money laundering or terrorist financing
- Using multiple accounts
- Exploiting platform bugs or vulnerabilities
- Automated trading bots without authorization

## 8. Limitation of Liability
The Platform is not liable for losses due to market volatility, technical issues, or force majeure events.

## 9. Termination
We reserve the right to suspend or terminate accounts that violate these terms.

## 10. Changes to Terms
We may update these terms at any time. Continued use constitutes acceptance.`,
  },
  privacy: {
    title: 'Privacy Policy',
    content: `# Privacy Policy

**Last Updated: May 2026**

## 1. Information We Collect
- **Personal Information**: Name, email, phone number
- **Identity Documents**: KYC documents (Aadhaar, PAN, Passport)
- **Financial Information**: Wallet addresses, transaction history
- **Technical Data**: IP address, device info, browser type

## 2. How We Use Your Information
- Account creation and management
- Processing transactions and withdrawals
- KYC verification and compliance
- Communication about account activity
- Platform improvement and analytics

## 3. Data Storage & Security
- All data is encrypted at rest and in transit
- We use industry-standard security measures
- Data is stored on secure cloud infrastructure
- Regular security audits are conducted

## 4. Data Sharing
We do not sell your personal data. We may share data with:
- Payment processors for transaction processing
- Regulatory authorities when required by law
- Service providers who assist platform operations

## 5. Your Rights
- Access your personal data
- Request data correction or deletion
- Opt out of marketing communications
- Export your data

## 6. Cookies & Tracking
- We use essential cookies for platform functionality
- Analytics cookies help improve user experience
- You can manage cookie preferences in your browser

## 7. Data Retention
- Account data is retained while your account is active
- Transaction records are kept for 7 years (regulatory requirement)
- Deleted accounts have data removed within 30 days

## 8. Contact
For privacy concerns, contact our support team through the platform.`,
  },
  risk: {
    title: 'Risk Disclosure',
    content: `# Risk Disclosure Statement

**Last Updated: May 2026**

## Important Notice
Trading and investing in cryptocurrency and digital assets involves substantial risk of loss. Please read this disclosure carefully.

## 1. Market Risk
- Cryptocurrency markets are highly volatile
- Values can fluctuate significantly in short periods
- You may lose some or all of your invested capital

## 2. Platform Risk
- Technical failures may temporarily prevent access
- Smart contract vulnerabilities may exist
- Network congestion may delay transactions

## 3. Regulatory Risk
- Cryptocurrency regulations vary by jurisdiction
- Future regulations may affect platform operations
- Tax obligations are the responsibility of the user

## 4. Liquidity Risk
- Withdrawal processing times may vary
- Large withdrawals may require additional verification
- Market conditions may affect withdrawal availability

## 5. No Guaranteed Returns
- Investment returns are not guaranteed
- Historical performance does not predict future results
- Daily earning percentages are targets, not guarantees

## 6. Recommendations
- Only invest what you can afford to lose
- Diversify your investments
- Enable all security features (2FA, strong passwords)
- Keep your own records of all transactions
- Consult a financial advisor before investing

## 7. Acknowledgment
By using BNFX, you acknowledge that:
- You understand the risks involved
- You are making investment decisions independently
- You accept full responsibility for your investment outcomes
- You have read and understood these risk disclosures`,
  },
}

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'terms'

    // Try to get from database settings
    const setting = await prisma.setting.findUnique({
      where: { key: `legal_${type}` },
    })

    if (setting) {
      return NextResponse.json(JSON.parse(setting.value))
    }

    // Return default
    const doc = defaultDocs[type]
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Legal docs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin can update legal documents
export async function PUT(req: NextRequest) {
  try {
    const { type, title, content } = await req.json()

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'type, title, and content are required' }, { status: 400 })
    }

    await prisma.setting.upsert({
      where: { key: `legal_${type}` },
      update: { value: JSON.stringify({ title, content }) },
      create: { key: `legal_${type}`, value: JSON.stringify({ title, content }) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Legal docs update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
