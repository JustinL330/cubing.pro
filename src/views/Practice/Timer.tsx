"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { practiceCopy } from "./copy";
import { average, format, value, type Solve, type Penalty } from "./timer-model";
import css from "./Practice.module.css";
const puzzles = ["222", "333", "444", "555", "666", "777", "pyram", "skewb", "sq1", "clock", "minx"] as const;
type Mode = "idle" | "armed" | "inspection" | "running";
export function Timer() {
    const { locale } = useI18n();
    const c = practiceCopy(locale);
    const [solves, setSolves] = useState<Solve[]>([]);
    const [puzzle, setPuzzle] = useState<typeof puzzles[number]>("333");
    const [session, setSession] = useState("1");
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
    return <section className={css.page}>
    <p className={css.eyebrow}>Cubing Pro / Practice</p><h1 className={css.title}>{c.timer}</h1><p className={css.muted}>{c.local}</p>
    <div className={css.row}>
      <label>{c.event} <select className={css.select} value={puzzle} disabled={active} onChange={e => setPuzzle(e.target.value as typeof puzzle)}>{puzzles.map(p => <option key={p}>{p}</option>)}</select></label>
      <label>{c.session} <select className={css.select} value={session} disabled={active} onChange={e => setSession(e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label>
      <label><input type="checkbox" checked={inspection} disabled={active} onChange={e => setInspection(e.target.checked)}/> {c.inspection}</label>
      <button className={css.button} disabled={active || loading} onClick={() => void generate()}>{c.scramble}</button>
    </div>
    <p className={css.scramble} aria-live="polite">{loading ? c.loading : scramble || c.unsupported}</p>
    {error && <p className={css.error} role="alert">{c.unsupported}</p>}
    <button className={`${css.clock} ${mode === "armed" ? css.armed : ""}`} disabled={loading && !active} aria-label={mode === "running" ? c.stop : c.start} onClick={() => modeRef.current === "running" ? stop() : begin()}>
      {mode === "inspection" ? Math.max(0, Math.ceil(15 - elapsed / 1000)) : format(elapsed)}
    </button>
    <p className={css.muted} style={{ textAlign: "center" }} aria-live="polite">{mode === "armed" ? c.armed : mode === "inspection" ? `${c.inspect}${elapsed >= 17000 ? " · DNF" : elapsed >= 15000 ? " · +2" : ""}` : mode === "running" ? c.running : c.ready}</p>
    {active && <button className={css.button} onClick={() => { setMode("idle"); setElapsed(0); }}>{c.cancel}</button>}
    <div className={css.stats}>{[[c.solves, current.length], [c.best, best], ["ao5", average(current, 5)], ["ao12", average(current, 12)]].map(([label, result]) => <div className={css.stat} key={label}><span className={css.muted}>{label}</span><strong>{result}</strong></div>)}</div>
    <div className={css.row}><button className={css.button} disabled={active || !current.length} onClick={() => { if (confirm(c.confirm))
        setSolves(prev => prev.filter(s => s.puzzle !== puzzle || s.session !== session)); }}>{c.reset}</button></div>
    <div className={`${css.card} ${css.history}`}>
      {!current.length && <p>{c.empty}</p>}
      {current.slice().reverse().map((s, i) => <div key={s.id} className={css.solve}><div className={css.row}><span>#{current.length - i}</span><strong>{format(value(s))}{s.penalty === "+2" ? " (+2)" : ""}</strong><time className={css.muted}>{new Date(s.date).toLocaleString(locale)}</time><label>{c.penalty} <select className={css.select} value={s.penalty} disabled={active} onChange={e => setSolves(prev => prev.map(x => x.id === s.id ? { ...x, penalty: e.target.value as Penalty } : x))}><option value="none">{c.normal}</option><option>+2</option><option>DNF</option></select></label><button className={css.button} disabled={active} onClick={() => setSolves(prev => prev.filter(x => x.id !== s.id))}>{c.remove}</button></div><p className={css.muted}>{s.scramble}</p></div>)}
    </div>
  </section>;
}
