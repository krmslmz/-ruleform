import type { Rule, ResolvedRule, RuleScopeType } from "./schema.js";
import { t } from "../i18n/index.js";

export function resolveRules(rules: Rule[]): ResolvedRule[] {
  const ruleMap = new Map<string, Rule>();
  for (const rule of rules) {
    ruleMap.set(rule.name, rule);
  }

  const resolved = new Map<string, ResolvedRule>();

  function resolve(rule: Rule, chain: string[] = []): ResolvedRule {
    if (resolved.has(rule.name)) return resolved.get(rule.name)!;

    if (chain.includes(rule.name)) {
      throw new Error(
        t("errors.circularExtends", { chain: [...chain, rule.name].join(" → ") })
      );
    }

    let content = rule.content;
    const sourceRules = [rule.name];

    if (rule.extends) {
      const parent = ruleMap.get(rule.extends);
      if (!parent) {
        throw new Error(
          t("errors.missingExtends", { rule: rule.name, parent: rule.extends })
        );
      }

      const parentResolved = resolve(parent, [...chain, rule.name]);
      content = `${parentResolved.content}\n\n${content}`;
      sourceRules.unshift(...parentResolved.sourceRules);
    }

    const resolvedRule: ResolvedRule = {
      name: rule.name,
      description: rule.description,
      scope: rule.scope as RuleScopeType,
      priority: rule.priority,
      content,
      tags: rule.tags,
      sourceRules,
    };

    resolved.set(rule.name, resolvedRule);
    return resolvedRule;
  }

  for (const rule of rules) {
    resolve(rule);
  }

  return Array.from(resolved.values()).sort((a, b) => a.priority - b.priority);
}
