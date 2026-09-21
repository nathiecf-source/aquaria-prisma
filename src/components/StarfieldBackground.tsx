import React from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  phase: number;
  speed: number;
  color: string;
}

const COLORS = ["140, 98, 57", "92, 77, 102", "43, 60, 92", "212, 175, 55"];

export default function StarfieldBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastTime = performance.now();

    const createStars = () => {
      const count = Math.min(190, Math.max(75, Math.round((width * height) / 8500)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.65 + Math.random() * 1.55,
        opacity: 0.22 + Math.random() * 0.36,
        phase: Math.random() * Math.PI * 2,
        speed: 8 + Math.random() * 14,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      createStars();
      draw(performance.now(), 0);
    };

    const draw = (time: number, delta: number) => {
      context.clearRect(0, 0, width, height);
      for (const star of stars) {
        if (!reducedMotion) {
          star.y -= star.speed * delta / 1000;
          if (star.y < -3) {
            star.y = height + 3;
            star.x = Math.random() * width;
          }
        }
        const shimmer = reducedMotion ? 1 : 0.68 + Math.sin(time / 1100 + star.phase) * 0.32;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${star.color}, ${star.opacity * shimmer})`;
        context.fill();
      }
    };

    const animate = (time: number) => {
      const delta = Math.min(50, time - lastTime);
      lastTime = time;
      draw(time, delta);
      frame = window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reducedMotion) frame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
