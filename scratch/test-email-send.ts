import fs from 'fs'
import path from 'path'

// Manually load env
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

import { sendEmail } from '../src/lib/email'

async function main() {
  console.log('Testing email delivery...')
  console.log('Env variables check:')
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing')
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
  console.log('GMAIL_USER:', process.env.GMAIL_USER)
  console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'Present' : 'Missing')

  const recipient = 'keralagda@gmail.com' // Send to the registered email address
  console.log(`Sending test email to ${recipient}...`)

  const success = await sendEmail({
    to: recipient,
    subject: 'BNFX Email Delivery Test 📧',
    html: `
      <h2>BNFX Email Delivery Test</h2>
      <p>This is a test email sent from the BNFX platform at ${new Date().toISOString()}</p>
      <p>If you received this, email delivery is working correctly!</p>
    `
  })

  console.log('Email delivery test result:', success ? 'SUCCESS ✅' : 'FAILED ❌')
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
