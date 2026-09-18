import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Field, PageHeader, Panel, Stat, Tag, TextInput } from "@/components/control";
import { useStation, todayISO } from "@/lib/station-context";
import { addDays, prettyDate, to12h, weekdayName } from "@/lib/block-plan";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      {
        title: "Maintenance Schedule — Railway AI Block Planner",
      },
    ],
  }),
  component: Schedule,
});

type Horizon = "daily" | "weekly" | "monthly";

const HORIZONS: {
  id: Horizon;
  label: string;
  hint: string;
}[] = [
  {
    id: "daily",
    label: "Daily",
    hint: "Work due on one date",
  },
  {
    id: "weekly",
    label: "Weekly",
    hint: "Seven days from the date you pick",
  },
  {
    id: "monthly",
    label: "Monthly",
    hint: "Everything due in that month",
  },
];

interface PlannedBlock {
  blockId: string;
  taskId: string;
  title: string;
  department: string;
  priority: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  sequence: number;
  totalBlocks: number;
}

function Schedule() {
  const { activeStation, tasks } = useStation();

  const [horizon, setHorizon] = useState<Horizon>("weekly");

  const [anchor, setAnchor] = useState(() => todayISO());

  const blocks = useMemo<PlannedBlock[]>(() => {
    return tasks
      .filter((t) => t.status !== "completed")
      .flatMap((t) => {
        const sessions = t.sessions?.length
          ? t.sessions
          : t.scheduledWindow
            ? [
                {
                  blockId: `${t.id}-B01`,
                  sequence: 1,
                  date: t.scheduledWindow.date,
                  startTime: t.scheduledWindow.startTime,
                  endTime: t.scheduledWindow.endTime,
                  hours: t.durationHours,
                },
              ]
            : [];

        return sessions.map((s) => ({
          blockId: s.blockId,
          taskId: t.id,
          title: t.title,
          department: t.department,
          priority: t.priority,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          hours: s.hours,
          sequence: s.sequence,
          totalBlocks: sessions.length,
        }));
      });
  }, [tasks]);

  const { days, rangeLabel } = useMemo(() => {
    if (horizon === "daily") {
      return {
        days: [anchor],
        rangeLabel: `${weekdayName(anchor)} ${prettyDate(anchor)}`,
      };
    }

    if (horizon === "weekly") {
      return {
        days: Array.from({ length: 7 }, (_, i) => addDays(anchor, i)),
        rangeLabel: `${prettyDate(anchor)} – ${prettyDate(addDays(anchor, 6))}`,
      };
    }

    const d = new Date(`${anchor}T00:00:00`);

    const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

    const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    return {
      days: Array.from({ length: total }, (_, i) => addDays(first, i)),
      rangeLabel: d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    };
  }, [horizon, anchor]);

  const byDate = useMemo(() => {
    const map = new Map<string, PlannedBlock[]>();

    for (const block of blocks) {
      map.set(block.date, [...(map.get(block.date) ?? []), block]);
    }

    return map;
  }, [blocks]);

  const activeDays = days.filter((d) => byDate.has(d));

  const blockCount = activeDays.reduce((count, day) => count + (byDate.get(day) ?? []).length, 0);

  const totalHours = activeDays.reduce(
    (sum, day) => sum + (byDate.get(day) ?? []).reduce((daySum, block) => daySum + block.hours, 0),
    0,
  );

  const jobCount = new Set(
    activeDays.flatMap((day) => (byDate.get(day) ?? []).map((block) => block.taskId)),
  ).size;

  const shift = (dir: number) =>
    setAnchor((prev) =>
      addDays(prev, horizon === "daily" ? dir : horizon === "weekly" ? dir * 7 : dir * 30),
    );

  const dateLabel =
    horizon === "daily" ? "Date" : horizon === "weekly" ? "Week starting" : "Any date in the month";

  const today = todayISO();

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="MAINTENANCE SCHEDULE"
        title={`${activeStation.name} block calendar`}
        intro="Every block allotted at this station. Switch between a single day, a seven-day run and a whole month — the dates below follow whichever you pick."
      />

      <div className="grid min-w-0 items-start gap-4 sm:gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4">
          <Panel title="Schedule controls" right={activeStation.code}>
            <div className="space-y-5">
              <div>
                <span className="label-mono block tracking-widest">Planning horizon</span>

                <div className="mt-2 grid gap-2">
                  {HORIZONS.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHorizon(h.id)}
                      className={`min-h-11 rounded-md border px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wider transition ${
                        horizon === h.id
                          ? "border-signal bg-signal/15 text-signal"
                          : "border-line bg-ink3/40 text-steel hover:border-signal/50 hover:text-cream"
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-[10px] leading-4 text-steel">
                  {HORIZONS.find((h) => h.id === horizon)?.hint}
                </p>
              </div>

              <Field label={dateLabel}>
                <TextInput
                  type="date"
                  value={anchor}
                  onChange={(e) => setAnchor(e.target.value || today)}
                />
              </Field>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Stat
              label="Scheduled jobs"
              value={jobCount}
              sub={`Across ${activeDays.length} active days`}
            />

            <Stat
              label="Block sessions"
              value={blockCount}
              tone="signal"
              sub={`Within ${rangeLabel}`}
            />

            <Stat
              label="Planned hours"
              value={`${totalHours}h`}
              tone="clear"
              sub="Possession time allotted"
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <Panel
            title="Scheduled work"
            right={
              <div className="flex max-w-full items-center gap-0.5 text-[10px] text-steel">
                <button
                  type="button"
                  onClick={() => shift(-1)}
                  className="min-h-8 min-w-8 rounded px-2 py-1 transition hover:bg-ink3 hover:text-cream"
                  aria-label="Previous period"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={() => setAnchor(today)}
                  className="min-h-8 rounded px-2 py-1 font-semibold uppercase tracking-wide transition hover:bg-ink3 hover:text-cream"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => shift(1)}
                  className="min-h-8 min-w-8 rounded px-2 py-1 transition hover:bg-ink3 hover:text-cream"
                  aria-label="Next period"
                >
                  →
                </button>
              </div>
            }
          >
            <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-line/70 pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="break-words font-display text-lg font-semibold text-cream sm:text-xl">
                  {rangeLabel}
                </div>

                <p className="mt-1 text-[11px] leading-4 text-steel">
                  {activeDays.length
                    ? `${activeDays.length} active days with scheduled work`
                    : "No active days in this view"}
                </p>
              </div>

              <div className="w-fit shrink-0 rounded-md bg-ink3 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-steel">
                {horizon} view
              </div>
            </div>

            {activeDays.length === 0 ? (
              <div className="rounded-lg border border-line bg-ink3/30 p-5 text-center sm:p-6">
                <CalendarDays className="mx-auto size-5 text-steel" />

                <div className="mt-2 font-display text-sm uppercase text-cream">
                  {horizon === "daily"
                    ? "Nothing due on this date"
                    : horizon === "weekly"
                      ? "Nothing due in these seven days"
                      : "Nothing due this month"}
                </div>

                <p className="mt-1 text-[11px] leading-4 text-steel">
                  Raise a request and the allotted nights appear here.
                </p>
              </div>
            ) : (
              <div className="max-h-[680px] min-w-0 overflow-y-auto overflow-x-hidden rounded-lg border border-line/60 bg-ink2">
                <div className="divide-y divide-line/60">
                  {activeDays.map((date) => {
                    const dayBlocks = (byDate.get(date) ?? []).sort((a, b) =>
                      a.startTime.localeCompare(b.startTime),
                    );

                    const isToday = date === today;

                    return (
                      <div key={date} className="min-w-0">
                        <div
                          className={`flex min-w-0 flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 ${
                            isToday ? "bg-signal/10" : "bg-ink3/40"
                          }`}
                        >
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <CalendarDays className="size-3.5 shrink-0 text-steel" />

                            <span className="break-words font-display text-sm font-semibold text-cream sm:text-base">
                              {weekdayName(date)} {prettyDate(date)}
                            </span>

                            {isToday ? <Tag tone="signal">TODAY</Tag> : null}
                          </div>

                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-steel sm:text-[11px]">
                            {dayBlocks.length} block
                            {dayBlocks.length > 1 ? "s" : ""} ·{" "}
                            {dayBlocks.reduce((sum, block) => sum + block.hours, 0)}h
                          </span>
                        </div>

                        <div className="space-y-2 p-2.5 sm:p-4">
                          {dayBlocks.map((block) => (
                            <div
                              key={block.blockId}
                              className="grid min-w-0 gap-2 sm:gap-3 sm:grid-cols-[210px_minmax(0,1fr)]"
                            >
                              <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-ink3/60 px-3 py-2.5 sm:py-3">
                                <div className="whitespace-nowrap text-sm font-semibold text-cream sm:text-[15px]">
                                  {to12h(block.startTime)}
                                </div>

                                <div className="text-xs text-steel">→</div>

                                <div className="whitespace-nowrap text-sm font-semibold text-cream sm:text-[15px]">
                                  {to12h(block.endTime)}
                                </div>

                                <div className="border-l border-line/70 pl-2 text-[10px] text-steel sm:text-[11px]">
                                  {block.hours}h
                                </div>
                              </div>

                              <div className="min-w-0 rounded-lg border border-line/70 bg-ink2 px-3 py-2.5">
                                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="break-words text-sm font-semibold leading-5 text-cream">
                                      {block.title}
                                    </div>

                                    <div className="mt-0.5 break-words text-[10px] leading-4 text-steel">
                                      {block.blockId} · {block.department}
                                      {block.totalBlocks > 1
                                        ? ` · Part ${block.sequence}/${block.totalBlocks}`
                                        : ""}
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    <Tag
                                      tone={
                                        block.priority === "CRITICAL"
                                          ? "danger"
                                          : block.priority === "HIGH"
                                            ? "signal"
                                            : "clear"
                                      }
                                    >
                                      {block.priority}
                                    </Tag>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
