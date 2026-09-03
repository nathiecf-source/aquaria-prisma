import React, { useEffect, useRef, useState } from "react";

export interface TourStep {
  targetId?: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  finalLabel?: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT_ESTIMATE = 180;
const GAP = 16;
const SPOTLIGHT_PADDING = 8;

function computeCardStyle(
  rect: DOMRect,
  placement: TourStep["placement"],
  vw: number,
  vh: number
): React.CSSProperties {
  let top = 0;
  let left = 0;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  if (placement === "top") {
    top = rect.top - CARD_HEIGHT_ESTIMATE - GAP;
    left = centerX - CARD_WIDTH / 2;
  } else if (placement === "bottom") {
    top = rect.bottom + GAP;
    left = centerX - CARD_WIDTH / 2;
  } else if (placement === "left") {
    top = centerY - CARD_HEIGHT_ESTIMATE / 2;
    left = rect.left - CARD_WIDTH - GAP;
  } else if (placement === "right") {
    top = centerY - CARD_HEIGHT_ESTIMATE / 2;
    left = rect.right + GAP;
  } else {
    // Auto: prefer bottom, fallback to top if not enough space
    if (rect.bottom + CARD_HEIGHT_ESTIMATE + GAP * 2 < vh) {
      top = rect.bottom + GAP;
    } else {
      top = rect.top - CARD_HEIGHT_ESTIMATE - GAP;
    }
    left = centerX - CARD_WIDTH / 2;
  }

  // Clamp within viewport
  top = Math.max(GAP, Math.min(top, vh - CARD_HEIGHT_ESTIMATE - GAP));
  left = Math.max(GAP, Math.min(left, vw - CARD_WIDTH - GAP));

  return { top, left, width: CARD_WIDTH };
}

function centerCardStyle(vw: number, vh: number): React.CSSProperties {
  const top = Math.max(GAP, vh / 2 - CARD_HEIGHT_ESTIMATE / 2);
  const left = Math.max(GAP, vw / 2 - CARD_WIDTH / 2);
  return { top, left, width: CARD_WIDTH };
}

export default function OnboardingTour({
  steps,
  isOpen,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>(centerCardStyle(window.innerWidth, window.innerHeight));
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[stepIndex] || steps[0];
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!isOpen) return;

    const updateLayout = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewport({ w: vw, h: vh });

      if (currentStep?.targetId) {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          const r = el.getBoundingClientRect();
          setRect(r);
          setCardStyle(computeCardStyle(r, currentStep.placement, vw, vh));
        } else {
          setRect(null);
          setCardStyle(centerCardStyle(vw, vh));
        }
      } else {
        setRect(null);
        setCardStyle(centerCardStyle(vw, vh));
      }
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);
    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [isOpen, stepIndex, currentStep]);

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (isLast) {
      if (currentStep.targetId) {
        document.getElementById(currentStep.targetId)?.click();
      }
      onComplete();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  if (!isOpen || !currentStep) return null;

  const nextLabel = currentStep.finalLabel || (isLast ? "✦ Começar" : "Próximo Passo ➔");

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: "none" }}>
      {/* Dark overlay with cut-out spotlight */}
      {rect ? (
        <>
          <div
            className="absolute bg-[#2B3C5C]/85 backdrop-blur-sm transition-all duration-300"
            style={{
              top: 0,
              left: 0,
              width: "100%",
              height: rect.top,
              pointerEvents: "auto",
            }}
          />
          <div
            className="absolute bg-[#2B3C5C]/85 backdrop-blur-sm transition-all duration-300"
            style={{
              top: rect.bottom,
              left: 0,
              width: "100%",
              height: viewport.h - rect.bottom,
              pointerEvents: "auto",
            }}
          />
          <div
            className="absolute bg-[#2B3C5C]/85 backdrop-blur-sm transition-all duration-300"
            style={{
              top: rect.top,
              left: 0,
              width: rect.left,
              height: rect.height,
              pointerEvents: "auto",
            }}
          />
          <div
            className="absolute bg-[#2B3C5C]/85 backdrop-blur-sm transition-all duration-300"
            style={{
              top: rect.top,
              left: rect.right,
              width: viewport.w - rect.right,
              height: rect.height,
              pointerEvents: "auto",
            }}
          />
          {/* Subtle glow border around the highlighted element */}
          <div
            className="absolute rounded-lg border border-[#8c6239]/70 shadow-[0_0_0_1px_rgba(140,98,57,0.3),0_0_28px_rgba(140,98,57,0.35)] transition-all duration-300"
            style={{
              top: rect.top - SPOTLIGHT_PADDING,
              left: rect.left - SPOTLIGHT_PADDING,
              width: rect.width + SPOTLIGHT_PADDING * 2,
              height: rect.height + SPOTLIGHT_PADDING * 2,
              pointerEvents: "none",
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-[#2B3C5C]/85 backdrop-blur-sm transition-all duration-300"
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={cardRef}
        className="absolute transition-all duration-300"
        style={{ ...cardStyle, pointerEvents: "auto" }}
      >
        <div className="rounded-xl border border-[#8c6239] bg-[#2B3C5C] p-5 shadow-2xl">
          <h3 className="font-serif text-lg text-slate-200 mb-2 tracking-wide">
            {currentStep.title}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed font-light">
            {currentStep.description}
          </p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={onSkip}
              className="text-xs text-neutral-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              ✕ Pular Tutorial
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded bg-[#8c6239] px-3 py-1.5 text-xs font-medium text-[#f4f1eb] hover:bg-[#704d31] transition-colors cursor-pointer"
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
