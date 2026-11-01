"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { publicAnalyticsPath, safePageLocation, validGa4Configuration } from "@/lib/analyticsPrivacy";
import { analyticsCopy } from "./analyticsCopy";

type Consent = "unset" | "granted" | "denied";
type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

const CONSENT_KEY = "cubing_pro_analytics_consent_v1";
const CONSENT_EVENT = "cubing-pro-analytics-consent";
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "";
let scriptAdded = false;

// Once the Google library is loaded it may retain automatic listeners.
// A hard reload is required to guarantee that private pages and a revoked
// session no longer run the previously injected analytics code.
function unloadActiveAnalytics() {
  if (!scriptAdded) return;
  const w = window as AnalyticsWindow;
  w.gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.location.reload();
}

function isConfigured(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    typeof window !== "undefined" &&
    validGa4Configuration(MEASUREMENT_ID, SITE_ORIGIN, window.location.origin)
  );
}

function readConsent(): Consent {
  if (typeof window === "undefined") return "unset";
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored === "granted" || stored === "denied" ? stored : "unset";
  } catch {
    return "unset";
  }
}

function saveConsent(choice: Exclude<Consent, "unset">) {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // The current tab can still honor the decision if storage is disabled.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
  if (choice === "denied") unloadActiveAnalytics();
}

function useAnalyticsConsent(): [Consent, (choice: Exclude<Consent, "unset">) => void] {
  const [choice, setChoice] = useState<Consent>("unset");

  useEffect(() => {
    setChoice(readConsent());
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<Consent>).detail;
      if (next === "granted" || next === "denied") setChoice(next);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage ||
          (event.key !== CONSENT_KEY && event.key !== null)) return;
      const next = readConsent();
      setChoice(next);
      // Consent is shared between tabs. Revoke immediately in every open tab.
      if (next !== "granted") unloadActiveAnalytics();
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return [choice, saveConsent];
}

function ensureScript(pageLocation: string) {
  const w = window as AnalyticsWindow;
  if (scriptAdded) return;
  scriptAdded = true;

  w.dataLayer = w.dataLayer ?? [];
  w.gtag = w.gtag ?? ((...args: unknown[]) => { w.dataLayer?.push(args); });

  // Consent is denied by default, even while the async library loads.
  w.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  w.gtag("set", {
    page_location: pageLocation,
    page_referrer: "",
    page_title: "Cubing Pro",
  });
  w.gtag("js", new Date());
  w.gtag("config", MEASUREMENT_ID, {
    send_page_view: false,
    page_location: pageLocation,
    page_referrer: "",
    page_title: "Cubing Pro",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  script.dataset.cubingAnalytics = "true";
  document.head.appendChild(script);
}

export function Ga4Analytics() {
  const pathname = usePathname() ?? "/";
  const { locale } = useI18n();
  const [consent, setConsent] = useAnalyticsConsent();
  const lastPath = useRef<string | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => { setAvailable(isConfigured()); }, []);

  useEffect(() => {
    if (!available) return;
    const path = publicAnalyticsPath(pathname);
    const w = window as AnalyticsWindow;
    if (consent !== "granted" || path === null) {
      // Stop collection on private/account pages and immediately after revocation.
      w.gtag?.("consent", "update", { analytics_storage: "denied" });
      lastPath.current = null;
      // A previously loaded Google tag can retain history listeners. Do not
      // carry it into account, settings or private routes after SPA navigation.
      if (path === null) unloadActiveAnalytics();
      return;
    }
    const pageLocation = safePageLocation(SITE_ORIGIN, path);
    if (!pageLocation) return;
    ensureScript(pageLocation);
    w.gtag?.("consent", "update", { analytics_storage: "granted" });
    if (lastPath.current === path) return;
    lastPath.current = path;
    // Never include query strings, dynamic page titles, raw referrers or user IDs.
    w.gtag?.("event", "page_view", {
      page_location: pageLocation,
      page_referrer: "",
      page_title: "Cubing Pro",
      send_to: MEASUREMENT_ID,
    });
  }, [available, consent, pathname]);

  if (!available || consent !== "unset" || publicAnalyticsPath(pathname) === null) {
    return null;
  }

  const copy = analyticsCopy[locale];
  return (
    <aside
      aria-label={copy.heading}
      style={{
        position: "fixed", zIndex: 2000, bottom: 16, right: 16, left: 16,
        maxWidth: 460, marginLeft: "auto", padding: 18, borderRadius: 12,
        background: "var(--card, #fff)", color: "var(--foreground, #111)",
        border: "1px solid var(--border-default, #aaa)", boxShadow: "0 6px 28px #0003",
      }}
    >
      <strong>{copy.heading}</strong>
      <p style={{ marginTop: 8, marginBottom: 12, fontSize: 14 }}>{copy.description}</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setConsent("granted")}
          style={{ border: "1px solid currentColor", borderRadius: 8, padding: "8px 14px" }}>
          {copy.allow}
        </button>
        <button type="button" onClick={() => setConsent("denied")}
          style={{ border: "1px solid currentColor", borderRadius: 8, padding: "8px 14px" }}>
          {copy.deny}
        </button>
      </div>
    </aside>
  );
}

export function AnalyticsPreferences() {
  const { locale } = useI18n();
  const [consent, setConsent] = useAnalyticsConsent();
  const copy = analyticsCopy[locale];
  const [configured, setConfigured] = useState(false);
  useEffect(() => { setConfigured(isConfigured()); }, []);

  return (
    <section aria-label={copy.heading} style={{ padding: 16, border: "1px solid var(--border-default, #aaa)", borderRadius: 10 }}>
      <h2 style={{ fontWeight: 700, marginBottom: 8 }}>{copy.heading}</h2>
      <p style={{ fontSize: 14, marginBottom: 10 }}>{copy.description}</p>
      <p style={{ fontSize: 14, marginBottom: 10 }} aria-live="polite">
        {!configured ? copy.unavailable : consent === "granted" ? copy.enabled : copy.disabled}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" aria-pressed={configured && consent === "granted"} disabled={!configured} onClick={() => { if (configured) setConsent("granted"); }}
          style={{ border: "1px solid currentColor", borderRadius: 8, padding: "8px 14px" }}>
          {copy.allow}
        </button>
        <button type="button" aria-pressed={configured && consent === "denied"} disabled={!configured} onClick={() => { if (configured) setConsent("denied"); }}
          style={{ border: "1px solid currentColor", borderRadius: 8, padding: "8px 14px" }}>
          {copy.deny}
        </button>
      </div>
    </section>
  );
}
