from datetime import datetime, timezone

from bot import reports
from tests.fakes import GIB, FakeSources, container, host_samples


def test_status_report_summarises_host_containers_and_alerts():
    sources = FakeSources(
        samples=host_samples(),
        states=[container(), container(name="w1", service="worker-messaging", health="unhealthy")],
        alerts=[{"labels": {"alertname": "ContainerUnhealthy", "severity": "critical"}, "annotations": {}}],
    )
    text = reports.status_report(sources)
    assert "RAM: 12.0 / 48.0 GiB (25 %) · swap 25 %" in text
    assert "Disco /: 42 %" in text
    assert "↓ 12.50 Mbit/s · ↑ 3.00 Mbit/s" in text
    assert "2 corriendo · 1 unhealthy · 0 caídos" in text
    assert "alovida-backend-central/worker-messaging unhealthy" in text
    assert "1 alerta(s) activa(s): ContainerUnhealthy" in text


def test_status_report_flags_docker_unavailable():
    text = reports.status_report(FakeSources(samples=host_samples(), docker_up=False))
    assert "no pude consultar Docker" in text


def test_memory_report_orders_by_usage_and_shows_limit():
    samples = host_samples()
    samples[reports.Q_CONTAINER_MEM] = [({"name": "postgres"}, 2 * GIB), ({"name": "api"}, 512 * 1024**2)]
    samples[reports.Q_CONTAINER_MEM_LIMIT] = [({"name": "api"}, 1536 * 1024**2), ({"name": "postgres"}, 2**63)]
    text = reports.memory_report(FakeSources(samples=samples))
    assert text.index("postgres") < text.index("• api")
    assert "postgres: 2.00 GiB (sin límite)" in text
    assert "api: 512 MiB de 1.50 GiB (33 %)" in text


def test_network_report_lists_interfaces_and_top_containers():
    samples = host_samples()
    samples[reports.Q_CONTAINER_NET] = [({"name": "nginx"}, 8_000_000.0), ({"name": "api"}, 1_000_000.0)]
    text = reports.network_report(FakeSources(samples=samples))
    assert "eth0: ↓ 12.50 Mbit/s · ↑ 3.00 Mbit/s" in text
    assert text.index("nginx") < text.index("• api")


def test_containers_report_puts_problems_first_and_shows_uptime():
    now = datetime(2026, 10, 4, 5, 30, tzinfo=timezone.utc)
    states = [
        container(name="ok", service="redis"),
        container(name="bad", service="api", health="unhealthy"),
        container(name="gone", service="minio", status="exited", health="none", restart_count=7),
    ]
    lines = reports.containers_report(states, True, now).split("\n")
    assert lines[1].startswith("🔴") and "api" in lines[1]
    assert lines[2].startswith("⛔") and "7 reinicios" in lines[2]
    assert "up 5h 30m" in lines[3]


def test_names_are_html_escaped():
    text = reports.containers_report([container(service="<script>", resource="")], True)
    assert "&lt;script&gt;" in text and "<script>" not in text


def test_alerts_report_handles_empty_and_severity():
    assert reports.alerts_report([]) == "✅ Sin alertas activas."
    text = reports.alerts_report([
        {"labels": {"alertname": "HostDiskHigh", "severity": "warning"}, "annotations": {"summary": "Disco / al 85 %"}},
    ])
    assert "🟠 Disco / al 85 %" in text


def test_status_report_includes_cpu_usage_and_cores():
    samples = host_samples()
    samples[reports.Q_CPU_USED] = [({}, 0.234)]
    samples[reports.Q_CPU_CORES] = [({}, 8.0)]
    assert "CPU: 23 % en uso de 8 núcleos" in reports.status_report(FakeSources(samples=samples))


def test_cpu_report_shows_each_core_in_order_load_and_top_containers():
    samples = host_samples()
    samples[reports.Q_CPU_USED] = [({}, 0.5)]
    samples[reports.Q_CPU_CORES] = [({}, 2.0)]
    samples[reports.Q_CPU_PER_CORE] = [({"cpu": "10"}, 0.2), ({"cpu": "1"}, 0.9)]
    samples[reports.Q_LOAD_1] = [({}, 1.0)]
    samples[reports.Q_LOAD_5] = [({}, 0.8)]
    samples[reports.Q_LOAD_15] = [({}, 0.5)]
    samples[reports.Q_CONTAINER_CPU] = [({"name": "api"}, 0.35), ({"name": "postgres"}, 1.2)]
    text = reports.cpu_report(FakeSources(samples=samples))
    assert "Carga 1 / 5 / 15 min: 1.00 / 0.80 / 0.50 (sobre 2 núcleos)" in text
    assert "<code>cpu 1 ▰▰▰▰▰▰▰▰▰▱  90 %</code>" in text
    assert text.index("cpu 1") < text.index("cpu10")
    assert text.index("postgres: 120 %") < text.index("api: 35 %")


def test_cpu_report_without_data_does_not_crash():
    assert "CPU: sin datos" in reports.cpu_report(FakeSources())
