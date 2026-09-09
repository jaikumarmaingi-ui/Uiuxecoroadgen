import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-IN", opts).format(value);
}

export function formatKm(value: number) {
  return `${formatNumber(value)} km`;
}

export function formatCrore(value: number) {
  return `₹${value.toFixed(1)} Cr`;
}

export function formatLakh(value: number) {
  return `₹${value.toFixed(1)} L`;
}

export function daysAgo(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.round((now - then) / (1000 * 60 * 60 * 24)));
  return diff;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
