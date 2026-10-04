from bot.commands import parse_command, reply_for
from bot.telegram import TelegramClient, split_message
from tests.fakes import FakeSources, host_samples

CHAT = -100123


def message(text, chat_id=CHAT):
    return {"chat": {"id": chat_id}, "text": text}


def test_parse_command_strips_bot_mention_and_arguments():
    assert parse_command("/Estado@AloVidaMonitorBot ya") == "/estado"
    assert parse_command("hola") is None


def test_ignores_commands_from_other_chats():
    assert reply_for(message("/estado", chat_id=999), CHAT, FakeSources()) is None


def test_answers_known_commands_in_the_authorized_chat():
    reply = reply_for(message("/estado"), CHAT, FakeSources(samples=host_samples()))
    assert reply.startswith("<b>📊 Estado del VPS</b>")


def test_unknown_command_points_to_help():
    assert "/ayuda" in reply_for(message("/reiniciar api"), CHAT, FakeSources())


def test_source_failure_becomes_a_readable_reply():
    class Broken(FakeSources):
        def query(self, expr):
            raise ConnectionError("prometheus caído")

    reply = reply_for(message("/ram"), CHAT, Broken())
    assert reply.startswith("⚠️ No pude armar /ram: ConnectionError")


def test_split_message_respects_the_limit_on_line_boundaries():
    text = "\n".join(f"línea {i:03d}" for i in range(100))
    chunks = split_message(text, limit=100)
    assert all(len(chunk) <= 100 for chunk in chunks)
    assert "\n".join(chunks) == text


def test_client_sends_html_to_the_chat_and_long_polls_with_offset():
    sent = []

    def poster(url, payload, timeout):
        sent.append((url, payload, timeout))
        return {"ok": True, "result": [{"update_id": 7}]}

    client = TelegramClient("TOKEN", poster)
    assert client.get_updates(5) == [{"update_id": 7}]
    client.send_message(CHAT, "<b>hola</b>")
    assert sent[0][0].endswith("/botTOKEN/getUpdates") and sent[0][1]["offset"] == 5
    assert sent[1][1] == {"chat_id": CHAT, "text": "<b>hola</b>", "parse_mode": "HTML", "disable_web_page_preview": True}


def test_english_and_spanish_commands_give_the_same_report():
    sources = FakeSources(samples=host_samples())
    assert reply_for(message("/status"), CHAT, sources) == reply_for(message("/estado"), CHAT, sources)


def test_menu_only_lists_commands_that_exist():
    from bot.commands import COMMANDS, MENU

    assert all(f"/{name}" in COMMANDS for name, _ in MENU)


def test_client_registers_the_command_menu():
    sent = []
    TelegramClient("T", lambda url, payload, timeout: sent.append((url, payload)) or {"ok": True}).set_commands(
        [("status", "Resumen")]
    )
    assert sent[0][0].endswith("/setMyCommands")
    assert sent[0][1] == {"commands": [{"command": "status", "description": "Resumen"}]}
