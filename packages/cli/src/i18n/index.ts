import en from "./en.json" with { type: "json" };
import tr from "./tr.json" with { type: "json" };

type Messages = typeof en;
type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type MessageKey = NestedKeyOf<Messages>;

const locales: Record<string, Messages> = { en, tr };

let currentLocale = "en";

export function setLocale(locale: string): void {
  if (locales[locale]) {
    currentLocale = locale;
  }
}

export function getLocale(): string {
  return currentLocale;
}

export function detectLocale(): string {
  const env =
    process.env.RULEFORM_LANG ||
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    "en";
  const lang = env.split(/[._-]/)[0]?.toLowerCase() ?? "en";
  return locales[lang] ? lang : "en";
}

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function t(
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const msg =
    getNestedValue(locales[currentLocale], key) ??
    getNestedValue(locales.en, key) ??
    key;

  if (!vars) return msg;

  return msg.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    vars[name] != null ? String(vars[name]) : `{{${name}}}`
  );
}
