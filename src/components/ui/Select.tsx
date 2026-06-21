import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground/80">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 py-2.5 bg-orbi-card border border-orbi-border-light rounded-lg text-foreground text-sm appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-orbi-accent/50 focus:border-orbi-accent transition-all duration-200",
            error && "border-red-500",
            className
          )}
          {...props}
        >
          <option value="" disabled className="bg-orbi-surface">
            Selecciona una opción
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-orbi-surface">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
