'use client';

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface Aspect {
  value: string;
  confidence: "high" | "medium" | "low";
}

interface AspectCardProps {
  title: string;
  aspects: Record<string, Aspect | string>;
}

const confidenceLabel: Record<string, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

export default function AspectCard({ title, aspects }: AspectCardProps) {
  const [open, setOpen] = useState(false);

  const entries = Object.entries(aspects).filter(
    ([key]) => key !== "name"
  ) as [string, Aspect][];

  return (
    <div className="card-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 space-y-3">
          {entries.map(([key, aspect]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider ${
                    aspect.confidence === "high"
                      ? "confidence-high"
                      : aspect.confidence === "medium"
                      ? "confidence-medium"
                      : "confidence-low"
                  }`}
                >
                  {confidenceLabel[aspect.confidence]}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{aspect.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
