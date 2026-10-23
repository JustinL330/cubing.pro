import type { WCAPerson } from "@/services/cubing-pro/wca/types";

export const WCA_SEARCH_RESULT_LIMITS = [10, 25, 50, 100] as const;
export const DEFAULT_WCA_SEARCH_RESULT_LIMIT = 25;

/** Use an ISO2 code when possible, falling back to the WCA country ID. */
export function getWcaSearchCountryKey(
  player: Pick<WCAPerson, "iso2" | "country_id">,
): string {
  return (player.iso2?.trim() || player.country_id?.trim() || "").toUpperCase();
}

/** Country options are built from the full response, before limiting the view. */
export function getWcaSearchCountries(
  players: readonly WCAPerson[],
): string[] {
  return [...new Set(players.map(getWcaSearchCountryKey).filter(Boolean))].sort();
}

/** Client-side filtering; never mutates the API response. */
export function filterWcaSearchResults(
  players: readonly WCAPerson[],
  countryKey: string,
  limit: number,
): WCAPerson[] {
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(100, Math.floor(limit)))
    : DEFAULT_WCA_SEARCH_RESULT_LIMIT;
  const normalizedCountry = countryKey.trim().toUpperCase();
  const filtered = normalizedCountry
    ? players.filter((player) => getWcaSearchCountryKey(player) === normalizedCountry)
    : players;
  return filtered.slice(0, safeLimit);
}
