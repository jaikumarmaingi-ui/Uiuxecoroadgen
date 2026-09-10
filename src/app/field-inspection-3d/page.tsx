"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const InspectionExperience = dynamic(
  () => import("@/components/inspection-3d/inspection-experience").then((m) => m.InspectionExperience),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh w-dvw items-center justify-center bg-base">
        <div className="flex items-center gap-2.5 text-text-tertiary">
          <Loader2 className="h-4 w-4 animate-spin text-cyan" /> Loading 3D inspection experience…
        </div>
      </div>
    ),
  },
);

export default function FieldInspection3DPage() {
  return <InspectionExperience />;
}
