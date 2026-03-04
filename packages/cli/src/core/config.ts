import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import yaml from "js-yaml";
import { ConfigSchema, type Config } from "./schema.js";
import { t } from "../i18n/index.js";

const CONFIG_NAMES = ["ruleform.yaml", "ruleform.yml"];

export function findConfig(cwd?: string): string {
  let dir = resolve(cwd ?? process.cwd());
  const root = dirname(dir);

  while (true) {
    for (const name of CONFIG_NAMES) {
      const configPath = join(dir, name);
      if (existsSync(configPath)) return configPath;
    }
    const parent = dirname(dir);
    if (parent === dir || dir === root) break;
    dir = parent;
  }

  throw new Error(t("errors.configNotFound"));
}

export function loadConfig(configPath: string): Config {
  const raw = readFileSync(configPath, "utf-8");

  let parsed: unknown;
  try {
    parsed = yaml.load(raw);
  } catch (err: unknown) {
    const yamlErr = err as { mark?: { line?: number }; message?: string };
    throw new Error(
      t("errors.yamlParse", {
        line: String(yamlErr.mark?.line ?? "?"),
        message: yamlErr.message ?? "Unknown error",
      })
    );
  }

  const result = ConfigSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`${t("errors.validation")}\n${issues}`);
  }

  return resolveVariables(result.data);
}

export function resolveVariables(config: Config): Config {
  const variables = config.variables ?? {};
  const resolved = { ...config };

  resolved.rules = config.rules.map((rule) => {
    let content = rule.content;
    const seen = new Set<string>();

    const resolve = (text: string, depth = 0): string => {
      if (depth > 10) return text;
      return text.replace(/\{\{variables\.(\w+)\}\}/g, (match, name: string) => {
        if (seen.has(name)) return match;
        if (!(name in variables)) {
          throw new Error(
            t("errors.missingVariable", { name, rule: rule.name })
          );
        }
        seen.add(name);
        return resolve(variables[name]!, depth + 1);
      });
    };

    content = resolve(content);
    return { ...rule, content };
  });

  return resolved;
}
