import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { backendHealthQuery, healthQuery } from "@/lib/queries";
import { API_BASE_URL } from "@/lib/api";
import { Lamp } from "@/components/control";
import { PERSONAS, usePersona } from "@/lib/persona";
import { useStation } from "@/lib/station-context";
import { StationSwitcherModal } from "@/components/station-switcher-modal";
import { EmailInboxModal } from "@/components/email-inbox-modal";
import {
  LayoutDashboard,
  CalendarRange,
  ListFilter,
  Boxes,
  TriangleAlert,
  Map,
  TrainFront,
  Bot,
  Database,
  Info,
  ChevronDown,
  MapPin,
  Mail,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "MAIN",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "PLANNING",
    items: [
      {
        to: "/schedule",
        label: "Schedule",
        icon: CalendarRange,
      },
      {
        to: "/priority",
        label: "Priority",
        icon: ListFilter,
      },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      {
        to: "/assets",
        label: "Assets",
        icon: Boxes,
      },
      {
        to: "/risks",
        label: "Risks",
        icon: TriangleAlert,
      },
      {
        to: "/map",
        label: "Map",
        icon: Map,
      },
      {
        to: "/impact",
        label: "Impact",
        icon: TrainFront,
      },
    ],
  },
  {
    label: "TOOLS",
    items: [
      {
        to: "/assistant",
        label: "Assistant",
        icon: Bot,
      },
      {
        to: "/data",
        label: "Data",
        icon: Database,
      },
      {
        to: "/about",
        label: "About",
        icon: Info,
      },
    ],
  },
] as const;

function PersonaPicker() {
  const { persona, setPersona } = usePersona();

  return (
    <select
      value={persona.id}
      onChange={(e) => setPersona(e.target.value as (typeof PERSONAS)[number]["id"])}
      className="h-9 min-w-[190px] rounded-md border border-line bg-white px-3 text-[11px] text-cream outline-none transition hover:border-slate-300 focus:border-cream"
      title="Demo persona"
    >
      {PERSONAS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </select>
  );
}

export function useEngineHealth() {
  return useQuery({
    ...healthQuery,
    retry: 8,
    retryDelay: (attempt) => Math.min(3000 * (attempt + 1), 8000),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
}

export function EngineOfflineBanner() {
  const backend = useQuery(backendHealthQuery);
  const engine = useEngineHealth();

  const isStarting = engine.isFetching && engine.failureCount > 0;

  const message = backend.isError
    ? `BACKEND UNREACHABLE — nothing is answering at ${API_BASE_URL}. Start it with "npm run dev" in Backend/.`
    : isStarting
      ? "AI ENGINE STARTING — the Python ML service is waking up. Checking again automatically..."
      : engine.isError
        ? `AI ENGINE OFFLINE — ${(engine.error as Error)?.message ?? "ML service unavailable"}. Retrying automatically.`
        : null;

  if (!message) return null;

  return (
    <div className="border-b border-signal/30 bg-amber-50">
      <div className="flex items-center gap-3 px-6 py-2">
        <Lamp tone={isStarting ? "signal" : "danger"} />

        <span className="text-[11px] tracking-wide text-signal">{message}</span>
      </div>
    </div>
  );
}

function StatusLamp({
  label,
  isError,
  isLoading,
  text,
}: {
  label: string;
  isError: boolean;
  isLoading: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.14em] text-steel">{label}</span>

      <Lamp tone={isError ? "danger" : isLoading ? "signal" : "clear"} />

      <span
        className={
          isError
            ? "text-[10px] text-danger"
            : isLoading
              ? "text-[10px] text-signal"
              : "text-[10px] text-clear"
        }
      >
        {isError ? "DOWN" : isLoading ? "STARTING" : text}
      </span>
    </div>
  );
}

function TopUtilityBar({ onStationClick }: { onStationClick: () => void }) {
  const backend = useQuery(backendHealthQuery);
  const engine = useEngineHealth();

  const { userProfile, unreadCount, setIsInboxOpen, activeStation } = useStation();

  const engineStarting = engine.isFetching && engine.failureCount > 0;

  return (
    <div className="border-b border-line bg-white">
      <div className="flex h-14 items-center gap-6 px-6">
        <button
          onClick={onStationClick}
          className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 font-mono text-[10px] text-cream transition hover:border-slate-300 hover:bg-slate-50"
          title="Switch station"
        >
          <MapPin className="size-3.5 text-signal" />

          <span className="font-bold text-signal">{activeStation.code}</span>

          <span className="hidden text-steel md:inline">{activeStation.name}</span>

          <ChevronDown className="size-3 text-steel" />
        </button>

        <div className="h-7 w-px bg-line" />

        <button
          onClick={() => setIsInboxOpen(true)}
          className="flex items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-slate-50"
          title={`Logged in as ${userProfile.email}`}
        >
          <Mail className="size-4 text-steel" />

          <div className="text-left">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-steel">
              Engineer Mailbox
            </div>

            <div className="mt-0.5 max-w-[190px] truncate font-mono text-[10px] text-cream">
              {userProfile.email}
            </div>
          </div>

          {unreadCount > 0 ? (
            <span className="flex size-4 items-center justify-center rounded-full bg-danger font-mono text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>

        <div className="h-7 w-px bg-line" />

        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-steel">
            Operating Persona
          </span>

          <PersonaPicker />
        </div>

        <div className="h-7 w-px bg-line" />

        <StatusLamp label="API" isError={backend.isError} isLoading={backend.isLoading} text="UP" />

        <StatusLamp
          label="ML Engine"
          isError={engine.isError && !engineStarting}
          isLoading={engine.isLoading || engineStarting}
          text={engine.data?.status ?? "UP"}
        />
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-line bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-line px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-cream font-display text-sm font-bold text-white">
              S
            </span>

            <span className="leading-none">
              <span className="block font-display text-sm font-semibold tracking-wide text-cream">
                BLOCK-AI
              </span>

              <span className="mt-1.5 block text-[9px] tracking-[0.16em] text-steel">
                AI BLOCK PLANNER
              </span>
            </span>
          </Link>
        </div>

        <SidebarNavigation />

        <div className="mt-auto border-t border-line px-6 py-4">
          <div className="text-[9px] uppercase tracking-[0.14em] text-steel">
            Railway Operations
          </div>

          <div className="mt-1 text-[10px] text-cream">Coordinated Block Planning</div>
        </div>
      </div>
    </aside>
  );
}

function SidebarNavigation() {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-5">
      <div className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
              {group.label}
            </div>

            <div className="space-y-0.5 px-5">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[11px] text-steel transition hover:bg-slate-50 hover:text-cream"
                    activeProps={{
                      className:
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-[11px] bg-slate-100 text-cream",
                    }}
                  >
                    <Icon className="size-4" />

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-cream">
      <Sidebar />

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 bg-white">
          <div className="flex h-16 items-center justify-between border-b border-line px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid size-8 place-items-center rounded-md bg-cream font-display text-sm font-bold text-white">
                S
              </span>

              <span className="font-display text-sm font-semibold">BLOCK-AI</span>
            </div>
          </div>

          <TopUtilityBar onStationClick={() => setIsStationModalOpen(true)} />
        </header>

        <StationSwitcherModal
          isOpen={isStationModalOpen}
          onClose={() => setIsStationModalOpen(false)}
        />

        <EmailInboxModal />

        <EngineOfflineBanner />

        <main className="mx-auto max-w-[1440px] px-6 py-8">{children}</main>

        <footer className="border-t border-line/70">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-[10px] text-steel">
            <span>
              Model ensemble · LightGBM 50 · Temporal CNN 30 · Random Forest 20 · recall 0.85
            </span>

            <span>Railway AI Block Planner · Smart India Hackathon prototype · simulated data</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
