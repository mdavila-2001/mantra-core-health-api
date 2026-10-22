# Evidencia de ejecución — auditoría backend

Versión: `4dcaa27961588444bcfdeb4cbe8a3aa2d1b71650`. Fecha local: 2026-09-25. Directorio de ejecución: raíz de `mantra-core-health-api`. Node `v22.23.1`, Yarn `4.14.1`, Windows PowerShell. Ver alcance y dictamen en [REPORTE.md](REPORTE.md).

Los `.log` y algunos JSON fueron emitidos en UTF-16LE por Windows PowerShell. Para su publicación se normalizaron mecánicamente a UTF-8, sin modificar su texto; leer con `Get-Content -Encoding UTF8`. Los scripts y Markdown también están en UTF-8. Los mensajes `NativeCommandError` de PowerShell en stderr no sustituyen `$LASTEXITCODE`: Jest/Redocly también escriben progreso/advertencias allí.

## Gates: comandos y salidas literales

### Tipos y build — PASS local

```powershell
yarn install --immutable
yarn typecheck
yarn build
```

La instalación inmutable terminó 0 y añadió el paquete XLSX que faltaba localmente. El primer typecheck había fallado por ese paquete ausente y errores derivados; no se cuenta como defecto del snapshot. La comprobación válida es la posterior a instalar. Typecheck y build terminaron sin texto en stdout/stderr. Marcadores de exit code observados en la herramienta:

```text
TYPECHECK_EXIT=0
BUILD_EXIT=0
```

Los logs [evidencia-typecheck.log](evidencia-typecheck.log) y [evidencia-build.log](evidencia-build.log) están vacíos por esa razón, no porque se haya omitido el resultado.

### Lint — FAIL

```powershell
yarn lint --max-warnings=0
```

Recorte literal de [evidencia-lint.log](evidencia-lint.log):

```text
  254:17  error  'valor' will use Object's default stringification format ('[object Object]') when stringified                                                                                                  @typescript-eslint/no-base-to-string

✖ 20 problems (19 errors, 1 warning)
  18 errors and 1 warning potentially fixable with the `--fix` option.
```

```text
LINT_EXIT=1
```

### Assertions unitarias — PASS; cobertura — FAIL

```powershell
yarn test:cov --maxWorkers=1
```

Recorte literal de [evidencia-unitarios.log](evidencia-unitarios.log):

```text
=============================== Coverage summary ===============================
Statements   : 73.39% ( 36510/49742 )
Branches     : 67.52% ( 19097/28283 )
Functions    : 58.37% ( 7494/12837 )
Lines        : 74.32% ( 35302/47500 )
================================================================================
Jest: Coverage for statements (73.39%) does not meet "global" threshold (74%)
Jest: Coverage for branches (67.52%) does not meet "global" threshold (69%)
Jest: Coverage for lines (74.32%) does not meet "global" threshold (75%)
Jest: Coverage for functions (58.37%) does not meet "global" threshold (59%)

Test Suites: 1 skipped, 711 passed, 711 of 712 total
Tests:       1 skipped, 8639 passed, 8640 total
Snapshots:   0 total
Time:        658.79 s, estimated 695 s
Ran all test suites.
```

```text
UNIT_COVERAGE_EXIT=1
```

Advertencias repetidas de importación JSON sin atributo y VM Modules aparecen en el log; no se ocultaron ni se atribuyó a ellas el fallo del gate.

### Dependencias — consulta sin avisos

```powershell
yarn npm audit --all --recursive --environment production --json
```

Exit code observado: 0. [evidencia-audit-deps.log](evidencia-audit-deps.log) vacío. Esto significa que esa consulta no devolvió avisos; no un análisis exhaustivo del código, dependencias fuera del registro o SO de la imagen.

### Guardrails y OpenAPI — PASS de sus checks respectivos

```powershell
yarn alovida:guardrails
yarn docs:openapi:lint
```

Recortes literales:

```text
Total: 8 (bloqueantes: 0, informativos: 8)
GUARDRAILS_EXIT=0
```

```text
openapi\openapi.yaml: validated in 596ms

Woohoo! Your API description is valid. 🎉

OPENAPI_EXIT=0
```

Logs: [guardrails](evidencia-guardrails.log), [OpenAPI](evidencia-openapi.log). Los 8 informativos no se trataron como 8 bugs confirmados.

## Reproducciones: PASS de la reproducción significa FAIL del control

No interactúan con DB, proveedor financiero ni pacientes. Clases reales + dobles sintéticos; configuración independiente bajo documentación para no alterar la suite del producto. Comando de la última ejecución:

```powershell
node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config docs/trabajo/2026-09-25-auditoria-produccion-backend/jest.audit.json --runInBand --json --outputFile docs/trabajo/2026-09-25-auditoria-produccion-backend/evidencia-reproducciones.json
```

Recorte literal de [evidencia-reproducciones.log](evidencia-reproducciones.log):

```text
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        2.648 s, estimated 3 s
Ran all test suites.
Test results written to: docs\trabajo\2026-09-25-auditoria-produccion-backend\evidencia-reproducciones.json
```

```text
REPRO_EXIT=0
```

Detalle de cada assertion: [evidencia-reproducciones.json](evidencia-reproducciones.json). Código: [reproducciones.spec.ts](reproducciones.spec.ts).

| Caso | Hallazgo | Lo que se ejercitó | Veredicto del control esperado |
|---|---|---|---|
| AUD-01 | F01 clínica | Actor A + cita ajena devuelve paciente B; guard/servicio/repositorio reales, DB doble | FAIL: no rechaza |
| AUD-02 | F01 pagos | Admin A modifica estado del intent B en memoria | FAIL: no rechaza |
| AUD-03 | F06 | Readiness sana cacheada; proveedor pasa a fallo; no se consulta de nuevo | FAIL: respuesta obsoleta |
| AUD-04 | F05 | Filtro y Pino reales conservan marcador privado sintético en error | FAIL: falta sanitización del sink |
| AUD-05 | F03 | Sesión activa + claims de tenant anteriores no consultan membresía | FAIL: falta vigencia del scope |
| AUD-06 | F08 | 1.000 claves expiradas + nueva → Map de 1.001 entradas | FAIL: no libera expiradas |
| AUD-07 | F07 | Intent SUCCEEDED recibe DECLINE y queda FAILED | FAIL: transición terminal inválida |
| AUD-08 | F04 | Autenticador pasa a revocado; gateway permite unión sin revalidar | FAIL: sesión obsoleta |
| AUD-09 | F01 agenda | PATIENT consulta sólo recurso y recibe IDs ajenos; motivo de consulta sí se oculta | FAIL: ownership del listado |

No hay resultado de persistencia real para estas reproducciones. Convertirlas en regresiones exige cambiar assertions para esperar denegación/estado correcto y ejecutarlas además sobre HTTP/DB/WS reales.

## Observación local de salud — no representa producción

```powershell
node docs/trabajo/2026-09-25-auditoria-produccion-backend/sondas-locales.cjs
```

Salida literal en [evidencia-sondas.log](evidencia-sondas.log):

```json
{"route":"/health","status":200,"cacheControl":"public, max-age=60, stale-while-revalidate=300","bodyStatus":"ok"}
{"route":"/readiness","status":503,"cacheControl":null,"bodyStatus":"error","checks":{"postgresql":{"status":"up","latencyMs":15},"mongodb":{"status":"down","latencyMs":1},"redis":{"status":"up","latencyMs":2},"opensearch":{"status":"up","latencyMs":4}},"timestamp":"2026-09-26T01:00:03.221Z"}
{"route":"/health","status":200,"cacheControl":"public, max-age=60, stale-while-revalidate=300","bodyStatus":"ok"}
```

Metadatos de sólo lectura, [evidencia-contenedor.log](evidencia-contenedor.log):

```text
name=/mantra-redesa-api-1 image=mantra-redesa-api:local image_id=sha256:e853d81f69c34881d5fc1ceeb7be72e14ae2f528a37208df1a2f8d3d4e979f99 created=2026-09-25T04:58:17.643024075Z health=healthy
{"node":"v24.20.0","mode":"development","commit":"desconocido","rls":"false","appRoleConfigured":false}
```

No se inspeccionaron ni publicaron passwords/secretos del contenedor. El resultado no identifica el commit ejecutado.

## CI del SHA auditado

```powershell
gh pr view 462 --json number,url,mergedAt,mergeCommit,statusCheckRollup
gh run view 36161224519 --json conclusion,url,headSha,createdAt,jobs
```

Evidencia completa: [PR #462](evidencia-pr462.json), [run y pasos](evidencia-ci.json). El JSON contiene `mergeCommit.oid=4dcaa27961588444bcfdeb4cbe8a3aa2d1b71650`, `mergedAt=2026-09-25T17:16:09Z` y conclusión `FAILURE` de `docs`. Pasos de tipos, build, lint y tests están `skipped` después del fallo de MinIO. No se equipara el HEAD del PR con el SHA de merge: la vinculación la aporta `mergeCommit.oid`.

## Métricas y referencias para repetir la inspección

```powershell
node docs/trabajo/2026-09-25-auditoria-produccion-backend/metricas.cjs
git log --since=2026-08-01 --format=%H -- src/modules/scheduling/services/scheduling-bookings.service.ts
rg -n 'findByIdForUpdate|PI_FAILED|assessRisk' src/modules/payments
rg -n 'findByAppointmentId|findAppointmentForUpdate|checkIn' src/modules/clinical
rg -n 'DB_APP_USER|RLS_ENFORCE|POSTGRES_PUBLIC_PORT|/health' docker-compose.coolify.yml src/orm/config/orm.config.ts src/app-readiness.service.ts
rg -n 'handleConnection|authenticate|handleJoinConversation|usuarioDe' src/modules/community/gateways/community-messaging.gateway.ts
rg -n 'tenantIds|iam.sessions|iam.users' src/common/auth src/common/tenant
```

Inventario completo en [evidencia-metricas.json](evidencia-metricas.json). Churn contado como número de SHAs devueltos por Git para cada archivo, no número de líneas añadidas:

```text
39 commits src/modules/scheduling/services/scheduling-bookings.service.ts
66 commits src/modules/profiles/services/profiles-practitioners.service.ts
22 commits src/modules/profiles/services/profiles-patients.service.ts
34 commits src/modules/scheduling/services/scheduling-catalog.service.ts
```

Los matches sólo localizan código; el camino causal confirmado y los límites están en cada hallazgo del informe. CVSS reproducible:

```powershell
node docs/trabajo/2026-09-25-auditoria-produccion-backend/cvss.cjs
```

El script sólo consulta código público del calculador en una revisión fija; no envía datos del proyecto. Resultados y vectores: [evidencia-cvss.json](evidencia-cvss.json).

## Verificación de no modificación del producto al terminar la auditoría

Comandos al cierre: `git diff --name-only`, `git status --short`, `git rev-parse HEAD`.

```text
?? docs/trabajo/2026-09-25-auditoria-produccion-backend/
4dcaa27961588444bcfdeb4cbe8a3aa2d1b71650
```

`git diff --name-only` no produjo salida. En ese momento no hubo commit, push, PR ni despliegue. Posteriormente el usuario solicitó publicar el informe mediante commit y PR; esa publicación documental no cambia la versión auditada ni los resultados históricos.

## No cubierto

Integración SQL/RLS real, E2E, WS por red, Node 24/Linux del candidato, carga, recuperación, cloud, historial exhaustivo de secretos, duplicación/ciclos/dead-code y frontend. El informe principal detalla qué falta y por qué. Los resultados anteriores no cierran esas dimensiones.
