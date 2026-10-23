# Revisión del módulo `reporting` — ALOVIDA

## Alcance y evidencia

Se revisaron fuentes, definiciones/versiones, ejecuciones, snapshots, programaciones, distribuciones, suscripciones y tableros. `corepack yarn test src/modules/reporting --runInBand --silent` aprobó **3 suites y 68 pruebas**.

## Hallazgo confirmado

### REP-01 — Crítica — Definiciones, ejecuciones y programaciones se resuelven por UUID sin alcance de tenant

Las rutas aplican roles, pero sólo pasan UUID, DTO y actor ([`reporting.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/reporting/controllers/reporting.controller.ts#L56-L242)). Los servicios persisten el `dto.tenantId` y cargan fuente, definición, ejecución y programación sólo por ID para publicar, ejecutar, materializar, distribuir, suscribirse, reintentar o deprecar ([`reporting-definitions.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/reporting/services/reporting-definitions.service.ts#L100-L225), [`…#L278-L358`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/reporting/services/reporting-definitions.service.ts#L278-L358), [`reporting-runs.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/reporting/services/reporting-runs.service.ts#L60-L190), [`…#L576-L620`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/reporting/services/reporting-runs.service.ts#L576-L620)). Las entidades conservan tenant opcional, pero los repositorios de recursos hijos no reciben uno al buscar.

El cotejo global de `tenantId` del body no autoriza UUIDs de definición, fuente, ejecución o schedule. Sin RLS estricta, un autor/administrador de A puede publicar o deprecar una definición de B, solicitar/materializar/reintentar ejecuciones de B o suscribirse y distribuir sus artefactos.

**Plan:** derivar el tenant del contexto y resolver cada agregado por `id + tenantId`; para fuentes, versiones, schedule, ejecución y snapshot, seguir la cadena hasta la definición y comparar antes de bloquear. Derivar el tenant de la definición al crear hijos y devolver 404 uniforme fuera de alcance.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Autor de A publica, programa y ejecuta una definición de A | `201/200`; filas y artefactos sólo de A |
| Límite | Viewer de A se suscribe a schedule de A | una suscripción propia idempotente |
| Error | Autor de A publica/depreca definición o reintenta ejecución de B | `404`; no cambian estado ni distribución de B |
| Falla catalogada | UUID inexistente o de otro tenant | `404/RESOURCE_NOT_FOUND/REPORTING_RESOURCE_OUT_OF_SCOPE` |

## Controles verificados

El módulo serializa versionado, usa `SKIP LOCKED` para tick y controla estados de ejecución/distribución. Esos controles no garantizan pertenencia al tenant; las pruebas no cubren dos tenants.
