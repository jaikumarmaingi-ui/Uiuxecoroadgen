"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIStatusIndicator } from "@/components/shared/ai-status-indicator";
import { Progress } from "@/components/ui/progress";
import { ImagePlus, ScanEye } from "lucide-react";
import type { RoadSegment } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ImageAnalysisPanel({ segment }: { segment: RoadSegment }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const crackConfidence = Math.min(98, 55 + segment.distress.cracking * 0.4);
  const potholeProbability = Math.min(96, 40 + segment.distress.potholes * 0.45);
  const severity = segment.distress.cracking + segment.distress.potholes > 130 ? "Severe" : segment.distress.cracking + segment.distress.potholes > 85 ? "Moderate" : "Minor";
  const action = severity === "Severe" ? "Priority repair" : severity === "Moderate" ? "Preventive repair" : "Continue monitoring";

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setStatus("idle");
  }

  function analyze() {
    setStatus("analyzing");
    setTimeout(() => setStatus("done"), 1400);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Image Analysis</CardTitle>
        {status === "analyzing" && <AIStatusIndicator state="analyzing" />}
        {status === "done" && <AIStatusIndicator state="generated" />}
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-hairline-strong bg-white/[0.02] text-text-tertiary transition-colors hover:border-cyan/40",
            )}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Uploaded field inspection" className="h-full w-full object-cover" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <span className="text-xs">Upload field inspection photo</span>
              </>
            )}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <Button variant="primary" className="mt-3 w-full" disabled={!imageUrl || status === "analyzing"} onClick={analyze}>
            <ScanEye className="h-4 w-4" />
            {status === "analyzing" ? "Analyzing…" : "Run AI Detection"}
          </Button>
        </div>

        <div>
          {status !== "done" ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-hairline bg-white/[0.02] p-6 text-center text-xs text-text-tertiary">
              {status === "analyzing" ? "AI ANALYZING ROAD CONDITIONS…" : "Upload a photo and run detection to see AI computer-vision results."}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-cyan/25 bg-cyan/[0.05] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan">AI Detection</div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-text-secondary">Crack detected</span>
                  <span className="font-mono-tech font-semibold text-text-primary">{crackConfidence.toFixed(0)}%</span>
                </div>
                <Progress value={crackConfidence} tone="cyan" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-text-secondary">Pothole probability</span>
                  <span className="font-mono-tech font-semibold text-text-primary">{potholeProbability.toFixed(0)}%</span>
                </div>
                <Progress value={potholeProbability} tone="amber" />
              </div>
              <div className="flex items-center justify-between border-t border-hairline pt-2.5 text-xs">
                <span className="text-text-tertiary">Estimated distress severity</span>
                <span className="font-display font-bold text-text-primary">{severity}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">Recommended action</span>
                <span className="font-display font-bold text-cyan">{action}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
