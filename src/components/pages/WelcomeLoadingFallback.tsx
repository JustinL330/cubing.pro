import Link from "next/link";

/**
 * Meaningful HTML while the client-heavy welcome view streams.
 *
 * The welcome page currently suspends during server rendering. A null
 * Suspense fallback left the initial <main> empty for crawlers and
 * no-JavaScript visitors, despite correct metadata.
 */
export function WelcomeLoadingFallback() {
  return (
    <section aria-labelledby="welcome-loading-heading" style={{ padding: "1.5rem 0" }}>
      <h1 id="welcome-loading-heading">魔方练习与社区工具</h1>
      <p>
        在 Cubing Pro 使用魔方计时器进行打乱练习，浏览 WCA 选手与赛事资料，
        并查找魔方公式。本站并非 WCA 官方网站。
      </p>
      <p lang="en">
        Practice with a cube timer and scrambles, browse WCA competitors and
        events, and find algorithms. This is not an official WCA website.
      </p>
      <nav aria-label="常用工具 / Popular tools">
        <ul>
          <li><Link href="/timer">魔方计时器 / <span lang="en">Cube timer</span></Link></li>
          <li><Link href="/algs">魔方公式 / <span lang="en">Algorithms</span></Link></li>
          <li><Link href="/wca/players">WCA 选手搜索 / <span lang="en">Player search</span></Link></li>
        </ul>
      </nav>
      <noscript>
        <p>
          互动工具需要 JavaScript；未启用时仍可浏览上方公开链接。
          <span lang="en"> Interactive tools require JavaScript; public links remain available.</span>
        </p>
      </noscript>
    </section>
  );
}
