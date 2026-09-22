import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const clientVersion = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : null;
    if (!clientVersion) return;

    const check = () => {
      fetch("/api/version")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.version && data.version !== clientVersion) {
            setUpdateAvailable(true);
          }
        })
        .catch(() => {});
    };

    // Primeira verificação após 30s (não atrasa o carregamento inicial)
    const initial = setTimeout(check, 30_000);
    timerRef.current = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(initial);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const refresh = () => window.location.reload();

  return { updateAvailable, refresh };
}
