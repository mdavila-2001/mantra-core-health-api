from bot import extra_reports, history
from bot.commands import COMMANDS, MENU, reply_for
from tests.fakes import GIB, FakeSources

PNG = b"\x89PNG\r\n\x1a\n"


def test_every_menu_entry_and_new_alias_exists():
    for name, _ in MENU:
        assert f"/{name}" in COMMANDS
    for alias in ("/disco", "/disk", "/top", "/sitios", "/sites", "/uptime", "/graficas", "/charts"):
        assert alias in COMMANDS


def test_resource_charts_returns_five_pngs_ram_cpu_disk_network_containers():
    sources = FakeSources(
        samples={
            "node_memory_MemTotal_bytes": [({}, 47 * GIB)],
            'count(node_cpu_seconds_total{mode="idle"})': [({}, 12.0)],
            history.Q_DISK_SIZE: [({}, 387 * GIB)],
            history.Q_TOP_CONTAINER_RAM: [({"name": "medgemma-27b-msocpfzfn6irx34pttnyf5ed-20261007T223050"}, 18.0)],
        },
        ranges={history.Q_RAM_GIB: [(0, 20.0), (300, 26.0)], history.Q_DISK_USED_GIB: [(0, 50.0)]},
    )
    photos = history.resource_charts(sources)
    assert len(photos) == 5 and all(p.png.startswith(PNG) for p in photos)
    assert photos[0].caption.startswith("🧠 RAM · pico 26.0 GiB")
    assert "Disco" in photos[2].caption and "Red" in photos[3].caption


def test_short_name_drops_coolify_uuid_and_timestamp():
    assert history.short_name("medgemma-27b-msocpfzfn6irx34pttnyf5ed-20261007T223050") == "medgemma-27b"
    assert history.short_name("api") == "api"


def test_disk_report_shows_usage_growth_and_days_left():
    sources = FakeSources(samples={
        extra_reports.Q_DISKS: [({"mountpoint": "/"}, 387 * GIB)],
        extra_reports.Q_DISKS_AVAIL: [({"mountpoint": "/"}, 336 * GIB)],
        extra_reports.Q_DISK_GROWTH_24H: [({}, 2 * GIB)],
    })
    text = extra_reports.disk_report(sources)
    assert "/: 51 / 387 GiB (13 %)" in text and "creció 2.0 GiB" in text and "~168 días" in text


def test_sites_report_lists_status_latency_uptime_and_cert():
    site = "https://test.62.169.18.132.sslip.io/"
    sources = FakeSources(samples={
        extra_reports.Q_PROBE_UP: [({"instance": site}, 1.0)],
        extra_reports.Q_PROBE_SECONDS: [({"instance": site}, 0.231)],
        extra_reports.Q_PROBE_STATUS: [({"instance": site}, 200.0)],
        extra_reports.Q_PROBE_CERT_DAYS: [({"instance": site}, 74.4)],
        extra_reports.Q_PROBE_UPTIME_24H: [({"instance": site}, 0.995)],
    })
    assert extra_reports.sites_report(sources) == (
        "<b>🌍 Sitios públicos</b>\n🟢 " + site + " · HTTP 200 · 231 ms · 24 h: 100 % arriba · cert 74 días"
    )


def test_top_report_and_uptime_answer_without_data():
    assert "Sin datos" in extra_reports.top_report(FakeSources())
    assert extra_reports.uptime_report(FakeSources()).startswith("<b>⏱ Servidor</b>")


def test_graficas_command_now_sends_five_images():
    reply = reply_for({"chat": {"id": 1}, "text": "/graficas"}, 1, FakeSources())
    assert isinstance(reply, list) and len(reply) == 5
