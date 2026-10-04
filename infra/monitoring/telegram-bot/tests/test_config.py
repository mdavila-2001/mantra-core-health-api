import pytest

from bot.config import ConfigError, load_config

BASE = {"TELEGRAM_BOT_TOKEN": "123:abc", "TELEGRAM_CHAT_ID": "-1001234"}


def test_loads_defaults_for_optional_values():
    config = load_config(dict(BASE))
    assert config.telegram_chat_id == -1001234
    assert config.prometheus_url == "http://prometheus:9090"
    assert config.daily_summary_hour == 8
    assert config.summary_timezone == "America/La_Paz"


@pytest.mark.parametrize("missing", ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"])
def test_fails_when_required_variable_is_missing(missing):
    env = dict(BASE)
    env.pop(missing)
    with pytest.raises(ConfigError, match=missing):
        load_config(env)


def test_rejects_a_non_numeric_chat_id():
    with pytest.raises(ConfigError, match="número"):
        load_config({**BASE, "TELEGRAM_CHAT_ID": "@mi_grupo"})


def test_rejects_an_hour_outside_the_day():
    with pytest.raises(ConfigError, match="DAILY_SUMMARY_HOUR"):
        load_config({**BASE, "DAILY_SUMMARY_HOUR": "24"})


def test_strips_trailing_slash_from_urls():
    config = load_config({**BASE, "PROMETHEUS_URL": "http://p:9090/"})
    assert config.prometheus_url == "http://p:9090"
