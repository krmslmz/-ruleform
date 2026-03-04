import type {
  ResolvedRule,
  RuleScopeType,
  GeneratedFile,
  ProviderConfig,
  Config,
} from "../core/schema.js";

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

  abstract mapScope(scope: RuleScopeType): string;

  getOutputDir(providerConfig: ProviderConfig): string {
    return providerConfig.output ?? this.defaultOutput;
  }

  protected scopeHint(scope: RuleScopeType): string {
    if (scope === "always") return "Always applied";
    if (scope === "manual") return "Manually activated";
    if (scope === "agent-requested") return "Apply when relevant to the task";
    if (typeof scope === "object" && "globs" in scope) {
      return `Apply when working in ${scope.globs.map((g) => `\`${g}\``).join(", ")}`;
    }
    return "";
  }
}
