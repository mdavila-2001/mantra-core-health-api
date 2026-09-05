<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `clinical_ext`

Referencia exhaustiva de 26 operación(es) del módulo `clinical_ext`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `clinical-ext-alerts`, `clinical-ext-care-gaps`, `clinical-ext-care-teams`, `clinical-ext-cds`, `clinical-ext-order-sets`, `clinical-ext-prescription-favorites`, `clinical-ext-referrals`, `clinical-ext-virtual-encounters`
- **Controladores:** `CareGapsController`, `CareTeamsController`, `CdsController`, `ClinicalAlertsController`, `OrderSetsController`, `PrescriptionFavoritesController`, `ReferralsController`, `VirtualEncountersController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [PATCH /care-gaps/{id}/close](#1-patch-care-gaps-id-close) — Cerrar una brecha de cuidado por evento clínico
2. [POST /care-gaps/recompute](#2-post-care-gaps-recompute) — Detectar y abrir brechas de cuidado (batch)
3. [GET /care-teams](#3-get-care-teams) — Listar equipos de cuidado de un paciente
4. [POST /care-teams](#4-post-care-teams) — Crear un equipo de cuidado con sus miembros
5. [PATCH /care-teams/{id}/members/{memberId}/set-responsible](#5-patch-care-teams-id-members-memberid-set-responsible) — Designar miembro responsable (transferir liderazgo)
6. [POST /cds-rules](#6-post-cds-rules) — Crear una regla CDS en borrador
7. [POST /cds-rules/{id}/versions/publish](#7-post-cds-rules-id-versions-publish) — Publicar una versión de la regla CDS
8. [POST /cds-rules/{id}/versions/rollback](#8-post-cds-rules-id-versions-rollback) — Rollback de la versión activa de la regla CDS
9. [POST /cds/check-interactions](#9-post-cds-check-interactions) — Detectar interacciones medicamentosas al prescribir
10. [POST /cds/evaluate](#10-post-cds-evaluate) — Evaluar reglas CDS y generar alertas
11. [PATCH /clinical-alerts/{id}/acknowledge](#11-patch-clinical-alerts-id-acknowledge) — Reconocer una alerta clínica
12. [PATCH /clinical-alerts/{id}/override](#12-patch-clinical-alerts-id-override) — Override (sobreescribir) una alerta clínica
13. [POST /drug-interactions](#13-post-drug-interactions) — Registrar un par de interacción medicamentosa
14. [POST /immunization-schedules](#14-post-immunization-schedules) — Registrar una dosis del calendario de inmunización
15. [POST /order-sets](#15-post-order-sets) — Crear una plantilla de órdenes (order set) con sus ítems
16. [POST /order-sets/{id}/apply](#16-post-order-sets-id-apply) — Aplicar un order set (fan-out de órdenes)
17. [POST /patients/{id}/immunization-plan/project](#17-post-patients-id-immunization-plan-project) — Proyectar el plan de inmunización y abrir brechas
18. [GET /prescription-favorites](#18-get-prescription-favorites) — Listar mis favoritos de prescripción
19. [POST /prescription-favorites](#19-post-prescription-favorites) — Guardar un favorito de prescripción
20. [DELETE /prescription-favorites/{id}](#20-delete-prescription-favorites-id) — Borrar un favorito de prescripción propio
21. [GET /referrals](#21-get-referrals) — Listar derivaciones de un paciente
22. [POST /referrals](#22-post-referrals) — Emitir una referencia desde un encuentro
23. [PATCH /referrals/{id}/respond](#23-patch-referrals-id-respond) — Responder / aceptar una referencia inter-tenant
24. [POST /virtual-encounters](#24-post-virtual-encounters) — Iniciar una sesión de telesalud
25. [PATCH /virtual-encounters/{id}/end](#25-patch-virtual-encounters-id-end) — Finalizar una sesión de telesalud
26. [PATCH /virtual-encounters/{id}/join](#26-patch-virtual-encounters-id-join) — Unirse a una sesión de telesalud

---

## 1. PATCH /care-gaps/{id}/close

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-care-gaps`
- **Nombre:** Cerrar una brecha de cuidado por evento clínico
- **Operation ID:** `CareGapsController_close`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareGapsController.close](../../src/modules/clinical_ext/controllers/care-gaps.controller.ts)

### Descripción de negocio

Cerrar una brecha de cuidado por evento clínico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /care-gaps/{id}/close` en `CareGapsController_close`. El controlador delega en `CareGapsService.close`. Valida el body como `CloseCareGapDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseCareGapDto`; los campos opcionales se omiten.

```http
PATCH /care-gaps/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `closedByResourceType` | No | `string` | longitud máxima 100 | Tipo de recurso que cierra la brecha | `valor-ejemplo` |
| `closedByResourceId` | No | `string` | formato `uuid` | Id del recurso que cierra la brecha | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /care-gaps/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "closedByResourceType": "valor-ejemplo",
  "closedByResourceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Brecha de cuidado no encontrada | Excepción explícita en src/modules/clinical_ext/services/care-gaps.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La brecha no está abierta | Excepción explícita en src/modules/clinical_ext/services/care-gaps.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-gaps/{id}/close"
}
```

---

## 2. POST /care-gaps/recompute

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-care-gaps`
- **Nombre:** Detectar y abrir brechas de cuidado (batch)
- **Operation ID:** `CareGapsController_recompute`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareGapsController.recompute](../../src/modules/clinical_ext/controllers/care-gaps.controller.ts)

### Descripción de negocio

Detectar y abrir brechas de cuidado (batch). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /care-gaps/recompute` en `CareGapsController_recompute`. El controlador delega en `CareGapsService.recompute`. Valida el body como `RecomputeCareGapsDto` y consume `application/json`. El tipo de retorno estático es `Promise<RecomputeCareGapsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecomputeCareGapsDto`; los campos opcionales se omiten.

```http
POST /care-gaps/recompute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "gaps": [
    {
      "gapTypeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `gaps` | Sí | `array<CareGapInputDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"gapTypeConceptId":"00000000-0000-4000-8000-000000000001","measureConceptId":"00000000-0000-4000-8000-000000000001","dueDate":"2026-07-31"}]` |
| `gaps[].gapTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de brecha (concept id) | `00000000-0000-4000-8000-000000000001` |
| `gaps[].measureConceptId` | No | `string` | formato `uuid` | Medida de calidad / vacuna (concept id) | `00000000-0000-4000-8000-000000000001` |
| `gaps[].dueDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-gaps/recompute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "gaps": [
    {
      "gapTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "measureConceptId": "00000000-0000-4000-8000-000000000001",
      "dueDate": "2026-07-31"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RecomputeCareGapsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RecomputeCareGapsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "opened": 1,
  "skipped": 1,
  "openedIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `opened` | Sí | `number` | Sin restricción adicional declarada | Nº de brechas abiertas nuevas | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Nº de brechas ya abiertas que se dejaron intactas | `1` |
| `openedIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de las brechas abiertas en esta corrida | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-gaps/recompute"
}
```

---

## 3. GET /care-teams

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-care-teams`
- **Nombre:** Listar equipos de cuidado de un paciente
- **Operation ID:** `CareTeamsController_listByPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareTeamsController.listByPatient](../../src/modules/clinical_ext/controllers/care-teams.controller.ts)

### Descripción de negocio

Listar equipos de cuidado de un paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La lectura que faltaba: equipos de cuidado de un paciente. El módulo tenía escrituras y ninguna lectura, así que lo que se registraba no se podía volver a mirar — y ninguna pantalla podía mostrarlo.

### Descripción del sistema

NestJS resuelve `GET /care-teams` en `CareTeamsController_listByPatient`. El controlador delega en `CareTeamsService.listByPatient`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-teams?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /care-teams?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-teams"
}
```

---

## 4. POST /care-teams

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-care-teams`
- **Nombre:** Crear un equipo de cuidado con sus miembros
- **Operation ID:** `CareTeamsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareTeamsController.create](../../src/modules/clinical_ext/controllers/care-teams.controller.ts)

### Descripción de negocio

Crear un equipo de cuidado con sus miembros. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /care-teams` en `CareTeamsController_create`. El controlador delega en `CareTeamsService.create`. Valida el body como `CreateCareTeamDto` y consume `application/json`. El tipo de retorno estático es `Promise<CareTeamResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCareTeamDto`; los campos opcionales se omiten.

```http
POST /care-teams HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "members": [
    {
      "memberRoleConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente del equipo | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Tenant custodio | `00000000-0000-4000-8000-000000000001` |
| `episodeId` | No | `string` | formato `uuid` | Episodio de cuidado | `00000000-0000-4000-8000-000000000001` |
| `name` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría del equipo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `members` | Sí | `array<CareTeamMemberInputDto>` | mínimo 1 elemento(s) | Miembros iniciales del equipo | `[{"practitionerProfileId":"00000000-0000-4000-8000-000000000001","relatedPersonId":"00000000-0000-4000-8000-000000000001","memberRoleConceptId":"00000000-0000-4000-8000-000000000001","isResponsible":true}]` |
| `members[].practitionerProfileId` | No | `string` | formato `uuid` | Profesional de salud | `00000000-0000-4000-8000-000000000001` |
| `members[].relatedPersonId` | No | `string` | formato `uuid` | Persona relacionada (cuidador) | `00000000-0000-4000-8000-000000000001` |
| `members[].memberRoleConceptId` | Sí | `string` | formato `uuid` | Rol del miembro (concept id) | `00000000-0000-4000-8000-000000000001` |
| `members[].isResponsible` | No | `boolean` | Sin restricción adicional declarada | Marca al miembro como responsable del equipo | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-teams HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "episodeId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "relatedPersonId": "00000000-0000-4000-8000-000000000001",
      "memberRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "isResponsible": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CareTeamResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CareTeamResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CareTeamResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CareTeamResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CareTeamResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CareTeamResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CareTeamResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CareTeamResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CareTeamResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareTeamResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "members": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "memberRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "isResponsible": true
    }
  ],
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado del equipo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `members` | Sí | `array<CareTeamMemberResponseDto>` | Sin restricción adicional declarada | Valor de members mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","memberRoleConceptId":"00000000-0000-4000-8000-000000000001","isResponsible":true}]` |
| `members[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `members[].memberRoleConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a member role concept. | `00000000-0000-4000-8000-000000000001` |
| `members[].isResponsible` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is responsible mantenido por la instancia. | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | A lo sumo un miembro puede ser responsable | Excepción explícita en src/modules/clinical_ext/services/care-teams.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-teams"
}
```

---

## 5. PATCH /care-teams/{id}/members/{memberId}/set-responsible

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-care-teams`
- **Nombre:** Designar miembro responsable (transferir liderazgo)
- **Operation ID:** `CareTeamsController_setResponsible`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareTeamsController.setResponsible](../../src/modules/clinical_ext/controllers/care-teams.controller.ts)

### Descripción de negocio

Designar miembro responsable (transferir liderazgo). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /care-teams/{id}/members/{memberId}/set-responsible` en `CareTeamsController_setResponsible`. El controlador delega en `CareTeamsService.setResponsible`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `memberId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
PATCH /care-teams/00000000-0000-4000-8000-000000000001/members/00000000-0000-4000-8000-000000000001/set-responsible HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`, `memberId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
PATCH /care-teams/00000000-0000-4000-8000-000000000001/members/00000000-0000-4000-8000-000000000001/set-responsible HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Equipo de cuidado no encontrado | Excepción explícita en src/modules/clinical_ext/services/care-teams.service.ts |
| 404 | `NOT_FOUND` | Miembro no encontrado en el equipo | Excepción explícita en src/modules/clinical_ext/services/care-teams.service.ts |
| 422 | `PRECONDITION_FAILED` | El equipo no está activo | Excepción explícita en src/modules/clinical_ext/services/care-teams.service.ts |
| 422 | `PRECONDITION_FAILED` | El miembro destino no está activo | Excepción explícita en src/modules/clinical_ext/services/care-teams.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-teams/{id}/members/{memberId}/set-responsible"
}
```

---

## 6. POST /cds-rules

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-cds`
- **Nombre:** Crear una regla CDS en borrador
- **Operation ID:** `CdsController_createRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CdsController.createRule](../../src/modules/clinical_ext/controllers/cds.controller.ts)

### Descripción de negocio

Crear una regla CDS en borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea una regla CDS en borrador (precondición de UC-18-13).

### Descripción del sistema

NestJS resuelve `POST /cds-rules` en `CdsController_createRule`. El controlador delega en `CdsService.createRule`. Valida el body como `CreateCdsRuleDto` y consume `application/json`. El tipo de retorno estático es `Promise<CdsRuleResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCdsRuleDto`; los campos opcionales se omiten.

```http
POST /cds-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario (null = global) | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `ruleTypeConceptId` | No | `string` | formato `uuid` | Tipo de regla (concept id) | `00000000-0000-4000-8000-000000000001` |
| `severityConceptId` | No | `string` | formato `uuid` | Severidad de la alerta que genera (concept id) | `00000000-0000-4000-8000-000000000001` |
| `logicJson` | No | `object` | Sin restricción adicional declarada | Lógica de la regla (JSON) | `{}` |
| `messageTemplate` | No | `string` | Sin restricción adicional declarada | Plantilla del mensaje de alerta | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /cds-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "ruleTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "logicJson": {},
  "messageTemplate": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CdsRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": 1,
  "isActive": true,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de regla ya existe | Excepción explícita en src/modules/clinical_ext/services/cds.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/cds-rules"
}
```

---

## 7. POST /cds-rules/{id}/versions/publish

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-cds`
- **Nombre:** Publicar una versión de la regla CDS
- **Operation ID:** `CdsController_publish`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CdsController.publish](../../src/modules/clinical_ext/controllers/cds.controller.ts)

### Descripción de negocio

Publicar una versión de la regla CDS. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-18-13 (publish).

### Descripción del sistema

NestJS resuelve `POST /cds-rules/{id}/versions/publish` en `CdsController_publish`. El controlador delega en `CdsService.publishVersion`. Valida el body como `PublishRuleVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CdsRuleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishRuleVersionDto`; los campos opcionales se omiten.

```http
POST /cds-rules/00000000-0000-4000-8000-000000000001/versions/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `logicJson` | No | `object` | Sin restricción adicional declarada | Nueva lógica de la regla (JSON) | `{}` |
| `messageTemplate` | No | `string` | Sin restricción adicional declarada | Nueva plantilla del mensaje | `valor-ejemplo` |
| `severityConceptId` | No | `string` | formato `uuid` | Nueva severidad (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /cds-rules/00000000-0000-4000-8000-000000000001/versions/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "logicJson": {},
  "messageTemplate": "valor-ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CdsRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": 1,
  "isActive": true,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Regla CDS no encontrada | Excepción explícita en src/modules/clinical_ext/services/cds.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/cds-rules/{id}/versions/publish"
}
```

---

## 8. POST /cds-rules/{id}/versions/rollback

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-cds`
- **Nombre:** Rollback de la versión activa de la regla CDS
- **Operation ID:** `CdsController_rollback`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CdsController.rollback](../../src/modules/clinical_ext/controllers/cds.controller.ts)

### Descripción de negocio

Rollback de la versión activa de la regla CDS. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-18-13 (rollback).

### Descripción del sistema

NestJS resuelve `POST /cds-rules/{id}/versions/rollback` en `CdsController_rollback`. El controlador delega en `CdsService.rollbackVersion`. No recibe body. El tipo de retorno estático es `Promise<CdsRuleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /cds-rules/00000000-0000-4000-8000-000000000001/versions/rollback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /cds-rules/00000000-0000-4000-8000-000000000001/versions/rollback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CdsRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CdsRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": 1,
  "isActive": true,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Regla CDS no encontrada | Excepción explícita en src/modules/clinical_ext/services/cds.service.ts |
| 422 | `PRECONDITION_FAILED` | Solo se puede hacer rollback de una regla activa | Excepción explícita en src/modules/clinical_ext/services/cds.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/cds-rules/{id}/versions/rollback"
}
```

---

## 9. POST /cds/check-interactions

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-cds`
- **Nombre:** Detectar interacciones medicamentosas al prescribir
- **Operation ID:** `CdsController_checkInteractions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CdsController.checkInteractions](../../src/modules/clinical_ext/controllers/cds.controller.ts)

### Descripción de negocio

Detectar interacciones medicamentosas al prescribir. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /cds/check-interactions` en `CdsController_checkInteractions`. El controlador delega en `CdsService.checkInteractions`. Valida el body como `CheckInteractionsDto` y consume `application/json`. El tipo de retorno estático es `Promise<AlertBatchResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CheckInteractionsDto`; los campos opcionales se omiten.

```http
POST /cds/check-interactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicationRequestId` | No | `string` | formato `uuid` | Prescripción en borrador que se evalúa | `00000000-0000-4000-8000-000000000001` |
| `substanceConceptIds` | Sí | `array<string>` | formato `uuid`; mínimo 2 elemento(s) | Concept ids de las sustancias activas + la nueva a prescribir | `["valor-ejemplo","valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /cds/check-interactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AlertBatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "alerts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "alertTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "severityConceptId": "00000000-0000-4000-8000-000000000001",
      "ruleId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `alerts` | Sí | `array<GeneratedAlertDto>` | Sin restricción adicional declarada | Valor de alerts mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","alertTypeConceptId":"00000000-0000-4000-8000-000000000001","severityConceptId":"00000000-0000-4000-8000-000000000001","ruleId":"00000000-0000-4000-8000-000000000001"}]` |
| `alerts[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `alerts[].alertTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a alert type concept. | `00000000-0000-4000-8000-000000000001` |
| `alerts[].severityConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a severity concept. | `00000000-0000-4000-8000-000000000001` |
| `alerts[].ruleId` | No | `string` | formato `uuid` | Identificador asociado a rule. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Nº de alertas generadas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/cds/check-interactions"
}
```

---

## 10. POST /cds/evaluate

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-cds`
- **Nombre:** Evaluar reglas CDS y generar alertas
- **Operation ID:** `CdsController_evaluate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CdsController.evaluate](../../src/modules/clinical_ext/controllers/cds.controller.ts)

### Descripción de negocio

Evaluar reglas CDS y generar alertas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /cds/evaluate` en `CdsController_evaluate`. El controlador delega en `CdsService.evaluate`. Valida el body como `EvaluateCdsDto` y consume `application/json`. El tipo de retorno estático es `Promise<AlertBatchResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EvaluateCdsDto`; los campos opcionales se omiten.

```http
POST /cds/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant de las reglas a evaluar | `00000000-0000-4000-8000-000000000001` |
| `sourceResourceType` | No | `string` | longitud máxima 100 | Tipo del recurso disparador (p.ej. allergy_intolerance) | `valor-ejemplo` |
| `sourceResourceId` | No | `string` | formato `uuid` | Id del recurso disparador | `00000000-0000-4000-8000-000000000001` |
| `medicationConceptIds` | No | `array<string>` | formato `uuid` | Concept ids de los medicamentos activos del paciente (contexto de evaluación) | `["valor-ejemplo"]` |
| `observations` | No | `array<CdsObservationInputDto>` | Sin restricción adicional declarada | Observaciones del paciente (contexto de evaluación) | `[{"codeConceptId":"00000000-0000-4000-8000-000000000001","valueNumber":1}]` |
| `observations[].codeConceptId` | No | `string` | formato `uuid` | Código de la observación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `observations[].valueNumber` | No | `number` | Sin restricción adicional declarada | Valor numérico observado (p.ej. glucemia) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /cds/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceResourceType": "valor-ejemplo",
  "sourceResourceId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptIds": [
    "valor-ejemplo"
  ],
  "observations": [
    {
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "valueNumber": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AlertBatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AlertBatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "alerts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "alertTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "severityConceptId": "00000000-0000-4000-8000-000000000001",
      "ruleId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `alerts` | Sí | `array<GeneratedAlertDto>` | Sin restricción adicional declarada | Valor de alerts mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","alertTypeConceptId":"00000000-0000-4000-8000-000000000001","severityConceptId":"00000000-0000-4000-8000-000000000001","ruleId":"00000000-0000-4000-8000-000000000001"}]` |
| `alerts[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `alerts[].alertTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a alert type concept. | `00000000-0000-4000-8000-000000000001` |
| `alerts[].severityConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a severity concept. | `00000000-0000-4000-8000-000000000001` |
| `alerts[].ruleId` | No | `string` | formato `uuid` | Identificador asociado a rule. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Nº de alertas generadas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/cds/evaluate"
}
```

---

## 11. PATCH /clinical-alerts/{id}/acknowledge

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-alerts`
- **Nombre:** Reconocer una alerta clínica
- **Operation ID:** `ClinicalAlertsController_acknowledge`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalAlertsController.acknowledge](../../src/modules/clinical_ext/controllers/clinical-alerts.controller.ts)

### Descripción de negocio

Reconocer una alerta clínica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-18-05 (acknowledge).

### Descripción del sistema

NestJS resuelve `PATCH /clinical-alerts/{id}/acknowledge` en `ClinicalAlertsController_acknowledge`. El controlador delega en `ClinicalAlertsService.acknowledge`. No recibe body. El tipo de retorno estático es `Promise<ClinicalAlertResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
PATCH /clinical-alerts/00000000-0000-4000-8000-000000000001/acknowledge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
PATCH /clinical-alerts/00000000-0000-4000-8000-000000000001/acknowledge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClinicalAlertResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "overriddenAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la alerta (concept id) | `00000000-0000-4000-8000-000000000001` |
| `overriddenAt` | No | `string` | formato `date-time` | Valor de overridden at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Alerta clínica no encontrada | Excepción explícita en src/modules/clinical_ext/services/clinical-alerts.service.ts |
| 422 | `PRECONDITION_FAILED` | La alerta no está activa | Excepción explícita en src/modules/clinical_ext/services/clinical-alerts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical-alerts/{id}/acknowledge"
}
```

---

## 12. PATCH /clinical-alerts/{id}/override

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-alerts`
- **Nombre:** Override (sobreescribir) una alerta clínica
- **Operation ID:** `ClinicalAlertsController_override`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalAlertsController.override](../../src/modules/clinical_ext/controllers/clinical-alerts.controller.ts)

### Descripción de negocio

Override (sobreescribir) una alerta clínica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-18-05 (override).

### Descripción del sistema

NestJS resuelve `PATCH /clinical-alerts/{id}/override` en `ClinicalAlertsController_override`. El controlador delega en `ClinicalAlertsService.override`. Valida el body como `OverrideAlertDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClinicalAlertResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OverrideAlertDto`; los campos opcionales se omiten.

```http
PATCH /clinical-alerts/00000000-0000-4000-8000-000000000001/override HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 1000 | Motivo del override (obligatorio para alertas de alta severidad) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /clinical-alerts/00000000-0000-4000-8000-000000000001/override HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClinicalAlertResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClinicalAlertResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "overriddenAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la alerta (concept id) | `00000000-0000-4000-8000-000000000001` |
| `overriddenAt` | No | `string` | formato `date-time` | Valor de overridden at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Alerta clínica no encontrada | Excepción explícita en src/modules/clinical_ext/services/clinical-alerts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El override de una alerta de alta severidad requiere un motivo | Excepción explícita en src/modules/clinical_ext/services/clinical-alerts.service.ts |
| 422 | `PRECONDITION_FAILED` | La alerta no está activa | Excepción explícita en src/modules/clinical_ext/services/clinical-alerts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical-alerts/{id}/override"
}
```

---

## 13. POST /drug-interactions

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-cds`
- **Nombre:** Registrar un par de interacción medicamentosa
- **Operation ID:** `CdsController_createDrugInteraction`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CdsController.createDrugInteraction](../../src/modules/clinical_ext/controllers/cds.controller.ts)

### Descripción de negocio

Registrar un par de interacción medicamentosa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Alta de dato de referencia de interacción (alimenta UC-18-04).

### Descripción del sistema

NestJS resuelve `POST /drug-interactions` en `CdsController_createDrugInteraction`. El controlador delega en `CdsService.createDrugInteraction`. Valida el body como `CreateDrugInteractionDto` y consume `application/json`. El tipo de retorno estático es `Promise<{ /** * Identificador único de la instancia. */ id: string; }>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDrugInteractionDto`; los campos opcionales se omiten.

```http
POST /drug-interactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "substanceAConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceBConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `substanceAConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substanceBConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `severityConceptId` | No | `string` | formato `uuid` | Severidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `mechanismText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `managementText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /drug-interactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "substanceAConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceBConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "mechanismText": "valor-ejemplo",
  "managementText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 400 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 413 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** * Identificador único de la instancia. */ id: string; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/drug-interactions"
}
```

---

## 14. POST /immunization-schedules

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-care-gaps`
- **Nombre:** Registrar una dosis del calendario de inmunización
- **Operation ID:** `CareGapsController_createSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareGapsController.createSchedule](../../src/modules/clinical_ext/controllers/care-gaps.controller.ts)

### Descripción de negocio

Registrar una dosis del calendario de inmunización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Alta de dosis del calendario de inmunización (alimenta UC-18-11).

### Descripción del sistema

NestJS resuelve `POST /immunization-schedules` en `CareGapsController_createSchedule`. El controlador delega en `CareGapsService.createSchedule`. Valida el body como `CreateImmunizationScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<{ /** * Identificador único de la instancia. */ id: string; }>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateImmunizationScheduleDto`; los campos opcionales se omiten.

```http
POST /immunization-schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `vaccineConceptId` | Sí | `string` | formato `uuid` | Vacuna (concept id) | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `recommendedAgeDays` | No | `number` | Sin restricción adicional declarada | Edad recomendada en días desde el nacimiento | `1` |
| `doseNumber` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `intervalDays` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /immunization-schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "recommendedAgeDays": 1,
  "doseNumber": 1,
  "intervalDays": 1,
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 400 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 413 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** * Identificador único de la instancia. */ id: string; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/immunization-schedules"
}
```

---

## 15. POST /order-sets

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-order-sets`
- **Nombre:** Crear una plantilla de órdenes (order set) con sus ítems
- **Operation ID:** `OrderSetsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrderSetsController.create](../../src/modules/clinical_ext/controllers/order-sets.controller.ts)

### Descripción de negocio

Crear una plantilla de órdenes (order set) con sus ítems. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea una plantilla de órdenes (precondición de UC-18-06).

### Descripción del sistema

NestJS resuelve `POST /order-sets` en `OrderSetsController_create`. El controlador delega en `OrderSetsService.create`. Valida el body como `CreateOrderSetDto` y consume `application/json`. El tipo de retorno estático es `Promise<OrderSetResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateOrderSetDto`; los campos opcionales se omiten.

```http
POST /order-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "items": [
    {
      "codeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<OrderSetItemInputDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"itemTypeConceptId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","defaultDoseText":"valor-ejemplo","defaultFrequencyText":"valor-ejemplo","isSelectedDefault":true,"ordinal":1}]` |
| `items[].itemTypeConceptId` | No | `string` | formato `uuid` | Tipo de ítem (concept id) | `00000000-0000-4000-8000-000000000001` |
| `items[].codeConceptId` | Sí | `string` | formato `uuid` | Código de la orden (concept id) | `00000000-0000-4000-8000-000000000001` |
| `items[].defaultDoseText` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].defaultFrequencyText` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].isSelectedDefault` | No | `boolean` | Sin restricción adicional declarada | Seleccionado por defecto al aplicar | `true` |
| `items[].ordinal` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /order-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "itemTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "defaultDoseText": "valor-ejemplo",
      "defaultFrequencyText": "valor-ejemplo",
      "isSelectedDefault": true,
      "ordinal": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OrderSetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OrderSetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OrderSetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OrderSetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OrderSetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OrderSetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OrderSetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OrderSetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OrderSetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OrderSetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": 1,
  "itemCount": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |
| `itemCount` | Sí | `number` | Sin restricción adicional declarada | Nº de ítems creados | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de order set ya existe | Excepción explícita en src/modules/clinical_ext/services/order-sets.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/order-sets"
}
```

---

## 16. POST /order-sets/{id}/apply

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-order-sets`
- **Nombre:** Aplicar un order set (fan-out de órdenes)
- **Operation ID:** `OrderSetsController_apply`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrderSetsController.apply](../../src/modules/clinical_ext/controllers/order-sets.controller.ts)

### Descripción de negocio

Aplicar un order set (fan-out de órdenes). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /order-sets/{id}/apply` en `OrderSetsController_apply`. El controlador delega en `OrderSetsService.apply`. Valida el body como `ApplyOrderSetDto` y consume `application/json`. El tipo de retorno estático es `Promise<ApplyOrderSetResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyOrderSetDto`; los campos opcionales se omiten.

```http
POST /order-sets/00000000-0000-4000-8000-000000000001/apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `encounterId` | Sí | `string` | formato `uuid` | Encuentro clínico abierto | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio de las órdenes derivadas; si se omite, se usa el del order set | `00000000-0000-4000-8000-000000000001` |
| `selectedItemIds` | No | `array<string>` | formato `uuid` | Ítems seleccionados explícitamente; si se omite, se usan los default | `["valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /order-sets/00000000-0000-4000-8000-000000000001/apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "selectedItemIds": [
    "valor-ejemplo"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ApplyOrderSetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ApplyOrderSetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "orderSetId": "00000000-0000-4000-8000-000000000001",
  "appliedOrders": [
    {
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "orderSetItemId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "doseText": "valor-ejemplo",
      "frequencyText": "valor-ejemplo"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `orderSetId` | Sí | `string` | formato `uuid` | Identificador asociado a order set. | `00000000-0000-4000-8000-000000000001` |
| `appliedOrders` | Sí | `array<AppliedOrderDto>` | Sin restricción adicional declarada | Valor de applied orders mantenido por la instancia. | `[{"serviceRequestId":"00000000-0000-4000-8000-000000000001","orderSetItemId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","doseText":"valor-ejemplo","frequencyText":"valor-ejemplo"}]` |
| `appliedOrders[].serviceRequestId` | Sí | `string` | formato `uuid` | Service request persistido para este ítem | `00000000-0000-4000-8000-000000000001` |
| `appliedOrders[].orderSetItemId` | Sí | `string` | formato `uuid` | Identificador asociado a order set item. | `00000000-0000-4000-8000-000000000001` |
| `appliedOrders[].codeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a code concept. | `00000000-0000-4000-8000-000000000001` |
| `appliedOrders[].doseText` | No | `string` | Sin restricción adicional declarada | Valor de dose text mantenido por la instancia. | `valor-ejemplo` |
| `appliedOrders[].frequencyText` | No | `string` | Sin restricción adicional declarada | Valor de frequency text mantenido por la instancia. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Nº de órdenes generadas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Order set no encontrado | Excepción explícita en src/modules/clinical_ext/services/order-sets.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El order set no está activo | Excepción explícita en src/modules/clinical_ext/services/order-sets.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay ítems seleccionados para aplicar | Excepción explícita en src/modules/clinical_ext/services/order-sets.service.ts |
| 422 | `PRECONDITION_FAILED` | Se requiere tenant custodio para materializar las órdenes del order set | Excepción explícita en src/modules/clinical_ext/services/order-sets.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/order-sets/{id}/apply"
}
```

---

## 17. POST /patients/{id}/immunization-plan/project

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-care-gaps`
- **Nombre:** Proyectar el plan de inmunización y abrir brechas
- **Operation ID:** `CareGapsController_projectImmunizationPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareGapsController.projectImmunizationPlan](../../src/modules/clinical_ext/controllers/care-gaps.controller.ts)

### Descripción de negocio

Proyectar el plan de inmunización y abrir brechas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /patients/{id}/immunization-plan/project` en `CareGapsController_projectImmunizationPlan`. El controlador delega en `CareGapsService.projectImmunizationPlan`. Valida el body como `ProjectImmunizationPlanDto` y consume `application/json`. El tipo de retorno estático es `Promise<ImmunizationPlanResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProjectImmunizationPlanDto`; los campos opcionales se omiten.

```http
POST /patients/00000000-0000-4000-8000-000000000001/immunization-plan/project HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "birthDate": "2026-07-31"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `birthDate` | Sí | `string` | formato `date` | Fecha de nacimiento del paciente | `2026-07-31` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción del calendario (concept id) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant del calendario | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /patients/00000000-0000-4000-8000-000000000001/immunization-plan/project HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "birthDate": "2026-07-31",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImmunizationPlanResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImmunizationPlanResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "gapsOpened": 1,
  "dosesEvaluated": 1,
  "openedIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `gapsOpened` | Sí | `number` | Sin restricción adicional declarada | Nº de brechas de dosis abiertas | `1` |
| `dosesEvaluated` | Sí | `number` | Sin restricción adicional declarada | Nº de dosis del calendario evaluadas | `1` |
| `openedIds` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de opened ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/patients/{id}/immunization-plan/project"
}
```

---

## 18. GET /prescription-favorites

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-prescription-favorites`
- **Nombre:** Listar mis favoritos de prescripción
- **Operation ID:** `PrescriptionFavoritesController_listOwn`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrescriptionFavoritesController.listOwn](../../src/modules/clinical_ext/controllers/prescription-favorites.controller.ts)

### Descripción de negocio

Devuelve la lista completa del profesional de la sesión, ordenada por rótulo: es una lista personal y corta que el cliente consume entera.

Contexto declarado en el controlador: La lista personal completa, ordenada por rótulo.

### Descripción del sistema

NestJS resuelve `GET /prescription-favorites` en `PrescriptionFavoritesController_listOwn`. El controlador delega en `PrescriptionFavoritesService.listOwn`. No recibe body. El tipo de retorno estático es `Promise<PrescriptionFavoriteResponseDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /prescription-favorites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /prescription-favorites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PrescriptionFavoriteResponseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PrescriptionFavoriteResponseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PrescriptionFavoriteResponseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PrescriptionFavoriteResponseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PrescriptionFavoriteResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrescriptionFavoriteResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "name": "Nombre de ejemplo",
    "medicationConceptId": "00000000-0000-4000-8000-000000000001",
    "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
    "doseText": "valor-ejemplo",
    "routeConceptId": "00000000-0000-4000-8000-000000000001",
    "frequencyText": "valor-ejemplo",
    "quantityDecimal": "valor-ejemplo",
    "unitConceptId": "00000000-0000-4000-8000-000000000001",
    "patientInstructionsText": "valor-ejemplo"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/prescription-favorites"
}
```

---

## 19. POST /prescription-favorites

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-prescription-favorites`
- **Nombre:** Guardar un favorito de prescripción
- **Operation ID:** `PrescriptionFavoritesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrescriptionFavoritesController.create](../../src/modules/clinical_ext/controllers/prescription-favorites.controller.ts)

### Descripción de negocio

Guardar un favorito de prescripción. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Guarda una indicación repetida como favorito.

### Descripción del sistema

NestJS resuelve `POST /prescription-favorites` en `PrescriptionFavoritesController_create`. El controlador delega en `PrescriptionFavoritesService.create`. Valida el body como `CreatePrescriptionFavoriteDto` y consume `application/json`. El tipo de retorno estático es `Promise<PrescriptionFavoriteResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePrescriptionFavoriteDto`; los campos opcionales se omiten.

```http
POST /prescription-favorites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 120 | Rótulo del favorito, único dentro de la lista del profesional (p. ej. «ATB post extracción») | `Nombre de ejemplo` |
| `medicationConceptId` | Sí | `string` | formato `uuid` | Medicamento codificado (terminology.catalog_concepts) | `00000000-0000-4000-8000-000000000001` |
| `substanceAtcConceptId` | No | `string` | formato `uuid` | Principio activo ATC | `00000000-0000-4000-8000-000000000001` |
| `doseText` | No | `string` | Sin restricción adicional declarada | Posología por defecto | `valor-ejemplo` |
| `routeConceptId` | No | `string` | formato `uuid` | Vía de administración por defecto | `00000000-0000-4000-8000-000000000001` |
| `frequencyText` | No | `string` | Sin restricción adicional declarada | Frecuencia por defecto | `valor-ejemplo` |
| `quantityDecimal` | No | `number` | Sin restricción adicional declarada | Cantidad por defecto | `1` |
| `unitConceptId` | No | `string` | formato `uuid` | Unidad de la cantidad | `00000000-0000-4000-8000-000000000001` |
| `patientInstructionsText` | No | `string` | Sin restricción adicional declarada | Indicaciones al paciente por defecto, separadas de la posología | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /prescription-favorites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "patientInstructionsText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PrescriptionFavoriteResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrescriptionFavoriteResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": "valor-ejemplo",
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "patientInstructionsText": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Rótulo del favorito. | `Nombre de ejemplo` |
| `medicationConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a medication concept. | `00000000-0000-4000-8000-000000000001` |
| `substanceAtcConceptId` | No | `string` | formato `uuid` | Identificador asociado a substance atc concept. | `00000000-0000-4000-8000-000000000001` |
| `doseText` | No | `string` | Sin restricción adicional declarada | Posología por defecto. | `valor-ejemplo` |
| `routeConceptId` | No | `string` | formato `uuid` | Identificador asociado a route concept. | `00000000-0000-4000-8000-000000000001` |
| `frequencyText` | No | `string` | Sin restricción adicional declarada | Frecuencia por defecto. | `valor-ejemplo` |
| `quantityDecimal` | No | `string` | Sin restricción adicional declarada | Cantidad por defecto. | `valor-ejemplo` |
| `unitConceptId` | No | `string` | formato `uuid` | Identificador asociado a unit concept. | `00000000-0000-4000-8000-000000000001` |
| `patientInstructionsText` | No | `string` | Sin restricción adicional declarada | Indicaciones al paciente por defecto. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 409 | `CONFLICT` | Ya tenés un favorito con ese nombre | Excepción explícita en src/modules/clinical_ext/services/prescription-favorites.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La lista de favoritos llegó a su máximo; borrá alguno antes de guardar otro | Excepción explícita en src/modules/clinical_ext/services/prescription-favorites.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/prescription-favorites"
}
```

---

## 20. DELETE /prescription-favorites/{id}

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-prescription-favorites`
- **Nombre:** Borrar un favorito de prescripción propio
- **Operation ID:** `PrescriptionFavoritesController_remove`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrescriptionFavoritesController.remove](../../src/modules/clinical_ext/controllers/prescription-favorites.controller.ts)

### Descripción de negocio

Borrar un favorito de prescripción propio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Borra un favorito propio.

### Descripción del sistema

NestJS resuelve `DELETE /prescription-favorites/{id}` en `PrescriptionFavoritesController_remove`. El controlador delega en `PrescriptionFavoritesService.remove`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /prescription-favorites/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /prescription-favorites/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Favorito no encontrado | Excepción explícita en src/modules/clinical_ext/services/prescription-favorites.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/prescription-favorites/{id}"
}
```

---

## 21. GET /referrals

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-referrals`
- **Nombre:** Listar derivaciones de un paciente
- **Operation ID:** `ReferralsController_listByPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReferralsController.listByPatient](../../src/modules/clinical_ext/controllers/referrals.controller.ts)

### Descripción de negocio

Listar derivaciones de un paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La lectura que faltaba: derivaciones de un paciente. El módulo tenía escrituras y ninguna lectura, así que lo que se registraba no se podía volver a mirar — y ninguna pantalla podía mostrarlo.

### Descripción del sistema

NestJS resuelve `GET /referrals` en `ReferralsController_listByPatient`. El controlador delega en `ReferralsService.listByPatient`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /referrals?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /referrals?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/referrals"
}
```

---

## 22. POST /referrals

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-referrals`
- **Nombre:** Emitir una referencia desde un encuentro
- **Operation ID:** `ReferralsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReferralsController.create](../../src/modules/clinical_ext/controllers/referrals.controller.ts)

### Descripción de negocio

Emitir una referencia desde un encuentro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /referrals` en `ReferralsController_create`. El controlador delega en `ReferralsService.create`. Valida el body como `ClinicalExtCreateReferralDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReferralResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ClinicalExtCreateReferralDto`; los campos opcionales se omiten.

```http
POST /referrals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceEncounterId` | No | `string` | formato `uuid` | Encuentro origen | `00000000-0000-4000-8000-000000000001` |
| `referringProfileId` | No | `string` | formato `uuid` | Profesional que deriva | `00000000-0000-4000-8000-000000000001` |
| `targetProfileId` | No | `string` | formato `uuid` | Profesional destino | `00000000-0000-4000-8000-000000000001` |
| `targetTenantId` | No | `string` | formato `uuid` | Tenant destino (referencia inter-tenant) | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Especialidad destino (concept id) | `00000000-0000-4000-8000-000000000001` |
| `reasonConceptId` | No | `string` | formato `uuid` | Motivo codificado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `priorityConceptId` | No | `string` | formato `uuid` | Prioridad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `validUntil` | No | `string` | formato `date` | Vigencia de la referencia | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /referrals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "sourceEncounterId": "00000000-0000-4000-8000-000000000001",
  "referringProfileId": "00000000-0000-4000-8000-000000000001",
  "targetProfileId": "00000000-0000-4000-8000-000000000001",
  "targetTenantId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReferralResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReferralResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "referralCode": "CODIGO_EJEMPLO",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `referralCode` | Sí | `string` | Sin restricción adicional declarada | Código a compartir | `CODIGO_EJEMPLO` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una referencia equivalente | Excepción explícita en src/modules/clinical_ext/services/referrals.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/referrals"
}
```

---

## 23. PATCH /referrals/{id}/respond

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-referrals`
- **Nombre:** Responder / aceptar una referencia inter-tenant
- **Operation ID:** `ReferralsController_respond`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReferralsController.respond](../../src/modules/clinical_ext/controllers/referrals.controller.ts)

### Descripción de negocio

Responder / aceptar una referencia inter-tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /referrals/{id}/respond` en `ReferralsController_respond`. El controlador delega en `ReferralsService.respond`. Valida el body como `RespondReferralDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RespondReferralDto`; los campos opcionales se omiten.

```http
PATCH /referrals/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `ACCEPT`, `REJECT` | Decisión del tenant destino | `ACCEPT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /referrals/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Referencia no encontrada | Excepción explícita en src/modules/clinical_ext/services/referrals.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La referencia no está en estado solicitado | Excepción explícita en src/modules/clinical_ext/services/referrals.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/referrals/{id}/respond"
}
```

---

## 24. POST /virtual-encounters

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-virtual-encounters`
- **Nombre:** Iniciar una sesión de telesalud
- **Operation ID:** `VirtualEncountersController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VirtualEncountersController.create](../../src/modules/clinical_ext/controllers/virtual-encounters.controller.ts)

### Descripción de negocio

Iniciar una sesión de telesalud. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-18-12 (alta).

### Descripción del sistema

NestJS resuelve `POST /virtual-encounters` en `VirtualEncountersController_create`. El controlador delega en `VirtualEncountersService.create`. Valida el body como `CreateVirtualEncounterDto` y consume `application/json`. El tipo de retorno estático es `Promise<VirtualEncounterResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateVirtualEncounterDto`; los campos opcionales se omiten.

```http
POST /virtual-encounters HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `encounterId` | Sí | `string` | formato `uuid` | Encuentro clínico (1:1) | `00000000-0000-4000-8000-000000000001` |
| `platformConceptId` | No | `string` | formato `uuid` | Plataforma de telesalud (concept id) | `00000000-0000-4000-8000-000000000001` |
| `meetingUrl` | No | `string` | longitud máxima 2000 | URL de la reunión | `valor-ejemplo` |
| `meetingId` | No | `string` | longitud máxima 200 | Identificador de la reunión | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /virtual-encounters HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "platformConceptId": "00000000-0000-4000-8000-000000000001",
  "meetingUrl": "valor-ejemplo",
  "meetingId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VirtualEncounterResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | Sí | `string` | formato `uuid` | Identificador asociado a encounter. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la sesión (concept id) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El encuentro ya tiene una sesión virtual | Excepción explícita en src/modules/clinical_ext/services/virtual-encounters.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/virtual-encounters"
}
```

---

## 25. PATCH /virtual-encounters/{id}/end

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-virtual-encounters`
- **Nombre:** Finalizar una sesión de telesalud
- **Operation ID:** `VirtualEncountersController_end`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VirtualEncountersController.end](../../src/modules/clinical_ext/controllers/virtual-encounters.controller.ts)

### Descripción de negocio

Finalizar una sesión de telesalud. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-18-12 (end).

### Descripción del sistema

NestJS resuelve `PATCH /virtual-encounters/{id}/end` en `VirtualEncountersController_end`. El controlador delega en `VirtualEncountersService.end`. Valida el body como `EndVirtualEncounterDto` y consume `application/json`. El tipo de retorno estático es `Promise<VirtualEncounterResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EndVirtualEncounterDto`; los campos opcionales se omiten.

```http
PATCH /virtual-encounters/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `recordingFileId` | No | `string` | formato `uuid` | Manifiesto de grabación (common.files) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /virtual-encounters/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "recordingFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VirtualEncounterResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | Sí | `string` | formato `uuid` | Identificador asociado a encounter. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la sesión (concept id) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión virtual no encontrada | Excepción explícita en src/modules/clinical_ext/services/virtual-encounters.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión no está en progreso | Excepción explícita en src/modules/clinical_ext/services/virtual-encounters.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/virtual-encounters/{id}/end"
}
```

---

## 26. PATCH /virtual-encounters/{id}/join

- **Módulo:** `clinical_ext`
- **Etiqueta OpenAPI:** `clinical-ext-virtual-encounters`
- **Nombre:** Unirse a una sesión de telesalud
- **Operation ID:** `VirtualEncountersController_join`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VirtualEncountersController.join](../../src/modules/clinical_ext/controllers/virtual-encounters.controller.ts)

### Descripción de negocio

Unirse a una sesión de telesalud. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-18-12 (join).

### Descripción del sistema

NestJS resuelve `PATCH /virtual-encounters/{id}/join` en `VirtualEncountersController_join`. El controlador delega en `VirtualEncountersService.join`. No recibe body. El tipo de retorno estático es `Promise<VirtualEncounterResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
PATCH /virtual-encounters/00000000-0000-4000-8000-000000000001/join HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
PATCH /virtual-encounters/00000000-0000-4000-8000-000000000001/join HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VirtualEncounterResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VirtualEncounterResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | Sí | `string` | formato `uuid` | Identificador asociado a encounter. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la sesión (concept id) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión virtual no encontrada | Excepción explícita en src/modules/clinical_ext/services/virtual-encounters.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no está agendada | Excepción explícita en src/modules/clinical_ext/services/virtual-encounters.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/virtual-encounters/{id}/join"
}
```

---

