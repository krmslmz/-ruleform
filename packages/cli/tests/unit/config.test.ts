import { describe, it, expect } from "vitest";
import { ConfigSchema } from "../../src/core/schema.js";

describe("ConfigSchema", () => {
  it("validates a minimal valid config", () => {
    const config = {
      version: "1",
      project: { name: "test" },
      providers: { cursor: { enabled: true } },
      rules: [
        { name: "general", scope: "always", content: "test content", priority: 1 },
      ],
    };
    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("rejects missing version", () => {
    const config = {
      project: { name: "test" },
      providers: {},
      rules: [{ name: "general", scope: "always", content: "test" }],
    };
    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects empty rules array", () => {
    const config = {
      version: "1",
      project: { name: "test" },
      providers: {},
      rules: [],
    };
    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid rule names", () => {
    const config = {
      version: "1",
      project: { name: "test" },
      providers: {},
      rules: [
        { name: "Invalid Name!", scope: "always", content: "test", priority: 1 },
      ],
    };
    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("accepts valid scope types", () => {
    const scopes = [
      "always",
      "manual",
      "agent-requested",
      { globs: ["src/**"] },
    ];
    for (const scope of scopes) {
      const config = {
        version: "1",
        project: { name: "test" },
        providers: {},
        rules: [{ name: "rule", scope, content: "test", priority: 1 }],
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid scope", () => {
    const config = {
      version: "1",
      project: { name: "test" },
      providers: {},
      rules: [
        { name: "rule", scope: "invalid-scope", content: "test", priority: 1 },
      ],
    };
    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("accepts full config with all fields", () => {
    const config = {
      version: "1",
      project: {
        name: "my-saas",
        description: "A SaaS app",
        stack: ["Next.js", "TypeScript"],
        conventions: { language: "TypeScript", style: "functional", testing: "vitest" },
      },
      providers: {
        cursor: { enabled: true },
        claude: { enabled: true, output: "." },
        copilot: { enabled: false },
        windsurf: { enabled: false },
        gemini: { enabled: false },
      },
      variables: { err: "handle errors" },
      rules: [
        {
          name: "general",
          description: "General style",
          scope: "always",
          priority: 1,
          content: "Be good",
          tags: ["style"],
        },
        {
          name: "api",
          description: "API rules",
          scope: { globs: ["src/api/**"] },
          priority: 10,
          content: "REST only",
          extends: "general",
        },
      ],
      ignore: ["node_modules"],
    };
    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});
