import os

from bot.watchers import (
    DeployAggregator,
    LogTail,
    SecurityParser,
    diff_ports,
    new_resource_alerts,
    public_ports,
)

ACCEPT_KEY = "2026-10-08T17:38:37 vmi sshd[3876460]: Accepted publickey for root from 189.28.77.180 port 5219 ssh2: ED25519"
ACCEPT_PWD = "2026-10-08T17:39:00 vmi sshd[1]: Accepted password for pablo from 45.1.2.3 port 1 ssh2"


def test_ssh_login_is_reported_once_per_hour_per_user_and_ip():
    parser = SecurityParser(known_ips=frozenset({"189.28.77.180"}))
    first = parser.auth_line(ACCEPT_KEY, now=1000)
    assert first == "🔐 Login SSH: root desde 189.28.77.180 (IP conocida del equipo)"
    assert parser.auth_line(ACCEPT_KEY, now=1000 + 600) is None
    assert parser.auth_line(ACCEPT_KEY, now=1000 + 3700) is not None


def test_password_login_from_unknown_ip_is_flagged():
    message = SecurityParser().auth_line(ACCEPT_PWD, now=0)
    assert "con contraseña" in message and "IP desconocida" in message and "pablo" in message


def test_unrelated_auth_lines_are_ignored():
    assert SecurityParser().auth_line("sshd[1]: pam_unix(sshd:session): session opened", 0) is None


def test_fail2ban_ban_line():
    line = "2026-10-05 22:28:45,173 fail2ban.actions [15633]: NOTICE  [sshd] Ban 109.160.32.169"
    assert SecurityParser.fail2ban_line(line) == "🚫 fail2ban bloqueó 109.160.32.169 (regla sshd) por intentos fallidos"
    assert SecurityParser.fail2ban_line(line.replace(" Ban ", " Unban ")) is None


def test_logtail_starts_at_end_reads_new_lines_and_survives_rotation(tmp_path):
    path = tmp_path / "auth.log"
    path.write_text("vieja\n")
    tail = LogTail(str(path))
    assert tail.read_new_lines() == []
    with open(path, "a") as handle:
        handle.write("nueva 1\nnueva 2\n")
    assert tail.read_new_lines() == ["nueva 1", "nueva 2"]
    os.rename(path, tmp_path / "auth.log.1")
    path.write_text("tras rotar\n")
    assert tail.read_new_lines() == ["tras rotar"]


def test_public_ports_only_counts_all_interfaces_bindings():
    containers = [
        {"Names": ["/coolify-proxy"], "Ports": [{"IP": "0.0.0.0", "PublicPort": 443, "Type": "tcp"}]},
        {"Names": ["/grafana"], "Ports": [{"IP": "127.0.0.1", "PublicPort": 3000, "Type": "tcp"}]},
        {"Names": ["/pg"], "Ports": [{"PrivatePort": 5432, "Type": "tcp"}]},
    ]
    assert public_ports(containers) == {(443, "tcp"): "coolify-proxy"}


def test_diff_ports_reports_opened_and_closed():
    before = {(443, "tcp"): "proxy"}
    after = {(443, "tcp"): "proxy", (5432, "tcp"): "postgres-x"}
    assert diff_ports(before, after) == ["🔓 Puerto NUEVO abierto a internet: 5432/tcp por postgres-x"]
    assert diff_ports(after, before) == ["🔒 Puerto cerrado: 5432/tcp (era de postgres-x)"]


def _event(action, name, **attrs):
    return {"Action": action, "Actor": {"Attributes": {"name": name, **attrs}}}


def test_starts_of_one_deploy_are_grouped_into_one_message():
    agg = DeployAggregator(window=90)
    for service in ("api", "worker-messaging"):
        assert agg.event(_event("start", f"{service}-x", **{"com.docker.compose.service": service, "coolify.resourceName": "alovida-backend-test"}), now=0) is None
    assert agg.flush(now=30) == []
    assert agg.flush(now=95) == ["🚀 Despliegue en <b>alovida-backend-test</b>: arrancaron 2 servicio(s) — api, worker-messaging"]


def test_die_with_error_is_reported_but_requested_stops_are_not():
    agg = DeployAggregator()
    assert agg.event(_event("die", "api-1", exitCode="1"), 0) == "💥 api-1 terminó con error (código 1)"
    assert agg.event(_event("die", "init", exitCode="0"), 0) is None
    agg.event(_event("kill", "web-1"), 0)
    assert agg.event(_event("die", "web-1", exitCode="2"), 0) is None
    assert agg.event(_event("oom", "medgemma"), 0) == "🧠💥 medgemma murió por falta de memoria (OOM)"


def test_resource_alerts_are_announced_once_until_they_resolve():
    seen = set()
    alerts = [{"fingerprint": "a", "labels": {"alertname": "HostMemoryLow"}}, {"fingerprint": "b", "labels": {"alertname": "EndpointDown"}}]
    assert new_resource_alerts(alerts, seen) == [("a", "ram")]
    assert new_resource_alerts(alerts, seen) == []
    assert new_resource_alerts([], seen) == []
    assert new_resource_alerts(alerts, seen) == [("a", "ram")]
