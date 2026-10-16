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

El módulo tiene **1 controller, 7 rutas HTTP, 0 entidades y 1 servicio**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /admin/ops/readiness` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/incidents` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/incidents/:id` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/deployments` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/change-requests` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/slos` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/backups` | ...OPS_READ_ROLES | `ops-console` |

## Verificación

```bash
corepack yarn test src/modules/ops_console --runInBand --silent
```

La auditoría visual y de contratos de octubre de 2026 está en
[`docs/revision-backend-2026-10-04/modulos/ops_console.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/ops_console.md).
