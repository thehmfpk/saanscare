import { useEffect, useRef, useState } from "react";

/**
 * Polls `fn` every `intervalMs` and tracks when it last succeeded. This is honest
 * client-side polling, not a push websocket — labeled that way in the UI (LiveBadge)
 * so it never overstates itself as a live server push.
 */
export function useAutoRefresh(fn, intervalMs = 45000) {
  const [lastUpdated, setLastUpdated] = useState(null);
  const savedFn = useRef(fn);
  savedFn.current = fn;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await savedFn.current();
        if (!cancelled) setLastUpdated(new Date());
      } catch {
        /* keep last good data on transient failures */
      }
    }

    run();
    const id = setInterval(run, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return lastUpdated;
}

export function LiveBadge({ lastUpdated }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsAgo = lastUpdated ? Math.max(0, Math.round((Date.now() - lastUpdated.getTime()) / 1000)) : null;
  const label = secondsAgo == null ? "syncing…" : secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`;

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted border border-border rounded-full px-2 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-soft" />
      auto-refreshing · updated {label}
    </span>
  );
}
