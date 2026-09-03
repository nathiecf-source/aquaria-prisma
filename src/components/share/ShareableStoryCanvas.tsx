import React from "react";

export interface StoryData {
  title: string;
  subtitle?: string;
  mantra?: string;
  snippet?: string;
}

export const ShareableStoryCanvas = React.forwardRef<HTMLDivElement, { data: StoryData }>(
  ({ data }, ref) => {
    const snippet = data.snippet?.slice(0, 520) || "";

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1920,
          position: "absolute",
          left: 0,
          top: 0,
          overflow: "hidden",
          fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
          color: "#3c352d",
          background: "linear-gradient(180deg, #f4f1eb 0%, #ede9de 100%)",
        }}
      >
        {/* Decorative top glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: -200,
            width: 1480,
            height: 1480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(140,98,57,0.10) 0%, rgba(244,241,235,0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Thin border frame */}
        <div
          style={{
            position: "absolute",
            inset: 48,
            border: "1px solid rgba(140,127,112,0.35)",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 80,
            right: 80,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: 22,
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: "#8c7f70",
              margin: 0,
            }}
          >
            AQUAR.IA PRISMA <span style={{ color: "#8c6239" }}>✦</span> PORTAL ASTROLÓGICO
          </p>
        </div>

        {/* Central block */}
        <div
          style={{
            position: "absolute",
            top: 520,
            left: 96,
            right: 96,
            textAlign: "center",
          }}
        >
          {data.subtitle && (
            <p
              style={{
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                fontSize: 24,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#8c6239",
                marginBottom: 32,
              }}
            >
              {data.subtitle}
            </p>
          )}
          <h1
            style={{
              fontSize: data.title?.includes("\n") ? 56 : 72,
              fontWeight: 300,
              letterSpacing: "0.04em",
              lineHeight: data.title?.includes("\n") ? 1.2 : 1.15,
              whiteSpace: "pre-line",
              margin: "0 0 56px",
              color: "#3c352d",
            }}
          >
            {data.title}
          </h1>

          {data.mantra && (
            <p
              style={{
                fontSize: 42,
                fontStyle: "italic",
                fontWeight: 400,
                lineHeight: 1.35,
                color: "#5c4d66",
                margin: "0 auto 64px",
                maxWidth: 860,
              }}
            >
              {data.mantra}
            </p>
          )}

          {snippet && (
            <div
              style={{
                margin: "0 auto",
                maxWidth: 760,
                padding: "36px 44px",
                background: "rgba(255,255,255,0.45)",
                borderLeft: "3px solid #8c6239",
              }}
            >
              <p
                style={{
                  fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  fontSize: 32,
                  lineHeight: 1.55,
                  color: "#4a3f35",
                  margin: 0,
                }}
              >
                {snippet}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 96,
            right: 96,
            textAlign: "center",
          }}
        >
          <img
            src="/logo.png"
            alt=""
            crossOrigin="anonymous"
            style={{
              display: "block",
              width: 96,
              height: 96,
              objectFit: "contain",
              margin: "0 auto 20px",
            }}
          />
          <p
            style={{
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: 26,
              letterSpacing: "0.12em",
              color: "#3c352d",
              margin: "0 0 18px",
            }}
          >
            Aquar.IA Prisma <span style={{ color: "#8c6239" }}>|</span> A Luz que Revela sua Potência Original
          </p>
          <p
            style={{
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: 22,
              letterSpacing: "0.08em",
              color: "#8c7f70",
              margin: 0,
            }}
          >
            Descubra o projeto da sua alma com <span style={{ color: "#5c4d66" }}>@aquaria.app</span>
          </p>
        </div>
      </div>
    );
  }
);

ShareableStoryCanvas.displayName = "ShareableStoryCanvas";
