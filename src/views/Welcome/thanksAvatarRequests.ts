/**
 * Keep sponsor avatar requests proportional to the people actually displayed.
 * WCA profile requests can be expensive (and retry on transient failures).
 */
export type AvatarCandidate = { wcaID: string; avatar?: string };

export function getAvatarFetchIds(
  people: readonly AvatarCandidate[],
  expanded: boolean,
  visibleLimit: number,
  alreadyRequested: ReadonlySet<string>,
): string[] {
  const visible = expanded ? people : people.slice(0, visibleLimit);
  const ids = new Set<string>();
  for (const person of visible) {
    if (
      !person.avatar &&
      person.wcaID?.length === 10 &&
      !alreadyRequested.has(person.wcaID)
    ) {
      ids.add(person.wcaID);
    }
  }
  return [...ids];
}

/** Fetch at most four WCA profiles at once; one failure must not hide others. */
export async function fetchAvatarThumbnails(
  ids: readonly string[],
  fetchAvatar: (wcaID: string) => Promise<string | undefined>,
  onAvatar: (wcaID: string, url: string) => void,
  concurrency = 4,
): Promise<void> {
  let next = 0;
  const workerCount = Math.min(ids.length, Math.max(1, Math.floor(concurrency)));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (next < ids.length) {
        const wcaID = ids[next++];
        try {
          const url = await fetchAvatar(wcaID);
          if (url) onAvatar(wcaID, url);
        } catch {
          // Retain the existing fallback avatar when the WCA API is unavailable.
        }
      }
    }),
  );
}
