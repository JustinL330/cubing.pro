"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { practiceCopy } from "./copy";
import { average, format, value, type Solve, type Penalty } from "./timer-model";
import css from "./Practice.module.css";
const puzzles = ["222", "333", "444", "555", "666", "777", "pyram", "skewb", "sq1", "clock", "minx"] as const;
type Mode = "idle" | "armed" | "inspection" | "running";
export function Timer() {
    const { locale } = useI18n();
    const c = practiceCopy(locale);
    const pageRef = useRef<HTMLElement>(null);
    const [historyOffset, setHistoryOffset] = useState(0);
    useLayoutEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        const previous = [root.style.overflow, body.style.overflow, root.style.overscrollBehavior, body.style.overscrollBehavior];
        const originalScroll = window.scrollY;
        const previousTimerFlag = root.getAttribute("data-practice-timer");
        root.setAttribute("data-practice-timer", "");
        root.style.overflow = body.style.overflow = "hidden";
        root.style.overscrollBehavior = body.style.overscrollBehavior = "none";
        window.scrollTo(0, 0);
        const fit = () => {
            if (pageRef.current)
                pageRef.current.style.setProperty("--timer-height", Math.max(0, (window.visualViewport?.height ?? window.innerHeight) - pageRef.current.getBoundingClientRect().top - 8) + "px");
        };
        fit();
        const observer = new ResizeObserver(fit);
        const header = document.querySelector("[data-app-header]");
        if (header) observer.observe(header);
        observer.observe(body);
        window.addEventListener("resize", fit);
        window.visualViewport?.addEventListener("resize", fit);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", fit);
            window.visualViewport?.removeEventListener("resize", fit);
            [root.style.overflow, body.style.overflow, root.style.overscrollBehavior, body.style.overscrollBehavior] = previous;
            if (previousTimerFlag === null) root.removeAttribute("data-practice-timer");
            else root.setAttribute("data-practice-timer", previousTimerFlag);
            window.scrollTo(0, originalScroll);
        };
    }, []);
    const [solves, setSolves] = useState<Solve[]>([]);
    const [puzzle, setPuzzle] = useState<typeof puzzles[number]>("333");
    const [session, setSession] = useState("1");
    useEffect(() => { setHistoryOffset(0); }, [puzzle, session]);
    const [scramble, setScramble] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [inspection, setInspection] = useState(false);
    const [mode, setModeState] = useState<Mode>("idle");
    const [elapsed, setElapsed] = useState(0);
    const modeRef = useRef<Mode>("idle");
    const since = useRef(0);
    const inspectionStart = useRef(0);
    const penalty = useRef<Penalty>("none");
    const generation = useRef(0);
    const held = useRef(false);
    const armTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const setMode = (next: Mode) => { modeRef.current = next; setModeState(next); };
    const generate = useCallback(async () => {
        const id = ++generation.current;
        setLoading(true);
        setScramble("");
        setError("");
        try {
            const { randomScrambleForEvent } = await import("cubing/scramble");
            const result = await randomScrambleForEvent(puzzle);
            if (id === generation.current)
                setScramble(result.toString());
        }
        catch {
            if (id === generation.current)
                setError("scramble");
        }
        finally {
            if (id === generation.current)
                setLoading(false);
        }
    }, [puzzle]);
    useEffect(() => { const counter = generation; void generate(); return () => { counter.current++; }; }, [generate]);
    useEffect(() => {
        if (mode !== "running" && mode !== "inspection")
            return;
        let frame: number;
        const tick = () => { setElapsed(performance.now() - since.current); frame = requestAnimationFrame(tick); };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [mode]);
    const begin = useCallback(() => {
        if (!scramble || loading)
            return;
        const now = performance.now();
        if (inspection && modeRef.current !== "inspection") {
            inspectionStart.current = now;
            since.current = now;
            setElapsed(0);
            setMode("inspection");
            return;
        }
        const observed = modeRef.current === "inspection" ? now - inspectionStart.current : 0;
        penalty.current = observed >= 17000 ? "DNF" : observed >= 15000 ? "+2" : "none";
        since.current = now;
        setElapsed(0);
        setMode("running");
    }, [scramble, loading, inspection]);
    const stop = useCallback(() => {
        const ms = performance.now() - since.current;
        setElapsed(ms);
        setMode("idle");
        setHistoryOffset(0);
        setSolves(prev => [...prev, { id: crypto.randomUUID(), ms, penalty: penalty.current, scramble, puzzle, session, date: new Date().toISOString() }]);
        void generate();
    }, [scramble, puzzle, session, generate]);
    useEffect(() => {
        const clearHold = () => { held.current = false; if (armTimeout.current)
            clearTimeout(armTimeout.current); if (modeRef.current === "armed")
            setMode("idle"); };
        const down = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLElement && (e.target.matches("input, textarea, select, button, a") || e.target.isContentEditable))
                return;
            if (e.code === "Escape") {
                clearHold();
                setMode("idle");
                setElapsed(0);
                return;
            }
            if (e.code !== "Space")
                return;
            e.preventDefault();
            if (e.repeat || held.current)
                return;
            held.current = true;
            if (modeRef.current === "running") {
                stop();
                return;
            }
            if (modeRef.current === "inspection") {
                begin();
                return;
            }
            if (!loading && scramble)
                armTimeout.current = setTimeout(() => { if (held.current)
                    setMode("armed"); }, 300);
        };
        const up = (e: KeyboardEvent) => { if (e.code !== "Space")
            return; if (held.current) {
            e.preventDefault();
            if (modeRef.current === "armed")
                begin();
            clearHold();
        } };
        const blur = () => clearHold();
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        window.addEventListener("blur", blur);
        return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); clearHold(); };
    }, [begin, stop, loading, scramble]);
    const current = solves.filter(s => s.puzzle === puzzle && s.session === session);
    const active = mode !== "idle";
    const best = current.length ? format(Math.min(...current.map(value))) : "—";
    const shownOffset = Math.min(historyOffset, Math.max(0, current.length - 1));
    const shown = current[current.length - 1 - shownOffset];
    return <section ref={pageRef} className={css.timerPage} data-timer-page>
    <div className={css.timerHeading}><h1 className={css.heading}>{c.timer}</h1><p className={css.muted}>{c.local}</p></div>
    <div className={css.timerWorkspace}>
    <div className={css.timerMain}>
    <div className={css.row}>
      <label>{c.event} <select className={css.select} value={puzzle} disabled={active} onChange={e => setPuzzle(e.target.value as typeof puzzle)}>{puzzles.map(p => <option key={p}>{p}</option>)}</select></label>
      <label>{c.session} <select className={css.select} value={session} disabled={active} onChange={e => setSession(e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label>
      <label><input type="checkbox" checked={inspection} disabled={active} onChange={e => setInspection(e.target.checked)}/> {c.inspection}</label>
      <button className={css.button} disabled={active || loading} onClick={() => void generate()}>{c.scramble}</button>
    </div>
    <p className={css.scramble} data-long-scramble={scramble.length > 200 || undefined} aria-live="polite">{loading ? c.loading : scramble || c.unsupported}</p>
    {error && <p className={css.error} role="alert">{c.unsupported}</p>}
    <button className={`${css.clock} ${mode === "armed" ? css.armed : ""}`} disabled={loading && !active} aria-label={mode === "running" ? c.stop : c.start} onClick={() => modeRef.current === "running" ? stop() : begin()}>
      {mode === "inspection" ? Math.max(0, Math.ceil(15 - elapsed / 1000)) : format(elapsed)}
    </button>
    <p className={css.muted} style={{ textAlign: "center" }} aria-live="polite">{mode === "armed" ? c.armed : mode === "inspection" ? `${c.inspect}${elapsed >= 17000 ? " · DNF" : elapsed >= 15000 ? " · +2" : ""}` : mode === "running" ? c.running : c.ready}</p>
    {active && <button className={css.button} onClick={() => { setMode("idle"); setElapsed(0); }}>{c.cancel}</button>}
    </div>
    <aside className={css.timerSide}>
    <div className={css.stats}>{[[c.solves, current.length], [c.best, best], ["ao5", average(current, 5)], ["ao12", average(current, 12)]].map(([label, result]) => <div className={css.stat} key={label}><span className={css.muted}>{label}</span><strong>{result}</strong></div>)}</div>
    <div className={css.timerHistory}>
    <div className={css.row}><button className={css.button} disabled={active || !current.length} onClick={() => { if (confirm(c.confirm)) {
        setSolves(prev => prev.filter(s => s.puzzle !== puzzle || s.session !== session)); setHistoryOffset(0);
    } }}>{c.reset}</button>
    <button className={css.button} aria-label={c.session + ": −1"} disabled={!shown || shownOffset >= current.length - 1} onClick={() => setHistoryOffset(shownOffset + 1)}>‹</button>
    <span aria-live="polite">{shown ? current.length - shownOffset : 0} / {current.length}</span>
    <button className={css.button} aria-label={c.session + ": +1"} disabled={!shownOffset} onClick={() => setHistoryOffset(shownOffset - 1)}>›</button></div>
    <div className={css.timerResult}>
      {!current.length && <p>{c.empty}</p>}
      {shown && <div key={shown.id} className={css.solve}><div className={css.row}><strong>{format(value(shown))}{shown.penalty === "+2" ? " (+2)" : ""}</strong><label>{c.penalty} <select className={css.select} value={shown.penalty} disabled={active} onChange={e => setSolves(prev => prev.map(x => x.id === shown.id ? { ...x, penalty: e.target.value as Penalty } : x))}><option value="none">{c.normal}</option><option>+2</option><option>DNF</option></select></label><button className={css.button} disabled={active} onClick={() => setSolves(prev => prev.filter(x => x.id !== shown.id))}>{c.remove}</button></div><time className={css.muted}>{new Date(shown.date).toLocaleString(locale)}</time><p className={css.resultScramble}>{shown.scramble}</p></div>}
    </div>
    </div>
    </aside>
    </div>
  </section>;
}
