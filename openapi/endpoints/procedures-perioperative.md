<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `procedures_perioperative`

Referencia exhaustiva de 32 operación(es) del módulo `procedures_perioperative`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `dental-procedures`, `procedure-cases`
- **Controladores:** `DentalController`, `PeriopController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /dental-procedures](#1-get-dental-procedures) — Histórico odontológico del paciente
2. [POST /dental-procedures](#2-post-dental-procedures) — Registrar un procedimiento odontológico
3. [GET /dental-procedures/catalog](#3-get-dental-procedures-catalog) — Catálogo odontológico: códigos, piezas (FDI) y cuadrantes
4. [POST /pacu-stays/{stayId}/assessments](#4-post-pacu-stays-stayid-assessments) — Registrar una valoración de recuperación
5. [POST /pacu-stays/{stayId}/discharge](#5-post-pacu-stays-stayid-discharge) — Dar el alta de recuperación
6. [GET /procedure-cases](#6-get-procedure-cases) — Listar casos quirúrgicos (agenda)
7. [POST /procedure-cases](#7-post-procedure-cases) — Programar un caso quirúrgico y reservar el quirófano
8. [GET /procedure-cases/{id}](#8-get-procedure-cases-id) — Detalle completo del caso quirúrgico
9. [PATCH /procedure-cases/{id}](#9-patch-procedure-cases-id) — Modificar el caso quirúrgico
10. [POST /procedure-cases/{id}/anesthesia-events](#10-post-procedure-cases-id-anesthesia-events) — Anotar un evento intraoperatorio de anestesia
11. [POST /procedure-cases/{id}/anesthesia-plans](#11-post-procedure-cases-id-anesthesia-plans) — Registrar el plan de anestesia y la valoración de vía aérea
12. [POST /procedure-cases/{id}/anesthesia-plans/{planId}/approve](#12-post-procedure-cases-id-anesthesia-plans-planid-approve) — Aprobar el plan de anestesia
13. [POST /procedure-cases/{id}/cancel](#13-post-procedure-cases-id-cancel) — Cancelar el caso quirúrgico
14. [POST /procedure-cases/{id}/charge-items/post](#14-post-procedure-cases-id-charge-items-post) — Generar los cargos y consolidar el uso del quirófano
15. [POST /procedure-cases/{id}/confirm](#15-post-procedure-cases-id-confirm) — Confirmar la intervención verificando las credenciales del equipo
16. [POST /procedure-cases/{id}/diagnoses](#16-post-procedure-cases-id-diagnoses) — Registrar los diagnósticos del caso
17. [POST /procedure-cases/{id}/findings](#17-post-procedure-cases-id-findings) — Registrar un hallazgo operatorio
18. [POST /procedure-cases/{id}/implants](#18-post-procedure-cases-id-implants) — Registrar un implante con su trazabilidad UDI, lote o serie
19. [POST /procedure-cases/{id}/medication-uses](#19-post-procedure-cases-id-medication-uses) — Registrar el uso de un medicamento en la intervención
20. [POST /procedure-cases/{id}/operative-reports](#20-post-procedure-cases-id-operative-reports) — Redactar el reporte operatorio
21. [POST /procedure-cases/{id}/operative-reports/{reportId}/sign](#21-post-procedure-cases-id-operative-reports-reportid-sign) — Firmar el reporte operatorio
22. [POST /procedure-cases/{id}/operative-steps](#22-post-procedure-cases-id-operative-steps) — Registrar un paso operatorio
23. [POST /procedure-cases/{id}/pacu-stays](#23-post-procedure-cases-id-pacu-stays) — Admitir al paciente en recuperación
24. [POST /procedure-cases/{id}/preoperative-assessments](#24-post-procedure-cases-id-preoperative-assessments) — Registrar la valoración preoperatoria y sus puntuaciones de riesgo
25. [POST /procedure-cases/{id}/preoperative-orders](#25-post-procedure-cases-id-preoperative-orders) — Indicar una orden preoperatoria para el caso
26. [POST /procedure-cases/{id}/preoperative-orders/verify](#26-post-procedure-cases-id-preoperative-orders-verify) — Verificar las órdenes preoperatorias
27. [POST /procedure-cases/{id}/safety-checklists/{checklistId}/responses](#27-post-procedure-cases-id-safety-checklists-checklistid-responses) — Responder una fase del checklist quirúrgico
28. [POST /procedure-cases/{id}/specimens](#28-post-procedure-cases-id-specimens) — Registrar una muestra tomada en la intervención
29. [GET /procedure-cases/{id}/team-members](#29-get-procedure-cases-id-team-members) — Listar el equipo del caso quirúrgico
30. [POST /procedure-cases/{id}/team-members](#30-post-procedure-cases-id-team-members) — Asignar un miembro al equipo quirúrgico
31. [POST /procedure-cases/{id}/team-members/{memberId}/accept](#31-post-procedure-cases-id-team-members-memberid-accept) — Aceptar la participación en el equipo quirúrgico
32. [POST /procedure-cases/{id}/team-members/{memberId}/respond](#32-post-procedure-cases-id-team-members-memberid-respond) — Rechazar, pedir cambios o informar indisponibilidad

---

## 1. GET /dental-procedures

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `dental-procedures`
- **Nombre:** Histórico odontológico del paciente
- **Operation ID:** `DentalController_listByPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DentalController.listByPatient](../../src/modules/procedures_perioperative/controllers/dental.controller.ts)

### Descripción de negocio

Devuelve además el total sin paginar: un histórico clínico recortado en silencio se lee como «no hay antecedentes».

Contexto declarado en el controlador: Histórico odontológico de una persona, del más reciente al más antiguo.

### Descripción del sistema

NestJS resuelve `GET /dental-procedures` en `DentalController_listByPatient`. El controlador delega en `PeriopDentalService.listByPatient`. No recibe body. El tipo de retorno estático es `Promise<DentalProcedureListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | formato `uuid` | Paciente consultado | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /dental-procedures?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /dental-procedures?patientProfileId=00000000-0000-4000-8000-000000000001&limit=50 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DentalProcedureListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<DentalProcedureListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DentalProcedureListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DentalProcedureListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DentalProcedureListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DentalProcedureListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DentalProcedureListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "performerProfileId": "00000000-0000-4000-8000-000000000001",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "noteText": "valor-ejemplo",
      "performedAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "sites": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
          "description": "Texto descriptivo de ejemplo"
        }
      ]
    }
  ],
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DentalProcedureDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","procedureCodeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","performerProfileId":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","noteText":"valor-ejemplo","performedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z","sites":[{"id":"00000000-0000-4000-8000-000000000001","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo"}]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].procedureCodeConceptId` | Sí | `string` | formato `uuid` | Qué se hizo. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado del registro. | `00000000-0000-4000-8000-000000000001` |
| `items[].performerProfileId` | No | `string` | formato `uuid` | Odontólogo que lo realizó, si consta. | `00000000-0000-4000-8000-000000000001` |
| `items[].encounterId` | No | `string` | formato `uuid` | Encuentro en el que se realizó, si lo hubo. | `00000000-0000-4000-8000-000000000001` |
| `items[].noteText` | No | `string` | Sin restricción adicional declarada | Nota clínica. | `valor-ejemplo` |
| `items[].performedAt` | No | `string` | formato `date-time` | Cuándo se realizó. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo quedó registrado. | `2026-07-31T12:00:00.000Z` |
| `items[].sites` | Sí | `array<DentalSiteDto>` | Sin restricción adicional declarada | Piezas o cuadrantes tratados. | `[{"id":"00000000-0000-4000-8000-000000000001","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo"}]` |
| `items[].sites[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].sites[].bodySiteConceptId` | Sí | `string` | formato `uuid` | Pieza o cuadrante. | `00000000-0000-4000-8000-000000000001` |
| `items[].sites[].description` | No | `string` | Sin restricción adicional declarada | Cara o superficie, si se precisó. | `Texto descriptivo de ejemplo` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Procedimientos de la persona, sin paginar | `1` |

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
  "path": "/dental-procedures"
}
```

---

## 2. POST /dental-procedures

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `dental-procedures`
- **Nombre:** Registrar un procedimiento odontológico
- **Operation ID:** `DentalController_record`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DentalController.record](../../src/modules/procedures_perioperative/controllers/dental.controller.ts)

### Descripción de negocio

Se escribe como procedimiento clínico con categoría odontológica; la pieza o el cuadrante quedan como sitio anatómico.

Contexto declarado en el controlador: Registra un tratamiento odontológico ya realizado.

### Descripción del sistema

NestJS resuelve `POST /dental-procedures` en `DentalController_record`. El controlador delega en `PeriopDentalService.record`. Valida el body como `CreateDentalProcedureDto` y consume `application/json`. El tipo de retorno estático es `Promise<DentalProcedureResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDentalProcedureDto`; los campos opcionales se omiten.

```http
POST /dental-procedures HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente tratado | `00000000-0000-4000-8000-000000000001` |
| `procedureCodeConceptId` | Sí | `string` | formato `uuid` | Qué se hizo. Los códigos sembrados salen de `GET /dental-procedures/catalog`; se admite cualquier concepto válido. | `00000000-0000-4000-8000-000000000001` |
| `performerProfileId` | No | `string` | formato `uuid` | Odontólogo que lo realizó. Si se omite se toma el profesional de la sesión. | `00000000-0000-4000-8000-000000000001` |
| `toothSiteConceptId` | No | `string` | formato `uuid` | Pieza dentaria en notación FDI o cuadrante. Tiene que ser uno de los sitios del catálogo. | `00000000-0000-4000-8000-000000000001` |
| `siteDetail` | No | `string` | longitud máxima 200 | Cara o superficie tratada, si corresponde | `valor-ejemplo` |
| `noteText` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro en el que se realizó, si lo hubo | `00000000-0000-4000-8000-000000000001` |
| `performedAt` | No | `string` | formato `date-time` | Cuándo se realizó. Si se omite, ahora. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /dental-procedures HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "performerProfileId": "00000000-0000-4000-8000-000000000001",
  "toothSiteConceptId": "00000000-0000-4000-8000-000000000001",
  "siteDetail": "valor-ejemplo",
  "noteText": "valor-ejemplo",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "performedAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DentalProcedureResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DentalProcedureResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DentalProcedureResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DentalProcedureResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DentalProcedureResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DentalProcedureResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DentalProcedureResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DentalProcedureResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DentalProcedureResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DentalProcedureResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado del registro. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Cuándo quedó registrado. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El sitio tiene que ser una pieza dentaria o un cuadrante del catálogo odontológico | Excepción explícita en src/modules/procedures_perioperative/services/periop-dental.service.ts |
| 422 | `PRECONDITION_FAILED` | No se puede precisar la cara tratada sin decir sobre qué pieza | Excepción explícita en src/modules/procedures_perioperative/services/periop-dental.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/dental-procedures"
}
```

---

## 3. GET /dental-procedures/catalog

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `dental-procedures`
- **Nombre:** Catálogo odontológico: códigos, piezas (FDI) y cuadrantes
- **Operation ID:** `DentalController_catalog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DentalController.catalog](../../src/modules/procedures_perioperative/controllers/dental.controller.ts)

### Descripción de negocio

Sale del seed de conceptos. Existe para que el cliente no tenga que llevar los UUID escritos a mano.

Contexto declarado en el controlador: El catálogo con el que se llena el formulario de alta. Va antes que `GET /dental-procedures` en el archivo por costumbre de lectura, no por ruteo: son rutas distintas y Nest no las confunde.

### Descripción del sistema

NestJS resuelve `GET /dental-procedures/catalog` en `DentalController_catalog`. El controlador delega en `PeriopDentalService.catalog`. No recibe body. El tipo de retorno estático es `DentalCatalogDto`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /dental-procedures/catalog HTTP/1.1
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
GET /dental-procedures/catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `DentalCatalogDto` | No |
| 400 | Consulta completada correctamente. | `DentalCatalogDto` | No |
| 401 | Consulta completada correctamente. | `DentalCatalogDto` | No |
| 403 | Consulta completada correctamente. | `DentalCatalogDto` | No |
| 429 | Consulta completada correctamente. | `DentalCatalogDto` | No |
| 500 | Consulta completada correctamente. | `DentalCatalogDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DentalCatalogDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "procedureCodes": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "teeth": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "quadrants": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `procedureCodes` | Sí | `array<DentalCatalogEntryDto>` | Sin restricción adicional declarada | Códigos de procedimiento sembrados. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `procedureCodes[].conceptId` | Sí | `string` | formato `uuid` | Identificador del concepto. | `00000000-0000-4000-8000-000000000001` |
| `procedureCodes[].code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `procedureCodes[].display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `teeth` | Sí | `array<DentalCatalogEntryDto>` | Sin restricción adicional declarada | Las 32 piezas permanentes, en orden FDI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `teeth[].conceptId` | Sí | `string` | formato `uuid` | Identificador del concepto. | `00000000-0000-4000-8000-000000000001` |
| `teeth[].code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `teeth[].display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `quadrants` | Sí | `array<DentalCatalogEntryDto>` | Sin restricción adicional declarada | Los cuatro cuadrantes. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `quadrants[].conceptId` | Sí | `string` | formato `uuid` | Identificador del concepto. | `00000000-0000-4000-8000-000000000001` |
| `quadrants[].code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `quadrants[].display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/dental-procedures/catalog"
}
```

---

## 4. POST /pacu-stays/{stayId}/assessments

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar una valoración de recuperación
- **Operation ID:** `PeriopController_recordPacuAssessment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.recordPacuAssessment](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Informa si cumple el criterio de alta; no da el alta.


### Descripción del sistema

NestJS resuelve `POST /pacu-stays/{stayId}/assessments` en `PeriopController_recordPacuAssessment`. El controlador delega en `PeriopIntraopService.recordPacuAssessment`. Valida el body como `RecordPacuAssessmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<PacuAssessmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `stayId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordPacuAssessmentDto`; los campos opcionales se omiten.

```http
POST /pacu-stays/00000000-0000-4000-8000-000000000001/assessments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PERIOP_NURSE`, `ANESTHESIOLOGIST`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `stayId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `assessedByProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `aldreteScore` | No | `number` | mínimo 0; máximo 10 | Puntuación de Aldrete | `1` |
| `painScore` | No | `string` | Sin restricción adicional declarada | Escala de dolor | `valor-ejemplo` |
| `nauseaScore` | No | `string` | Sin restricción adicional declarada | Escala de náusea | `valor-ejemplo` |
| `airwayStatus` | No | `string` | valores: `PATENT`, `SUPPORTED` | Sin descripción específica en el contrato OpenAPI. | `PATENT` |
| `observationsJson` | No | `object` | Sin restricción adicional declarada | Observaciones registradas | `{}` |
| `criteriaJson` | No | `object` | Sin restricción adicional declarada | Criterios de alta evaluados | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pacu-stays/00000000-0000-4000-8000-000000000001/assessments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "aldreteScore": 1,
  "painScore": "valor-ejemplo",
  "nauseaScore": "valor-ejemplo",
  "airwayStatus": "PATENT",
  "observationsJson": {},
  "criteriaJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PacuAssessmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PacuAssessmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pacuStayId": "00000000-0000-4000-8000-000000000001",
  "meetsDischargeCriteria": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pacuStayId` | Sí | `string` | formato `uuid` | Identificador asociado a pacu stay. | `00000000-0000-4000-8000-000000000001` |
| `meetsDischargeCriteria` | Sí | `boolean` | Sin restricción adicional declarada | true si la valoración cumple el criterio de alta | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Estancia en recuperación no encontrada | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 409 | `CONFLICT` | El paciente ya salió de recuperación | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
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
  "path": "/pacu-stays/{stayId}/assessments"
}
```

---

## 5. POST /pacu-stays/{stayId}/discharge

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Dar el alta de recuperación
- **Operation ID:** `PeriopController_dischargeFromPacu`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.dischargeFromPacu](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Exige una valoración que cumpla el criterio de Aldrete.


### Descripción del sistema

NestJS resuelve `POST /pacu-stays/{stayId}/discharge` en `PeriopController_dischargeFromPacu`. El controlador delega en `PeriopIntraopService.dischargeFromPacu`. Valida el body como `DischargePacuDto` y consume `application/json`. El tipo de retorno estático es `Promise<DischargePacuResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `stayId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DischargePacuDto`; los campos opcionales se omiten.

```http
POST /pacu-stays/00000000-0000-4000-8000-000000000001/discharge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "destination": "PACU"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANESTHESIOLOGIST`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `stayId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `destination` | Sí | `string` | valores: `PACU`, `ICU`, `WARD`, `HOME` | Sin descripción específica en el contrato OpenAPI. | `PACU` |
| `dischargedByProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `orders` | No | `array<PostoperativeOrderDto>` | Sin restricción adicional declarada | Órdenes postoperatorias | `[{"serviceRequestId":"00000000-0000-4000-8000-000000000001","orderRole":"LAB"}]` |
| `orders[].serviceRequestId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `orders[].orderRole` | No | `string` | valores: `LAB`, `IMAGING`, `CONSULT`, `MEDICATION` | Sin descripción específica en el contrato OpenAPI. | `LAB` |
| `followups` | No | `array<PostoperativeFollowupDto>` | Sin restricción adicional declarada | Seguimientos a agendar | `[{"followupType":"WOUND_CHECK","appointmentId":"00000000-0000-4000-8000-000000000001","dueAt":"2026-07-31T12:00:00.000Z","instructionsText":"valor-ejemplo"}]` |
| `followups[].followupType` | No | `string` | valores: `WOUND_CHECK`, `VISIT` | Sin descripción específica en el contrato OpenAPI. | `WOUND_CHECK` |
| `followups[].appointmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `followups[].dueAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `followups[].instructionsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pacu-stays/00000000-0000-4000-8000-000000000001/discharge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "destination": "PACU",
  "dischargedByProfileId": "00000000-0000-4000-8000-000000000001",
  "orders": [
    {
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "orderRole": "LAB"
    }
  ],
  "followups": [
    {
      "followupType": "WOUND_CHECK",
      "appointmentId": "00000000-0000-4000-8000-000000000001",
      "dueAt": "2026-07-31T12:00:00.000Z",
      "instructionsText": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DischargePacuResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DischargePacuResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "ordersCreated": 1,
  "followupsCreated": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `ordersCreated` | Sí | `number` | Sin restricción adicional declarada | Órdenes postoperatorias creadas | `1` |
| `followupsCreated` | Sí | `number` | Sin restricción adicional declarada | Seguimientos agendados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANESTHESIOLOGIST, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Estancia en recuperación no encontrada | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 409 | `CONFLICT` | El paciente ya salió de recuperación | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El alta de recuperación exige al menos una valoración | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 422 | `PRECONDITION_FAILED` | La última valoración no cumple el criterio de alta | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pacu-stays/{stayId}/discharge"
}
```

---

## 6. GET /procedure-cases

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Listar casos quirúrgicos (agenda)
- **Operation ID:** `PeriopController_listCases`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.listCases](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Acotado siempre al tenant del contexto; admite paciente, quirófano, cirujano, estado y ventana temporal.

Contexto declarado en el controlador: Agenda quirúrgica del tenant. El módulo no tenía ninguna lectura: un caso creado sólo era accesible por el uuid que devolvía su propio POST, así que nadie podía consultar la programación del día ni los casos de un paciente.

### Descripción del sistema

NestJS resuelve `GET /procedure-cases` en `PeriopController_listCases`. El controlador delega en `PeriopCasesService.listCases`. No recibe body. El tipo de retorno estático es `Promise<CaseListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | No | `string` | formato `uuid` | Paciente | `00000000-0000-4000-8000-000000000001` |
| `operatingRoomId` | query | No | `string` | formato `uuid` | Quirófano reservado | `00000000-0000-4000-8000-000000000001` |
| `primarySurgeonProfileId` | query | No | `string` | formato `uuid` | Cirujano principal | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | query | No | `string` | formato `uuid` | Estado del caso | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | formato `date-time` | Inicio de la ventana (inclusive) | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Fin de la ventana (exclusivo) | `2026-07-31T12:00:00.000Z` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `offset` | query | No | `number` | mínimo 0 | Sin descripción específica en OpenAPI. | `0` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /procedure-cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `SURGERY_SCHEDULER`, `PERIOP_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /procedure-cases?patientProfileId=00000000-0000-4000-8000-000000000001&operatingRoomId=00000000-0000-4000-8000-000000000001&primarySurgeonProfileId=00000000-0000-4000-8000-000000000001&statusConceptId=00000000-0000-4000-8000-000000000001&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&limit=50&offset=0 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CaseListResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<CaseListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CaseListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CaseListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CaseListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CaseListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CaseListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "caseNumber": "valor-ejemplo",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "primarySurgeonProfileId": "00000000-0000-4000-8000-000000000001",
      "operatingRoomId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "scheduledStartAt": "2026-07-31T12:00:00.000Z",
      "scheduledEndAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CaseSummaryDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","caseNumber":"valor-ejemplo","patientProfileId":"00000000-0000-4000-8000-000000000001","primarySurgeonProfileId":"00000000-0000-4000-8000-000000000001","operatingRoomId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","scheduledStartAt":"2026-07-31T12:00:00.000Z","scheduledEndAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].caseNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de case number mantenido por la instancia. | `valor-ejemplo` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].primarySurgeonProfileId` | No | `string` | formato `uuid` | Identificador asociado a primary surgeon profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].operatingRoomId` | No | `string` | formato `uuid` | Identificador asociado a operating room. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].scheduledStartAt` | No | `string` | formato `date-time` | Valor de scheduled start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].scheduledEndAt` | No | `string` | formato `date-time` | Valor de scheduled end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Casos que cumplen el filtro, sin paginar | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases"
}
```

---

## 7. POST /procedure-cases

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Programar un caso quirúrgico y reservar el quirófano
- **Operation ID:** `PeriopController_scheduleCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.scheduleCase](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

El solape de quirófano se comprueba dentro de la transacción.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases` en `PeriopController_scheduleCase`. El controlador delega en `PeriopCasesService.scheduleCase`. Valida el body como `ScheduleCaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<CaseResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ScheduleCaseDto`; los campos opcionales se omiten.

```http
POST /procedure-cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "caseType": "ELECTIVE",
  "priority": "ROUTINE",
  "primarySurgeonProfileId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGERY_SCHEDULER`, `SURGEON`, `PERIOP_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `custodianTenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Solicitud que origina el caso | `00000000-0000-4000-8000-000000000001` |
| `primaryProcedureId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `caseType` | Sí | `string` | valores: `ELECTIVE`, `URGENT`, `EMERGENCY` | Sin descripción específica en el contrato OpenAPI. | `ELECTIVE` |
| `priority` | Sí | `string` | valores: `ROUTINE`, `URGENT`, `STAT` | Sin descripción específica en el contrato OpenAPI. | `ROUTINE` |
| `surgicalSpecialtyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestedByProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `primarySurgeonProfileId` | Sí | `string` | formato `uuid` | Cirujano principal | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `operatingRoomId` | Sí | `string` | formato `uuid` | Quirófano que se reserva | `00000000-0000-4000-8000-000000000001` |
| `scheduledStartAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `scheduledEndAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `urgencyReasonText` | No | `string` | Sin restricción adicional declarada | Justificación de la urgencia; obligatoria si el caso no es electivo | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "primaryProcedureId": "00000000-0000-4000-8000-000000000001",
  "caseType": "ELECTIVE",
  "priority": "ROUTINE",
  "surgicalSpecialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "requestedByProfileId": "00000000-0000-4000-8000-000000000001",
  "primarySurgeonProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z",
  "urgencyReasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "caseNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "milestoneId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseNumber` | Sí | `string` | Sin restricción adicional declarada | Número del caso | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `operatingRoomId` | Sí | `string` | formato `uuid` | Quirófano reservado | `00000000-0000-4000-8000-000000000001` |
| `milestoneId` | Sí | `string` | formato `uuid` | Hito de programación creado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El quirófano ya está reservado en esa franja | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 409 | `CONFLICT` | No se pudo asignar número de caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso debe terminar después de empezar | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | Un caso urgente o de emergencia necesita justificar su urgencia | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases"
}
```

---

## 8. GET /procedure-cases/{id}

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Detalle completo del caso quirúrgico
- **Operation ID:** `PeriopController_getCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.getCase](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Detalle completo del caso quirúrgico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Detalle agregado del caso: equipo, diagnósticos, órdenes, plan e informes.

### Descripción del sistema

NestJS resuelve `GET /procedure-cases/{id}` en `PeriopController_getCase`. El controlador delega en `PeriopCasesService.getCaseDetail`. No recibe body. El tipo de retorno estático es `Promise<CaseDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /procedure-cases/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `SURGERY_SCHEDULER`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /procedure-cases/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CaseDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<CaseDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CaseDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CaseDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<CaseDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CaseDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CaseDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CaseDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "case": {
    "id": "00000000-0000-4000-8000-000000000001",
    "caseNumber": "valor-ejemplo",
    "patientProfileId": "00000000-0000-4000-8000-000000000001",
    "primarySurgeonProfileId": "00000000-0000-4000-8000-000000000001",
    "operatingRoomId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "scheduledStartAt": "2026-07-31T12:00:00.000Z",
    "scheduledEndAt": "2026-07-31T12:00:00.000Z"
  },
  "diagnoses": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "conditionId": "00000000-0000-4000-8000-000000000001",
      "diagnosisRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "sequenceNumber": 1
    }
  ],
  "team": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "teamRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "milestones": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "milestoneTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "plannedAt": "2026-07-31T12:00:00.000Z",
      "reachedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "preoperativeOrders": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "orderRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "preoperativeAssessment": {
    "id": "00000000-0000-4000-8000-000000000001",
    "fitnessStatusConceptId": "00000000-0000-4000-8000-000000000001",
    "asaClassConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "anesthesiaPlan": {
    "id": "00000000-0000-4000-8000-000000000001",
    "anesthesiaTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "operativeReports": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "reportVersion": 1,
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "signedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "operativeSteps": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "stepNumber": 1,
      "stepCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo",
      "performedByProfileId": "00000000-0000-4000-8000-000000000001",
      "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
      "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "startedAt": "2026-07-31T12:00:00.000Z",
      "endedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "findings": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "operativeStepId": "00000000-0000-4000-8000-000000000001",
      "findingCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "findingText": "valor-ejemplo",
      "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
      "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
      "severityConceptId": "00000000-0000-4000-8000-000000000001",
      "recordedByProfileId": "00000000-0000-4000-8000-000000000001",
      "recordedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "implants": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "procedureId": "00000000-0000-4000-8000-000000000001",
      "implantDeviceId": "00000000-0000-4000-8000-000000000001",
      "implantRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
      "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
      "implantedAt": "2026-07-31T12:00:00.000Z",
      "explantedAt": "2026-07-31T12:00:00.000Z",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "identifiers": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "identifierTypeConceptId": "00000000-0000-4000-8000-000000000001",
          "identifierValue": "valor-ejemplo",
          "issuingSystem": "valor-ejemplo",
          "lotNumber": "valor-ejemplo",
          "serialNumber": "valor-ejemplo",
          "expirationDate": "2026-07-31T12:00:00.000Z"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `case` | Sí | `CaseSummaryDto` | Sin restricción adicional declarada | Datos de cabecera del caso. | `{"id":"00000000-0000-4000-8000-000000000001","caseNumber":"valor-ejemplo","patientProfileId":"00000000-0000-4000-8000-000000000001","primarySurgeonProfileId":"00000000-0000-4000-8000-000000000001","operatingRoomId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","scheduledStartAt":"2026-07-31T12:00:00.000Z","scheduledEndAt":"2026-07-31T12:00:00.000Z"}` |
| `case.id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `case.caseNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de case number mantenido por la instancia. | `valor-ejemplo` |
| `case.patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `case.primarySurgeonProfileId` | No | `string` | formato `uuid` | Identificador asociado a primary surgeon profile. | `00000000-0000-4000-8000-000000000001` |
| `case.operatingRoomId` | No | `string` | formato `uuid` | Identificador asociado a operating room. | `00000000-0000-4000-8000-000000000001` |
| `case.statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `case.scheduledStartAt` | No | `string` | formato `date-time` | Valor de scheduled start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `case.scheduledEndAt` | No | `string` | formato `date-time` | Valor de scheduled end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `diagnoses` | Sí | `array<object>` | Sin restricción adicional declarada | Diagnósticos del caso con su papel y orden | `[{"id":"00000000-0000-4000-8000-000000000001","conditionId":"00000000-0000-4000-8000-000000000001","diagnosisRoleConceptId":"00000000-0000-4000-8000-000000000001","sequenceNumber":1}]` |
| `diagnoses[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador del diagnóstico del caso. | `00000000-0000-4000-8000-000000000001` |
| `diagnoses[].conditionId` | Sí | `string` | Sin restricción adicional declarada | Condición clínica a la que apunta. | `00000000-0000-4000-8000-000000000001` |
| `diagnoses[].diagnosisRoleConceptId` | Sí | `string` | Sin restricción adicional declarada | Papel del diagnóstico (principal, secundario, postoperatorio). | `00000000-0000-4000-8000-000000000001` |
| `diagnoses[].sequenceNumber` | Sí | `number` | Sin restricción adicional declarada | Orden dentro del caso. | `1` |
| `team` | Sí | `array<TeamMemberSummaryDto>` | Sin restricción adicional declarada | Valor de team mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","teamRoleConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `team[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `team[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `team[].teamRoleConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a team role concept. | `00000000-0000-4000-8000-000000000001` |
| `team[].statusConceptId` | Sí | `string` | formato `uuid` | Asignado o aceptado | `00000000-0000-4000-8000-000000000001` |
| `milestones` | Sí | `array<object>` | Sin restricción adicional declarada | Hitos del caso | `[{"id":"00000000-0000-4000-8000-000000000001","milestoneTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","plannedAt":"2026-07-31T12:00:00.000Z","reachedAt":"2026-07-31T12:00:00.000Z"}]` |
| `milestones[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador del hito. | `00000000-0000-4000-8000-000000000001` |
| `milestones[].milestoneTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de hito. | `00000000-0000-4000-8000-000000000001` |
| `milestones[].statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del hito. | `00000000-0000-4000-8000-000000000001` |
| `milestones[].plannedAt` | No | `string` | formato `date-time` | Momento planificado, si lo tiene. | `2026-07-31T12:00:00.000Z` |
| `milestones[].reachedAt` | No | `string` | formato `date-time` | Momento en que se alcanzó, si ya ocurrió. | `2026-07-31T12:00:00.000Z` |
| `preoperativeOrders` | Sí | `array<object>` | Sin restricción adicional declarada | Órdenes preoperatorias | `[{"id":"00000000-0000-4000-8000-000000000001","serviceRequestId":"00000000-0000-4000-8000-000000000001","orderRoleConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `preoperativeOrders[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador de la orden. | `00000000-0000-4000-8000-000000000001` |
| `preoperativeOrders[].serviceRequestId` | Sí | `string` | Sin restricción adicional declarada | Orden clínica a la que apunta. | `00000000-0000-4000-8000-000000000001` |
| `preoperativeOrders[].orderRoleConceptId` | Sí | `string` | Sin restricción adicional declarada | Papel de la orden. | `00000000-0000-4000-8000-000000000001` |
| `preoperativeOrders[].statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado: pendiente o verificada. | `00000000-0000-4000-8000-000000000001` |
| `preoperativeAssessment` | No | `object` | admite null | Valoración preoperatoria, si ya se hizo | `{"id":"00000000-0000-4000-8000-000000000001","fitnessStatusConceptId":"00000000-0000-4000-8000-000000000001","asaClassConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `preoperativeAssessment.id` | No | `string` | Sin restricción adicional declarada | Identificador de la valoración. | `00000000-0000-4000-8000-000000000001` |
| `preoperativeAssessment.fitnessStatusConceptId` | No | `string` | Sin restricción adicional declarada | Aptitud del paciente para la intervención. | `00000000-0000-4000-8000-000000000001` |
| `preoperativeAssessment.asaClassConceptId` | No | `string` | Sin restricción adicional declarada | Clase ASA, si se registró. | `00000000-0000-4000-8000-000000000001` |
| `anesthesiaPlan` | No | `object` | admite null | Plan anestésico, si ya se redactó | `{"id":"00000000-0000-4000-8000-000000000001","anesthesiaTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `anesthesiaPlan.id` | No | `string` | Sin restricción adicional declarada | Identificador del plan. | `00000000-0000-4000-8000-000000000001` |
| `anesthesiaPlan.anesthesiaTypeConceptId` | No | `string` | Sin restricción adicional declarada | Tipo de anestesia previsto. | `00000000-0000-4000-8000-000000000001` |
| `anesthesiaPlan.statusConceptId` | No | `string` | Sin restricción adicional declarada | Estado del plan: borrador o aprobado. | `00000000-0000-4000-8000-000000000001` |
| `operativeReports` | Sí | `array<object>` | Sin restricción adicional declarada | Versiones del informe operatorio, de la última a la primera | `[{"id":"00000000-0000-4000-8000-000000000001","reportVersion":1,"statusConceptId":"00000000-0000-4000-8000-000000000001","signedAt":"2026-07-31T12:00:00.000Z"}]` |
| `operativeReports[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador del informe. | `00000000-0000-4000-8000-000000000001` |
| `operativeReports[].reportVersion` | Sí | `number` | Sin restricción adicional declarada | Número de versión. | `1` |
| `operativeReports[].statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado: borrador o firmado. | `00000000-0000-4000-8000-000000000001` |
| `operativeReports[].signedAt` | No | `string` | formato `date-time` | Cuándo se firmó, si ya ocurrió. | `2026-07-31T12:00:00.000Z` |
| `operativeSteps` | Sí | `array<object>` | Sin restricción adicional declarada | Pasos de la intervención, en orden | `[{"id":"00000000-0000-4000-8000-000000000001","stepNumber":1,"stepCodeConceptId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo","performedByProfileId":"00000000-0000-4000-8000-000000000001","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","lateralityConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","startedAt":"2026-07-31T12:00:00.000Z","endedAt":"2026-07-31T12:00:00.000Z"}]` |
| `operativeSteps[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador del paso. | `00000000-0000-4000-8000-000000000001` |
| `operativeSteps[].stepNumber` | Sí | `number` | Sin restricción adicional declarada | Orden dentro de la intervención. | `1` |
| `operativeSteps[].stepCodeConceptId` | Sí | `string` | Sin restricción adicional declarada | Código del paso. | `00000000-0000-4000-8000-000000000001` |
| `operativeSteps[].description` | Sí | `string` | Sin restricción adicional declarada | Descripción escrita por quien lo registró. | `Texto descriptivo de ejemplo` |
| `operativeSteps[].performedByProfileId` | No | `string` | Sin restricción adicional declarada | Profesional que lo ejecutó, si se registró. | `00000000-0000-4000-8000-000000000001` |
| `operativeSteps[].bodySiteConceptId` | No | `string` | Sin restricción adicional declarada | Sitio anatómico, si se registró. | `00000000-0000-4000-8000-000000000001` |
| `operativeSteps[].lateralityConceptId` | No | `string` | Sin restricción adicional declarada | Lateralidad, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `operativeSteps[].statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del paso. | `00000000-0000-4000-8000-000000000001` |
| `operativeSteps[].startedAt` | No | `string` | formato `date-time` | Cuándo empezó, si se cronometró. | `2026-07-31T12:00:00.000Z` |
| `operativeSteps[].endedAt` | No | `string` | formato `date-time` | Cuándo terminó, si se cronometró. | `2026-07-31T12:00:00.000Z` |
| `findings` | Sí | `array<object>` | Sin restricción adicional declarada | Hallazgos registrados durante la intervención | `[{"id":"00000000-0000-4000-8000-000000000001","operativeStepId":"00000000-0000-4000-8000-000000000001","findingCodeConceptId":"00000000-0000-4000-8000-000000000001","findingText":"valor-ejemplo","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","lateralityConceptId":"00000000-0000-4000-8000-000000000001","severityConceptId":"00000000-0000-4000-8000-000000000001","recordedByProfileId":"00000000-0000-4000-8000-000000000001","recordedAt":"2026-07-31T12:00:00.000Z"}]` |
| `findings[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador del hallazgo. | `00000000-0000-4000-8000-000000000001` |
| `findings[].operativeStepId` | No | `string` | Sin restricción adicional declarada | Paso en el que se halló, si se ató a uno. | `00000000-0000-4000-8000-000000000001` |
| `findings[].findingCodeConceptId` | Sí | `string` | Sin restricción adicional declarada | Código del hallazgo. | `00000000-0000-4000-8000-000000000001` |
| `findings[].findingText` | Sí | `string` | Sin restricción adicional declarada | Descripción escrita por quien lo halló. | `valor-ejemplo` |
| `findings[].bodySiteConceptId` | No | `string` | Sin restricción adicional declarada | Sitio anatómico, si se registró. | `00000000-0000-4000-8000-000000000001` |
| `findings[].lateralityConceptId` | No | `string` | Sin restricción adicional declarada | Lateralidad, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `findings[].severityConceptId` | No | `string` | Sin restricción adicional declarada | Severidad, si se graduó. | `00000000-0000-4000-8000-000000000001` |
| `findings[].recordedByProfileId` | No | `string` | Sin restricción adicional declarada | Profesional que lo registró, si consta. | `00000000-0000-4000-8000-000000000001` |
| `findings[].recordedAt` | Sí | `string` | formato `date-time` | Cuándo se registró. | `2026-07-31T12:00:00.000Z` |
| `implants` | Sí | `array<object>` | Sin restricción adicional declarada | Implantes colocados, con sus identificadores | `[{"id":"00000000-0000-4000-8000-000000000001","procedureId":"00000000-0000-4000-8000-000000000001","implantDeviceId":"00000000-0000-4000-8000-000000000001","implantRoleConceptId":"00000000-0000-4000-8000-000000000001","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","lateralityConceptId":"00000000-0000-4000-8000-000000000001","implantedAt":"2026-07-31T12:00:00.000Z","explantedAt":"2026-07-31T12:00:00.000Z","statusConceptId":"00000000-0000-4000-8000-000000000001","identifiers":[{"id":"00000000-0000-4000-8000-000000000001","identifierTypeConceptId":"00000000-0000-4000-8000-000000000001","identifierValue":"valor-ejemplo","issuingSystem":"valor-ejemplo","lotNumber":"valor-ejemplo","serialNumber":"valor-ejemplo","expirationDate":"2026-07-31T12:00:00.000Z"}]}]` |
| `implants[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador del implante en el caso. | `00000000-0000-4000-8000-000000000001` |
| `implants[].procedureId` | Sí | `string` | Sin restricción adicional declarada | Procedimiento clínico al que se imputa. | `00000000-0000-4000-8000-000000000001` |
| `implants[].implantDeviceId` | Sí | `string` | Sin restricción adicional declarada | Dispositivo implantado. | `00000000-0000-4000-8000-000000000001` |
| `implants[].implantRoleConceptId` | Sí | `string` | Sin restricción adicional declarada | Papel del implante en la intervención. | `00000000-0000-4000-8000-000000000001` |
| `implants[].bodySiteConceptId` | No | `string` | Sin restricción adicional declarada | Sitio anatómico, si se registró. | `00000000-0000-4000-8000-000000000001` |
| `implants[].lateralityConceptId` | No | `string` | Sin restricción adicional declarada | Lateralidad, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `implants[].implantedAt` | Sí | `string` | formato `date-time` | Cuándo se implantó. | `2026-07-31T12:00:00.000Z` |
| `implants[].explantedAt` | No | `string` | formato `date-time` | Cuándo se explantó, si se explantó. | `2026-07-31T12:00:00.000Z` |
| `implants[].statusConceptId` | No | `string` | Sin restricción adicional declarada | Estado del implante, si se registró. | `00000000-0000-4000-8000-000000000001` |
| `implants[].identifiers` | Sí | `array<object>` | Sin restricción adicional declarada | UDI, lote y serie del implante. | `[{"id":"00000000-0000-4000-8000-000000000001","identifierTypeConceptId":"00000000-0000-4000-8000-000000000001","identifierValue":"valor-ejemplo","issuingSystem":"valor-ejemplo","lotNumber":"valor-ejemplo","serialNumber":"valor-ejemplo","expirationDate":"2026-07-31T12:00:00.000Z"}]` |
| `implants[].identifiers[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador de la fila. | `00000000-0000-4000-8000-000000000001` |
| `implants[].identifiers[].identifierTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de identificador (UDI-DI, UDI-PI, …). | `00000000-0000-4000-8000-000000000001` |
| `implants[].identifiers[].identifierValue` | Sí | `string` | Sin restricción adicional declarada | Valor del identificador. | `valor-ejemplo` |
| `implants[].identifiers[].issuingSystem` | No | `string` | Sin restricción adicional declarada | Sistema emisor, si consta. | `valor-ejemplo` |
| `implants[].identifiers[].lotNumber` | No | `string` | Sin restricción adicional declarada | Número de lote, si consta. | `valor-ejemplo` |
| `implants[].identifiers[].serialNumber` | No | `string` | Sin restricción adicional declarada | Número de serie, si consta. | `valor-ejemplo` |
| `implants[].identifiers[].expirationDate` | No | `string` | formato `date-time` | Vencimiento, si consta. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}"
}
```

---

## 9. PATCH /procedure-cases/{id}

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Modificar el caso quirúrgico
- **Operation ID:** `PeriopController_updateCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.updateCase](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

El paciente sólo puede corregirse con el caso en borrador y sin dependencias (CAN-INT-001).

Contexto declarado en el controlador: C-13 (CAN-INT-001).

### Descripción del sistema

NestJS resuelve `PATCH /procedure-cases/{id}` en `PeriopController_updateCase`. El controlador delega en `PeriopCasesService.updateCase`. Valida el body como `UpdateCaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<UpdateCaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateCaseDto`; los campos opcionales se omiten.

```http
PATCH /procedure-cases/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGERY_SCHEDULER`, `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | No | `string` | formato `uuid` | Paciente de la intervención. Sólo corregible con el caso en borrador y sin dependencias (CAN-INT-001). | `00000000-0000-4000-8000-000000000001` |
| `priority` | No | `string` | valores: `ROUTINE`, `URGENT`, `STAT` | Sin descripción específica en el contrato OpenAPI. | `ROUTINE` |
| `scheduledStartAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `scheduledEndAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `urgencyReasonText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /procedure-cases/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "priority": "ROUTINE",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z",
  "urgencyReasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<UpdateCaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `UpdateCaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "patientChanged": true,
  "reacceptanceRequired": true,
  "acceptancesInvalidated": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente vigente del caso | `00000000-0000-4000-8000-000000000001` |
| `patientChanged` | Sí | `boolean` | Sin restricción adicional declarada | true si se corrigió el paciente del caso | `true` |
| `reacceptanceRequired` | Sí | `boolean` | Sin restricción adicional declarada | true si la modificación fue relevante y el equipo debe volver a aceptar | `true` |
| `acceptancesInvalidated` | Sí | `number` | Sin restricción adicional declarada | Aceptaciones que quedaron invalidadas por la modificación relevante | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | CAN-INT-001: el paciente de la intervención no puede cambiarse una vez confirmada; cancele el caso y cree uno nuevo | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | CAN-INT-001: el paciente no puede cambiarse: el caso ya tiene asignaciones o evidencias asociadas | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso debe terminar después de empezar | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}"
}
```

---

## 10. POST /procedure-cases/{id}/anesthesia-events

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Anotar un evento intraoperatorio de anestesia
- **Operation ID:** `PeriopController_recordAnesthesiaEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.recordAnesthesiaEvent](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Log append-only; la inducción exige plan aprobado y abre el caso.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/anesthesia-events` en `PeriopController_recordAnesthesiaEvent`. El controlador delega en `PeriopPreopService.recordAnesthesiaEvent`. Valida el body como `RecordAnesthesiaEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<AnesthesiaEventResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordAnesthesiaEventDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/anesthesia-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "eventType": "INDUCTION",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `eventType` | Sí | `string` | valores: `INDUCTION`, `INTUBATION`, `MEDICATION`, `VITALS`, `EMERGENCE`, `COMPLICATION` | Sin descripción específica en el contrato OpenAPI. | `INDUCTION` |
| `occurredAt` | Sí | `string` | formato `date-time` | Momento del evento | `2026-07-31T12:00:00.000Z` |
| `severity` | No | `string` | valores: `ROUTINE`, `MINOR`, `MAJOR`, `CRITICAL` | Sin descripción específica en el contrato OpenAPI. | `ROUTINE` |
| `medicationAdministrationId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `observationId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `deviceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `performedByProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `detailsJson` | No | `object` | Sin restricción adicional declarada | Detalle del evento | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/anesthesia-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "eventType": "INDUCTION",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "severity": "ROUTINE",
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "observationId": "00000000-0000-4000-8000-000000000001",
  "deviceId": "00000000-0000-4000-8000-000000000001",
  "performedByProfileId": "00000000-0000-4000-8000-000000000001",
  "detailsJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AnesthesiaEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AnesthesiaEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "milestoneId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `eventTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a event type concept. | `00000000-0000-4000-8000-000000000001` |
| `milestoneId` | No | `string` | formato `uuid` | Hito creado si el evento fue inducción o despertar | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | La inducción exige un plan de anestesia aprobado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/anesthesia-events"
}
```

---

## 11. POST /procedure-cases/{id}/anesthesia-plans

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar el plan de anestesia y la valoración de vía aérea
- **Operation ID:** `PeriopController_createAnesthesiaPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.createAnesthesiaPlan](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Anticipar vía aérea difícil obliga a declarar el plan de rescate.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/anesthesia-plans` en `PeriopController_createAnesthesiaPlan`. El controlador delega en `PeriopPreopService.createAnesthesiaPlan`. Valida el body como `CreateAnesthesiaPlanDto` y consume `application/json`. El tipo de retorno estático es `Promise<AnesthesiaPlanResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAnesthesiaPlanDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/anesthesia-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "anesthesiologistProfileId": "00000000-0000-4000-8000-000000000001",
  "anesthesiaType": "GENERAL",
  "airwayAssessment": {
    "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
    "difficultAirwayExpected": true
  }
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANESTHESIOLOGIST`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `anesthesiologistProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `anesthesiaType` | Sí | `string` | valores: `GENERAL`, `REGIONAL`, `LOCAL`, `SEDATION` | Sin descripción específica en el contrato OpenAPI. | `GENERAL` |
| `airwayPlan` | No | `string` | valores: `ETT`, `LMA`, `MASK` | Sin descripción específica en el contrato OpenAPI. | `ETT` |
| `monitoringPlanJson` | No | `object` | Sin restricción adicional declarada | Monitorización planificada | `{}` |
| `medicationsPlanJson` | No | `object` | Sin restricción adicional declarada | Medicación planificada | `{}` |
| `postoperativeAnalgesiaPlanText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `airwayAssessment` | Sí | `AirwayAssessmentDto` | Sin restricción adicional declarada | Valoración de vía aérea | `{"assessedByProfileId":"00000000-0000-4000-8000-000000000001","mallampati":"I","mouthOpeningMm":"valor-ejemplo","thyromentalDistanceMm":"valor-ejemplo","difficultAirwayExpected":true,"rescuePlanText":"valor-ejemplo"}` |
| `airwayAssessment.assessedByProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `airwayAssessment.mallampati` | No | `string` | valores: `I`, `II`, `III`, `IV` | Sin descripción específica en el contrato OpenAPI. | `I` |
| `airwayAssessment.mouthOpeningMm` | No | `string` | Sin restricción adicional declarada | Apertura bucal en milímetros | `valor-ejemplo` |
| `airwayAssessment.thyromentalDistanceMm` | No | `string` | Sin restricción adicional declarada | Distancia tiromentoniana en milímetros | `valor-ejemplo` |
| `airwayAssessment.difficultAirwayExpected` | Sí | `boolean` | Sin restricción adicional declarada | Se anticipa vía aérea difícil | `true` |
| `airwayAssessment.rescuePlanText` | No | `string` | Sin restricción adicional declarada | Plan de rescate; obligatorio si se anticipa vía aérea difícil | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/anesthesia-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "anesthesiologistProfileId": "00000000-0000-4000-8000-000000000001",
  "anesthesiaType": "GENERAL",
  "airwayPlan": "ETT",
  "monitoringPlanJson": {},
  "medicationsPlanJson": {},
  "postoperativeAnalgesiaPlanText": "valor-ejemplo",
  "airwayAssessment": {
    "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
    "mallampati": "I",
    "mouthOpeningMm": "valor-ejemplo",
    "thyromentalDistanceMm": "valor-ejemplo",
    "difficultAirwayExpected": true,
    "rescuePlanText": "valor-ejemplo"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AnesthesiaPlanResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AnesthesiaPlanResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "airwayAssessmentId": "00000000-0000-4000-8000-000000000001",
  "difficultAirwayExpected": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `airwayAssessmentId` | Sí | `string` | formato `uuid` | Identificador asociado a airway assessment. | `00000000-0000-4000-8000-000000000001` |
| `difficultAirwayExpected` | Sí | `boolean` | Sin restricción adicional declarada | true si se anticipa vía aérea difícil | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANESTHESIOLOGIST, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 409 | `CONFLICT` | El caso ya tiene plan de anestesia | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una vía aérea difícil anticipada necesita plan de rescate | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/anesthesia-plans"
}
```

---

## 12. POST /procedure-cases/{id}/anesthesia-plans/{planId}/approve

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Aprobar el plan de anestesia
- **Operation ID:** `PeriopController_approveAnesthesiaPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.approveAnesthesiaPlan](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Aprobar el plan de anestesia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/anesthesia-plans/{planId}/approve` en `PeriopController_approveAnesthesiaPlan`. El controlador delega en `PeriopPreopService.approveAnesthesiaPlan`. No recibe body. El tipo de retorno estático es `Promise<ApprovePlanResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/anesthesia-plans/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANESTHESIOLOGIST`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`, `planId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/anesthesia-plans/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ApprovePlanResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ApprovePlanResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "anesthesiologistProfileId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `anesthesiologistProfileId` | Sí | `string` | formato `uuid` | Anestesiólogo asignado al caso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANESTHESIOLOGIST, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plan de anestesia no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 409 | `CONFLICT` | El plan ya está aprobado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | El plan pertenece a otro caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/anesthesia-plans/{planId}/approve"
}
```

---

## 13. POST /procedure-cases/{id}/cancel

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Cancelar el caso quirúrgico
- **Operation ID:** `PeriopController_cancelCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.cancelCase](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Libera el quirófano en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/cancel` en `PeriopController_cancelCase`. El controlador delega en `PeriopCasesService.cancelCase`. Valida el body como `CancelCaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<CancelCaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CancelCaseDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cancellationReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "PATIENT",
  "preventable": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGERY_SCHEDULER`, `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `cancellationReasonConceptId` | Sí | `string` | formato `uuid` | Motivo de la cancelación | `00000000-0000-4000-8000-000000000001` |
| `category` | Sí | `string` | valores: `PATIENT`, `FACILITY`, `CLINICAL` | Sin descripción específica en el contrato OpenAPI. | `PATIENT` |
| `preventable` | Sí | `boolean` | Sin restricción adicional declarada | Si era evitable; es lo que mide la calidad del proceso | `true` |
| `explanationText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rescheduleRequired` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cancellationReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "PATIENT",
  "preventable": true,
  "explanationText": "valor-ejemplo",
  "rescheduleRequired": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CancelCaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CancelCaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "cancellationId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomReleased": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `cancellationId` | Sí | `string` | formato `uuid` | Registro de la cancelación | `00000000-0000-4000-8000-000000000001` |
| `operatingRoomReleased` | Sí | `boolean` | Sin restricción adicional declarada | true si se liberó el quirófano reservado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 409 | `CONFLICT` | El caso ya está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso no admite cancelación en su estado actual | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/cancel"
}
```

---

## 14. POST /procedure-cases/{id}/charge-items/post

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Generar los cargos y consolidar el uso del quirófano
- **Operation ID:** `PeriopController_postCharges`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.postCharges](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Sólo se factura un caso completado.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/charge-items/post` en `PeriopController_postCharges`. El controlador delega en `PeriopCasesService.postCharges`. Valida el body como `PostChargesDto` y consume `application/json`. El tipo de retorno estático es `Promise<PostChargesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PostChargesDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/charge-items/post HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "items": [
    {
      "chargeType": "PROCEDURE",
      "billableItemId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PERIOP_ADMIN`, `BILLING`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ChargeItemDto>` | mínimo 1 elemento(s) | Cargos a generar, al menos uno | `[{"chargeType":"PROCEDURE","billableItemId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPrice":"valor-ejemplo","currencyCode":"BOB"}]` |
| `items[].chargeType` | Sí | `string` | valores: `PROCEDURE`, `IMPLANT`, `SUPPLY`, `OR_TIME` | Sin descripción específica en el contrato OpenAPI. | `PROCEDURE` |
| `items[].billableItemId` | Sí | `string` | formato `uuid` | Concepto facturable del catálogo | `00000000-0000-4000-8000-000000000001` |
| `items[].quantity` | Sí | `string` | Sin restricción adicional declarada | Cantidad, como cadena decimal | `valor-ejemplo` |
| `items[].unitPrice` | No | `string` | Sin restricción adicional declarada | Precio unitario | `valor-ejemplo` |
| `items[].currencyCode` | No | `string` | longitud máxima 3 | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `consolidateUtilization` | No | `boolean` | Sin restricción adicional declarada | Consolidar además el uso real del quirófano | `true` |
| `turnoverSeconds` | No | `number` | mínimo 0 | Segundos de recambio hasta el siguiente caso | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/charge-items/post HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "items": [
    {
      "chargeType": "PROCEDURE",
      "billableItemId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPrice": "valor-ejemplo",
      "currencyCode": "BOB"
    }
  ],
  "consolidateUtilization": true,
  "turnoverSeconds": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PostChargesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PostChargesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "procedureCaseId": "00000000-0000-4000-8000-000000000001",
  "charged": 1,
  "totalAmount": "valor-ejemplo",
  "actualDurationSeconds": 1,
  "scheduleVarianceSeconds": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |
| `charged` | Sí | `number` | Sin restricción adicional declarada | Cargos generados | `1` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Importe total de los cargos | `valor-ejemplo` |
| `actualDurationSeconds` | No | `number` | Sin restricción adicional declarada | Duración real del caso, en segundos | `1` |
| `scheduleVarianceSeconds` | No | `number` | Sin restricción adicional declarada | Desviación frente a lo programado, en segundos | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PERIOP_ADMIN, BILLING. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 409 | `CONFLICT` | El caso ya tiene cargos emitidos | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se factura un caso completado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/charge-items/post"
}
```

---

## 15. POST /procedure-cases/{id}/confirm

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Confirmar la intervención verificando las credenciales del equipo
- **Operation ID:** `PeriopController_confirmCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.confirmCase](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Bloquea la confirmación si algún integrante no tiene credencial profesional vigente (CAN-INT-002).

Contexto declarado en el controlador: C-14 (CAN-INT-002).

### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/confirm` en `PeriopController_confirmCase`. El controlador delega en `PeriopCasesService.confirmCase`. No recibe body. El tipo de retorno estático es `Promise<ConfirmCaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGERY_SCHEDULER`, `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConfirmCaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConfirmCaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "teamVerified": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado tras confirmar | `00000000-0000-4000-8000-000000000001` |
| `teamVerified` | Sí | `number` | Sin restricción adicional declarada | Miembros del equipo con credencial verificada al confirmar | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso no admite confirmación en su estado actual | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | CAN-INT-002: no puede confirmarse: hay integrantes del equipo sin credencial profesional vigente | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/confirm"
}
```

---

## 16. POST /procedure-cases/{id}/diagnoses

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar los diagnósticos del caso
- **Operation ID:** `PeriopController_addDiagnoses`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.addDiagnoses](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

El caso admite un único diagnóstico principal.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/diagnoses` en `PeriopController_addDiagnoses`. El controlador delega en `PeriopCasesService.addDiagnoses`. Valida el body como `AddDiagnosesDto` y consume `application/json`. El tipo de retorno estático es `Promise<DiagnosesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddDiagnosesDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/diagnoses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "diagnoses": [
    {
      "role": "PRIMARY"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `diagnoses` | Sí | `array<CaseDiagnosisDto>` | mínimo 1 elemento(s) | Diagnósticos del caso, al menos uno | `[{"conditionId":"00000000-0000-4000-8000-000000000001","conditionCodeConceptId":"00000000-0000-4000-8000-000000000001","role":"PRIMARY","presentOnAdmission":false}]` |
| `diagnoses[].conditionId` | No | `string` | formato `uuid` | Condición ya registrada en la historia clínica | `00000000-0000-4000-8000-000000000001` |
| `diagnoses[].conditionCodeConceptId` | No | `string` | formato `uuid` | Código de la condición a registrar si aún no existe | `00000000-0000-4000-8000-000000000001` |
| `diagnoses[].role` | Sí | `string` | valores: `PRIMARY`, `SECONDARY`, `POSTOPERATIVE` | Sin descripción específica en el contrato OpenAPI. | `PRIMARY` |
| `diagnoses[].presentOnAdmission` | No | `boolean` | Sin restricción adicional declarada | Presente al ingresar | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/diagnoses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "diagnoses": [
    {
      "conditionId": "00000000-0000-4000-8000-000000000001",
      "conditionCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "role": "PRIMARY",
      "presentOnAdmission": false
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DiagnosesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "procedureCaseId": "00000000-0000-4000-8000-000000000001",
  "diagnosisIds": [
    "valor-ejemplo"
  ],
  "skipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |
| `diagnosisIds` | Sí | `array<string>` | formato `uuid` | Valor de diagnosis ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Diagnósticos que ya estaban registrados y se omitieron | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 409 | `CONFLICT` | El caso sólo admite un diagnóstico principal | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 409 | `CONFLICT` | El paciente ya tiene esa condición activa | Excepción explícita en src/modules/clinical/services/conditions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | Indique la condición por `conditionId` o por `conditionCodeConceptId` | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/diagnoses"
}
```

---

## 17. POST /procedure-cases/{id}/findings

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar un hallazgo operatorio
- **Operation ID:** `PeriopController_recordFinding`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.recordFinding](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Inmutable; su sitio anatómico se acumula en el procedimiento.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/findings` en `PeriopController_recordFinding`. El controlador delega en `PeriopIntraopService.recordFinding`. Valida el body como `RecordFindingDto` y consume `application/json`. El tipo de retorno estático es `Promise<FindingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordFindingDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/findings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "findingCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "findingText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `findingCodeConceptId` | Sí | `string` | formato `uuid` | Código del hallazgo | `00000000-0000-4000-8000-000000000001` |
| `findingText` | Sí | `string` | Sin restricción adicional declarada | Qué se encontró | `valor-ejemplo` |
| `operativeStepId` | No | `string` | formato `uuid` | Paso en el que se observó | `00000000-0000-4000-8000-000000000001` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `laterality` | No | `string` | valores: `LEFT`, `RIGHT`, `BILATERAL` | Sin descripción específica en el contrato OpenAPI. | `LEFT` |
| `severity` | No | `string` | valores: `ROUTINE`, `MINOR`, `MAJOR`, `CRITICAL` | Sin descripción específica en el contrato OpenAPI. | `ROUTINE` |
| `observationId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `recordedByProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/findings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "findingCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "findingText": "valor-ejemplo",
  "operativeStepId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT",
  "severity": "ROUTINE",
  "observationId": "00000000-0000-4000-8000-000000000001",
  "recordedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FindingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FindingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paso operatorio no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El paso pertenece a otro caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso no está en curso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/findings"
}
```

---

## 18. POST /procedure-cases/{id}/implants

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar un implante con su trazabilidad UDI, lote o serie
- **Operation ID:** `PeriopController_recordImplant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.recordImplant](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Al menos un identificador es obligatorio.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/implants` en `PeriopController_recordImplant`. El controlador delega en `PeriopIntraopService.recordImplant`. Valida el body como `RecordImplantDto` y consume `application/json`. El tipo de retorno estático es `Promise<ImplantResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordImplantDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/implants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "implantDeviceId": "00000000-0000-4000-8000-000000000001",
  "implantRole": "PRIMARY",
  "identifiers": [
    {
      "identifierType": "UDI_DI",
      "identifierValue": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `PERIOP_NURSE`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `procedureId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `implantDeviceId` | Sí | `string` | formato `uuid` | Dispositivo implantado | `00000000-0000-4000-8000-000000000001` |
| `implantRole` | Sí | `string` | valores: `PRIMARY`, `ADJUNCT` | Sin descripción específica en el contrato OpenAPI. | `PRIMARY` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `laterality` | No | `string` | valores: `LEFT`, `RIGHT`, `BILATERAL` | Sin descripción específica en el contrato OpenAPI. | `LEFT` |
| `identifiers` | Sí | `array<ImplantIdentifierDto>` | mínimo 1 elemento(s) | Identificadores de trazabilidad, al menos uno | `[{"identifierType":"UDI_DI","identifierValue":"valor-ejemplo","issuingSystem":"valor-ejemplo","lotNumber":"valor-ejemplo","serialNumber":"valor-ejemplo","expirationDate":"2026-07-31"}]` |
| `identifiers[].identifierType` | Sí | `string` | valores: `UDI_DI`, `UDI_PI`, `SERIAL` | Sin descripción específica en el contrato OpenAPI. | `UDI_DI` |
| `identifiers[].identifierValue` | Sí | `string` | longitud máxima 200 | Valor del identificador | `valor-ejemplo` |
| `identifiers[].issuingSystem` | No | `string` | longitud máxima 100 | Sistema emisor | `valor-ejemplo` |
| `identifiers[].lotNumber` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `identifiers[].serialNumber` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `identifiers[].expirationDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `udiCarrier` | No | `string` | longitud máxima 300 | Portador UDI leído del envase | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/implants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "implantDeviceId": "00000000-0000-4000-8000-000000000001",
  "implantRole": "PRIMARY",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT",
  "identifiers": [
    {
      "identifierType": "UDI_DI",
      "identifierValue": "valor-ejemplo",
      "issuingSystem": "valor-ejemplo",
      "lotNumber": "valor-ejemplo",
      "serialNumber": "valor-ejemplo",
      "expirationDate": "2026-07-31"
    }
  ],
  "udiCarrier": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ImplantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImplantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImplantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "identifierIds": [
    "valor-ejemplo"
  ],
  "deviceUseId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `identifierIds` | Sí | `array<string>` | formato `uuid` | Valor de identifier ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `deviceUseId` | Sí | `string` | formato `uuid` | Registro del dispositivo usado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, PERIOP_NURSE, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso no está en curso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/implants"
}
```

---

## 19. POST /procedure-cases/{id}/medication-uses

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar el uso de un medicamento en la intervención
- **Operation ID:** `PeriopController_recordMedicationUse`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.recordMedicationUse](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Registrar el uso de un medicamento en la intervención. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/medication-uses` en `PeriopController_recordMedicationUse`. El controlador delega en `PeriopIntraopService.recordMedicationUse`. Valida el body como `RecordMedicationUseDto` y consume `application/json`. El tipo de retorno estático es `Promise<SuppliesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordMedicationUseDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/medication-uses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "useRole": "ANESTHESIA"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `medicationAdministrationId` | Sí | `string` | formato `uuid` | Administración registrada en farmacia | `00000000-0000-4000-8000-000000000001` |
| `useRole` | Sí | `string` | valores: `ANESTHESIA`, `ANTIBIOTIC`, `ANALGESIA` | Sin descripción específica en el contrato OpenAPI. | `ANESTHESIA` |
| `procedureId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `operativeStepId` | No | `string` | formato `uuid` | Paso durante el que se administró | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/medication-uses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "useRole": "ANESTHESIA",
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "operativeStepId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SuppliesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "procedureCaseId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El paso no pertenece al caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso no está en curso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/medication-uses"
}
```

---

## 20. POST /procedure-cases/{id}/operative-reports

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Redactar el reporte operatorio
- **Operation ID:** `PeriopController_draftReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.draftReport](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Cada versión es inmutable; corregir es escribir una nueva.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/operative-reports` en `PeriopController_draftReport`. El controlador delega en `PeriopIntraopService.draftReport`. Valida el body como `DraftOperativeReportDto` y consume `application/json`. El tipo de retorno estático es `Promise<OperativeReportResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DraftOperativeReportDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/operative-reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureDescription": "Texto descriptivo de ejemplo",
  "disposition": "PACU"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `procedureId` | No | `string` | formato `uuid` | Procedimiento ya registrado en la historia clínica | `00000000-0000-4000-8000-000000000001` |
| `procedureCodeConceptId` | No | `string` | formato `uuid` | Código del procedimiento a registrar si aún no existe | `00000000-0000-4000-8000-000000000001` |
| `authorProfileId` | Sí | `string` | formato `uuid` | Autor del reporte | `00000000-0000-4000-8000-000000000001` |
| `preoperativeDiagnosisText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `postoperativeDiagnosisText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `procedureDescription` | Sí | `string` | Sin restricción adicional declarada | Descripción de lo realizado | `Texto descriptivo de ejemplo` |
| `findingsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `estimatedBloodLossMl` | No | `string` | Sin restricción adicional declarada | Sangrado estimado en mililitros | `valor-ejemplo` |
| `drainsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `complicationsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `disposition` | Sí | `string` | valores: `PACU`, `ICU`, `WARD`, `HOME` | Sin descripción específica en el contrato OpenAPI. | `PACU` |
| `complications` | No | `array<ComplicationDto>` | Sin restricción adicional declarada | Complicaciones a registrar | `[{"complicationCodeConceptId":"00000000-0000-4000-8000-000000000001","severity":"ROUTINE","relatedness":"PROCEDURE","conditionId":"00000000-0000-4000-8000-000000000001","managementText":"valor-ejemplo"}]` |
| `complications[].complicationCodeConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `complications[].severity` | No | `string` | valores: `ROUTINE`, `MINOR`, `MAJOR`, `CRITICAL` | Sin descripción específica en el contrato OpenAPI. | `ROUTINE` |
| `complications[].relatedness` | No | `string` | valores: `PROCEDURE`, `ANESTHESIA`, `UNRELATED` | Sin descripción específica en el contrato OpenAPI. | `PROCEDURE` |
| `complications[].conditionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `complications[].managementText` | No | `string` | Sin restricción adicional declarada | Cómo se manejó | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/operative-reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "preoperativeDiagnosisText": "valor-ejemplo",
  "postoperativeDiagnosisText": "valor-ejemplo",
  "procedureDescription": "Texto descriptivo de ejemplo",
  "findingsText": "valor-ejemplo",
  "estimatedBloodLossMl": "valor-ejemplo",
  "drainsText": "valor-ejemplo",
  "complicationsText": "valor-ejemplo",
  "disposition": "PACU",
  "complications": [
    {
      "complicationCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "severity": "ROUTINE",
      "relatedness": "PROCEDURE",
      "conditionId": "00000000-0000-4000-8000-000000000001",
      "managementText": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OperativeReportResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperativeReportResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "reportVersion": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "complicationIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `reportVersion` | Sí | `number` | Sin restricción adicional declarada | Versión del reporte | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `complicationIds` | Sí | `array<string>` | formato `uuid` | Valor de complication ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 404 | `NOT_FOUND` | Orden de servicio no encontrada | Excepción explícita en src/modules/clinical/services/procedures.service.ts |
| 404 | `NOT_FOUND` | Procedimiento padre no encontrado | Excepción explícita en src/modules/clinical/services/procedures.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 422 | `PRECONDITION_FAILED` | Indique el procedimiento por `procedureId` o por `procedureCodeConceptId` | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/operative-reports"
}
```

---

## 21. POST /procedure-cases/{id}/operative-reports/{reportId}/sign

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Firmar el reporte operatorio
- **Operation ID:** `PeriopController_signReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.signReport](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Firmar cierra el caso quirúrgico.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/operative-reports/{reportId}/sign` en `PeriopController_signReport`. El controlador delega en `PeriopIntraopService.signReport`. Valida el body como `SignReportDto` y consume `application/json`. El tipo de retorno estático es `Promise<SignReportResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SignReportDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/operative-reports/00000000-0000-4000-8000-000000000001/sign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signatureId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`, `reportId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `signatureId` | Sí | `string` | formato `uuid` | Firma electrónica aplicada | `00000000-0000-4000-8000-000000000001` |
| `fileId` | No | `string` | formato `uuid` | Documento firmado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/operative-reports/00000000-0000-4000-8000-000000000001/sign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signatureId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SignReportResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SignReportResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "caseStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `caseStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda el caso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reporte operatorio no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 409 | `CONFLICT` | El reporte ya está firmado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El reporte pertenece a otro caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/operative-reports/{reportId}/sign"
}
```

---

## 22. POST /procedure-cases/{id}/operative-steps

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar un paso operatorio
- **Operation ID:** `PeriopController_createStep`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.createStep](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Registrar un paso operatorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/operative-steps` en `PeriopController_createStep`. El controlador delega en `PeriopIntraopService.createStep`. Valida el body como `CreateOperativeStepDto` y consume `application/json`. El tipo de retorno estático es `Promise<OperativeStepResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateOperativeStepDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/operative-steps HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "stepCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `PERIOP_NURSE`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `stepCodeConceptId` | Sí | `string` | formato `uuid` | Código del paso operatorio | `00000000-0000-4000-8000-000000000001` |
| `description` | Sí | `string` | Sin restricción adicional declarada | Qué se hizo | `Texto descriptivo de ejemplo` |
| `procedureId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `performedByProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Sitio anatómico intervenido | `00000000-0000-4000-8000-000000000001` |
| `laterality` | No | `string` | valores: `LEFT`, `RIGHT`, `BILATERAL` | Sin descripción específica en el contrato OpenAPI. | `LEFT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/operative-steps HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "stepCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "performedByProfileId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OperativeStepResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperativeStepResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "stepNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `stepNumber` | Sí | `number` | Sin restricción adicional declarada | Número del paso dentro del caso | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, PERIOP_NURSE, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso no está en curso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/operative-steps"
}
```

---

## 23. POST /procedure-cases/{id}/pacu-stays

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Admitir al paciente en recuperación
- **Operation ID:** `PeriopController_admitToPacu`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.admitToPacu](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Admitir al paciente en recuperación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/pacu-stays` en `PeriopController_admitToPacu`. El controlador delega en `PeriopIntraopService.admitToPacu`. Valida el body como `AdmitToPacuDto` y consume `application/json`. El tipo de retorno estático es `Promise<PacuStayResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdmitToPacuDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/pacu-stays HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "careSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PERIOP_NURSE`, `ANESTHESIOLOGIST`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `careSpaceId` | Sí | `string` | formato `uuid` | Espacio de recuperación | `00000000-0000-4000-8000-000000000001` |
| `admittedByProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/pacu-stays HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "admittedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PacuStayResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PacuStayResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "locationId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `locationId` | Sí | `string` | formato `uuid` | Ubicación del caso creada | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 409 | `CONFLICT` | El caso ya tiene estancia en recuperación | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/pacu-stays"
}
```

---

## 24. POST /procedure-cases/{id}/preoperative-assessments

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar la valoración preoperatoria y sus puntuaciones de riesgo
- **Operation ID:** `PeriopController_createAssessment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.createAssessment](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Exige revisar alergias y medicación; las puntuaciones son inmutables.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/preoperative-assessments` en `PeriopController_createAssessment`. El controlador delega en `PeriopPreopService.createAssessment`. Valida el body como `CreatePreopAssessmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<PreopAssessmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePreopAssessmentDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/preoperative-assessments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "assessmentType": "ANESTHESIA",
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "fitnessStatus": "FIT",
  "allergiesReviewed": true,
  "medicationsReviewed": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANESTHESIOLOGIST`, `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `assessmentType` | Sí | `string` | valores: `ANESTHESIA`, `SURGICAL` | Sin descripción específica en el contrato OpenAPI. | `ANESTHESIA` |
| `assessedByProfileId` | Sí | `string` | formato `uuid` | Profesional que valora | `00000000-0000-4000-8000-000000000001` |
| `fitnessStatus` | Sí | `string` | valores: `FIT`, `FIT_WITH_CAUTION`, `UNFIT` | Sin descripción específica en el contrato OpenAPI. | `FIT` |
| `asaClass` | No | `string` | valores: `I`, `II`, `III`, `IV`, `V` | Sin descripción específica en el contrato OpenAPI. | `I` |
| `allergiesReviewed` | Sí | `boolean` | Sin restricción adicional declarada | Se revisaron las alergias del paciente | `true` |
| `medicationsReviewed` | Sí | `boolean` | Sin restricción adicional declarada | Se revisó la medicación del paciente | `true` |
| `anticoagulationPlanText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `fastingInstructionsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assessmentJson` | No | `object` | Sin restricción adicional declarada | Detalle estructurado de la valoración | `{}` |
| `riskScores` | No | `array<RiskScoreDto>` | Sin restricción adicional declarada | Puntuaciones de riesgo calculadas | `[{"model":"ASA","modelVersion":"valor-ejemplo","scoreValue":"valor-ejemplo","inputsJson":{},"interpretationText":"valor-ejemplo"}]` |
| `riskScores[].model` | No | `string` | valores: `ASA`, `RCRI`, `APFEL` | Sin descripción específica en el contrato OpenAPI. | `ASA` |
| `riskScores[].modelVersion` | No | `string` | longitud máxima 50 | Versión del modelo aplicada | `valor-ejemplo` |
| `riskScores[].scoreValue` | No | `string` | Sin restricción adicional declarada | Puntuación obtenida | `valor-ejemplo` |
| `riskScores[].inputsJson` | No | `object` | Sin restricción adicional declarada | Entradas con las que se calculó | `{}` |
| `riskScores[].interpretationText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/preoperative-assessments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "assessmentType": "ANESTHESIA",
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "fitnessStatus": "FIT",
  "asaClass": "I",
  "allergiesReviewed": true,
  "medicationsReviewed": true,
  "anticoagulationPlanText": "valor-ejemplo",
  "fastingInstructionsText": "valor-ejemplo",
  "assessmentJson": {},
  "riskScores": [
    {
      "model": "ASA",
      "modelVersion": "valor-ejemplo",
      "scoreValue": "valor-ejemplo",
      "inputsJson": {},
      "interpretationText": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PreopAssessmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PreopAssessmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "fitnessStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "riskScoreIds": [
    "valor-ejemplo"
  ],
  "milestoneId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `fitnessStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a fitness status concept. | `00000000-0000-4000-8000-000000000001` |
| `riskScoreIds` | Sí | `array<string>` | formato `uuid` | Valor de risk score ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `milestoneId` | No | `string` | formato `uuid` | Hito de aptitud preoperatoria, si el paciente quedó apto | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 409 | `CONFLICT` | El caso ya tiene valoración preoperatoria | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La valoración exige revisar alergias y medicación | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/preoperative-assessments"
}
```

---

## 25. POST /procedure-cases/{id}/preoperative-orders

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Indicar una orden preoperatoria para el caso
- **Operation ID:** `PeriopController_createPreoperativeOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.createPreoperativeOrder](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

La orden clínica puede venir por id o declararse por código, en cuyo caso se registra en la historia.

Contexto declarado en el controlador: UC-53-04: indicar una orden preoperatoria. El endpoint no existía: sin él ningún caso tenía órdenes, y como el caso sólo pasa a `READY_FOR_SURGERY` cuando se verifican las que tiene, el circuito preoperatorio no podía cerrarse.

### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/preoperative-orders` en `PeriopController_createPreoperativeOrder`. El controlador delega en `PeriopPreopService.createOrder`. Valida el body como `CreatePreoperativeOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<PreoperativeOrderResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePreoperativeOrderDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/preoperative-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "orderRole": "LAB"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANESTHESIOLOGIST`, `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `serviceRequestId` | No | `string` | formato `uuid` | Orden clínica ya existente | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestCodeConceptId` | No | `string` | formato `uuid` | Código de la orden clínica a registrar si aún no existe | `00000000-0000-4000-8000-000000000001` |
| `orderRole` | Sí | `string` | valores: `LAB`, `IMAGING`, `CONSULT`, `MEDICATION` | Sin descripción específica en el contrato OpenAPI. | `LAB` |
| `mandatory` | No | `boolean` | Sin restricción adicional declarada | Si es obligatoria antes de la cirugía; una pendiente impide que el caso quede listo | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/preoperative-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "orderRole": "LAB",
  "mandatory": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PreoperativeOrderResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PreoperativeOrderResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a service request. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 404 | `NOT_FOUND` | Encuentro no encontrado | Excepción explícita en src/modules/clinical/services/service-requests.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Indique la orden por `serviceRequestId` o por `serviceRequestCodeConceptId` | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | El paciente ya tiene este estudio dentro de la ventana; hace falta reutilizar el informe o justificar la repetición | Excepción explícita en src/modules/clinical/services/service-requests.service.ts |
| 422 | `PRECONDITION_FAILED` | El informe previo indicado no coincide con el duplicado detectado | Excepción explícita en src/modules/clinical/services/service-requests.service.ts |
| 422 | `PRECONDITION_FAILED` | No se detectó ningún estudio duplicado para justificar | Excepción explícita en src/modules/clinical/services/service-requests.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/preoperative-orders"
}
```

---

## 26. POST /procedure-cases/{id}/preoperative-orders/verify

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Verificar las órdenes preoperatorias
- **Operation ID:** `PeriopController_verifyOrders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.verifyOrders](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

El caso pasa a listo sólo cuando no queda ninguna pendiente.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/preoperative-orders/verify` en `PeriopController_verifyOrders`. El controlador delega en `PeriopPreopService.verifyOrders`. Valida el body como `VerifyOrdersDto` y consume `application/json`. El tipo de retorno estático es `Promise<VerifyOrdersResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyOrdersDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/preoperative-orders/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "orderIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `orderIds` | Sí | `array<string>` | formato `uuid`; mínimo 1 elemento(s) | Órdenes que se dan por verificadas | `["00000000-0000-4000-8000-000000000001"]` |
| `verifiedByProfileId` | Sí | `string` | formato `uuid` | Profesional que verifica | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/preoperative-orders/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "orderIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerifyOrdersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerifyOrdersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "procedureCaseId": "00000000-0000-4000-8000-000000000001",
  "verified": 1,
  "pendingMandatory": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |
| `verified` | Sí | `number` | Sin restricción adicional declarada | Órdenes que pasaron a verificadas | `1` |
| `pendingMandatory` | Sí | `number` | Sin restricción adicional declarada | Órdenes obligatorias que siguen pendientes | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda el caso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 404 | `NOT_FOUND` | Orden preoperatoria no encontrada en el caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo un caso programado admite verificación de órdenes | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/preoperative-orders/verify"
}
```

---

## 27. POST /procedure-cases/{id}/safety-checklists/{checklistId}/responses

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Responder una fase del checklist quirúrgico
- **Operation ID:** `PeriopController_submitChecklistPhase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.submitChecklistPhase](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Las respuestas son inmutables; una excepción exige justificación.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/safety-checklists/{checklistId}/responses` en `PeriopController_submitChecklistPhase`. El controlador delega en `PeriopPreopService.submitChecklistPhase`. Valida el body como `SubmitChecklistPhaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<ChecklistPhaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `checklistId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubmitChecklistPhaseDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/safety-checklists/00000000-0000-4000-8000-000000000001/responses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "phase": "SIGN_IN",
  "respondedByProfileId": "00000000-0000-4000-8000-000000000001",
  "responses": [
    {
      "itemId": "00000000-0000-4000-8000-000000000001",
      "status": "CONFIRMED"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PERIOP_NURSE`, `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`, `checklistId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `phase` | Sí | `string` | valores: `SIGN_IN`, `TIME_OUT`, `SIGN_OUT` | Sin descripción específica en el contrato OpenAPI. | `SIGN_IN` |
| `respondedByProfileId` | Sí | `string` | formato `uuid` | Profesional que responde | `00000000-0000-4000-8000-000000000001` |
| `responses` | Sí | `array<ChecklistResponseItemDto>` | mínimo 1 elemento(s) | Respuestas de la fase | `[{"itemId":"00000000-0000-4000-8000-000000000001","status":"CONFIRMED","responseBoolean":true,"responseText":"valor-ejemplo","exceptionReason":"Texto descriptivo de ejemplo"}]` |
| `responses[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `responses[].status` | Sí | `string` | valores: `CONFIRMED`, `NOT_APPLICABLE`, `EXCEPTION` | Sin descripción específica en el contrato OpenAPI. | `CONFIRMED` |
| `responses[].responseBoolean` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `responses[].responseText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `responses[].exceptionReason` | No | `string` | Sin restricción adicional declarada | Justificación; obligatoria cuando la respuesta es EXCEPTION | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/safety-checklists/00000000-0000-4000-8000-000000000001/responses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "phase": "SIGN_IN",
  "respondedByProfileId": "00000000-0000-4000-8000-000000000001",
  "responses": [
    {
      "itemId": "00000000-0000-4000-8000-000000000001",
      "status": "CONFIRMED",
      "responseBoolean": true,
      "responseText": "valor-ejemplo",
      "exceptionReason": "Texto descriptivo de ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ChecklistPhaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChecklistPhaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "checklistId": "00000000-0000-4000-8000-000000000001",
  "recorded": 1,
  "phaseCompleted": true,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "milestoneId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `checklistId` | Sí | `string` | formato `uuid` | Identificador asociado a checklist. | `00000000-0000-4000-8000-000000000001` |
| `recorded` | Sí | `number` | Sin restricción adicional declarada | Respuestas registradas en esta fase | `1` |
| `phaseCompleted` | Sí | `boolean` | Sin restricción adicional declarada | true si la fase quedó completa | `true` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `milestoneId` | No | `string` | formato `uuid` | Hito de time-out, si la fase completada fue esa | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Checklist no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 409 | `CONFLICT` | El checklist ya está completo | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 409 | `CONFLICT` | La fase ya está completa | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una respuesta de excepción necesita justificación | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | El checklist pertenece a otro caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | La fase no tiene ítems definidos | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 422 | `PRECONDITION_FAILED` | El ítem no pertenece a esta fase | Excepción explícita en src/modules/procedures_perioperative/services/periop-preop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/safety-checklists/{checklistId}/responses"
}
```

---

## 28. POST /procedure-cases/{id}/specimens

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Registrar una muestra tomada en la intervención
- **Operation ID:** `PeriopController_recordSpecimen`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.recordSpecimen](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Registrar una muestra tomada en la intervención. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/specimens` en `PeriopController_recordSpecimen`. El controlador delega en `PeriopIntraopService.recordSpecimen`. Valida el body como `RecordSpecimenDto` y consume `application/json`. El tipo de retorno estático es `Promise<SuppliesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordSpecimenDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/specimens HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "specimenId": "00000000-0000-4000-8000-000000000001",
  "specimenRole": "BIOPSY"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `PERIOP_NURSE`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `procedureId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specimenId` | Sí | `string` | formato `uuid` | Muestra registrada en laboratorio | `00000000-0000-4000-8000-000000000001` |
| `specimenRole` | Sí | `string` | valores: `BIOPSY`, `RESECTION`, `CULTURE` | Sin descripción específica en el contrato OpenAPI. | `BIOPSY` |
| `operativeStepId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `orientationText` | No | `string` | Sin restricción adicional declarada | Orientación de la pieza para el patólogo | `valor-ejemplo` |
| `surgeonComment` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/specimens HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "specimenId": "00000000-0000-4000-8000-000000000001",
  "specimenRole": "BIOPSY",
  "operativeStepId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "orientationText": "valor-ejemplo",
  "surgeonComment": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SuppliesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SuppliesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "procedureCaseId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, PERIOP_NURSE, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El paso no pertenece al caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso no está en curso | Excepción explícita en src/modules/procedures_perioperative/services/periop-intraop.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/specimens"
}
```

---

## 29. GET /procedure-cases/{id}/team-members

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Listar el equipo del caso quirúrgico
- **Operation ID:** `PeriopController_listTeamMembers`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.listTeamMembers](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Listar el equipo del caso quirúrgico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Equipo asignado al caso. Es la única lectura del módulo, y existe porque sin ella el circuito no cierra: el cirujano principal se da de alta como integrante dentro de `POST /procedure-cases` —no hay respuesta que devuelva su id— y aceptar la participación exige ese id. Sin esta consulta, ese integrante no podía aceptar nunca y el caso no podía confirmarse.

### Descripción del sistema

NestJS resuelve `GET /procedure-cases/{id}/team-members` en `PeriopController_listTeamMembers`. El controlador delega en `PeriopCasesService.listTeamMembers`. No recibe body. El tipo de retorno estático es `Promise<TeamMemberSummaryDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /procedure-cases/00000000-0000-4000-8000-000000000001/team-members HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `SURGERY_SCHEDULER`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /procedure-cases/00000000-0000-4000-8000-000000000001/team-members HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TeamMemberSummaryDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<TeamMemberSummaryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<TeamMemberSummaryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<TeamMemberSummaryDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<TeamMemberSummaryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<TeamMemberSummaryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<TeamMemberSummaryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TeamMemberSummaryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
    "teamRoleConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/team-members"
}
```

---

## 30. POST /procedure-cases/{id}/team-members

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Asignar un miembro al equipo quirúrgico
- **Operation ID:** `PeriopController_assignTeamMember`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.assignTeamMember](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Asignar un miembro al equipo quirúrgico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/team-members` en `PeriopController_assignTeamMember`. El controlador delega en `PeriopCasesService.assignTeamMember`. Valida el body como `AssignTeamMemberDto` y consume `application/json`. El tipo de retorno estático es `Promise<TeamMemberResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AssignTeamMemberDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/team-members HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "role": "SURGEON"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGERY_SCHEDULER`, `SURGEON`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `role` | Sí | `string` | valores: `SURGEON`, `ASSISTANT`, `ANESTHESIOLOGIST`, `SCRUB_NURSE`, `CIRCULATING_NURSE` | Sin descripción específica en el contrato OpenAPI. | `SURGEON` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/team-members HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "role": "SURGEON"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TeamMemberResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "procedureCaseId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "teamSize": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `teamSize` | Sí | `number` | Sin restricción adicional declarada | Miembros del equipo tras la asignación | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 409 | `CONFLICT` | El profesional ya tiene ese rol en el caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/team-members"
}
```

---

## 31. POST /procedure-cases/{id}/team-members/{memberId}/accept

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Aceptar la participación en el equipo quirúrgico
- **Operation ID:** `PeriopController_acceptTeamMember`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.acceptTeamMember](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Sólo el propio integrante o un PERIOP_ADMIN; se comprueba su credencial profesional vigente.

Contexto declarado en el controlador: C-14 (CAN-INT-002): el integrante acepta su participación. Faltaba el acto entero. `confirmCase` exige que cada miembro esté `TEAM_ACCEPTED` y nada escribía ese estado —todos nacen `TEAM_ASSIGNED`—, así que **ningún caso quirúrgico podía confirmarse jamás**.

### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/team-members/{memberId}/accept` en `PeriopController_acceptTeamMember`. El controlador delega en `PeriopCasesService.acceptTeamMember`. No recibe body. El tipo de retorno estático es `Promise<TeamMemberResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `memberId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/team-members/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `SURGERY_SCHEDULER`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`, `memberId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/team-members/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TeamMemberResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "procedureCaseId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "teamSize": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `teamSize` | Sí | `number` | Sin restricción adicional declarada | Miembros del equipo tras la asignación | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 404 | `NOT_FOUND` | El integrante no pertenece al caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo el propio integrante puede aceptar su participación | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | CAN-INT-002: el integrante no tiene credencial profesional vigente | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/team-members/{memberId}/accept"
}
```

---

## 32. POST /procedure-cases/{id}/team-members/{memberId}/respond

- **Módulo:** `procedures_perioperative`
- **Etiqueta OpenAPI:** `procedure-cases`
- **Nombre:** Rechazar, pedir cambios o informar indisponibilidad
- **Operation ID:** `PeriopController_respondTeamMember`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PeriopController.respondTeamMember](../../src/modules/procedures_perioperative/controllers/periop.controller.ts)

### Descripción de negocio

Sólo el propio integrante o un PERIOP_ADMIN; el motivo es obligatorio y el rechazo se notifica al responsable y a la organización.

Contexto declarado en el controlador: Spec 164: el integrante rechaza, pide una modificación o informa indisponibilidad. La contracara de `accept`, que era lo único que se podía contestar: sin esto, negarse era callarse, y quedaba indistinguible de no haber respondido todavía.

### Descripción del sistema

NestJS resuelve `POST /procedure-cases/{id}/team-members/{memberId}/respond` en `PeriopController_respondTeamMember`. El controlador delega en `PeriopCasesService.respondTeamMember`. Valida el body como `RespondTeamMemberDto` y consume `application/json`. El tipo de retorno estático es `Promise<TeamMemberResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `memberId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RespondTeamMemberDto`; los campos opcionales se omiten.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/team-members/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "response": "DECLINE",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `SURGERY_SCHEDULER`, `PERIOP_ADMIN`.
- Deben ser UUID válidos: `id`, `memberId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `response` | Sí | `string` | valores: `DECLINE`, `REQUEST_CHANGE`, `UNAVAILABLE` | Rechazo, solicitud de modificación o indisponibilidad informada | `DECLINE` |
| `reasonText` | Sí | `string` | longitud mínima 1; longitud máxima 2000 | Motivo de la respuesta (obligatorio) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /procedure-cases/00000000-0000-4000-8000-000000000001/team-members/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "response": "DECLINE",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TeamMemberResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "procedureCaseId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "teamSize": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `teamSize` | Sí | `number` | Sin restricción adicional declarada | Miembros del equipo tras la asignación | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso quirúrgico no encontrado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 404 | `NOT_FOUND` | El integrante no pertenece al caso | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso está cancelado | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo el propio integrante puede responder a su participación | Excepción explícita en src/modules/procedures_perioperative/services/periop-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/procedure-cases/{id}/team-members/{memberId}/respond"
}
```

---

