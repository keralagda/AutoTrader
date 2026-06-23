import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// ==========================================
// 1. Zod Schema Specifications
// ==========================================

const MetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['actual', 'inferred', 'proposed', 'deprecated', 'mismatch']),
  granularity: z.enum(['campaign-level', 'platform-level', 'feature-level', 'request-level', 'module-level']),
  who: z.enum(['admin', 'system', 'agent']),
  promptId: z.string().optional(),
  requestId: z.string().optional(),
  sourceFile: z.string().optional(),
  origin: z.enum(['inferred', 'parsed']),
})

const RequestRegistrySchema = z.object({
  registry: z.literal('Request Registry'),
  version: z.string(),
  description: z.string(),
  requests: z.array(
    MetadataSchema.extend({
      rawRequest: z.string(),
      normalizedBrief: z.string(),
      intentSummary: z.string(),
      classification: z.string(),
      businessType: z.string(),
      complexity: z.enum(['low', 'medium', 'high']),
      priority: z.enum(['low', 'medium', 'critical']),
      referencesAttached: z.array(z.string()),
    })
  ),
})

const PromptRegistrySchema = z.object({
  registry: z.literal('Prompt Registry'),
  version: z.string(),
  description: z.string(),
  prompts: z.array(
    MetadataSchema.extend({
      initialPrompt: z.string(),
      refinedPrompt: z.string(),
      fullPrompt: z.string(),
      halfPrompt: z.string(),
      slicedPrompts: z.array(z.string()),
      promptLineage: z.string(),
      promptVersion: z.string(),
      producedArtifacts: z.array(z.string()),
    })
  ),
})

const SliceRegistrySchema = z.object({
  registry: z.literal('Slice Registry'),
  version: z.string(),
  description: z.string(),
  slices: z.array(
    MetadataSchema.extend({
      sliceType: z.string(),
      parent: z.string().nullable(),
      children: z.array(z.string()),
      dependencies: z.array(z.string()),
      priority: z.string(),
      refinementState: z.string(),
      linkedFeatures: z.array(z.string()),
      linkedEntities: z.array(z.string()),
      linkedUI: z.array(z.string()),
    })
  ),
})

const OutcomeRegistrySchema = z.object({
  registry: z.literal('Outcome Registry'),
  version: z.string(),
  description: z.string(),
  outcomes: z.array(
    MetadataSchema.extend({
      generatedOutcomes: z.array(z.string()),
      selectedOutcome: z.string(),
      rejectedOutcomes: z.array(
        z.object({
          id: z.string(),
          reason: z.string(),
        })
      ),
      reuseTags: z.array(z.string()),
    })
  ),
})

const FeatureRegistrySchema = z.object({
  registry: z.literal('Feature Registry'),
  version: z.string(),
  description: z.string(),
  features: z.array(
    MetadataSchema.extend({
      definitions: z.array(z.string()),
      featureFlags: z.array(z.string()),
      rolloutStage: z.string(),
      dependencies: z.array(z.string()),
      businessValue: z.string(),
      affectedModules: z.array(z.string()),
    })
  ),
})

const ModuleRegistrySchema = z.object({
  registry: z.literal('Module Registry'),
  version: z.string(),
  description: z.string(),
  modules: z.array(
    MetadataSchema.extend({
      submodules: z.array(z.string()),
      ownership: z.string(),
      dependencies: z.array(z.string()),
      linkedScreens: z.array(z.string()),
      linkedWorkflows: z.array(z.string()),
      linkedServices: z.array(z.string()),
    })
  ),
})

const EntityRegistrySchema = z.object({
  registry: z.literal('Entity Registry'),
  version: z.string(),
  description: z.string(),
  entities: z.array(
    MetadataSchema.extend({
      table: z.string(),
      fields: z.record(z.string(), z.string()),
      relations: z.record(z.string(), z.string()),
      indexes: z.array(z.string()),
      validations: z.array(z.string()),
      permissions: z.array(z.string()),
      moduleUsage: z.array(z.string()),
    })
  ),
})

const WorkflowRegistrySchema = z.object({
  registry: z.literal('Workflow Registry'),
  version: z.string(),
  description: z.string(),
  workflows: z.array(
    MetadataSchema.extend({
      triggers: z.array(z.string()),
      stateTransitions: z.array(z.string()),
      cronRules: z.array(z.string()),
      dependencies: z.array(z.string()),
      edgeCases: z.array(z.string()),
    })
  ),
})

const UIRegistrySchema = z.object({
  registry: z.literal('UI Registry'),
  version: z.string(),
  description: z.string(),
  interfaces: z.array(
    MetadataSchema.extend({
      layouts: z.array(z.string()),
      components: z.array(z.string()),
      blocks: z.array(z.string()),
      navSystems: z.array(z.string()),
      forms: z.array(z.string()),
      widgets: z.array(z.string()),
      stateOwnership: z.string(),
      visibilityRules: z.array(z.string()),
    })
  ),
})

const RuleLogicRegistrySchema = z.object({
  registry: z.literal('Rule / Logic Registry'),
  version: z.string(),
  description: z.string(),
  rules: z.array(
    MetadataSchema.extend({
      formulas: z.array(z.string()),
      eligibilityLogic: z.array(z.string()),
      edgeCaseRules: z.array(z.string()),
      validationRules: z.array(z.string()),
      aiInstructions: z.array(z.string()),
    })
  ),
})

const ReferenceRegistrySchema = z.object({
  registry: z.literal('Reference Registry'),
  version: z.string(),
  description: z.string(),
  references: z.array(
    MetadataSchema.extend({
      links: z.array(z.string()),
      screenshots: z.array(z.string()),
      pdfs: z.array(z.string()),
      examples: z.array(z.string()),
      benchmarks: z.array(z.string()),
      moodboards: z.array(z.string()),
      influencedSlices: z.array(z.string()),
      influencedFeatures: z.array(z.string()),
    })
  ),
})

const AuditRegistrySchema = z.object({
  registry: z.literal('Runtime / Audit Registry'),
  version: z.string(),
  description: z.string(),
  audits: z.array(
    MetadataSchema.extend({
      generationLogs: z.array(z.string()),
      qaFindings: z.array(z.string()),
      changeHistory: z.array(z.string()),
      driftAlerts: z.array(z.string()),
      releaseSnapshots: z.array(z.string()),
      migrationNotes: z.array(z.string()),
    })
  ),
})

const PROJECT_ROOT = process.cwd()
const REGISTRY_DIR = path.join(PROJECT_ROOT, 'registry')

// ==========================================
// 2. Main Executable Functions
// ==========================================

function getRegistryPath(filename: string): string {
  return path.join(PROJECT_ROOT, 'registry', filename)
}

function loadJSON(filepath: string): any {
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`)
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'))
}

function saveJSON(filepath: string, data: any): void {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Commands: validate
 */
export function validateRegistries(): boolean {
  console.log('--- RUNNING SCHEMA VALIDATION ---')
  const registries = [
    { file: 'request_registry.json', schema: RequestRegistrySchema },
    { file: 'prompt_registry.json', schema: PromptRegistrySchema },
    { file: 'slice_registry.json', schema: SliceRegistrySchema },
    { file: 'outcome_registry.json', schema: OutcomeRegistrySchema },
    { file: 'feature_registry.json', schema: FeatureRegistrySchema },
    { file: 'module_registry.json', schema: ModuleRegistrySchema },
    { file: 'entity_registry.json', schema: EntityRegistrySchema },
    { file: 'workflow_registry.json', schema: WorkflowRegistrySchema },
    { file: 'ui_registry.json', schema: UIRegistrySchema },
    { file: 'logic_registry.json', schema: RuleLogicRegistrySchema },
    { file: 'reference_registry.json', schema: ReferenceRegistrySchema },
    { file: 'audit_registry.json', schema: AuditRegistrySchema },
  ]

  let allValid = true
  for (const reg of registries) {
    const p = getRegistryPath(reg.file)
    try {
      const data = loadJSON(p)
      const parsed = reg.schema.safeParse(data)
      if (parsed.success) {
        console.log(`✅ [VALID] ${reg.file}`)
      } else {
        allValid = false
        console.error(`❌ [INVALID] ${reg.file}`)
        console.error(JSON.stringify(parsed.error.flatten(), null, 2))
      }
    } catch (e: any) {
      allValid = false
      console.error(`❌ [ERROR LOAD/PARSE] ${reg.file}: ${e.message}`)
    }
  }
  return allValid
}

/**
 * Commands: detect-drift
 */
export function detectDrift(): void {
  console.log('\n--- DETECTING ARCHITECTURAL DRIFT ---')
  const driftAlerts: string[] = []

  // 1. Prisma Schema vs Entity Registry Check
  const prismaPath = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma')
  const entityRegPath = getRegistryPath('entity_registry.json')
  
  if (fs.existsSync(prismaPath) && fs.existsSync(entityRegPath)) {
    const prismaContent = fs.readFileSync(prismaPath, 'utf-8')
    const entityReg = loadJSON(entityRegPath)
    
    // Parse prisma models using simple RegExp
    const modelBlocks: { name: string; fields: Record<string, string> }[] = []
    const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g
    let match
    
    while ((match = modelRegex.exec(prismaContent)) !== null) {
      const modelName = match[1]
      const body = match[2]
      const fields: Record<string, string> = {}
      
      const lines = body.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('//') || trimmed === '' || trimmed.startsWith('@@')) continue
        const tokens = trimmed.split(/\s+/)
        if (tokens.length >= 2) {
          const fName = tokens[0]
          const fType = tokens[1]
          fields[fName] = fType
        }
      }
      modelBlocks.push({ name: modelName, fields })
    }

    // Compare with entity registry
    let registryModified = false
    for (const entity of entityReg.entities) {
      const dbModel = modelBlocks.find(m => m.name.toLowerCase() === entity.table.toLowerCase())
      
      if (!dbModel) {
        if (entity.status !== 'mismatch') {
          entity.status = 'mismatch'
          registryModified = true
          const alert = `Drift: Model ${entity.table} declared in Entity Registry is missing from prisma/schema.prisma`
          driftAlerts.push(alert)
          console.warn(`⚠️ ${alert}`)
        }
      } else {
        // Model matches. Compare fields.
        let hasFieldMismatch = false
        const fields = entity.fields as Record<string, string>
        for (const [fName, fType] of Object.entries(fields)) {
          const prismaFieldType = dbModel.fields[fName]
          if (!prismaFieldType) {
            hasFieldMismatch = true
            const alert = `Drift: Field '${fName}' in Entity '${entity.name}' is missing in Prisma Model.`
            driftAlerts.push(alert)
            console.warn(`⚠️ ${alert}`)
          } else {
            // Basic type matching check
            const regTypeLower = fType.toLowerCase()
            const prismaTypeLower = prismaFieldType.toLowerCase()
            let matches = false
            if (regTypeLower.includes('string') && prismaTypeLower.includes('string')) matches = true
            else if (regTypeLower.includes('float') && (prismaTypeLower.includes('float') || prismaTypeLower.includes('decimal'))) matches = true
            else if (regTypeLower.includes('int') && prismaTypeLower.includes('int')) matches = true
            else if (regTypeLower.includes('boolean') && prismaTypeLower.includes('boolean')) matches = true
            else if (regTypeLower.includes('datetime') && prismaTypeLower.includes('datetime')) matches = true
            else if (regTypeLower.includes(prismaTypeLower) || prismaTypeLower.includes(regTypeLower)) matches = true

            if (!matches) {
              hasFieldMismatch = true
              const alert = `Drift: Field '${fName}' in Entity '${entity.name}' has type mismatch: Registry says '${fType}', Code says '${prismaFieldType}'`
              driftAlerts.push(alert)
              console.warn(`⚠️ ${alert}`)
            }
          }
        }
        
        if (hasFieldMismatch && entity.status !== 'mismatch') {
          entity.status = 'mismatch'
          registryModified = true
        } else if (!hasFieldMismatch && entity.status === 'mismatch') {
          entity.status = 'actual'
          registryModified = true
        }
      }
    }
    
    if (registryModified) {
      saveJSON(entityRegPath, entityReg)
      console.log('💾 Entity Registry status tags synchronized.')
    }
  }

  // 2. Source File Existence Check
  const filesCheckList = [
    { file: 'ui_registry.json', listKey: 'interfaces' },
    { file: 'logic_registry.json', listKey: 'rules' },
    { file: 'workflow_registry.json', listKey: 'workflows' },
  ]

  for (const checklist of filesCheckList) {
    const regPath = getRegistryPath(checklist.file)
    if (!fs.existsSync(regPath)) continue
    
    const reg = loadJSON(regPath)
    let modified = false
    
    const list = reg[checklist.listKey]
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item.sourceFile) {
          // Check if file exists relative to root
          const fullPath = path.join(PROJECT_ROOT, item.sourceFile)
          const fileExists = fs.existsSync(fullPath)
          
          if (!fileExists) {
            if (item.status !== 'mismatch') {
              item.status = 'mismatch'
              modified = true
              const alert = `Drift: File '${item.sourceFile}' referenced in ${checklist.file} (ID: ${item.id}) does not exist on disk.`
              driftAlerts.push(alert)
              console.warn(`⚠️ ${alert}`)
            }
          } else {
            if (item.status === 'mismatch') {
              item.status = 'actual'
              modified = true
            }
          }
        }
      }
    }
    if (modified) {
      saveJSON(regPath, reg)
      console.log(`💾 Synchronized status tags in ${checklist.file}`)
    }
  }

  // 3. Cross-Layer Link Integrity Checks
  const sliceRegPath = getRegistryPath('slice_registry.json')
  const featureRegPath = getRegistryPath('feature_registry.json')
  
  if (fs.existsSync(sliceRegPath) && fs.existsSync(featureRegPath)) {
    const sliceReg = loadJSON(sliceRegPath)
    const featureReg = loadJSON(featureRegPath)
    
    const featureIds = new Set(featureReg.features.map((f: any) => f.id))
    
    let sliceModified = false
    for (const slice of sliceReg.slices) {
      let linkBroken = false
      if (Array.isArray(slice.linkedFeatures)) {
        for (const featId of slice.linkedFeatures) {
          if (!featureIds.has(featId)) {
            linkBroken = true
            const alert = `Link Drift: Slice ${slice.id} references non-existent Feature ${featId}`
            driftAlerts.push(alert)
            console.warn(`⚠️ ${alert}`)
          }
        }
      }
      
      if (linkBroken && slice.status !== 'mismatch') {
        slice.status = 'mismatch'
        sliceModified = true
      } else if (!linkBroken && slice.status === 'mismatch') {
        slice.status = 'actual'
        sliceModified = true
      }
    }
    if (sliceModified) {
      saveJSON(sliceRegPath, sliceReg)
      console.log('💾 Synchronized status tags in slice_registry.json')
    }
  }

  // Write drift findings back to audit_registry.json
  const auditPath = getRegistryPath('audit_registry.json')
  if (fs.existsSync(auditPath)) {
    const auditReg = loadJSON(auditPath)
    const latestAudit = auditReg.audits[0]
    if (latestAudit) {
      latestAudit.driftAlerts = driftAlerts
      latestAudit.qaFindings = driftAlerts.length === 0 
        ? ['Validation successful. Zero drift detected between code and registry blueprints.']
        : [`Drift warnings logged: ${driftAlerts.length} issues found.`]
      latestAudit.status = driftAlerts.length === 0 ? 'actual' : 'mismatch'
      saveJSON(auditPath, auditReg)
      console.log('💾 Drift alerts compiled to audit_registry.json.')
    }
  }
}

/**
 * Command: audit
 */
export function logAuditReport(): void {
  console.log('\n--- SYSTEM AUDIT STATUS ---')
  const auditPath = getRegistryPath('audit_registry.json')
  if (!fs.existsSync(auditPath)) {
    console.error('Audit registry does not exist.')
    return
  }
  const auditReg = loadJSON(auditPath)
  console.log(JSON.stringify(auditReg, null, 2))
}

// CLI entrypoint execution helper
const isDirectRun = process.argv[1] && (process.argv[1].includes('registry-engine.ts') || process.argv[1].includes('registry-engine.js'))
if (isDirectRun) {
  const command = process.argv[2] || 'validate'
  if (command === 'validate') {
    const ok = validateRegistries()
    process.exit(ok ? 0 : 1)
  } else if (command === 'drift') {
    detectDrift()
    process.exit(0)
  } else if (command === 'audit') {
    logAuditReport()
    process.exit(0)
  } else {
    console.error(`Unknown command: ${command}. Use validate, drift, or audit.`)
    process.exit(1)
  }
}
