import { extraCatalogs } from "./extra-catalogs";
import enUS from "@/i18n/messages/en-US";
import zhCN, { type MessageKey } from "@/i18n/messages/zh-CN";

export type Locale = "zh-CN" | "zh-TW" | "en-US" | "ja-JP" | "es-ES";

export const LOCALE_STORAGE_KEY = "cubing_pro_locale";

export const SUPPORTED_LOCALES: {
  key: Locale;
  labelKey: MessageKey;
  flag: string;
  name: string;
}[] = [
  { key: "zh-CN", labelKey: "lang.zh", flag: "cn", name: "简体中文" },
  { key: "en-US", labelKey: "lang.en", flag: "us", name: "English" },
  { key: "zh-TW", labelKey: "lang.label", flag: "tw", name: "繁體中文" },
  { key: "ja-JP", labelKey: "lang.label", flag: "jp", name: "日本語" },
  { key: "es-ES", labelKey: "lang.label", flag: "es", name: "Español" },
];

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "zh-TW": { ...enUS, ...extraCatalogs["zh-TW"] },
  "ja-JP": { ...enUS, ...extraCatalogs["ja-JP"] },
  "es-ES": { ...enUS, ...extraCatalogs["es-ES"] },
};

export function translate(locale: Locale, key: MessageKey): string {
  return catalogs[locale][key] ?? catalogs["zh-CN"][key] ?? key;
}

export function translateWithParams(
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number>,
): string {
  let text = translate(locale, key);
  for (const [name, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
  }
  return text;
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh-CN";
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (SUPPORTED_LOCALES.some((item) => item.key === raw)) return raw as Locale;
  } catch { /* Storage can be disabled in private browsers. */ }
  const language = navigator.language.toLowerCase();
  if (/^zh-(tw|hk|mo|hant)/.test(language)) return "zh-TW";
  if (language.startsWith("zh")) return "zh-CN";
  if (language.startsWith("ja")) return "ja-JP";
  if (language.startsWith("es")) return "es-ES";
  return "en-US";
}

export function writeStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* Keep in-memory choice. */ }
}

export type { MessageKey };
