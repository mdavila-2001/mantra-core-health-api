from datetime import datetime, timezone

from bot.docker_state import fetch_container_states, parse_inspect


def inspect(**state_overrides):
    state = {"Status": "running", "StartedAt": "2026-10-04T03:45:41.123456789Z", "OOMKilled": False}
    state.update(state_overrides)
    return {
        "Name": "/api-33sx-0412",
        "RestartCount": 2,
        "State": state,
        "Config": {"Labels": {"com.docker.compose.service": "api", "coolify.resourceName": "alovida-backend-central"}},
        "HostConfig": {"RestartPolicy": {"Name": "always"}},
    }


def test_parses_name_labels_and_restart_data():
    state = parse_inspect(inspect(Health={"Status": "unhealthy"}))
    assert state.name == "api-33sx-0412"
    assert state.display == "alovida-backend-central/api"
    assert state.unhealthy and state.running and state.expected_running
    assert state.restart_count == 2


def test_parses_docker_nanosecond_timestamps():
    state = parse_inspect(inspect())
    assert state.started_at == datetime(2026, 10, 4, 3, 45, 41, 123456, tzinfo=timezone.utc)


def test_a_container_that_never_started_has_no_start_time():
    assert parse_inspect(inspect(StartedAt="0001-01-01T00:00:00Z")).started_at is None


def test_without_healthcheck_health_is_none():
    assert parse_inspect(inspect()).health == "none"


def test_one_shot_containers_are_not_expected_running():
    raw = inspect(Status="exited")
    raw["HostConfig"]["RestartPolicy"]["Name"] = "no"
    assert parse_inspect(raw).expected_running is False


def test_display_falls_back_to_compose_project_then_name():
    raw = inspect()
    raw["Config"]["Labels"] = {"com.docker.compose.service": "redis", "com.docker.compose.project": "abc123"}
    assert parse_inspect(raw).display == "abc123/redis"
    raw["Config"]["Labels"] = {}
    assert parse_inspect(raw).display == "api-33sx-0412"


def test_fetch_inspects_every_listed_container():
    calls = []

    def getter(path):
        calls.append(path)
        return [{"Id": "a"}, {"Id": "b"}] if path.startswith("/containers/json") else inspect()

    states = fetch_container_states("http://proxy", getter)
    assert len(states) == 2
    assert calls == ["/containers/json?all=1", "/containers/a/json", "/containers/b/json"]
