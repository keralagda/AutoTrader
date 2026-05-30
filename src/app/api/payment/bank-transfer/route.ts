import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Major EU/US banks for deposit
const SUPPORTED_BANKS = {
  us: [
    { id: 'chase', name: 'JPMorgan Chase', swift: 'CHASUS33', country: 'US', flag: '🇺🇸' },
    { id: 'bofa', name: 'Bank of America', swift: 'BOFAUS3N', country: 'US', flag: '🇺🇸' },
    { id: 'wells', name: 'Wells Fargo', swift: 'WFBIUS6S', country: 'US', flag: '🇺🇸' },
    { id: 'citi', name: 'Citibank', swift: 'CITIUS33', country: 'US', flag: '🇺🇸' },
    { id: 'usbank', name: 'U.S. Bank', swift: 'USBKUS44', country: 'US', flag: '🇺🇸' },
    { id: 'pnc', name: 'PNC Bank', swift: 'PNCCUS33', country: 'US', flag: '🇺🇸' },
    { id: 'capital', name: 'Capital One', swift: 'HIBKUS3N', country: 'US', flag: '🇺🇸' },
  ],
  eu: [
    { id: 'deutsche', name: 'Deutsche Bank', swift: 'DEUTDEFF', country: 'DE', flag: '🇩🇪' },
    { id: 'bnp', name: 'BNP Paribas', swift: 'BNPAFRPP', country: 'FR', flag: '🇫🇷' },
    { id: 'ing', name: 'ING Bank', swift: 'INGBNL2A', country: 'NL', flag: '🇳🇱' },
    { id: 'hsbc_uk', name: 'HSBC UK', swift: 'HBUKGB4B', country: 'GB', flag: '🇬🇧' },
    { id: 'barclays', name: 'Barclays', swift: 'BARCGB22', country: 'GB', flag: '🇬🇧' },
    { id: 'santander', name: 'Santander', swift: 'BSCHESMM', country: 'ES', flag: '🇪🇸' },
    { id: 'unicredit', name: 'UniCredit', swift: 'UNCRITMM', country: 'IT', flag: '🇮🇹' },
    { id: 'societe', name: 'Société Générale', swift: 'SOGEFRPP', country: 'FR', flag: '🇫🇷' },
    { id: 'rabobank', name: 'Rabobank', swift: 'RABONL2U', country: 'NL', flag: '🇳🇱' },
    { id: 'commerzbank', name: 'Commerzbank', swift: 'COBADEFF', country: 'DE', flag: '🇩🇪' },
    { id: 'revolut', name: 'Revolut', swift: 'REVOGB21', country: 'GB', flag: '🇬🇧' },
    { id: 'n26', name: 'N26', swift: 'NTSBDEB1', country: 'DE', flag: '🇩🇪' },
    { id: 'wise', name: 'Wise (TransferWise)', swift: 'TRWIBEB1', country: 'BE', flag: '🇧🇪' },
  ],
}

// Submit bank transfer deposit request
export async function POST(req: NextRequest) {
  try {
    const { userId, amount, referenceNumber, bankName, senderName, senderIban, screenshotUrl } = await req.json()

    if (!userId || !amount || !referenceNumber) {
      return NextResponse.json({ error: 'userId, amount, and referenceNumber are required' }, { status: 400 })
    }

    const depositAmount = parseFloat(amount)
    if (isNaN(depositAmount) || depositAmount < 10) {
      return NextResponse.json({ error: 'Minimum deposit is $10' }, { status: 400 })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: depositAmount,
        method: 'bank_transfer',
        status: 'pending',
        upiRef: referenceNumber,
        gatewayRef: JSON.stringify({
          bankName: bankName || '',
          senderName: senderName || '',
          senderIban: senderIban || '',
          screenshotUrl: screenshotUrl || '',
          type: 'eu_us_wire',
        }),
      },
    })

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'super_admin'] } } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Wire Transfer Deposit',
          message: `Wire transfer of $${depositAmount.toFixed(2)} from ${bankName || 'Unknown Bank'} (Ref: ${referenceNumber})`,
          type: 'info',
        },
      })
    }

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Wire Transfer Submitted',
        message: `Your wire transfer of $${depositAmount.toFixed(2)} is pending verification. Reference: ${referenceNumber}. Processing time: 1-3 business days.`,
        type: 'info',
      },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'wire_transfer_submitted',
        details: JSON.stringify({ amount: depositAmount, referenceNumber, bankName, paymentId: payment.id }),
      },
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: 'Wire transfer submitted. Processing time: 1-3 business days.',
    })
  } catch (error) {
    console.error('Bank transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get bank transfer details and supported banks
export async function GET() {
  try {
    // Get platform receiving bank details from settings
    const bankDetails = await prisma.setting.findUnique({
      where: { key: 'bank_transfer_details' },
    })

    const defaultDetails = {
      region: 'eu',
      bankName: 'Deutsche Bank',
      accountHolder: 'Black Nova FX Ltd',
      iban: 'DE89 3704 0044 0532 0130 00',
      swift: 'DEUTDEFF',
      routingNumber: '',
      accountNumber: '',
      reference: 'BNFX-{USER_ID}',
      notes: 'Include your BNFX user ID in the transfer reference. Processing: 1-3 business days.',
    }

    return NextResponse.json({
      receivingBank: bankDetails ? JSON.parse(bankDetails.value) : defaultDetails,
      supportedBanks: SUPPORTED_BANKS,
    })
  } catch (error) {
    console.error('Bank transfer GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
