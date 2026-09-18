import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { assetQuery, riskExplanationQuery, riskQuery } from "@/lib/queries";
import {
  AsyncBlock,
  EmptyState,
  ErrorNote,
  Loading,
  Meta,
  PageHeader,
  Panel,
  RiskTag,
  ScoreBar,
} from "@/components/control";
import { ShapFactors } from "@/components/shap";
import { fmtDate, fmtNum, fmtProb } from "@/lib/format";

export const Route = createFileRoute("/risks/$assetId")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${params.assetId} risk — Railway AI Block Planner`,
      },
    ],
  }),
  component: RiskDetail,
});

const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;

function RiskDetail() {
  const { assetId } = Route.useParams();

  const risk = useQuery(riskQuery(assetId));

  const explanation = useQuery(riskExplanationQuery(assetId));

  const asset = useQuery(assetQuery(assetId));

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <Link
        to="/risks"
        className="inline-flex min-h-9 items-center text-[11px] text-steel transition hover:text-cream"
      >
        ← ALL ASSETS BY RISK
      </Link>

      <PageHeader
        eyebrow="ASSET RISK · DETAIL"
        title={assetId}
        intro={
          asset.data
            ? `${asset.data.asset_type ?? "Asset"} · ${
                asset.data.station_name ?? asset.data.station_code ?? "—"
              }`
            : undefined
        }
        actions={
          <Link
            to="/assets/$assetId"
            params={{ assetId }}
            className="flex min-h-10 w-full items-center justify-center rounded-md border border-line px-4 py-2.5 text-[11px] uppercase text-cream transition hover:bg-ink3 sm:w-auto"
          >
            Full asset history
          </Link>
        }
      />

      <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 sm:space-y-6 xl:col-span-5">
          <Panel title="Latest risk score">
            <AsyncBlock
              isLoading={risk.isLoading}
              error={isNotFound(risk.error) ? null : risk.error}
              data={risk.data}
              emptyTitle="No risk score for this asset"
              emptyHint="Run the ML import on the Data page."
            >
              {(r) => (
                <div className="min-w-0 space-y-4">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-display text-5xl font-semibold leading-none text-cream sm:text-6xl">
                        {fmtNum(r.risk_score)}
                      </div>
                    </div>

                    <div className="w-fit shrink-0">
                      <RiskTag level={r.risk_level} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <ScoreBar value={r.risk_score} />
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                    <Meta
                      label="Risk probability"
                      value={fmtProb(r.risk_probability)}
                      tone="danger"
                    />

                    <Meta label="Predicted probability" value={fmtProb(r.predicted_probability)} />

                    <Meta
                      label="Predicted class"
                      value={
                        r.predicted_class === 1 || r.predicted_class === "1"
                          ? "Needs maintenance"
                          : "OK"
                      }
                    />

                    <Meta label="Snapshot" value={fmtDate(r.snapshot_date)} />
                  </div>

                  {r.recommended_action ? (
                    <div className="min-w-0 rounded-md border border-signal/40 bg-signal/10 px-3 py-2.5">
                      <div className="label-mono tracking-widest">Recommended action</div>

                      <div className="mt-1 break-words text-sm leading-5 text-cream">
                        {r.recommended_action}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </AsyncBlock>
          </Panel>

          <Panel title="Asset">
            {asset.isLoading ? (
              <Loading />
            ) : asset.data ? (
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <Meta label="Type" value={asset.data.asset_type ?? "—"} />

                <Meta label="Station" value={asset.data.station_code ?? "—"} />

                <Meta label="Installed" value={fmtDate(asset.data.installation_date)} />

                <Meta label="Age" value={`${fmtNum(asset.data.asset_age_years)} y`} />

                <Meta label="Expected life" value={`${fmtNum(asset.data.expected_life_years)} y`} />

                <Meta
                  label="Initial condition"
                  value={fmtNum(asset.data.initial_condition_score)}
                />
              </div>
            ) : isNotFound(asset.error) ? (
              <p className="text-[11px] text-steel">Asset master record not imported.</p>
            ) : (
              <ErrorNote error={asset.error} />
            )}
          </Panel>
        </div>

        <Panel title="Why — SHAP explanation" className="min-w-0 xl:col-span-7">
          {explanation.isLoading ? (
            <Loading label="Loading explanation…" />
          ) : explanation.data ? (
            <div className="min-w-0 space-y-4">
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                <Meta
                  label="Ensemble probability"
                  value={fmtProb(explanation.data.ensemble_probability)}
                  tone="danger"
                />

                <Meta label="Level" value={explanation.data.risk_level ?? "—"} />

                <Meta label="Snapshot" value={fmtDate(explanation.data.snapshot_date)} />
              </div>

              <div className="min-w-0 overflow-hidden">
                <ShapFactors explanation={explanation.data} />
              </div>
            </div>
          ) : isNotFound(explanation.error) ? (
            <EmptyState
              title="No explanation for this asset"
              hint="SHAP explanations exist for a 5,000-asset sample only."
            />
          ) : (
            <ErrorNote error={explanation.error} />
          )}
        </Panel>
      </div>
    </div>
  );
}
