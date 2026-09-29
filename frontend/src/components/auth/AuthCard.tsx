import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6 py-16">
      <div className="pointer-events-none absolute -left-24 top-1/4 -z-10 h-72 w-72 rounded-full bg-accent-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 -z-10 h-72 w-72 rounded-full bg-accent-secondary/15 blur-[100px]" />

      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 block text-center font-display text-2xl font-bold text-accent-primary"
        >
          Spectacle3D
        </Link>

        <div className="rounded-lg border border-border bg-surface p-8 shadow-xl shadow-black/5">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            {title}
          </h1>
          <p className="mt-2 font-body text-sm text-text-secondary">
            {subtitle}
          </p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center font-body text-sm text-text-secondary">
          {footerText}{" "}
          <Link
            to={footerLinkTo}
            className="font-medium text-accent-primary hover:underline"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
