import type { WCAPerson } from "@/services/cubing-pro/wca/types";

export const WCA_SEARCH_PREVIEW_LIMIT = 20;
export const WCA_SEARCH_NARROW_THRESHOLD = 100;

export type WcaSearchResultPolicy = "show" | "confirm" | "narrow";

/** Use the ISO2 code where available, otherwise the WCA country identifier. */
export function getWcaSearchCountryKey(
  player: Pick<WCAPerson, "iso2" | "country_id">,
): string {
  return (player.iso2?.trim() || player.country_id?.trim() || "").toUpperCase();
}

/** Country choices are derived only from the current API response. */
export function getWcaSearchCountries(players: readonly WCAPerson[]): string[] {
  return [...new Set(players.map(getWcaSearchCountryKey).filter(Boolean))].sort();
}

/** This filters returned players; it does not search the entire WCA database. */
export function filterWcaSearchResults(
  players: readonly WCAPerson[],
  countryKey: string,
): WCAPerson[] {
  const selected = countryKey.trim().toUpperCase();
  return selected
    ? players.filter((player) => getWcaSearchCountryKey(player) === selected)
    : [...players];
}

export function getWcaSearchResultPolicy(total: number): WcaSearchResultPolicy {
  if (total > WCA_SEARCH_NARROW_THRESHOLD) return "narrow";
  if (total > WCA_SEARCH_PREVIEW_LIMIT) return "confirm";
  return "show";
}

export function getVisibleWcaSearchResults(
  players: readonly WCAPerson[],
  showAll: boolean,
): WCAPerson[] {
  const policy = getWcaSearchResultPolicy(players.length);
  if (policy === "narrow") return [];
  if (policy === "confirm" && !showAll) return players.slice(0, WCA_SEARCH_PREVIEW_LIMIT);
  return [...players];
}

/**
 * Prefer the active UI language for ISO2 country names. Unlike the legacy
 * country-name helper, this does not force Chinese labels in English/Japanese
 * and other non-Chinese interfaces. Unknown WCA country IDs remain readable.
 */
export function getWcaSearchCountryLabel(
  iso2: string | undefined | null,
  countryId: string | undefined | null,
  locale: string,
): string {
  const code = iso2?.trim().toUpperCase() ?? "";
  if (/^[A-Z]{2}$/.test(code)) {
    try {
      const label = new Intl.DisplayNames([locale], { type: "region" }).of(code);
      if (label && label !== code) return label;
    } catch {
      // Intl.DisplayNames may not be available in older browsers.
    }
  }
  return countryId?.trim() || code || "";
}
