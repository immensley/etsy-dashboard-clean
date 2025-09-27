"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-xs font-medium uppercase tracking-[0.24em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-white hover:bg-white/20 border border-white/10",
        primary:
          "bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 text-slate-950 shadow-[0_18px_60px_rgba(56,189,248,0.32)] hover:brightness-110",
        ghost: "bg-transparent text-white/70 hover:text-white border border-transparent",
        outline: "border border-white/15 bg-white/5 text-white/80 hover:border-emerald-300/40 hover:text-white",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1.5 text-[10px]",
        lg: "px-6 py-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
