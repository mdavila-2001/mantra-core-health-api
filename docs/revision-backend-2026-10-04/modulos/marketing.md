# Módulo 50 — Marketing

## Alcance y evidencia

Se revisaron los controladores, DTO, servicios, repositorios, entidades, pruebas y el DDL de
`src/modules/marketing` y `database/SQL/50_marketing`. El módulo crea segmentos, campañas,
plantillas, journeys, inscripciones, enlaces rastreables, touchpoints y repartos de atribución.

| Área | Evidencia | Resultado |
| --- | --- | --- |
| Autorización | `controllers/marketing.controller.ts:48-244` aplica roles; `tracked-link-redirect.controller.ts:36-55` declara pública la ruta `/r/:code`. | Los roles de endpoint existen, pero no hay alcance de tenant en los servicios. |
| Aislamiento de tenant | `dto/marketing.dto.ts:36-42`, `197-203`, `495-502`; `services/marketing-campaigns.service.ts:99-121`, `264-298`, `322-382`; `services/marketing-journeys.service.ts:157-183`, `212-381`, `409-499`, `525-571`. | El tenant se recibe del cliente y las cargas por ID no lo filtran. |
| Integridad y concurrencia | `repositories/marketing-campaigns.repository.ts:284-292`, `408-416`, `521-530`; `repositories/marketing-journeys.repository.ts:454-462`, `530-538`. | Hay transacciones y bloqueos para refrescos, campañas, versiones, clicks e inscripciones. |
| Contratos e índices | `database/SQL/50_marketing/04_indexes.sql:5-35`, `91-107`; `services/marketing-campaigns.service.ts:99-108`, `240-249`; `services/marketing-journeys.service.ts:139-148`. | Los servicios prometen unicidad por tenant, pero tres índices son globales. |
| Ruta pública | `tracked-link-redirect.controller.ts:44-55`; `services/marketing-journeys.service.ts:617-661`. | El visitante aporta libremente el tipo e ID de miembro que se atribuye al click. |

## Hallazgos

### MKT-01 — Crítico — recursos y altas no se vinculan al tenant autenticado

Los DTO de alta reciben `tenantId` del cuerpo y los servicios lo persisten sin compararlo con el
actor (`marketing-campaigns.service.ts:99-121, 240-298, 408-440` y
`marketing-journeys.service.ts:126-183`). Luego las operaciones con rutas UUID cargan segmentos,
campañas, journeys e inscripciones con filtros `{ id }`, sin tenant ni control de pertenencia
(`marketing-campaigns.repository.ts:276-292, 408-416`; `marketing-journeys.repository.ts:302-321,
454-480`). También se aceptan relaciones entre tenants: campaña→segmento (`marketing-campaigns.service.ts:264-277`),
journey→segmento (`marketing-journeys.service.ts:157-171`) y paso→plantilla
(`marketing-journeys.service.ts:234-257`).

Un `MARKETING_MANAGER` de Tenant A puede crear datos para Tenant B indicando su UUID, o mutar un
recurso de B si conoce el UUID. Los roles sólo autorizan la capacidad global del endpoint.

**Plan:** derivar el tenant de una identidad autenticada con membresía comprobada; retirar
`tenantId` de los DTO de usuario; hacer que todas las búsquedas y bloqueos reciban ese tenant; y
verificar que cada relación tenga el mismo tenant antes de crear o mutar.

### MKT-02 — Alto — índices globales contradicen la unicidad por tenant y devuelven fallo de base

El código busca duplicados por `{ tenantId, code }` para segmentos, campañas y journeys
(`marketing-campaigns.repository.ts:303-309, 427-433`; `marketing-journeys.repository.ts:332-338`),
y los DTO y README los describen como únicos por tenant. Sin embargo el DDL define
`uq_segments_code`, `uq_marketing_campaigns_code` y `uq_journeys_code` sólo sobre `code`
(`database/SQL/50_marketing/04_indexes.sql:5,33,91`).

El primer alta de un código en Tenant B pasa la validación de servicio si existe en Tenant A, pero
la base la rechaza globalmente. La excepción SQL no se traduce al `ConflictException` previsto.

**Plan:** cambiar los índices a `(tenant_id, code)` con una migración que detecte duplicados; y
traducir la violación de unicidad a un conflicto estable mientras la migración se aplica.

### MKT-03 — Alto — endpoint público permite falsificar la identidad atribuida a un click

`GET /r/:code` es `@Public()` y acepta `memberType` y `memberRefId` como parámetros de consulta
sin pipes de validación (`tracked-link-redirect.controller.ts:36-55`). Si llega cualquier
`memberRefId`, `registerClick` crea un touchpoint para ese UUID; cualquier tipo que no sea
literalmente `PATIENT` se convierte en `CONTACT` (`marketing-journeys.service.ts:645-658`). No se
comprueba que el miembro sea destinatario de ese enlace o campaña.

Cualquiera que conozca un código activo puede contaminar analítica y atribución de un contacto o
paciente arbitrario; el contador de clicks sigue siendo válido, pero el touchpoint atribuido no.

**Plan:** no aceptar la identidad en parámetros públicos. Emitir un token opaco, firmado y con
expiración ligado al destinatario y enlace; resolverlo en servidor, rechazar firmas inválidas y
guardar sólo el identificador derivado.

## Casos de prueba requeridos

| Caso | Escenario verificable | Resultado esperado |
| --- | --- | --- |
| Correcto | Un manager de Tenant A crea una campaña con un segmento de A y materializa miembros. | Persiste la campaña, todos los IDs comparten tenant y la audiencia queda idempotente. |
| Límite | Dos tenants crean el mismo `code` en segmento, campaña y journey. | Se permiten ambos si la regla es por tenant; cada consulta devuelve sólo su tenant. |
| Error | Un manager de A intenta refrescar o activar un recurso UUID de B. | `404` o `403` con razón estable; ningún recurso de B se bloquea ni modifica. |
| Falla catalogada | Petición pública a `/r/:code?memberType=CONTACT&memberRefId=<uuid-ajeno>`. | Hoy crea MKT-03; tras la corrección, ignora la identidad o rechaza el token no válido. |

## Verificación ejecutada

`corepack yarn test src/modules/marketing --runInBand --silent` terminó correctamente: **3 suites,
80 pruebas**. La suite cubre reglas de negocio y delegación, pero no contiene casos de aislamiento
entre tenants, índices contra el DDL, ni suplantación desde `/r/:code`.
