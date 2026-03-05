# 🔧 RuleForm

**Terraform for AI coding rules. Write once, deploy to every AI tool.**

[![npm version](https://img.shields.io/npm/v/ruleform.svg)](https://www.npmjs.com/package/ruleform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

You use multiple AI coding tools. Each needs its own config file:

```
.cursor/rules/*.mdc          ← Cursor
CLAUDE.md                     ← Claude Code
.github/copilot-instructions.md  ← GitHub Copilot
.windsurf/rules/*.md          ← Windsurf
.gemini/settings.json         ← Gemini Code Assist
```

When rules change, you update one file and forget the others. Your AI tools give inconsistent results. Teams with mixed tooling have it even worse.

## The Solution

```bash
# Define your rules once
ruleform init

# See what will be generated
ruleform plan

# Deploy to all your AI tools
ruleform apply
```

One config → every AI tool. Like Terraform, but for coding rules.

## Quick Start

```bash
# Install
npm install -g ruleform

# Initialize in your project
cd my-project
ruleform init

# Edit ruleform.yaml with your rules, then:
ruleform apply
```

## Config Example

```yaml
version: "1"

project:
  name: "my-saas"
  stack:
    - "Next.js 15"
    - "TypeScript"
    - "Prisma"

providers:
  cursor:
    enabled: true
  claude:
    enabled: true
  copilot:
    enabled: true

rules:
  - name: "code-style"
    description: "General coding conventions"
    scope: always
    content: |
      - Use functional components
      - Prefer named exports
      - TypeScript strict mode

  - name: "api-design"
    description: "API route conventions"
    scope:
      globs: ["src/app/api/**"]
    content: |
      - RESTful conventions
      - Validate inputs with Zod
      - Return { data, error } format
```

## Commands

| Command | Description |
|---------|-------------|
| `ruleform init` | Create `ruleform.yaml` with auto-detected settings |
| `ruleform plan` | Preview changes (dry-run) |
| `ruleform apply` | Generate and write all context files |
| `ruleform validate` | Check config for errors |
| `ruleform providers` | List available providers and status |
| `ruleform destroy` | Remove all RuleForm-generated files |

## Supported Providers

| Provider | Output | Scopes |
|----------|--------|--------|
| **Cursor** | `.cursor/rules/*.mdc` | ✅ always, globs, agent-requested, manual |
| **Claude Code** | `CLAUDE.md` | ✅ Scope hints as comments |
| **GitHub Copilot** | `.github/copilot-instructions.md` | All rules included |
| **Windsurf** | `.windsurf/rules/*.md` | ✅ Scope hints |
| **Gemini** | `.gemini/settings.json` + rules | ✅ Style guides |

## Scope Types

| Scope | Meaning | Cursor Mapping |
|-------|---------|----------------|
| `always` | Applied to every request | `alwaysApply: true` |
| `agent-requested` | AI decides when to apply | `alwaysApply: false` |
| `manual` | User must explicitly tag | `alwaysApply: false` |
| `globs` | Applied to matching files | `globs: [...]` |

## i18n

RuleForm supports multiple languages. Set your locale:

```bash
# Auto-detected from system locale, or:
export RULEFORM_LANG=tr   # Turkish
export RULEFORM_LANG=en   # English
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Adding a new provider

1. Create `src/providers/yourprovider/index.ts`
2. Extend `BaseProvider`
3. Register in `src/providers/registry.ts`
4. Add tests in `tests/unit/providers/`

## License

MIT © [Kerem Solmaz](https://github.com/keremsolmaz)

> *Disclaimer: Terraform is a registered trademark of HashiCorp. RuleForm is not affiliated with, endorsed by, or sponsored by HashiCorp.*

---

**Website:** [ruleform.app](https://ruleform.app)
