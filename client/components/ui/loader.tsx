"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
  xl: "h-16 w-16 border-4",
};

export function LoaderOne({
  size = "md",
  className,
  text,
  ...props
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={text || "Loading..."}
      className={cn("flex flex-col items-center justify-center gap-3 p-4", className)}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing aura */}
        <div
          className={cn(
            "absolute rounded-full opacity-30 animate-ping duration-1000",
            size === "sm" && "h-6 w-6 bg-purple-500",
            size === "md" && "h-10 w-10 bg-purple-500",
            size === "lg" && "h-16 w-16 bg-purple-500",
            size === "xl" && "h-20 w-20 bg-purple-500"
          )}
        />

        {/* Outer counter-rotating gradient track */}
        <div
          className={cn(
            "rounded-full border-t-transparent border-r-transparent border-purple-500/20 animate-spin",
            sizeClasses[size]
          )}
          style={{ animationDuration: "1.6s", animationDirection: "reverse" }}
        />

        {/* Primary animated spinner ring with vibrant accent */}
        <div
          className={cn(
            "absolute rounded-full border-t-purple-600 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin",
            sizeClasses[size]
          )}
          style={{ animationDuration: "0.85s" }}
        />

        {/* Inner high-energy glowing pip */}
        <div
          className={cn(
            "absolute rounded-full bg-purple-600 shadow-[0_0_12px_rgba(147,51,234,0.7)] animate-pulse",
            size === "sm" && "h-1.5 w-1.5",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3.5 w-3.5",
            size === "xl" && "h-4 w-4"
          )}
        />
      </div>

      {text && (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}

export { LoaderOne as default };
