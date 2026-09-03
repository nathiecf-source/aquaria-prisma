import React from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string[];
}

export const Accordion: React.FC<AccordionProps> = ({ items, defaultOpen = [] }) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set(defaultOpen));

  const toggle = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {items.map(item => {
        const isOpen = openItems.has(item.id);
        return (
          <div
            key={item.id}
            className="border border-[#8c7f70]/20 rounded-lg bg-[#faf9f6]/60 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-[#f4f1eb]"
            >
              <span className="font-serif text-[#3c352d] tracking-wide uppercase text-sm sm:text-base">
                {item.title}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-[#8c6239] flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="p-4 pt-0 text-[#5c544d] font-sans leading-relaxed text-justify">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
