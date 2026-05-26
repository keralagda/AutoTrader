import { NextRequest, NextResponse } from 'next/server'

// Returns the user's country based on Vercel's geo headers
export async function GET(req: NextRequest) {
  // Vercel automatically adds geo headers
  const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || ''
  const city = req.headers.get('x-vercel-ip-city') || ''
  const region = req.headers.get('x-vercel-ip-country-region') || ''

  return NextResponse.json({
    country: country || 'US',
    city: city || '',
    region: region || '',
  })
}
