import React from "react";

export interface NakshatraEntry {
  planet: string;
  sign: string;
  nakshatra: string;
  reading: string;
}

export interface NakshatraPdfData {
  title?: string;
  subtitle?: string;
  entries: NakshatraEntry[];
}

const chunkEntries = (entries: NakshatraEntry[]): NakshatraEntry[][] => {
  if (entries.length <= 2) return [entries];
  return [
    entries.slice(0, 2),
    entries.slice(2, 6),
    entries.slice(6),
  ].filter((chunk) => chunk.length > 0);
};

export const NakshatraPdfCanvas = React.forwardRef<
  HTMLDivElement,
  { data: NakshatraPdfData; userName?: string }
>(
  ({ data, userName }, ref) => {
    const pages = chunkEntries(data.entries);

    return (
      <div
        ref={ref}
        style={{
          width: 595,
          fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
          color: "#3c352d",
          background: "#ffffff",
        }}
      >
        {pages.map((pageEntries, pageIndex) => {
          const isFirst = pageIndex === 0;
          const isLast = pageIndex === pages.length - 1;

          return (
            <div
              key={pageIndex}
              style={{
                width: 595,
                height: 842,
                position: "relative",
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              {isFirst && (
                <>
                  {/* Header */}
                  <div
                    style={{
                      padding: "120px 48px 24px",
                      borderBottom: "1px solid rgba(140,127,112,0.25)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        fontSize: 9,
                        letterSpacing: "0.35em",
                        textTransform: "uppercase",
                        color: "#8c6239",
                        margin: "0 0 11px",
                      }}
                    >
                      AQUAR.IA PRISMA ✦ PORTAL ASTROLÓGICO
                    </p>
                    <h1
                      style={{
                        fontSize: 32,
                        fontWeight: 300,
                        letterSpacing: "0.02em",
                        margin: 0,
                        color: "#3c352d",
                      }}
                    >
                      {data.title || "Estrelas-Guia"}
                    </h1>
                    {data.subtitle && (
                      <p
                        style={{
                          fontSize: 13,
                          fontStyle: "italic",
                          color: "#5c4d66",
                          margin: "10px 0 0",
                        }}
                      >
                        {data.subtitle}
                        {userName ? ` • ${userName}` : ""}
                      </p>
                    )}
                  </div>

                  {/* Intro */}
                  <div
                    style={{
                      padding: "24px 48px",
                      background: "#faf9f6",
                      borderBottom: "1px solid rgba(140,127,112,0.15)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        fontSize: 12,
                        lineHeight: 1.65,
                        color: "#6e6356",
                        margin: 0,
                      }}
                    >
                      Este resumo traz a leitura costurada entre cada planeta, seu signo e
                      sua Nakshatra — a estrela-guia que revela o tom evolutivo da sua alma
                      nesta encarnação.
                    </p>
                  </div>
                </>
              )}

              {/* Entries */}
              <div
                style={{
                  padding: isFirst ? "60px 48px 0" : "80px 48px 0",
                  paddingBottom: isLast ? 0 : 80,
                }}
              >
                {pageEntries.map((entry, index) => (
                  <div
                    key={`${pageIndex}-${index}`}
                    style={{
                      marginBottom: 28,
                      paddingBottom: 28,
                      borderBottom:
                        index < pageEntries.length - 1
                          ? "1px solid rgba(140,127,112,0.15)"
                          : "none",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 17,
                        fontWeight: 400,
                        letterSpacing: "0.03em",
                        margin: "0 0 8px",
                        color: "#3c352d",
                      }}
                    >
                      {entry.planet} em {entry.sign}{" "}
                      <span style={{ color: "#8c6239" }}>|</span> {entry.nakshatra}
                    </h2>
                    <p
                      style={{
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        fontSize: 11,
                        lineHeight: 1.6,
                        color: "#4a3f35",
                        margin: 0,
                      }}
                    >
                      {entry.reading}
                    </p>
                  </div>
                ))}
              </div>

              {isLast && (
                /* Footer */
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px 48px",
                    borderTop: "1px solid rgba(140,127,112,0.25)",
                    background: "#f4f1eb",
                    textAlign: "center",
                  }}
                >
                  <img
                    src="/logo.png"
                    alt=""
                    crossOrigin="anonymous"
                    style={{
                      display: "block",
                      width: 40,
                      height: 40,
                      objectFit: "contain",
                      margin: "0 auto 8px",
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "ui-sans-serif, system-ui, sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textAlign: "center",
                      color: "#3c352d",
                      margin: "0 0 6px",
                    }}
                  >
                    Aquar.IA Prisma <span style={{ color: "#8c6239" }}>|</span> A Luz que
                    Revela sua Potência Original
                  </p>
                  <p
                    style={{
                      fontFamily: "ui-sans-serif, system-ui, sans-serif",
                      fontSize: 9,
                      letterSpacing: "0.08em",
                      textAlign: "center",
                      color: "#8c7f70",
                      margin: 0,
                    }}
                  >
                    Descubra o projeto da sua alma com{" "}
                    <span style={{ color: "#5c4d66" }}>@aquaria.app</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

NakshatraPdfCanvas.displayName = "NakshatraPdfCanvas";
