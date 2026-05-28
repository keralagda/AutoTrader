// ─── Roles & Permissions Matrix ────────────────────────────────────
// Defines what each role can do across the platform

export type Role = 'super_admin' | 'admin' | 'moderator' | 'support' | 'user'

export type PermissionModule =
  | 'users'
  | 'deposits'
  | 'withdrawals'
  | 'plans'
  | 'earnings'
  | 'challenges'
  | 'messages'
  | 'news'
  | 'notifications'
  | 'promotions'
  | 'testimonials'
  | 'templates'
  | 'settings'
  | 'kyc'
  | 'tickets'
  | 'analytics'
  | 'risk_categories'
  | 'referral_config'
  | 'cron'
  | 'geo_blocking'
  | 'fake_profiles'
  | 'landing_editor'
  | 'page_builder'
  | 'payment_gateways'
  | 'bulk_operations'
  | 'activity_log'
  | 'system_health'
  | 'contests'
  | 'media'

export type CrudAction = 'create' | 'read' | 'update' | 'delete'

export interface PermissionEntry {
  module: PermissionModule
  actions: CrudAction[]
}

export interface RoleDefinition {
  id: Role
  label: string
  description: string
  color: string
  level: number // Higher = more power (for hierarchy checks)
  permissions: PermissionEntry[]
}

// Default permission matrix
export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    description: 'Full unrestricted access to all platform features',
    color: '#ef4444',
    level: 100,
    permissions: [
      { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'deposits', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'withdrawals', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'plans', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'earnings', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'challenges', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'messages', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'news', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'notifications', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'promotions', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'testimonials', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'templates', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'settings', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'kyc', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'tickets', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'analytics', actions: ['read'] },
      { module: 'risk_categories', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'referral_config', actions: ['read', 'update'] },
      { module: 'cron', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'geo_blocking', actions: ['read', 'update'] },
      { module: 'fake_profiles', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'landing_editor', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'page_builder', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'payment_gateways', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'bulk_operations', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'activity_log', actions: ['read', 'delete'] },
      { module: 'system_health', actions: ['read'] },
      { module: 'contests', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'media', actions: ['create', 'read', 'delete'] },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Full management access except system settings and user deletion',
    color: '#f59e0b',
    level: 80,
    permissions: [
      { module: 'users', actions: ['create', 'read', 'update'] },
      { module: 'deposits', actions: ['read', 'update'] },
      { module: 'withdrawals', actions: ['read', 'update'] },
      { module: 'plans', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'earnings', actions: ['read', 'update'] },
      { module: 'challenges', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'messages', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'news', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'notifications', actions: ['create', 'read'] },
      { module: 'promotions', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'testimonials', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'templates', actions: ['create', 'read', 'update'] },
      { module: 'settings', actions: ['read', 'update'] },
      { module: 'kyc', actions: ['read', 'update'] },
      { module: 'tickets', actions: ['read', 'update'] },
      { module: 'analytics', actions: ['read'] },
      { module: 'risk_categories', actions: ['read', 'update'] },
      { module: 'referral_config', actions: ['read', 'update'] },
      { module: 'cron', actions: ['read', 'update'] },
      { module: 'geo_blocking', actions: ['read', 'update'] },
      { module: 'fake_profiles', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'landing_editor', actions: ['create', 'read', 'update'] },
      { module: 'page_builder', actions: ['create', 'read', 'update'] },
      { module: 'payment_gateways', actions: ['read', 'update'] },
      { module: 'bulk_operations', actions: ['read', 'update'] },
      { module: 'activity_log', actions: ['read'] },
      { module: 'system_health', actions: ['read'] },
      { module: 'contests', actions: ['create', 'read', 'update'] },
      { module: 'media', actions: ['create', 'read'] },
    ],
  },
  {
    id: 'moderator',
    label: 'Moderator',
    description: 'Content management, user moderation, and support',
    color: '#8b5cf6',
    level: 50,
    permissions: [
      { module: 'users', actions: ['read', 'update'] },
      { module: 'deposits', actions: ['read'] },
      { module: 'withdrawals', actions: ['read'] },
      { module: 'plans', actions: ['read'] },
      { module: 'earnings', actions: ['read'] },
      { module: 'challenges', actions: ['create', 'read', 'update'] },
      { module: 'messages', actions: ['create', 'read'] },
      { module: 'news', actions: ['create', 'read', 'update'] },
      { module: 'notifications', actions: ['create', 'read'] },
      { module: 'promotions', actions: ['read'] },
      { module: 'testimonials', actions: ['create', 'read', 'update'] },
      { module: 'kyc', actions: ['read', 'update'] },
      { module: 'tickets', actions: ['read', 'update'] },
      { module: 'analytics', actions: ['read'] },
      { module: 'fake_profiles', actions: ['create', 'read', 'update'] },
      { module: 'activity_log', actions: ['read'] },
      { module: 'contests', actions: ['read'] },
    ],
  },
  {
    id: 'support',
    label: 'Support Agent',
    description: 'Handle user tickets, KYC reviews, and basic user queries',
    color: '#06b6d4',
    level: 30,
    permissions: [
      { module: 'users', actions: ['read'] },
      { module: 'deposits', actions: ['read'] },
      { module: 'withdrawals', actions: ['read'] },
      { module: 'earnings', actions: ['read'] },
      { module: 'messages', actions: ['create', 'read'] },
      { module: 'kyc', actions: ['read', 'update'] },
      { module: 'tickets', actions: ['read', 'update'] },
      { module: 'notifications', actions: ['create', 'read'] },
      { module: 'activity_log', actions: ['read'] },
    ],
  },
  {
    id: 'user',
    label: 'User',
    description: 'Standard platform user with investment access',
    color: '#6b7280',
    level: 0,
    permissions: [], // Users don't access admin panel
  },
]

// All available modules with labels
export const PERMISSION_MODULES: { id: PermissionModule; label: string; category: string }[] = [
  // User Management
  { id: 'users', label: 'User Management', category: 'Users' },
  { id: 'kyc', label: 'KYC Verification', category: 'Users' },
  { id: 'risk_categories', label: 'Risk Categories', category: 'Users' },
  // Finance
  { id: 'deposits', label: 'Deposits', category: 'Finance' },
  { id: 'withdrawals', label: 'Withdrawals', category: 'Finance' },
  { id: 'earnings', label: 'Earnings', category: 'Finance' },
  { id: 'plans', label: 'Investment Plans', category: 'Finance' },
  { id: 'payment_gateways', label: 'Payment Gateways', category: 'Finance' },
  // Content
  { id: 'messages', label: 'Messages', category: 'Content' },
  { id: 'news', label: 'News', category: 'Content' },
  { id: 'notifications', label: 'Notifications', category: 'Content' },
  { id: 'promotions', label: 'Promotions', category: 'Content' },
  { id: 'testimonials', label: 'Testimonials', category: 'Content' },
  { id: 'challenges', label: 'Challenges', category: 'Content' },
  { id: 'contests', label: 'Contests', category: 'Content' },
  // Platform
  { id: 'templates', label: 'Templates', category: 'Platform' },
  { id: 'settings', label: 'Settings', category: 'Platform' },
  { id: 'landing_editor', label: 'Landing Editor', category: 'Platform' },
  { id: 'page_builder', label: 'Page Builder', category: 'Platform' },
  { id: 'fake_profiles', label: 'Fake Profiles', category: 'Platform' },
  { id: 'media', label: 'Media', category: 'Platform' },
  // System
  { id: 'referral_config', label: 'Referral Config', category: 'System' },
  { id: 'cron', label: 'Cron Jobs', category: 'System' },
  { id: 'geo_blocking', label: 'Geo Blocking', category: 'System' },
  { id: 'bulk_operations', label: 'Bulk Operations', category: 'System' },
  { id: 'activity_log', label: 'Activity Log', category: 'System' },
  { id: 'system_health', label: 'System Health', category: 'System' },
  { id: 'analytics', label: 'Analytics', category: 'System' },
  { id: 'tickets', label: 'Support Tickets', category: 'System' },
]

// Helper: Check if a role has permission for a specific action on a module
export function hasPermission(
  roles: RoleDefinition[],
  roleId: string,
  module: PermissionModule,
  action: CrudAction
): boolean {
  // super_admin always has access
  if (roleId === 'super_admin') return true

  const role = roles.find(r => r.id === roleId)
  if (!role) return false

  const perm = role.permissions.find(p => p.module === module)
  if (!perm) return false

  return perm.actions.includes(action)
}

// Helper: Check if role A can manage role B (hierarchy)
export function canManageRole(roles: RoleDefinition[], managerRoleId: string, targetRoleId: string): boolean {
  const manager = roles.find(r => r.id === managerRoleId)
  const target = roles.find(r => r.id === targetRoleId)
  if (!manager || !target) return false
  return manager.level > target.level
}

// Helper: Get all admin-level roles (level > 0)
export function getAdminRoles(roles: RoleDefinition[]): RoleDefinition[] {
  return roles.filter(r => r.level > 0)
}
