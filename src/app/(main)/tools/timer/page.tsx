"use client";

import { Box, Button, Container, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";

type Solve = { id: number; milliseconds: number; scramble: string };
const KEY = "cubing_pro_timer_solves_v1";
const MOVES = ["R", "L", "U", "D", "F", "B"];
const SUFFIXES = ["", "'", "2"];

function newScramble(): string {
  const sequence: string[] = [];
  let previous = "";
  for (let i = 0; i < 20; i++) {
    // Avoid consecutive moves on the same axis.
    const axis = (move: string) => Math.floor(MOVES.indexOf(move) / 2);
    const eligible = MOVES.filter((move) => axis(move) !== axis(previous));
    const move = eligible[Math.floor(Math.random() * eligible.length)];
    sequence.push(move + SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]);
    previous = move;
  }
  return sequence.join(" ");
}

function display(ms: number): string {
  const centiseconds = Math.floor(ms / 10);
  const seconds = Math.floor(centiseconds / 100);
  const fraction = String(centiseconds % 100).padStart(2, "0");
  return seconds >= 60
    ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}.${fraction}`
    : `${seconds}.${fraction}`;
}

export default function CubeTimerPage() {
  const { locale } = useI18n();
  const english = locale === "en-US";
  const [solves, setSolves] = useState<Solve[]>([]);
  const [scramble, setScramble] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [armed, setArmed] = useState(false);
  const runningRef = useRef(false);
  const startRef = useRef(0);
  const scrambleRef = useRef("");
  const keyboardArmedRef = useRef(false);

  useEffect(() => {
    setScramble(newScramble());
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(stored)) setSolves(stored.filter((s): s is Solve => typeof s?.milliseconds === "number" && typeof s?.scramble === "string" && typeof s?.id === "number").slice(0, 100));
    } catch { /* Ignore damaged local records. */ }
  }, []);

  useEffect(() => { scrambleRef.current = scramble; }, [scramble]);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const tick = () => {
      setElapsed(performance.now() - startRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    const ms = Math.max(0, Math.round(performance.now() - startRef.current));
    runningRef.current = false;
    setRunning(false);
    setElapsed(ms);
    setSolves((old) => {
      const next = [{ id: Date.now(), milliseconds: ms, scramble: scrambleRef.current }, ...old].slice(0, 100);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Storage may be disabled. */ }
      return next;
    });
    setScramble(newScramble());
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    setElapsed(0);
    startRef.current = performance.now();
    runningRef.current = true;
    setRunning(true);
    setArmed(false);
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, [contenteditable='true']")) return;
      event.preventDefault();
      if (runningRef.current) { stop(); return; }
      keyboardArmedRef.current = true;
      setArmed(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space" || !keyboardArmedRef.current) return;
      event.preventDefault();
      keyboardArmedRef.current = false;
      start();
    };
    const blur = () => { keyboardArmedRef.current = false; setArmed(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [start, stop]);

  const average = (count: number) => {
    if (solves.length < count) return "—";
    const times = solves.slice(0, count).map((solve) => solve.milliseconds).sort((a, b) => a - b);
    const selected = times.slice(1, -1);
    return display(selected.reduce((sum, ms) => sum + ms, 0) / selected.length);
  };

  return (
    <Container maxW="4xl" py="8">
      <VStack gap="6" align="stretch">
        <Box>
          <Heading size="2xl">{english ? "Cube Timer" : "魔方计时器"}</Heading>
          <Text color="fg.muted" mt="2">{english ? "Practice on your own. Times are saved only in this browser." : "个人练习记录仅保存在当前浏览器。"}</Text>
        </Box>
        <Box borderWidth="1px" borderRadius="xl" p={{ base: "5", md: "8" }} textAlign="center" bg="bg.panel">
          <Text fontWeight="semibold" mb="4">{english ? "3×3 scramble (practice)" : "三阶打乱（练习用）"}</Text>
          <Text fontSize="lg" fontFamily="mono" lineHeight="tall" overflowWrap="anywhere">{scramble}</Text>
          <Button variant="outline" mt="4" disabled={running} onClick={() => setScramble(newScramble())}>{english ? "New scramble" : "新打乱"}</Button>
          <Text mt="8" fontSize={{ base: "5xl", md: "7xl" }} fontWeight="bold" fontVariantNumeric="tabular-nums" color={armed ? "green.500" : undefined} aria-live="off">{display(elapsed)}</Text>
          <Text color="fg.muted" mb="5">{running ? (english ? "Press Space to stop" : "按空格停止") : (english ? "Hold Space, release to start" : "按住空格，松开开始")}</Text>
          <Button size="lg" colorPalette="brand" onClick={running ? stop : start}>{running ? (english ? "Stop" : "停止") : (english ? "Start" : "开始")}</Button>
        </Box>
        <HStack gap="4" wrap="wrap">
          <Text fontWeight="bold">ao5: {average(5)}</Text>
          <Text fontWeight="bold">ao12: {average(12)}</Text>
          <Text color="fg.muted">{english ? "Solves" : "次数"}: {solves.length}</Text>
        </HStack>
        <Box>
          <HStack justify="space-between" mb="3">
            <Heading size="md">{english ? "Recent solves" : "最近记录"}</Heading>
            <Button size="sm" variant="outline" disabled={!solves.length || running} onClick={() => {
              if (!window.confirm(english ? "Clear all timer records?" : "确定清空所有计时记录？")) return;
              setSolves([]);
              try { localStorage.removeItem(KEY); } catch { /* ignored */ }
            }}>{english ? "Clear" : "清空"}</Button>
          </HStack>
          <VStack align="stretch" gap="2">
            {solves.length === 0 ? <Text color="fg.muted">{english ? "No solves yet." : "暂无记录。"}</Text> : solves.slice(0, 20).map((solve, index) => (
              <HStack key={solve.id} justify="space-between" borderWidth="1px" borderRadius="md" p="3">
                <Text color="fg.muted">#{solves.length - index}</Text>
                <Text fontWeight="semibold" fontVariantNumeric="tabular-nums">{display(solve.milliseconds)}</Text>
                <Text fontSize="xs" color="fg.muted" maxW="55%" truncate title={solve.scramble}>{solve.scramble}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
