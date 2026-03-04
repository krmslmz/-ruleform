import { Engine } from "../core/engine.js";
import { log } from "../utils/logger.js";
import { t } from "../i18n/index.js";
import chalk from "chalk";

export async function providersCommand(): Promise<void> {
  try {
    const engine = new Engine();
    const registry = engine.getRegistry();
    const all = registry.listAll();

    let config;
    try {
      config = engine.getConfig();
    } catch {
      config = null;
    }

    log.heading(t("providers.title"));

    console.log(
      chalk.dim(
        "  Provider".padEnd(22) + "Status".padEnd(10) + "Output"
      )
    );
    console.log(chalk.dim("  " + "─".repeat(55)));

    for (const provider of all) {
      const isEnabled =
        config?.providers[provider.name as keyof typeof config.providers]
          ?.enabled ?? false;

      const status = isEnabled
        ? chalk.green(t("providers.on"))
        : chalk.dim(t("providers.off"));

      const providerConfig =
        config?.providers[provider.name as keyof typeof config.providers];
      const output = providerConfig?.output ?? provider.defaultOutput;

      console.log(
        `  ${provider.displayName.padEnd(20)} ${status.padEnd(18)} ${chalk.dim(output)}`
      );
    }

    log.blank();
  } catch (err: unknown) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
