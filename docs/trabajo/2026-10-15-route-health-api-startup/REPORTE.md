# Reporte — Desbloquear arranque de API para route-health

- Fecha: 2026-10-15 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/route-health-api-startup`
- Peldaño de evidencia alcanzado: `VERIFIED` para el wiring y `/health`; `RUNS` para build y typecheck. El barrido funcional sigue bloqueado por servicios locales no disponibles.
- Avance: 4 / 5 (80%).

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Se documentó el alcance y los criterios de aceptación antes de tocar código. | `test -f docs/trabajo/2026-10-15-route-health-api-startup/PLAN.md` | PASS |
| H1.S1.M2 | Se registraron ambos repositorios requeridos por los servicios del módulo y se añadió una prueba de wiring sin conexión a base de datos. | `corepack yarn test --runInBand src/modules/insurance/insurance-patient-settlement.module.spec.ts` | 1 suite y 1 test pasaron. |
| H1.S1.M3 | El lint dirigido pasa. | `corepack yarn eslint src/modules/insurance/insurance-patient-settlement.module.ts src/modules/insurance/insurance-patient-settlement.module.spec.ts` | exit 0; sin salida |
| H1.S1.M3 | El chequeo de tipos pasa. | `corepack yarn typecheck` | exit 0; sin salida |
| H1.S1.M3 | La API compila. | `corepack yarn build` | exit 0; sin salida |
| H1.S1.M4 | La API inicia y responde al endpoint de salud. | `curl --silent --show-error --max-time 5 --write-out '\\nHTTP %{http_code}\\n' http://127.0.0.1:3000/health` | `{"status":"ok"}` · `HTTP 200` |

## A medias

### H1.S1.M5 — Barrido route-health

- Qué anda: la prueba Nest resuelve los providers, el build compila, y la API inicia con el endpoint `/health` respondiendo HTTP 200.
- Qué no anda: el barrido de los cuatro actores no se ejecutó.
- Qué falta exactamente: disponer de PostgreSQL y Redis locales, y después correr el recorrido Playwright con un solo worker.
- Dónde quedó: worktree `wt-route-health-api-startup`, rama `justin/route-health-api-startup`.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S1.M5 | BLOQUEADO | Docker no está corriendo; PostgreSQL en `localhost:5433` no responde y Redis no está disponible. |
| H1.S1.M5 | BLOQUEADO | Sin persistencia disponible, el barrido no puede demostrar los recorridos funcionales. |

## Evidencia

```text
$ corepack yarn test --runInBand src/modules/insurance/insurance-patient-settlement.module.spec.ts
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
```

```text
$ corepack yarn typecheck
exit_code=0
```

```text
$ corepack yarn eslint src/modules/insurance/insurance-patient-settlement.module.ts src/modules/insurance/insurance-patient-settlement.module.spec.ts
exit_code=0
```

```text
$ corepack yarn build
exit_code=0
```

```text
$ DOTENV_CONFIG_PATH=../mantra-core-health-api/.env NODE_OPTIONS='-r dotenv/config' ORM_SCHEMA_SYNC=off PORT=3000 corepack yarn start:prod
Nest application successfully started
```

```text
$ curl --silent --show-error --max-time 5 --write-out '\\nHTTP %{http_code}\\n' http://127.0.0.1:3000/health
{"status":"ok"}
HTTP 200
```

```text
$ pg_isready -h localhost -p 5433
localhost:5433 - no response
```

```text
$ docker ps --format '{{.Names}} {{.Status}} {{.Ports}}'
Cannot connect to the Docker daemon; the Docker daemon is not running.
```

```text
$ git diff --check
exit_code=0
```

## No cubierto

- El barrido Playwright de cuatro actores no se ejecutó.
- No se ejecutó la suite global de la API.
- No se cambió el esquema ni se insertaron filas; el seed se omitió porque PostgreSQL no aceptó la conexión.

## Desvíos del plan

- El arranque confirmó una segunda dependencia faltante, `InsurancePatientAccountRepository`; se registró junto a `LinkedOrderDataRepository` y ambos quedan protegidos por el spec.
- El plan inicial decía que el barrido y un actor sintético se habían ejecutado, sin artefactos verificables en este worktree. Se corrigió el plan: no se creó un actor ni se ejecutó route-health.

## Riesgos residuales

- La API inicia y `/health` responde 200, pero PostgreSQL y Redis no estaban activos.
- El worktree API original conserva cambios de otra tarea; este reporte corresponde al worktree aislado.

## Decisiones y ambigüedades

- Se cargó la configuración local por referencia desde el repo API original; el host se comprobó como loopback y no se imprimieron ni copiaron credenciales. `ORM_SCHEMA_SYNC=off` se mantuvo durante el arranque.
