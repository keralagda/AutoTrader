import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return new NextResponse('<h1>Invalid Verification Token</h1>', {
        headers: { 'content-type': 'text/html' }
      })
    }

    const user = await db.user.findFirst({
      where: { emailVerificationToken: token }
    })

    if (!user) {
      return new NextResponse('<h1>Verification Link Expired or Invalid</h1>', {
        headers: { 'content-type': 'text/html' }
      })
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    })

    // Premium themed verification success landing page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified - BNFX</title>
        <style>
          body { 
            background: #0a0a0a; 
            color: #fff; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            background-image: radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
          }
          .card { 
            background: rgba(26, 26, 26, 0.8); 
            backdrop-filter: blur(12px);
            border: 1px solid rgba(16, 185, 129, 0.2); 
            padding: 40px; 
            border-radius: 16px; 
            text-align: center; 
            max-width: 420px; 
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.1);
          }
          .icon-container {
            width: 72px;
            height: 72px;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
          .icon {
            font-size: 36px;
            color: #10b981;
          }
          h1 { 
            color: #fff; 
            margin: 0 0 12px;
            font-size: 24px;
            font-weight: 700;
          }
          p { 
            color: #a3a3a3; 
            line-height: 1.6; 
            margin: 0 0 30px;
            font-size: 14px;
          }
          .btn { 
            display: block; 
            background: linear-gradient(135deg, #059669 0%, #10b981 100%); 
            color: #fff; 
            padding: 14px 30px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 600; 
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
          }
          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-container">
            <span class="icon">✓</span>
          </div>
          <h1>Email Verified Successfully</h1>
          <p>Hi ${user.name}, your email address has been verified. You can now access all trading features and plans on your dashboard.</p>
          <a class="btn" href="${appUrl}/dashboard">Go to Dashboard</a>
        </div>
      </body>
      </html>
    `
    return new NextResponse(successHtml, {
      headers: { 'content-type': 'text/html' }
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return new NextResponse('<h1>Verification Failed</h1>', {
      headers: { 'content-type': 'text/html' }
    })
  }
}
