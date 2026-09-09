import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-cyan text-text-inverse hover:bg-cyan/90 shadow-[0_0_0_1px_rgba(53,224,208,0.4)]",
  secondary: "bg-white/[0.06] text-text-primary hover:bg-white/[0.1] border border-hairline-strong",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5",
  outline: "bg-transparent text-text-primary border border-hairline-strong hover:border-cyan/40 hover:text-cyan",
  danger: "bg-critical/15 text-critical border border-critical/30 hover:bg-critical/25",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5",
  md: "text-sm px-3.5 py-2 gap-2",
  lg: "text-sm px-5 py-3 gap-2",
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
