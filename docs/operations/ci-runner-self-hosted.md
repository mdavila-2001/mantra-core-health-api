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

## El job muere sin marcar ningún paso como fallo — memoria, no código

**Cómo se reconoce:** mirá los pasos del job. Si los últimos aparecen **en blanco** —ni ✓ ni ✗— en
vez de rojo, y `gh run view --log` contesta `log not found`, el job no falló: **lo mataron**. Un
check en rojo siempre tiene un paso marcado.

Pasó tres veces el 18/08 (#150, #151 y una corrida de #142), siempre en el mismo lugar: **`Lint
TypeScript`**, el paso más pesado del job.

**La causa es el presupuesto de memoria de WSL, no el workflow.** Las cuentas:

| | |
|---|---|
| RAM del host | 23,3 GiB |
| `.wslconfig` | **no existe** → WSL2 toma el **50 %** por defecto ≈ **11,6 GiB** |
| Con quién se comparte | **las dos** distros: `docker-desktop` (la VM de Docker) **y** `Ubuntu` (el runner) |
| Techo de heap del job | `NODE_OPTIONS=--max-old-space-size=6144` → **6 GiB** para un solo proceso |

O sea: el lint puede pedir 6 GiB dentro de una distro que comparte 11,6 GiB con la VM de Docker
—que a su vez hospeda los almacenes del propio job **y** el stack de desarrollo si está levantado—.
Cuando no alcanza, el kernel mata procesos, la distro `Ubuntu` se cae, el runner desaparece a mitad
del job y sus logs nunca se suben. Exactamente la firma de arriba.

**El `6144` no es el error y no hay que bajarlo a ciegas**: está puesto porque el lint type-aware
sobre 60 módulos y ~1 185 entidades muere con el heap por defecto (`exit 129`, sin emitir un solo
diagnóstico). Bajarlo cambia una muerte silenciosa por un `JavaScript heap out of memory` — más
honesto, pero sigue sin haber check.

### Qué hacer, en orden

1. **Darle a WSL un presupuesto explícito.** Crear `%USERPROFILE%\.wslconfig`:

   ```ini
   [wsl2]
   memory=16GB
   swap=8GB
   ```

   Deja 7 GiB para Windows y le da aire a las dos distros. **Requiere `wsl --shutdown` para tomar
   efecto**, que mata el runner y cualquier job en curso: hacerlo con la cola vacía.

2. **No tener el stack de desarrollo completo arriba mientras el runner trabaja.** Un
   `docker compose up` pelado levanta la API **y sus 17 workers** (~1,5 GiB) más el OpenSearch de
   dev (~1,3 GiB), y ninguno hace falta para nada de lo que el CI corre. `rebuild_stack.py` levanta
   **solo la infraestructura** justamente por esto. Son ~2,8 GiB recuperables.

3. **Si aun así se cae**, acotar los workers de Jest en CI (`--maxWorkers=2`): cada worker es un
   proceso Node que hereda el mismo techo de 6 GiB.

> **Ojo con confundirlo con el otro fallo del mismo día:** el `Conflict. The container name
> "/minio" is already in use` **sí** era un paso en rojo (exit 125) y se arregló en el workflow. La
> relación entre los dos es de causa a efecto: los jobs que la memoria mató dejaron el contenedor
> `minio` huérfano, y ese huérfano después bloqueó a todos los demás.

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

Un runner self-hosted **ejecuta el código de los PRs en la máquina que lo hospeda**. Esto se aceptó
suponiendo repos privados y sin forks, pero **la API de GitHub reporta `mantra-core-health-api`
como público** (consulta del 18/09/2026, 0 forks en ese momento). En un repo público cualquiera
puede hacer un fork y abrir un PR (MCH-014).

Contención aplicada en `docs.yml`:

- El job `docs` sólo corre para PRs cuya rama vive en este repositorio (y para `workflow_dispatch`).
- Un PR desde fork dispara `fork-guard`, que **falla a propósito sin hacer checkout ni ejecutar
  nada del PR**. Falla en vez de saltarse porque un job `skipped` cuenta como éxito en un check
  requerido. Para validar ese aporte, un mantenedor revisa el código, trae la rama al repositorio y
  abre el PR desde ahí.
- `GITHUB_TOKEN` con `contents: read`, y `persist-credentials: false` en el checkout para que el
  token no quede en `.git/config` del workspace, que en este runner sobrevive al job.

Esto es contención, no aislamiento. Lo que sigue abierto:

- El workspace, la caché de Yarn y los contenedores de Docker **persisten entre jobs** en esta
  máquina. Un PR de una rama del equipo sigue corriendo con acceso al Docker del host y a la red
  local. La salida real es un runner efímero (contenedor o VM recreados en cada job) o volver a
  runners hospedados.
- Revisar en *Settings → Actions → General* que la aprobación de workflows de forks esté en
  "Require approval for all outside collaborators". Desde este entorno la API devolvió 403, así
  que no se pudo verificar.

## Lo que la primera corrida va a destapar

Es la primera vez en cuatro días que algo se verifica solo, sobre un `dev` que absorbió ~30 merges
a ciegas. Es esperable que salgan rojos preexistentes: prettier/lint (ya pasó una vez, PR #123
«dev quedó sin lint verde») y el `git diff --exit-code` de los artefactos generados
(OpenAPI/Postman desfasados). **Cada rojo es un PR chico de corrección, el mismo día. Nada de
apagar un check para que pase.**
