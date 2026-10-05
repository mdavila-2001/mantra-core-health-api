# Revisión del módulo `geo` — ALOVIDA

## Alcance y evidencia

- Fecha: 2026-10-05. Se leyeron los cuatro controladores, servicios, repositorios,
  entidades y DTO de seguimiento geográfico.
- `corepack yarn test src/modules/geo --runInBand --silent` → **8 suites y 43
  pruebas aprobadas**. Son unitarias con repositorios simulados; no prueban dos
  tenants, un paciente ni políticas de consentimiento reales.

## Hallazgos confirmados

### GEO-01 — Crítica — los datos de geolocalización se operan por UUID sin alcance de actor ni tenant

Todos los endpoints exigen `SECURITY_ADMIN`, pero el controlador entrega IDs y
`tenantId` del cuerpo al servicio sin derivarlos de una sesión con alcance
([geo-tracked-subjects.controller.ts](../../../src/modules/geo/controllers/geo-tracked-subjects.controller.ts#L29-L89),
[geo-geofences.controller.ts](../../../src/modules/geo/controllers/geo-geofences.controller.ts#L28-L50)). `enroll`
persiste el `subjectId` y el `tenantId` solicitados sin resolver al sujeto ni
verificar consentimiento ([geo-tracked-subjects.service.ts](../../../src/modules/geo/services/geo-tracked-subjects.service.ts#L65-L112)).
`ingestPings`, `lastPosition` y `revokeConsent` buscan sólo `{ id }`
([#L119-L263](../../../src/modules/geo/services/geo-tracked-subjects.service.ts#L119-L263)); las consultas de
geofence y eventos hacen lo mismo ([geo-geofences.service.ts](../../../src/modules/geo/services/geo-geofences.service.ts#L53-L194),
[geofences.repository.ts](../../../src/modules/geo/repositories/geofences.repository.ts#L49-L63)).

Un administrador con una petición válida puede aportar un UUID de sujeto o
geofence de otra organización y crear, leer la última posición, añadir pings o
revocar su consentimiento. Los pings constituyen dato personal sensible y la
revocación cambia el estado de seguimiento, por lo que la ausencia de frontera
de recurso es crítica.

**Plan de corrección.** Crear una política de acceso de geo que derive el tenant
del contexto autenticado y que resuelva sujeto, dispositivo, sesión, viaje y
geofence dentro de ese tenant. Para `PERSON`, exigir además una relación clínica
o de consentimiento activa. Quitar `tenantId` de los DTO HTTP o contrastarlo
contra el contexto. Pasar el alcance a cada repositorio y devolver una ausencia
indistinguible para recursos ajenos. Mantener la excepción de proceso interno
sólo mediante una identidad de servicio explícita, no por un rol HTTP genérico.

| Caso | Tipo y preparación | Entrada / resultado esperado |
| --- | --- | --- |
| Correcto | Integración: actor T1, sujeto y consentimiento T1. | Alta, ping y última posición T1 devuelven 201/201/200. |
| Límite | Integración: último ping y sesión que se cierra al revocar. | Revocación cierra sesiones abiertas y ya no acepta pings. |
| Error | Integración: actor T1, UUID de sujeto/geofence T2. | Ninguna lectura o mutación de T2; respuesta indistinguible de ausencia. |
| Falla catalogada | E2E: UUID ajeno. | `404`, `RESOURCE_NOT_FOUND`, `GEO_TRACKED_SUBJECT_NOT_AVAILABLE` (o reason catalogado equivalente). |

### GEO-02 — Alta — se pueden enlazar un geofence y un sujeto de tenants distintos

Al registrar un evento, el servicio carga geofence y sujeto por ID de forma
independiente y sólo comprueba existencia/estado ([geo-geofences.service.ts](../../../src/modules/geo/services/geo-geofences.service.ts#L143-L194)). No compara
`geofence.tenantId` con `subject.tenantId`; el repositorio tampoco restringe la
búsqueda ([tracked-subjects.repository.ts](../../../src/modules/geo/repositories/tracked-subjects.repository.ts#L40-L62)).

Aunque se añadiera la política de actor de GEO-01, una ruta de servicio o worker
mal cableada podría grabar eventos que mezclan los tenants. Antes de insertar,
resolver ambos recursos mediante la misma consulta de alcance y rechazar la
relación si los tenants difieren; añadir una constraint o modelo de pertenencia
si el diseño permite que un sujeto sin tenant participe. Probar ENTER y EXIT
válidos, transición repetida, combinación T1/T2 y `422/PRECONDITION_FAILED/
GEO_GEOFENCE_SUBJECT_TENANT_MISMATCH`.

### GEO-03 — Media — el lote de pings permite valores físicos no acotados

El DTO limita el lote a 1.000 elementos, pero `accuracyM`, `altitudeM`,
`speedMps` y `headingDeg` sólo usan `@IsNumber` ([ingest-pings.dto.ts](../../../src/modules/geo/dto/ingest-pings.dto.ts#L34-L145)). Se convierten directamente a `numeric`
antes de almacenar ([geo-tracked-subjects.service.ts](../../../src/modules/geo/services/geo-tracked-subjects.service.ts#L164-L181)). Valores infinitos, absurdos o un
rumbo fuera de 0–360 pueden contaminar telemetría, alertas y cálculos posteriores.

Definir rangos físicos y `@IsFinite`/validadores equivalentes para cada campo,
incluyendo una cota de antigüedad/futuro para `capturedAt`; rechazar geometrías
poligonales que no tengan estructura GeoJSON válida. Añadir pruebas de valores
válidos, extremos inclusivos, negativos/fuera de rango y
`400/VALIDATION_ERROR/GEO_INVALID_LOCATION_MEASUREMENT`.

## Olas

| Ola | Hallazgos | Esfuerzo |
|---|---|---:|
| 0 | GEO-01, GEO-02 | M |
| 2 | GEO-03 | S |
