# RuleForm — Complete Build Plan for AI Coding Agent

> **Terraform for AI Coding Context.**
> Write once, deploy to every AI coding tool.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Data Models & Types](#5-data-models--types)
6. [Core Modules](#6-core-modules)
7. [Provider System](#7-provider-system)
8. [CLI Commands](#8-cli-commands)
9. [Implementation Steps](#9-implementation-steps)
10. [Testing Strategy](#10-testing-strategy)
11. [Packaging & Distribution](#11-packaging--distribution)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. Project Overview

### What is RuleForm?

RuleForm is a CLI tool that lets developers define their AI coding context rules **once** in a single config file, then generates the correct format for every AI coding tool they use.

### Problem

Developers using multiple AI coding tools (Cursor, Claude Code, GitHub Copilot, Windsurf, Gemini Code Assist) must manually maintain separate context files for each tool:
- `.cursor/rules/*.mdc` for Cursor
- `CLAUDE.md` for Claude Code
- `.github/copilot-instructions.md` for GitHub Copilot
- `.windsurf/rules/*.md` for Windsurf
- `.gemini/settings.json` for Gemini Code Assist

When rules change, they must update every file manually. Teams with mixed tooling have it worse.

### Solution

```bash
# Define once
ruleform init          # Creates ruleform.yaml

# Generate all
ruleform apply         # Outputs to all configured providers

# Preview changes
ruleform plan          # Shows what will be generated (dry-run)

# Validate config
ruleform validate      # Checks config syntax and provider compatibility
```

### Analogy

```
Terraform:   .tf  → Provider → AWS / GCP / Azure
RuleForm: .yaml → Provider → Cursor / Claude / Copilot / Windsurf / Gemini
```

---

## 2. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| **Language** | TypeScript | Developer audience, npm ecosystem, type safety |
| **Runtime** | Node.js ≥ 18 | Stable LTS, broad compatibility |
| **CLI Framework** | Commander.js | Lightweight, well-known, simple |
| **Config Parsing** | js-yaml | YAML is dev-friendly, readable |
| **Config Validation** | Zod | Runtime type validation with great errors |
| **Templating** | Handlebars | For provider output templates |
| **File System** | fs-extra | Recursive mkdir, copy, etc. |
| **Styling** | chalk + ora | Colored output + spinners |
| **Diff** | diff | Show plan changes |
| **Testing** | Vitest | Fast, TypeScript native |
| **Build** | tsup | Fast bundler for CLIs |
| **Package Manager** | pnpm | Fast, disk efficient |

### Install Dependencies

```bash
mkdir ruleform && cd ruleform
pnpm init
pnpm add commander js-yaml zod handlebars fs-extra chalk ora diff
pnpm add -D typescript @types/node @types/fs-extra vitest tsup @types/diff
```

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Layer (Commander)                  │
│         init | plan | apply | validate | providers       │
├─────────────────────────────────────────────────────────┤
│                    Core Engine                           │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐    │
│  │  Config   │  │  Loader  │  │  Rule Resolver     │    │
│  │  Parser   │  │  (YAML)  │  │  (scope, inherit)  │    │
│  └──────────┘  └──────────┘  └────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│                  Provider Registry                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ Cursor │ │ Claude │ │Copilot │ │Windsurf│ │Gemini│ │
│  │Provider│ │Provider│ │Provider│ │Provider│ │Provdr│ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └──────┘ │
├─────────────────────────────────────────────────────────┤
│                   Output Layer                           │
│           File Writer + Diff Engine + Reporter           │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
ruleform.yaml
       │
       ▼
  Config Parser (Zod validation)
       │
       ▼
  Rule Resolver (scope matching, inheritance, variables)
       │
       ▼
  Provider Registry (select enabled providers)
       │
       ▼
  Provider.generate(rules) → files[]
       │
       ▼
  Output Layer (diff → write → report)
```

---

## 4. Directory Structure

```
ruleform/
├── src/
│   ├── index.ts                  # CLI entry point
│   ├── cli/
│   │   ├── init.ts               # `ruleform init` command
│   │   ├── plan.ts               # `ruleform plan` command
│   │   ├── apply.ts              # `ruleform apply` command
│   │   ├── validate.ts           # `ruleform validate` command
│   │   ├── providers.ts          # `ruleform providers` command
│   │   └── destroy.ts            # `ruleform destroy` command
│   ├── core/
│   │   ├── config.ts             # Config loader & parser
│   │   ├── schema.ts             # Zod schemas for config validation
│   │   ├── resolver.ts           # Rule resolver (scope, variables, inheritance)
│   │   ├── engine.ts             # Main engine (orchestrates everything)
│   │   ├── differ.ts             # Diff engine for plan
│   │   └── writer.ts             # File writer with safety checks
│   ├── providers/
│   │   ├── base.ts               # Abstract base provider class
│   │   ├── registry.ts           # Provider registry (discover & load)
│   │   ├── cursor/
│   │   │   ├── index.ts          # Cursor provider implementation
│   │   │   └── templates/
│   │   │       └── rule.mdc.hbs  # Cursor .mdc template
│   │   ├── claude/
│   │   │   ├── index.ts          # Claude Code provider
│   │   │   └── templates/
│   │   │       └── claude.md.hbs # CLAUDE.md template
│   │   ├── copilot/
│   │   │   ├── index.ts          # GitHub Copilot provider
│   │   │   └── templates/
│   │   │       └── instructions.md.hbs
│   │   ├── windsurf/
│   │   │   ├── index.ts          # Windsurf provider
│   │   │   └── templates/
│   │   │       └── rule.md.hbs
│   │   └── gemini/
│   │       ├── index.ts          # Gemini Code Assist provider
│   │       └── templates/
│   │           └── settings.json.hbs
│   ├── templates/
│   │   └── ruleform.yaml      # Default init template
│   └── utils/
│       ├── logger.ts             # Chalk-based logger
│       ├── files.ts              # File system helpers
│       └── git.ts                # .gitignore helpers
├── tests/
│   ├── unit/
│   │   ├── config.test.ts
│   │   ├── resolver.test.ts
│   │   ├── engine.test.ts
│   │   └── providers/
│   │       ├── cursor.test.ts
│   │       ├── claude.test.ts
│   │       ├── copilot.test.ts
│   │       ├── windsurf.test.ts
│   │       └── gemini.test.ts
│   ├── integration/
│   │   ├── init.test.ts
│   │   ├── plan.test.ts
│   │   └── apply.test.ts
│   └── fixtures/
│       ├── basic.yaml            # Basic test config
│       ├── full.yaml             # Full-featured config
│       ├── invalid.yaml          # Invalid config for error testing
│       └── expected/             # Expected output files per provider
│           ├── cursor/
│           ├── claude/
│           ├── copilot/
│           ├── windsurf/
│           └── gemini/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── README.md
├── LICENSE                       # MIT
├── CHANGELOG.md
└── .gitignore
```

---

## 5. Data Models & Types

### 5.1 Config Schema (`ruleform.yaml`)

```yaml
# ruleform.yaml — The single source of truth

version: "1"

# Project metadata (used in generated files)
project:
  name: "my-saas-app"
  description: "A SaaS application built with Next.js"
  stack:
    - "Next.js 15"
    - "TypeScript 5"
    - "Prisma ORM"
    - "PostgreSQL"
    - "TailwindCSS 4"
    - "shadcn/ui"
  conventions:
    language: "TypeScript"
    style: "functional"
    testing: "vitest"
    
# Providers to generate for
providers:
  cursor:
    enabled: true
    output: ".cursor/rules"      # Output directory (default shown)
  claude:
    enabled: true
    output: "."                   # Outputs CLAUDE.md in root
  copilot:
    enabled: true
    output: ".github"             # Outputs copilot-instructions.md
  windsurf:
    enabled: false
  gemini:
    enabled: false

# Variables (reusable across rules)
variables:
  error_handling: |
    - Always use try/catch blocks for async operations
    - Return proper error responses with status codes
    - Log errors with context (file, function, input)
    - Never swallow errors silently
  naming: |
    - camelCase for variables and functions
    - PascalCase for components and types
    - SCREAMING_SNAKE_CASE for constants
    - kebab-case for file names

# Rules — the core content
rules:
  # Rule with "always" scope — applies everywhere
  - name: "code-style"
    description: "General code style and conventions"
    scope: always
    priority: 1                   # Lower = applied first
    content: |
      ## Code Style
      
      - Use functional components with arrow functions
      - Prefer named exports over default exports
      - Use TypeScript strict mode
      - {{variables.naming}}

  # Rule scoped to specific file patterns (glob)
  - name: "api-routes"
    description: "API route conventions"
    scope:
      globs:
        - "src/app/api/**"
        - "src/server/**"
    content: |
      ## API Design
      
      - RESTful conventions for all endpoints
      - Validate all inputs with Zod schemas
      - {{variables.error_handling}}
      - Return consistent response format:
        ```json
        { "data": ..., "error": null }
        ```

  # Rule the agent decides when to use
  - name: "database"
    description: "Database and Prisma conventions"
    scope: agent-requested
    content: |
      ## Database (Prisma)
      
      - Always use transactions for multi-step mutations
      - Use select/include to avoid over-fetching
      - Define indexes for frequently queried fields
      - Soft-delete pattern: use `deletedAt` timestamp

  # Rule with manual activation (user must tag)
  - name: "deployment"
    description: "Deployment and CI/CD guidelines"
    scope: manual
    content: |
      ## Deployment
      
      - Vercel for production
      - Preview deployments for every PR
      - Environment variables in Vercel dashboard
      - Database migrations run in CI before deploy

  # Rule inheriting from another rule
  - name: "testing"
    description: "Testing conventions"
    scope: agent-requested
    extends: "code-style"          # Inherits code-style content
    content: |
      ## Testing
      
      - Vitest for unit and integration tests
      - Playwright for E2E tests
      - Test file next to source: `Button.test.tsx`
      - Minimum 80% coverage for critical paths
      - Use `describe` / `it` blocks, not `test`

# Ignore — files RuleForm should not touch
ignore:
  - "node_modules"
  - ".git"
  - "dist"
```

### 5.2 TypeScript Types (`src/core/schema.ts`)

```typescript
import { z } from "zod";

// ---- Scope Types ----

const ScopeAlways = z.literal("always");
const ScopeManual = z.literal("manual");
const ScopeAgentRequested = z.literal("agent-requested");
const ScopeGlobs = z.object({
  globs: z.array(z.string()).min(1),
});

const RuleScope = z.union([ScopeAlways, ScopeManual, ScopeAgentRequested, ScopeGlobs]);

// ---- Rule Schema ----

const RuleSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Rule name must be lowercase alphanumeric with hyphens"),
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

// ---- Output Types ----

export interface GeneratedFile {
  path: string;          // Relative path from project root
  content: string;       // File content
  provider: string;      // Provider name that generated this
  source: string[];      // Rule names that contributed
}

export interface PlanResult {
  created: GeneratedFile[];
  updated: GeneratedFile[];
  unchanged: GeneratedFile[];
  deleted: string[];
}

export interface ApplyResult {
  written: string[];
  skipped: string[];
  errors: Array<{ path: string; error: string }>;
}
```

---

## 6. Core Modules

### 6.1 Config Loader (`src/core/config.ts`)

```typescript
/**
 * Config Loader
 *
 * Responsibilities:
 * 1. Find ruleform.yaml in CWD or parent directories
 * 2. Parse YAML
 * 3. Validate against Zod schema
 * 4. Resolve variable references in rule content ({{variables.xxx}})
 * 5. Return typed Config object
 *
 * Error handling:
 * - File not found → clear error message with `ruleform init` hint
 * - YAML parse error → show line number and column
 * - Validation error → show Zod formatted error with path
 * - Variable reference error → show which variable is missing
 */

// Key functions:
export function findConfig(cwd?: string): string;            // Walk up dirs to find ruleform.yaml
export function loadConfig(configPath: string): Config;       // Load + parse + validate
export function resolveVariables(config: Config): Config;     // Replace {{variables.xxx}} in content
```

**Implementation notes:**
- Walk up from CWD to find `ruleform.yaml` (like `.git` discovery)
- Support `.yaml` and `.yml` extensions
- Variable resolution: simple regex replace `{{variables.NAME}}` from `config.variables`
- Circular variable reference detection with a Set
- Max 10 levels of variable nesting

### 6.2 Rule Resolver (`src/core/resolver.ts`)

```typescript
/**
 * Rule Resolver
 *
 * Responsibilities:
 * 1. Resolve `extends` chains (rule A extends rule B)
 * 2. Sort rules by priority
 * 3. Map scopes to provider-specific scope types
 * 4. Detect conflicts (two rules with same scope + overlapping globs)
 *
 * Extends behavior:
 * - Child rule content is APPENDED after parent content
 * - Child inherits parent scope if child scope is not set
 * - Circular extends → error
 * - Max extends depth: 5
 */

export interface ResolvedRule {
  name: string;
  description?: string;
  scope: RuleScopeType;
  priority: number;
  content: string;          // Final resolved content (with extends + variables)
  tags?: string[];
  sourceRules: string[];    // Chain of rule names (for debugging)
}

export function resolveRules(rules: Rule[]): ResolvedRule[];
```

### 6.3 Engine (`src/core/engine.ts`)

```typescript
/**
 * Engine — Main orchestrator
 *
 * This is the heart of RuleForm. It:
 * 1. Loads config
 * 2. Resolves rules
 * 3. Iterates enabled providers
 * 4. Calls provider.generate(resolvedRules, project)
 * 5. Collects all GeneratedFile[]
 * 6. Computes diff against existing files (for plan)
 * 7. Writes files (for apply)
 */

export class Engine {
  constructor(private cwd: string);

  async plan(): Promise<PlanResult>;      // Dry run — show what would change
  async apply(): Promise<ApplyResult>;    // Actually write files
  async validate(): Promise<ValidationResult>;  // Validate config only
  async destroy(): Promise<string[]>;     // Remove all generated files
}
```

### 6.4 Differ (`src/core/differ.ts`)

```typescript
/**
 * Diff Engine
 *
 * Compares generated files against existing files on disk.
 * Uses the `diff` npm package for unified diff output.
 *
 * Output format (similar to terraform plan):
 *
 *   + .cursor/rules/code-style.mdc       (CREATE)
 *   ~ CLAUDE.md                           (UPDATE)
 *     .github/copilot-instructions.md     (UNCHANGED)
 *   - .windsurf/rules/old-rule.md         (DELETE)
 */

export function computeDiff(generated: GeneratedFile[], cwd: string): PlanResult;
export function formatPlan(plan: PlanResult): string;  // Terminal-formatted output
```

### 6.5 Writer (`src/core/writer.ts`)

```typescript
/**
 * File Writer
 *
 * Safety features:
 * 1. Creates directories recursively
 * 2. Adds RuleForm header comment to generated files
 * 3. Only writes if content actually changed (avoids unnecessary git diffs)
 * 4. Backs up existing files before overwriting (optional)
 *
 * Header format:
 * <!-- Generated by RuleForm — DO NOT EDIT MANUALLY -->
 * <!-- Source: ruleform.yaml | Rules: code-style, api-routes -->
 * <!-- Run `ruleform apply` to regenerate -->
 */

export async function writeFiles(files: GeneratedFile[], cwd: string): Promise<ApplyResult>;
```

---

## 7. Provider System

### 7.1 Base Provider (`src/providers/base.ts`)

```typescript
/**
 * Abstract Base Provider
 *
 * Every provider must implement:
 * 1. name — provider identifier (e.g., "cursor")
 * 2. displayName — human-readable name (e.g., "Cursor IDE")
 * 3. defaultOutput — default output directory
 * 4. generate() — transform resolved rules into files
 * 5. scopeMap() — map RuleForm scopes to provider-specific scopes
 */

export abstract class BaseProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly defaultOutput: string;
  abstract readonly fileExtension: string;
  abstract readonly website: string;

  abstract generate(
    rules: ResolvedRule[],
    project: Config["project"],
    providerConfig: ProviderConfig
  ): GeneratedFile[];

  // Map generic scope to provider-specific scope name
  abstract mapScope(scope: RuleScopeType): string;

  // Get output directory (custom or default)
  getOutputDir(providerConfig: ProviderConfig): string {
    return providerConfig.output || this.defaultOutput;
  }
}
```

### 7.2 Cursor Provider (`src/providers/cursor/index.ts`)

```typescript
/**
 * Cursor Provider
 *
 * Output format: .cursor/rules/{rule-name}.mdc
 *
 * MDC format:
 * ---
 * description: Rule description
 * globs: ["src/api/**"]        # Only for glob-scoped rules
 * alwaysApply: true             # For "always" scope
 * ---
 * Rule content here...
 *
 * Scope mapping:
 *   always          → alwaysApply: true
 *   agent-requested → alwaysApply: false (no globs = agent decides)
 *   manual          → alwaysApply: false (user tags manually)
 *   globs           → globs: ["pattern1", "pattern2"]
 */

export class CursorProvider extends BaseProvider {
  name = "cursor";
  displayName = "Cursor IDE";
  defaultOutput = ".cursor/rules";
  fileExtension = ".mdc";
  website = "https://cursor.com";

  generate(rules, project, config): GeneratedFile[] {
    // Generate project context rule (auto-generated from project metadata)
    // Generate one .mdc file per rule
    // Use Handlebars template for .mdc format
  }

  mapScope(scope): string {
    // Map to Cursor's activation modes
  }
}
```

**Cursor .mdc template (`rule.mdc.hbs`):**
```handlebars
---
description: {{description}}
{{#if isAlways}}alwaysApply: true{{/if}}
{{#if globs}}globs: {{{json globs}}}{{/if}}
{{#unless isAlways}}{{#unless globs}}alwaysApply: false{{/unless}}{{/unless}}
---

{{content}}
```

### 7.3 Claude Provider (`src/providers/claude/index.ts`)

```typescript
/**
 * Claude Code Provider
 *
 * Output format: Single CLAUDE.md file in project root
 *
 * Claude Code reads CLAUDE.md as project context.
 * All rules are concatenated into one file, separated by headers.
 * Scope information is added as comments/hints for Claude.
 *
 * Structure:
 * <!-- Generated by RuleForm -->
 * # Project: my-saas-app
 * Tech stack: Next.js, TypeScript, Prisma...
 *
 * ## Code Style (always applied)
 * ...content...
 *
 * ## API Routes (apply when working in src/app/api/**)
 * ...content...
 *
 * ## Database (apply when relevant)
 * ...content...
 */

export class ClaudeProvider extends BaseProvider {
  name = "claude";
  displayName = "Claude Code";
  defaultOutput = ".";
  fileExtension = ".md";
  website = "https://claude.ai";
  
  // Generates single CLAUDE.md file
}
```

**Claude template (`claude.md.hbs`):**
```handlebars
<!-- Generated by RuleForm — DO NOT EDIT MANUALLY -->
<!-- Run `ruleform apply` to regenerate -->

# Project: {{project.name}}

{{#if project.description}}
> {{project.description}}
{{/if}}

{{#if project.stack}}
## Tech Stack
{{#each project.stack}}
- {{this}}
{{/each}}
{{/if}}

{{#each rules}}

---

## {{this.description}}

{{#if this.scopeHint}}
> **Scope:** {{this.scopeHint}}
{{/if}}

{{this.content}}

{{/each}}
```

### 7.4 Copilot Provider (`src/providers/copilot/index.ts`)

```typescript
/**
 * GitHub Copilot Provider
 *
 * Output format: .github/copilot-instructions.md
 *
 * Copilot reads a single instructions file.
 * Similar to Claude — all rules concatenated.
 * Copilot doesn't support scopes, so all rules are included.
 * Priority sorting determines order.
 */

export class CopilotProvider extends BaseProvider {
  name = "copilot";
  displayName = "GitHub Copilot";
  defaultOutput = ".github";
  fileExtension = ".md";
  website = "https://github.com/features/copilot";
}
```

### 7.5 Windsurf Provider (`src/providers/windsurf/index.ts`)

```typescript
/**
 * Windsurf (Codeium) Provider
 *
 * Output format: .windsurf/rules/{rule-name}.md
 *
 * Windsurf uses markdown files in .windsurf/rules/ directory.
 * Similar to Cursor but simpler format (no frontmatter).
 * Has a global .windsurfrules file option too.
 *
 * Can generate either:
 * - Multiple files in .windsurf/rules/ (preferred)
 * - Single .windsurfrules file (legacy mode via options)
 */

export class WindsurfProvider extends BaseProvider {
  name = "windsurf";
  displayName = "Windsurf";
  defaultOutput = ".windsurf/rules";
  fileExtension = ".md";
  website = "https://windsurf.com";
}
```

### 7.6 Gemini Provider (`src/providers/gemini/index.ts`)

```typescript
/**
 * Gemini Code Assist Provider
 *
 * Output format: .gemini/settings.json + .gemini/rules/{name}.md
 *
 * Gemini uses a JSON settings file + markdown style guides.
 * The settings.json references which style guide files to use.
 */

export class GeminiProvider extends BaseProvider {
  name = "gemini";
  displayName = "Gemini Code Assist";
  defaultOutput = ".gemini";
  fileExtension = ".md";
  website = "https://cloud.google.com/gemini";
}
```

### 7.7 Provider Registry (`src/providers/registry.ts`)

```typescript
/**
 * Provider Registry
 *
 * Discovers and loads all providers.
 * Maps provider names to provider instances.
 * Filters by enabled providers from config.
 */

export class ProviderRegistry {
  private providers: Map<string, BaseProvider>;

  constructor() {
    // Register all built-in providers
    this.register(new CursorProvider());
    this.register(new ClaudeProvider());
    this.register(new CopilotProvider());
    this.register(new WindsurfProvider());
    this.register(new GeminiProvider());
  }

  register(provider: BaseProvider): void;
  get(name: string): BaseProvider | undefined;
  getEnabled(config: Config): BaseProvider[];
  listAll(): BaseProvider[];
}
```

---

## 8. CLI Commands

### 8.1 Entry Point (`src/index.ts`)

```typescript
#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("ruleform")
  .description("Terraform for AI coding context. Write once, deploy to every AI tool.")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(planCommand);
program.addCommand(applyCommand);
program.addCommand(validateCommand);
program.addCommand(providersCommand);
program.addCommand(destroyCommand);

program.parse();
```

### 8.2 `ruleform init`

```typescript
/**
 * Initialize a new ruleform.yaml in the current directory.
 *
 * Behavior:
 * 1. Check if ruleform.yaml already exists → warn and exit (unless --force)
 * 2. Detect project info (scan package.json, tsconfig, etc.)
 * 3. Auto-detect which AI tools are in use:
 *    - .cursor/ exists → enable cursor
 *    - CLAUDE.md exists → enable claude  
 *    - .github/copilot-instructions.md → enable copilot
 *    - .windsurf/ exists → enable windsurf
 *    - .gemini/ exists → enable gemini
 * 4. If existing rule files found, IMPORT their content as rules
 * 5. Generate ruleform.yaml with detected settings
 * 6. Print summary of what was detected and imported
 *
 * Flags:
 *   --force     Overwrite existing ruleform.yaml
 *   --blank     Create minimal config without auto-detection
 *   --import    Import existing rule files into config
 */
```

### 8.3 `ruleform plan`

```typescript
/**
 * Show what changes would be applied (dry-run).
 *
 * Output format (Terraform-inspired):
 *
 *   RuleForm Plan — 5 files across 3 providers
 *
 *   Cursor:
 *     + .cursor/rules/code-style.mdc          (CREATE)
 *     + .cursor/rules/api-routes.mdc          (CREATE)
 *     + .cursor/rules/project-context.mdc     (CREATE)
 *
 *   Claude Code:
 *     ~ CLAUDE.md                              (UPDATE)
 *       - Line 15: old content
 *       + Line 15: new content
 *
 *   GitHub Copilot:
 *     = .github/copilot-instructions.md       (UNCHANGED)
 *
 *   Plan: 3 to create, 1 to update, 1 unchanged.
 *
 * Flags:
 *   --provider <name>    Only plan for specific provider
 *   --verbose            Show full file diffs
 *   --json               Output as JSON (for CI/CD)
 */
```

### 8.4 `ruleform apply`

```typescript
/**
 * Generate and write all context files.
 *
 * Behavior:
 * 1. Run plan internally
 * 2. Show summary of changes
 * 3. Write files
 * 4. Report results
 *
 * Output:
 *   RuleForm Apply — writing 5 files
 *
 *   ✓ .cursor/rules/code-style.mdc
 *   ✓ .cursor/rules/api-routes.mdc
 *   ✓ .cursor/rules/project-context.mdc
 *   ✓ CLAUDE.md
 *   ✓ .github/copilot-instructions.md
 *
 *   Apply complete! 5 files written across 3 providers.
 *
 * Flags:
 *   --provider <name>    Only apply for specific provider
 *   --yes                Skip confirmation prompt
 *   --dry-run            Same as plan (alias)
 */
```

### 8.5 `ruleform validate`

```typescript
/**
 * Validate ruleform.yaml without generating files.
 *
 * Checks:
 * 1. YAML syntax
 * 2. Schema validation (Zod)
 * 3. Rule name uniqueness
 * 4. Extends references exist
 * 5. No circular extends
 * 6. Variable references resolve
 * 7. Glob patterns are valid
 * 8. Provider configs are valid
 *
 * Output:
 *   ✓ Config syntax valid
 *   ✓ Schema validation passed
 *   ✓ 5 rules defined, 0 conflicts
 *   ✓ 3 providers enabled
 *   ✓ All variable references resolved
 *
 *   Config is valid!
 */
```

### 8.6 `ruleform providers`

```typescript
/**
 * List available providers and their status.
 *
 * Output:
 *   Available Providers:
 *
 *   Provider          Status    Output
 *   ─────────         ──────    ──────
 *   cursor            ✓ ON     .cursor/rules/
 *   claude            ✓ ON     ./CLAUDE.md
 *   copilot           ✓ ON     .github/
 *   windsurf          ✗ OFF    .windsurf/rules/
 *   gemini            ✗ OFF    .gemini/
 *
 * Flags:
 *   --json    Output as JSON
 */
```

### 8.7 `ruleform destroy`

```typescript
/**
 * Remove all RuleForm-generated files.
 *
 * Only removes files that have the RuleForm header comment.
 * Prompts for confirmation before deletion.
 *
 * Flags:
 *   --yes     Skip confirmation
 */
```

---

## 9. Implementation Steps (Ordered)

Build in this exact order. Each step should be a working, testable increment.

### Step 1: Project Setup
```
1. Initialize project: pnpm init, TypeScript, tsup, vitest
2. Configure tsconfig.json (strict mode, ES2022, NodeNext)
3. Configure tsup for CLI build (banner with #!/usr/bin/env node)
4. Configure vitest
5. Add .gitignore, .editorconfig
6. Set up package.json bin field: "ruleform": "./dist/index.js"
7. Add scripts: build, dev, test, lint
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**tsup.config.ts:**
```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: true,
  sourcemap: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

**package.json (key fields):**
```json
{
  "name": "ruleform",
  "version": "0.1.0",
  "description": "Terraform for AI coding context. Write once, deploy to every AI tool.",
  "type": "module",
  "bin": {
    "ruleform": "./dist/index.js"
  },
  "files": ["dist"],
  "keywords": [
    "ai", "cursor", "claude", "copilot", "context", "rules",
    "coding-agent", "terraform", "devtools", "cli"
  ],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "tsc --noEmit",
    "prepublishOnly": "pnpm run build && pnpm run test:run"
  }
}
```

### Step 2: Zod Schema & Types
```
1. Create src/core/schema.ts with all Zod schemas
2. Export inferred TypeScript types
3. Write unit tests for schema validation
   - Valid configs pass
   - Invalid configs fail with clear errors
   - Edge cases (empty rules, missing fields, etc.)
```

### Step 3: Config Loader
```
1. Create src/core/config.ts
2. Implement findConfig() — walk up directories
3. Implement loadConfig() — YAML parse + Zod validate
4. Implement resolveVariables() — {{variables.xxx}} replacement
5. Write unit tests with fixture YAML files
```

### Step 4: Rule Resolver
```
1. Create src/core/resolver.ts
2. Implement extends resolution (recursive with cycle detection)
3. Implement priority sorting
4. Write unit tests
   - Simple rules
   - Extends chains
   - Circular extends detection
   - Priority sorting
```

### Step 5: Base Provider + Cursor Provider
```
1. Create src/providers/base.ts — abstract class
2. Create src/providers/cursor/index.ts
3. Create Handlebars template for .mdc files
4. Implement scope mapping (always → alwaysApply, etc.)
5. Implement generate() that produces GeneratedFile[]
6. Write unit tests comparing output to expected fixtures
```

### Step 6: Claude Provider
```
1. Create src/providers/claude/index.ts
2. Create Handlebars template for CLAUDE.md
3. All rules concatenated into single file
4. Scope hints as markdown comments
5. Unit tests
```

### Step 7: Copilot Provider
```
1. Create src/providers/copilot/index.ts
2. Template for copilot-instructions.md
3. Similar to Claude (single file) but Copilot-specific format
4. Unit tests
```

### Step 8: Windsurf Provider
```
1. Create src/providers/windsurf/index.ts
2. Multiple files in .windsurf/rules/
3. Simpler format than Cursor (no frontmatter)
4. Unit tests
```

### Step 9: Gemini Provider
```
1. Create src/providers/gemini/index.ts
2. settings.json + markdown style guides
3. Unit tests
```

### Step 10: Provider Registry
```
1. Create src/providers/registry.ts
2. Register all providers
3. getEnabled() filters by config
4. Unit tests
```

### Step 11: Diff Engine
```
1. Create src/core/differ.ts
2. Compare generated files vs existing on disk
3. Classify: CREATE, UPDATE, UNCHANGED, DELETE
4. Format terminal output with colors
5. Unit tests
```

### Step 12: File Writer
```
1. Create src/core/writer.ts
2. Add RuleForm header to all generated files
3. Skip write if content unchanged (hash comparison)
4. Create directories as needed
5. Unit tests using temp directories
```

### Step 13: Engine (Orchestrator)
```
1. Create src/core/engine.ts
2. Wire together: config → resolver → providers → differ/writer
3. Implement plan(), apply(), validate(), destroy()
4. Integration tests
```

### Step 14: Logger & Utils
```
1. Create src/utils/logger.ts — chalk-based with log levels
2. Create src/utils/files.ts — file system helpers
3. Create src/utils/git.ts — .gitignore management
```

### Step 15: CLI Commands
```
1. Create src/index.ts — Commander setup
2. Implement init command with auto-detection
3. Implement plan command
4. Implement apply command
5. Implement validate command
6. Implement providers command
7. Implement destroy command
8. Integration tests for each command
```

### Step 16: Init Template & Auto-Detection
```
1. Create default ruleform.yaml template
2. Auto-detect project info from package.json
3. Auto-detect existing AI tool configs
4. Import existing rules content
```

### Step 17: Polish
```
1. Error messages — clear, actionable, with hints
2. Help text for every command
3. Colors and spinners
4. Edge case handling
5. README.md with full documentation
6. CHANGELOG.md
```

### Step 18: Testing & Quality
```
1. Unit test coverage > 90%
2. Integration tests for full CLI workflow
3. Edge case tests (empty config, missing files, permissions)
4. CI with GitHub Actions
```

---

## 10. Testing Strategy

### Test Structure

```
tests/
├── unit/                    # Fast, isolated tests
│   ├── config.test.ts       # Config loading & parsing
│   ├── resolver.test.ts     # Rule resolution & extends
│   ├── engine.test.ts       # Engine orchestration
│   ├── differ.test.ts       # Diff computation
│   ├── writer.test.ts       # File writing
│   └── providers/
│       ├── cursor.test.ts   # Each provider tested
│       ├── claude.test.ts
│       ├── copilot.test.ts
│       ├── windsurf.test.ts
│       └── gemini.test.ts
├── integration/             # Full workflow tests
│   ├── init.test.ts         # Init creates correct config
│   ├── plan.test.ts         # Plan shows correct diff
│   ├── apply.test.ts        # Apply writes correct files
│   └── roundtrip.test.ts    # Init → Apply → Plan shows no changes
└── fixtures/                # Test data
    ├── basic.yaml
    ├── full.yaml
    ├── invalid.yaml
    ├── with-extends.yaml
    ├── with-variables.yaml
    └── expected/            # Expected generated files
        ├── cursor/
        │   ├── code-style.mdc
        │   └── api-routes.mdc
        ├── claude/
        │   └── CLAUDE.md
        ├── copilot/
        │   └── copilot-instructions.md
        ├── windsurf/
        │   └── code-style.md
        └── gemini/
            ├── settings.json
            └── code-style.md
```

### Key Test Cases

```typescript
// Config
- ✅ Load valid YAML config
- ✅ Reject invalid YAML syntax
- ✅ Reject missing required fields
- ✅ Reject invalid rule names (uppercase, spaces)
- ✅ Resolve variables correctly
- ✅ Detect missing variable references
- ✅ Find config in parent directories

// Rules
- ✅ Sort by priority
- ✅ Resolve extends (single level)
- ✅ Resolve extends (multi-level chain)
- ✅ Detect circular extends
- ✅ Scope mapping per provider

// Providers
- ✅ Cursor: generates correct .mdc with frontmatter
- ✅ Cursor: alwaysApply for "always" scope
- ✅ Cursor: globs for glob scope
- ✅ Claude: single CLAUDE.md with all rules
- ✅ Claude: scope hints as comments
- ✅ Copilot: correct instructions format
- ✅ Windsurf: multiple files, no frontmatter
- ✅ Gemini: settings.json + style guides

// Engine
- ✅ Plan detects CREATE (new files)
- ✅ Plan detects UPDATE (changed files)
- ✅ Plan detects UNCHANGED
- ✅ Apply writes all files
- ✅ Apply skips unchanged files
- ✅ Destroy removes only RuleForm-generated files

// CLI
- ✅ Init creates config file
- ✅ Init auto-detects project info
- ✅ Init imports existing rules
- ✅ Plan outputs correct format
- ✅ Apply writes files
- ✅ Validate catches errors
- ✅ Providers lists all with status
```

---

## 11. Packaging & Distribution

### npm Publishing

```bash
# Build
pnpm build

# Test
pnpm test:run

# Publish
npm publish

# Users install:
npm install -g ruleform
# or
npx ruleform init
```

### GitHub Repository

```
README.md structure:
1. Hero banner + tagline
2. Quick demo GIF (terminal recording)
3. Install: npm install -g ruleform
4. Quick start: ruleform init → ruleform apply
5. Config reference
6. Provider details
7. CI/CD integration example
8. Contributing guide
```

### Launch Channels

```
1. GitHub — open source (MIT)
2. npm — package registry
3. Product Hunt — launch
4. Hacker News — Show HN post
5. Reddit — r/programming, r/webdev, r/coding
6. Twitter/X — #buildinpublic, #devtools
7. Dev.to — tutorial article
```

---

## 12. Future Roadmap

### Phase 2 — Templates & Sharing (Month 2)

```
- ruleform registry — browse and install community templates
- ruleform add nextjs-fullstack — install a template pack
- Template packs: framework-specific rule bundles
  - nextjs-fullstack
  - react-native
  - python-fastapi
  - rust-axum
  - go-gin
```

### Phase 3 — Team & Cloud (Month 3-4)

```
- ruleform login — authenticate
- ruleform push — sync config to cloud
- ruleform pull — pull team config
- Org-wide rule policies (enforce rules across all repos)
- Role-based rules (junior gets stricter rules)
- Usage analytics dashboard
```

### Phase 4 — Intelligence (Month 5+)

```
- ruleform analyze — scan codebase and suggest rules
- ruleform optimize — test rules against AI output quality
- MCP server — expose RuleForm as an MCP tool
- VS Code extension — visual rule editor
- GitHub Action — auto-apply on PR merge
```

### Phase 5 — Pro/SaaS (Month 6+)

```
Pricing:
- Free: CLI + 3 providers + community templates
- Pro ($12/mo): All providers + template marketplace + analytics
- Team ($29/seat/mo): Cloud sync + org policies + SSO + audit log
```

---

## Appendix A: Example Full Config

```yaml
version: "1"

project:
  name: "acme-saas"
  description: "Multi-tenant SaaS platform for project management"
  stack:
    - Next.js 15 (App Router)
    - TypeScript 5.7
    - Prisma ORM 6
    - PostgreSQL 16
    - Redis (Upstash)
    - TailwindCSS 4
    - shadcn/ui
    - Stripe (billing)
    - Resend (emails)
  conventions:
    language: TypeScript
    style: functional
    testing: vitest + playwright

providers:
  cursor:
    enabled: true
  claude:
    enabled: true
  copilot:
    enabled: true
  windsurf:
    enabled: false
  gemini:
    enabled: false

variables:
  error_pattern: |
    - Use try/catch for all async operations
    - Return { data, error } format
    - Log with structured context: { fn, input, error }
    - Never expose internal errors to clients
  auth_pattern: |
    - Verify session with getServerSession()
    - Check tenant membership before data access
    - Rate limit all public endpoints
    - CSRF protection on mutations

rules:
  - name: general
    description: General coding style and conventions
    scope: always
    priority: 1
    content: |
      You are an expert TypeScript developer working on a multi-tenant SaaS.
      
      ## Style
      - Functional components with arrow functions
      - Named exports, no default exports
      - Strict TypeScript — no `any`, no `as` casts unless justified
      - Prefer composition over inheritance
      - Small, focused functions (< 50 lines)

  - name: api
    description: API route conventions
    scope:
      globs: ["src/app/api/**", "src/server/**"]
    priority: 10
    content: |
      ## API Design
      - RESTful endpoints
      - Zod schemas for ALL inputs
      - {{variables.error_pattern}}
      - {{variables.auth_pattern}}
      - Response format: { data: T | null, error: string | null }

  - name: database
    description: Database operations with Prisma
    scope: agent-requested
    priority: 20
    content: |
      ## Prisma Best Practices
      - Always scope queries by tenantId
      - Use transactions for multi-step mutations
      - Select only needed fields (no select-all)
      - Soft delete: set deletedAt, never hard delete
      - Index all foreign keys and frequently filtered columns

  - name: frontend
    description: Frontend component patterns
    scope:
      globs: ["src/app/**", "src/components/**"]
    priority: 15
    content: |
      ## Components
      - Server Components by default
      - 'use client' only when needed (state, effects, events)
      - Colocate components: Button/Button.tsx, Button.test.tsx
      - Use shadcn/ui primitives, don't reinvent
      - Accessible: proper ARIA, keyboard nav, focus management

  - name: testing
    description: Testing patterns
    scope: agent-requested
    extends: general
    priority: 30
    content: |
      ## Testing
      - Vitest for unit + integration
      - Playwright for E2E
      - Test files colocated: Component.test.tsx
      - Describe/it blocks, not bare test()
      - Mock external services, never real API calls in tests
      - Critical path coverage > 80%

  - name: security
    description: Security guidelines
    scope: always
    priority: 5
    content: |
      ## Security
      - {{variables.auth_pattern}}
      - Sanitize all user input
      - No secrets in code — use env variables
      - Content Security Policy headers
      - SQL injection prevention (Prisma handles, but verify raw queries)
```

### Appendix B: Generated Output Examples

**`.cursor/rules/general.mdc`:**
```
---
description: General coding style and conventions
alwaysApply: true
---

<!-- Generated by RuleForm — DO NOT EDIT MANUALLY -->
<!-- Source: ruleform.yaml | Rule: general -->

You are an expert TypeScript developer working on a multi-tenant SaaS.

## Style
- Functional components with arrow functions
- Named exports, no default exports
- Strict TypeScript — no `any`, no `as` casts unless justified
- Prefer composition over inheritance
- Small, focused functions (< 50 lines)
```

**`.cursor/rules/api.mdc`:**
```
---
description: API route conventions
globs: ["src/app/api/**", "src/server/**"]
---

<!-- Generated by RuleForm — DO NOT EDIT MANUALLY -->
<!-- Source: ruleform.yaml | Rule: api -->

## API Design
- RESTful endpoints
- Zod schemas for ALL inputs
- Use try/catch for all async operations
- Return { data, error } format
- Log with structured context: { fn, input, error }
- Never expose internal errors to clients
- Verify session with getServerSession()
- Check tenant membership before data access
- Rate limit all public endpoints
- CSRF protection on mutations
- Response format: { data: T | null, error: string | null }
```

**`CLAUDE.md`:**
```markdown
<!-- Generated by RuleForm — DO NOT EDIT MANUALLY -->
<!-- Run `ruleform apply` to regenerate -->

# Project: acme-saas

> Multi-tenant SaaS platform for project management

## Tech Stack
- Next.js 15 (App Router)
- TypeScript 5.7
- Prisma ORM 6
- PostgreSQL 16
- Redis (Upstash)
- TailwindCSS 4
- shadcn/ui
- Stripe (billing)
- Resend (emails)

---

## General coding style and conventions
> **Scope:** Always applied

You are an expert TypeScript developer working on a multi-tenant SaaS.

## Style
- Functional components with arrow functions
...

---

## Security guidelines
> **Scope:** Always applied

## Security
- Verify session with getServerSession()
...

---

## API route conventions
> **Scope:** Apply when working in `src/app/api/**`, `src/server/**`

## API Design
- RESTful endpoints
...

---

## Frontend component patterns
> **Scope:** Apply when working in `src/app/**`, `src/components/**`

## Components
- Server Components by default
...

---

## Database operations with Prisma
> **Scope:** Apply when relevant to the task

## Prisma Best Practices
...

---

## Testing patterns
> **Scope:** Apply when relevant to the task

## Testing
...
```

---

_Plan version: 1.0 — March 2026_
_Created for: Kerem Solmaz_
_Product: RuleForm_
