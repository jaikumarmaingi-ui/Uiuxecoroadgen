"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ReactNode } from "react";

export function SegmentTabs({
  overview,
  condition,
  prediction,
  rootCauses,
  repair,
  sustainability,
  history,
}: {
  overview: ReactNode;
  condition: ReactNode;
  prediction: ReactNode;
  rootCauses: ReactNode;
  repair: ReactNode;
  sustainability: ReactNode;
  history: ReactNode;
}) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="condition">Condition</TabsTrigger>
        <TabsTrigger value="prediction">Prediction</TabsTrigger>
        <TabsTrigger value="root-causes">Root Causes</TabsTrigger>
        <TabsTrigger value="repair">Repair</TabsTrigger>
        <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <div className="pt-5">
        <TabsContent value="overview">{overview}</TabsContent>
        <TabsContent value="condition">{condition}</TabsContent>
        <TabsContent value="prediction">{prediction}</TabsContent>
        <TabsContent value="root-causes">{rootCauses}</TabsContent>
        <TabsContent value="repair">{repair}</TabsContent>
        <TabsContent value="sustainability">{sustainability}</TabsContent>
        <TabsContent value="history">{history}</TabsContent>
      </div>
    </Tabs>
  );
}
