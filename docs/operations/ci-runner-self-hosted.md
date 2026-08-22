# CI en runner propio — qué hacer cuando Actions se queda sin máquinas

**Desde:** 2026-08-18 · **Dueño:** Marcelo (carril M0) · **Repos:** `mantra-core-health-api` y
`mantra-core-health`

## Qué pasó

Desde el **14/08** los jobs de GitHub Actions morían en 2–4 segundos **sin ejecutar un solo paso**.
La causa no era el código: la anotación del check lo dice literal —*«The job was not started because
recent account payments have failed or your spending limit needs to be increased»*—. Los dos
workflows usaban `runs-on: ubuntu-latest`, o sea runners hospedados que consumen minutos de la
cuenta, y esos minutos estaban agotados.

Costo real: **~30 PRs entraron a `dev` el 17/08 sin un solo check automático**, y otros 12 quedaron
abiertos en la misma condición. El review humano fue la única red durante cuatro días.

## Qué hay montado ahora

Dos runners self-hosted, uno por repositorio, en **WSL Ubuntu 24.04 sobre la máquina de Marcelo**:

| Repo | Nombre del runner | Directorio |
|---|---|---|
| `mantra-core-health-api` | `marcelo-wsl-api` | `~/runners/api` |
| `mantra-core-health` | `marcelo-wsl-front` | `~/runners/front` |

Ambos con etiquetas `self-hosted, Linux, X64`, corriendo como **servicio systemd** (arrancan solos
con WSL, sobreviven al cierre de la terminal).

**Por qué Linux y no Windows:** el workflow de la API levanta Postgres, Mongo, Redis y OpenSearch
con `services:`, que solo existe en runners Linux con Docker. WSL Ubuntu con la integración de
Docker Desktop habilitada cumple las dos condiciones.

**Puertos:** los `services:` del CI usan los estándar (5432, 27017, 6379, 9200) y **no chocan** con
el stack de desarrollo `mantra-redesa`, que corre en 5433, 27018, 6380 y 9201. Se puede desarrollar
y correr CI a la vez.

## La limitación que hay que tener presente

**El CI solo funciona cuando esa máquina está encendida y con WSL levantado.** Un PR abierto con la
máquina apagada se queda encolado hasta que vuelva. Por eso el disparo se acotó a `pull_request`
(más `workflow_dispatch` a mano): el check llega cuando sirve —antes de mergear— sin duplicar cada
corrida con el `push` posterior al merge.

Si el equipo necesita CI a toda hora, las salidas son reponer la facturación o mover el runner a
una máquina que esté siempre prendida.

## Operación

```bash
# estado
wsl -d Ubuntu -- systemctl status actions.runner.mdavila-2001-mantra-core-health-api.marcelo-wsl-api

# arrancar / parar
cd ~/runners/api && sudo ./svc.sh start | stop

# ver qué está corriendo, desde cualquier máquina
gh api repos/mdavila-2001/mantra-core-health-api/actions/runners \
  --jq '.runners[] | "\(.name) \(.status) busy=\(.busy)"'
```

**Registrar de nuevo** (si se pierde el registro, o para montarlo en otra máquina):

```bash
TOKEN=$(gh api -X POST repos/<owner>/<repo>/actions/runners/registration-token --jq .token)
cd ~/runners/<repo> && ./config.sh --unattended --replace \
  --url https://github.com/<owner>/<repo> --token "$TOKEN" \
  --name <nombre> --labels self-hosted,linux,x64 --work _work
sudo ./svc.sh install $USER && sudo ./svc.sh start
```

El token de registro **caduca en una hora** y es de un solo uso: generalo en el momento.

## Cuando vuelva la facturación

Cambiar `runs-on: [self-hosted, linux, x64]` de vuelta a `ubuntu-latest` — **1 línea en
`docs.yml`, 3 en `ci.yml`**— y, si se quiere, restaurar el disparo por `push`. Los runners pueden
quedar registrados como respaldo: sin jobs asignados no consumen nada.

Y configurar una **alerta de gasto** en Settings → Billing → Actions, que es lo que faltó para
enterarse el 14/08 en vez del 18/08.

## Riesgo aceptado

Un runner self-hosted **ejecuta el código de los PRs en la máquina que lo hospeda**. En estos repos
es tolerable porque son **privados y sin PRs de forks**: todo lo que corre viene de ramas del
equipo. Si algún día se abren a contribuciones externas, este runner **no puede seguir así** — hay
que aislarlo en un contenedor efímero o volver a runners hospedados.

## Lo que la primera corrida va a destapar

Es la primera vez en cuatro días que algo se verifica solo, sobre un `dev` que absorbió ~30 merges
a ciegas. Es esperable que salgan rojos preexistentes: prettier/lint (ya pasó una vez, PR #123
«dev quedó sin lint verde») y el `git diff --exit-code` de los artefactos generados
(OpenAPI/Postman desfasados). **Cada rojo es un PR chico de corrección, el mismo día. Nada de
apagar un check para que pase.**
