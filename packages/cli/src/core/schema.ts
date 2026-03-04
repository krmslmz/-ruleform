import { z } from "zod";

// ---- Scope Types ----

const ScopeAlways = z.literal("always");
const ScopeManual = z.literal("manual");
const ScopeAgentRequested = z.literal("agent-requested");
const ScopeGlobs = z.object({
  globs: z.array(z.string()).min(1),
});

const RuleScope = z.union([
  ScopeAlways,
  ScopeManual,
  ScopeAgentRequested,
  ScopeGlobs,
]);

// ---- Rule Schema ----

const RuleSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(
      /^[a-z0-9-]+$/,
      "Rule name must be lowercase alphanumeric with hyphens"
    ),
  description: z.string().max(256).optional(),
  scope: RuleScope,
  priority: z.number().int().min(0).max(100).default(50),
  content: z.string().min(1),
  extends: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ---- Provider Config ----

const ProviderConfigSchema = z.object({
  enabled: z.boolean().default(false),
  output: z.string().optional(),
  options: z.record(z.unknown()).optional(),
});

// ---- Project Schema ----

const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  stack: z.array(z.string()).optional(),
  conventions: z
    .object({
      language: z.string().optional(),
      style: z.string().optional(),
      testing: z.string().optional(),
    })
    .optional(),
});

// ---- Root Config Schema ----

export const ConfigSchema = z.object({
  version: z.literal("1"),
  project: ProjectSchema,
  providers: z.object({
    cursor: ProviderConfigSchema.optional(),
    claude: ProviderConfigSchema.optional(),
    copilot: ProviderConfigSchema.optional(),
    windsurf: ProviderConfigSchema.optional(),
    gemini: ProviderConfigSchema.optional(),
  }),
  variables: z.record(z.string()).optional(),
  rules: z.array(RuleSchema).min(1),
  ignore: z.array(z.string()).optional(),
});

// ---- Inferred Types ----

export type Config = z.infer<typeof ConfigSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type RuleScopeType = z.infer<typeof RuleScope>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type ProviderName = keyof Config["providers"];

// ---- Output Types ----

export interface GeneratedFile {
  path: string;
  content: string;
  provider: string;
  source: string[];
}

export interface PlanResult {
  created: GeneratedFile[];
  updated: Array<GeneratedFile & { diff: string }>;
  unchanged: GeneratedFile[];
  deleted: string[];
}

export interface ApplyResult {
  written: string[];
  skipped: string[];
  errors: Array<{ path: string; error: string }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ResolvedRule {
  name: string;
  description?: string;
  scope: RuleScopeType;
  priority: number;
  content: string;
  tags?: string[];
  sourceRules: string[];
}
