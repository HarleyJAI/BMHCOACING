#!/usr/bin/env python3
"""Scheduling optimizer for clinician routing with optional Folium output."""
from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass
class PatientStop:
    patient_id: str
    lat: float
    lon: float
    urgency: int


def _read_rows(csv_path: Path) -> Iterable[dict[str, str]]:
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row


def load_stops(csv_path: Path) -> list[PatientStop]:
    rows = list(_read_rows(csv_path))
    if not rows:
        return []

    required = {"patient_id", "latitude", "longitude", "urgency_tier"}
    missing = required - set(rows[0].keys())
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    return [
        PatientStop(
            patient_id=str(r["patient_id"]),
            lat=float(r["latitude"]),
            lon=float(r["longitude"]),
            urgency=int(r["urgency_tier"]),
        )
        for r in rows
    ]


def order_route(stops: list[PatientStop]) -> list[PatientStop]:
    remaining = sorted(stops, key=lambda s: (-s.urgency, s.patient_id))
    if not remaining:
        return []

    route = [remaining.pop(0)]
    while remaining:
        current = route[-1]
        nxt = min(
            remaining,
            key=lambda s: (0 if s.urgency == current.urgency else 1, (s.lat - current.lat) ** 2 + (s.lon - current.lon) ** 2),
        )
        remaining.remove(nxt)
        route.append(nxt)
    return route


def build_map(route: list[PatientStop], output_html: Path) -> None:
    try:
        import folium  # type: ignore
    except Exception:
        # Fallback output if folium is unavailable in constrained environments.
        output_html.write_text(
            "<html><body><h1>Route Preview</h1><p>Install folium for interactive map.</p></body></html>",
            encoding="utf-8",
        )
        return

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


def write_route_csv(route: list[PatientStop], output_csv: Path) -> None:
    with output_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["sequence", "patient_id", "latitude", "longitude", "urgency_tier"])
        writer.writeheader()
        for i, s in enumerate(route, start=1):
            writer.writerow({"sequence": i, "patient_id": s.patient_id, "latitude": s.lat, "longitude": s.lon, "urgency_tier": s.urgency})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_csv", type=Path)
    parser.add_argument("--output-map", type=Path, default=Path("output/clinician_routes.html"))
    parser.add_argument("--output-csv", type=Path, default=Path("output/optimized_route.csv"))
    args = parser.parse_args()

    stops = load_stops(args.input_csv)
    route = order_route(stops)

    args.output_map.parent.mkdir(parents=True, exist_ok=True)
    args.output_csv.parent.mkdir(parents=True, exist_ok=True)

    write_route_csv(route, args.output_csv)
    build_map(route, args.output_map)

    print(f"Wrote {args.output_csv}")
    print(f"Wrote {args.output_map}")


if __name__ == "__main__":
    main()
