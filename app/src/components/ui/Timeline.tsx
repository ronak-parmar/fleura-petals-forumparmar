export interface TimelineStep {
  label: string;
  detail?: string;
  state: "done" | "current" | "upcoming";
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => (
        <li key={step.label} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <span
              className={`block h-3.5 w-3.5 rounded-full border-2 ${
                step.state === "done"
                  ? "border-leaf bg-leaf"
                  : step.state === "current"
                    ? "border-rosewood bg-rosewood"
                    : "border-border-strong bg-surface"
              }`}
            />
            {i < steps.length - 1 && <span className="w-0.5 flex-1 bg-border-strong" />}
          </div>
          <div className="pb-5">
            <h4 className="text-sm font-bold text-ink">{step.label}</h4>
            {step.detail && <p className="text-xs text-text-muted">{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
