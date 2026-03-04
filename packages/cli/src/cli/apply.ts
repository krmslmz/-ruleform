import { Engine } from "../core/engine.js";
import { log } from "../utils/logger.js";
import { t } from "../i18n/index.js";

interface ApplyOptions {
  provider?: string;
  yes?: boolean;
}

export async function applyCommand(options: ApplyOptions = {}): Promise<void> {
  try {
    const engine = new Engine();
    const result = await engine.apply(options.provider);

    const totalWritten = result.written.length;
    const totalSkipped = result.skipped.length;

    if (totalWritten === 0 && result.errors.length === 0) {
      log.success(t("apply.noChanges"));
      return;
    }

    log.heading(t("apply.title", { count: String(totalWritten + totalSkipped) }));

    for (const path of result.written) log.written(path);
    for (const path of result.skipped) log.skipped(path);
    for (const { path, error } of result.errors) {
      log.error(t("apply.error", { path, error }));
    }

    const providers = new Set<string>();
    // Count unique providers from written files
    log.blank();

    if (result.errors.length > 0) {
      log.warn(`${result.errors.length} file(s) failed to write.`);
    } else {
      log.success(
        t("apply.success", {
          count: String(totalWritten),
          providerCount: String(totalWritten > 0 ? "multiple" : "0"),
        })
      );
    }
  } catch (err: unknown) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
