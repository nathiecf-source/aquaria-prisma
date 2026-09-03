import React, { useEffect, useState } from "react";

interface ChamadoTimerProps {
  active: boolean;
  expiresAt: string | null;
  bannerText?: string;
}

export default function ChamadoTimer({ active, expiresAt, bannerText }: ChamadoTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!active || !expiresAt) return;

    const calculate = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, diff));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [active, expiresAt]);

  if (!active || !expiresAt || timeLeft <= 0) return null;

  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  const parts = [
    days > 0 ? `${days}d` : null,
    `${String(hours).padStart(2, "0")}h`,
    `${String(minutes).padStart(2, "0")}m`,
    `${String(seconds).padStart(2, "0")}s`,
  ].filter(Boolean);

  const prefix = bannerText?.trim() ? bannerText.trim() : "Portal Aberto";

  return (
    <div className="text-center text-[#d4af37] text-[10px] font-medium tracking-[0.2em] uppercase py-2 bg-transparent">
      <span className="opacity-90">{prefix}</span>
      <span className="ml-2 font-mono opacity-80">{parts.join(" ")}</span>
    </div>
  );
}
