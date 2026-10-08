from bot import reports
from bot.charts import ChartSpec, render_line_chart
from bot.commands import reply_for
from bot.telegram import TelegramClient, encode_multipart
from tests.fakes import GIB, FakeSources

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
DAY = [(1_791_100_000 + i * 300, 10 + (i % 12)) for i in range(288)]


def test_renders_a_png_with_and_without_data():
    spec = ChartSpec("RAM usada · últimas 24 h", "GiB", 47, "Total 47 GiB")
    assert render_line_chart(DAY, spec, "America/La_Paz").startswith(PNG_MAGIC)
    assert render_line_chart([], spec, "America/La_Paz").startswith(PNG_MAGIC)


def test_history_charts_gives_ram_and_cores_with_peak_and_average():
    sources = FakeSources(
        samples={reports.Q_MEM_TOTAL: [({}, 47 * GIB)], reports.Q_CPU_CORES: [({}, 12.0)]},
        ranges={
            reports.Q_RAM_USED_GIB_RANGE: [(0, 10.0), (300, 30.0), (600, 20.0)],
            reports.Q_CORES_IN_USE_RANGE: [(0, 3.0), (300, 6.0)],
        },
    )
    ram, cpu = reports.history_charts(sources)
    assert ram.png.startswith(PNG_MAGIC) and cpu.png.startswith(PNG_MAGIC)
    assert ram.caption == "🧠 RAM últimas 24 h · pico 30.0 GiB, promedio 20.0 GiB (pico al 64 %)"
    assert cpu.caption == "🧮 Núcleos en uso últimas 24 h · pico 6.0 núcleos, promedio 4.5 núcleos (pico al 50 %)"


def test_history_charts_without_prometheus_data_still_answers():
    ram, cpu = reports.history_charts(FakeSources())
    assert "sin datos" in ram.caption and "sin datos" in cpu.caption


def test_graficas_command_returns_photos_in_the_authorized_chat():
    reply = reply_for({"chat": {"id": 1}, "text": "/graficas"}, 1, FakeSources())
    assert isinstance(reply, list) and len(reply) == 5


def test_multipart_carries_fields_and_the_png():
    body, content_type = encode_multipart({"chat_id": "5", "caption": "hola"}, "photo", "g.png", PNG_MAGIC + b"x")
    boundary = content_type.split("boundary=")[1]
    assert body.startswith(f"--{boundary}".encode())
    assert b'name="chat_id"\r\n\r\n5\r\n' in body
    assert b'filename="g.png"\r\nContent-Type: image/png\r\n\r\n' + PNG_MAGIC in body
    assert body.endswith(f"--{boundary}--\r\n".encode())


def test_send_photo_posts_to_send_photo_and_trims_caption():
    calls = []
    client = TelegramClient("T", uploader=lambda url, body, ctype, timeout: calls.append((url, body)) or {"ok": True})
    client.send_photo(7, PNG_MAGIC, "x" * 2000)
    url, body = calls[0]
    assert url.endswith("/botT/sendPhoto")
    assert ("x" * 1024).encode() in body and ("x" * 1025).encode() not in body
