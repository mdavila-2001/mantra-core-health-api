#!/usr/bin/env bash
# Doble candado para el SSH del VPS: SÓLO llaves (chau contraseñas) + fail2ban.
#
#   bash infra/server/harden-ssh.sh                 # usa ~/.ssh/alovida_contabo
#   SSH_KEY=~/.ssh/otra bash infra/server/harden-ssh.sh
#
# Lo corre una PERSONA desde su máquina. Está pensado para que no te deje
# afuera del servidor:
#   1. Antes de tocar nada comprueba que TU llave entra.
#   2. Te muestra qué llaves tienen acceso y te pide confirmar que están todas
#      las personas que lo necesitan (si alguien entra con contraseña, se queda
#      afuera: instalale su llave ANTES).
#   3. Escribe la configuración en un archivo aparte, la valida con `sshd -t` y
#      recarga (no reinicia): las sesiones abiertas no se cortan.
#   4. Antes de recargar, el SERVIDOR programa su propia vuelta atrás en 3 min
#      (systemd-run). Sólo se cancela si una conexión NUEVA con llave entra; si
#      no, a los 3 minutos el servidor se deshace solo y volvés a entrar.
#   5. Instala fail2ban: 5 intentos fallidos en 10 min = IP bloqueada 1 h. Tu
#      IP pública actual queda en la lista blanca para no bloquearte a vos.
#
# Si igual quedaras afuera: consola VNC del panel de Contabo y
#   rm /etc/ssh/sshd_config.d/00-alovida-hardening.conf && systemctl reload ssh
set -euo pipefail

HOST="${HOST:-173.249.39.237}"
SSH_USER="${SSH_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/alovida_contabo}"
DROP_IN=/etc/ssh/sshd_config.d/00-alovida-hardening.conf

ssh_key() { ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new "$SSH_USER@$HOST" "$@"; }

# --- 1. Tu llave entra ----------------------------------------------------------
echo "▶ Comprobando que tu llave entra a $SSH_USER@${HOST}…"
ssh_key true || { echo "✖ Tu llave NO entra. No toco nada." >&2; exit 1; }
echo "✔ Tu llave entra."

# --- 2. Quién tiene llave ---------------------------------------------------------
echo
echo "Llaves con acceso a $SSH_USER (tipo · comentario):"
ssh_key "awk 'NF {print \"   \" \$1 \" · \" (NF>2 ? \$NF : \"(sin comentario)\")}' ~/.ssh/authorized_keys"
echo
echo "Últimos accesos CON CONTRASEÑA (14 días) — estas personas se quedarían afuera:"
ssh_key "journalctl -u ssh -u sshd --since '14 days ago' 2>/dev/null | grep -oE 'Accepted password for [^ ]+ from [0-9.]+' | sort | uniq -c || true" \
  | sed 's/^/   /' | grep . || echo "   (ninguno)"
echo
read -r -p "¿Están las llaves de TODAS las personas que necesitan entrar? Escribí «si» para seguir: " ok
[ "$ok" = "si" ] || { echo "Cancelado. Instalá las llaves que falten y volvé a correrlo."; exit 1; }

# --- 3. Configuración: sólo llaves -----------------------------------------------
echo "▶ Aplicando sólo llaves…"
ssh_key "bash -s" <<REMOTE
set -euo pipefail
cp -a /etc/ssh/sshd_config /etc/ssh/sshd_config.bak-\$(date +%Y%m%d%H%M%S)
# 00- para ganarle a 50-cloud-init.conf: en sshd manda el PRIMER valor leído.
cat > $DROP_IN <<'CONF'
# Doble candado AloVida: sólo llaves, nada de contraseñas.
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
CONF
sshd -t
# Red de seguridad: si nadie la cancela, en 3 min borra el cambio y recarga.
systemctl stop alovida-ssh-rollback.timer 2>/dev/null || true
systemd-run --quiet --unit=alovida-ssh-rollback --on-active=180 \
  /bin/sh -c "rm -f $DROP_IN; systemctl reload ssh 2>/dev/null || systemctl reload sshd"
systemctl reload ssh 2>/dev/null || systemctl reload sshd
sshd -T | grep -E '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin) '
REMOTE

# --- 4. Conexión nueva con llave, y la contraseña rechazada -----------------------
echo "▶ Probando una conexión NUEVA con tu llave…"
if ! ssh_key "systemctl stop alovida-ssh-rollback.timer"; then
  echo "✖ La conexión nueva falló. No hagas nada: en 3 minutos el servidor" >&2
  echo "  deshace el cambio solo y vas a poder volver a entrar." >&2
  exit 1
fi
echo "✔ Entra con llave (vuelta atrás automática cancelada)."
if ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password,keyboard-interactive \
       -o BatchMode=yes -o ConnectTimeout=15 "$SSH_USER@$HOST" true 2>&1 | grep -q "Permission denied (publickey)"; then
  echo "✔ La contraseña ya NO se acepta: el servidor sólo ofrece «publickey»."
else
  echo "⚠ No pude confirmar que la contraseña quedó apagada; revisá «sshd -T» en el servidor." >&2
fi

# --- 5. fail2ban -------------------------------------------------------------------
MY_IP="$(curl -fsS -m 10 https://api.ipify.org || true)"
echo "▶ Instalando fail2ban (tu IP ${MY_IP:-desconocida} queda en la lista blanca)…"
ssh_key "bash -s" <<REMOTE
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
command -v fail2ban-client >/dev/null || { apt-get update -qq && apt-get install -y -qq fail2ban >/dev/null; }
cat > /etc/fail2ban/jail.d/alovida-sshd.local <<'JAIL'
[sshd]
enabled  = true
backend  = systemd
maxretry = 5
findtime = 10m
bantime  = 1h
ignoreip = 127.0.0.1/8 ::1 ${MY_IP}
JAIL
systemctl enable --now fail2ban >/dev/null 2>&1
systemctl restart fail2ban
sleep 2
fail2ban-client status sshd | sed -n '1,4p'
REMOTE

echo
echo "Listo: SSH sólo con llaves + fail2ban. Las sesiones que tenías abiertas siguen vivas."
