import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { kpisQuery } from "@/lib/queries";
import { Disclaimer, Lamp, Panel, Tag } from "@/components/control";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Railway AI Block Planner — Shadow Block Planning" },
      {
        name: "description",
        content:
          "AI plans Indian Railways maintenance blocks across Track, S&T and TRD into shared shadow blocks, avoids train conflicts and sequences safety steps.",
      },
      {
        property: "og:title",
        content: "Railway AI Block Planner — Shadow Block Planning",
      },
      {
        property: "og:description",
        content: "One closure, three departments, zero timetable conflicts.",
      },
    ],
  }),
  component: Landing,
});

const CAPABILITIES = [
  {
    tone: "danger" as const,
    label: "FAILURE RISK PREDICTION",
    body: "Ensemble ML scores every asset 0–100 with SHAP-style drivers, so the worst assets get the block first.",
  },
  {
    tone: "signal" as const,
    label: "PRIORITY SCORING",
    body: "Criticality, safety impact, overdue days, urgency, condition and failure probability rolled into one 0–100 score.",
  },
  {
    tone: "steel" as const,
    label: "SHADOW BLOCKING",
    body: "Track, S&T and TRD tasks on the same span are merged into a single closure instead of three.",
  },
  {
    tone: "clear" as const,
    label: "CONFLICT DETECTION",
    body: "Passenger and freight timings are checked, with alternative slots offered when a train would be delayed.",
  },
];

function Landing() {
  const { data, isError } = useQuery(kpisQuery);
  const k = data?.kpis;
  const disclaimer = data?.evaluation_summary?.prototype_disclaimer;

  const pct = (before?: number, after?: number) =>
    before && after !== undefined ? `${Math.round(((after - before) / before) * 100)}%` : "—";

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <section className="grid min-w-0 grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
        <section className="col-span-12 min-w-0 space-y-5 sm:space-y-6 xl:col-span-7">
          <div className="rise min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded border border-signal/40 px-2 py-1 text-[9px] tracking-[0.18em] text-signal sm:text-[10px] sm:tracking-[0.25em]">
              <Lamp tone="signal" />
              <span className="min-w-0 break-words">SMART INDIA HACKATHON · PROTOTYPE</span>
            </div>

            <h1 className="mt-4 max-w-full font-display text-[clamp(38px,10vw,72px)] font-bold uppercase leading-[0.92] tracking-tight text-balance">
              One closure.
              <br />
              <span className="chrome inline-block max-w-full rounded-md px-2">
                Three departments.
              </span>
            </h1>

            <p className="mt-5 max-w-[52ch] text-pretty text-sm leading-relaxed text-steel sm:text-base">
              AI plans maintenance blocks across Track, S&amp;T and TRD into shared{" "}
              <span className="text-cream">shadow blocks</span>, avoids passenger and freight
              conflicts, and sequences the safety steps between departments — so corridors stop
              grinding to a halt.
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                to="/requests/new"
                className="chrome w-full rounded-md px-5 py-3 text-center font-display text-sm font-semibold uppercase tracking-wide hairline transition hover:brightness-105 sm:w-auto"
              >
                Request a block
              </Link>

              <Link
                to="/dashboard"
                className="w-full rounded-md border border-line px-5 py-3 text-center text-[12px] uppercase text-cream transition hover:bg-ink3 sm:w-auto"
              >
                Open dashboard
              </Link>
            </div>

            <div className="mt-3">
              <Disclaimer text={disclaimer} />
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-lg bg-ink2/80 hairline">
            <div className="flex min-w-0 flex-col gap-1 border-b border-line bg-ink3/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[10px] tracking-[0.15em] text-steel sm:text-[11px] sm:tracking-[0.2em]">
                IMPACT · BEFORE → AFTER
              </span>

              <span className="break-words text-[10px] text-signal">
                {data?.evaluation_summary?.corridor ?? "LNL–PUNE"}
              </span>
            </div>

            {isError ? (
              <div className="flex min-w-0 items-start gap-2 px-4 py-5 text-[11px] text-danger">
                <div className="shrink-0">
                  <Lamp tone="danger" />
                </div>

                <span className="min-w-0 break-words">
                  AI engine offline — impact numbers unavailable.
                </span>
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
                <div className="min-w-0 border-b border-line p-3 sm:p-4 md:border-b-0">
                  <div className="label-mono tracking-widest">BLOCKS</div>

                  <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 font-display text-2xl font-semibold">
                    <span className="text-sm text-steel/60 line-through sm:text-base">
                      {k?.["blocksBefore"] ?? 7}
                    </span>

                    <span className="text-signal">{k?.["blocksAfter"] ?? 3}</span>
                  </div>

                  <div className="mt-1 text-[10px] text-clear">
                    {pct(k?.["blocksBefore"] ?? 7, k?.["blocksAfter"] ?? 3)}
                  </div>
                </div>

                <div className="min-w-0 border-b border-line p-3 sm:p-4 md:border-b-0">
                  <div className="label-mono tracking-widest">BLOCK HOURS</div>

                  <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 font-display text-2xl font-semibold">
                    <span className="text-sm text-steel/60 line-through sm:text-base">
                      {k?.["durationHoursBefore"] ?? 8.5}
                    </span>

                    <span className="text-signal">{k?.["durationHoursAfter"] ?? 5.0}</span>
                  </div>

                  <div className="mt-1 text-[10px] text-clear">
                    {k?.["downtimeHoursSaved"] ?? 3.5} h saved
                  </div>
                </div>

                <div className="min-w-0 p-3 sm:p-4">
                  <div className="label-mono tracking-widest">CONFLICTS</div>

                  <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 font-display text-2xl font-semibold">
                    <span className="text-sm text-steel/60 line-through sm:text-base">
                      {k?.["conflictsBefore"] ?? 5}
                    </span>

                    <span className="text-clear">{k?.["conflictsAfter"] ?? 0}</span>
                  </div>

                  <div className="mt-1 text-[10px] text-clear">CLEARED</div>
                </div>

                <div className="min-w-0 bg-signal/5 p-3 sm:p-4">
                  <div className="label-mono tracking-widest">AVAILABILITY</div>

                  <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 font-display text-2xl font-semibold">
                    <span className="text-sm text-steel/60 line-through sm:text-base">
                      {k?.["availabilityBefore"] ?? 91.4}
                    </span>

                    <span className="text-signal">{k?.["availabilityAfter"] ?? 95.8}</span>

                    <span className="text-sm">%</span>
                  </div>

                  <div className="mt-1 text-[10px] text-clear">
                    +{k?.["availabilityGainPct"] ?? 4.4}%
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rise grid min-w-0 gap-3 md:grid-cols-3">
            <div className="min-w-0 rounded-lg bg-ink2/70 p-4 hairline">
              <div className="text-[10px] tracking-widest text-signal">01 · SUBMIT</div>

              <p className="mt-2 text-xs leading-relaxed text-steel">
                Track, S&amp;T &amp; TRD file a block request with span, preferred window and
                resources.
              </p>
            </div>

            <div className="min-w-0 rounded-lg bg-ink2/70 p-4 hairline">
              <div className="text-[10px] tracking-widest text-clear">02 · AI EVALUATES</div>

              <p className="mt-2 text-xs leading-relaxed text-steel">
                Traffic, weather, asset risk and co-located tasks scored into a ranked window plus
                alternatives.
              </p>
            </div>

            <div className="min-w-0 rounded-lg bg-ink2/70 p-4 hairline">
              <div className="text-[10px] tracking-widest text-danger">03 · OFFICER DECIDES</div>

              <p className="mt-2 text-xs leading-relaxed text-steel">
                Accept, reject, or switch to an alternative slot — full audit trail attached.
              </p>
            </div>
          </div>

          <Panel title="The problem today">
            <ul className="space-y-2.5 text-sm leading-relaxed text-steel">
              <li>
                <span className="text-cream">
                  Three separate requests, three separate closures.
                </span>{" "}
                Track, Signal and OHE teams each ask for their own possession on the same
                kilometres.
              </li>

              <li>
                <span className="text-cream">Daytime blocks collide with the timetable.</span>{" "}
                Passenger and freight services are delayed or regulated because nobody checked the
                passing times first.
              </li>

              <li>
                <span className="text-cream">Some corridors starve.</span> Busy sections get their
                block requests denied again and again, so assets keep ageing without attention.
              </li>
            </ul>
          </Panel>
        </section>

        <section className="col-span-12 min-w-0 xl:col-span-5">
          <div className="rise min-w-0 overflow-hidden rounded-lg bg-ink2/80 hairline">
            <div className="flex min-w-0 flex-col gap-2 border-b border-line bg-ink3/70 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-[10px] tracking-[0.15em] text-steel sm:tracking-[0.2em]">
                WHAT THE ENGINE DOES · <span className="text-cream">CAPABILITIES</span>
              </div>

              <div className="shrink-0">
                <Tag tone="clear">AI PLANNER</Tag>
              </div>
            </div>

            <div className="space-y-3 p-3 sm:p-4">
              {CAPABILITIES.map((c) => (
                <div key={c.label} className="min-w-0 rounded-md bg-ink3/50 p-3 hairline">
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="shrink-0">
                      <Lamp tone={c.tone} pulse={false} />
                    </div>

                    <span className="min-w-0 break-words text-[10px] tracking-widest text-cream">
                      {c.label}
                    </span>
                  </div>

                  <p className="mt-1.5 break-words text-xs leading-relaxed text-steel">{c.body}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-line px-3 py-4 sm:px-4">
              <div className="mb-3 text-[10px] tracking-[0.15em] text-steel sm:tracking-[0.2em]">
                INTER-DEPARTMENT SAFETY SEQUENCING
              </div>

              <ol className="relative ml-1.5 space-y-4 border-l border-line">
                <li className="relative min-w-0 pl-5">
                  <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-danger text-danger lamp" />

                  <div className="text-[10px] text-danger">PHASE 1</div>

                  <div className="break-words text-sm text-cream">
                    TRD · 25 kV AC OHE power block isolation
                  </div>
                </li>

                <li className="relative min-w-0 pl-5">
                  <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-signal text-signal lamp" />

                  <div className="text-[10px] text-signal">PHASE 2</div>

                  <div className="break-words text-sm text-cream">
                    Engineering · tamping, rail renewal, joint inspection
                  </div>
                </li>

                <li className="relative min-w-0 pl-5">
                  <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-steel" />

                  <div className="text-[10px] text-steel">PHASE 3</div>

                  <div className="break-words text-sm text-cream">
                    S&amp;T · point machine testing &amp; interlocking
                  </div>
                </li>

                <li className="relative min-w-0 pl-5">
                  <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-clear text-clear" />

                  <div className="text-[10px] text-clear">PHASE 4</div>

                  <div className="break-words text-sm text-cream">
                    TRD · re-energize OHE, line handed back
                  </div>
                </li>
              </ol>
            </div>

            <div className="border-t border-line bg-ink/60 px-3 py-3 sm:px-4">
              <div className="mb-2 text-[10px] tracking-[0.15em] text-steel sm:tracking-[0.2em]">
                EXPLORE
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                <Link
                  to="/schedule"
                  className="min-w-0 rounded-md bg-ink3/60 p-2.5 hairline transition hover:bg-ink3"
                >
                  <span className="block break-words text-cream">BLOCK CALENDAR</span>

                  <span className="mt-1 block break-words text-steel">Week and month view</span>
                </Link>

                <Link
                  to="/priority"
                  className="min-w-0 rounded-md bg-ink3/60 p-2.5 hairline transition hover:bg-ink3"
                >
                  <span className="block break-words text-cream">PRIORITY SCORING</span>

                  <span className="mt-1 block break-words text-steel">What the AI ranks first</span>
                </Link>

                <Link
                  to="/risks"
                  className="min-w-0 rounded-md bg-ink3/60 p-2.5 hairline transition hover:bg-ink3"
                >
                  <span className="block break-words text-cream">ASSET RISK</span>

                  <span className="mt-1 block break-words text-steel">Failure probability</span>
                </Link>

                <Link
                  to="/impact"
                  className="min-w-0 rounded-md bg-ink3/60 p-2.5 hairline transition hover:bg-ink3"
                >
                  <span className="block break-words text-cream">IMPACT</span>

                  <span className="mt-1 block break-words text-steel">Before vs after AI</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
