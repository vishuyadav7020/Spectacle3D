import { type InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, type, ...props }, ref) => {
    const inputId = id ?? props.name;
    const isPassword = type === "password";
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="font-body text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (visible ? "text" : "password") : type}
            className={`w-full rounded-md border border-border bg-surface px-4 py-3 font-body text-base text-text-primary placeholder:text-text-secondary/60 focus:border-accent-primary focus:outline-none ${
              isPassword ? "pr-11" : ""
            }`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && (
          <p className="font-body text-sm text-accent-warm">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
