"use client";
import { useI18n } from "@/contexts/I18nProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n";
export function LanguageSelect() {
    const { locale, setLocale, t } = useI18n();
    return <select aria-label={t("lang.label")} value={locale} onChange={(event) => setLocale(event.target.value as Locale)} style={{ maxWidth: 120, padding: "6px", borderRadius: 8, background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border-default)" }}>
    {SUPPORTED_LOCALES.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
  </select>;
}
