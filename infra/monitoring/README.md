# Monitoreo del VPS (Prometheus + Grafana + Telegram)

Vigila el VPS de Contabo (`173.249.39.237`, Coolify) y avisa por Telegram de lo que se
rompe:

- **Host:** RAM, swap, disco, carga, tráfico de red y OOM del kernel.
- **Contenedores:** memoria, CPU y red de cada uno; `unhealthy`, detenidos, bucles de
  reinicio y OOM.
- **Sitios públicos:** que respondan y que el certificado no esté por vencer.
- **El propio monitoreo:** un latido a Healthchecks.io. Si el VPS entero se cae, el aviso
  llega desde afuera.

Y **se cura solo** cuando puede: `autoheal` reinicia lo que quede `unhealthy` si tiene la
etiqueta `autoheal=true`. Docker no lo hace por su cuenta, porque `restart: always` sólo
actúa cuando el proceso termina.

```text
node-exporter ─┐
cAdvisor ──────┤
blackbox ──────┼──► Prometheus ──► Alertmanager ──► Telegram (grupo del equipo)
telegram-bot ──┘        │               └──► Healthchecks.io (latido) ──► Telegram
                        ▼
                     Grafana
autoheal ──► docker-restart-proxy (red interna, sólo reinicia)
telegram-bot ──► docker-read-proxy (red interna, sólo lee)
```

Es un **recurso aparte en Coolify**, no un servicio dentro del compose de la app: cuando la
app se redespliega, el monitoreo sigue vivo y puede avisar del corte.

## 1. Crear el bot con @BotFather

1. En Telegram, abrí **@BotFather** y mandá `/newbot`.
2. Nombre visible: `AloVida Monitor`. Usuario: uno libre que termine en `bot` (p. ej.
   `alovida_monitor_bot`).
3. BotFather te devuelve el **token** (`123456789:AA…`). **No lo pegues en ningún chat ni en
   el repo**: va sólo en las variables de Coolify (paso 3). Si se filtra, en BotFather:
   `/revoke`.
4. Opcional: `/setcommands` y pegá esto, para que Telegram autocomplete:

   ```text
   estado - Resumen de RAM, disco, red, contenedores y alertas
   ram - RAM del host y los contenedores que más usan
   red - Tráfico por interfaz y por contenedor
   contenedores - Estado y salud de cada contenedor
   alertas - Alertas activas
   ayuda - Lista de comandos
   ```

## 2. Grupo del equipo y su `chat_id`

1. Creá el grupo (por ejemplo «AloVida · Servidor»), sumá al equipo y **agregá al bot**.
2. Mandá cualquier mensaje en el grupo, por ejemplo `/ayuda@alovida_monitor_bot`.
3. Abrí en el navegador `https://api.telegram.org/bot<TOKEN>/getUpdates` y buscá
   `"chat":{"id":-100…`. Ese número negativo es el **`TELEGRAM_CHAT_ID`**.

El bot **sólo responde en ese chat**: los comandos que lleguen de cualquier otro lado se
ignoran y quedan en el log.

## 3. Desplegar en Coolify

**New Resource › Docker Compose** sobre el repo de la API:

| Campo | Valor |
|---|---|
| Rama | `test` |
| Base Directory | `/infra/monitoring` |
| Docker Compose Location | `/docker-compose.yml` |
| Nombre | `alovida-monitoring` |

Variables de entorno, en la pestaña Environment Variables y **nunca en el repo**:

| Variable | Qué es |
|---|---|
| `TELEGRAM_BOT_TOKEN` | El token de BotFather |
| `TELEGRAM_CHAT_ID` | El id del grupo (negativo) |
| `HEALTHCHECKS_PING_URL` | La URL de ping de Healthchecks.io (paso 4) |
| `GRAFANA_ADMIN_PASSWORD` | La clave del usuario `admin` de Grafana |
| `GRAFANA_ROOT_URL` | La URL pública de Grafana, p. ej. `https://grafana.173.249.39.237.sslip.io` |

Dominio: asignáselo **sólo al servicio `grafana`** (puerto 3000). Prometheus y Alertmanager
no se exponen.

Si falta una de las variables obligatorias, el despliegue falla con `falta <VARIABLE>`. Es a
propósito: un monitoreo sin destino parece que vigila y no avisa a nadie.

## 4. Latido externo con Healthchecks.io

1. Creá una cuenta en <https://healthchecks.io> (el plan gratuito alcanza).
2. **Add Check**: nombre «AloVida VPS», **Period 5 minutes**, **Grace 5 minutes**.
3. Copiá su **Ping URL** (`https://hc-ping.com/<uuid>`) a `HEALTHCHECKS_PING_URL`.
4. **Integrations › Telegram**: conectá el mismo grupo.

Alertmanager le manda la alerta `Watchdog`, que está siempre activa, cada 5 minutos. Si deja
de llegar, Healthchecks.io avisa. Eso cubre que se caiga el VPS, que muera Prometheus o que
muera Alertmanager.

## 5. Avisos nativos de Coolify (sin código)

En el panel de Coolify:

- **Settings › Notifications › Telegram**: el mismo token y el mismo `chat_id`. Activá
  *Deployment failed*, *Container status changed*, *Server unreachable* y *Server disk
  usage*.
- **Servers › localhost**: activá las métricas (Sentinel).

Así los despliegues fallidos, que hoy pasan sin que nadie se entere, también llegan al grupo.

## Comandos del bot

| Comando | Qué devuelve |
|---|---|
| `/estado` | RAM y swap, disco, carga, red, contenedores sanos o caídos, y alertas |
| `/ram` | RAM del host y los 10 contenedores que más usan, contra su límite |
| `/red` | Tráfico por interfaz y los 10 contenedores que más mueven (promedio de 5 min) |
| `/contenedores` | Cada contenedor con su estado, health, uptime y reinicios; los problemas primero |
| `/alertas` | Las alertas activas en Alertmanager |
| `/ayuda` | La lista de comandos |

Además manda un **resumen diario a las 08:00** (hora de La Paz) y avisa cuando arranca.

El bot es **de solo lectura a propósito**: no reinicia ni cambia nada. Si su token se
filtra, quien lo tenga puede leer el estado, pero no tocar el servidor.

## Alertas

Las reglas están en `prometheus/rules/` y sus pruebas en `prometheus/tests/`.

| Alerta | Cuándo |
|---|---|
| `HostMemoryLow` / `HostMemoryCritical` | Queda < 15 % de RAM durante 5 min / < 8 % durante 2 min |
| `HostSwapHigh` | Swap > 50 % durante 10 min |
| `HostOomKill` | El kernel mató un proceso por falta de memoria |
| `HostDiskHigh` / `HostDiskCritical` | Disco > 80 % / > 90 % |
| `HostDiskWillFillIn24h` | Al ritmo de las últimas 6 h, se llena en un día |
| `HostHighLoad` | Carga a 5 min > 1,5 por núcleo durante 10 min |
| `HostNetworkReceiveHigh` / `HostNetworkTransmitHigh` | > 150 Mbit/s durante 10 min (**umbral provisional**) |
| `HostNetworkErrors` | La interfaz descarta o corrompe paquetes |
| `ContainerUnhealthy` | Su healthcheck falla hace > 3 min |
| `ContainerDown` | Tiene política de reinicio y está detenido hace > 3 min |
| `ContainerRestartLoop` | Arrancó más de 3 veces en 15 min |
| `ContainerOomKilled` | Superó su límite de memoria |
| `ContainerMemoryNearLimit` | Usa > 90 % de su límite durante 5 min |
| `EndpointDown` / `EndpointSlow` | Un sitio público no responde 2 min / tarda > 5 s |
| `TlsCertExpiringSoon` | El certificado vence en < 14 días |
| `MonitoringTargetDown` / `DockerStateUnavailable` | El propio monitoreo perdió una fuente |
| `Watchdog` | Siempre activa: es el latido a Healthchecks.io |

`ContainerRestartLoop` cuenta los **cambios de `StartedAt`** y no `RestartCount`: los
reinicios que hace autoheal por la API dejan `RestartCount` en 0. Está medido.

### Silenciar una alerta (por ejemplo, durante un mantenimiento)

Desde la terminal del contenedor `alertmanager` en Coolify:

```bash
amtool --alertmanager.url=http://127.0.0.1:9093 silence add alertname=EndpointDown --duration=30m --comment="mantenimiento"
amtool --alertmanager.url=http://127.0.0.1:9093 silence query
```

## Cómo validar cambios antes de subirlos

```bash
# reglas y configuración de Prometheus
docker run --rm --entrypoint /bin/promtool -v "$PWD/prometheus:/cfg:ro" -w /cfg/tests prom/prometheus:v3.5.0 test rules rules_test.yml
# bot
cd telegram-bot && python -m pytest -q tests
```

## Limitaciones conocidas

- **Un solo VPS no garantiza el 100 %.** Si cae el proveedor, cae todo; lo único que sigue
  funcionando es el aviso de Healthchecks.io. Para alta disponibilidad real hace falta un
  segundo nodo con la base replicada.
- **cAdvisor no funciona en Docker Desktop de Mac** (no encuentra el socket dentro de la VM).
  En un host Linux es la configuración estándar. Se verifica en el VPS.
- **node-exporter usa `rslave`** sobre `/`, que exige que `/` sea un montaje compartido:
  normal en Linux con systemd, no en Docker Desktop.
- **Umbral de red provisional** (150 Mbit/s): se fija con 7 días de línea base real.
- **autoheal sólo cura lo que lleva la etiqueta `autoheal=true`**: la API y los workers.
  Postgres, Mongo y OpenSearch no la llevan a propósito, porque reiniciarlos en medio de una
  recuperación larga puede convertir un arranque lento en un bucle. Esos se vigilan con
  alertas.
