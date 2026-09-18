import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { errorMessages } from "@/lib/api";

export function Panel({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-xl bg-ink2/80 hairline", className)}>
      {title ? (
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-ink3/60 px-4 py-3">
          <span className="min-w-0 break-words text-[11px] uppercase tracking-[0.16em] text-steel">
            {title}
          </span>

          {right ? (
            <span className="min-w-0 break-words text-[10px] text-signal">{right}</span>
          ) : null}
        </header>
      ) : null}

      <div className={cn("min-w-0 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Meta({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "signal" | "clear" | "danger";
}) {
  return (
    <div className="min-w-0">
      <div className="break-words label-mono tracking-widest">{label}</div>

      <div
        className={cn(
          "mt-1 min-w-0 break-words text-sm text-cream",
          tone === "signal" && "text-signal",
          tone === "clear" && "text-clear",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "signal" | "clear" | "danger" | "steel";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded border border-line bg-ink3 px-2 py-1 text-[10px] uppercase tracking-wide",
        tone === "neutral" && "text-cream",
        tone === "signal" && "text-signalsoft",
        tone === "clear" && "text-clear",
        tone === "danger" && "text-danger",
        tone === "steel" && "text-steel",
      )}
    >
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

const RISK_TONE: Record<string, "clear" | "signal" | "danger" | "steel"> = {
  LOW: "clear",
  MEDIUM: "signal",
  HIGH: "signal",
  CRITICAL: "danger",
};

export function RiskTag({ level }: { level?: string | undefined }) {
  const key = (level ?? "").toUpperCase();

  return <Tag tone={RISK_TONE[key] ?? "steel"}>{key || "UNKNOWN"}</Tag>;
}

const STATUS_TONE: Record<string, "clear" | "signal" | "danger" | "steel"> = {
  recommended: "clear",
  needs_review: "signal",
  accepted: "clear",
  rejected: "danger",
  department_approved: "signal",
  drm_approved: "signal",
  bdms_submitted: "clear",
  APPROVED_RECOMMENDED: "clear",
  NEEDS_OFFICER_REVIEW: "signal",
};

export function StatusTag({ status }: { status?: string | undefined }) {
  if (!status) return <Tag tone="steel">—</Tag>;

  return <Tag tone={STATUS_TONE[status] ?? "steel"}>{status.replace(/_/g, " ")}</Tag>;
}

export function Lamp({
  tone = "clear",
  pulse = true,
}: {
  tone?: "clear" | "signal" | "danger" | "steel";
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        tone === "clear" && "bg-clear text-clear",
        tone === "signal" && "bg-signal text-signal",
        tone === "danger" && "bg-danger text-danger",
        tone === "steel" && "bg-steel text-steel",
        pulse && "lamp",
      )}
    />
  );
}

export function PageHeader({
  title,
  intro,
  actions,
}: {
  eyebrow?: string;
  title: string;
  intro?: string | undefined;
  actions?: ReactNode;
}) {
  return (
    <div className="rise flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words font-display text-2xl font-semibold leading-tight tracking-tight text-cream sm:text-3xl">
          {title}
        </h1>

        {intro ? (
          <p className="mt-2 max-w-[70ch] break-words text-sm leading-relaxed text-steel">
            {intro}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div>
      ) : null}
    </div>
  );
}

export function ChromeButton({
  children,
  type = "button",
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "max-w-full rounded-md px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide hairline transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "max-w-full rounded-md border px-4 py-2.5 text-[11px] uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40",
        tone === "neutral" && "border-line text-cream hover:bg-ink3",
        tone === "danger" && "border-danger/50 text-danger hover:bg-danger/10",
        className,
      )}
    >
      <span className="break-words">{children}</span>
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="block break-words label-mono tracking-widest">{label}</span>

      <div className="mt-1.5 min-w-0">{children}</div>

      {hint && !error ? (
        <span className="mt-1 block break-words text-[10px] text-steel/70">{hint}</span>
      ) : null}

      {error ? (
        <span className="mt-1 block break-words text-[10px] text-danger">{error}</span>
      ) : null}
    </label>
  );
}

const controlClasses =
  "w-full min-w-0 max-w-full rounded-md border border-line bg-ink3/60 px-3 py-2 text-[12px] text-cream outline-none transition placeholder:text-steel/50 focus:border-signal/60";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClasses, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(controlClasses, "min-h-20 resize-y", props.className)} />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClasses, "appearance-none", props.className)} />;
}

export function Loading({ label = "Working…" }: { label?: string | undefined }) {
  return (
    <div className="flex min-w-0 items-center gap-2 py-6 text-[11px] uppercase tracking-[0.2em] text-steel">
      <Lamp tone="signal" />

      <span className="min-w-0 break-words">{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string | undefined }) {
  return (
    <div className="min-w-0 rounded-md border border-dashed border-line px-4 py-8 text-center">
      <p className="break-words font-display text-sm uppercase tracking-wide text-cream">{title}</p>

      {hint ? <p className="mt-1.5 break-words text-[11px] text-steel">{hint}</p> : null}
    </div>
  );
}

export function ErrorNote({ error, title }: { error: unknown; title?: string | undefined }) {
  const messages = errorMessages(error);

  return (
    <div className="min-w-0 rounded-md border border-danger/50 bg-danger/10 px-3 py-2.5">
      <p className="break-words text-[10px] uppercase tracking-[0.2em] text-danger">
        {title ?? "Error"}
      </p>

      <ul className="mt-1.5 space-y-1">
        {messages.map((m, i) => (
          <li key={i} className="break-words text-[11px] text-cream">
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Disclaimer({ text }: { text?: string | undefined }) {
  return (
    <p className="break-words text-[10px] leading-relaxed text-steel/70">
      {text ?? "Prototype — heuristic optimizer, simulated corridor data."}
    </p>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "signal" | "clear" | "danger" | undefined;
}) {
  return (
    <div className="h-full min-w-0 rounded-lg bg-ink2/80 p-4 hairline">
      <div className="break-words label-mono tracking-widest">{label}</div>

      <div
        className={cn(
          "mt-2 break-words font-display text-2xl font-semibold leading-none text-cream sm:text-3xl",
          tone === "signal" && "text-signal",
          tone === "clear" && "text-clear",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </div>

      {sub ? <div className="mt-2 break-words text-[10px] text-steel">{sub}</div> : null}
    </div>
  );
}

export function DataTable({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-[11px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="label-mono whitespace-nowrap border-b border-line px-3 py-2 font-normal"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="[&_td]:border-b [&_td]:border-line/50 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-cream [&_tr:hover]:bg-ink3/40">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total?: number | undefined;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(totalPages, 1);

  return (
    <div className="flex min-w-0 flex-col gap-3 pt-4 text-[11px] text-steel sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <span className="break-words">
        {total !== undefined ? `${total.toLocaleString("en-IN")} records · ` : ""}
        page {page} / {pages}
      </span>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <GhostButton
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-full sm:w-auto"
        >
          Prev
        </GhostButton>

        <GhostButton
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="w-full sm:w-auto"
        >
          Next
        </GhostButton>
      </div>
    </div>
  );
}

/** Loading / error / empty handling shared by every data panel. */
export function AsyncBlock<T>({
  isLoading,
  error,
  data,
  isEmpty,
  emptyTitle = "Nothing here yet",
  emptyHint,
  loadingLabel,
  errorTitle,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  data: T;
  isEmpty?: ((data: NonNullable<T>) => boolean) | undefined;
  emptyTitle?: string | undefined;
  emptyHint?: string | undefined;
  loadingLabel?: string | undefined;
  errorTitle?: string | undefined;
  children: (data: NonNullable<T>) => ReactNode;
}) {
  if (isLoading) {
    return <Loading label={loadingLabel} />;
  }

  if (error) {
    return <ErrorNote error={error} title={errorTitle} />;
  }

  if (data === undefined || data === null) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  const value = data as NonNullable<T>;

  if (isEmpty?.(value)) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  return <>{children(value)}</>;
}

export function ScoreBar({
  value,
  max = 100,
}: {
  value?: number | null | undefined;
  max?: number;
}) {
  const has = typeof value === "number" && Number.isFinite(value);

  const pct = has ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-ink3">
        <div
          className={cn(
            "h-full rounded-full",
            pct >= 60
              ? "bg-danger"
              : pct >= 40
                ? "bg-signal"
                : pct >= 20
                  ? "bg-signalsoft"
                  : "bg-clear",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className="shrink-0 tabular-nums">{has ? value.toFixed(1) : "—"}</span>
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-start gap-2 text-[11px] text-cream">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-3.5 shrink-0 accent-(--signal)"
      />

      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

export function KeyValueGrid({ data }: { data: Record<string, unknown> | undefined | null }) {
  if (!data) return null;

  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined && typeof v !== "object",
  );

  if (!entries.length) return null;

  return (
    <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="break-words label-mono tracking-widest">
            {k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
          </dt>

          <dd className="mt-1 break-words text-[12px] text-cream">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
