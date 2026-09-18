import { Link, useLocation } from "@tanstack/react-router";
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
  Menu,
  X,
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
      className="h-9 min-w-[190px] max-w-full rounded-md border border-line bg-white px-3 text-[11px] text-cream outline-none transition hover:border-slate-300 focus:border-cream sm:min-w-[190px]"
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
  return useQuery(healthQuery);
}

export function EngineOfflineBanner() {
  const backend = useQuery(backendHealthQuery);
  const engine = useEngineHealth();

  const message = backend.isError
    ? `BACKEND UNREACHABLE — nothing is answering at ${API_BASE_URL}. Start it with "npm run dev" in Backend/.`
    : engine.isError
      ? `AI ENGINE OFFLINE — ${(engine.error as Error)?.message ?? "ML service unavailable"}. Requests, what-if and plans need the Python engine.`
      : null;

  if (!message) return null;

  return (
    <div className="border-b border-signal/30 bg-amber-50">
      <div className="flex items-start gap-3 px-4 py-2 sm:px-6">
        <div className="mt-0.5 shrink-0">
          <Lamp tone="danger" />
        </div>

        <span className="min-w-0 text-[10px] leading-5 tracking-wide text-signal sm:text-[11px]">
          {message}
        </span>
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

      <span className={isError ? "text-[11px] text-danger" : "text-[11px] text-clear"}>
        {isError ? "DOWN" : isLoading ? "…" : text}
      </span>
    </div>
  );
}

function TopUtilityBar({ onStationClick }: { onStationClick: () => void }) {
  const backend = useQuery(backendHealthQuery);
  const engine = useEngineHealth();

  const { userProfile, unreadCount, setIsInboxOpen, activeStation } = useStation();

  return (
    <div className="border-b border-line bg-white">
      <div className="flex min-h-14 flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-2 lg:h-14 lg:flex-nowrap lg:gap-6">
        <button
          onClick={onStationClick}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-[11px] text-cream transition hover:border-slate-300 hover:bg-slate-50"
          title="Switch station"
        >
          <MapPin className="size-3.5 shrink-0 text-signal" />

          <span className="font-bold text-signal">{activeStation.code}</span>

          <span className="hidden max-w-[180px] truncate text-steel md:inline">
            {activeStation.name}
          </span>

          <ChevronDown className="size-3 shrink-0 text-steel" />
        </button>

        <div className="hidden h-7 w-px bg-line lg:block" />

        <button
          onClick={() => setIsInboxOpen(true)}
          className="flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5 text-left transition hover:bg-slate-50"
          title={`Logged in as ${userProfile.email}`}
        >
          <Mail className="size-4 shrink-0 text-steel" />

          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.14em] text-steel">
              Engineer Mailbox
            </div>

            <div className="mt-0.5 max-w-[170px] truncate text-[11px] text-cream sm:max-w-[190px]">
              {userProfile.email}
            </div>
          </div>

          {unreadCount > 0 ? (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>

        <div className="hidden h-7 w-px bg-line lg:block" />

        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden text-[10px] uppercase tracking-[0.14em] text-steel xl:inline">
            Operating Persona
          </span>

          <PersonaPicker />
        </div>

        <div className="hidden h-7 w-px bg-line lg:block" />

        <div className="flex items-center gap-4">
          <StatusLamp
            label="API"
            isError={backend.isError}
            isLoading={backend.isLoading}
            text="UP"
          />

          <StatusLamp
            label="ML Engine"
            isError={engine.isError}
            isLoading={engine.isLoading}
            text={engine.data?.status ?? "UP"}
          />
        </div>
      </div>
    </div>
  );
}

function SidebarLogo() {
  return (
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
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-line bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-line px-6 py-5">
          <SidebarLogo />
        </div>

        <SidebarNavigation />
      </div>
    </aside>
  );
}

function SidebarNavigation({ onNavigate }: { onNavigate?: () => void }) {
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
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[11px] text-steel transition hover:bg-slate-50 hover:text-cream"
                    activeProps={{
                      className:
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-[11px] bg-slate-100 text-cream",
                    }}
                  >
                    <Icon className="size-4 shrink-0" />

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

function MobileNavigation({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 left-0 flex w-[min(82vw,320px)] flex-col border-r border-line bg-white shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <SidebarLogo />

          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-md border border-line text-steel hover:bg-slate-50"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <SidebarNavigation onNavigate={onClose} />
      </aside>
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  const [isStationModalOpen, setIsStationModalOpen] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMapPage = pathname === "/map";

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-cream">
      <Sidebar />

      <MobileNavigation isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-40 bg-white">
          <div className="flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="grid size-9 place-items-center rounded-md border border-line bg-white text-cream hover:bg-slate-50"
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-md bg-cream font-display text-xs font-bold text-white">
                S
              </span>

              <span className="font-display text-sm font-semibold tracking-wide text-cream">
                BLOCK-AI
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsStationModalOpen(true)}
              className="flex size-9 items-center justify-center rounded-md border border-line bg-white text-signal hover:bg-slate-50"
              title="Switch station"
              aria-label="Switch station"
            >
              <MapPin className="size-4" />
            </button>
          </div>

          <TopUtilityBar onStationClick={() => setIsStationModalOpen(true)} />
        </header>

        <StationSwitcherModal
          isOpen={isStationModalOpen}
          onClose={() => setIsStationModalOpen(false)}
        />

        <EmailInboxModal />

        <EngineOfflineBanner />

        <main className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6">{children}</main>

        {/* {!isMapPage ? (
          <footer className="border-t border-line/70">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-[10px] text-steel">
              <span>
                Model ensemble · LightGBM 50 · Temporal CNN 30 · Random Forest 20 · recall 0.85
              </span>

              <span>
                Railway AI Block Planner · Smart India Hackathon prototype · simulated data
              </span>
            </div>
          </footer>
        ) : null} */}
      </div>
    </div>
  );
}
