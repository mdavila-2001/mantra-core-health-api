# Resiliencia del VPS (62.169.18.132)

Tres piezas que corren en el **host**, fuera de Coolify, instaladas el 25/10/2026.

| Pieza | Qué resuelve | Dónde vive en el VPS |
|---|---|---|
| `alovida-standby.sh` + `alovida-failover.yaml` | Despliegue sin corte de los fronts: mientras Coolify reemplaza el contenedor, o si el nuevo no arranca, Traefik sirve la versión anterior en vez de «no available server». | `/usr/local/sbin/alovida-standby` (servicio `alovida-standby`), `/etc/alovida-resilience/apps.conf`, `/data/coolify/proxy/dynamic/alovida-failover.yaml` |
| `alovida-autodeploy.sh` | Despliega el último commit de cada rama. Reemplaza a los vigilantes launchd de la Mac (dependían de la Mac encendida y de su IP pública). | `/usr/local/sbin/alovida-autodeploy` (timer `alovida-autodeploy.timer`, cada 2 min), `/etc/alovida-resilience/autodeploy.conf`, token en `/etc/alovida-resilience/coolify.token` (600, root) |
| `alovida-uptime-probe.sh` | Pide demo y test cada 2 s y anota cada respuesta distinta de 200. Mide si un despliegue se notó. | `/usr/local/sbin/alovida-uptime-probe` (servicio), `/var/log/alovida-uptime.log` |

## Cómo funciona el despliegue sin corte

```text
usuario → Traefik → failover ─┬─ principal: alovida-live-<app>    (contenedor vivo de Coolify)
                              └─ respaldo:  alovida-standby-<app> (última versión que estuvo sana)
```

- El reconciliador le pone al contenedor vivo un **alias estable** en la red
  `alovida-mockup` (Coolify cambia el nombre en cada despliegue; el alias no).
- El standby es una copia del vivo (misma imagen **por id**, mismo entorno). Se
  renueva sólo cuando el vivo lleva 120 s sano, así que durante un despliegue
  sigue siendo la versión anterior.
- Traefik chequea el vivo cada 2 s; si falla, sirve el standby. Un middleware de
  reintento cubre el segundo que tarda en notarlo.
- **API (modo `api`):** standby `alovida-api-standby-<app>` en la red de su app
  (sin alias, para llegar a postgres/redis… por los suyos) y en la red del front
  sólo como `alovida-api-standby` — nunca `api`, o recibiría tráfico normal. El
  nginx del front lo declara `backup` (front, PRs #1329/#1330): sólo lo usa si
  la API viva no responde.
- `test` y `dev` son `proxy` (nginx) + `web`: su standby es un par en una red
  privada donde el único `web` es el standby, y la API viva se conecta a esa red
  con el alias `api`.

**Red de borde = `alovida-mockup`**, no una red nueva: `docker network connect`
sobre `coolify-proxy` falla (le falta su `resolv.conf` interno), y conectarlo a
otra red exigiría recrear Traefik. Tampoco puede ser la red `coolify`: ahí hay
contenedores con alias `api` y `web` de otro stack, y el nginx de un proxy
conectado ahí podría resolver la API equivocada.

## Comprobado

- Ruta de prueba con el vivo desconectado: Traefik pasó al standby y siguió en 200.
- Tráfico real: `curl -sD- https://demo.alovidasalud.arauzsoftware.com/auth`
  devuelve `x-alovida-route: failover`.

## Operación

```bash
sudo alovida-standby --status          # vivo / standby por app
sudo alovida-autodeploy --status       # rama vs. último despliegue FINISHED
sudo tail -f /var/log/alovida-autodeploy.log /var/log/alovida-resilience.log /var/log/alovida-uptime.log

# Apagar una app sin que el standby la siga sirviendo / sin autodeploy
sudo touch /var/lib/alovida-resilience/test.disabled
sudo touch /var/lib/alovida-resilience/autodeploy/web-test.disabled

# Quitar el failover entero (Traefik vuelve solo a las rutas de Coolify)
sudo rm /data/coolify/proxy/dynamic/alovida-failover.yaml
```

## Bases fuera del despliegue de la API (`data-stack/`)

Coolify nombra los contenedores `<servicio>-<uuid>-<fecha>`, así que cada
despliegue de la API recreaba también postgres, mongo, redis, opensearch y minio.
En `docker-compose.coolify.yml` esos cinco servicios quedan detrás del perfil
`embedded-data` (Coolify no lo activa; en local: `COMPOSE_PROFILES=embedded-data`)
y las dependencias hacia ellos pasan a `required: false`. Las bases viven en el
stack `alovida-data-<entorno>` del VPS, con los mismos nombres en la misma red.

**Orden obligatorio** — dos postgres sobre los mismos datos los corrompen:

1. Mergear este cambio del compose **sin** desplegar todavía (el autodeploy del
   servidor espera 10 min de quietud; avisar a quien opere).
2. En el VPS: `sudo alovida-data-switchover test`. Para las bases de Coolify y
   les quita el reinicio automático, COPIA los volúmenes al stack (los viejos
   quedan intactos como backup), lo levanta y compara conteos. Corte de la API:
   ~1 min. Si algo no cuadra, vuelve atrás solo.
3. Desplegar la API desde Coolify y reencender su autodeploy:
   `sudo rm /var/lib/alovida-resilience/autodeploy/api-test.disabled`.

**Hecho en test el 25/10/2026 22:29 UTC**: conteos iguales antes y después
(1 321 tablas / 23 817 conceptos / 904 usuarios). Corte real de la API: **278 s**,
no ~1 min (OpenSearch tarda en declararse sano); con la sonda que entonces sólo
miraba `/auth`, no quedó medido del lado del usuario.

Vuelta atrás: `sudo alovida-data-switchover test rollback`. Con el cambio hecho,
el reconciliador para cualquier base de Coolify de esa API que vuelva a arrancar.

## Rol definitivo de la base (`mantra_app` + RLS): BLOQUEADO

Probado el 25/10/2026 con una copia aislada de la API de test: 11 de 12 rutas
iguales, pero `/system-context/dynamic-enums?target=…` da **404** con RLS (200 sin
él), y lo usa el alta de médico. La política es `tenant_id = <tenant actual> OR
app.system_context = 'true'` y las 82 filas del catálogo tienen `tenant_id`
NULL: con RLS el catálogo global queda invisible. **325 políticas** tienen esa
forma. Hay que corregirlas en el modelo (`2026-08-05_tenant_rls.sql`) antes de
activar `RLS_ENFORCE`. Mientras tanto la API corre con
`DB_ALLOW_PRIVILEGED_RUNTIME_ROLE=true`.

## Límites conocidos

- En los entornos que no pasaron sus bases a `data-stack/` (sección anterior),
  cada despliegue de la API también recrea postgres, mongo, redis, opensearch y
  minio, y la API se corta mientras postgres reinicia: el standby cubre el
  init/migrate, no ese reinicio. El switchover mueve volúmenes de datos y
  requiere ventana. Ver mdavila-2001/mantra-core-health-api#1170.
- Al 25/10/2026, `app.alovidasalud.arauzsoftware.com` apuntaba en DNS al
  servidor viejo (173.249.39.237), no a 62.169.18.132. Ver
  mdavila-2001/mantra-core-health-api#1170.
