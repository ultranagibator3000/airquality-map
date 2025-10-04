// components/MapView.tsx
"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

export default function MapView() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/openaq?country=US&limit=200");
        const results = res.data?.results ?? [];
        // robustly extract lat/lon (v3 may use coordinates.latitude/longitude or arrays)
        const items = results
          .map((loc: any) => {
            const coords = loc.coordinates ?? {};
            const lat =
              coords.latitude ??
              coords.lat ??
              (Array.isArray(coords) ? coords[1] : undefined) ??
              loc.latitude;
            const lon =
              coords.longitude ??
              coords.lon ??
              (Array.isArray(coords) ? coords[0] : undefined) ??
              loc.longitude;
            return { ...loc, _lat: lat, _lon: lon };
          })
          .filter((l: any) => l._lat !== undefined && l._lon !== undefined);
        setLocations(items);
      } catch (e) {
        console.error("Failed to fetch OpenAQ v3 data", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading air-quality locations…</div>;

  return (
    <MapContainer center={[37.7749, -122.4194]} zoom={4} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {locations.map((loc: any) => (
        <Marker key={loc.id ?? loc.location} position={[loc._lat, loc._lon]}>
          <Popup>
            <b>{loc.name ?? loc.location ?? loc.city}</b>
            <br />
            {/* v3 returns parameter info under different fields (parameters/latest) — try a few fallbacks */}
            {loc.parameters?.length ? (
              loc.parameters.slice(0, 5).map((p: any, i: number) => (
                <div key={i}>
                  {(p.name || p.parameter || p.displayName || p.id)}:
                  {" "}
                  {(p.lastValue ?? p.value ?? JSON.stringify(p))}
                </div>
              ))
            ) : loc.latest ? (
              <div>{JSON.stringify(loc.latest)}</div>
            ) : (
              <div>No parameter summary available — inspect console for raw object</div>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
