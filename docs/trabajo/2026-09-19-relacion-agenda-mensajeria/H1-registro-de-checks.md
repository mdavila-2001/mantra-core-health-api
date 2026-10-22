# H1.S2 — El registro de resultados, que es lo que evita el optimismo

## H1.S2.M1 — Formato de registro de un resultado · `HECHO`

Trece campos. Ninguno es opcional: los que no aplican se escriben con su motivo, no se borran.

| # | Campo | Qué es | Regla |
|---|---|---|---|
| 1 | `check_id` | Identificador estable del check | Coincide con el ID de microtarea cuando nace de una (`H4.S1.M1`) |
| 2 | `gate` | Qué puerta cubre | `A` aislamiento · `B` relación · `C` producto |
| 3 | `scope` | Qué superficie | `unit` · `integration` · `e2e` · `db` · `static` |
| 4 | `artifact` | Sobre qué corrió | Ref de git + ruta. **Versión, no rama** |
| 5 | `required` | Si es obligatorio del nivel | `true`/`false` |
| 6 | `applicable` | Si aplica a este artefacto | `false` exige motivo en `reason` |
| 7 | `status` | Veredicto de ejecución | `PASS` · `FAIL` · `NOT_RUN` · `BLOCKED` |
| 8 | `reason` | Por qué ese estado | Obligatorio salvo en `PASS` limpio |
| 9 | `participants` | Quién participó de verdad | Cada uno marcado `real` o `double`. **Un doble jamás se lista como real** |
| 10 | `command` | El comando literal ejecutado | `null` **sólo** sin ejecución, con causa en `reason` |
| 11 | `exit_code` | El código de salida real | `null` bajo la misma regla que `command` |
| 12 | `evidence_paths` | Rutas de la evidencia | **Tienen que existir**. Una ruta inventada invalida el check entero |
| 13 | `limits` | Qué NO acredita este check | Vacío es una afirmación fuerte; pensalo dos veces |

### Ejemplo lleno — real, de este turno

```json
{
  "check_id": "H1.S2.M4",
  "gate": "B",
  "scope": "db",
  "artifact": "mantra-core-health-api@5d5007fbdb7916b124010bbfbb560b7bb3aabc06",
  "required": true,
  "applicable": true,
  "status": "PASS",
  "reason": "PostgreSQL 5433 responde con el esquema cargado tras levantar el daemon a mano",
  "participants": [
    { "name": "postgres (mantra-redesa-postgres-1)", "kind": "real", "version": "timescaledb-ha pg18" }
  ],
  "command": "docker exec mantra-redesa-postgres-1 psql -U mantra -d mantra_redesa_health -c '<conteos>'",
  "exit_code": 0,
  "evidence_paths": ["docs/trabajo/2026-09-19-relacion-agenda-mensajeria/evidencia/h1s2m4-postgres-y-docker.txt"],
  "limits": "Acredita que la base existe y responde. NO acredita que los datos sean los del paquete de seeds, ni que la app se conecte con estas credenciales."
}
```

### Ejemplo de `command: null` legítimo

```json
{
  "check_id": "H2.S1.M1",
  "status": "BLOCKED",
  "reason": "El artefacto de contrato versionado de Ender no existe en el árbol al corte 5d5007f; no hay versión que referenciar",
  "command": null,
  "exit_code": null,
  "evidence_paths": ["…/evidencia/h2s1m1-contrato-ausente.txt"],
  "limits": "No dice que el contrato esté mal. Dice que no hay contrato que consumir todavía."
}
```

## H1.S2.M2 — Estados de entrega vs veredictos de ejecución · `HECHO`

**Son dos ejes distintos y no se mezclan.** Un check `PASS` no mueve el estado de entrega por sí solo;
un estado de entrega no es el resultado de ningún comando.

### Eje 1 — Veredictos de ejecución (de un check)

| Veredicto | Cuándo |
|---|---|
| `PASS` | Corrió y cumplió, con `command` y `exit_code` |
| `FAIL` | Corrió y no cumplió |
| `NOT_RUN` | No se ejecutó. **Acá va todo `skipped` del runner** |
| `BLOCKED` | No se pudo ejecutar por una dependencia externa, con dueño |

> **Un test marcado `skipped` por el runner se registra `NOT_RUN`, nunca `PASS`.**
> Jest cuenta los `skipped` aparte de los `passed`; leer «0 failed» como «todo verde» es exactamente
> el error que este eje existe para impedir.

### Eje 2 — Estados de entrega (de una relación o capacidad)

En orden de fuerza creciente:

| Estado | Qué significa exactamente |
|---|---|
| `IN_PROGRESS` | Se está trabajando; nada acreditado |
| `TRANSITIONAL_ISOLATION` | Corre aislado, pendiente de composición |
| `DECISION_REQUIRED` | Bloqueado por una decisión que no es técnica |
| `MODULE_VERIFIED_WITH_CONTRACT_DOUBLES` | El módulo cumple su contrato contra dobles |
| `ADAPTER_VERIFIED_WITH_DOUBLES` | **El adaptador** cumple, con dobles de ambos extremos |
| `INTEGRATION_VERIFIED_WITH_REAL_IMPLEMENTATIONS` | Corrió con participantes reales y efectos comprobados |
| `PRODUCT_ACCEPTANCE_VERIFIED` | Aceptación de producto |

**No hay atajo entre el quinto y el sexto.** Faltando un participante real, el estado se queda en el
quinto por más verdes que haya.

## H1.S2.M3 — Comandos de verificación que existen realmente · `HECHO`

`package.json` del corte declara **112 scripts**. Los que sirven a esta relación, literales:

```json
"build":            "nest build",
"lint":             "eslint \"{src,apps,libs,test}/**/*.ts\"",
"typecheck":        "tsc --noEmit --incremental false -p tsconfig.json",
"test":             "node --experimental-vm-modules node_modules/jest-cli/bin/jest.js",
"test:integration": "cross-env ORM_SCHEMA_SYNC=off RATE_LIMIT_DISABLED=true node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config ./test/jest-integration.json",
"smoke":            "cross-env ORM_SCHEMA_SYNC=off RATE_LIMIT_DISABLED=true node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config ./test/jest-smoke.json",
"test:cov":         "node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --coverage",
"test:e2e":         "jest --config ./test/jest-e2e.json"
```

| Necesidad | Comando instalado | Observación |
|---|---|---|
| Typecheck | `yarn typecheck` | **No** `yarn build`: `tsconfig.build.json` excluye `test/` y `*.spec.ts`, así que un error en una prueba no lo ve |
| Lint | `yarn lint` | Sin `--max-warnings=0` en el script; el CI lo agrega aparte |
| Unitarios | `yarn test` | `EntityManager` mockeado: **ninguno toca la base** |
| Integración | `yarn test:integration` | Exige PostgreSQL. Fija `ORM_SCHEMA_SYNC=off` |
| E2E / smoke | `yarn smoke` | **Trunca las tablas de negocio.** Correrlo obliga a reconstruir el stack después |

> **Lo que NO existe, aunque el paquete lo sugiera:** no hay script `test:contract`, ni
> `test:relation`, ni `verify:adapter`. Los comandos de los anexos son especificaciones, no
> comandos instalados. **No se inventa uno que no esté.**

Evidencia: `evidencia/h1s2m3-comandos-reales.txt`.

## H1.S2.M4 — Disponibilidad de PostgreSQL y Docker · `HECHO` — veredicto `PASS`

**Al arrancar el turno el daemon estaba caído.** Salida literal de ese momento:

```
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine;
check if the path is correct and if the daemon is running:
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

Y ningún puerto del stack respondía: `5433`, `5432`, `27018`, `6380`, `9201`, `9002` → todos
`ECONNREFUSED`.

Tras levantar Docker Desktop a mano, los 5 contenedores de `mantra-redesa` subieron solos y
Postgres quedó **healthy** en `5433`:

| Comprobación | Resultado |
|---|---|
| `docker --version` | `Docker version 29.4.2, build 055a478` |
| `docker info --format {{.ServerVersion}}` | `29.4.2` |
| Contenedores arriba | `postgres` · `mongodb` · `redis` · `opensearch` · `minio` — los 5 `(healthy)` |
| Tablas (excluido `_timescaledb%`) | **1 184** |
| FKs (excluido `_timescaledb%`) | **6 664** |
| `messaging.notification_requests` | 16 filas |

**Hallazgo menor registrado, no resuelto:** `CLAUDE.md` documenta **6 663** FKs y la base viva tiene
**6 664**. Diferencia de una. No es de esta relación y no se tocó; queda anotado para quien lleve
fidelidad de esquema.

> **Contraste con Itzan (su M10):** mide lo mismo. Si a él le da distinto, **eso es un hallazgo de
> entorno**, no un empate a resolver charlando: el daemon estaba caído y lo levanté yo, así que el
> estado de su máquina puede diferir legítimamente del mío. Lo que no puede diferir es el conteo de
> tablas y FKs contra la misma base.

Evidencia: `evidencia/h1s2m4-postgres-y-docker.txt`.
