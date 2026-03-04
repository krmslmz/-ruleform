import { Engine } from "../core/engine.js";
import { log } from "../utils/logger.js";
import { t } from "../i18n/index.js";
import chalk from "chalk";

interface PlanOptions {
  provider?: string;
  json?: boolean;
}

export async function planCommand(options: PlanOptions = {}): Promise<void> {
  try {
    const engine = new Engine();
    const { plan, formatted } = await engine.plan(options.provider);

    const totalFiles =
      plan.created.length + plan.updated.length + plan.unchanged.length;
    const providerCount = new Set(
      [...plan.created, ...plan.updated, ...plan.unchanged].map(
        (f) => f.provider
      )
    ).size;

    if (options.json) {
      console.log(JSON.stringify(plan, null, 2));
      return;
    }

    if (
      plan.created.length === 0 &&
      plan.updated.length === 0 &&
      plan.deleted.length === 0
    ) {
      log.success(t("plan.noChanges"));
      return;
    }

    log.heading(
      t("plan.title", {
        fileCount: String(totalFiles),
        providerCount: String(providerCount),
      })
    );

    for (const f of plan.created) log.create(f.path);
    for (const f of plan.updated) log.update(f.path);
    for (const f of plan.unchanged) log.unchanged(f.path);

    log.blank();
    log.info(
      t("plan.summary", {
        created: String(plan.created.length),
        updated: String(plan.updated.length),
        unchanged: String(plan.unchanged.length),
      })
    );
  } catch (err: unknown) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
