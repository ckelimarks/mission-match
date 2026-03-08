'use client';

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface AspectCardProps {
  title: string;
  aspects: unknown;
}

const confidenceLabel: Record<string, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

const titleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

type RenderableAspect = {
  key: string;
  label: string;
  value: string;
  confidence?: "high" | "medium" | "low";
};

function normalizeAspects(input: unknown): RenderableAspect[] {
  if (!isRecord(input)) return [];

  const entries: RenderableAspect[] = [];

  Object.entries(input).forEach(([key, rawValue]) => {
    if (key === "name" || rawValue == null) return;

    if (Array.isArray(rawValue)) {
      if (rawValue.length > 0) {
        entries.push({
          key,
          label: titleCase(key),
          value: rawValue.map((item) => String(item)).join(", "),
        });
      }
      return;
    }

    if (typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      entries.push({
        key,
        label: titleCase(key),
        value: String(rawValue),
      });
      return;
    }

    if (!isRecord(rawValue)) return;

    if ("score" in rawValue && "confidence" in rawValue) {
      const score = typeof rawValue.score === "number" ? `${rawValue.score}/100` : String(rawValue.score);
      const proof =
        typeof rawValue.proof === "string" && rawValue.proof.trim().length > 0
          ? rawValue.proof
          : typeof rawValue.value === "string"
          ? rawValue.value
          : "";

      entries.push({
        key,
        label: titleCase(key),
        value: proof ? `${score} - ${proof}` : score,
        confidence:
          rawValue.confidence === "high" || rawValue.confidence === "medium" || rawValue.confidence === "low"
            ? rawValue.confidence
            : undefined,
      });
      return;
    }

    if ("value" in rawValue && typeof rawValue.value === "string") {
      entries.push({
        key,
        label: titleCase(key),
        value: rawValue.value,
        confidence:
          rawValue.confidence === "high" || rawValue.confidence === "medium" || rawValue.confidence === "low"
            ? rawValue.confidence
            : undefined,
      });
      return;
    }

    if (key === "core_dimensions") {
      Object.entries(rawValue).forEach(([dimensionKey, dimensionValue]) => {
        if (!isRecord(dimensionValue) || !("score" in dimensionValue)) return;
        const score = typeof dimensionValue.score === "number" ? `${dimensionValue.score}/100` : String(dimensionValue.score);
        const proof =
          typeof dimensionValue.proof === "string" && dimensionValue.proof.trim().length > 0
            ? ` - ${dimensionValue.proof}`
            : "";

        entries.push({
          key: `${key}-${dimensionKey}`,
          label: titleCase(dimensionKey),
          value: `${score}${proof}`,
          confidence:
            dimensionValue.confidence === "high" ||
            dimensionValue.confidence === "medium" ||
            dimensionValue.confidence === "low"
              ? dimensionValue.confidence
              : undefined,
        });
      });
      return;
    }

    if (key === "distinctive_edges" && Array.isArray(rawValue)) {
      rawValue.forEach((edge: unknown, index: number) => {
        if (!isRecord(edge)) return;
        const label = typeof edge.dimension === "string" ? edge.dimension : `Edge ${index + 1}`;
        const score = typeof edge.score === "number" ? `${edge.score}/100` : "";
        const proof = typeof edge.proof === "string" ? edge.proof : "";
        entries.push({
          key: `${key}-${index}`,
          label,
          value: [score, proof].filter(Boolean).join(" - "),
          confidence:
            edge.confidence === "high" || edge.confidence === "medium" || edge.confidence === "low"
              ? edge.confidence
              : undefined,
        });
      });
      return;
    }

    if ("email" in rawValue || "linkedin" in rawValue || "website" in rawValue || "twitter" in rawValue || "phone" in rawValue) {
      Object.entries(rawValue).forEach(([contactKey, contactValue]) => {
        if (!contactValue) return;
        entries.push({
          key: `${key}-${contactKey}`,
          label: titleCase(contactKey),
          value: String(contactValue),
        });
      });
      return;
    }

    const nestedValues = Object.values(rawValue).filter(Boolean).map((item) => {
      if (Array.isArray(item)) return item.join(", ");
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") return String(item);
      return "";
    }).filter(Boolean);

    if (nestedValues.length > 0) {
      entries.push({
        key,
        label: titleCase(key),
        value: nestedValues.join(" | "),
      });
    }
  });

  return entries;
}

export default function AspectCard({ title, aspects }: AspectCardProps) {
  const [open, setOpen] = useState(false);
  const entries = normalizeAspects(aspects);

  if (entries.length === 0) return null;

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
          {entries.map((aspect) => (
            <div key={aspect.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {aspect.label}
                </span>
                {aspect.confidence && (
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
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">{aspect.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
