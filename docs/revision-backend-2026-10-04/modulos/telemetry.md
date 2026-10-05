# Revisión del módulo `telemetry` — ALOVIDA

**Fecha:** 2026-10-05
**Alcance:** controladores, DTOs, servicios, repositorios, entidades, DDL y adaptador de analítica web del módulo 28.
**Evidencia de ejecución:** `corepack yarn test src/modules/telemetry --runInBand --silent` aprobó **14 suites y 121 pruebas**. No hay una prueba de integración HTTP ni de aislamiento entre tenants para este módulo.

## Resumen ejecutivo

Se confirmaron **1 hallazgo crítico y 3 altos**. El módulo conserva correctamente límites de lote, ventanas de analítica y el reenvío posterior al commit, pero no deriva la identidad ni el tenant de varias operaciones sensibles. Los tests existentes ejercitan flujos felices, inexistentes y estados ya cerrados; no ejercitan actor distinto del dueño, dos tenants, ni la lista de propiedades permitida.

| ID | Severidad | Lente | Resumen |
| --- | --- | --- | --- |
| TEL-01 | Crítica | Seguridad / dominio | Cualquier usuario autenticado puede crear o retirar el consentimiento de otro usuario. |
| TEL-02 | Alta | Seguridad / datos | La ingesta acepta y muta journeys, sujetos y sesiones elegidos por el cliente sin enlazarlos a su token. |
| TEL-03 | Alta | Seguridad / contrato | Las propiedades se guardan y se reenvían sin aplicar el esquema, prohibiciones ni política PHI del evento. |
| TEL-04 | Alta | Seguridad / datos | Las consultas administrativas resuelven un tenant para el rol pero no lo usan en SQL; devuelven datos de todos los tenants. |

## Mapa de la unidad

| Grupo | Rutas / responsabilidad | Control actual |
| --- | --- | --- |
| Gobernanza | `POST /telemetry/tracking-purposes`, `event-schemas`, `disclosure-versions`, `funnels` | `SECURITY_ADMIN` |
| Consentimiento | `POST /telemetry/disclosure-acceptances`, `tracking-consents`, `tracking-consents/:id/withdraw` | JWT global; no rol específico |
| Ingesta | `POST /telemetry/activity-events`, `client-contexts`, `web-vitals`, `conversion-events`, `session-journeys/:id/close` | JWT global; el actor no llega al servicio |
| Analítica | `GET /admin/analytics/*` | roles de lectura o raw; ventana y portal opcional |

Entidades/tablas principales: `tracking_consents`, `tracking_disclosure_acceptances`, `analytics_subjects`, `user_activity_events`, `session_journeys`, `client_contexts`, `web_vitals` y `conversion_events`. La configuración puede reenviar eventos a GA4 después del commit.

## Hallazgos confirmados

### TEL-01 — Crítica — Un usuario puede otorgar, aceptar o retirar consentimiento por otra persona

`CreateTrackingConsentDto` y `CreateDisclosureAcceptanceDto` exponen `userId` como campo opcional ([`tracking-consent.dto.ts`](../../../src/modules/telemetry/dto/tracking-consent.dto.ts#L16-L25), [`disclosure-acceptance.dto.ts`](../../../src/modules/telemetry/dto/disclosure-acceptance.dto.ts#L16-L33)). Ambos métodos prefieren ese valor del cuerpo a `actor.id` ([`telemetry-consent.service.ts`](../../../src/modules/telemetry/services/telemetry-consent.service.ts#L59-L65), [`telemetry-consent.service.ts`](../../../src/modules/telemetry/services/telemetry-consent.service.ts#L123-L168)). `withdrawConsent` busca el consentimiento sólo por `id` y crea el retiro para `consent.userId`, sin comprobar que sea el actor ([`telemetry-consent.service.ts`](../../../src/modules/telemetry/services/telemetry-consent.service.ts#L222-L275)). Las tres rutas sólo llevan el JWT global, sin `@Roles` ni guard de propiedad ([`telemetry-consent.controller.ts`](../../../src/modules/telemetry/controllers/telemetry-consent.controller.ts#L25-L87)).

Un usuario autenticado puede enviar el UUID de una víctima para crear aceptación o consentimiento a su nombre; con el UUID de una decisión vigente puede también retirarla y desactivar sus sujetos. La suplantación de una decisión de consentimiento puede habilitar la recolección y el reenvío de datos que la persona nunca autorizó.

**Plan de corrección.**

1. Eliminar `userId` de los DTOs de autoservicio y derivarlo siempre de `@CurrentUser()`; si se necesita una operación administrativa para terceros, crear una ruta separada con rol, motivo y auditoría explícitos.
2. Pasar el actor a `withdrawConsent`; tras cargar la fila, exigir `consent.userId === actor.id` para autoservicio. La alternativa administrativa debe requerir un permiso dedicado y registrar motivo.
3. Añadir razones propias del módulo, por ejemplo `TELEMETRY_CONSENT_NOT_OWNED` y `TELEMETRY_ACT_AS_USER_FORBIDDEN`, al catálogo y lanzar una excepción de dominio uniforme sin revelar la existencia de la decisión.
4. Añadir pruebas de servicio y una integración HTTP con dos usuarios y dos sesiones.

| Caso | Prueba propuesta | Preparación y entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | `telemetry-consent.service.spec.ts` | Actor A otorga y retira su propio consentimiento | Crea decisión y desactiva sólo sujetos de A |
| Límite | integración HTTP | Actor A repite retiro de su última decisión | `422/PRECONDITION_FAILED/TELEMETRY_CONSENT_NOT_ACTIVE` |
| Error | integración HTTP | Actor A envía `userId` de B o retira el consentimiento de B | No se inserta ni desactiva ninguna fila de B |
| Falla catalogada | integración HTTP | Actor A intenta actuar sobre B | `404/NOT_FOUND/TELEMETRY_CONSENT_NOT_OWNED` (misma respuesta que un UUID inexistente) |

### TEL-02 — Alta — Los identificadores de telemetría elegidos por el cliente permiten contaminar journeys y atribución ajenos

Los cinco endpoints de ingesta no reciben `@CurrentUser()` ([`telemetry-events.controller.ts`](../../../src/modules/telemetry/controllers/telemetry-events.controller.ts#L35-L104)). Sus DTO aceptan `userId`, `tenantId`, `analyticsSubjectId`, `sessionId` y `sessionJourneyId` desde el cuerpo ([`activity-event.dto.ts`](../../../src/modules/telemetry/dto/activity-event.dto.ts#L109-L208), [`client-context.dto.ts`](../../../src/modules/telemetry/dto/client-context.dto.ts#L12-L52), [`web-vital.dto.ts`](../../../src/modules/telemetry/dto/web-vital.dto.ts#L66-L100)). El servicio los persiste directamente y `resolveJourney` sólo comprueba existencia al recibir un `sessionJourneyId` ([`telemetry-events.service.ts`](../../../src/modules/telemetry/services/telemetry-events.service.ts#L150-L202), [`telemetry-events.service.ts`](../../../src/modules/telemetry/services/telemetry-events.service.ts#L479-L532)). `closeJourney` también carga por id y modifica contador, evento de salida y estado sin propiedad ni tenant ([`telemetry-events.service.ts`](../../../src/modules/telemetry/services/telemetry-events.service.ts#L440-L468)).

Una cuenta con JWT puede asociar actividad, conversiones, web vitals o contexto a un journey y sujeto de otro usuario, o cerrar un journey ajeno. Eso altera métricas, atribución y trazabilidad, y el DTO permite falsificar el `tenantId` de los eventos.

**Plan de corrección.**

1. Añadir `@CurrentUser()` a la ingesta y derivar `userId`, `sessionId` y tenant del contexto autenticado; quitar esos campos de los DTOs públicos.
2. Al aceptar `analyticsSubjectId`, `sessionJourneyId`, `clientContextId`, `userActivityEventId` o `completionEventId`, cargarlos con repositorios que exijan la misma identidad y tenant. Rechazar referencias cruzadas antes de crear o mutar.
3. Separar una ruta de worker con rol técnico y una credencial de servicio si existen productores no interactivos; no reutilizar las rutas del portal con IDs arbitrarios.
4. Aplicar la misma comprobación antes de cerrar o marcar convertido un journey y documentar idempotencia de cada productor.

| Caso | Prueba propuesta | Preparación y entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | integración `telemetry.int-spec.ts` | Actor A registra evento para su sesión, sujeto y journey | `201`; fila con identidad y tenant derivados del servidor |
| Límite | servicio | Reintento de A con la misma clave de idempotencia y su journey abierto | Sin segunda fila; contador estable |
| Error | integración HTTP | Actor A envía `sessionJourneyId` o `analyticsSubjectId` de B | No cambia journey de B ni se inserta relación cruzada |
| Falla catalogada | integración HTTP | Actor A cierra el journey de B | `404/NOT_FOUND/TELEMETRY_JOURNEY_OUT_OF_SCOPE` |

### TEL-03 — Alta — La lista de propiedades gobernada no se aplica y valores arbitrarios pueden salir al proveedor externo

La entidad de esquema conserva `propertySchemaJson`, `prohibitedPropertyPatternsJson` y `phiAllowed` ([`activity_event_schema_definitions.entity.ts`](../../../src/modules/telemetry/entities/activity_event_schema_definitions.entity.ts#L39-L75)), pero la captura sólo usa el esquema para su propósito y nombre. Cada propiedad recibida se persiste sin contrastarla contra esos campos ([`telemetry-events.service.ts`](../../../src/modules/telemetry/services/telemetry-events.service.ts#L112-L194)). Luego `forwardableProperties` copia todos los pares nombre/valor al envío externo ([`telemetry-events.service.ts`](../../../src/modules/telemetry/services/telemetry-events.service.ts#L549-L584)); el mapper de GA4 únicamente normaliza tamaño y sintaxis, no aplica la gobernanza del esquema ([`google-analytics.mapper.ts`](../../../src/modules/telemetry/infrastructure/google-analytics/google-analytics.mapper.ts#L223-L266)).

El comentario del DTO promete «solo props permitidas por el esquema» ([`activity-event.dto.ts`](../../../src/modules/telemetry/dto/activity-event.dto.ts#L18-L26)), pero un cliente puede persistir `email`, un dato clínico u otra clave prohibida y, con el reenvío activo, entregarlo a un proveedor externo.

**Plan de corrección.**

1. Construir un validador de propiedades del evento que interprete la lista/categorías permitidas y los patrones prohibidos del esquema antes de crear la entidad.
2. Rechazar por defecto campos no declarados, valores incompatibles con su tipo y cualquier PHI/PII no autorizado; no confiar en `dataClassificationConceptId` enviado por el cliente.
3. Crear el objeto de reenvío desde el resultado validado y minimizado, no desde el DTO original. Mantener una allowlist específica para cada proveedor.
4. Registrar sólo nombre del esquema y razón catalogada de rechazo, nunca el valor sensible.

| Caso | Prueba propuesta | Preparación y entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | `telemetry-events.service.spec.ts` | Esquema permite `screen_name:string`; evento trae ese único campo | Se persiste y sólo ese campo puede llegar al puerto |
| Límite | servicio | 25 propiedades admitidas, valores en longitud máxima permitida | Se conserva el límite de proveedor sin truncar una clasificación prohibida |
| Error | servicio e integración | Evento incluye `email` o clave no incluida en el esquema | Transacción revierte; el puerto externo no recibe el evento |
| Falla catalogada | integración HTTP | Propiedad prohibida o PHI con `phiAllowed=false` | `422/VALIDATION_FAILED/TELEMETRY_EVENT_PROPERTY_NOT_ALLOWED` |

### TEL-04 — Alta — Las consultas administrativas ignoran el tenant que el guard resolvió

El `TenantScopeGuard` resuelve el tenant del request antes de roles ([`tenant-scope.guard.ts`](../../../src/common/auth/tenant-scope.guard.ts#L24-L53)) y `RolesGuard` usa ese valor para los roles con ámbito ([`roles.guard.ts`](../../../src/common/auth/roles.guard.ts#L58-L86)). Sin embargo, los controladores de analítica no reciben actor ni tenant ([`telemetry-analytics.controller.ts`](../../../src/modules/telemetry/controllers/telemetry-analytics.controller.ts#L118-L193)); `AnalyticsScope` sólo lleva ventana y portal ([`telemetry-analytics.repository.ts`](../../../src/modules/telemetry/repositories/telemetry-analytics.repository.ts#L5-L39)). Las consultas de overview, series, vitales, sesiones y salud filtran sólo por tiempo/portal y leen toda `telemetry.user_activity_events` o `client_contexts` ([`telemetry-analytics.repository.ts`](../../../src/modules/telemetry/repositories/telemetry-analytics.repository.ts#L42-L83), [`telemetry-analytics.repository.ts`](../../../src/modules/telemetry/repositories/telemetry-analytics.repository.ts#L309-L347)).

Por tanto un `MARKETING_MANAGER`, `DPO` u otro rol asignado únicamente al tenant A pasa el guard con `X-Tenant-Id: A`, pero recibe agregados, rutas, sesiones y timeline de todos los tenants. Las tablas de sesión y contexto tampoco tienen tenant propio, por lo que el filtro debe derivarse mediante la relación con eventos/sesiones antes de exponerlas.

**Plan de corrección.**

1. Pasar tenant resuelto y actor al servicio; hacer explícito si `SUPERADMIN`/`SYSTEM` pueden pedir un barrido global y exigir una marca de alcance para ello.
2. Extender `AnalyticsScope` con `tenantId` y añadir predicado de tenant a todas las queries de eventos, conversiones y embudos que lo admitan.
3. Para sesiones, contextos y vitales sin tenant, unir contra eventos (o materializar tenant en una migración con índice) y verificar que una sesión no mezcle tenants antes de listarla.
4. Añadir un test de integración con datos homónimos en dos tenants para cada endpoint de lectura y para el timeline.

| Caso | Prueba propuesta | Preparación y entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | integración `telemetry-analytics.int-spec.ts` | Manager de A consulta overview con datos en A y B | `200` con conteos, rutas y eventos sólo de A |
| Límite | integración | Ventana de 92 días y portal WEB con datos de A en ambos extremos | Incluye sólo eventos de A dentro de `[from,to)` |
| Error | integración | Manager de A pide `sessions/:id` cuyo journey pertenece sólo a B | No revela timestamps, rutas ni nombres de propiedades |
| Falla catalogada | integración HTTP | Lectura por UUID de sesión fuera de A | `404/NOT_FOUND/TELEMETRY_SESSION_OUT_OF_SCOPE` |

## Matriz de cobertura pendiente

| Superficie | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Gobernanza de propósitos, esquemas, disclosure y funnels | `SECURITY_ADMIN` crea relaciones válidas | versión consecutiva y ventana efectiva | referencia inexistente/duplicada | `404/NOT_FOUND` o `409/CONFLICT` con `reason` del módulo |
| Consentimiento y disclosure | titular gestiona su decisión | repetición idempotente | propósito no exige consentimiento | `422/PRECONDITION_FAILED/TELEMETRY_CONSENT_NOT_ACTIVE` |
| Eventos, contexto, vitals, conversión y cierre | productor autorizado usa sus referencias | reintento/concurrencia | referencia de otro actor o tenant | `404/NOT_FOUND/TELEMETRY_*_OUT_OF_SCOPE` |
| Analítica administrativa | rol de A ve sólo A | ventana/portal/cursor máximos | ruta, sesión o cursor fuera de alcance | `404/NOT_FOUND/TELEMETRY_SESSION_OUT_OF_SCOPE` |

## Catálogo de errores y olas

El módulo no tiene un catálogo propio de `reason`; los errores de negocio actuales sólo adjuntan IDs o mensajes. Añadir `TELEMETRY_CONSENT_NOT_OWNED`, `TELEMETRY_ACT_AS_USER_FORBIDDEN`, `TELEMETRY_JOURNEY_OUT_OF_SCOPE`, `TELEMETRY_EVENT_REFERENCE_OUT_OF_SCOPE`, `TELEMETRY_EVENT_PROPERTY_NOT_ALLOWED` y `TELEMETRY_SESSION_OUT_OF_SCOPE`, todos con `ErrorCode` estable y prueba de `status + code + details.reason`.

| Ola | Trabajo | Esfuerzo |
| --- | --- | --- |
| 0 | TEL-01 y TEL-02: identidad derivada, propiedad y rutas de worker separadas | M |
| 0 | TEL-03: allowlist y bloqueo de PHI antes de persistir/reexpedir | M |
| 1 | TEL-04: scope de tenant en SQL, backfill/materialización si es necesaria | L |
| 1 | Integración HTTP de dos usuarios/dos tenants y catálogo de reasons | M |

## Trabajo pendiente de integrar

No se identificó un commit pendiente específico para `telemetry` en la tabla del plan de revisión.
