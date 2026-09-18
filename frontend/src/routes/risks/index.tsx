import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { riskCountQuery, risksQuery } from "@/lib/queries";
import { RISK_LEVELS } from "@/lib/types";
import {
  AsyncBlock,
  ChromeButton,
  DataTable,
  Field,
  GhostButton,
  PageHeader,
  Pager,
  Panel,
  RiskTag,
  ScoreBar,
  SelectInput,
  Stat,
  TextInput,
} from "@/components/control";
import { fmtDate, fmtNum, fmtProb } from "@/lib/format";

export const Route = createFileRoute("/risks/")({
  head: () => ({
    meta: [
      {
        title: "Asset Risk — Railway AI Block Planner",
      },
    ],
  }),
  component: Risks,
});

type Filters = {
  riskLevel: string;
  minScore: string;
  maxScore: string;
  search: string;
};

const EMPTY: Filters = {
  riskLevel: "",
  minScore: "",
  maxScore: "",
  search: "",
};

const LEVEL_TONE = {
  LOW: "clear",
  MEDIUM: "signal",
  HIGH: "signal",
  CRITICAL: "danger",
} as const;

function LevelStat({
  level,
  active,
  onClick,
}: {
  level: (typeof RISK_LEVELS)[number];
  active: boolean;
  onClick: () => void;
}) {
  const { data, isLoading, isError } = useQuery(riskCountQuery(level));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-lg ${active ? "ring-1 ring-signal/70" : ""}`}
    >
      <Stat
        label={level}
        value={isLoading ? "…" : isError ? "—" : fmtNum(data, 0)}
        tone={LEVEL_TONE[level]}
        sub={active ? "Filtering — click to clear" : "Click to filter"}
      />
    </button>
  );
}

function Risks() {
  const [draft, setDraft] = useState<Filters>(EMPTY);

  const [filters, setFilters] = useState<Filters>(EMPTY);

  const [page, setPage] = useState(1);

  const { data, isLoading, error, isFetching } = useQuery(
    risksQuery({
      ...filters,
      page,
      limit: 50,
    }),
  );

  const apply = (next: Filters) => {
    setDraft(next);
    setFilters(next);
    setPage(1);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    apply(draft);
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="ML ENSEMBLE · ASSET RISK"
        title="Asset failure risk"
        intro="Every asset scored by the LightGBM / Temporal CNN / Random Forest ensemble, ranked by risk score with the recommended action."
      />

      <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {RISK_LEVELS.map((level) => (
          <LevelStat
            key={level}
            level={level}
            active={filters.riskLevel === level}
            onClick={() =>
              apply({
                ...filters,
                riskLevel: filters.riskLevel === level ? "" : level,
              })
            }
          />
        ))}
      </div>

      <Panel title="Filters">
        <form onSubmit={onSubmit} className="grid min-w-0 gap-4 md:grid-cols-5">
          <Field label="Asset ID">
            <TextInput
              value={draft.search}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  search: e.target.value,
                })
              }
              placeholder="AST0…"
            />
          </Field>

          <Field label="Risk level">
            <SelectInput
              value={draft.riskLevel}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  riskLevel: e.target.value,
                })
              }
            >
              <option value="">All levels</option>

              {RISK_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Min score">
            <TextInput
              inputMode="decimal"
              value={draft.minScore}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  minScore: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Max score">
            <TextInput
              inputMode="decimal"
              value={draft.maxScore}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  maxScore: e.target.value,
                })
              }
            />
          </Field>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
            <ChromeButton type="submit" className="w-full flex-1 sm:w-auto">
              Apply
            </ChromeButton>

            <GhostButton onClick={() => apply(EMPTY)} className="w-full sm:w-auto">
              Clear
            </GhostButton>
          </div>
        </form>
      </Panel>

      <Panel title="Ranked assets" right={isFetching ? "REFRESHING…" : undefined}>
        <AsyncBlock
          isLoading={isLoading}
          error={error}
          data={data}
          isEmpty={(d) => d.rows.length === 0}
          emptyTitle="No risk scores found"
          emptyHint="Import the ML outputs from the Data page, or loosen the filters."
        >
          {({ rows, pagination }) => (
            <>
              <div className="w-full max-w-full overflow-x-auto rounded-md [-webkit-overflow-scrolling:touch]">
                <div className="min-w-[850px]">
                  <DataTable
                    head={[
                      "Asset",
                      "Snapshot",
                      "Probability",
                      "Risk score",
                      "Level",
                      "Recommended action",
                    ]}
                  >
                    {rows.map((r) => (
                      <tr key={`${r.asset_id}-${r.snapshot_date}`}>
                        <td>
                          <Link
                            to="/risks/$assetId"
                            params={{
                              assetId: r.asset_id,
                            }}
                            className="text-signal hover:underline"
                          >
                            {r.asset_id}
                          </Link>
                        </td>

                        <td className="text-steel">{fmtDate(r.snapshot_date)}</td>

                        <td>{fmtProb(r.risk_probability ?? r.predicted_probability)}</td>

                        <td>
                          <div className="min-w-[120px]">
                            <ScoreBar value={r.risk_score} />
                          </div>
                        </td>

                        <td>
                          <RiskTag level={r.risk_level} />
                        </td>

                        <td className="max-w-[360px] whitespace-normal break-words text-steel">
                          {r.recommended_action ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <Pager
                  page={pagination?.page ?? page}
                  totalPages={pagination?.totalPages ?? 1}
                  total={pagination?.total}
                  onPage={setPage}
                />
              </div>
            </>
          )}
        </AsyncBlock>
      </Panel>
    </div>
  );
}
