import { describe, it, expect } from "vitest";
import { resolveRules } from "../../src/core/resolver.js";
import type { Rule } from "../../src/core/schema.js";

describe("resolveRules", () => {
  it("sorts rules by priority", () => {
    const rules: Rule[] = [
      { name: "b", scope: "always", content: "B", priority: 20 },
      { name: "a", scope: "always", content: "A", priority: 1 },
      { name: "c", scope: "always", content: "C", priority: 10 },
    ];
    const resolved = resolveRules(rules);
    expect(resolved.map((r) => r.name)).toEqual(["a", "c", "b"]);
  });

  it("resolves single-level extends", () => {
    const rules: Rule[] = [
      { name: "parent", scope: "always", content: "Parent content", priority: 1 },
      { name: "child", scope: "always", content: "Child content", priority: 2, extends: "parent" },
    ];
    const resolved = resolveRules(rules);
    const child = resolved.find((r) => r.name === "child")!;
    expect(child.content).toContain("Parent content");
    expect(child.content).toContain("Child content");
    expect(child.sourceRules).toEqual(["parent", "child"]);
  });

  it("resolves multi-level extends", () => {
    const rules: Rule[] = [
      { name: "grandparent", scope: "always", content: "GP", priority: 1 },
      { name: "parent", scope: "always", content: "P", priority: 2, extends: "grandparent" },
      { name: "child", scope: "always", content: "C", priority: 3, extends: "parent" },
    ];
    const resolved = resolveRules(rules);
    const child = resolved.find((r) => r.name === "child")!;
    expect(child.content).toContain("GP");
    expect(child.content).toContain("P");
    expect(child.content).toContain("C");
  });

  it("throws on circular extends", () => {
    const rules: Rule[] = [
      { name: "a", scope: "always", content: "A", priority: 1, extends: "b" },
      { name: "b", scope: "always", content: "B", priority: 2, extends: "a" },
    ];
    expect(() => resolveRules(rules)).toThrow();
  });

  it("throws on missing extends target", () => {
    const rules: Rule[] = [
      { name: "child", scope: "always", content: "C", priority: 1, extends: "nonexistent" },
    ];
    expect(() => resolveRules(rules)).toThrow();
  });
});
