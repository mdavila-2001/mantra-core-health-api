from __future__ import annotations

from bot import traffic
from bot.commands import COMMANDS, MENU
from bot.docker_state import parse_inspect, parse_routes
from bot.exporter import render_metrics

from .fakes import FakeSources, container

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
T0 = 1_780_000_000


def _site_samples() -> dict:
    return {
        traffic.Q_SITE_REQ_24H: [({"site": "test.62.169.18.132.sslip.io"}, 12000.0), ({"site": "dev.62.169.18.132.sslip.io"}, 300.0)],
        traffic.Q_SITE_RPM: [({"site": "test.62.169.18.132.sslip.io"}, 8.4)],
        traffic.Q_SITE_5XX_24H: [({"site": "dev.62.169.18.132.sslip.io"}, 30.0)],
        traffic.Q_SITE_P95_NOW: [({"site": "test.62.169.18.132.sslip.io"}, 0.42), ({"site": "dev.62.169.18.132.sslip.io"}, float("nan"))],
    }


def test_routes_come_from_traefik_labels_with_the_first_host():
    labels = {
        "traefik.http.routers.https-0-abc-proxy-4313.rule": "Host(`test.example`) && PathPrefix(`/`)",
        "traefik.http.routers.alovida-ai-front.rule": "(Host(`dev.example`) || Host(`test.example`)) && PathPrefix(`/ai/`)",
        "traefik.http.routers.https-0-abc-proxy-4313.tls": "true",
        "coolify.name": "proxy",
    }
    assert parse_routes(labels) == (("alovida-ai-front", "dev.example/ai"), ("https-0-abc-proxy-4313", "test.example"))


def test_router_info_is_exported_only_for_running_containers():
    running = container(routes=(("https-0-abc", "test.example"),))
    stopped = container(name="viejo", status="exited", routes=(("https-0-abc", "test.example"), ("https-0-old", "old.example")))
    text = render_metrics([running, stopped], True)
    assert 'alovida_router_info{router="https-0-abc@docker",site="test.example"} 1' in text
    assert "old.example" not in text


def test_parse_inspect_keeps_the_routes():
    inspect = {"Name": "/web", "State": {"Status": "running"},
               "Config": {"Labels": {"traefik.http.routers.r1.rule": "Host(`a.example`)"}}}
    assert parse_inspect(inspect).routes == (("r1", "a.example"),)


def test_traffic_report_lists_sites_busiest_first_and_flags_5xx():
    text = traffic.traffic_report(FakeSources(samples=_site_samples()))
    assert text.index("test.62") < text.index("dev.62")
    assert "🟢 <b>test.62.169.18.132.sslip.io</b>" in text
    assert "8.4 ped/min · p95 420 ms" in text
    assert "🔴 <b>dev.62.169.18.132.sslip.io</b>" in text  # 30 de 300 = 10 %
    assert "10.0 % con 5xx" in text
    assert "p95 —" in text  # NaN de Prometheus sin tráfico reciente


def test_traffic_report_without_data_points_to_the_alert():
    assert "TraefikMetricsDown" in traffic.traffic_report(FakeSources())


def test_dashboard_is_one_png_and_falls_back_to_sites_without_otel():
    samples = _site_samples() | {traffic.Q_TOTAL_REQ_24H: [({}, 12300.0)], traffic.Q_TOTAL_5XX_24H: [({}, 30.0)],
                                 traffic.Q_TOTAL_RPM: [({}, 8.4)], traffic.Q_TOTAL_P95_NOW: [({}, 0.5)]}
    points = [(T0 + i * 300, float(i % 7)) for i in range(288)]
    series = {
        traffic.Q_SITE_RPM_RANGE: [({"site": "test.62.169.18.132.sslip.io"}, points)],
        traffic.Q_SITE_P95_RANGE: [({"site": "test.62.169.18.132.sslip.io"}, [(t, float("nan")) for t, _ in points[:5]] + points[5:])],
        traffic.Q_CODES_RANGE: [({"code_class": "2xx"}, points), ({"code_class": "5xx"}, points[:10])],
    }
    photos = traffic.dashboard(FakeSources(samples=samples, series=series))
    assert len(photos) == 1 and photos[0].png.startswith(PNG_MAGIC)
    assert "12.300 pedidos en 24 h" in photos[0].caption
    assert "falta" not in photos[0].caption and "OpenTelemetry" in photos[0].caption


def test_endpoint_rows_from_spanmetrics():
    labels = {"service_name": "api", "http_request_method": "GET", "http_route": "/public/posts"}
    samples = {
        traffic.Q_ENDPOINT_CALLS_24H: [(labels, 200.0), ({**labels, "http_route": "/health"}, 900.0)],
        traffic.Q_ENDPOINT_ERRORS_24H: [(labels, 20.0)],
        traffic.Q_ENDPOINT_P95_24H: [(labels, 1.5)],
    }
    rows = traffic.endpoint_rows(FakeSources(samples=samples))
    assert rows[0][0] == "GET /health"
    assert rows[1] == ["GET /public/posts", "200", "1.50 s", "10.0 %"]


def test_dashboard_with_endpoints_has_no_otel_hint():
    labels = {"service_name": "api", "http_request_method": "GET", "http_route": "/x"}
    photos = traffic.dashboard(FakeSources(samples={traffic.Q_ENDPOINT_CALLS_24H: [(labels, 5.0)]}))
    assert "OpenTelemetry" not in photos[0].caption


def test_commands_and_menu_include_traffic():
    for command in ("/trafico", "/tráfico", "/traffic", "/tablero", "/dashboard"):
        assert command in COMMANDS
    assert {"tablero", "trafico"} <= {name for name, _ in MENU}
