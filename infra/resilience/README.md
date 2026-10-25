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

## Pendiente

- **La API se sigue cortando ~1 min por despliegue**: Coolify recrea también las
  bases del compose (postgres, mongo, redis, opensearch, minio). El standby cubre
  los ~20 min de init/migrate, no el reinicio de postgres. Sacar las bases a un
  stack propio lo elimina, pero mueve volúmenes de datos: requiere ventana.
- `dev` no está en el failover: su proxy estaba en bucle (`duplicate location`,
  arreglado en #1321) y no tiene standby todavía.
- `app.alovidasalud.arauzsoftware.com` apunta en DNS al servidor viejo
  (173.249.39.237): hay que cambiar el registro A a 62.169.18.132.
