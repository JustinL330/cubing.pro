"use client";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nProvider";
import { practiceCopy } from "./copy";
import css from "./Practice.module.css";
export function PracticeHub() {
    const { locale, t } = useI18n();
    const c = practiceCopy(locale);
    return <section className={css.page} style={{ width: "100%" }}>
    <div className={css.hero}><p className={css.eyebrow}>Cubing Pro · Practice & Learn</p><h1 className={css.title}>{c.title}</h1><p className={css.muted}>{c.intro}</p>
    <div className={css.grid} style={{ marginTop: 28 }}>
      <Link className={`${css.card} ${css.link}`} href="/timer"><p className={css.eyebrow}>01 / PRACTICE</p><h2 className={css.heading}>{c.timer} →</h2><p className={css.muted}>{c.timerInfo}</p></Link>
      <Link className={`${css.card} ${css.link}`} href="/algs"><p className={css.eyebrow}>02 / LEARN</p><h2 className={css.heading}>{t("nav.algs")} →</h2><p className={css.muted}>{c.learnInfo}</p></Link>
    </div></div>
  </section>;
}
