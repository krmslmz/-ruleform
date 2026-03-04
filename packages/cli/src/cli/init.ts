import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "../utils/logger.js";
import { t } from "../i18n/index.js";

const TEMPLATE_PATH = join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "templates",
  "ruleform.yaml"
);

interface InitOptions {
  force?: boolean;
  blank?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, "ruleform.yaml");

  if (existsSync(configPath) && !options.force) {
    log.error(t("init.exists"));
    process.exit(1);
  }

  log.info(t("init.creating"));

  // Auto-detect project info
  let projectName = "my-project";
  let stack: string[] = ["TypeScript"];
  const detectedTools: string[] = [];

  // Scan package.json
  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      projectName = pkg.name ?? projectName;
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      stack = [];
      if (deps["typescript"]) stack.push("TypeScript");
      if (deps["next"]) stack.push("Next.js");
      if (deps["react"]) stack.push("React");
      if (deps["vue"]) stack.push("Vue");
      if (deps["svelte"]) stack.push("Svelte");
      if (deps["express"]) stack.push("Express");
      if (deps["fastify"]) stack.push("Fastify");
      if (deps["prisma"] || deps["@prisma/client"]) stack.push("Prisma");
      if (deps["tailwindcss"]) stack.push("TailwindCSS");
      if (deps["vitest"]) stack.push("Vitest");
      if (deps["jest"]) stack.push("Jest");
      if (stack.length === 0) stack.push("JavaScript");
    } catch {
      // ignore parse errors
    }
  }

  // Detect existing AI tools
  const enableCursor = existsSync(join(cwd, ".cursor"));
  const enableClaude = existsSync(join(cwd, "CLAUDE.md"));
  const enableCopilot = existsSync(join(cwd, ".github", "copilot-instructions.md"));
  const enableWindsurf = existsSync(join(cwd, ".windsurf"));
  const enableGemini = existsSync(join(cwd, ".gemini"));

  if (enableCursor) detectedTools.push("Cursor");
  if (enableClaude) detectedTools.push("Claude Code");
  if (enableCopilot) detectedTools.push("GitHub Copilot");
  if (enableWindsurf) detectedTools.push("Windsurf");
  if (enableGemini) detectedTools.push("Gemini");

  if (detectedTools.length > 0) {
    log.info(t("init.detected", { tools: detectedTools.join(", ") }));
  }

  // Build config
  const config = buildConfig(projectName, stack, {
    cursor: enableCursor || (!enableClaude && !enableCopilot && !enableWindsurf && !enableGemini),
    claude: enableClaude || (!enableCursor && !enableCopilot && !enableWindsurf && !enableGemini),
    copilot: enableCopilot || (!enableCursor && !enableClaude && !enableWindsurf && !enableGemini),
    windsurf: enableWindsurf,
    gemini: enableGemini,
  });

  writeFileSync(configPath, config, "utf-8");

  const enabledCount = [enableCursor || true, enableClaude || true, enableCopilot || true, enableWindsurf, enableGemini].filter(Boolean).length;

  log.success(t("init.success", { ruleCount: "2", providerCount: String(enabledCount) }));
  log.dim(t("init.hint"));
}

function buildConfig(
  name: string,
  stack: string[],
  providers: Record<string, boolean>
): string {
  return `version: "1"

project:
  name: "${name}"
  description: ""
  stack:
${stack.map((s) => `    - "${s}"`).join("\n")}

providers:
  cursor:
    enabled: ${providers.cursor ?? true}
  claude:
    enabled: ${providers.claude ?? true}
  copilot:
    enabled: ${providers.copilot ?? true}
  windsurf:
    enabled: ${providers.windsurf ?? false}
  gemini:
    enabled: ${providers.gemini ?? false}

variables:
  error_handling: |
    - Use try/catch for all async operations
    - Return proper error responses with status codes
    - Log errors with context
    - Never swallow errors silently

rules:
  - name: "general"
    description: "General coding style and conventions"
    scope: always
    priority: 1
    content: |
      ## Code Style

      - Use functional patterns
      - Prefer named exports
      - Keep functions small and focused
      - Write meaningful variable names

  - name: "testing"
    description: "Testing conventions"
    scope: agent-requested
    priority: 30
    content: |
      ## Testing

      - Write tests alongside source files
      - Use describe/it blocks
      - Mock external services
`;
}
