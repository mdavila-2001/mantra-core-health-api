# Controladores de operaciones de plataforma

Capa HTTP: recibe, delega y devuelve. Sin lógica de negocio.

## Controlador

Uno, `PlatformOpsController`, con prefijo `/ops`. Reparte entre los cuatro servicios según el área.
El cliente ve un único módulo de operaciones; la separación por ritmo de trabajo (releases,
incidentes, fiabilidad, prácticas) es interna.

## Rutas

| Método | Ruta | UC | Servicio |
| --- | --- | --- | --- |
| `POST` | `/ops/change-requests` | 01 | releases |
| `POST` | `/ops/change-requests/:id/approvals` | 02 | releases |
| `POST` | `/ops/artifacts` | 03 | releases |
| `POST` | `/ops/deployments` | 04 | releases |
| `POST` | `/ops/deployments/:id/rollback` | 05 | releases |
| `POST` | `/ops/health-checks/:id/runs` | 06 | incidentes |
| `PATCH` | `/ops/incidents/:id` | 07 | incidentes |
| `POST` | `/ops/incidents/:id/postmortem` | 08 | incidentes |
| `POST` | `/ops/slo/:id/measurements` | 09 | fiabilidad |
| `POST` | `/ops/error-budget/:policyId/burn-events` | 10 | fiabilidad |
| `POST` | `/ops/capacity-plans/:id/measurements` | 11 | fiabilidad |
| `POST` | `/ops/readiness-reviews/:id/complete` | 12 | prácticas |
| `POST` | `/ops/runbooks/:id/versions` | 13 | prácticas |
| `POST` | `/ops/runbook-executions` | 13 | prácticas |
| `POST` | `/ops/resilience-exercises/:id/complete` | 14 | prácticas |

Las rutas son las que declara el caso de uso, sin traducción: ninguna usa la notación con `:` como
separador de acción, así que no hay aquí la deviación de ruteo que sí tienen otros módulos.

## Decisiones de ruteo

- **`PATCH` en el incidente (07)**: el caso de uso lo declara así, y encaja —la operación modifica
  parcialmente el incidente y añade a sus logs, no lo reemplaza.
- **`/ops/runbook-executions` sin id de runbook**: la ejecución cuelga de una **versión**, no del
  runbook, y la versión viene en el cuerpo. Colgarla del runbook sugeriría que se ejecuta "el
  runbook", cuando lo que se ejecuta es una versión concreta.
- **`:policyId` en el error budget**: es el nombre que usa el caso de uso, y distingue a simple vista
  que no es el id del SLO.
- **`/complete` como segmento** en revisiones y ejercicios: la operación cierra el recurso, no lo
  crea, y por eso devuelve `200` y no `201`.

## Códigos de estado

`201 Created` en lo que crea recurso o registra un evento nuevo (01–06, 08–11, 13). `200 OK` en lo
que actúa sobre algo existente (07, 12, 14).

## Validación de parámetros de ruta

`ParseUUIDPipe` en todos los identificadores de ruta: aquí todos son UUID.

## Permisos

`PLATFORM_ADMIN` en todo. Además, por área: `RELEASE_MANAGER` (01, 04, 05, 12), `CHANGE_APPROVER`
(02), `DEPLOY_PIPELINE` (03, 04), `SRE` (05–08, 09–10, 13, 14), `INCIDENT_COMMANDER` (07, 08),
`CAPACITY_PLANNER` (11) y `SYSTEM` (06, 09, 10), que es quien opera los trabajos automáticos.

Ninguna ruta es `@Public()`: incluso las que llama un worker pasan por sesión de servicio.

## Pruebas

`platform-ops.controller.spec.ts` (15): una por endpoint, comprobando que delega en el servicio
correcto y que pasa el id de la ruta, el cuerpo y el actor.
