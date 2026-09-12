import { Check } from "lucide-react";

const STEPS = ["Cart", "Checkout", "Confirmation"];

interface CheckoutStepsProps {
  current: number; // 0-indexed
}

export function CheckoutSteps({ current }: CheckoutStepsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full font-body text-xs font-semibold ${
                i < current
                  ? "bg-accent-primary text-bg"
                  : i === current
                    ? "border-2 border-accent-primary text-accent-primary"
                    : "border border-border text-text-secondary"
              }`}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={`font-body text-sm ${
                i <= current ? "text-accent-primary" : "text-text-secondary"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && <div className="h-px w-16 bg-border" />}
        </div>
      ))}
    </div>
  );
}
