"use client";
import { LuLanguages } from "react-icons/lu";
import { useI18n } from "@/contexts/I18nProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n";
export function LanguageSelect() {
    const { locale, setLocale, t } = useI18n();
    return <span style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
    <LuLanguages aria-hidden="true" size={20} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--foreground)" }} />
    <select aria-label={t("lang.label")} value={locale} onChange={(event) => setLocale(event.target.value as Locale)} style={{ maxWidth: 170, minWidth: 130, padding: "6px 8px 6px 36px", borderRadius: 8, background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border-default)" }}>
    {SUPPORTED_LOCALES.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
  </select></span>;
}
