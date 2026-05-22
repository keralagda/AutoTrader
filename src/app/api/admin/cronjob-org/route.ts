import { NextRequest, NextResponse } from 'next/server'

const CRONJOB_API_URL = 'https://api.cron-job.org'
const CRONJOB_API_KEY = process.env.CRONJOB_API_KEY || ''

async function cronjobFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${CRONJOB_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${CRONJOB_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return res
}

// GET - List all cron jobs from cron-job.org
export async function GET() {
  try {
    if (!CRONJOB_API_KEY) {
      return NextResponse.json({ error: 'CRONJOB_API_KEY not configured' }, { status: 500 })
    }

    const res = await cronjobFetch('/jobs')
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `cron-job.org API error: ${res.status}`, details: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('cron-job.org GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch cron jobs' }, { status: 500 })
  }
}

// POST - Create or update a cron job on cron-job.org
export async function POST(req: NextRequest) {
  try {
    if (!CRONJOB_API_KEY) {
      return NextResponse.json({ error: 'CRONJOB_API_KEY not configured' }, { status: 500 })
    }

    const body = await req.json()
    const { action, jobId, schedule, title, url, enabled } = body

    if (action === 'create') {
      // Create a new cron job
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const cronSecret = process.env.CRON_SECRET || 'autotrade-cron-2026'

      const jobUrl = url || `${appUrl}/api/cron/distribute-profits`

      // Parse schedule (cron-job.org uses their own format)
      // Default: every hour
      const jobData = {
        job: {
          url: jobUrl,
          title: title || 'Auto Trade - Profit Distribution',
          enabled: enabled !== false,
          saveResponses: true,
          schedule: schedule || {
            timezone: 'Asia/Kolkata',
            hours: [-1], // Every hour
            mdays: [-1], // Every day
            minutes: [0], // At minute 0
            months: [-1], // Every month
            wdays: [-1], // Every weekday
          },
          requestMethod: 1, // POST
          extendedData: {
            headers: {
              'x-cron-secret': cronSecret,
              'Content-Type': 'application/json',
            },
          },
        },
      }

      const res = await cronjobFetch('/jobs', {
        method: 'PUT',
        body: JSON.stringify(jobData),
      })

      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: `Failed to create job: ${res.status}`, details: text }, { status: res.status })
      }

      const data = await res.json()
      return NextResponse.json({ success: true, job: data })
    }

    if (action === 'update' && jobId) {
      // Update existing job
      const jobData: any = { job: {} }
      if (enabled !== undefined) jobData.job.enabled = enabled
      if (title) jobData.job.title = title
      if (url) jobData.job.url = url
      if (schedule) jobData.job.schedule = schedule

      const res = await cronjobFetch(`/jobs/${jobId}`, {
        method: 'PATCH',
        body: JSON.stringify(jobData),
      })

      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: `Failed to update job: ${res.status}`, details: text }, { status: res.status })
      }

      const data = await res.json()
      return NextResponse.json({ success: true, job: data })
    }

    if (action === 'delete' && jobId) {
      const res = await cronjobFetch(`/jobs/${jobId}`, { method: 'DELETE' })

      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: `Failed to delete job: ${res.status}`, details: text }, { status: res.status })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'history' && jobId) {
      const res = await cronjobFetch(`/jobs/${jobId}/history`)

      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: `Failed to get history: ${res.status}`, details: text }, { status: res.status })
      }

      const data = await res.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Invalid action. Use: create, update, delete, history' }, { status: 400 })
  } catch (error) {
    console.error('cron-job.org POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
