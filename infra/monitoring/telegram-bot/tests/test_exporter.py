from bot.exporter import DockerStateCache, render_metrics
from tests.fakes import container


def test_renders_one_sample_per_container_and_metric():
    text = render_metrics([container(health="unhealthy", restart_count=4)], docker_up=True)
    assert "alovida_docker_up 1" in text
    labels = 'name="api-abc-1",service="api",resource="alovida-backend-central",display="alovida-backend-central/api"'
    assert f"alovida_container_unhealthy{{{labels}}} 1" in text
    assert f"alovida_container_restart_count{{{labels}}} 4" in text
    assert f"alovida_container_expected_running{{{labels}}} 1" in text


def test_escapes_quotes_in_label_values():
    text = render_metrics([container(name='raro"nombre')], docker_up=True)
    assert 'name="raro\\"nombre"' in text


def test_docker_failure_is_exposed_as_down_not_raised():
    def broken():
        raise OSError("sin socket")

    states, ok = DockerStateCache(broken).get()
    assert states == [] and ok is False
    assert "alovida_docker_up 0" in render_metrics(states, ok)


def test_cache_reuses_the_last_read_within_its_ttl():
    calls = []
    now = [0.0]

    def fetch():
        calls.append(1)
        return [container()]

    cache = DockerStateCache(fetch, clock=lambda: now[0])
    cache.get()
    now[0] = 10
    cache.get()
    assert len(calls) == 1
    now[0] = 16
    cache.get()
    assert len(calls) == 2


def test_exports_start_time_so_api_restarts_are_counted():
    from datetime import datetime, timezone

    text = render_metrics([container(started_at=datetime(2026, 10, 4, 4, 53, 43, tzinfo=timezone.utc))], True)
    assert 'alovida_container_started_at_seconds{name="api-abc-1"' in text
    assert text.rstrip().endswith(" 1791089623")
    assert "alovida_container_started_at_seconds" in render_metrics([container(started_at=None)], True)
