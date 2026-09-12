interface ComingSoonProps {
  title: string;
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-text-primary">
        {title}
      </h1>
      <p className="mt-4 font-body text-sm text-text-secondary">
        This section isn't built yet — it needs its own backend endpoints
        before it can show real data here.
      </p>
    </div>
  );
}
