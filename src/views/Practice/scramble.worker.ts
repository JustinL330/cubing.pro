import cstimer from "cstimer_module";

const events: Record<string, [string, number]> = {
  "222": ["222so", 0], "333": ["333", 0], "444": ["444wca", 0],
  "555": ["555wca", 60], "666": ["666wca", 80], "777": ["777wca", 100],
  pyram: ["pyrso", 10], skewb: ["skbso", 0], sq1: ["sqrs", 0],
  clock: ["clkwca", 0], minx: ["mgmp", 70],
};

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<string>) => void) | null;
  postMessage: (message: { scramble?: string; error?: string }) => void;
};
scope.onmessage = ({ data }) => {
  try {
    const params = events[data];
    if (!params) throw new Error("Unsupported puzzle");
    const scramble = cstimer.getScramble(...params).trim();
    if (!scramble) throw new Error("Empty scramble");
    scope.postMessage({ scramble });
  } catch (error) {
    scope.postMessage({ error: error instanceof Error ? error.message : "Scramble failed" });
  }
};
