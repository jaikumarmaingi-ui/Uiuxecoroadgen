"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Route,
  Camera,
  ScanEye,
  UserCheck,
  ClipboardList,
  Send,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROAD_SEGMENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "gps", label: "GPS", icon: MapPin },
  { key: "segment", label: "Segment", icon: Route },
  { key: "photo", label: "Photo", icon: Camera },
  { key: "ai", label: "AI Detect", icon: ScanEye },
  { key: "verify", label: "Verify", icon: UserCheck },
  { key: "observe", label: "Observe", icon: ClipboardList },
  { key: "submit", label: "Submit", icon: Send },
] as const;

export default function FieldInspectionPage() {
  const [step, setStep] = useState(0);
  const [segmentId, setSegmentId] = useState(ROAD_SEGMENTS[2].id);
  const [gpsDetected, setGpsDetected] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [verified, setVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    temperature: -8,
    weather: "Clear",
    surface: "Fair",
    drainage: "Fair",
    cracks: false,
    potholes: false,
    rutting: false,
    shoulder: "Fair",
    notes: "",
  });

  const segment = ROAD_SEGMENTS.find((s) => s.id === segmentId)!;
  const canAdvance = [gpsDetected, !!segmentId, photoTaken, aiDone, verified, true, true][step];

  function next() {
    if (step === STEPS.length - 1) {
      setSubmitted(true);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green/40 bg-green/10">
          <CheckCircle2 className="h-8 w-8 text-green" />
        </div>
        <h1 className="font-display text-xl font-bold text-text-primary">Inspection Submitted</h1>
        <p className="text-sm text-text-tertiary">
          Field record for {segment.routeNumber} {segment.segmentLabel} has been logged and synced to Condition Monitoring.
        </p>
        <Link href="/condition-monitoring">
          <Button variant="primary">View Condition Monitoring</Button>
        </Link>
        <Link href="/field-inspection" onClick={() => window.location.reload()} className="text-xs text-cyan hover:underline">
          Start new inspection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-4">
        <ShieldCheck className="h-5 w-5 text-cyan" />
        <div>
          <div className="font-display text-sm font-bold text-text-primary">Field Inspection Mode</div>
          <div className="font-mono-tech text-[10px] text-text-tertiary">ECOROADGEN 1.0</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 px-4 py-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold",
                  i < step ? "border-green/40 bg-green/10 text-green" : i === step ? "border-cyan bg-cyan/10 text-cyan" : "border-hairline-strong text-text-tertiary",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[8px] uppercase tracking-wide text-text-tertiary">{s.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 space-y-4 px-4 pb-28 pt-2">
        {step === 0 && (
          <StepCard title="GPS Location">
            {!gpsDetected ? (
              <Button variant="primary" className="w-full" onClick={() => setGpsDetected(true)}>
                <MapPin className="h-4 w-4" /> Detect Location
              </Button>
            ) : (
              <div className="rounded-lg border border-green/30 bg-green/[0.06] p-3 text-sm text-green">
                Location detected — {segment.region} ({segment.path[0].lat.toFixed(2)}, {segment.path[0].lng.toFixed(2)})
              </div>
            )}
          </StepCard>
        )}

        {step === 1 && (
          <StepCard title="Confirm Road Segment">
            <select
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              className="w-full rounded-lg border border-hairline-strong bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary outline-none focus:border-cyan/40"
            >
              {ROAD_SEGMENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.routeNumber} · {s.roadName} · {s.segmentLabel}
                </option>
              ))}
            </select>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="Capture Photo">
            <button
              onClick={() => setPhotoTaken(true)}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-text-tertiary",
                photoTaken ? "border-green/40 bg-green/[0.05] text-green" : "border-hairline-strong bg-white/[0.02]",
              )}
            >
              <Camera className="h-8 w-8" />
              <span className="text-xs">{photoTaken ? "Photo captured" : "Tap to capture"}</span>
            </button>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="AI Distress Detection">
            {!aiDone ? (
              <Button variant="primary" className="w-full" onClick={() => setTimeout(() => setAiDone(true), 1200)}>
                <Loader2 className="h-4 w-4 animate-spin" /> Run AI Detection
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border border-cyan/25 bg-cyan/[0.05] p-3 text-xs">
                <Row label="Crack detected" value={`${Math.min(96, 50 + segment.distress.cracking * 0.4).toFixed(0)}% confidence`} />
                <Row label="Pothole probability" value={`${Math.min(94, 35 + segment.distress.potholes * 0.45).toFixed(0)}%`} />
                <Row label="Severity" value={segment.distress.cracking > 60 ? "Moderate–Severe" : "Minor–Moderate"} />
              </div>
            )}
          </StepCard>
        )}

        {step === 4 && (
          <StepCard title="Engineer Verification">
            <label className="flex items-start gap-3 rounded-lg border border-hairline bg-white/[0.02] p-3.5 text-sm">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-0.5 h-4 w-4 accent-cyan" />
              <span className="text-text-secondary">I confirm the AI detection matches observed field conditions.</span>
            </label>
          </StepCard>
        )}

        {step === 5 && (
          <StepCard title="Field Observations">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Temperature (°C)">
                <input
                  type="number"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              <Field label="Weather">
                <select value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })} className={inputClass}>
                  <option>Clear</option>
                  <option>Overcast</option>
                  <option>Snowing</option>
                  <option>Raining</option>
                </select>
              </Field>
              <Field label="Surface Condition">
                <select value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} className={inputClass}>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                  <option>Severe</option>
                </select>
              </Field>
              <Field label="Drainage">
                <select value={form.drainage} onChange={(e) => setForm({ ...form, drainage: e.target.value })} className={inputClass}>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                </select>
              </Field>
              <Field label="Shoulder Condition">
                <select value={form.shoulder} onChange={(e) => setForm({ ...form, shoulder: e.target.value })} className={inputClass}>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                </select>
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["cracks", "potholes", "rutting"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setForm({ ...form, [k]: !form[k] })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize",
                    form[k] ? "border-critical/40 bg-critical/10 text-critical" : "border-hairline-strong text-text-tertiary",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Engineer notes…"
              rows={3}
              className="mt-3 w-full rounded-lg border border-hairline-strong bg-white/[0.03] px-3 py-2 text-sm text-text-primary outline-none focus:border-cyan/40"
            />
          </StepCard>
        )}

        {step === 6 && (
          <StepCard title="Review &amp; Submit">
            <div className="space-y-1.5 text-xs text-text-secondary">
              <Row label="Segment" value={`${segment.routeNumber} ${segment.segmentLabel}`} />
              <Row label="Weather" value={`${form.weather}, ${form.temperature}°C`} />
              <Row label="Surface" value={form.surface} />
              <Row label="Drainage" value={form.drainage} />
              <Row label="Distress" value={[form.cracks && "Cracks", form.potholes && "Potholes", form.rutting && "Rutting"].filter(Boolean).join(", ") || "None noted"} />
            </div>
          </StepCard>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 items-center gap-2.5 border-t border-hairline bg-base/95 px-4 py-3.5 backdrop-blur">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Button variant="primary" className="flex-1" onClick={next} disabled={!canAdvance}>
          {step === STEPS.length - 1 ? "Submit Inspection" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-hairline-strong bg-white/[0.03] px-2.5 py-2 text-sm text-text-primary outline-none focus:border-cyan/40";

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hairline bg-panel/60 p-4">
      <h2 className="mb-3 font-display text-sm font-bold text-text-primary">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}
