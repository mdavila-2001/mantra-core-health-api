# Operations console module

Esta carpeta contiene las consultas de la consola global de operaciones:
readiness, incidentes, despliegues, cambios, SLO y respaldos. Sus rutas son de
sólo lectura y están reservadas a roles operativos de plataforma.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/ops_console -name '*.controller.ts' | wc -l
  find src/modules/ops_console -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/ops_console -name '*.entity.ts' | wc -l
  find src/modules/ops_console -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 9 rutas HTTP, 0 entidades y 2 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` importa `RouteIndexModule` (el índice de rutas en proceso, para resolver `operationId`).

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /admin/ops/readiness` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/incidents` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/incidents/:id` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/deployments` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/change-requests` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/slos` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/backups` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/traffic` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/traffic/endpoints` | ...OPS_READ_ROLES | `ops-console` |

## Tráfico HTTP (`/admin/ops/traffic*`)

Lee `time_series.service_sli_series` (`sli_code = 'http_requests'`), que escribe
`src/observability/http-sli` cuando `OBSERVABILITY_HTTP_SLI_ENABLED=true`, y
`iam.sessions` para los usuarios activos. Sólo `SELECT`, siempre agregado:

- Cada fila de la serie es **un minuto de una (método, plantilla de ruta)**, y
  `service_sli_series` no tiene clave única: la lectura **suma**, nunca lee por fila.
- La respuesta nunca trae una dirección real, un usuario ni un identificador:
  `route` es la plantilla (`/patients/:id`), `UNMATCHED` agrupa lo que no coincidió
  con ninguna ruta y `__overflow__` lo que superó el tope de cardinalidad por minuto.
- La latencia sale de un histograma acumulado de 11 cortes (5 ms – 10 s): `p50`/`p95`
  son **estimaciones** (`method: 'histogram-estimate'`) y `approximate: true` indica
  que cayeron en el último corte, o sea «por lo menos esto».
- «Hoy» es 00:00 UTC del día de `to` salvo que se pida `from`; la ventana, con su
  `timezone: 'UTC'`, viaja en la respuesta. Una ventana inválida es `422 VALIDATION_FAILED`
  con la razón (misma convención que `/admin/analytics`).
- «Usuarios activos» son sesiones de IAM, no usuarios que hicieron peticiones: la
  medición no guarda quién hizo cada una. `activeUsers.definition` lo dice.
- `notMeasured` enumera lo que la medición no cubre; con la medición apagada, su
  única entrada es `disabled`.

## Verificación

```bash
corepack yarn test src/modules/ops_console --runInBand --silent

# contra una base descartable con el DDL de database/SQL aplicado
OPS_TRAFFIC_IT_DB_URL=postgres://… corepack yarn test:integration test/integration/ops-traffic.int-spec.ts
```

La auditoría visual y de contratos de octubre de 2026 está en
[`docs/revision-backend-2026-10-04/modulos/ops_console.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/ops_console.md).
