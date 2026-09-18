import { useState, useMemo } from "react";
import { useStation } from "@/lib/station-context";
import { searchStations, type Station } from "@/lib/stations";
import { Search, Check, X } from "lucide-react";

export function StationSwitcherModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { activeStation, setStationCode } = useStation();
  const [query, setQuery] = useState("");

  const filteredStations = useMemo(() => searchStations(query), [query]);

  if (!isOpen) return null;

  const handleSelect = (station: Station) => {
    setStationCode(station.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-2 pt-[4vh] backdrop-blur-sm animate-in fade-in duration-150 sm:p-4 sm:pt-[10vh]">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-ink2 shadow-2xl sm:max-h-[75vh]">
        <div className="space-y-3 border-b border-line bg-ink p-3 sm:p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-display text-xs font-semibold uppercase tracking-wider text-cream sm:text-sm">
                Pan-India Station & Division Selector
              </span>

              <p className="mt-1 text-[10px] leading-relaxed text-steel sm:text-[11px]">
                Select your assigned station across 16 Zonal Railways & 68 Divisions
              </p>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-steel transition hover:bg-ink3 hover:text-cream"
              aria-label="Close station selector"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />

            <input
              type="text"
              placeholder="Search station code or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-line bg-ink2 py-2.5 pl-9 pr-4 text-xs text-cream outline-none placeholder:text-steel focus:border-signal sm:text-sm"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          {filteredStations.length === 0 ? (
            <div className="p-8 text-center text-xs text-steel">
              No matching stations found in catalog.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredStations.map((s) => {
                const isSelected = s.code === activeStation.code;

                return (
                  <button
                    key={s.code}
                    onClick={() => handleSelect(s)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      isSelected
                        ? "border-signal/40 bg-signal/15"
                        : "border-transparent hover:bg-ink3/50"
                    }`}
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-display text-sm font-bold text-cream sm:text-base">
                            {s.name}
                          </span>

                          <span className="rounded border border-signal/20 bg-signal/10 px-1.5 py-0.5 text-[10px] font-bold text-signal sm:text-xs">
                            {s.code}
                          </span>

                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] text-clear">
                              <Check className="size-3" />
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-steel sm:text-[11px]">
                          <span>{s.division}</span>
                          <span>·</span>
                          <span>{s.zone}</span>
                          <span>·</span>
                          <span className="text-steel/70">{s.lines}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-left text-[10px] text-steel sm:text-right">
                        <div>
                          Section: <span className="text-cream">{s.sectionId}</span>
                        </div>

                        <div className="text-steel/70">
                          Quiet: {s.quietWindow.start}–{s.quietWindow.end}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
