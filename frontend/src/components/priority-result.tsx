import type { PriorityResult } from "@/lib/types";
import { KeyValueGrid, RiskTag } from "@/components/control";
import { cn } from "@/lib/utils";

export function PriorityResultView({ result }: { result: PriorityResult }) {
  const score = result.priority_score ?? 0;

  const tone = score >= 75 ? "danger" : score >= 50 ? "signal" : "clear";

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="label-mono tracking-widest">Priority score</div>

          <div
            className={cn(
              "mt-1 break-words font-display text-5xl font-semibold leading-none sm:text-6xl",
              tone === "danger" ? "text-danger" : tone === "signal" ? "text-signal" : "text-clear",
            )}
          >
            {score.toFixed(1)}

            <span className="ml-1 text-base text-steel sm:text-xl">/ 100</span>
          </div>
        </div>

        <div className="w-fit max-w-full shrink-0">
          <RiskTag level={result.priority_level} />
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-ink3">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            tone === "danger" ? "bg-danger" : tone === "signal" ? "bg-signal" : "bg-clear",
          )}
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
          }}
        />
      </div>

      {result.major_contributing_factors?.length ? (
        <div className="min-w-0">
          <div className="label-mono mb-2 tracking-widest">Contributing factors</div>

          <ul className="space-y-2">
            {result.major_contributing_factors.map((factor, index) => (
              <li
                key={index}
                className="flex min-w-0 items-start gap-2 text-sm leading-5 text-steel"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" />

                <span className="min-w-0 break-words">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.raw_task_reference ? (
        <div className="min-w-0">
          <div className="label-mono mb-2 tracking-widest">Task reference</div>

          <div className="min-w-0 overflow-hidden rounded-md">
            <KeyValueGrid data={result.raw_task_reference} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
