from pathlib import Path

from tools.scheduling_optimizer.optimizer import PatientStop, load_stops, order_route, write_route_csv, build_map


def test_order_route_prioritizes_high_urgency_first():
    stops = [
        PatientStop("A", 0.0, 0.0, 1),
        PatientStop("B", 1.0, 1.0, 5),
        PatientStop("C", 2.0, 2.0, 3),
    ]
    route = order_route(stops)
    assert route[0].patient_id == "B"


def test_load_stops_requires_columns(tmp_path: Path):
    p = tmp_path / "bad.csv"
    p.write_text("x,y\n1,2\n", encoding="utf-8")
    try:
        load_stops(p)
        assert False, "Expected ValueError"
    except ValueError as e:
        assert "Missing required columns" in str(e)


def test_write_csv_and_map_outputs(tmp_path: Path):
    route = [PatientStop("X", 10.0, 20.0, 4)]
    out_csv = tmp_path / "route.csv"
    out_html = tmp_path / "map.html"
    write_route_csv(route, out_csv)
    build_map(route, out_html)
    assert out_csv.exists()
    assert out_html.exists()
