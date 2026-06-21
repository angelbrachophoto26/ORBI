import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground/80">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 py-2.5 bg-orbi-card border border-orbi-border-light rounded-lg text-foreground placeholder:text-orbi-muted text-sm resize-none",
            "focus:outline-none focus:ring-2 focus:ring-orbi-accent/50 focus:border-orbi-accent transition-all duration-200",
            error && "border-red-500 focus:ring-red-500/50",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-orbi-muted">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
