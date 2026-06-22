import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'

try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    for (const line of envConfig.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let value = (match[2] || '').trim()
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1)
        }
        process.env[key] = value
      }
    }
  }
} catch (e) {
  console.error('Error loading .env manually:', e)
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = process.env.EMAIL_FROM || 'BNFX <onboarding@resend.dev>'
const GMAIL_USER = process.env.GMAIL_USER || ''
const GMAIL_PASS = process.env.GMAIL_PASS || ''

async function testGmail(to: string) {
  console.log('\n--- Testing Gmail SMTP ---')
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.log('Gmail credentials missing.')
    return
  }
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    })
    const finalFrom = FROM_EMAIL.includes('<') && FROM_EMAIL.includes(GMAIL_USER)
      ? FROM_EMAIL 
      : `BNFX <${GMAIL_USER}>`
    
    console.log(`Sending via Gmail SMTP from ${finalFrom} to ${to}...`)
    const info = await transporter.sendMail({
      from: finalFrom,
      to,
      subject: 'Gmail SMTP Test',
      html: '<p>Test from Gmail SMTP</p>'
    })
    console.log('Gmail SMTP Success:', info)
  } catch (err: any) {
    console.error('Gmail SMTP Failed:', err.message, err.code || '')
  }
}

async function testResend(to: string) {
  console.log('\n--- Testing Resend API ---')
  if (!RESEND_API_KEY) {
    console.log('Resend API key missing.')
    return
  }
  try {
    console.log(`Sending via Resend from ${FROM_EMAIL} to ${to}...`)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: 'Resend API Test',
        html: '<p>Test from Resend API</p>'
      })
    })
    const data = await res.json()
    console.log(`Resend HTTP status: ${res.status}`)
    console.log('Resend Response:', data)
  } catch (err: any) {
    console.error('Resend API Failed:', err.message)
  }
}

async function main() {
  const target = 'williamblerk69@gmail.com'
  await testGmail(target)
  await testResend(target)
}

main().catch(console.error)
