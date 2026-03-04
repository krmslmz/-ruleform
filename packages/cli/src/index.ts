import { Command } from "commander";
import { detectLocale, setLocale } from "./i18n/index.js";
import { initCommand } from "./cli/init.js";
import { planCommand } from "./cli/plan.js";
import { applyCommand } from "./cli/apply.js";
import { validateCommand } from "./cli/validate.js";
import { providersCommand } from "./cli/providers.js";
import { destroyCommand } from "./cli/destroy.js";

// Auto-detect locale
setLocale(detectLocale());

const program = new Command();

program
  .name("ruleform")
  .description(
    "Terraform for AI coding rules. Write once, deploy to every AI tool."
  )
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new ruleform.yaml in the current directory")
  .option("-f, --force", "Overwrite existing ruleform.yaml")
  .option("--blank", "Create minimal config without auto-detection")
  .action(async (opts) => {
    await initCommand(opts);
  });

program
  .command("plan")
  .description("Show what changes would be applied (dry-run)")
  .option("-p, --provider <name>", "Only plan for specific provider")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await planCommand(opts);
  });

program
  .command("apply")
  .description("Generate and write all context files")
  .option("-p, --provider <name>", "Only apply for specific provider")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (opts) => {
    await applyCommand(opts);
  });

program
  .command("validate")
  .description("Validate ruleform.yaml without generating files")
  .action(async () => {
    await validateCommand();
  });

program
  .command("providers")
  .description("List available providers and their status")
  .action(async () => {
    await providersCommand();
  });

program
  .command("destroy")
  .description("Remove all RuleForm-generated files")
  .option("-y, --yes", "Skip confirmation")
  .action(async (opts) => {
    await destroyCommand(opts);
  });

program.parse();
