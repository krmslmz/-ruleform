import { BaseProvider } from "./base.js";
import { CursorProvider } from "./cursor/index.js";
import { ClaudeProvider } from "./claude/index.js";
import { CopilotProvider } from "./copilot/index.js";
import { WindsurfProvider } from "./windsurf/index.js";
import { GeminiProvider } from "./gemini/index.js";
import type { Config } from "../core/schema.js";
import { t } from "../i18n/index.js";

export class ProviderRegistry {
  private providers = new Map<string, BaseProvider>();

  constructor() {
    this.register(new CursorProvider());
    this.register(new ClaudeProvider());
    this.register(new CopilotProvider());
    this.register(new WindsurfProvider());
    this.register(new GeminiProvider());
  }

  register(provider: BaseProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): BaseProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(t("errors.providerNotFound", { name }));
    }
    return provider;
  }

  getEnabled(config: Config): BaseProvider[] {
    const enabled: BaseProvider[] = [];
    for (const [name, providerConfig] of Object.entries(config.providers)) {
      if (providerConfig?.enabled && this.providers.has(name)) {
        enabled.push(this.providers.get(name)!);
      }
    }
    return enabled;
  }

  listAll(): BaseProvider[] {
    return Array.from(this.providers.values());
  }
}
