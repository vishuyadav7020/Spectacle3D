import { type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-primary text-bg shadow-md shadow-accent-primary/25 hover:shadow-lg hover:shadow-accent-primary/35 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:brightness-95",
  secondary:
    "bg-surface-2 text-text-primary border border-border hover:border-accent-primary/60 hover:-translate-y-0.5 active:translate-y-0",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-pill px-6 py-3.5 font-body text-[15px] font-semibold transition-all duration-200 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
