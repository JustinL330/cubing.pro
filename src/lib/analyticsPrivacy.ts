/**
 * Only public, fixed routes may be sent to analytics. Never forward raw URLs,
 * search parameters, player IDs, profile paths, forum content or referrers.
 */
const PUBLIC_ANALYTICS_ROUTES = new Set([
  "/",
  "/welcome",
  "/timer",
  "/algs",
  "/wca/players",
  "/wca/wca-comps",
  "/wca/statistics",
  "/changelog",
]);

export function publicAnalyticsPath(pathname: string): string | null {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return PUBLIC_ANALYTICS_ROUTES.has(path) ? path : null;
}

export function validGa4Configuration(
  measurementId: string,
  configuredOrigin: string,
  currentOrigin: string,
): boolean {
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) return false;
  try {
    const configured = new URL(configuredOrigin);
    return (
      configured.protocol === "https:" &&
      configured.origin === configuredOrigin &&
      configured.origin === currentOrigin
    );
  } catch {
    return false;
  }
}

export function safePageLocation(origin: string, pathname: string): string | null {
  const path = publicAnalyticsPath(pathname);
  return path === null ? null : origin + path;
}
