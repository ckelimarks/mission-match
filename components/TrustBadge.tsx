'use client';

import { Shield, CheckCircle } from "lucide-react";

interface TrustBadgeProps {
  model: string;
  extractedAt: string;
  humanReviewed: boolean;
}

export default function TrustBadge({ model, extractedAt, humanReviewed }: TrustBadgeProps) {
  const date = new Date(extractedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="trust-border card-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Proof, Not Claims
        </span>
      </div>
      <p className="text-xs italic text-muted-foreground">
        Every profile traces back to source
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-foreground">
          <CheckCircle className="w-3.5 h-3.5 text-primary" />
          <span>Extracted by {model.replace("claude-sonnet-4-5-20250929", "Claude Sonnet 4.5")}</span>
        </div>
        {humanReviewed && (
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
            <span>Human-reviewed</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-foreground">
          <CheckCircle className="w-3.5 h-3.5 text-primary" />
          <span>Created: {date}</span>
        </div>
      </div>
    </div>
  );
}
