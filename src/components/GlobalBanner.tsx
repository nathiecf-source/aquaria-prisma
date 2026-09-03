import React, { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

export default function GlobalBanner() {
  const [active, setActive] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        setActive(data.banner_active === true);
        setText(typeof data.banner_text === "string" ? data.banner_text : "");
      })
      .catch((err) => console.warn("[GlobalBanner] Erro ao carregar settings:", err));
  }, []);

  if (!active || !text.trim()) return null;

  return (
    <div className="w-full bg-[#8c6239] text-[#fbf9f5] text-center py-2.5 px-4 text-xs leading-relaxed tracking-wide flex items-center justify-center gap-2 z-50 relative">
      <Megaphone className="w-3.5 h-3.5 shrink-0 opacity-80" />
      <span>{text}</span>
    </div>
  );
}
