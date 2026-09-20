export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border-strong font-mono text-sm">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="px-3 py-1.5 text-ink hover:bg-surface-2 disabled:opacity-40"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        &minus;
      </button>
      <span className="border-x border-border px-3.5 py-1.5 tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="px-3 py-1.5 text-ink hover:bg-surface-2 disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
