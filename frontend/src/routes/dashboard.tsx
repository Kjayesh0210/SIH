import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { usePersona } from "@/lib/persona";
import {
  backendHealthQuery,
  blockRequestsQuery,
  healthQuery,
  kpisQuery,
  riskCountQuery,
  stationSearchQuery,
  stationSummaryQuery,
} from "@/lib/queries";
import { apiPatch } from "@/lib/api";
import type { BlockRequest } from "@/lib/types";
import {
  AsyncBlock,
  DataTable,
  Lamp,
  Meta,
  Panel,
  RiskTag,
  Stat,
  Tag,
  TextInput,
  ChromeButton,
  GhostButton,
} from "@/components/control";
import { fmtNum } from "@/lib/format";
import { useStation, isOverdue, todayISO, type StationTask } from "@/lib/station-context";
import { getLiveTrains } from "@/lib/live-trains";
import { addDays, prettyDate, to12h, weekdayName, type BlockSession } from "@/lib/block-plan";
import {
  MapPin,
  Radio,
  AlertTriangle,
  Train,
  Mail,
  Plus,
  CheckCircle2,
  CalendarClock,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Station Dashboard — Railway AI Block Planner" }] }),
  component: Dashboard,
});

function count(q: { isLoading: boolean; isError: boolean; data?: number | undefined }) {
  if (q.isLoading) return "…";
  if (q.isError) return "—";
  return fmtNum(q.data, 0);
}

/** 24h "HH:MM" to "hh:mm AM/PM" — officers read block orders in 12h clock. */
function ampm(time?: string): string {
  if (!time) return "—";
  const parts = time.split(":").map(Number);
  const h = parts[0];
  const m = parts[1];
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${String(display).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

function timeToMinutes(time?: string): number {
  if (!time) return 0;
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

function timeWindowStyle(startTime?: string, endTime?: string) {
  const start = Math.max(0, Math.min(timeToMinutes(startTime), 1440));
  let end = Math.max(0, timeToMinutes(endTime));
  if (end <= start) end += 1440;
  end = Math.min(end, 1440);

  return {
    left: `${(start / 1440) * 100}%`,
    width: `${Math.max(((end - start) / 1440) * 100, 3)}%`,
  };
}

function dayLabel(date?: string): string {
  if (!date) return "—";
  const today = todayISO();
  if (date === today) return "Today";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

/** Search real stations from the asset database. */
function StationLens() {
  const { persona } = usePersona();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    if (persona.id === "station_master" && persona.stationCode) {
      setSelected({ code: persona.stationCode, name: persona.stationName ?? persona.stationCode });
    }
  }, [persona.id, persona.stationCode, persona.stationName]);

  const search = useQuery(stationSearchQuery(query));
  const summary = useQuery(stationSummaryQuery(selected?.code ?? ""));
  const showDropdown = query.length > 0 && !selected;

  return (
    <Panel
      title="Database Asset Station Lens"
      right={<span className=" text-[10px] text-steel">DATABASE ASSETS SNAPSHOT</span>}
    >
      <div className="relative w-full max-w-sm">
        <TextInput
          placeholder="Search a station (code or name)…"
          value={selected ? `${selected.name} (${selected.code})` : query}
          onChange={(e) => {
            setSelected(null);
            setQuery(e.target.value);
          }}
        />
        {showDropdown ? (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-line bg-ink2 shadow-lg">
            {search.isLoading ? (
              <div className="px-3 py-2  text-[11px] text-steel">Searching…</div>
            ) : search.data?.length ? (
              search.data.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  className="block w-full px-3 py-2 text-left  text-[11px] text-cream hover:bg-ink3"
                  onClick={() => {
                    setSelected({ code: s.code, name: s.name });
                    setQuery("");
                  }}
                >
                  {s.name} <span className="text-steel">({s.code})</span>
                  <span className="ml-2 text-steel">{s.assetCount} assets</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2  text-[11px] text-steel">No station matches.</div>
            )}
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="mt-3 sm:mt-4">
          <AsyncBlock
            isLoading={summary.isLoading}
            error={summary.error}
            data={summary.data}
            loadingLabel="Loading station snapshot…"
          >
            {(s) => (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
                  <Stat label="Assets" value={fmtNum(s.assetCount, 0)} />
                  <Stat
                    label="Critical"
                    value={fmtNum(s.riskLevelCounts.CRITICAL, 0)}
                    tone="danger"
                  />
                  <Stat label="High risk" value={fmtNum(s.riskLevelCounts.HIGH, 0)} tone="signal" />
                  <Stat label="Pending tasks" value={fmtNum(s.pendingTaskCount, 0)} />
                  <Stat
                    label="Overdue maintenance"
                    value={fmtNum(s.overdueMaintenanceCount, 0)}
                    tone={s.overdueMaintenanceCount > 0 ? "danger" : "clear"}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.assetTypes.map((t) => (
                    <Tag key={t} tone="steel">
                      {t}
                    </Tag>
                  ))}
                  {Object.entries(s.tasksByDepartment).map(([dept, n]) => (
                    <Tag key={dept} tone="signal">
                      {dept}: {n} pending
                    </Tag>
                  ))}
                </div>
                <DataTable head={["Asset", "Type", "Risk"]}>
                  {s.assets.map((a) => (
                    <tr key={a.assetId}>
                      <td className="text-signal">
                        <Link
                          to="/assets/$assetId"
                          params={{ assetId: a.assetId }}
                          className="hover:underline"
                        >
                          {a.assetId}
                        </Link>
                      </td>
                      <td className="text-steel">{a.assetType ?? "—"}</td>
                      <td>
                        <RiskTag level={a.riskLevel} />
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            )}
          </AsyncBlock>
        </div>
      ) : (
        <p className="mt-3  text-[11px] text-steel">
          Search a station to inspect its raw imported assets, risk levels and maintenance logs.
        </p>
      )}
    </Panel>
  );
}

/**
 * The workbench shows two things that are really the same thing: locally
 * logged station tasks and block requests filed through the AI engine. Both
 * are normalised into one shape so the officer sees a single list of open
 * work instead of two competing tables.
 */
export interface WorkItem {
  key: string;
  ref: string;
  title: string;
  department: string;
  priority: string;
  status: "pending" | "scheduled" | "conflict_disrupted";
  fromKm?: number;
  toKm?: number;
  durationHours?: number;
  window?: { date?: string; startTime?: string; endTime?: string };
  source: "station" | "request";
  task?: StationTask;
  requestId?: string;
  /** Every block held for this job — more than one when the work was split. */
  sessions?: BlockSession[];
}

function fromStationTask(task: StationTask): WorkItem {
  const item: WorkItem = {
    key: `station:${task.id}`,
    ref: task.id,
    title: task.title,
    department: task.department,
    priority: task.priority,
    status: task.status === "completed" ? "scheduled" : task.status,
    fromKm: task.fromKm,
    toKm: task.toKm,
    durationHours: task.durationHours,
    source: "station",
    task,
  };
  if (task.scheduledWindow) item.window = task.scheduledWindow;
  if (task.sessions?.length) item.sessions = task.sessions;
  return item;
}

function fromBlockRequest(request: BlockRequest): WorkItem {
  const win = request.selectedWindow;
  const item: WorkItem = {
    key: `request:${request.requestId}`,
    ref: request.requestId,
    title: request.maintenanceType ?? "Block request",
    department: request.department ?? "—",
    priority: request.status === "needs_review" ? "HIGH" : "MEDIUM",
    status: win?.date ? "scheduled" : "pending",
    source: "request",
    requestId: request.requestId,
  };
  if (request.fromKm !== undefined) item.fromKm = request.fromKm;
  if (request.toKm !== undefined) item.toKm = request.toKm;
  if (win?.durationHours !== undefined) item.durationHours = win.durationHours;
  if (win) {
    item.window = {
      ...(win.date ? { date: win.date } : {}),
      ...(win.startTime ? { startTime: win.startTime } : {}),
      ...(win.endTime ? { endTime: win.endTime } : {}),
    };
  }
  return item;
}

function buildDemoWeeklySchedule(startDate: string): { date: string; items: WorkItem[] }[] {
  const planned = [
    {
      day: 0,
      ref: "TMS-LNL-042",
      title: "Rail weld inspection",
      department: "Engineering",
      priority: "HIGH",
      startTime: "01:20",
      endTime: "04:20",
      durationHours: 3,
    },
    {
      day: 1,
      ref: "TRD-LNL-118",
      title: "OHE insulator replacement",
      department: "TRD",
      priority: "CRITICAL",
      startTime: "06:40",
      endTime: "09:10",
      durationHours: 2.5,
    },
    {
      day: 2,
      ref: "SNT-LNL-207",
      title: "Point machine testing",
      department: "S&T",
      priority: "MEDIUM",
      startTime: "10:30",
      endTime: "13:00",
      durationHours: 2.5,
    },
    {
      day: 2,
      ref: "TMS-LNL-051",
      title: "Ballast tamping · Up line",
      department: "Engineering",
      priority: "HIGH",
      startTime: "15:20",
      endTime: "18:20",
      durationHours: 3,
    },
    {
      day: 3,
      ref: "TMS-LNL-051",
      title: "Ballast tamping · Up line",
      department: "Engineering",
      priority: "HIGH",
      startTime: "14:20",
      endTime: "17:20",
      durationHours: 3,
    },
    {
      day: 4,
      ref: "TRD-LNL-124",
      title: "Traction bonding audit",
      department: "TRD",
      priority: "MEDIUM",
      startTime: "18:00",
      endTime: "19:45",
      durationHours: 1.75,
    },
    {
      day: 4,
      ref: "TMS-LNL-042",
      title: "Rail weld inspection",
      department: "Engineering",
      priority: "HIGH",
      startTime: "01:20",
      endTime: "04:20",
      durationHours: 3,
    },
    {
      day: 5,
      ref: "SNT-LNL-214",
      title: "Signal cable health check",
      department: "S&T",
      priority: "LOW",
      startTime: "20:30",
      endTime: "22:30",
      durationHours: 2,
    },
    {
      day: 5,
      ref: "SNT-LNL-207",
      title: "Point machine testing",
      department: "S&T",
      priority: "MEDIUM",
      startTime: "10:30",
      endTime: "13:00",
      durationHours: 2.5,
    },
    {
      day: 6,
      ref: "TMS-LNL-063",
      title: "Track geometry recording",
      department: "Engineering",
      priority: "MEDIUM",
      startTime: "18:00",
      endTime: "22:00",
      durationHours: 2,
    },
  ];

  return Array.from({ length: 7 }, (_, day) => ({
    date: addDays(startDate, day),
    items: planned
      .filter((item) => item.day === day)
      .map((item) => ({
        key: `demo-week-${day}-${item.ref}`,
        ref: item.ref,
        title: item.title,
        department: item.department,
        priority: item.priority,
        status: "scheduled" as const,
        durationHours: item.durationHours,
        window: {
          date: addDays(startDate, day),
          startTime: item.startTime,
          endTime: item.endTime,
        },
        source: "station" as const,
      })),
  }));
}

/** Overdue test that works for both sources. */
function itemOverdue(item: WorkItem, today: string): boolean {
  const planned = item.window?.date;
  return Boolean(planned && planned < today);
}

/** One row of the workbench. Expands to reveal the completion control. */
function TaskCard({
  item,
  overdue,
  expanded,
  onToggle,
  onComplete,
  onChangeTime,
  onSimulate,
  completing,
}: {
  item: WorkItem;
  overdue: boolean;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onChangeTime: () => void;
  onSimulate: () => void;
  completing: boolean;
}) {
  const isPending = item.status === "pending";
  const isScheduled = item.status === "scheduled";
  const isDisrupted = item.status === "conflict_disrupted";
  const task = item.task;

  const border = isDisrupted
    ? "border-danger/60 bg-danger/10"
    : overdue
      ? "border-signal/50 bg-signal/5"
      : isScheduled
        ? "border-clear/40 bg-clear/5"
        : "border-line bg-ink3/40";

  return (
    <div className={`rounded-xl border transition ${border}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-4 p-4 text-left sm:flex-row sm:items-start sm:justify-between sm:p-5"
      >
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <ChevronDown
              className={`size-3.5 text-steel transition ${expanded ? "rotate-180" : ""}`}
            />
            <span className=" text-xs font-bold text-signal">{item.ref}</span>
            <span className="font-display text-base font-semibold text-cream">{item.title}</span>
            <Tag
              tone={
                item.priority === "CRITICAL"
                  ? "danger"
                  : item.priority === "HIGH"
                    ? "signal"
                    : "steel"
              }
            >
              {item.priority}
            </Tag>
            {overdue ? <Tag tone="signal">OVERDUE</Tag> : null}
            {item.sessions && item.sessions.length > 1 ? (
              <Tag tone="steel">{item.sessions.length} BLOCKS</Tag>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-6 text-[11px] text-steel">
            <span>Dept: {item.department}</span>
            {item.fromKm !== undefined && item.toKm !== undefined ? (
              <>
                <span>·</span>
                <span>
                  Span: Km {item.fromKm} – {item.toKm}
                  {item.durationHours !== undefined ? ` (${item.durationHours}h)` : ""}
                </span>
              </>
            ) : null}
            <span>·</span>
            <span
              className={`font-semibold ${
                isDisrupted
                  ? "text-danger"
                  : overdue
                    ? "text-signal"
                    : isScheduled
                      ? "text-clear"
                      : "text-signal"
              }`}
            >
              {isDisrupted
                ? "Disrupted by train delay"
                : item.window?.date
                  ? `${overdue ? "Was planned" : "Planned"} ${dayLabel(item.window.date)} · ${ampm(
                      item.window.startTime,
                    )} – ${ampm(item.window.endTime)}`
                  : "Pending — no block requested yet"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isDisrupted && (
            <button
              type="button"
              onClick={onChangeTime}
              className="flex animate-pulse items-center gap-1.5 rounded bg-danger px-3 py-1.5 font-display text-xs font-semibold uppercase text-white transition hover:bg-danger/90"
            >
              <CalendarClock className="size-3.5" />
              <span>Change time</span>
            </button>
          )}
        </div>
      </button>

      {isDisrupted && task?.disruption && (
        <div className="mx-4 mb-4 space-y-1 rounded border border-danger/40 bg-ink p-3  text-xs">
          <div className="flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle className="size-4" />
            <span>
              Conflict: {task.disruption.trainName} (#{task.disruption.trainNumber}) is +
              {task.disruption.liveDelayMinutes} mins late
            </span>
          </div>
          <p className="text-[11px] text-steel">
            {task.disruption.reason}. Effective passage intersects this possession. An email has
            been dispatched asking you to pick another timing.
          </p>
        </div>
      )}

      {expanded && item.sessions && item.sessions.length > 1 ? (
        <div className="border-t border-line/60 px-4 pt-3">
          <div className="label-mono mb-2 tracking-widest">
            All blocks for this job ({item.sessions.length})
          </div>
          <div className="space-y-1.5">
            {item.sessions.slice(0, 10).map((s) => (
              <div
                key={s.blockId}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-line/60 bg-ink2 px-3 py-1.5  text-[10px]"
              >
                <span className="text-signal">{s.blockId}</span>
                <span className="text-cream">
                  {weekdayName(s.date)} {prettyDate(s.date)}
                </span>
                <span className="text-steel">
                  {to12h(s.startTime)} – {to12h(s.endTime)}
                </span>
              </div>
            ))}
            {item.sessions.length > 10 ? (
              <p className=" text-[10px] text-steel">+ {item.sessions.length - 10} more blocks.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {expanded && (
        <div className="border-t border-line/60 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className=" text-[11px] text-steel">
              {overdue
                ? "This block passed its planned date without being closed out."
                : "Close this out once the work is physically finished on site."}
              {item.source === "request" && item.requestId ? (
                <>
                  {" "}
                  <Link
                    to="/requests/$requestId"
                    params={{ requestId: item.requestId }}
                    className="text-signal hover:underline"
                  >
                    Open full request →
                  </Link>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {isScheduled && item.source === "station" && (
                <GhostButton
                  onClick={onSimulate}
                  className="border border-danger/30 px-2.5 py-1  text-[11px] text-danger hover:bg-danger/15"
                >
                  Simulate train delay (+35m)
                </GhostButton>
              )}
              <ChromeButton
                onClick={onComplete}
                disabled={completing}
                className="flex items-center gap-1.5 px-3 py-1.5 font-display text-xs uppercase tracking-wider"
              >
                <CheckCircle2 className="size-3.5 text-clear" />
                <span>{completing ? "Saving…" : "Mark completed"}</span>
              </ChromeButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline picker shown when a disrupted task needs a new timing. */
function SlotPicker({
  task,
  onPick,
  onCancel,
}: {
  task: StationTask;
  onPick: (slotId: string) => void;
  onCancel: () => void;
}) {
  const slots = task.alternativeSlots ?? [];

  return (
    <div className="mt-3 rounded-lg border border-signal/40 bg-ink2 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-sm font-semibold uppercase text-cream">
          Pick a new window — {task.id}
        </div>
        <GhostButton onClick={onCancel} className="px-2 py-1  text-[11px]">
          Cancel
        </GhostButton>
      </div>

      {slots.length === 0 ? (
        <p className="mt-3  text-[11px] text-steel">
          Every alternative has been used. Raise a fresh request for this work.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {slots.map((slot) => (
            <button
              key={slot.slotId}
              type="button"
              onClick={() => onPick(slot.slotId)}
              className="rounded-md border border-line bg-ink3/50 p-3 text-left transition hover:border-signal/60 hover:bg-ink3"
            >
              <div className="min-w-0 truncate font-display text-sm font-semibold text-cream">
                {dayLabel(slot.date)} · {ampm(slot.startTime)} – {ampm(slot.endTime)}
              </div>
              <div className="mt-1  text-[10px] text-steel">{slot.note}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const {
    activeStation,
    userProfile,
    tasks,
    rescheduleTask,
    completeTask,
    simulateLiveTrainDisruption,
    setIsInboxOpen,
  } = useStation();

  const qc = useQueryClient();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  const critical = useQuery(riskCountQuery("CRITICAL"));
  const high = useQuery(riskCountQuery("HIGH"));
  const backend = useQuery(backendHealthQuery);
  const engine = useQuery(healthQuery);
  const kpis = useQuery(kpisQuery);
  const requests = useQuery(blockRequestsQuery({ sectionId: activeStation.sectionId, limit: 100 }));
  const k = kpis.data?.kpis;

  const completeRequest = useMutation({
    mutationFn: async (requestId: string) =>
      apiPatch(`/ai/block-requests/${requestId}/complete`, { by: userProfile.name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["block-requests"] });
    },
  });

  const liveTrains = useMemo(() => getLiveTrains(activeStation.code), [activeStation.code]);

  // Everything still open at this station, from both sources, overdue first.
  const openItems = useMemo(() => {
    const today = todayISO();

    // Only work belonging to the station being viewed. Each task carries a
    // stationCode that was never checked, so LNL work appeared on every
    // station's workbench — including stations its trains never touch.
    const stationItems = tasks
      .filter((t) => t.status !== "completed" && t.stationCode === activeStation.code)
      .map(fromStationTask);

    const requestItems = (requests.data ?? [])
      .filter((r) => r.status !== "completed" && r.status !== "rejected")
      .map(fromBlockRequest);

    return [...stationItems, ...requestItems].sort((a, b) => {
      const aOver = itemOverdue(a, today) ? 0 : 1;
      const bOver = itemOverdue(b, today) ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      return (a.window?.date ?? "9999").localeCompare(b.window?.date ?? "9999");
    });
  }, [tasks, requests.data, activeStation.code]);

  const today = todayISO();
  const overdueCount = openItems.filter((i) => itemOverdue(i, today)).length;
  const pickerItem = openItems.find((i) => i.key === pickerKey) ?? null;
  // Dashboard-only demo timeline: always follows today, independent of backend task dates.
  const weeklySchedule = useMemo(() => buildDemoWeeklySchedule(today), [today]);

  const handleComplete = (item: WorkItem) => {
    if (item.source === "station") {
      completeTask(item.ref);
    } else if (item.requestId) {
      completeRequest.mutate(item.requestId);
    }
    setExpandedKey(null);
    if (pickerKey === item.key) setPickerKey(null);
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-6">
      {/* Station identity + primary action */}
      <div className="relative min-w-0 overflow-hidden rounded-2xl border border-line bg-ink2 p-4 hairline sm:p-6">
        {/* Background image: hidden on mobile */}
        <div
          className="absolute inset-y-0 right-0 hidden opacity-80 sm:block sm:w-[55%]"
          style={{
            backgroundImage: "url('/second.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to right, transparent, black 35%)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 35%)",
          }}
        />

        {/* Gradient overlay: hidden on mobile */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-ink2 via-ink2/90 to-transparent sm:block" />

        <div className="relative min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-steel">
            <span className="flex items-center gap-1 font-bold text-black">
              <MapPin className="size-3.5" />
              {activeStation.zone}
            </span>

            <span>·</span>

            <span>{activeStation.division}</span>

            <span>·</span>

            <span className="rounded bg-signal/20 px-2 py-0.5 text-xs font-bold text-signal">
              STATION CODE: {activeStation.code}
            </span>
            <span>·</span>
            <span className="flex items-center gap-2 text-xs text-steel">
              <span className="text-[10px] font-semibold uppercase tracking-wide">Section</span>
              <span className="font-semibold text-cream">{activeStation.sectionId}</span>
            </span>
          </div>

          <h1 className="max-w-4xl break-words font-display text-xl font-bold uppercase leading-tight tracking-tight text-cream sm:text-3xl">
            {activeStation.name} Station Dashboard
          </h1>

          {/* Section + Section Engineer on the same row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
            <div className="min-w-0 max-w-full rounded-lg border border-line/80 bg-ink/75 px-4 py-3 text-xs backdrop-blur-sm sm:w-[300px]">
              <div className="text-[10px] font-semibold uppercase text-steel">Section Engineer</div>

              <div className="font-semibold text-cream">{userProfile.name}</div>

              <div className="truncate text-[11px] text-black/80">{userProfile.email}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={() => setIsInboxOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/20 bg-white/15 px-4 py-3 text-xs font-semibold text-black transition hover:bg-black/80 hover:text-white sm:w-auto"
            >
              <Mail className="size-4" />
              <span>Official Mailbox</span>
            </button>

            <Link to="/requests/new" className="min-w-0">
              <ChromeButton className="!flex !flex-row !items-center !justify-center gap-2 whitespace-nowrap px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(15,23,42,0.12)] text-black/70 hover:text-black">
                <Plus className="size-4 shrink-0" />
                <span>New Request</span>
              </ChromeButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Weekly schedule + station health */}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Panel
          title="Weekly maintenance schedule"
          right={
            <Link to="/schedule" className="hover:underline">
              VIEW FULL SCHEDULE →
            </Link>
          }
        >
          <div className="overflow-x-auto rounded-lg border border-line/70 bg-ink2">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[112px_minmax(0,1fr)] border-b border-line/70 bg-ink3/60 px-3 py-2 text-[10px] uppercase tracking-wide text-steel">
                <span>Date</span>
                <div className="grid grid-cols-7">
                  {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"].map((hour) => (
                    <span key={hour} className="text-center last:text-right">
                      {hour}
                    </span>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-line/60">
                {weeklySchedule.map(({ date, items }) => {
                  const isToday = date === today;
                  const rowHeight = Math.max(56, items.length * 34 + 16);

                  return (
                    <div
                      key={date}
                      className={`grid grid-cols-[112px_minmax(0,1fr)] items-stretch ${
                        isToday ? "bg-signal/5" : ""
                      }`}
                    >
                      <div
                        className={`border-r border-line/60 px-3 py-3 ${isToday ? "bg-signal/10" : "bg-ink3/30"}`}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-steel">
                          {weekdayName(date).slice(0, 3)}
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-cream">
                          {prettyDate(date)}
                        </div>
                        {isToday ? <Tag tone="signal">TODAY</Tag> : null}
                      </div>

                      <div
                        className="relative bg-ink2"
                        style={{
                          minHeight: `${rowHeight}px`,
                          backgroundImage:
                            "repeating-linear-gradient(to right, transparent 0, transparent calc(16.666% - 1px), rgba(148, 163, 184, 0.16) calc(16.666% - 1px), rgba(148, 163, 184, 0.16) 16.666%)",
                        }}
                      >
                        {items.length ? (
                          items.map((item, index) => {
                            const style = timeWindowStyle(
                              item.window?.startTime,
                              item.window?.endTime,
                            );
                            const className =
                              "absolute flex min-w-0 items-center overflow-hidden rounded border border-signal/50 bg-signal/20 px-2 text-[10px] font-semibold text-cream transition hover:bg-signal/30";
                            const content = (
                              <span className="truncate">
                                {ampm(item.window?.startTime)} – {ampm(item.window?.endTime)} ·{" "}
                                {item.title}
                              </span>
                            );

                            return item.requestId ? (
                              <Link
                                key={item.key}
                                to="/requests/$requestId"
                                params={{ requestId: item.requestId }}
                                className={className}
                                style={{ ...style, top: `${8 + index * 34}px`, height: "26px" }}
                              >
                                {content}
                              </Link>
                            ) : (
                              <Link
                                key={item.key}
                                to="/schedule"
                                className={className}
                                style={{ ...style, top: `${8 + index * 34}px`, height: "26px" }}
                              >
                                {content}
                              </Link>
                            );
                          })
                        ) : (
                          <span className="absolute inset-y-0 left-2 flex items-center text-[10px] text-steel">
                            No scheduled maintenance
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid min-w-0 gap-3">
          <Stat
            label="Station Defects"
            value={String(openItems.length)}
            sub={overdueCount > 0 ? `${overdueCount} past their planned date` : "All within plan"}
            tone={overdueCount > 0 ? "signal" : undefined}
          />
          <Link to="/risks">
            <Stat
              label="Critical assets"
              value={count(critical)}
              tone="danger"
              sub="≥ 60% failure probability"
            />
          </Link>
          <Link to="/risks">
            <Stat label="High-risk assets" value={count(high)} tone="signal" sub="40 – 59%" />
          </Link>
          <Link
            to="/schedule"
            className="rounded-md border border-line bg-white px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-cream transition hover:border-signal hover:bg-ink3"
          >
            Open maintenance schedule
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <div className="min-w-0 space-y-6">
          <Panel
            title="Station Maintenance Tasks Workbench"
            right={
              <span className=" text-[10px] text-steel">
                {openItems.length} OPEN · {overdueCount} OVERDUE
              </span>
            }
          >
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line/70 pb-4">
                <p className="min-w-0 max-w-3xl text-xs leading-relaxed text-steel">
                  Work logged for <strong className="text-cream">{activeStation.name}</strong> that
                  is still open, including block requests filed through the AI engine. Items stay
                  here until you mark them completed. The AI checks timetables, live delays and
                  other departments' work internally when it allots a window.
                </p>
                <div className="w-fit shrink-0 rounded-md bg-ink3 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-steel">
                  Sorted by urgency
                </div>
              </div>

              {requests.isError ? (
                <p className=" text-[11px] text-danger">
                  Filed block requests could not be loaded — showing station tasks only.
                </p>
              ) : null}

              {openItems.length === 0 ? (
                <div className="rounded-lg border border-line bg-ink3/30 p-6 text-center">
                  <div className="font-display text-sm uppercase text-cream">Nothing open</div>
                  <p className="mt-1  text-[11px] text-steel">
                    Every logged task for this station has been completed.
                  </p>
                </div>
              ) : (
                <div className="max-h-[640px] min-w-0 space-y-3 overflow-y-auto pr-1 sm:pr-2">
                  {openItems.map((item) => (
                    <div key={item.key}>
                      <TaskCard
                        item={item}
                        overdue={itemOverdue(item, today)}
                        expanded={expandedKey === item.key}
                        onToggle={() => setExpandedKey(expandedKey === item.key ? null : item.key)}
                        onComplete={() => handleComplete(item)}
                        onChangeTime={() => setPickerKey(item.key)}
                        onSimulate={() => simulateLiveTrainDisruption(item.ref)}
                        completing={
                          completeRequest.isPending && completeRequest.variables === item.requestId
                        }
                      />
                      {pickerItem?.key === item.key && pickerItem.task ? (
                        <SlotPicker
                          task={pickerItem.task}
                          onPick={(slotId) => {
                            rescheduleTask(item.ref, slotId);
                            setPickerKey(null);
                          }}
                          onCancel={() => setPickerKey(null)}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <StationLens />
        </div>

        <div className="min-w-0 space-y-6">
          <Panel
            title="Live Train Telemetry"
            right={
              <span className="flex items-center gap-1  text-[10px] text-clear">
                <Radio className="size-3 animate-pulse" /> LIVE RTIS GPS
              </span>
            }
          >
            <div className="space-y-3">
              <p className=" text-[11px] text-steel">
                Trains passing through {activeStation.name} ({activeStation.code}). Only these
                affect blocks held at this station.
              </p>

              <div className="space-y-2">
                {liveTrains.map((trn) => (
                  <div
                    key={trn.number}
                    className="space-y-2 rounded-lg border border-line/70 bg-ink3/35 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Train className="size-3.5 text-steel" />
                        <span className="min-w-0 truncate font-display text-sm font-semibold text-cream">
                          {trn.name}
                        </span>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5  text-[10px] font-bold ${
                          trn.liveDelayMinutes > 15
                            ? "border border-danger/30 bg-danger/15 text-danger"
                            : trn.liveDelayMinutes > 0
                              ? "border border-signal/30 bg-signal/15 text-signal"
                              : "border border-clear/30 bg-clear/15 text-clear"
                        }`}
                      >
                        {trn.liveDelayMinutes > 0 ? `+${trn.liveDelayMinutes}m Late` : "On Time"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-steel">
                      <span>
                        #{trn.number} ({trn.type})
                      </span>
                      <span>
                        Sched: {trn.scheduledPassage} →{" "}
                        <strong className="text-cream">{trn.effectivePassage}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="System status">
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-line/70 bg-ink3/35 p-3">
                <Lamp tone={backend.isError ? "danger" : backend.isLoading ? "signal" : "clear"} />
                <div>
                  <div className=" text-[11px] text-cream">NODE BACKEND</div>
                  <div className=" text-[10px] text-steel">
                    {backend.isError ? "Unreachable" : (backend.data ?? "Checking…")}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-line/70 bg-ink3/35 p-3">
                <Lamp tone={engine.isError ? "danger" : engine.isLoading ? "signal" : "clear"} />
                <div>
                  <div className=" text-[11px] text-cream">PYTHON AI ENGINE</div>
                  <div className=" text-[10px] text-steel">
                    {engine.isError
                      ? (engine.error?.message ?? "Offline")
                      : engine.data
                        ? `${engine.data.service ?? "AI engine"} · v${engine.data.version ?? "?"}`
                        : "Checking…"}
                  </div>
                </div>
              </div>
              <div className="border-t border-line pt-5">
                <div className="label-mono mb-3 tracking-widest">Impact this cycle</div>
                {k ? (
                  <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
                    <Meta
                      label="Blocks"
                      value={`${k["blocksBefore"] ?? "—"} → ${k["blocksAfter"] ?? "—"}`}
                      tone="signal"
                    />
                    <Meta
                      label="Hours saved"
                      value={`${k["downtimeHoursSaved"] ?? "—"} h`}
                      tone="clear"
                    />
                    <Meta
                      label="Conflicts"
                      value={`${k["conflictsBefore"] ?? "—"} → ${k["conflictsAfter"] ?? "—"}`}
                      tone="clear"
                    />
                    <Meta
                      label="Availability"
                      value={`+${k["availabilityGainPct"] ?? "—"}%`}
                      tone="signal"
                    />
                  </div>
                ) : (
                  <p className=" text-[11px] text-steel">
                    {kpis.isLoading ? "Loading…" : "KPIs unavailable."}
                  </p>
                )}
                <Link
                  to="/impact"
                  className="mt-3 inline-block  text-[10px] text-signal hover:underline"
                >
                  FULL IMPACT REPORT →
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
