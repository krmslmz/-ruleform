import chalk from "chalk";

export const log = {
  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
  success: (msg: string) => console.log(chalk.green("✓"), msg),
  warn: (msg: string) => console.log(chalk.yellow("⚠"), msg),
  error: (msg: string) => console.error(chalk.red("✗"), msg),
  dim: (msg: string) => console.log(chalk.dim(msg)),
  blank: () => console.log(),
  heading: (msg: string) => console.log(chalk.bold.cyan(`\n  ${msg}\n`)),
  create: (path: string) => console.log(chalk.green("  +"), path, chalk.dim("(CREATE)")),
  update: (path: string) => console.log(chalk.yellow("  ~"), path, chalk.dim("(UPDATE)")),
  unchanged: (path: string) => console.log(chalk.dim("  ="), path, chalk.dim("(UNCHANGED)")),
  written: (path: string) => console.log(chalk.green("  ✓"), path),
  skipped: (path: string) => console.log(chalk.dim("  ="), path, chalk.dim("(unchanged)")),
  removed: (path: string) => console.log(chalk.red("  -"), path),
};
