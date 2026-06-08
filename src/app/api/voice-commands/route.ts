import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default commands definition
const DEFAULT_COMMANDS = [
  {
    id: "vcmd_1",
    keywords: ["home", "landing", "main"],
    actionType: "navigation",
    view: "landing",
    hash: "",
    feedbackText: "Navigating to home page",
    requiredRole: "public",
    isActive: true,
    description: "Go to public home page"
  },
  {
    id: "vcmd_2",
    keywords: ["features", "pillars", "about"],
    actionType: "navigation",
    view: "landing",
    hash: "#features",
    feedbackText: "Scrolling to platform features",
    requiredRole: "public",
    isActive: true,
    description: "Scroll to features section"
  },
  {
    id: "vcmd_3",
    keywords: ["calculator", "returns engine", "yields calculator"],
    actionType: "navigation",
    view: "landing",
    hash: "#calculator",
    feedbackText: "Scrolling to return calculator",
    requiredRole: "public",
    isActive: true,
    description: "Scroll to earnings calculator"
  },
  {
    id: "vcmd_4",
    keywords: ["login", "sign in", "sign-in"],
    actionType: "auth_modal",
    authMode: "login",
    feedbackText: "Opening sign in modal",
    requiredRole: "public",
    isActive: true,
    description: "Open login dialog"
  },
  {
    id: "vcmd_5",
    keywords: ["register", "sign up", "create account", "sign-up"],
    actionType: "auth_modal",
    authMode: "register",
    feedbackText: "Opening sign up modal",
    requiredRole: "public",
    isActive: true,
    description: "Open registration dialog"
  },
  {
    id: "vcmd_6",
    keywords: ["withdraw", "payout", "cashout", "cash out"],
    actionType: "navigation",
    view: "dashboard",
    dashboardTab: "withdraw",
    feedbackText: "Navigating to withdrawals",
    requiredRole: "user",
    isActive: true,
    description: "Navigate to withdrawal tab"
  },
  {
    id: "vcmd_7",
    keywords: ["deposit", "invest", "add money", "fund account"],
    actionType: "navigation",
    view: "dashboard",
    dashboardTab: "deposit",
    feedbackText: "Navigating to deposits",
    requiredRole: "user",
    isActive: true,
    description: "Navigate to deposit tab"
  },
  {
    id: "vcmd_8",
    keywords: ["transfer", "p2p", "send money"],
    actionType: "navigation",
    view: "dashboard",
    dashboardTab: "transactions",
    feedbackText: "Navigating to transfer tab",
    requiredRole: "user",
    isActive: true,
    description: "Navigate to transactions transfer"
  },
  {
    id: "vcmd_9",
    keywords: ["security", "pin", "credentials", "two factor"],
    actionType: "navigation",
    view: "dashboard",
    dashboardTab: "security",
    feedbackText: "Navigating to security settings",
    requiredRole: "user",
    isActive: true,
    description: "Navigate to security profile settings"
  },
  {
    id: "vcmd_10",
    keywords: ["referrals", "affiliate", "matrix", "downline"],
    actionType: "navigation",
    view: "dashboard",
    dashboardTab: "team",
    feedbackText: "Navigating to affiliate matrix",
    requiredRole: "user",
    isActive: true,
    description: "Navigate to affiliate matrix tab"
  },
  {
    id: "vcmd_11",
    keywords: ["plans", "active plans", "packages"],
    actionType: "navigation",
    view: "dashboard",
    dashboardTab: "investment",
    feedbackText: "Navigating to your active plans",
    requiredRole: "user",
    isActive: true,
    description: "Navigate to active investment plans"
  },
  {
    id: "vcmd_12",
    keywords: ["dashboard", "overview", "main screen", "stats"],
    actionType: "navigation",
    view: "dashboard",
    dashboardTab: "overview",
    feedbackText: "Navigating to user dashboard overview",
    requiredRole: "user",
    isActive: true,
    description: "Navigate to dashboard overview"
  },
  {
    id: "vcmd_13",
    keywords: ["admin", "control hub", "control-hub", "management"],
    actionType: "navigation",
    view: "admin",
    adminTab: "plans",
    feedbackText: "Navigating to admin control hub",
    requiredRole: "admin",
    isActive: true,
    description: "Navigate to admin control hub"
  },
  {
    id: "vcmd_14",
    keywords: ["users list", "users", "manage users", "accounts list"],
    actionType: "navigation",
    view: "admin",
    adminTab: "users",
    feedbackText: "Navigating to user accounts manager",
    requiredRole: "admin",
    isActive: true,
    description: "Navigate to admin user manager"
  },
  {
    id: "vcmd_15",
    keywords: ["manage plans", "plan config", "plans builder"],
    actionType: "navigation",
    view: "admin",
    adminTab: "plans",
    feedbackText: "Navigating to plan builder configuration",
    requiredRole: "admin",
    isActive: true,
    description: "Navigate to admin plan config"
  },
  {
    id: "vcmd_16",
    keywords: ["system logic", "logic builder", "rules builder"],
    actionType: "navigation",
    view: "admin",
    adminTab: "logicBuilder",
    feedbackText: "Navigating to system conditional logic builder",
    requiredRole: "admin",
    isActive: true,
    description: "Navigate to admin logic builder"
  },
  {
    id: "vcmd_17",
    keywords: ["templates", "landing templates", "page templates"],
    actionType: "navigation",
    view: "admin",
    adminTab: "templates",
    feedbackText: "Navigating to landing page layout templates",
    requiredRole: "admin",
    isActive: true,
    description: "Navigate to admin templates"
  },
  {
    id: "vcmd_18",
    keywords: ["bot", "telegram bot", "telegram settings"],
    actionType: "navigation",
    view: "admin",
    adminTab: "chatbot",
    feedbackText: "Navigating to telegram bot builder",
    requiredRole: "admin",
    isActive: true,
    description: "Navigate to admin telegram bot builder"
  },
  {
    id: "vcmd_19",
    keywords: ["voice settings", "voice control", "commands config"],
    actionType: "navigation",
    view: "admin",
    adminTab: "voiceNavigation",
    feedbackText: "Navigating to voice navigation management panel",
    requiredRole: "admin",
    isActive: true,
    description: "Navigate to admin voice navigation manager"
  },
  {
    id: "vcmd_20",
    keywords: ["pdf builder", "pdf generator", "flyer design"],
    actionType: "navigation",
    view: "admin",
    adminTab: "pdfBuilder",
    feedbackText: "Navigating to platform PDF document builder",
    requiredRole: "admin",
    isActive: true,
    description: "Navigate to admin PDF document designer"
  }
]

const DEFAULT_SETTINGS = {
  enabled: true,
  rate: 1.0,
  pitch: 1.0,
  triggerKey: "v"
}

async function checkDb() {
  await db.$queryRaw`SELECT 1`
}

export async function GET() {
  try {
    await checkDb()
  } catch (dbError) {
    return NextResponse.json({
      error: 'Database connection failed',
      diagnosticTrace: {
        message: 'Failed to connect to the database container or host.',
        actions: ['Check DB Container Status', 'Verify Network Bridge', 'Validate .env mapping'],
        originalError: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }, { status: 503 })
  }

  try {
    // Read command configuration
    let commandsSetting = await db.setting.findUnique({
      where: { key: 'voice_navigation_commands' }
    })
    
    // Read voice parameters
    let settingsSetting = await db.setting.findUnique({
      where: { key: 'voice_navigation_settings' }
    })

    let commands = DEFAULT_COMMANDS
    let settings = DEFAULT_SETTINGS

    // If database keys don't exist, seed them automatically
    if (!commandsSetting) {
      commandsSetting = await db.setting.create({
        data: {
          key: 'voice_navigation_commands',
          value: JSON.stringify(DEFAULT_COMMANDS)
        }
      })
    } else {
      commands = JSON.parse(commandsSetting.value)
    }

    if (!settingsSetting) {
      settingsSetting = await db.setting.create({
        data: {
          key: 'voice_navigation_settings',
          value: JSON.stringify(DEFAULT_SETTINGS)
        }
      })
    } else {
      settings = JSON.parse(settingsSetting.value)
    }

    return NextResponse.json({
      success: true,
      commands: commands.filter((c: any) => c.isActive),
      settings
    })
  } catch (err) {
    console.error('Error fetching voice commands:', err)
    return NextResponse.json({
      success: false,
      commands: DEFAULT_COMMANDS,
      settings: DEFAULT_SETTINGS
    })
  }
}
