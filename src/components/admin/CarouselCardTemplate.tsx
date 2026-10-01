import React from "react";

export interface CarouselCardData {
  ordem: number;
  titulo: string;
  texto: string;
}

interface CarouselCardTemplateProps {
  data: CarouselCardData;
  theme: "dark" | "light";
  format: "feed" | "stories";
  backgroundUrl?: string;
}

const FORMAT_DIMENSIONS: Record<"feed" | "stories", { width: number; height: number }> = {
  feed: { width: 1080, height: 1350 },
  stories: { width: 1080, height: 1920 },
};

export const CarouselCardTemplate = React.forwardRef<HTMLDivElement, CarouselCardTemplateProps>(
  ({ data, theme, format, backgroundUrl }, ref) => {
    const { width, height } = FORMAT_DIMENSIONS[format];
    const isDark = theme === "dark";

    const backgroundStyle: React.CSSProperties = backgroundUrl
      ? {
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {
          background: isDark
            ? "linear-gradient(180deg, #2e2730 0%, #1f1a22 100%)"
            : "linear-gradient(180deg, #f4f1eb 0%, #ede9de 100%)",
        };

    const overlayColor = isDark ? "rgba(67, 58, 74, 0.90)" : "rgba(255, 255, 255, 0.96)";
    const textColor = isDark ? "#ffffff" : "#433a4a";
    const mutedColor = isDark ? "rgba(255,255,255,0.75)" : "rgba(67,58,74,0.75)";

    const titleFontSize = format === "feed" ? 56 : 64;
    const bodyFontSize = format === "feed" ? 34 : 38;
    const paddingX = format === "feed" ? 96 : 80;
    const paddingY = format === "feed" ? 120 : 160;

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          position: "relative",
          fontFamily: "'Open Sans', sans-serif",
          color: textColor,
          overflow: "hidden",
          ...backgroundStyle,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 48,
            backgroundColor: overlayColor,
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: `${paddingY}px ${paddingX}px`,
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <p
            style={{
              position: "absolute",
              top: format === "feed" ? 48 : 64,
              left: 0,
              right: 0,
              fontFamily: "'Tenor Sans', sans-serif",
              fontSize: format === "feed" ? 22 : 24,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: mutedColor,
              margin: 0,
              padding: `0 ${paddingX}px`,
            }}
          >
            Aquaria / Portal 36_
          </p>

          <h2
            style={{
              fontFamily: "'Tenor Sans', sans-serif",
              fontSize: titleFontSize,
              lineHeight: 1.1,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "0 0 48px",
              color: textColor,
              wordBreak: "break-word",
            }}
          >
            {data.titulo}
          </h2>

          <p
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontSize: bodyFontSize,
              lineHeight: 1.45,
              margin: 0,
              color: textColor,
              whiteSpace: "pre-line",
              wordBreak: "break-word",
            }}
          >
            {data.texto}
          </p>

          <p
            style={{
              position: "absolute",
              bottom: format === "feed" ? 40 : 56,
              left: 0,
              right: 0,
              fontSize: format === "feed" ? 18 : 20,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: mutedColor,
              margin: 0,
            }}
          >
            {data.ordem.toString().padStart(2, "0")} / 10
          </p>
        </div>
      </div>
    );
  }
);

CarouselCardTemplate.displayName = "CarouselCardTemplate";
