import { createFileRoute } from "@tanstack/react-router";
import { Disclaimer, PageHeader, Panel, Tag } from "@/components/control";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How Shadow Block Planning Works — Railway AI" },
      {
        name: "description",
        content:
          "Departments, shadow blocking, what-if simulation, priority scoring factors, risk levels and the ML ensemble behind the Railway AI Block Planner.",
      },
      {
        property: "og:title",
        content: "How Shadow Block Planning Works — Railway AI",
      },
      {
        property: "og:description",
        content: "Shadow blocking, priority scoring and the ensemble risk model, explained.",
      },
    ],
  }),
  component: About,
});

const DEPTS = [
  {
    name: "Engineering (Track / P-Way)",
    maintains:
      "Rails, sleepers, ballast, welds, points, bridges. Work: tamping, rail renewal, joint inspection.",
  },
  {
    name: "Signal & Telecommunication (S&T)",
    maintains:
      "Point machines, track circuits, axle counters, interlocking, cables and control telecom.",
  },
  {
    name: "Traction Distribution (TRD / OHE)",
    maintains: "25 kV AC overhead equipment, catenary, masts, isolators and feeding posts.",
  },
];

const PRIORITY_FACTORS = [
  ["Criticality of the asset", "max 25"],
  ["Safety impact of the defect", "max 25"],
  ["Overdue days", "max 20"],
  ["Urgency flag", "5"],
  ["Condition score", "max 15"],
  ["ML failure probability", "max 10"],
];

const RISK_LEVELS = [
  ["LOW", "below 20% failure probability"],
  ["MEDIUM", "20 – 39%"],
  ["HIGH", "40 – 59%"],
  ["CRITICAL", "60% and above"],
];

const SOURCES = [
  ["TMS", "Train management — timetable and running data"],
  ["SMMS", "Signal maintenance management system"],
  ["TDMS", "Traction distribution maintenance system"],
  ["COA freight forecast", "Expected goods loading on the corridor"],
  ["Operational constraints", "Line configuration, embargoes, special traffic calendar"],
];

function About() {
  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="ABOUT · HOW IT WORKS"
        title="Shadow blocking, explained"
        intro="One track possession, planned once, shared by every department that needs the same kilometres on the same night — with the safety steps ordered so nobody works under live wires."
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-12">
        <Panel title="Departments involved" className="min-w-0 lg:col-span-7">
          <div className="space-y-3">
            {DEPTS.map((d) => (
              <div key={d.name} className="min-w-0 rounded-md bg-ink3/50 p-3 hairline">
                <div className="break-words font-display text-sm uppercase tracking-wide text-cream">
                  {d.name}
                </div>

                <p className="mt-1.5 break-words text-xs leading-relaxed text-steel">
                  {d.maintains}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Shadow blocking" className="min-w-0 lg:col-span-5">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-steel">
              When two or more departments have work inside the same span and time frame, the
              planner keeps one closure open and lets the others work in its shadow. The hours that
              would have been spent on the second and third closures are reported as{" "}
              <span className="text-signal">downtime saved</span>.
            </p>

            <p className="text-sm leading-relaxed text-steel">
              Inside the block, work is sequenced: TRD isolates and earths the overhead line,
              Engineering takes the track, S&amp;T tests signalling and interlocking, and TRD
              re-energizes before the line is handed back.
            </p>
          </div>
        </Panel>

        <Panel title="What-if simulation" className="min-w-0 lg:col-span-6">
          <p className="text-sm leading-relaxed text-steel">
            Enter a corridor and a proposed start and end time. The engine walks the timetable for
            that window, lists every passenger and goods service that would be affected, estimates
            the delay in minutes, and proposes a cleaner alternative slot when one exists.
          </p>
        </Panel>

        <Panel title="Priority scoring · 0–100" className="min-w-0 lg:col-span-6">
          <ul className="divide-y divide-line">
            {PRIORITY_FACTORS.map(([label, weight]) => (
              <li key={label} className="flex min-w-0 items-center justify-between gap-4 py-2">
                <span className="min-w-0 break-words text-sm text-cream">{label}</span>

                <span className="shrink-0 text-[11px] text-signal">{weight}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Risk levels" className="min-w-0 lg:col-span-5">
          <ul className="space-y-2.5">
            {RISK_LEVELS.map(([level, range]) => (
              <li key={level} className="flex min-w-0 items-center gap-3">
                <div className="shrink-0">
                  <Tag
                    tone={level === "CRITICAL" ? "danger" : level === "LOW" ? "clear" : "signal"}
                  >
                    {level}
                  </Tag>
                </div>

                <span className="min-w-0 break-words text-[11px] text-steel">{range}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="The model" className="min-w-0 lg:col-span-7">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-steel">
              Failure probability comes from a weighted ensemble — LightGBM 50%, Temporal CNN 30%,
              Random Forest 20% — tuned for recall (0.85), because a missed failure costs far more
              than an extra inspection.
            </p>

            <p className="text-sm leading-relaxed text-steel">
              Around 5,000 assets also carry SHAP explanations: the top five factors pushing risk up
              and up to three protective factors pulling it down, each with a signed contribution.
            </p>
          </div>
        </Panel>

        <Panel title="Data sources" className="min-w-0 lg:col-span-12">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES.map(([name, desc]) => (
              <div key={name} className="min-w-0 rounded-md bg-ink3/50 p-3 hairline">
                <div className="break-words text-[11px] tracking-widest text-signal">{name}</div>

                <p className="mt-1.5 break-words text-xs leading-relaxed text-steel">{desc}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Prototype limitations" className="min-w-0 lg:col-span-12">
          <ul className="space-y-2 text-sm leading-relaxed text-steel">
            <li>The optimizer is heuristic, not a certified operational planning tool.</li>
            <li>
              Corridor traffic, weather and freight figures are simulated for the demo sections.
            </li>
            <li>Only LNL-PUNE carries a full dataset; BPL and RKMP are partial.</li>
            <li>
              Every recommendation still requires an officer decision before it becomes a real
              possession.
            </li>
          </ul>

          <div className="mt-3">
            <Disclaimer />
          </div>
        </Panel>
      </div>
    </div>
  );
}
