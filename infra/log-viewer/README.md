# Visor de docker logs (Dozzle)

`docker logs` de todos los contenedores del VPS, en vivo, desde el navegador:

**https://logs.62.169.18.132.sslip.io** — usuario `admin`.

- **Sólo lectura.** Dozzle habla con un `docker-socket-proxy` que sólo deja pasar GET
  (`POST=0`): no puede parar, reiniciar ni abrir una consola en ningún contenedor.
  Acciones y shell de Dozzle están apagados.
- **Con login.** Los logs llevan tokens y datos de pacientes: la contraseña es lo único
  que los protege. Nunca por chat. La sesión dura 12 h.
- **Fuerza bruta frenada en Traefik:** el login (`/api/token`) admite 5 intentos por
  minuto por IP; el resto del sitio no tiene límite para no cortar el stream.
- **Vigilado:** el monitoreo (`infra/monitoring`) sondea `/healthcheck` cada minuto y
  avisa por Telegram si cae o si el certificado está por vencer; `autoheal` lo reinicia
  si queda `unhealthy`.

Vive **fuera de Coolify**, en `/opt/alovida-logs` (proyecto compose `alovida-logs`), para
que los despliegues de la app no lo bajen.

## Dónde está la contraseña

- VPS: `/opt/alovida-logs/.credentials` (600, root).
- Mac del propietario: `~/.config/alovida/dozzle.env`.

## Instalar o actualizar en el VPS

Desde la raíz de este repo:

```bash
ssh -i ~/.ssh/alovida_contabo root@62.169.18.132 'mkdir -p /opt/alovida-logs/data && chmod 700 /opt/alovida-logs'
scp -i ~/.ssh/alovida_contabo infra/log-viewer/docker-compose.yml root@62.169.18.132:/opt/alovida-logs/
scp -i ~/.ssh/alovida_contabo infra/log-viewer/traefik/alovida-logs.yaml root@62.169.18.132:/data/coolify/proxy/dynamic/
ssh -i ~/.ssh/alovida_contabo root@62.169.18.132 'cd /opt/alovida-logs && docker compose up -d'
```

El router depende del middleware `alovida-redirect-https@file`, declarado en
`/data/coolify/proxy/dynamic/alovida.yaml` del VPS.

## Cambiar la contraseña

```bash
cd /opt/alovida-logs
umask 077
docker run --rm amir20/dozzle:v11.1.0 generate admin -p '<nueva>' -n 'Administrador AloVida' > data/users.yml
docker compose up -d --force-recreate dozzle
```

Y actualizar `.credentials` y el `dozzle.env` de la Mac.

## Quitarlo

```bash
rm /data/coolify/proxy/dynamic/alovida-logs.yaml
cd /opt/alovida-logs && docker compose down
```

Y sacar su sonda de `infra/monitoring/prometheus/prometheus.yml`.
