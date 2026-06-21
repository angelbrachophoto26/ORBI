import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-orbi-primary hover:bg-orbi-primary-hover text-white shadow-sm":
              variant === "primary",
            "bg-orbi-card hover:bg-orbi-border text-foreground border border-orbi-border":
              variant === "secondary",
            "hover:bg-orbi-card text-orbi-muted hover:text-foreground":
              variant === "ghost",
            "bg-orbi-accent hover:bg-orbi-accent-dim text-orbi-primary font-bold shadow-sm":
              variant === "gold",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
