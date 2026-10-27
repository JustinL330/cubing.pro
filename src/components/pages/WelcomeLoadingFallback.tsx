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
      <nav aria-label="常用工具">
        <ul>
          <li><a href="/timer">魔方计时器</a></li>
          <li><a href="/algs">魔方公式</a></li>
          <li><a href="/wca/players">WCA 选手搜索</a></li>
        </ul>
      </nav>
    </section>
  );
}
