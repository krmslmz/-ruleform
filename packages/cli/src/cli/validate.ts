import { Engine } from "../core/engine.js";
import { log } from "../utils/logger.js";
import { t } from "../i18n/index.js";

export async function validateCommand(): Promise<void> {
  try {
    log.info(t("validate.title"));

    const engine = new Engine();
    const result = await engine.validate();

    if (result.valid) {
      log.success(t("validate.syntaxOk"));
      log.success(t("validate.schemaOk"));

      const config = engine.getConfig();
      log.success(t("validate.rulesOk", { count: String(config.rules.length) }));

      const enabledProviders = Object.values(config.providers).filter(
        (p) => p?.enabled
      ).length;
      log.success(t("validate.providersOk", { count: String(enabledProviders) }));
      log.success(t("validate.variablesOk"));

      log.blank();
      log.success(t("validate.success"));
    } else {
      log.error(t("validate.fail"));
      for (const err of result.errors) {
        log.error(`  ${err}`);
      }
      for (const warn of result.warnings) {
        log.warn(`  ${warn}`);
      }
      process.exit(1);
    }
  } catch (err: unknown) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
