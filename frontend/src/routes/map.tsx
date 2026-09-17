import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { stationsGeoQuery } from "@/lib/queries";
import { AsyncBlock, PageHeader, Panel } from "@/components/control";

const BlockMap = lazy(() =>
  import("@/components/block-map").then((m) => ({
    default: m.BlockMap,
  })),
);

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Block Map — Railway AI Block Planner" },
      {
        name: "description",
        content:
          "Every real station your asset data references, plotted from real geo coordinates.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data, isLoading, error } = useQuery(stationsGeoQuery);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col gap-4 overflow-hidden">
      <PageHeader
        title="Interactive station map"
        intro="Every station your real asset data references, plotted at its real coordinates. Department markers show the maintenance systems represented at each station."
      />

      <Panel
        title="Railway Network"
        right={data ? `${data.length} stations` : undefined}
        bodyClassName="p-0"
      >
        <div
          style={{
            height: "calc(100vh - 260px)",
            overflow: "hidden",
          }}
        >
          {mounted ? (
            <AsyncBlock
              isLoading={isLoading}
              error={error}
              data={data}
              isEmpty={(d) => d.length === 0}
              loadingLabel="Loading stations…"
              emptyTitle="No stations with coordinates"
              emptyHint="Station geo data comes from the seed script — see backend/docs/NETWORK_DATA.md."
            >
              {(stations) => (
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center font-mono text-[11px] text-steel">
                      Loading map…
                    </div>
                  }
                >
                  <BlockMap stations={stations} />
                </Suspense>
              )}
            </AsyncBlock>
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[11px] text-steel">
              Loading map…
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
