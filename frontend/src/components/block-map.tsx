import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { StationSearchResult } from "@/lib/types";

const COLORS = [
  // "#ef4444",
  // "#fe6a00",
  // "#eab308",
  "#22c55e",
  // "#06b6d4",
  // "#0051d3",
  "#3c02c4",
  // "#c70064",
  // "#00bca6",
  "#d70024",
];

function getColor(code: string) {
  let hash = 0;

  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }

  return COLORS[Math.abs(hash) % COLORS.length];
}

export function BlockMap({ stations }: { stations: StationSearchResult[] }) {
  const center: [number, number] = [22.5, 79];

  return (
    <MapContainer
      center={center}
      zoom={5}
      preferCanvas
      style={{ height: "100%", width: "100%" }}
      className="rounded-b-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {stations.filter((_, index) => index % 10 === 0).map((s) => {
        const color = getColor(s.code);

        return (
          <CircleMarker
            key={s.code}
            center={[s.lat!, s.lon!]}
            radius={Math.min(3 + Math.sqrt(s.assetCount), 10)}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.65,
              weight: 1.5,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                <div style={{ fontWeight: 700 }}>
                  {s.name} ({s.code})
                </div>

                <div>{s.assetCount} real assets</div>

                <div style={{ color: "#666" }}>{s.assetTypes.join(", ")}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
