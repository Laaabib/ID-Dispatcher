import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-900/70": variant === "default",
          "border-transparent bg-slate-100 dark:bg-secondary-900/50 text-slate-700 dark:text-secondary-200 hover:bg-slate-200 dark:hover:bg-secondary-900/70": variant === "secondary",
          "border-transparent bg-destructive-100 dark:bg-destructive-900/50 text-destructive-700 dark:text-destructive-200 hover:bg-destructive-200 dark:hover:bg-destructive-900/70": variant === "destructive",
          "border-transparent bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900/70": variant === "success",
          "border-transparent bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/70": variant === "warning",
          "text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
