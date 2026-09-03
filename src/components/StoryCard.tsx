import React from "react";

interface StoryCardProps {
  content: string;
  id?: string;
}

export const StoryCard = React.forwardRef<HTMLDivElement, StoryCardProps>(
  ({ content, id }, ref) => {
    return (
      <div
        id={`story-card-${id || "default"}`}
        ref={ref}
        className="w-full max-w-[540px] mx-auto aspect-[9/16] bg-[#f4f1eb] flex flex-col items-center justify-between p-[6%] text-center relative box-border"
        style={{
          containerType: "inline-size",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.08), transparent 50%), radial-gradient(circle at 50% 100%, rgba(140,98,57,0.06), transparent 45%)",
        }}
      >
        <div className="flex flex-col items-center mt-[2%]">
          <img
            src="/logo.png"
            alt="AQUAR.IA"
            className="w-[13cqw] h-[13cqw] object-contain mb-[2cqw]"
          />
          <p className="font-serif text-[2.8cqw] tracking-[0.35em] uppercase text-[#8c7f70]">
            AQUAR.IA
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full px-[2%]">
          <div
            className="font-serif text-[12cqw] leading-none text-[#8c7f70] mb-[5%]"
          >
            “
          </div>
          <p
            className="font-serif leading-relaxed max-w-[90%] whitespace-pre-wrap text-[#3c352d] text-[5.5cqw]"
          >
            {content}
          </p>
          <div
            className="font-serif text-[12cqw] leading-none text-[#8c7f70] mt-[5%]"
          >
            ”
          </div>
        </div>

        <div className="text-[3.5cqw] tracking-[0.4em] uppercase font-light text-[#8c7f70]/55 mb-[4%]">
          AQUAR.IA
        </div>

        <div
          className="absolute bottom-0 left-0 w-full h-[1%]"
          style={{ backgroundColor: "#d4af37" }}
        />
      </div>
    );
  }
);

StoryCard.displayName = "StoryCard";
