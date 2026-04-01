import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
          {
            "bg-primary-600/90 backdrop-blur-md text-white shadow-[0_4px_20px_-4px_rgba(37,99,235,0.4)] border border-white/10 hover:bg-primary-600 hover:shadow-[0_8px_25px_-4px_rgba(37,99,235,0.6)] hover:-translate-y-1 active:translate-y-0 after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-tr after:from-white/0 after:via-white/20 after:to-white/0 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500": variant === "default",
            "bg-destructive-600/90 backdrop-blur-md text-white shadow-[0_4px_20px_-4px_rgba(220,38,38,0.4)] border border-white/10 hover:bg-destructive-600 hover:shadow-[0_8px_25px_-4px_rgba(220,38,38,0.6)] hover:-translate-y-1 active:translate-y-0 after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-tr after:from-white/0 after:via-white/20 after:to-white/0 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500": variant === "destructive",
            "border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white shadow-sm hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0": variant === "outline",
            "bg-slate-100/80 dark:bg-white/10 backdrop-blur-md text-slate-900 dark:text-white hover:bg-slate-200/80 dark:hover:bg-white/20 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0": variant === "secondary",
            "hover:bg-slate-100/50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors": variant === "ghost",
            "text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline": variant === "link",
            "h-10 px-5 py-2": size === "default",
            "h-9 rounded-lg px-4": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
