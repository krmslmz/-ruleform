import { resolve } from "node:path";
import { findConfig, loadConfig } from "./config.js";
import { resolveRules } from "./resolver.js";
import { computeDiff, formatPlan } from "./differ.js";
import { writeFiles, destroyFiles } from "./writer.js";
import { ProviderRegistry } from "../providers/registry.js";
import type {
  Config,
  GeneratedFile,
  PlanResult,
  ApplyResult,
  ValidationResult,
  ProviderConfig,
} from "./schema.js";

export class Engine {
  private cwd: string;
  private registry: ProviderRegistry;

  constructor(cwd?: string) {
    this.cwd = resolve(cwd ?? process.cwd());
    this.registry = new ProviderRegistry();
  }

  private load(): { config: Config; configPath: string } {
    const configPath = findConfig(this.cwd);
    const config = loadConfig(configPath);
    return { config, configPath };
  }

  private generateAll(config: Config): GeneratedFile[] {
    const resolved = resolveRules(config.rules);
    const providers = this.registry.getEnabled(config);
    const files: GeneratedFile[] = [];

    for (const provider of providers) {
      const providerConfig =
        (config.providers[provider.name as keyof typeof config.providers] as ProviderConfig) ?? {
          enabled: true,
        };
      const generated = provider.generate(resolved, config.project, providerConfig);
      files.push(...generated);
    }

    return files;
  }

  async plan(providerFilter?: string): Promise<{ plan: PlanResult; formatted: string }> {
    const { config } = this.load();
    let files = this.generateAll(config);

    if (providerFilter) {
      const provider = this.registry.get(providerFilter);
      files = files.filter((f) => f.provider === provider.displayName);
    }

    const plan = computeDiff(files, this.cwd);
    const formatted = formatPlan(plan);
    return { plan, formatted };
  }

  async apply(providerFilter?: string): Promise<ApplyResult> {
    const { config } = this.load();
    let files = this.generateAll(config);

    if (providerFilter) {
      const provider = this.registry.get(providerFilter);
      files = files.filter((f) => f.provider === provider.displayName);
    }

    return writeFiles(files, this.cwd);
  }

  async validate(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const { config } = this.load();
      resolveRules(config.rules);

      const enabled = this.registry.getEnabled(config);
      if (enabled.length === 0) {
        warnings.push("No providers are enabled.");
      }

      // Check for duplicate rule names
      const names = new Set<string>();
      for (const rule of config.rules) {
        if (names.has(rule.name)) {
          errors.push(`Duplicate rule name: "${rule.name}"`);
        }
        names.add(rule.name);
      }
    } catch (err: unknown) {
      errors.push(err instanceof Error ? err.message : String(err));
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async destroy(): Promise<string[]> {
    const { config } = this.load();
    const files = this.generateAll(config);
    const paths = files.map((f) => f.path);
    return destroyFiles(paths, this.cwd);
  }

  getRegistry(): ProviderRegistry {
    return this.registry;
  }

  getConfig(): Config {
    return this.load().config;
  }
}
