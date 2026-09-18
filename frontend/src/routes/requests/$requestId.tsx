import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPatch } from "@/lib/api";
import { blockRequestQuery } from "@/lib/queries";
import type { BlockRequest, Window } from "@/lib/types";
import {
  AsyncBlock,
  ErrorNote,
  GhostButton,
  KeyValueGrid,
  Meta,
  PageHeader,
  Panel,
  RiskTag,
  StatusTag,
  Tag,
} from "@/components/control";
import { cn } from "@/lib/utils";
import { fmtDateTime, fmtNum, fmtProb } from "@/lib/format";

export const Route = createFileRoute("/requests/$requestId")({
  head: ({ params }) => ({
    meta: [{ title: `${params.requestId} — Block Request` }],
  }),
  component: RequestDetail,
});

function sameWindow(a?: Window | null, b?: Window | null) {
  return !!a && !!b && a.date === b.date && a.startTime === b.startTime && a.endTime === b.endTime;
}

function RequestDetail() {
  const { requestId } = Route.useParams();
  const { data, isLoading, error } = useQuery(blockRequestQuery(requestId));

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <Link
        to="/dashboard"
        className="inline-block text-[11px] text-steel transition hover:text-cream"
      >
        ← ALL REQUESTS
      </Link>

      <AsyncBlock isLoading={isLoading} error={error} data={data} loadingLabel="Loading request…">
        {(r) => <RequestView request={r} />}
      </AsyncBlock>
    </div>
  );
}

function RequestView({ request: r }: { request: BlockRequest }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = `/ai/block-requests/${encodeURIComponent(r.requestId)}`;
  const d = r.decision;

  const selectWindow = useMutation({
    mutationFn: (optionId: string) => apiPatch<BlockRequest>(`${path}/window`, { optionId }),

    onSuccess: (_res, optionId) => {
      toast.success(`Block confirmed for ${optionId.replace(/_/g, " ").toLowerCase()}`);

      void qc.invalidateQueries({
        queryKey: ["block-request", r.requestId],
      });

      void qc.invalidateQueries({
        queryKey: ["block-requests"],
      });

      void navigate({ to: "/" });
    },
  });

  const options: Window[] = [
    ...(d?.recommendedWindow ? [{ ...d.recommendedWindow, optionId: "RECOMMENDED" }] : []),
    ...(d?.alternativeOptions ?? []),
  ];

  const safety = d?.safetyProtocols;

  const precautions = Array.isArray(safety?.safetyPrecautions)
    ? safety.safetyPrecautions
    : safety?.safetyPrecautions
      ? [safety.safetyPrecautions]
      : [];

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow={`BLOCK REQUEST · ${r.sectionId ?? ""}`}
        title={r.requestId}
        intro={`${r.department ?? "—"} · ${
          r.maintenanceType ?? "—"
        } · Km ${fmtNum(r.fromKm)} – ${fmtNum(r.toKm)}${
          d?.lineConfiguration ? ` · ${d.lineConfiguration}` : ""
        }`}
        actions={<StatusTag status={r.status} />}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 sm:space-y-6 xl:col-span-8">
          <Panel title="Window options" right={d?.status ? d.status.replace(/_/g, " ") : undefined}>
            {options.length ? (
              <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {options.map((w) => {
                  const selected = sameWindow(w, r.selectedWindow);

                  const id = w.optionId ?? "RECOMMENDED";

                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex min-w-0 flex-col rounded-md bg-ink3/50 p-3 hairline",
                        selected && "bg-signal/10 ring-1 ring-signal/60",
                      )}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <span className="min-w-0 break-words text-[10px] tracking-widest text-steel">
                          {id.replace(/_/g, " ")}
                        </span>

                        {selected ? (
                          <div className="shrink-0">
                            <Tag tone="signal">Selected</Tag>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-2 break-words font-display text-2xl text-cream">
                        {w.startTime}–{w.endTime}
                      </div>

                      <div className="break-words text-[11px] text-steel">
                        {w.date} · {fmtNum(w.durationHours)} h
                      </div>

                      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
                        <Meta label="Traffic" value={w.trafficLevel ?? "—"} />

                        <Meta
                          label="Score"
                          value={fmtNum(w.overallScore ?? w.score, 0)}
                          tone="signal"
                        />

                        <Meta label="Traffic score" value={fmtNum(w.trafficScore)} />

                        <Meta
                          label="Weather"
                          value={
                            w.weatherSuitable === undefined
                              ? "—"
                              : w.weatherSuitable
                                ? "OK"
                                : "Unsuitable"
                          }
                          tone={w.weatherSuitable === false ? "danger" : "clear"}
                        />
                      </div>

                      <GhostButton
                        className="mt-3 w-full"
                        disabled={selected || selectWindow.isPending}
                        onClick={() => selectWindow.mutate(id)}
                      >
                        {selected ? "In use" : "Confirm this block"}
                      </GhostButton>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-steel">The engine returned no windows.</p>
            )}

            {selectWindow.error ? (
              <div className="mt-3">
                <ErrorNote error={selectWindow.error} title="Could not confirm this window" />
              </div>
            ) : null}
          </Panel>

          {d?.reasons?.length ? (
            <Panel title="Why the AI recommends this">
              <ul className="space-y-2">
                {d.reasons.map((reason, i) => (
                  <li
                    key={i}
                    className="flex min-w-0 items-start gap-2 text-sm leading-relaxed text-steel"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal" />

                    <span className="min-w-0 break-words">{reason}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {d?.interDepartmentSequencing?.length ? (
            <Panel title="Inter-department safety sequencing">
              <ol className="relative ml-1.5 space-y-4 border-l border-line">
                {d.interDepartmentSequencing.map((step, i) => (
                  <li key={i} className="relative min-w-0 pl-5">
                    <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-signal" />

                    <div className="break-words text-[10px] text-signal">
                      PHASE {step.phase ?? i + 1} · {step.timeWindow}
                    </div>

                    <div className="break-words text-sm text-cream">
                      {step.department} · {step.safetyAction}
                    </div>

                    <div className="break-words text-xs leading-5 text-steel">
                      {step.operatingProtocol}
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}

          <div className="grid min-w-0 gap-4 md:grid-cols-3 sm:gap-6">
            <Panel title="Corridor starvation">
              <KeyValueGrid data={d?.corridorStarvationAnalysis} />
            </Panel>

            <Panel title="Productivity & buffers">
              <KeyValueGrid data={d?.blockProductivityAndBuffers} />
            </Panel>

            <Panel title="Traffic calendar">
              <KeyValueGrid data={d?.specialTrafficCalendar} />
            </Panel>
          </div>
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-6 xl:col-span-4">
          {safety ? (
            <Panel title="Safety protocols">
              <div className="grid min-w-0 grid-cols-2 gap-3">
                <Meta
                  label="Power block"
                  value={safety.powerBlockRequired ? "Required" : "Not required"}
                  tone={safety.powerBlockRequired ? "danger" : "clear"}
                />

                <Meta
                  label="Traffic block"
                  value={safety.trafficBlockRequired ? "Required" : "Not required"}
                  tone={safety.trafficBlockRequired ? "signal" : "clear"}
                />
              </div>

              {safety.speedRestriction ? (
                <div className="mt-3">
                  <Meta label="Speed restriction" value={safety.speedRestriction} />
                </div>
              ) : null}

              {precautions.length ? (
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-steel">
                  {precautions.map((p, i) => (
                    <li key={i} className="break-words">
                      {p}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          ) : null}

          <Panel title="Asset risk">
            {r.assetRisk ? (
              <div className="min-w-0 space-y-3">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <Link
                    to="/risks/$assetId"
                    params={{
                      assetId: r.assetRisk.asset_id,
                    }}
                    className="min-w-0 break-all text-sm text-signal hover:underline"
                  >
                    {r.assetRisk.asset_id}
                  </Link>

                  <div className="shrink-0">
                    <RiskTag level={r.assetRisk.risk_level} />
                  </div>
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-3">
                  <Meta label="Risk score" value={fmtNum(r.assetRisk.risk_score)} tone="danger" />

                  <Meta label="Probability" value={fmtProb(r.assetRisk.risk_probability)} />
                </div>

                {r.assetRisk.recommended_action ? (
                  <p className="break-words text-xs leading-5 text-steel">
                    {r.assetRisk.recommended_action}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-[11px] text-steel">No asset linked to this request.</p>
            )}
          </Panel>

          <Panel title="Submitted preferences">
            <div className="min-w-0 overflow-x-auto">
              <KeyValueGrid data={d?.userPreferences} />
            </div>
          </Panel>

          <Panel title="Audit trail">
            {r.auditTrail?.length ? (
              <ol className="space-y-3">
                {r.auditTrail.map((a, i) => (
                  <li key={i} className="min-w-0 border-l border-line pl-3">
                    <div className="break-words text-[11px] uppercase text-cream">
                      {a.action?.replace(/_/g, " ")}
                    </div>

                    <div className="break-words text-[10px] leading-5 text-steel">
                      {fmtDateTime(a.at)} · {a.by ?? "system"}
                    </div>

                    {a.note ? (
                      <div className="break-words text-xs leading-5 text-steel">{a.note}</div>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[11px] text-steel">No entries.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
