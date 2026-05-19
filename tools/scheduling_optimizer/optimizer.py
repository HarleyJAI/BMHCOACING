#!/usr/bin/env python3
"""Scheduling optimizer for clinician routing with Folium output."""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import folium
import pandas as pd


@dataclass
class PatientStop:
    patient_id: str
    lat: float
    lon: float
    urgency: int


def load_stops(csv_path: Path) -> list[PatientStop]:
    df = pd.read_csv(csv_path)
    required = {"patient_id", "latitude", "longitude", "urgency_tier"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    stops = [
        PatientStop(
            patient_id=str(r.patient_id),
            lat=float(r.latitude),
            lon=float(r.longitude),
            urgency=int(r.urgency_tier),
        )
        for r in df.itertuples(index=False)
    ]
    return stops


def order_route(stops: list[PatientStop]) -> list[PatientStop]:
    """Simple heuristic: prioritize urgency desc, then nearest-neighbor within same urgency band."""
    remaining = sorted(stops, key=lambda s: (-s.urgency, s.patient_id))
    if not remaining:
        return []

    route = [remaining.pop(0)]
    while remaining:
        current = route[-1]
        same_or_lower = remaining
        nxt = min(
            same_or_lower,
            key=lambda s: (0 if s.urgency == current.urgency else 1, (s.lat - current.lat) ** 2 + (s.lon - current.lon) ** 2),
        )
        remaining.remove(nxt)
        route.append(nxt)
    return route


def build_map(route: list[PatientStop], output_html: Path) -> None:
    if not route:
        m = folium.Map(location=[39.5, -98.35], zoom_start=4)
        m.save(output_html)
        return

    center = [route[0].lat, route[0].lon]
    m = folium.Map(location=center, zoom_start=11, tiles="CartoDB positron")

    coords = []
    for idx, stop in enumerate(route, start=1):
        coords.append((stop.lat, stop.lon))
        color = "red" if stop.urgency >= 4 else "orange" if stop.urgency >= 2 else "green"
        folium.CircleMarker(
            location=[stop.lat, stop.lon],
            radius=7,
            color=color,
            fill=True,
            fill_opacity=0.8,
            popup=f"Stop {idx}: Patient {stop.patient_id} (Urgency {stop.urgency})",
        ).add_to(m)

    folium.PolyLine(coords, weight=3, color="blue", opacity=0.8, tooltip="Optimized Route").add_to(m)
    m.save(output_html)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_csv", type=Path)
    parser.add_argument("--output-map", type=Path, default=Path("output/clinician_routes.html"))
    parser.add_argument("--output-csv", type=Path, default=Path("output/optimized_route.csv"))
    args = parser.parse_args()

    stops = load_stops(args.input_csv)
    route = order_route(stops)

    pd.DataFrame(
        [{"sequence": i + 1, "patient_id": s.patient_id, "latitude": s.lat, "longitude": s.lon, "urgency_tier": s.urgency} for i, s in enumerate(route)]
    ).to_csv(args.output_csv, index=False)

    args.output_map.parent.mkdir(parents=True, exist_ok=True)
    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    build_map(route, args.output_map)

    print(f"Wrote {args.output_csv}")
    print(f"Wrote {args.output_map}")


if __name__ == "__main__":
    main()
