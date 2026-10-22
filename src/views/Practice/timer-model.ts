export type Penalty = "none" | "+2" | "DNF";
export type Solve = {
    id: string;
    ms: number;
    penalty: Penalty;
    scramble: string;
    puzzle: string;
    session: string;
    date: string;
};
export const value = (s: Solve) => s.penalty === "DNF" ? Infinity : s.ms + (s.penalty === "+2" ? 2000 : 0);
export function format(ms: number): string {
    if (!Number.isFinite(ms))
        return "DNF";
    const cs = Math.floor(ms / 10);
    return `${cs >= 6000 ? `${Math.floor(cs / 6000)}:` : ""}${String(Math.floor(cs / 100) % 60).padStart(cs >= 6000 ? 2 : 1, "0")}.${String(cs % 100).padStart(2, "0")}`;
}
export function average(solves: Solve[], n: number): string {
    if (solves.length < n)
        return "—";
    const sorted = solves.slice(-n).map(value).sort((a, b) => a - b);
    const trim = Math.ceil(n * .05);
    const middle = sorted.slice(trim, n - trim);
    return format(middle.reduce((a, b) => a + b, 0) / middle.length);
}
