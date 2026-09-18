"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, Tooltip } from "react-leaflet";

const ROUTE: [number, number][] = [
  [18.7493, 73.4081],
  [18.7207, 73.4559],
  [18.7588, 73.5537],
  [18.7621, 73.5941],
  [18.7507, 73.6505],
  [18.7352, 73.6747],
  [18.6844, 73.7536],
  [18.6657, 73.7688],
  [18.6415, 73.7508],
  [18.6477, 73.7754],
  [18.6298, 73.8004],
  [18.6231, 73.8217],
  [18.6036, 73.8318],
  [18.5878, 73.8302],
  [18.5711, 73.8276],
  [18.5308, 73.8527],
  [18.5286, 73.8743],
];

const STATIONS: {
  code: string;
  name: string;
  pos: [number, number];
}[] = [
  { code: "LNL", name: "Lonavala", pos: ROUTE[0]! },
  { code: "MVL", name: "Malavli", pos: ROUTE[1]! },
  { code: "KMST", name: "Kamshet", pos: ROUTE[2]! },
  { code: "KNHE", name: "Kanhe", pos: ROUTE[3]! },
  { code: "VDN", name: "Vadgaon", pos: ROUTE[4]! },
  { code: "TGN", name: "Talegaon", pos: ROUTE[5]! },
  { code: "GRWD", name: "Ghorawadi", pos: ROUTE[6]! },
  { code: "BGWI", name: "Begdewadi", pos: ROUTE[7]! },
  { code: "DEHR", name: "Dehu Road", pos: ROUTE[8]! },
  { code: "AKRD", name: "Akurdi", pos: ROUTE[9]! },
  { code: "CCH", name: "Chinchwad", pos: ROUTE[10]! },
  { code: "PMP", name: "Pimpri", pos: ROUTE[11]! },
  { code: "KSWD", name: "Kasarwadi", pos: ROUTE[12]! },
  { code: "DAPD", name: "Dapodi", pos: ROUTE[13]! },
  { code: "KK", name: "Khadki", pos: ROUTE[14]! },
  { code: "SVJR", name: "Shivajinagar", pos: ROUTE[15]! },
  { code: "PUNE", name: "Pune Junction", pos: ROUTE[16]! },
];

const TASK_COLORS = {
  engineering: "#f59e0b",
  signal: "#06b6d4",
  traction: "#8b5cf6",
};

const MAINTENANCE_TASKS = [
  {
    id: "ENG-041",
    type: "engineering",
    label: "Track Maintenance",
    station: "Talegaon",
    pos: [18.7352, 73.6747] as [number, number],
  },
  {
    id: "SNT-018",
    type: "signal",
    label: "Signal Inspection",
    station: "Dehu Road",
    pos: [18.6415, 73.7508] as [number, number],
  },
  {
    id: "TRC-027",
    type: "traction",
    label: "OHE Maintenance",
    station: "Akurdi",
    pos: [18.6477, 73.7754] as [number, number],
  },
  {
    id: "ENG-052",
    type: "engineering",
    label: "Rail Grinding",
    station: "Kamshet",
    pos: [18.7588, 73.5537] as [number, number],
  },
  {
    id: "SNT-033",
    type: "signal",
    label: "Relay Inspection",
    station: "Shivajinagar",
    pos: [18.5308, 73.8527] as [number, number],
  },
  {
    id: "TRC-034",
    type: "traction",
    label: "OHE Inspection",
    station: "Malavli",
    pos: [18.7207, 73.4559] as [number, number],
  },
  {
    id: "ENG-063",
    type: "engineering",
    label: "Track Alignment",
    station: "Vadgaon",
    pos: [18.7507, 73.6505] as [number, number],
  },
  {
    id: "SNT-047",
    type: "signal",
    label: "Signal Maintenance",
    station: "Pimpri",
    pos: [18.6231, 73.8217] as [number, number],
  },
  {
    id: "TRC-051",
    type: "traction",
    label: "OHE Inspection",
    station: "Khadki",
    pos: [18.5711, 73.8276] as [number, number],
  },
];

export function BlockMap() {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        bounds={ROUTE}
        boundsOptions={{ padding: [30, 30] }}
        zoomControl={true}
        zoomDelta={0.4}
        zoomSnap={0.1}
        scrollWheelZoom={true}
        preferCanvas
        style={{
          height: "100%",
          width: "100%",
          background: "#101114",
        }}
        className="rounded-b-md"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Railway route */}
        <Polyline
          positions={ROUTE}
          pathOptions={{
            color: "#d70024",
            weight: 7,
            opacity: 0.25,
          }}
        />

        <Polyline
          positions={ROUTE}
          pathOptions={{
            color: "#d70024",
            weight: 3,
            opacity: 1,
          }}
        />

        {/* Stations */}
        {STATIONS.map((station) => {
          const major = station.code === "LNL" || station.code === "PUNE";

          return (
            <CircleMarker
              key={station.code}
              center={station.pos}
              radius={major ? 7 : 3}
              pathOptions={{
                color: major ? "#ffffff" : "#d70024",
                fillColor: major ? "#d70024" : "#ffffff",
                fillOpacity: 1,
                weight: major ? 2 : 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <span className="font-mono text-xs font-semibold">{station.code}</span>
              </Tooltip>

              {major && (
                <Popup>
                  <div className="font-mono text-xs">
                    <div className="font-bold">{station.name}</div>
                    <div className="text-gray-500">{station.code}</div>
                  </div>
                </Popup>
              )}
            </CircleMarker>
          );
        })}

        {/* Maintenance tasks */}
        {MAINTENANCE_TASKS.map((task) => {
          const color = TASK_COLORS[task.type as keyof typeof TASK_COLORS];

          return (
            <CircleMarker
              key={task.id}
              center={task.pos}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                fillColor: color,
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip permanent direction="right" offset={[9, 0]} opacity={1}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {task.id}
                </span>
              </Tooltip>

              <Popup>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    minWidth: 150,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    {task.label}
                  </div>

                  <div>{task.station}</div>

                  <div
                    style={{
                      color,
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    {task.type === "engineering"
                      ? "Engineering"
                      : task.type === "signal"
                        ? "Signal & Telecom"
                        : "Traction"}
                  </div>

                  <div
                    style={{
                      color: "#777",
                      marginTop: 3,
                    }}
                  >
                    Task ID: {task.id}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-white/10 bg-[#101114]/90 px-3 py-2.5 shadow-lg backdrop-blur">
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/60">
          Maintenance Tasks
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: TASK_COLORS.engineering,
              }}
            />
            <span className="font-mono text-[10px] text-white/80">Engineering</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: TASK_COLORS.signal,
              }}
            />
            <span className="font-mono text-[10px] text-white/80">Signal & Telecom</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: TASK_COLORS.traction,
              }}
            />
            <span className="font-mono text-[10px] text-white/80">Traction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
