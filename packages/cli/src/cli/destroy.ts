import { Engine } from "../core/engine.js";
import { log } from "../utils/logger.js";
import { t } from "../i18n/index.js";

interface DestroyOptions {
  yes?: boolean;
}

export async function destroyCommand(options: DestroyOptions = {}): Promise<void> {
  try {
    log.info(t("destroy.title"));

    const engine = new Engine();
    const removed = await engine.destroy();

    if (removed.length === 0) {
      log.info(t("destroy.nothing"));
      return;
    }

    for (const path of removed) {
      log.removed(path);
    }

    log.blank();
    log.success(t("destroy.success", { count: String(removed.length) }));
  } catch (err: unknown) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
