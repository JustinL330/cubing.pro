import type { Metadata } from "next";

/**
 * Shared, domain-independent metadata for the two public welcome URLs.
 * Do not add a canonical URL until the fork's production hostname is verified.
 */
const homepageTitle = "魔方练习与社区工具";
const homepageDescription =
  "Cubing Pro 提供魔方计时与打乱练习、WCA 选手和赛事查询、公式资料及魔方社区工具。本站并非 WCA 官方网站。";

export const homepageMetadata: Metadata = {
  title: homepageTitle,
  description: homepageDescription,
  openGraph: {
    type: "website",
    title: homepageTitle,
    description: homepageDescription,
  },
};
