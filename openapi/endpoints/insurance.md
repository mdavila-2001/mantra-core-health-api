<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `insurance`

Referencia exhaustiva de 48 operación(es) del módulo `insurance`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `insurance-analytics`, `insurance-appeals`, `insurance-backbone`, `insurance-broker-commission`, `insurance-campaigns`, `insurance-catalog`, `insurance-claims`, `insurance-claims-read`, `insurance-coverage`, `insurance-portability`, `insurance-portability-public`, `insurance-practitioner-settlement`, `insurance-prior-auth`, `insurance-read`, `insurance-reconciliation`
- **Controladores:** `AppealsController`, `BrokerCommissionController`, `ClaimsController`, `ClaimsReadController`, `CoverageController`, `InsuranceAnalyticsController`, `InsuranceBackboneController`, `InsuranceCampaignsController`, `InsuranceCatalogController`, `InsurancePortabilityController`, `InsurancePortabilityPublicController`, `InsuranceReadController`, `PractitionerSettlementBatchesController`, `PriorAuthController`, `ReconciliationController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /broker-commission-statements](#1-post-broker-commission-statements) — Generar liquidación de comisión de broker
2. [POST /claim-disputes/{id}/appeal-decisions](#2-post-claim-disputes-id-appeal-decisions) — Emitir decisión de apelación (inmutable)
3. [POST /coordination-of-benefits](#3-post-coordination-of-benefits) — Determinar coordinación de beneficios (COB)
4. [POST /coverage-eligibility-requests](#4-post-coverage-eligibility-requests) — Solicitar y resolver elegibilidad (270/271)
5. [POST /employer-groups](#5-post-employer-groups) — Alta de grupo empleador (soporte)
6. [GET /insurance-brokers](#6-get-insurance-brokers) — Listar los brokers del tenant activo
7. [POST /insurance-brokers](#7-post-insurance-brokers) — Alta de broker (soporte)
8. [GET /insurance-brokers/{id}](#8-get-insurance-brokers-id) — Consultar el perfil y las vinculaciones de un broker
9. [POST /insurance-brokers/{id}/agreements](#9-post-insurance-brokers-id-agreements) — Alta de acuerdo broker–aseguradora (soporte)
10. [GET /insurance-brokers/{id}/clients](#10-get-insurance-brokers-id-clients) — Listar la cartera comercial de un broker (sin datos clínicos)
11. [GET /insurance-campaigns](#11-get-insurance-campaigns) — Listar las campañas de la aseguradora activa
12. [POST /insurance-campaigns](#12-post-insurance-campaigns) — Crear una campaña preventiva de la aseguradora
13. [GET /insurance-campaigns/{id}](#13-get-insurance-campaigns-id) — Consultar una campaña de la aseguradora activa
14. [PATCH /insurance-campaigns/{id}/status](#14-patch-insurance-campaigns-id-status) — Activar, pausar o finalizar una campaña (transiciones cerradas)
15. [GET /insurance-campaigns/patient/{patientProfileId}](#15-get-insurance-campaigns-patient-patientprofileid) — Campañas vigentes de la aseguradora del afiliado (sólo el titular)
16. [GET /insurance-carrier-catalog](#16-get-insurance-carrier-catalog) — Catálogo público de aseguradoras y sus planes de salud
17. [GET /insurance-carriers](#17-get-insurance-carriers) — Listar las aseguradoras del tenant activo
18. [POST /insurance-carriers](#18-post-insurance-carriers) — Alta de aseguradora (soporte)
19. [GET /insurance-carriers/{id}](#19-get-insurance-carriers-id) — Consultar el catálogo y la red de una aseguradora
20. [PUT /insurance-carriers/{id}/contact-channels](#20-put-insurance-carriers-id-contact-channels) — Configurar los canales de contacto de la aseguradora del tenant activo
21. [POST /insurance-carriers/{id}/products](#21-post-insurance-carriers-id-products) — Alta de producto de aseguradora (soporte)
22. [GET /insurance-claims](#22-get-insurance-claims) — Listar las solicitudes de seguro presentadas (cursor)
23. [POST /insurance-claims](#23-post-insurance-claims) — Enviar reclamo con líneas (837)
24. [GET /insurance-claims/{id}](#24-get-insurance-claims-id) — Consultar una solicitud de seguro con sus ítems y su dictamen
25. [POST /insurance-claims/{id}/adjudications](#25-post-insurance-claims-id-adjudications) — Adjudicar reclamo por línea (835)
26. [POST /insurance-claims/{id}/disputes](#26-post-insurance-claims-id-disputes) — Abrir disputa sobre adjudicación
27. [POST /insurance-claims/{id}/eob](#27-post-insurance-claims-id-eob) — Publicar Explicación de Beneficios (EOB)
28. [POST /insurance-claims/{id}/reversals](#28-post-insurance-claims-id-reversals) — Registrar reversión de reclamo
29. [POST /insurance-plans/{planId}/benefits](#29-post-insurance-plans-planid-benefits) — Crear una cobertura de un plan administrable
30. [PUT /insurance-plans/{planId}/benefits/{benefitId}](#30-put-insurance-plans-planid-benefits-benefitid) — Editar importes de una cobertura
31. [PUT /insurance-plans/{planId}/benefits/{benefitId}/rules](#31-put-insurance-plans-planid-benefits-benefitid-rules) — Editar reglas de aprobación de una cobertura
32. [PUT /insurance-plans/{planId}/premium](#32-put-insurance-plans-planid-premium) — Declarar la prima de lista mensual de un plan administrable
33. [POST /insurance-products/{productId}/plans](#33-post-insurance-products-productid-plans) — Crear un plan del carrier del tenant activo
34. [GET /insurance/analytics/loss-ratio](#34-get-insurance-analytics-loss-ratio) — Tablero de siniestralidad, gasto per cápita y epidemiología de la aseguradora del tenant activo
35. [GET /insurance/portability/certificates/{certificateId}/json](#35-get-insurance-portability-certificates-certificateid-json) — Descargar el certificado de portabilidad en JSON interoperable
36. [GET /insurance/portability/certificates/{certificateId}/pdf](#36-get-insurance-portability-certificates-certificateid-pdf) — Descargar el certificado de portabilidad en PDF
37. [POST /insurance/portability/export](#37-post-insurance-portability-export) — Exportar el historial de póliza y siniestralidad del titular a 1 clic
38. [POST /patient-coverages](#38-post-patient-coverages) — Registrar cobertura de paciente y dependientes
39. [GET /practitioner-settlement-batches](#39-get-practitioner-settlement-batches) — Listar los lotes de liquidación del alcance del actor
40. [POST /practitioner-settlement-batches](#40-post-practitioner-settlement-batches) — Generar (o repetir) el lote de liquidación del período
41. [GET /practitioner-settlement-batches/{id}](#41-get-practitioner-settlement-batches-id) — Consultar un lote de liquidación
42. [POST /prior-authorization-requests](#42-post-prior-authorization-requests) — Solicitar autorización previa con items
43. [POST /prior-authorization-requests/{id}/determinations](#43-post-prior-authorization-requests-id-determinations) — Emitir determinación de autorización previa
44. [POST /provider-networks](#44-post-provider-networks) — Alta de red de prestadores (soporte)
45. [POST /provider-networks/{id}/memberships](#45-post-provider-networks-id-memberships) — Alta de membresía de prestador en la red
46. [GET /public/portability/verify/{manifestHash}](#46-get-public-portability-verify-manifesthash) — Verificar la autenticidad de un certificado de portabilidad por su sello
47. [POST /reconciliation-batches](#47-post-reconciliation-batches) — Abrir lote de conciliación
48. [POST /reconciliation-batches/{id}/items](#48-post-reconciliation-batches-id-items) — Agregar ítem de conciliación al lote

---

## 1. POST /broker-commission-statements

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-broker-commission`
- **Nombre:** Generar liquidación de comisión de broker
- **Operation ID:** `BrokerCommissionController_generate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BrokerCommissionController.generate](../../src/modules/insurance/controllers/broker-commission.controller.ts)

### Descripción de negocio

Generar liquidación de comisión de broker. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /broker-commission-statements` en `BrokerCommissionController_generate`. El controlador delega en `BrokerCommissionService.generate`. Valida el body como `CreateCommissionStatementDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCommissionStatementDto`; los campos opcionales se omiten.

```http
POST /broker-commission-statements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceBrokerId": "00000000-0000-4000-8000-000000000001",
  "brokerCarrierAgreementId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `insuranceBrokerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `brokerCarrierAgreementId` | Sí | `string` | formato `uuid` | Acuerdo broker–aseguradora | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `periodEnd` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `grossPremiumAmount` | No | `string` | Sin restricción adicional declarada | Prima bruta del periodo | `10000.00` |
| `commissionAmount` | No | `string` | Sin restricción adicional declarada | Comisión calculada | `500.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /broker-commission-statements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceBrokerId": "00000000-0000-4000-8000-000000000001",
  "brokerCarrierAgreementId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31",
  "grossPremiumAmount": "10000.00",
  "commissionAmount": "500.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Broker no encontrado | Excepción explícita en src/modules/insurance/services/broker-commission.service.ts |
| 404 | `NOT_FOUND` | Acuerdo broker–aseguradora no encontrado | Excepción explícita en src/modules/insurance/services/broker-commission.service.ts |
| 409 | `CONFLICT` | Ya existe liquidación para el periodo | Excepción explícita en src/modules/insurance/services/broker-commission.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El acuerdo no está activo | Excepción explícita en src/modules/insurance/services/broker-commission.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/broker-commission-statements"
}
```

---

## 2. POST /claim-disputes/{id}/appeal-decisions

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-appeals`
- **Nombre:** Emitir decisión de apelación (inmutable)
- **Operation ID:** `AppealsController_decide`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AppealsController.decide](../../src/modules/insurance/controllers/appeals.controller.ts)

### Descripción de negocio

Emitir decisión de apelación (inmutable). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /claim-disputes/{id}/appeal-decisions` en `AppealsController_decide`. El controlador delega en `AppealsService.decide`. Valida el body como `CreateAppealDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAppealDecisionDto`; los campos opcionales se omiten.

```http
POST /claim-disputes/00000000-0000-4000-8000-000000000001/appeal-decisions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "UPHELD"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `UPHELD`, `OVERTURNED` | Sin descripción específica en el contrato OpenAPI. | `UPHELD` |
| `adjustedAmount` | No | `string` | Sin restricción adicional declarada | Monto ajustado tras la decisión | `15.00` |
| `rationaleText` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /claim-disputes/00000000-0000-4000-8000-000000000001/appeal-decisions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "UPHELD",
  "adjustedAmount": "15.00",
  "rationaleText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Disputa no encontrada | Excepción explícita en src/modules/insurance/services/appeals.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La disputa no admite decisión en su estado actual | Excepción explícita en src/modules/insurance/services/appeals.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/claim-disputes/{id}/appeal-decisions"
}
```

---

## 3. POST /coordination-of-benefits

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-coverage`
- **Nombre:** Determinar coordinación de beneficios (COB)
- **Operation ID:** `CoverageController_determineCob`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CoverageController.determineCob](../../src/modules/insurance/controllers/coverage.controller.ts)

### Descripción de negocio

Determinar coordinación de beneficios (COB). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /coordination-of-benefits` en `CoverageController_determineCob`. El controlador delega en `CoverageService.determineCob`. Valida el body como `CreateCobDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCobDto`; los campos opcionales se omiten.

```http
POST /coordination-of-benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "primaryPatientCoverageId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `primaryPatientCoverageId` | Sí | `string` | formato `uuid` | Cobertura primaria | `00000000-0000-4000-8000-000000000001` |
| `secondaryPatientCoverageId` | No | `string` | formato `uuid` | Cobertura secundaria | `00000000-0000-4000-8000-000000000001` |
| `tertiaryPatientCoverageId` | No | `string` | formato `uuid` | Cobertura terciaria | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /coordination-of-benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "primaryPatientCoverageId": "00000000-0000-4000-8000-000000000001",
  "secondaryPatientCoverageId": "00000000-0000-4000-8000-000000000001",
  "tertiaryPatientCoverageId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cobertura primaria no encontrada | Excepción explícita en src/modules/insurance/services/coverage.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | COB requiere al menos una cobertura secundaria | Excepción explícita en src/modules/insurance/services/coverage.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/coordination-of-benefits"
}
```

---

## 4. POST /coverage-eligibility-requests

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-coverage`
- **Nombre:** Solicitar y resolver elegibilidad (270/271)
- **Operation ID:** `CoverageController_requestEligibility`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CoverageController.requestEligibility](../../src/modules/insurance/controllers/coverage.controller.ts)

### Descripción de negocio

Solicitar y resolver elegibilidad (270/271). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /coverage-eligibility-requests` en `CoverageController_requestEligibility`. El controlador delega en `CoverageService.requestEligibility`. Valida el body como `CreateEligibilityRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEligibilityRequestDto`; los campos opcionales se omiten.

```http
POST /coverage-eligibility-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientCoverageId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientCoverageId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `idempotencyKey` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `benefitSummary` | No | `object` | Sin restricción adicional declarada | Resumen de beneficios recibido del pagador | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /coverage-eligibility-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientCoverageId": "00000000-0000-4000-8000-000000000001",
  "serviceDate": "2026-07-31",
  "idempotencyKey": "valor-ejemplo",
  "benefitSummary": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cobertura no encontrada | Excepción explícita en src/modules/insurance/services/coverage.service.ts |
| 409 | `CONFLICT` | Solicitud de elegibilidad duplicada | Excepción explícita en src/modules/insurance/services/coverage.service.ts |
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
  "path": "/coverage-eligibility-requests"
}
```

---

## 5. POST /employer-groups

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de grupo empleador (soporte)
- **Operation ID:** `InsuranceBackboneController_createEmployerGroup`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createEmployerGroup](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de grupo empleador (soporte). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create employer group.

### Descripción del sistema

NestJS resuelve `POST /employer-groups` en `InsuranceBackboneController_createEmployerGroup`. El controlador delega en `InsuranceBackboneService.createEmployerGroup`. Valida el body como `CreateEmployerGroupDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEmployerGroupDto`; los campos opcionales se omiten.

```http
POST /employer-groups HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "groupCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo"
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
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `groupCode` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /employer-groups HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "groupCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/employer-groups"
}
```

---

## 6. GET /insurance-brokers

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-read`
- **Nombre:** Listar los brokers del tenant activo
- **Operation ID:** `InsuranceReadController_listBrokers`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceReadController.listBrokers](../../src/modules/insurance/controllers/insurance-read.controller.ts)

### Descripción de negocio

Listar los brokers del tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Brokers del tenant activo.

### Descripción del sistema

NestJS resuelve `GET /insurance-brokers` en `InsuranceReadController_listBrokers`. El controlador delega en `InsuranceReadService.listBrokers`. No recibe body. El tipo de retorno estático es `Promise<BrokerDirectoryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-brokers HTTP/1.1
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
GET /insurance-brokers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BrokerDirectoryResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<BrokerDirectoryResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<BrokerDirectoryResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<BrokerDirectoryResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<BrokerDirectoryResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<BrokerDirectoryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BrokerDirectoryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "brokerCode": "CODIGO_EJEMPLO",
      "legalName": "Nombre de ejemplo",
      "licenseNumber": "valor-ejemplo",
      "jurisdiction": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "verification": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "independent": true,
      "currentCarrierCount": 1,
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<BrokerSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","brokerCode":"CODIGO_EJEMPLO","legalName":"Nombre de ejemplo","licenseNumber":"valor-ejemplo","jurisdiction":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"verification":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"independent":true,"currentCarrierCount":1,"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].brokerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].legalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].licenseNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].jurisdiction` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].jurisdiction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].jurisdiction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].verification` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].verification.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].verification.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].independent` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].currentCarrierCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-brokers"
}
```

---

## 7. POST /insurance-brokers

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de broker (soporte)
- **Operation ID:** `InsuranceBackboneController_createBroker`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createBroker](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de broker (soporte). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create broker.

### Descripción del sistema

NestJS resuelve `POST /insurance-brokers` en `InsuranceBackboneController_createBroker`. El controlador delega en `InsuranceBackboneService.createBroker`. Valida el body como `CreateBrokerDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBrokerDto`; los campos opcionales se omiten.

```http
POST /insurance-brokers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "brokerCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo"
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
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `brokerCode` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `licenseNumber` | No | `string` | longitud máxima 80 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-brokers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "brokerCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "licenseNumber": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/insurance-brokers"
}
```

---

## 8. GET /insurance-brokers/{id}

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-read`
- **Nombre:** Consultar el perfil y las vinculaciones de un broker
- **Operation ID:** `InsuranceReadController_getBroker`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceReadController.getBroker](../../src/modules/insurance/controllers/insurance-read.controller.ts)

### Descripción de negocio

Consultar el perfil y las vinculaciones de un broker. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Perfil de un broker con su historial de vinculaciones.

### Descripción del sistema

NestJS resuelve `GET /insurance-brokers/{id}` en `InsuranceReadController_getBroker`. El controlador delega en `InsuranceReadService.getBroker`. No recibe body. El tipo de retorno estático es `Promise<BrokerProfileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-brokers/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /insurance-brokers/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BrokerProfileDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<BrokerProfileDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<BrokerProfileDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<BrokerProfileDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<BrokerProfileDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<BrokerProfileDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<BrokerProfileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BrokerProfileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "brokerCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "licenseNumber": "valor-ejemplo",
  "jurisdiction": {
    "code": "CARRIER_ACTIVE",
    "display": "Aseguradora activa"
  },
  "status": {
    "code": "CARRIER_ACTIVE",
    "display": "Aseguradora activa"
  },
  "verification": {
    "code": "CARRIER_ACTIVE",
    "display": "Aseguradora activa"
  },
  "independent": true,
  "currentCarrierCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "agreements": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
      "carrierLegalName": "Nombre de ejemplo",
      "agreementCode": "CODIGO_EJEMPLO",
      "commissionModel": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "effectiveFrom": "valor-ejemplo",
      "effectiveTo": "valor-ejemplo",
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "current": true,
      "contractFileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "publicProfileId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `brokerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `licenseNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `jurisdiction` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `jurisdiction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `jurisdiction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `verification` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `verification.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `verification.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `independent` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `currentCarrierCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `agreements` | Sí | `array<BrokerAgreementDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierLegalName":"Nombre de ejemplo","agreementCode":"CODIGO_EJEMPLO","commissionModel":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"current":true,"contractFileId":"00000000-0000-4000-8000-000000000001"}]` |
| `agreements[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `agreements[].insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `agreements[].carrierLegalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `agreements[].agreementCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `agreements[].commissionModel` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `agreements[].commissionModel.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `agreements[].commissionModel.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `agreements[].effectiveFrom` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `agreements[].effectiveTo` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `agreements[].status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `agreements[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `agreements[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `agreements[].current` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `agreements[].contractFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `publicProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Broker no encontrado | Excepción explícita en src/modules/insurance/services/insurance-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-brokers/{id}"
}
```

---

## 9. POST /insurance-brokers/{id}/agreements

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de acuerdo broker–aseguradora (soporte)
- **Operation ID:** `InsuranceBackboneController_createAgreement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createAgreement](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de acuerdo broker–aseguradora (soporte). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create agreement.

### Descripción del sistema

NestJS resuelve `POST /insurance-brokers/{id}/agreements` en `InsuranceBackboneController_createAgreement`. El controlador delega en `InsuranceBackboneService.createAgreement`. Valida el body como `CreateBrokerAgreementDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBrokerAgreementDto`; los campos opcionales se omiten.

```http
POST /insurance-brokers/00000000-0000-4000-8000-000000000001/agreements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "agreementCode": "CODIGO_EJEMPLO"
}
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
| `insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `agreementCode` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-brokers/00000000-0000-4000-8000-000000000001/agreements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "agreementCode": "CODIGO_EJEMPLO",
  "effectiveFrom": "2026-07-31",
  "effectiveTo": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Broker no encontrado | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-brokers/{id}/agreements"
}
```

---

## 10. GET /insurance-brokers/{id}/clients

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-read`
- **Nombre:** Listar la cartera comercial de un broker (sin datos clínicos)
- **Operation ID:** `InsuranceReadController_listBrokerClients`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceReadController.listBrokerClients](../../src/modules/insurance/controllers/insurance-read.controller.ts)

### Descripción de negocio

Listar la cartera comercial de un broker (sin datos clínicos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cartera comercial de un broker. Devuelve a quién atiende, no qué le pasa: ni un campo clínico viaja en esta respuesta.

### Descripción del sistema

NestJS resuelve `GET /insurance-brokers/{id}/clients` en `InsuranceReadController_listBrokerClients`. El controlador delega en `InsuranceReadService.listBrokerClients`. No recibe body. El tipo de retorno estático es `Promise<BrokerPortfolioResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-brokers/00000000-0000-4000-8000-000000000001/clients HTTP/1.1
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
GET /insurance-brokers/00000000-0000-4000-8000-000000000001/clients HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BrokerPortfolioResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<BrokerPortfolioResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<BrokerPortfolioResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<BrokerPortfolioResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<BrokerPortfolioResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<BrokerPortfolioResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<BrokerPortfolioResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BrokerPortfolioResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "employerGroupId": "00000000-0000-4000-8000-000000000001",
      "clientType": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "assignedBrokerUserId": "00000000-0000-4000-8000-000000000001",
      "effectiveFrom": "valor-ejemplo",
      "effectiveTo": "valor-ejemplo",
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      }
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<BrokerClientDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","employerGroupId":"00000000-0000-4000-8000-000000000001","clientType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"assignedBrokerUserId":"00000000-0000-4000-8000-000000000001","effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].employerGroupId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clientType` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].clientType.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].clientType.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].assignedBrokerUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].effectiveFrom` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].effectiveTo` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Broker no encontrado | Excepción explícita en src/modules/insurance/services/insurance-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-brokers/{id}/clients"
}
```

---

## 11. GET /insurance-campaigns

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Listar las campañas de la aseguradora activa
- **Operation ID:** `InsuranceCampaignsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceCampaignsController.list](../../src/modules/insurance/controllers/insurance-campaigns.controller.ts)

### Descripción de negocio

Listar las campañas de la aseguradora activa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance-campaigns` en `InsuranceCampaignsController_list`. El controlador delega en `InsuranceCampaignsService.list`. No recibe body. El tipo de retorno estático es `Promise<InsuranceCampaignPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `type` | query | No | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en OpenAPI. | `LABORATORY` |
| `status` | query | No | `string` | valores: `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en OpenAPI. | `DRAFT` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `25` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-campaigns HTTP/1.1
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
GET /insurance-campaigns?type=LABORATORY&status=DRAFT&cursor=valor-ejemplo&limit=25 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InsuranceCampaignPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<InsuranceCampaignPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<InsuranceCampaignPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<InsuranceCampaignPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<InsuranceCampaignPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<InsuranceCampaignPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InsuranceCampaignPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "title": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "campaignType": "LABORATORY",
      "status": "DRAFT",
      "targetCondition": {
        "code": "I10",
        "display": "Hipertensión esencial"
      },
      "copayBonusPercentage": 1,
      "validFrom": "2026-07-31",
      "validTo": "2026-07-31",
      "activatedAt": "2026-07-31T12:00:00.000Z",
      "partners": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "role": "SPONSOR",
          "type": "IMPORTER",
          "name": "Nombre de ejemplo",
          "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
        }
      ],
      "createdAt": "2026-07-31T12:00:00.000Z",
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<InsuranceCampaignResponseDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","title":"valor-ejemplo","description":"Texto descriptivo de ejemplo","campaignType":"LABORATORY","status":"DRAFT","targetCondition":{"code":"I10","display":"Hipertensión esencial"},"copayBonusPercentage":1,"validFrom":"2026-07-31","validTo":"2026-07-31","activatedAt":"2026-07-31T12:00:00.000Z","partners":[{"id":"00000000-0000-4000-8000-000000000001","role":"SPONSOR","type":"IMPORTER","name":"Nombre de ejemplo","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}],"createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].title` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].campaignType` | Sí | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `items[].status` | Sí | `string` | valores: `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `items[].targetCondition` | Sí | `InsuranceCampaignConditionDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"I10","display":"Hipertensión esencial"}` |
| `items[].targetCondition.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `I10` |
| `items[].targetCondition.display` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Hipertensión esencial` |
| `items[].copayBonusPercentage` | Sí | `number` | mínimo 0; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].validFrom` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `items[].validTo` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `items[].activatedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].partners` | Sí | `array<InsuranceCampaignPartnerDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","role":"SPONSOR","type":"IMPORTER","name":"Nombre de ejemplo","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].partners[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].partners[].role` | Sí | `string` | valores: `SPONSOR`, `PROVIDER` | Sin descripción específica en el contrato OpenAPI. | `SPONSOR` |
| `items[].partners[].type` | Sí | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `items[].partners[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].partners[].networkProviderMembershipId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | Cursor inválido | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 403 | `FORBIDDEN` | La organización activa no es una aseguradora | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns"
}
```

---

## 12. POST /insurance-campaigns

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Crear una campaña preventiva de la aseguradora
- **Operation ID:** `InsuranceCampaignsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceCampaignsController.create](../../src/modules/insurance/controllers/insurance-campaigns.controller.ts)

### Descripción de negocio

Crear una campaña preventiva de la aseguradora. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /insurance-campaigns` en `InsuranceCampaignsController_create`. El controlador delega en `InsuranceCampaignsService.create`. Valida el body como `CreateInsuranceCampaignDto` y consume `application/json`. El tipo de retorno estático es `Promise<InsuranceCampaignResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateInsuranceCampaignDto`; los campos opcionales se omiten.

```http
POST /insurance-campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "campaignType": "LABORATORY",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida"
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
| `code` | Sí | `string` | patrón runtime `/^[A-Z0-9][A-Z0-9-]{2,39}$/` | Único por aseguradora; mayúsculas, dígitos y guiones. | `CMP-CARDIO-2026` |
| `title` | Sí | `string` | longitud mínima 3; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Chequeo Preventivo Cardiovascular y Perfil Lipídico` |
| `description` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignType` | Sí | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `targetConditionCode` | No | `string` | longitud máxima 16 | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `I10` |
| `copayBonusPercentage` | Sí | `number` | mínimo 0; máximo 100 | Porcentaje del copago que la aseguradora bonifica. 100 = copago Bs. 0. | `100` |
| `validFrom` | Sí | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-09-25` |
| `validTo` | Sí | `string` | formato `date`; patrón runtime `DATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `2026-11-24` |
| `partners` | Sí | `array<InsuranceCampaignPartnerInputDto>` | mínimo 1 elemento(s); máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"role":"SPONSOR","type":"IMPORTER","name":"Laboratorio Central AloVida","partnerTenantId":"00000000-0000-4000-8000-000000000001","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `partners[].role` | Sí | `string` | valores: `SPONSOR`, `PROVIDER` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `SPONSOR` |
| `partners[].type` | Sí | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `partners[].name` | Sí | `string` | longitud mínima 2; longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `Laboratorio Central AloVida` |
| `partners[].partnerTenantId` | No | `string` | formato `uuid` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `00000000-0000-4000-8000-000000000001` |
| `partners[].networkProviderMembershipId` | No | `string` | formato `uuid` | Membresía de la red de prestadores de la aseguradora, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `activate` | No | `boolean` | Sin restricción adicional declarada | Si es true, la campaña nace ACTIVE en vez de DRAFT. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "activate": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InsuranceCampaignResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InsuranceCampaignResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "status": "DRAFT",
  "targetCondition": {
    "code": "I10",
    "display": "Hipertensión esencial"
  },
  "copayBonusPercentage": 1,
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31",
  "activatedAt": "2026-07-31T12:00:00.000Z",
  "partners": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Nombre de ejemplo",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `title` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignType` | Sí | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `status` | Sí | `string` | valores: `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `targetCondition` | Sí | `InsuranceCampaignConditionDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"I10","display":"Hipertensión esencial"}` |
| `targetCondition.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `I10` |
| `targetCondition.display` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Hipertensión esencial` |
| `copayBonusPercentage` | Sí | `number` | mínimo 0; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `validFrom` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `validTo` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `activatedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `partners` | Sí | `array<InsuranceCampaignPartnerDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","role":"SPONSOR","type":"IMPORTER","name":"Nombre de ejemplo","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `partners[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `partners[].role` | Sí | `string` | valores: `SPONSOR`, `PROVIDER` | Sin descripción específica en el contrato OpenAPI. | `SPONSOR` |
| `partners[].type` | Sí | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `partners[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `partners[].networkProviderMembershipId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | validTo debe ser igual o posterior a validFrom | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 400 | `VALIDATION_FAILED` | No se puede activar una campaña cuya vigencia ya terminó | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 400 | `VALIDATION_FAILED` | El código CIE-10 ${code} no está en el catálogo | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 403 | `FORBIDDEN` | La organización activa no es una aseguradora | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Campaña no encontrada | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 409 | `CONFLICT` | Ya existe una campaña con ese código en la aseguradora | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
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
  "path": "/insurance-campaigns"
}
```

---

## 13. GET /insurance-campaigns/{id}

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Consultar una campaña de la aseguradora activa
- **Operation ID:** `InsuranceCampaignsController_getById`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceCampaignsController.getById](../../src/modules/insurance/controllers/insurance-campaigns.controller.ts)

### Descripción de negocio

Consultar una campaña de la aseguradora activa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /insurance-campaigns/{id}` en `InsuranceCampaignsController_getById`. El controlador delega en `InsuranceCampaignsService.getById`. No recibe body. El tipo de retorno estático es `Promise<InsuranceCampaignResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /insurance-campaigns/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InsuranceCampaignResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "status": "DRAFT",
  "targetCondition": {
    "code": "I10",
    "display": "Hipertensión esencial"
  },
  "copayBonusPercentage": 1,
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31",
  "activatedAt": "2026-07-31T12:00:00.000Z",
  "partners": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Nombre de ejemplo",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `title` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignType` | Sí | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `status` | Sí | `string` | valores: `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `targetCondition` | Sí | `InsuranceCampaignConditionDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"I10","display":"Hipertensión esencial"}` |
| `targetCondition.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `I10` |
| `targetCondition.display` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Hipertensión esencial` |
| `copayBonusPercentage` | Sí | `number` | mínimo 0; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `validFrom` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `validTo` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `activatedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `partners` | Sí | `array<InsuranceCampaignPartnerDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","role":"SPONSOR","type":"IMPORTER","name":"Nombre de ejemplo","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `partners[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `partners[].role` | Sí | `string` | valores: `SPONSOR`, `PROVIDER` | Sin descripción específica en el contrato OpenAPI. | `SPONSOR` |
| `partners[].type` | Sí | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `partners[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `partners[].networkProviderMembershipId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 403 | `FORBIDDEN` | La organización activa no es una aseguradora | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Campaña no encontrada | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/{id}"
}
```

---

## 14. PATCH /insurance-campaigns/{id}/status

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Activar, pausar o finalizar una campaña (transiciones cerradas)
- **Operation ID:** `InsuranceCampaignsController_changeStatus`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceCampaignsController.changeStatus](../../src/modules/insurance/controllers/insurance-campaigns.controller.ts)

### Descripción de negocio

Activar, pausar o finalizar una campaña (transiciones cerradas). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /insurance-campaigns/{id}/status` en `InsuranceCampaignsController_changeStatus`. El controlador delega en `InsuranceCampaignsService.changeStatus`. Valida el body como `UpdateInsuranceCampaignStatusDto` y consume `application/json`. El tipo de retorno estático es `Promise<InsuranceCampaignResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateInsuranceCampaignStatusDto`; los campos opcionales se omiten.

```http
PATCH /insurance-campaigns/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "ACTIVE"
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
| `status` | Sí | `string` | valores: `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /insurance-campaigns/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InsuranceCampaignResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InsuranceCampaignResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "status": "DRAFT",
  "targetCondition": {
    "code": "I10",
    "display": "Hipertensión esencial"
  },
  "copayBonusPercentage": 1,
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31",
  "activatedAt": "2026-07-31T12:00:00.000Z",
  "partners": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Nombre de ejemplo",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `title` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignType` | Sí | `string` | valores: `LABORATORY`, `PHARMACY`, `DIAGNOSTIC_IMAGING`, `VACCINATION` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `status` | Sí | `string` | valores: `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `targetCondition` | Sí | `InsuranceCampaignConditionDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"I10","display":"Hipertensión esencial"}` |
| `targetCondition.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `I10` |
| `targetCondition.display` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Hipertensión esencial` |
| `copayBonusPercentage` | Sí | `number` | mínimo 0; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `validFrom` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `validTo` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `activatedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `partners` | Sí | `array<InsuranceCampaignPartnerDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","role":"SPONSOR","type":"IMPORTER","name":"Nombre de ejemplo","networkProviderMembershipId":"00000000-0000-4000-8000-000000000001"}]` |
| `partners[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `partners[].role` | Sí | `string` | valores: `SPONSOR`, `PROVIDER` | Sin descripción específica en el contrato OpenAPI. | `SPONSOR` |
| `partners[].type` | Sí | `string` | valores: `IMPORTER`, `MANUFACTURER`, `LABORATORY`, `PHARMACY`, `MEDICAL_CENTER` | Sin descripción específica en el contrato OpenAPI. | `IMPORTER` |
| `partners[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `partners[].networkProviderMembershipId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 403 | `FORBIDDEN` | La organización activa no es una aseguradora | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Campaña no encontrada | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una campaña en estado ${current} no puede pasar a ${target} | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 422 | `PRECONDITION_FAILED` | La campaña ya venció: no se puede activar | Excepción explícita en src/modules/insurance/services/insurance-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/{id}/status"
}
```

---

## 15. GET /insurance-campaigns/patient/{patientProfileId}

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-campaigns`
- **Nombre:** Campañas vigentes de la aseguradora del afiliado (sólo el titular)
- **Operation ID:** `InsuranceCampaignsController_listForPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceCampaignsController.listForPatient](../../src/modules/insurance/controllers/insurance-campaigns.controller.ts)

### Descripción de negocio

Campañas vigentes de la aseguradora del afiliado (sólo el titular). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Debe declararse ANTES de `GET :id`: si no, `patient` se leería como un id. El perfil viaja en la URL para que un intento sobre el de otro afiliado sea verificable y auditable.

### Descripción del sistema

NestJS resuelve `GET /insurance-campaigns/patient/{patientProfileId}` en `InsuranceCampaignsController_listForPatient`. El controlador delega en `InsuranceCampaignsService.listActiveForPatient`. No recibe body. El tipo de retorno estático es `Promise<PatientCampaignDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-campaigns/patient/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `patientProfileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-campaigns/patient/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientCampaignDto[]>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PatientCampaignDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientCampaignDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientCampaignDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<PatientCampaignDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientCampaignDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientCampaignDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientCampaignDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "title": "valor-ejemplo",
    "description": "Texto descriptivo de ejemplo",
    "campaignType": "LABORATORY",
    "targetCondition": {
      "code": "I10",
      "display": "Hipertensión esencial"
    },
    "copayBonusPercentage": 1,
    "validFrom": "2026-07-31",
    "validTo": "2026-07-31",
    "carrierName": "Nombre de ejemplo",
    "partners": [
      {
        "role": "SPONSOR",
        "type": "IMPORTER",
        "name": "Nombre de ejemplo"
      }
    ]
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
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-campaigns/patient/{patientProfileId}"
}
```

---

## 16. GET /insurance-carrier-catalog

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-catalog`
- **Nombre:** Catálogo público de aseguradoras y sus planes de salud
- **Operation ID:** `InsuranceCatalogController_listCatalog`
- **Autenticación:** Pública
- **Implementación:** [InsuranceCatalogController.listCatalog](../../src/modules/insurance/controllers/insurance-catalog.controller.ts)

### Descripción de negocio

Catálogo público de aseguradoras y sus planes de salud. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Aseguradoras privadas y públicas con sus planes de salud.

### Descripción del sistema

NestJS resuelve `GET /insurance-carrier-catalog` en `InsuranceCatalogController_listCatalog`. El controlador delega en `InsuranceCatalogService.listHealthCatalog`. No recibe body. El tipo de retorno estático es `Promise<CarrierCatalogResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-carrier-catalog HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle({ default: { limit: 60, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-carrier-catalog HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CarrierCatalogResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CarrierCatalogResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CarrierCatalogResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CarrierCatalogResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CarrierCatalogResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "carriers": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A",
      "name": "BISA Seguros y Reaseguros S.A.",
      "legalName": "Nombre de ejemplo",
      "isPublic": true,
      "plans": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "code": "RED_MAX",
          "name": "Red Max"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `carriers` | Sí | `array<CarrierCatalogEntryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A","name":"BISA Seguros y Reaseguros S.A.","legalName":"Nombre de ejemplo","isPublic":true,"plans":[{"id":"00000000-0000-4000-8000-000000000001","code":"RED_MAX","name":"Red Max"}]}]` |
| `carriers[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `carriers[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A` |
| `carriers[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BISA Seguros y Reaseguros S.A.` |
| `carriers[].legalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `carriers[].isPublic` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `carriers[].plans` | Sí | `array<CarrierCatalogPlanDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"RED_MAX","name":"Red Max"}]` |
| `carriers[].plans[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `carriers[].plans[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `RED_MAX` |
| `carriers[].plans[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Red Max` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 60, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "RATE_LIMITED",
  "message": "Se excede el límite particular Throttle({ default: { limit: 60, ttl: 60_000 } }).",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-carrier-catalog"
}
```

---

## 17. GET /insurance-carriers

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-read`
- **Nombre:** Listar las aseguradoras del tenant activo
- **Operation ID:** `InsuranceReadController_listCarriers`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceReadController.listCarriers](../../src/modules/insurance/controllers/insurance-read.controller.ts)

### Descripción de negocio

Listar las aseguradoras del tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Aseguradoras del tenant activo.

### Descripción del sistema

NestJS resuelve `GET /insurance-carriers` en `InsuranceReadController_listCarriers`. El controlador delega en `InsuranceReadService.listCarriers`. No recibe body. El tipo de retorno estático es `Promise<CarrierDirectoryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-carriers HTTP/1.1
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
GET /insurance-carriers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CarrierDirectoryResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CarrierDirectoryResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CarrierDirectoryResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CarrierDirectoryResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CarrierDirectoryResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CarrierDirectoryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CarrierDirectoryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "carrierCode": "ASEG-001",
      "legalName": "Nombre de ejemplo",
      "regulatorIdentifier": "valor-ejemplo",
      "whatsappNumber": "valor-ejemplo",
      "callCenterPhone": "+59170000000",
      "supportEmail": "usuario@example.com",
      "jurisdiction": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "verification": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "productCount": 1,
      "planCount": 1,
      "networkCount": 1,
      "createdAt": "2026-07-31T12:00:00.000Z",
      "canAdminister": true
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CarrierSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","carrierCode":"ASEG-001","legalName":"Nombre de ejemplo","regulatorIdentifier":"valor-ejemplo","whatsappNumber":"valor-ejemplo","callCenterPhone":"+59170000000","supportEmail":"usuario@example.com","jurisdiction":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"verification":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"productCount":1,"planCount":1,"networkCount":1,"createdAt":"2026-07-31T12:00:00.000Z","canAdminister":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].carrierCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ASEG-001` |
| `items[].legalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].regulatorIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].whatsappNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].callCenterPhone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `+59170000000` |
| `items[].supportEmail` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `items[].jurisdiction` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].jurisdiction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].jurisdiction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].verification` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].verification.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].verification.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].productCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].planCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].networkCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].canAdminister` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-carriers"
}
```

---

## 18. POST /insurance-carriers

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de aseguradora (soporte)
- **Operation ID:** `InsuranceBackboneController_createCarrier`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createCarrier](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de aseguradora (soporte). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create carrier.

### Descripción del sistema

NestJS resuelve `POST /insurance-carriers` en `InsuranceBackboneController_createCarrier`. El controlador delega en `InsuranceBackboneService.createCarrier`. Valida el body como `CreateCarrierDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceStatusDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCarrierDto`; los campos opcionales se omiten.

```http
POST /insurance-carriers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "carrierCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |
| `carrierCode` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatorIdentifier` | No | `string` | longitud máxima 80 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-carriers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "carrierCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "regulatorIdentifier": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceStatusDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/insurance-carriers"
}
```

---

## 19. GET /insurance-carriers/{id}

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-read`
- **Nombre:** Consultar el catálogo y la red de una aseguradora
- **Operation ID:** `InsuranceReadController_getCarrier`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceReadController.getCarrier](../../src/modules/insurance/controllers/insurance-read.controller.ts)

### Descripción de negocio

Consultar el catálogo y la red de una aseguradora. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Catálogo comercial y red de una aseguradora.

### Descripción del sistema

NestJS resuelve `GET /insurance-carriers/{id}` en `InsuranceReadController_getCarrier`. El controlador delega en `InsuranceReadService.getCarrier`. No recibe body. El tipo de retorno estático es `Promise<CarrierDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-carriers/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /insurance-carriers/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CarrierDetailDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CarrierDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CarrierDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CarrierDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<CarrierDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CarrierDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CarrierDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CarrierDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "carrierCode": "ASEG-001",
  "legalName": "Nombre de ejemplo",
  "regulatorIdentifier": "valor-ejemplo",
  "whatsappNumber": "valor-ejemplo",
  "callCenterPhone": "+59170000000",
  "supportEmail": "usuario@example.com",
  "jurisdiction": {
    "code": "CARRIER_ACTIVE",
    "display": "Aseguradora activa"
  },
  "status": {
    "code": "CARRIER_ACTIVE",
    "display": "Aseguradora activa"
  },
  "verification": {
    "code": "CARRIER_ACTIVE",
    "display": "Aseguradora activa"
  },
  "productCount": 1,
  "planCount": 1,
  "networkCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "canAdminister": true,
  "products": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "productType": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "marketSegment": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "plans": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "planCode": "CODIGO_EJEMPLO",
          "name": "Nombre de ejemplo",
          "planType": {
            "code": "CARRIER_ACTIVE",
            "display": "Aseguradora activa"
          },
          "currency": {
            "code": "CARRIER_ACTIVE",
            "display": "Aseguradora activa"
          },
          "monthlyPremiumAmount": "350.00",
          "effectiveFrom": "valor-ejemplo",
          "effectiveTo": "valor-ejemplo",
          "status": {
            "code": "CARRIER_ACTIVE",
            "display": "Aseguradora activa"
          },
          "policyDocumentFileId": "00000000-0000-4000-8000-000000000001",
          "benefits": [
            {
              "id": "00000000-0000-4000-8000-000000000001",
              "category": {
                "code": "CARRIER_ACTIVE",
                "display": "Aseguradora activa"
              },
              "service": {
                "code": "CARRIER_ACTIVE",
                "display": "Aseguradora activa"
              },
              "coveragePercent": "valor-ejemplo",
              "copayAmount": "valor-ejemplo",
              "deductibleAmount": "valor-ejemplo",
              "annualLimitAmount": "valor-ejemplo",
              "requiresPriorAuthorization": true,
              "approvalRules": {
                "requiredDocuments": [
                  "FIRMA_MEDICO"
                ],
                "exclusionNotes": "Texto descriptivo de ejemplo"
              },
              "effectiveFrom": "valor-ejemplo",
              "effectiveTo": "valor-ejemplo"
            }
          ]
        }
      ]
    }
  ],
  "networks": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "networkCode": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "networkType": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "effectiveFrom": "valor-ejemplo",
      "effectiveTo": "valor-ejemplo",
      "memberCount": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `carrierCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ASEG-001` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatorIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `whatsappNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `callCenterPhone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `+59170000000` |
| `supportEmail` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `jurisdiction` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `jurisdiction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `jurisdiction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `verification` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `verification.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `verification.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `productCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `planCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `networkCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `canAdminister` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `products` | Sí | `array<ProductDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","productType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"marketSegment":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"plans":[{"id":"00000000-0000-4000-8000-000000000001","planCode":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","planType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"monthlyPremiumAmount":"350.00","effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"policyDocumentFileId":"00000000-0000-4000-8000-000000000001","benefits":[{"id":"00000000-0000-4000-8000-000000000001","category":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"service":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"coveragePercent":"valor-ejemplo","copayAmount":"valor-ejemplo","deductibleAmount":"valor-ejemplo","annualLimitAmount":"valor-ejemplo","requiresPriorAuthorization":true,"approvalRules":{"requiredDocuments":["FIRMA_MEDICO"],"exclusionNotes":"Texto descriptivo de ejemplo"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo"}]}]}]` |
| `products[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `products[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `products[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `products[].productType` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].productType.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].productType.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].marketSegment` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].marketSegment.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].marketSegment.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans` | Sí | `array<PlanDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","planCode":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","planType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"monthlyPremiumAmount":"350.00","effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"policyDocumentFileId":"00000000-0000-4000-8000-000000000001","benefits":[{"id":"00000000-0000-4000-8000-000000000001","category":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"service":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"coveragePercent":"valor-ejemplo","copayAmount":"valor-ejemplo","deductibleAmount":"valor-ejemplo","annualLimitAmount":"valor-ejemplo","requiresPriorAuthorization":true,"approvalRules":{"requiredDocuments":["FIRMA_MEDICO"],"exclusionNotes":"Texto descriptivo de ejemplo"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo"}]}]` |
| `products[].plans[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `products[].plans[].planCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `products[].plans[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `products[].plans[].planType` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].plans[].planType.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].plans[].planType.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans[].currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].plans[].currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].plans[].currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans[].monthlyPremiumAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `350.00` |
| `products[].plans[].effectiveFrom` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].effectiveTo` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].plans[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].plans[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans[].policyDocumentFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `products[].plans[].benefits` | Sí | `array<PlanBenefitDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","category":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"service":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"coveragePercent":"valor-ejemplo","copayAmount":"valor-ejemplo","deductibleAmount":"valor-ejemplo","annualLimitAmount":"valor-ejemplo","requiresPriorAuthorization":true,"approvalRules":{"requiredDocuments":["FIRMA_MEDICO"],"exclusionNotes":"Texto descriptivo de ejemplo"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo"}]` |
| `products[].plans[].benefits[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `products[].plans[].benefits[].category` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].plans[].benefits[].category.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].plans[].benefits[].category.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans[].benefits[].service` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].plans[].benefits[].service.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].plans[].benefits[].service.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans[].benefits[].coveragePercent` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].benefits[].copayAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].benefits[].deductibleAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].benefits[].annualLimitAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].benefits[].requiresPriorAuthorization` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `products[].plans[].benefits[].approvalRules` | Sí | `BenefitApprovalRulesDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"requiredDocuments":["FIRMA_MEDICO"],"exclusionNotes":"Texto descriptivo de ejemplo"}` |
| `products[].plans[].benefits[].approvalRules.requiredDocuments` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["FIRMA_MEDICO"]` |
| `products[].plans[].benefits[].approvalRules.exclusionNotes` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `products[].plans[].benefits[].effectiveFrom` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].benefits[].effectiveTo` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `networks` | Sí | `array<ProviderNetworkDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","networkCode":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","networkType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","memberCount":1}]` |
| `networks[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `networks[].networkCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `networks[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `networks[].networkType` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `networks[].networkType.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `networks[].networkType.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `networks[].status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `networks[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `networks[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `networks[].effectiveFrom` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `networks[].effectiveTo` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `networks[].memberCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-carriers/{id}"
}
```

---

## 20. PUT /insurance-carriers/{id}/contact-channels

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Configurar los canales de contacto de la aseguradora del tenant activo
- **Operation ID:** `InsuranceBackboneController_updateContactChannels`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.updateContactChannels](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Configurar los canales de contacto de la aseguradora del tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Configura los canales de contacto directo de la aseguradora del tenant activo (subtarea 2.3 — registro de procesos, Aseguradora 6.2 · ítem 5). Sin `@Roles`, igual que `createPlan`/`updateBenefit`: los roles "ADMINISTRATOR"/"OWNER" que pediría un pedido literal no existen en `role-mapping.ts`. La barrera es la membresía OWNER/ADMIN del tenant de la aseguradora (o ser plataforma), que resuelve el servicio.

### Descripción del sistema

NestJS resuelve `PUT /insurance-carriers/{id}/contact-channels` en `InsuranceBackboneController_updateContactChannels`. El controlador delega en `InsuranceBackboneService.updateContactChannels`. Valida el body como `UpdateCarrierContactChannelsDto` y consume `application/json`. El tipo de retorno estático es `Promise<CarrierContactChannelsDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateCarrierContactChannelsDto`; los campos opcionales se omiten.

```http
PUT /insurance-carriers/00000000-0000-4000-8000-000000000001/contact-channels HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "whatsappNumber": "+59171548278",
  "callCenterPhone": "800-10-6060",
  "supportEmail": "siniestros@aseguradora.com.bo"
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
| `whatsappNumber` | Sí | `string` | longitud máxima 32; patrón runtime `/^\+[1-9]\d{7,14}$/`; admite null | Número de WhatsApp de atención al cliente, en formato E.164 | `+59171548278` |
| `callCenterPhone` | Sí | `string` | longitud máxima 32; patrón runtime `/^[+\d][\d\s().-]{4,31}$/`; admite null | Teléfono o línea gratuita de atención al cliente | `800-10-6060` |
| `supportEmail` | Sí | `string` | formato `email`; longitud máxima 120; admite null | Sin descripción específica en el contrato OpenAPI. | `siniestros@aseguradora.com.bo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /insurance-carriers/00000000-0000-4000-8000-000000000001/contact-channels HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "whatsappNumber": "+59171548278",
  "callCenterPhone": "800-10-6060",
  "supportEmail": "siniestros@aseguradora.com.bo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CarrierContactChannelsDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CarrierContactChannelsDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "whatsappNumber": "valor-ejemplo",
  "callCenterPhone": "+59170000000",
  "supportEmail": "usuario@example.com"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `whatsappNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `callCenterPhone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `+59170000000` |
| `supportEmail` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-carriers/{id}/contact-channels"
}
```

---

## 21. POST /insurance-carriers/{id}/products

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de producto de aseguradora (soporte)
- **Operation ID:** `InsuranceBackboneController_createProduct`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createProduct](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de producto de aseguradora (soporte). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create product.

### Descripción del sistema

NestJS resuelve `POST /insurance-carriers/{id}/products` en `InsuranceBackboneController_createProduct`. El controlador delega en `InsuranceBackboneService.createProduct`. Valida el body como `InsuranceCreateProductDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InsuranceCreateProductDto`; los campos opcionales se omiten.

```http
POST /insurance-carriers/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "productCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
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
| `productCode` | Sí | `string` | longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-carriers/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "productCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-carriers/{id}/products"
}
```

---

## 22. GET /insurance-claims

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims-read`
- **Nombre:** Listar las solicitudes de seguro presentadas (cursor)
- **Operation ID:** `ClaimsReadController_listClaims`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsReadController.listClaims](../../src/modules/insurance/controllers/claims-read.controller.ts)

### Descripción de negocio

Listar las solicitudes de seguro presentadas (cursor). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Solicitudes de seguro que envió la organización activa.

### Descripción del sistema

NestJS resuelve `GET /insurance-claims` en `ClaimsReadController_listClaims`. El controlador delega en `ClaimsReadService.listClaims`. No recibe body. El tipo de retorno estático es `Promise<ClaimListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `statusConceptId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceCarrierId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `submittedFrom` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-01-01T00:00:00.000Z` |
| `submittedTo` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-12-31T23:59:59.999Z` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `25` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-claims HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING_OPERATOR`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-claims?statusConceptId=00000000-0000-4000-8000-000000000001&insuranceCarrierId=00000000-0000-4000-8000-000000000001&submittedFrom=2026-01-01T00%3A00%3A00.000Z&submittedTo=2026-12-31T23%3A59%3A59.999Z&cursor=valor-ejemplo&limit=25 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClaimListResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ClaimListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ClaimListResponseDto>` | No |
| 403 | La organización activa no tiene prácticas activas: no envió ninguna solicitud y esta pantalla no es suya. | `Promise<ClaimListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ClaimListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ClaimListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClaimListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "claimIdentifier": "CLM-2026-000123",
      "patient": {
        "id": "00000000-0000-4000-8000-000000000001",
        "displayName": "Nombre de ejemplo",
        "patientCode": "CODIGO_EJEMPLO",
        "memberIdentifier": "valor-ejemplo"
      },
      "carrierName": "La Boliviana Ciacruz",
      "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
      "carrierWhatsappNumber": "valor-ejemplo",
      "carrierCallCenterPhone": "+59170000000",
      "carrierSupportEmail": "usuario@example.com",
      "policyIdentifier": "POL-88213",
      "policyBrokerName": "Nombre de ejemplo",
      "billedTotal": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "approvedTotal": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "submittedAt": "2026-07-31T12:00:00.000Z",
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "hasOpenDispute": false
    }
  ],
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ClaimListItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","claimIdentifier":"CLM-2026-000123","patient":{"id":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","patientCode":"CODIGO_EJEMPLO","memberIdentifier":"valor-ejemplo"},"carrierName":"La Boliviana Ciacruz","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierWhatsappNumber":"valor-ejemplo","carrierCallCenterPhone":"+59170000000","carrierSupportEmail":"usuario@example.com","policyIdentifier":"POL-88213","policyBrokerName":"Nombre de ejemplo","billedTotal":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"approvedTotal":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"submittedAt":"2026-07-31T12:00:00.000Z","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"hasOpenDispute":false}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CLM-2026-000123` |
| `items[].patient` | Sí | `ClaimPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","patientCode":"CODIGO_EJEMPLO","memberIdentifier":"valor-ejemplo"}` |
| `items[].patient.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].patient.displayName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].patient.patientCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].patient.memberIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `La Boliviana Ciacruz` |
| `items[].insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].carrierWhatsappNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].carrierCallCenterPhone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `+59170000000` |
| `items[].carrierSupportEmail` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `items[].policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `POL-88213` |
| `items[].policyBrokerName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].billedTotal` | Sí | `MoneyDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `items[].billedTotal.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `items[].billedTotal.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].billedTotal.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].billedTotal.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].approvedTotal` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `items[].approvedTotal.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `items[].approvedTotal.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].approvedTotal.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].approvedTotal.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].submittedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].status` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `items[].hasOpenDispute` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING_OPERATOR, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-claims"
}
```

---

## 23. POST /insurance-claims

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims`
- **Nombre:** Enviar reclamo con líneas (837)
- **Operation ID:** `ClaimsController_submit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsController.submit](../../src/modules/insurance/controllers/claims.controller.ts)

### Descripción de negocio

Enviar reclamo con líneas (837). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-26-06. El servicio exige membresía OWNER/ADMIN por origen; conserva roles históricos para reclamos genéricos.

### Descripción del sistema

NestJS resuelve `POST /insurance-claims` en `ClaimsController_submit`. El controlador delega en `ClaimsService.submitClaim`. Valida el body como `CreateClaimDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedClaimDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateClaimDto`; los campos opcionales se omiten.

```http
POST /insurance-claims HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "patientCoverageId": "00000000-0000-4000-8000-000000000001",
  "billingProviderEntityId": "00000000-0000-4000-8000-000000000001",
  "claimIdentifier": "valor-ejemplo",
  "lines": [
    {
      "lineSequence": 1,
      "billedAmount": "100.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientCoverageId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `billingProviderEntityId` | Sí | `string` | formato `uuid` | Entidad facturadora | `00000000-0000-4000-8000-000000000001` |
| `claimIdentifier` | Sí | `string` | longitud máxima 80 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `inventoryReservationId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda declarada por el prestador diagnóstico | `00000000-0000-4000-8000-000000000001` |
| `priorAuthorizationRequestId` | No | `string` | formato `uuid` | Autorización previa vinculada | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<ClaimLineDto>` | mínimo 1 elemento(s) | 1..N líneas | `[{"lineSequence":1,"serviceConceptId":"00000000-0000-4000-8000-000000000001","quantity":"1","billedAmount":"100.00","inventoryReservationLineId":"00000000-0000-4000-8000-000000000001","diagnosticStudyOfferingId":"00000000-0000-4000-8000-000000000001","supportingClinicalReference":"ENC-2026-00412","patientResponsibilityAmount":"20.00"}]` |
| `lines[].lineSequence` | Sí | `number` | mínimo 1 | Secuencia única dentro del reclamo | `1` |
| `lines[].serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].quantity` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].billedAmount` | Sí | `string` | Sin restricción adicional declarada | Monto facturado | `100.00` |
| `lines[].inventoryReservationLineId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].diagnosticStudyOfferingId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].supportingClinicalReference` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `ENC-2026-00412` |
| `lines[].patientResponsibilityAmount` | No | `string` | Sin restricción adicional declarada | Responsabilidad del paciente | `20.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-claims HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "patientCoverageId": "00000000-0000-4000-8000-000000000001",
  "billingProviderEntityId": "00000000-0000-4000-8000-000000000001",
  "claimIdentifier": "valor-ejemplo",
  "inventoryReservationId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "priorAuthorizationRequestId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "lines": [
    {
      "lineSequence": 1,
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "quantity": "1",
      "billedAmount": "100.00",
      "inventoryReservationLineId": "00000000-0000-4000-8000-000000000001",
      "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
      "supportingClinicalReference": "ENC-2026-00412",
      "patientResponsibilityAmount": "20.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedClaimDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CreatedClaimDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedClaimDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedClaimDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedClaimDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedClaimDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedClaimDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedClaimDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedClaimDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedClaimDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z",
  "lineIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `lineIds` | No | `array<string>` | Sin restricción adicional declarada | IDs de líneas vinculadas en orden de lineSequence | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Cobertura no encontrada | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 409 | `CONFLICT` | El pedido ya tiene un reclamo activo | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 409 | `CONFLICT` | Reclamo duplicado | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 409 | `CONFLICT` | La clave de idempotencia corresponde a otro reclamo | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 409 | `CONFLICT` | La clave de idempotencia requiere las mismas líneas | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un reclamo sólo puede representar un pedido | Excepción explícita en src/modules/insurance/services/linked-claim-order.service.ts |
| 422 | `PRECONDITION_FAILED` | Las secuencias de líneas deben ser únicas | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | Los ítems vinculados requieren el pedido completo | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | La moneda del importe diagnóstico debe declararse | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido debe estar confirmado y sin sustituciones pendientes antes del retiro | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura no corresponde a la aseguradora indicada | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 422 | `PRECONDITION_FAILED` | El reclamo debe representar exactamente el pedido y su prestador | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | Las líneas deben coincidir con las cantidades e importes del pedido | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | La autorización previa debe pertenecer a la misma cobertura y pedido | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | La moneda de la cobertura y del pedido debe coincidir | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura debe estar activa y vigente para presentar el reclamo | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-claims"
}
```

---

## 24. GET /insurance-claims/{id}

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims-read`
- **Nombre:** Consultar una solicitud de seguro con sus ítems y su dictamen
- **Operation ID:** `ClaimsReadController_getClaim`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsReadController.getClaim](../../src/modules/insurance/controllers/claims-read.controller.ts)

### Descripción de negocio

Consultar una solicitud de seguro con sus ítems y su dictamen. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Detalle de una solicitud: cabecera, ítems, dictámenes y disputas.

### Descripción del sistema

NestJS resuelve `GET /insurance-claims/{id}` en `ClaimsReadController_getClaim`. El controlador delega en `ClaimsReadService.getClaim`. No recibe body. El tipo de retorno estático es `Promise<ClaimDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance-claims/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING_OPERATOR`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance-claims/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClaimDetailDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ClaimDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ClaimDetailDto>` | No |
| 403 | La solicitud no existe o la envió otra organización. El cuerpo es el mismo en los dos casos: la existencia no se filtra (AC-16-14). | `Promise<ClaimDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ClaimDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ClaimDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ClaimDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClaimDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "header": {
    "id": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "CLM-2026-000123",
    "patient": {
      "id": "00000000-0000-4000-8000-000000000001",
      "displayName": "Nombre de ejemplo",
      "patientCode": "CODIGO_EJEMPLO",
      "memberIdentifier": "valor-ejemplo"
    },
    "carrierName": "La Boliviana Ciacruz",
    "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
    "carrierWhatsappNumber": "valor-ejemplo",
    "carrierCallCenterPhone": "+59170000000",
    "carrierSupportEmail": "usuario@example.com",
    "policyIdentifier": "POL-88213",
    "policyBrokerName": "Nombre de ejemplo",
    "billedTotal": {
      "amount": "1250.00",
      "currency": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      }
    },
    "approvedTotal": {
      "amount": "1250.00",
      "currency": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      }
    },
    "submittedAt": "2026-07-31T12:00:00.000Z",
    "status": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "hasOpenDispute": false
  },
  "lines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "lineSequence": 1,
      "service": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "billedAmount": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "patientResponsibilityAmount": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "approvedAmount": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "deniedAmount": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "decision": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "denialReason": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "policyClauseReference": "valor-ejemplo",
      "denialRationale": "valor-ejemplo",
      "referenceType": "DIAGNOSTIC_STUDY",
      "reference": "valor-ejemplo",
      "duplicateStudy": {
        "previousDiagnosticReportId": "00000000-0000-4000-8000-000000000001",
        "studyName": "Ecografía abdominal",
        "performedAt": "2026-07-31T12:00:00.000Z",
        "daysAgo": 14,
        "providerName": "Centro de Diagnóstico San Gabriel",
        "justification": "valor-ejemplo",
        "reused": true
      }
    }
  ],
  "lineBilledTotal": {
    "amount": "1250.00",
    "currency": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    }
  },
  "lineApprovedTotal": {
    "amount": "1250.00",
    "currency": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    }
  },
  "adjudication": {
    "id": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "outcome": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "dispositionText": "valor-ejemplo",
    "totalApprovedAmount": {
      "amount": "1250.00",
      "currency": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      }
    },
    "totalPatientAmount": {
      "amount": "1250.00",
      "currency": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      }
    },
    "totalDeniedAmount": {
      "amount": "1250.00",
      "currency": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      }
    },
    "adjudicatedAt": "2026-07-31T12:00:00.000Z"
  },
  "adjudicationHistory": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "adjudicationVersion": 1,
      "outcome": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "dispositionText": "valor-ejemplo",
      "totalApprovedAmount": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "totalPatientAmount": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "totalDeniedAmount": {
        "amount": "1250.00",
        "currency": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        }
      },
      "adjudicatedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "disputes": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "disputeType": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "disputeReason": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "submittedAt": "2026-07-31T12:00:00.000Z",
      "filingDeadline": "2026-07-31"
    }
  ],
  "settlement": {
    "availability": "AVAILABLE",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "reconciled": true,
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "eob": {
    "id": "00000000-0000-4000-8000-000000000001",
    "publishedAt": "2026-07-31T12:00:00.000Z"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `header` | Sí | `ClaimListItemDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","claimIdentifier":"CLM-2026-000123","patient":{"id":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","patientCode":"CODIGO_EJEMPLO","memberIdentifier":"valor-ejemplo"},"carrierName":"La Boliviana Ciacruz","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierWhatsappNumber":"valor-ejemplo","carrierCallCenterPhone":"+59170000000","carrierSupportEmail":"usuario@example.com","policyIdentifier":"POL-88213","policyBrokerName":"Nombre de ejemplo","billedTotal":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"approvedTotal":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"submittedAt":"2026-07-31T12:00:00.000Z","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"hasOpenDispute":false}` |
| `header.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `header.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CLM-2026-000123` |
| `header.patient` | Sí | `ClaimPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","patientCode":"CODIGO_EJEMPLO","memberIdentifier":"valor-ejemplo"}` |
| `header.patient.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `header.patient.displayName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `header.patient.patientCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `header.patient.memberIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `header.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `La Boliviana Ciacruz` |
| `header.insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `header.carrierWhatsappNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `header.carrierCallCenterPhone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `+59170000000` |
| `header.carrierSupportEmail` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `header.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `POL-88213` |
| `header.policyBrokerName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `header.billedTotal` | Sí | `MoneyDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `header.billedTotal.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `header.billedTotal.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `header.billedTotal.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `header.billedTotal.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `header.approvedTotal` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `header.approvedTotal.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `header.approvedTotal.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `header.approvedTotal.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `header.approvedTotal.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `header.submittedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `header.status` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `header.status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `header.status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `header.hasOpenDispute` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `lines` | Sí | `array<ClaimLineViewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","lineSequence":1,"service":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"billedAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"patientResponsibilityAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"approvedAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"deniedAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"decision":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"denialReason":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo","referenceType":"DIAGNOSTIC_STUDY","reference":"valor-ejemplo","duplicateStudy":{"previousDiagnosticReportId":"00000000-0000-4000-8000-000000000001","studyName":"Ecografía abdominal","performedAt":"2026-07-31T12:00:00.000Z","daysAgo":14,"providerName":"Centro de Diagnóstico San Gabriel","justification":"valor-ejemplo","reused":true}}]` |
| `lines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].lineSequence` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].service` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lines[].service.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lines[].service.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `lines[].billedAmount` | Sí | `MoneyDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `lines[].billedAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `lines[].billedAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lines[].billedAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lines[].billedAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `lines[].patientResponsibilityAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `lines[].patientResponsibilityAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `lines[].patientResponsibilityAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lines[].patientResponsibilityAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lines[].patientResponsibilityAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `lines[].approvedAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `lines[].approvedAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `lines[].approvedAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lines[].approvedAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lines[].approvedAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `lines[].deniedAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `lines[].deniedAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `lines[].deniedAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lines[].deniedAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lines[].deniedAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `lines[].decision` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lines[].decision.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lines[].decision.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `lines[].denialReason` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lines[].denialReason.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lines[].denialReason.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `lines[].policyClauseReference` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].referenceType` | Sí | `string` | valores: `DIAGNOSTIC_STUDY`, `MEDICATION_DISPENSATION`; admite null | Sin descripción específica en el contrato OpenAPI. | `DIAGNOSTIC_STUDY` |
| `lines[].reference` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].duplicateStudy` | Sí | `ClaimLineDuplicateStudyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"previousDiagnosticReportId":"00000000-0000-4000-8000-000000000001","studyName":"Ecografía abdominal","performedAt":"2026-07-31T12:00:00.000Z","daysAgo":14,"providerName":"Centro de Diagnóstico San Gabriel","justification":"valor-ejemplo","reused":true}` |
| `lines[].duplicateStudy.previousDiagnosticReportId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].duplicateStudy.studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Ecografía abdominal` |
| `lines[].duplicateStudy.performedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `lines[].duplicateStudy.daysAgo` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `14` |
| `lines[].duplicateStudy.providerName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Centro de Diagnóstico San Gabriel` |
| `lines[].duplicateStudy.justification` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].duplicateStudy.reused` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `lineBilledTotal` | Sí | `MoneyDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `lineBilledTotal.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `lineBilledTotal.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lineBilledTotal.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lineBilledTotal.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `lineApprovedTotal` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `lineApprovedTotal.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `lineApprovedTotal.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `lineApprovedTotal.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `lineApprovedTotal.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudication` | Sí | `ClaimAdjudicationDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"outcome":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"dispositionText":"valor-ejemplo","totalApprovedAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"totalPatientAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"totalDeniedAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"adjudicatedAt":"2026-07-31T12:00:00.000Z"}` |
| `adjudication.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `adjudication.adjudicationVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `adjudication.outcome` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `adjudication.outcome.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `adjudication.outcome.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudication.dispositionText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `adjudication.totalApprovedAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `adjudication.totalApprovedAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `adjudication.totalApprovedAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `adjudication.totalApprovedAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `adjudication.totalApprovedAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudication.totalPatientAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `adjudication.totalPatientAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `adjudication.totalPatientAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `adjudication.totalPatientAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `adjudication.totalPatientAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudication.totalDeniedAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `adjudication.totalDeniedAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `adjudication.totalDeniedAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `adjudication.totalDeniedAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `adjudication.totalDeniedAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudication.adjudicatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `adjudicationHistory` | Sí | `array<ClaimAdjudicationDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"outcome":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"dispositionText":"valor-ejemplo","totalApprovedAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"totalPatientAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"totalDeniedAmount":{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}},"adjudicatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `adjudicationHistory[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `adjudicationHistory[].adjudicationVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `adjudicationHistory[].outcome` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `adjudicationHistory[].outcome.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `adjudicationHistory[].outcome.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudicationHistory[].dispositionText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `adjudicationHistory[].totalApprovedAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `adjudicationHistory[].totalApprovedAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `adjudicationHistory[].totalApprovedAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `adjudicationHistory[].totalApprovedAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `adjudicationHistory[].totalApprovedAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudicationHistory[].totalPatientAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `adjudicationHistory[].totalPatientAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `adjudicationHistory[].totalPatientAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `adjudicationHistory[].totalPatientAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `adjudicationHistory[].totalPatientAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudicationHistory[].totalDeniedAmount` | Sí | `MoneyDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"amount":"1250.00","currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}}` |
| `adjudicationHistory[].totalDeniedAmount.amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250.00` |
| `adjudicationHistory[].totalDeniedAmount.currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `adjudicationHistory[].totalDeniedAmount.currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `adjudicationHistory[].totalDeniedAmount.currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `adjudicationHistory[].adjudicatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `disputes` | Sí | `array<ClaimDisputeSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","disputeType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"disputeReason":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"submittedAt":"2026-07-31T12:00:00.000Z","filingDeadline":"2026-07-31"}]` |
| `disputes[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `disputes[].disputeType` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `disputes[].disputeType.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `disputes[].disputeType.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `disputes[].disputeReason` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `disputes[].disputeReason.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `disputes[].disputeReason.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `disputes[].status` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `disputes[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `disputes[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `disputes[].submittedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `disputes[].filingDeadline` | Sí | `string` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `settlement` | Sí | `ClaimSettlementBreakdownDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"availability":"AVAILABLE","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","reconciled":true,"exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `settlement.availability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `settlement.totalBilledAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `settlement.totalApprovedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `settlement.totalPatientAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `settlement.totalDeniedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `settlement.reconciled` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `settlement.exclusions` | Sí | `array<ClaimExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `settlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `settlement.exclusions[].itemName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `settlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `settlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `settlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `eob` | Sí | `ClaimEobDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","publishedAt":"2026-07-31T12:00:00.000Z"}` |
| `eob.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `eob.publishedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING_OPERATOR, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-claims/{id}"
}
```

---

## 25. POST /insurance-claims/{id}/adjudications

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims`
- **Nombre:** Adjudicar reclamo por línea (835)
- **Operation ID:** `ClaimsController_adjudicate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsController.adjudicate](../../src/modules/insurance/controllers/claims.controller.ts)

### Descripción de negocio

Adjudicar reclamo por línea (835). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /insurance-claims/{id}/adjudications` en `ClaimsController_adjudicate`. El controlador delega en `ClaimsService.adjudicate`. Valida el body como `CreateAdjudicationDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAdjudicationDto`; los campos opcionales se omiten.

```http
POST /insurance-claims/00000000-0000-4000-8000-000000000001/adjudications HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "APPROVED",
  "lineAdjudications": [
    {
      "insuranceClaimLineId": "00000000-0000-4000-8000-000000000001",
      "decision": "APPROVED"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `outcome` | Sí | `string` | valores: `APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `dispositionText` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `Prestaciones cubiertas por el plan familiar.` |
| `totalApprovedAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `totalPatientAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `20.00` |
| `totalDeniedAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `lineAdjudications` | Sí | `array<LineAdjudicationDto>` | mínimo 1 elemento(s) | Una por línea del reclamo | `[{"insuranceClaimLineId":"00000000-0000-4000-8000-000000000001","decision":"APPROVED","reasonConceptId":"00000000-0000-4000-8000-000000000001","policyClauseReference":"Cláusula 12.3: Medicamento no cubierto en plan ambulatorio","denialRationale":"El principio activo solicitado no está contemplado en el vademécum de cobertura ambulatoria contratado.","approvedAmount":"80.00","patientAmount":"20.00","deniedAmount":"0.00"}]` |
| `lineAdjudications[].insuranceClaimLineId` | Sí | `string` | formato `uuid` | Línea del reclamo adjudicada | `00000000-0000-4000-8000-000000000001` |
| `lineAdjudications[].decision` | Sí | `string` | valores: `APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `lineAdjudications[].reasonConceptId` | No | `string` | formato `uuid` | Motivo catalogado de la denegación (concepto de terminology). El catálogo interno todavía no declara sus miembros — AC-16-8. | `00000000-0000-4000-8000-000000000001` |
| `lineAdjudications[].policyClauseReference` | No | `string` | longitud mínima 1; longitud máxima 255 | Cita textual de la cláusula contractual que fundamenta la exclusión. Obligatoria cuando decision === DENIED. | `Cláusula 12.3: Medicamento no cubierto en plan ambulatorio` |
| `lineAdjudications[].denialRationale` | No | `string` | longitud máxima 4000 | Fundamentación circunstanciada de la exclusión, por ítem. | `El principio activo solicitado no está contemplado en el vademécum de cobertura ambulatoria contratado.` |
| `lineAdjudications[].approvedAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `lineAdjudications[].patientAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `20.00` |
| `lineAdjudications[].deniedAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-claims/00000000-0000-4000-8000-000000000001/adjudications HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "APPROVED",
  "dispositionText": "Prestaciones cubiertas por el plan familiar.",
  "totalApprovedAmount": "80.00",
  "totalPatientAmount": "20.00",
  "totalDeniedAmount": "0.00",
  "lineAdjudications": [
    {
      "insuranceClaimLineId": "00000000-0000-4000-8000-000000000001",
      "decision": "APPROVED",
      "reasonConceptId": "00000000-0000-4000-8000-000000000001",
      "policyClauseReference": "Cláusula 12.3: Medicamento no cubierto en plan ambulatorio",
      "denialRationale": "El principio activo solicitado no está contemplado en el vademécum de cobertura ambulatoria contratado.",
      "approvedAmount": "80.00",
      "patientAmount": "20.00",
      "deniedAmount": "0.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Línea de reclamo no encontrada | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El reclamo no está en estado adjudicable | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | Un reclamo sólo puede representar un pedido | Excepción explícita en src/modules/insurance/services/linked-claim-order.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido cambió; se requiere revisar el reclamo | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura no corresponde a la aseguradora indicada | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 422 | `PRECONDITION_FAILED` | La moneda de la cobertura y del pedido debe coincidir | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura debe estar activa y vigente para presentar el reclamo | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-claims/{id}/adjudications"
}
```

---

## 26. POST /insurance-claims/{id}/disputes

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims`
- **Nombre:** Abrir disputa sobre adjudicación
- **Operation ID:** `ClaimsController_openDispute`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsController.openDispute](../../src/modules/insurance/controllers/claims.controller.ts)

### Descripción de negocio

Abrir disputa sobre adjudicación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-26-11. Conserva el alcance del prestador definido por TAREA-16 para disputas. Las otras escrituras delegan la autorización en el servicio, según el origen vinculado y las membresías activas de prestador o aseguradora.

### Descripción del sistema

NestJS resuelve `POST /insurance-claims/{id}/disputes` en `ClaimsController_openDispute`. El controlador delega en `ClaimsService.openDispute`. Valida el body como `CreateDisputeDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceStatusDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDisputeDto`; los campos opcionales se omiten.

```http
POST /insurance-claims/00000000-0000-4000-8000-000000000001/disputes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "initiatedBy": "PROVIDER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`, `BILLING_OPERATOR`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `claimAdjudicationVersionId` | No | `string` | formato `uuid` | Versión de adjudicación disputada | `00000000-0000-4000-8000-000000000001` |
| `initiatedBy` | Sí | `string` | valores: `PROVIDER`, `PATIENT` | Parte que inicia | `PROVIDER` |
| `initiatedByEntityId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `filingDeadline` | No | `string` | formato `date` | Fecha límite de presentación | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-claims/00000000-0000-4000-8000-000000000001/disputes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "claimAdjudicationVersionId": "00000000-0000-4000-8000-000000000001",
  "initiatedBy": "PROVIDER",
  "initiatedByEntityId": "00000000-0000-4000-8000-000000000001",
  "filingDeadline": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceStatusDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 403 | La solicitud no existe o la envió otra organización: mismo cuerpo en los dos casos (AC-16-14). | `Promise<ResourceStatusDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE, BILLING_OPERATOR, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/insurance-claims/{id}/disputes"
}
```

---

## 27. POST /insurance-claims/{id}/eob

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims`
- **Nombre:** Publicar Explicación de Beneficios (EOB)
- **Operation ID:** `ClaimsController_publishEob`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsController.publishEob](../../src/modules/insurance/controllers/claims.controller.ts)

### Descripción de negocio

Publicar Explicación de Beneficios (EOB). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /insurance-claims/{id}/eob` en `ClaimsController_publishEob`. El controlador delega en `ClaimsService.publishEob`. Valida el body como `PublishEobDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishEobDto`; los campos opcionales se omiten.

```http
POST /insurance-claims/00000000-0000-4000-8000-000000000001/eob HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `documentRecordId` | No | `string` | formato `uuid` | Documento generado (object storage) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-claims/00000000-0000-4000-8000-000000000001/eob HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentRecordId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 409 | `CONFLICT` | La EOB ya fue publicada para esta versión | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No existe adjudicación vigente para publicar | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | El reclamo está revertido | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura del paciente no existe | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | Un reclamo sólo puede representar un pedido | Excepción explícita en src/modules/insurance/services/linked-claim-order.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido cambió; se requiere revisar el reclamo | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura no corresponde a la aseguradora indicada | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 422 | `PRECONDITION_FAILED` | La moneda de la cobertura y del pedido debe coincidir | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura debe estar activa y vigente para presentar el reclamo | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-claims/{id}/eob"
}
```

---

## 28. POST /insurance-claims/{id}/reversals

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims`
- **Nombre:** Registrar reversión de reclamo
- **Operation ID:** `ClaimsController_reverse`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsController.reverse](../../src/modules/insurance/controllers/claims.controller.ts)

### Descripción de negocio

Registrar reversión de reclamo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /insurance-claims/{id}/reversals` en `ClaimsController_reverse`. El controlador delega en `ClaimsService.reverse`. Valida el body como `CreateReversalDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReversalDto`; los campos opcionales se omiten.

```http
POST /insurance-claims/00000000-0000-4000-8000-000000000001/reversals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reversedAdjudicationVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reversedAdjudicationVersionId` | Sí | `string` | formato `uuid` | Versión de adjudicación a revertir | `00000000-0000-4000-8000-000000000001` |
| `reversalAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `idempotencyKey` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-claims/00000000-0000-4000-8000-000000000001/reversals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reversedAdjudicationVersionId": "00000000-0000-4000-8000-000000000001",
  "reversalAmount": "80.00",
  "idempotencyKey": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Versión de adjudicación no encontrada | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El reclamo no está en estado reversible | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo puede revertirse la versión vigente | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 422 | `PRECONDITION_FAILED` | Un reclamo sólo puede representar un pedido | Excepción explícita en src/modules/insurance/services/linked-claim-order.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance-claims/{id}/reversals"
}
```

---

## 29. POST /insurance-plans/{planId}/benefits

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Crear una cobertura de un plan administrable
- **Operation ID:** `InsuranceBackboneController_createBenefit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createBenefit](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Crear una cobertura de un plan administrable. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create benefit.

### Descripción del sistema

NestJS resuelve `POST /insurance-plans/{planId}/benefits` en `InsuranceBackboneController_createBenefit`. El controlador delega en `InsuranceBackboneService.createBenefit`. Valida el body como `CreatePlanBenefitDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePlanBenefitDto`; los campos opcionales se omiten.

```http
POST /insurance-plans/00000000-0000-4000-8000-000000000001/benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "benefitCategoryConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `planId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `benefitCategoryConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `requiresPriorAuthorization` | No | `boolean` | Sin restricción adicional declarada | Requiere autorización previa | `true` |
| `coveragePercent` | No | `string` | patrón runtime `COVERAGE_PATTERN` | Porcentaje de cobertura | `80` |
| `copayAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `25.00` |
| `deductibleAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `100.00` |
| `annualLimitAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `5000.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-plans/00000000-0000-4000-8000-000000000001/benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "benefitCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31",
  "effectiveTo": "2026-07-31",
  "requiresPriorAuthorization": true,
  "coveragePercent": "80",
  "copayAmount": "25.00",
  "deductibleAmount": "100.00",
  "annualLimitAmount": "5000.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-plans/{planId}/benefits"
}
```

---

## 30. PUT /insurance-plans/{planId}/benefits/{benefitId}

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Editar importes de una cobertura
- **Operation ID:** `InsuranceBackboneController_updateBenefit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.updateBenefit](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Editar importes de una cobertura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Reemplaza los importes administrables de una cobertura.

### Descripción del sistema

NestJS resuelve `PUT /insurance-plans/{planId}/benefits/{benefitId}` en `InsuranceBackboneController_updateBenefit`. El controlador delega en `InsuranceBackboneService.updateBenefit`. Valida el body como `UpdatePlanBenefitDto` y consume `application/json`. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `benefitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdatePlanBenefitDto`; los campos opcionales se omiten.

```http
PUT /insurance-plans/00000000-0000-4000-8000-000000000001/benefits/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "coveragePercent": "80.00",
  "copayAmount": "25.00",
  "deductibleAmount": "100.00",
  "annualLimitAmount": "5000.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `planId`, `benefitId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `coveragePercent` | Sí | `string` | patrón runtime `COVERAGE_PATTERN`; admite null | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `copayAmount` | Sí | `string` | patrón runtime `MONEY_PATTERN`; admite null | Sin descripción específica en el contrato OpenAPI. | `25.00` |
| `deductibleAmount` | Sí | `string` | patrón runtime `MONEY_PATTERN`; admite null | Sin descripción específica en el contrato OpenAPI. | `100.00` |
| `annualLimitAmount` | Sí | `string` | patrón runtime `MONEY_PATTERN`; admite null | Sin descripción específica en el contrato OpenAPI. | `5000.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /insurance-plans/00000000-0000-4000-8000-000000000001/benefits/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "coveragePercent": "80.00",
  "copayAmount": "25.00",
  "deductibleAmount": "100.00",
  "annualLimitAmount": "5000.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OkResultDto`. Ejemplo completo derivado de ese DTO:

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
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Beneficio no encontrado | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-plans/{planId}/benefits/{benefitId}"
}
```

---

## 31. PUT /insurance-plans/{planId}/benefits/{benefitId}/rules

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Editar reglas de aprobación de una cobertura
- **Operation ID:** `InsuranceBackboneController_updateBenefitRules`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.updateBenefitRules](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Editar reglas de aprobación de una cobertura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Reemplaza autorización previa, documentos y exclusión.

### Descripción del sistema

NestJS resuelve `PUT /insurance-plans/{planId}/benefits/{benefitId}/rules` en `InsuranceBackboneController_updateBenefitRules`. El controlador delega en `InsuranceBackboneService.updateBenefitRules`. Valida el body como `UpdatePlanBenefitRulesDto` y consume `application/json`. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `benefitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdatePlanBenefitRulesDto`; los campos opcionales se omiten.

```http
PUT /insurance-plans/00000000-0000-4000-8000-000000000001/benefits/00000000-0000-4000-8000-000000000001/rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requiresPriorAuthorization": true,
  "requiredDocuments": [
    "FIRMA_MEDICO"
  ],
  "exclusionNotes": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `planId`, `benefitId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requiresPriorAuthorization` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `requiredDocuments` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["FIRMA_MEDICO"]` |
| `exclusionNotes` | Sí | `string` | longitud máxima 1000; admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /insurance-plans/00000000-0000-4000-8000-000000000001/benefits/00000000-0000-4000-8000-000000000001/rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requiresPriorAuthorization": true,
  "requiredDocuments": [
    "FIRMA_MEDICO"
  ],
  "exclusionNotes": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OkResultDto`. Ejemplo completo derivado de ese DTO:

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
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Beneficio no encontrado | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-plans/{planId}/benefits/{benefitId}/rules"
}
```

---

## 32. PUT /insurance-plans/{planId}/premium

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Declarar la prima de lista mensual de un plan administrable
- **Operation ID:** `InsuranceBackboneController_updatePlanPremium`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.updatePlanPremium](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Declarar la prima de lista mensual de un plan administrable. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Subtarea 3.1 (v4.2.14) — la aseguradora declara la prima de lista mensual de un plan que ya existe. Reemplazo completo de un solo valor; `null` la quita. Sin `@Roles`, como `createPlan`: la barrera es la membresía OWNER/ADMIN del tenant de la aseguradora (`administrableCarrier`).

### Descripción del sistema

NestJS resuelve `PUT /insurance-plans/{planId}/premium` en `InsuranceBackboneController_updatePlanPremium`. El controlador delega en `InsuranceBackboneService.updatePlanPremium`. Valida el body como `UpdatePlanPremiumDto` y consume `application/json`. El tipo de retorno estático es `Promise<PlanPremiumDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdatePlanPremiumDto`; los campos opcionales se omiten.

```http
PUT /insurance-plans/00000000-0000-4000-8000-000000000001/premium HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "monthlyPremiumAmount": "350.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `planId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `monthlyPremiumAmount` | Sí | `string` | patrón runtime `MONEY_PATTERN`; admite null | Sin descripción específica en el contrato OpenAPI. | `350.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /insurance-plans/00000000-0000-4000-8000-000000000001/premium HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "monthlyPremiumAmount": "350.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PlanPremiumDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PlanPremiumDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "monthlyPremiumAmount": "350.00"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `monthlyPremiumAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `350.00` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-plans/{planId}/premium"
}
```

---

## 33. POST /insurance-products/{productId}/plans

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Crear un plan del carrier del tenant activo
- **Operation ID:** `InsuranceBackboneController_createPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createPlan](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Crear un plan del carrier del tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create plan.

### Descripción del sistema

NestJS resuelve `POST /insurance-products/{productId}/plans` en `InsuranceBackboneController_createPlan`. El controlador delega en `InsuranceBackboneService.createPlan`. Valida el body como `CreatePlanDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `productId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePlanDto`; los campos opcionales se omiten.

```http
POST /insurance-products/00000000-0000-4000-8000-000000000001/plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "planCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `productId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `planCode` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `effectiveFrom` | No | `string` | formato `date` | Vigencia desde (ISO date) | `2026-07-31` |
| `effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `monthlyPremiumAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Prima de lista mensual del plan, en la moneda del plan | `350.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-products/00000000-0000-4000-8000-000000000001/plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "planCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "effectiveFrom": "2026-07-31",
  "effectiveTo": "2026-07-31",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "monthlyPremiumAmount": "350.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Producto no encontrado | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-products/{productId}/plans"
}
```

---

## 34. GET /insurance/analytics/loss-ratio

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-analytics`
- **Nombre:** Tablero de siniestralidad, gasto per cápita y epidemiología de la aseguradora del tenant activo
- **Operation ID:** `InsuranceAnalyticsController_getLossRatioAnalytics`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceAnalyticsController.getLossRatioAnalytics](../../src/modules/insurance/controllers/insurance-analytics.controller.ts)

### Descripción de negocio

Tablero de siniestralidad, gasto per cápita y epidemiología de la aseguradora del tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Loss ratio estimado, gasto per cápita, reclamos, afiliados, tendencia mensual, top de medicamentos, especialidades, patologías CIE-10 e inmunización de la aseguradora del tenant activo.

### Descripción del sistema

NestJS resuelve `GET /insurance/analytics/loss-ratio` en `InsuranceAnalyticsController_getLossRatioAnalytics`. El controlador delega en `InsuranceAnalyticsService.getLossRatioAnalytics`. No recibe body. El tipo de retorno estático es `Promise<InsuranceDashboardAnalyticsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `startDate` | query | No | `string` | formato `date` | Fecha de inicio del periodo (inclusive). Sin ella: 12 meses atrás. | `2026-01-01` |
| `endDate` | query | No | `string` | formato `date` | Fecha de fin del periodo (inclusive). Sin ella: hoy en La Paz. | `2026-12-31` |
| `planId` | query | No | `string` | formato `uuid` | Acota el tablero a un plan del carrier del tenant activo. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance/analytics/loss-ratio HTTP/1.1
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
GET /insurance/analytics/loss-ratio?startDate=2026-01-01&endDate=2026-12-31&planId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InsuranceDashboardAnalyticsResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<InsuranceDashboardAnalyticsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<InsuranceDashboardAnalyticsResponseDto>` | No |
| 403 | El actor no administra el tenant de la aseguradora ni tiene rol INSURANCE_OPERATOR/SECURITY_ADMIN. | `Promise<InsuranceDashboardAnalyticsResponseDto>` | No |
| 404 | El tenant activo no tiene aseguradora, o planId no pertenece a la aseguradora. | `Promise<InsuranceDashboardAnalyticsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<InsuranceDashboardAnalyticsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<InsuranceDashboardAnalyticsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InsuranceDashboardAnalyticsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "carrierId": "00000000-0000-4000-8000-000000000001",
  "carrierLegalName": "Seguros Andina",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "currency": {
    "code": "CARRIER_ACTIVE",
    "display": "Aseguradora activa"
  },
  "kpis": {
    "totalClaimsCount": 42,
    "adjudicatedClaimsCount": 38,
    "pendingClaimsCount": 4,
    "otherCurrencyClaimsCount": 0,
    "totalBilledAmount": "350000.00",
    "totalApprovedAmount": "280000.00",
    "totalPatientCopayAmount": "55000.00",
    "totalDeniedAmount": "15000.00",
    "approvalRatePercent": "80.00",
    "activeAffiliatesCount": 1250,
    "periodMonths": "3.00",
    "averageMonthlyPerCapitaExpense": "224.00",
    "averageAnnualPerCapitaExpense": "2688.00",
    "estimatedPremiumsTotal": "400000.00",
    "coveragesWithoutPremiumCount": 3,
    "lossRatioPercent": "70.00"
  },
  "monthlyTrends": [
    {
      "period": "2026-01",
      "billedAmount": "28000.00",
      "approvedAmount": "22400.00",
      "claimsCount": 35
    }
  ],
  "topMedications": [
    {
      "medicationCode": "MED-001",
      "medicationName": "Losartán Potásico 50mg",
      "dispensationsCount": "180",
      "totalExpenseAmount": "14400.00",
      "sharePercent": "12.50"
    }
  ],
  "specialties": [
    {
      "specialtyCode": "MED_GEN",
      "specialtyName": "Medicina General",
      "consultationsCount": 150,
      "totalExpenseAmount": "valor-ejemplo"
    }
  ],
  "prevalentPathologies": [
    {
      "code": "I10",
      "description": "Hipertensión Esencial (Primaria)",
      "casesCount": 95,
      "percentage": "22.60"
    }
  ],
  "immunization": {
    "vaccinatedCount": 980,
    "unvaccinatedCount": 270,
    "vaccinationRatePercent": "78.40"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `carrierId` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `carrierLegalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Seguros Andina` |
| `startDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `endDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `kpis` | Sí | `LossRatioKpiDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"totalClaimsCount":42,"adjudicatedClaimsCount":38,"pendingClaimsCount":4,"otherCurrencyClaimsCount":0,"totalBilledAmount":"350000.00","totalApprovedAmount":"280000.00","totalPatientCopayAmount":"55000.00","totalDeniedAmount":"15000.00","approvalRatePercent":"80.00","activeAffiliatesCount":1250,"periodMonths":"3.00","averageMonthlyPerCapitaExpense":"224.00","averageAnnualPerCapitaExpense":"2688.00","estimatedPremiumsTotal":"400000.00","coveragesWithoutPremiumCount":3,"lossRatioPercent":"70.00"}` |
| `kpis.totalClaimsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `42` |
| `kpis.adjudicatedClaimsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `38` |
| `kpis.pendingClaimsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `4` |
| `kpis.otherCurrencyClaimsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0` |
| `kpis.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `350000.00` |
| `kpis.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `280000.00` |
| `kpis.totalPatientCopayAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `55000.00` |
| `kpis.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `15000.00` |
| `kpis.approvalRatePercent` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `kpis.activeAffiliatesCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1250` |
| `kpis.periodMonths` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `3.00` |
| `kpis.averageMonthlyPerCapitaExpense` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `224.00` |
| `kpis.averageAnnualPerCapitaExpense` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `2688.00` |
| `kpis.estimatedPremiumsTotal` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `400000.00` |
| `kpis.coveragesWithoutPremiumCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `3` |
| `kpis.lossRatioPercent` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `70.00` |
| `monthlyTrends` | Sí | `array<MonthlyTrendDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"period":"2026-01","billedAmount":"28000.00","approvedAmount":"22400.00","claimsCount":35}]` |
| `monthlyTrends[].period` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-01` |
| `monthlyTrends[].billedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `28000.00` |
| `monthlyTrends[].approvedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `22400.00` |
| `monthlyTrends[].claimsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `35` |
| `topMedications` | Sí | `array<TopMedicationDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"medicationCode":"MED-001","medicationName":"Losartán Potásico 50mg","dispensationsCount":"180","totalExpenseAmount":"14400.00","sharePercent":"12.50"}]` |
| `topMedications[].medicationCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `MED-001` |
| `topMedications[].medicationName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Losartán Potásico 50mg` |
| `topMedications[].dispensationsCount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `180` |
| `topMedications[].totalExpenseAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `14400.00` |
| `topMedications[].sharePercent` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `12.50` |
| `specialties` | Sí | `array<SpecialtyDistributionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"specialtyCode":"MED_GEN","specialtyName":"Medicina General","consultationsCount":150,"totalExpenseAmount":"valor-ejemplo"}]` |
| `specialties[].specialtyCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `MED_GEN` |
| `specialties[].specialtyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Medicina General` |
| `specialties[].consultationsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `150` |
| `specialties[].totalExpenseAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prevalentPathologies` | Sí | `array<PrevalentPathologyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"I10","description":"Hipertensión Esencial (Primaria)","casesCount":95,"percentage":"22.60"}]` |
| `prevalentPathologies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `I10` |
| `prevalentPathologies[].description` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Hipertensión Esencial (Primaria)` |
| `prevalentPathologies[].casesCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `95` |
| `prevalentPathologies[].percentage` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `22.60` |
| `immunization` | Sí | `ImmunizationRateDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"vaccinatedCount":980,"unvaccinatedCount":270,"vaccinationRatePercent":"78.40"}` |
| `immunization.vaccinatedCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `980` |
| `immunization.unvaccinatedCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `270` |
| `immunization.vaccinationRatePercent` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `78.40` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Rol insuficiente para ver la analítica de la aseguradora | Excepción explícita en src/modules/insurance/services/insurance-analytics.service.ts |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-analytics.service.ts |
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/insurance/services/insurance-analytics.service.ts |
| 422 | `PRECONDITION_FAILED` | startDate debe ser anterior o igual a endDate | Excepción explícita en src/modules/insurance/services/insurance-analytics.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/analytics/loss-ratio"
}
```

---

## 35. GET /insurance/portability/certificates/{certificateId}/json

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-portability`
- **Nombre:** Descargar el certificado de portabilidad en JSON interoperable
- **Operation ID:** `InsurancePortabilityController_downloadJson`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsurancePortabilityController.downloadJson](../../src/modules/insurance/controllers/insurance-portability.controller.ts)

### Descripción de negocio

Descargar el certificado de portabilidad en JSON interoperable. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El certificado en JSON interoperable, tal como se selló.

### Descripción del sistema

NestJS resuelve `GET /insurance/portability/certificates/{certificateId}/json` en `InsurancePortabilityController_downloadJson`. El controlador delega en `InsurancePortabilityService.downloadJson`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `certificateId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance/portability/certificates/00000000-0000-4000-8000-000000000001/json HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `certificateId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance/portability/certificates/00000000-0000-4000-8000-000000000001/json HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | JSON del certificado, exactamente como se selló | `Promise<void>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | El actor no es el titular del certificado | `Promise<void>` | No |
| 404 | El certificado no existe | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Certificado no encontrado | Excepción explícita en src/modules/insurance/services/insurance-portability.service.ts |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/portability/certificates/{certificateId}/json"
}
```

---

## 36. GET /insurance/portability/certificates/{certificateId}/pdf

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-portability`
- **Nombre:** Descargar el certificado de portabilidad en PDF
- **Operation ID:** `InsurancePortabilityController_downloadPdf`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsurancePortabilityController.downloadPdf](../../src/modules/insurance/controllers/insurance-portability.controller.ts)

### Descripción de negocio

Descargar el certificado de portabilidad en PDF. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El certificado oficial en PDF, con su código QR de verificación.

### Descripción del sistema

NestJS resuelve `GET /insurance/portability/certificates/{certificateId}/pdf` en `InsurancePortabilityController_downloadPdf`. El controlador delega en `InsurancePortabilityService.renderPdf`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `certificateId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /insurance/portability/certificates/00000000-0000-4000-8000-000000000001/pdf HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `certificateId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /insurance/portability/certificates/00000000-0000-4000-8000-000000000001/pdf HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | PDF del certificado, con QR de verificación y sello SHA-256 | `Promise<void>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | El actor no es el titular del certificado | `Promise<void>` | No |
| 404 | El certificado no existe | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Certificado no encontrado | Excepción explícita en src/modules/insurance/services/insurance-portability.service.ts |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/portability/certificates/{certificateId}/pdf"
}
```

---

## 37. POST /insurance/portability/export

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-portability`
- **Nombre:** Exportar el historial de póliza y siniestralidad del titular a 1 clic
- **Operation ID:** `InsurancePortabilityController_export`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsurancePortabilityController.export](../../src/modules/insurance/controllers/insurance-portability.controller.ts)

### Descripción de negocio

Exportar el historial de póliza y siniestralidad del titular a 1 clic. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Arma, sella y persiste el certificado del titular.

### Descripción del sistema

NestJS resuelve `POST /insurance/portability/export` en `InsurancePortabilityController_export`. El controlador delega en `InsurancePortabilityService.export`. Valida el body como `RequestPortabilityExportDto` y consume `application/json`. El tipo de retorno estático es `Promise<PortabilityExportResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestPortabilityExportDto`; los campos opcionales se omiten.

```http
POST /insurance/portability/export HTTP/1.1
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
- Rate limit particular: `Throttle(EXPORT_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `format` | No | `string` | valores: `PDF`, `JSON`, `BUNDLE` | Sin descripción específica en el contrato OpenAPI. | `BUNDLE` |
| `targetInsurerTenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance/portability/export HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "format": "BUNDLE",
  "targetInsurerTenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PortabilityExportResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<PortabilityExportResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PortabilityExportResultDto>` | No |
| 403 | El actor no es el titular del perfil ni plataforma. | `Promise<PortabilityExportResultDto>` | No |
| 404 | El paciente o la aseguradora declarada no existen. | `Promise<PortabilityExportResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PortabilityExportResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PortabilityExportResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PortabilityExportResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PortabilityExportResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PortabilityExportResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PortabilityExportResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "certificateId": "00000000-0000-4000-8000-000000000001",
  "manifestHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "generatedAt": "2026-09-18T18:00:00.000Z",
  "format": "PDF",
  "recordCount": 14,
  "policiesCount": 3,
  "pdfDownloadUrl": "/insurance/portability/certificates/a1b2c3d4/pdf",
  "jsonDownloadUrl": "/insurance/portability/certificates/a1b2c3d4/json",
  "verificationUrl": "https://app.alovida.com/verify/portability/e3b0c442...",
  "summary": {
    "currencyCode": "BOB",
    "allTime": {
      "claimsCount": 1,
      "approvedCount": 1,
      "deniedCount": 1,
      "pendingCount": 1,
      "billedAmount": "12450.00",
      "coveredAmount": "10230.00",
      "patientCopayAmount": "1200.00",
      "deniedAmount": "0.00",
      "firstClaimAt": "valor-ejemplo",
      "lastClaimAt": "valor-ejemplo",
      "coveredMonths": "11.87"
    },
    "last36Months": {
      "claimsCount": 1,
      "approvedCount": 1,
      "deniedCount": 1,
      "pendingCount": 1,
      "billedAmount": "12450.00",
      "coveredAmount": "10230.00",
      "patientCopayAmount": "1200.00",
      "deniedAmount": "0.00",
      "firstClaimAt": "valor-ejemplo",
      "lastClaimAt": "valor-ejemplo",
      "coveredMonths": "11.87"
    },
    "byYear": [
      {
        "year": 2026,
        "claimsCount": 1,
        "billedAmount": "4500.00",
        "coveredAmount": "3600.00"
      }
    ],
    "claimsOver2000Count": 1,
    "estimatedLossRatioPercent": "86.14"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `certificateId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `manifestHash` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `generatedAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-09-18T18:00:00.000Z` |
| `format` | Sí | `string` | valores: `PDF`, `JSON`, `BUNDLE` | Sin descripción específica en el contrato OpenAPI. | `PDF` |
| `recordCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `14` |
| `policiesCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `3` |
| `pdfDownloadUrl` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `/insurance/portability/certificates/a1b2c3d4/pdf` |
| `jsonDownloadUrl` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `/insurance/portability/certificates/a1b2c3d4/json` |
| `verificationUrl` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `https://app.alovida.com/verify/portability/e3b0c442...` |
| `summary` | Sí | `PortabilitySummaryDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"currencyCode":"BOB","allTime":{"claimsCount":1,"approvedCount":1,"deniedCount":1,"pendingCount":1,"billedAmount":"12450.00","coveredAmount":"10230.00","patientCopayAmount":"1200.00","deniedAmount":"0.00","firstClaimAt":"valor-ejemplo","lastClaimAt":"valor-ejemplo","coveredMonths":"11.87"},"last36Months":{"claimsCount":1,"approvedCount":1,"deniedCount":1,"pendingCount":1,"billedAmount":"12450.00","coveredAmount":"10230.00","patientCopayAmount":"1200.00","deniedAmount":"0.00","firstClaimAt":"valor-ejemplo","lastClaimAt":"valor-ejemplo","coveredMonths":"11.87"},"byYear":[{"year":2026,"claimsCount":1,"billedAmount":"4500.00","coveredAmount":"3600.00"}],"claimsOver2000Count":1,"estimatedLossRatioPercent":"86.14"}` |
| `summary.currencyCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `summary.allTime` | Sí | `PortabilityPeriodStatsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"claimsCount":1,"approvedCount":1,"deniedCount":1,"pendingCount":1,"billedAmount":"12450.00","coveredAmount":"10230.00","patientCopayAmount":"1200.00","deniedAmount":"0.00","firstClaimAt":"valor-ejemplo","lastClaimAt":"valor-ejemplo","coveredMonths":"11.87"}` |
| `summary.allTime.claimsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.allTime.approvedCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.allTime.deniedCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.allTime.pendingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.allTime.billedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `12450.00` |
| `summary.allTime.coveredAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `10230.00` |
| `summary.allTime.patientCopayAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1200.00` |
| `summary.allTime.deniedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `summary.allTime.firstClaimAt` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `summary.allTime.lastClaimAt` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `summary.allTime.coveredMonths` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `11.87` |
| `summary.last36Months` | Sí | `PortabilityPeriodStatsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"claimsCount":1,"approvedCount":1,"deniedCount":1,"pendingCount":1,"billedAmount":"12450.00","coveredAmount":"10230.00","patientCopayAmount":"1200.00","deniedAmount":"0.00","firstClaimAt":"valor-ejemplo","lastClaimAt":"valor-ejemplo","coveredMonths":"11.87"}` |
| `summary.last36Months.claimsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.last36Months.approvedCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.last36Months.deniedCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.last36Months.pendingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.last36Months.billedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `12450.00` |
| `summary.last36Months.coveredAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `10230.00` |
| `summary.last36Months.patientCopayAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1200.00` |
| `summary.last36Months.deniedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `summary.last36Months.firstClaimAt` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `summary.last36Months.lastClaimAt` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `summary.last36Months.coveredMonths` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `11.87` |
| `summary.byYear` | Sí | `array<PortabilityYearStatsDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"year":2026,"claimsCount":1,"billedAmount":"4500.00","coveredAmount":"3600.00"}]` |
| `summary.byYear[].year` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026` |
| `summary.byYear[].claimsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.byYear[].billedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `4500.00` |
| `summary.byYear[].coveredAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `3600.00` |
| `summary.claimsOver2000Count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.estimatedLossRatioPercent` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `86.14` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | La aseguradora declarada no existe | Excepción explícita en src/modules/insurance/services/insurance-portability.service.ts |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/insurance/services/insurance-portability.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El artefacto generado no tiene contenido | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El artefacto generado excede el tamaño máximo permitido | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(EXPORT_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/insurance/portability/export"
}
```

---

## 38. POST /patient-coverages

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-coverage`
- **Nombre:** Registrar cobertura de paciente y dependientes
- **Operation ID:** `CoverageController_enroll`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CoverageController.enroll](../../src/modules/insurance/controllers/coverage.controller.ts)

### Descripción de negocio

Registrar cobertura de paciente y dependientes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /patient-coverages` en `CoverageController_enroll`. El controlador delega en `CoverageService.enrollCoverage`. Valida el body como `CreateCoverageDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceStatusDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCoverageDto`; los campos opcionales se omiten.

```http
POST /patient-coverages HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insurancePlanId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "memberIdentifier": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `insurancePlanId` | Sí | `string` | formato `uuid` | Plan de seguro afiliado | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Perfil del paciente/afiliado | `00000000-0000-4000-8000-000000000001` |
| `memberIdentifier` | Sí | `string` | longitud mínima 1; longitud máxima 80 | Identificador de afiliado (member id) | `valor-ejemplo` |
| `policyIdentifier` | No | `string` | longitud máxima 80 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `coverageOrder` | No | `number` | mínimo 1 | Orden de coordinación (1=primaria) | `1` |
| `insuranceBrokerId` | No | `string` | formato `uuid` | Broker que intermedia (vincula broker_clients) | `00000000-0000-4000-8000-000000000001` |
| `dependents` | No | `array<CoverageDependentDto>` | máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dependentPatientProfileId":"00000000-0000-4000-8000-000000000001","relationship":"SPOUSE"}]` |
| `dependents[].dependentPatientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `dependents[].relationship` | No | `string` | valores: `SPOUSE`, `CHILD` | Sin descripción específica en el contrato OpenAPI. | `SPOUSE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /patient-coverages HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insurancePlanId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "memberIdentifier": "valor-ejemplo",
  "policyIdentifier": "valor-ejemplo",
  "coverageOrder": 1,
  "insuranceBrokerId": "00000000-0000-4000-8000-000000000001",
  "dependents": [
    {
      "dependentPatientProfileId": "00000000-0000-4000-8000-000000000001",
      "relationship": "SPOUSE"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceStatusDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/insurance/services/coverage.service.ts |
| 409 | `CONFLICT` | El afiliado ya tiene cobertura en ese plan | Excepción explícita en src/modules/insurance/services/coverage.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El plan no está activo | Excepción explícita en src/modules/insurance/services/coverage.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/patient-coverages"
}
```

---

## 39. GET /practitioner-settlement-batches

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-practitioner-settlement`
- **Nombre:** Listar los lotes de liquidación del alcance del actor
- **Operation ID:** `PractitionerSettlementBatchesController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSettlementBatchesController.list](../../src/modules/insurance/controllers/practitioner-settlement-batches.controller.ts)

### Descripción de negocio

Listar los lotes de liquidación del alcance del actor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /practitioner-settlement-batches` en `PractitionerSettlementBatchesController_list`. El controlador delega en `PractitionerSettlementBatchesService.list`. No recibe body. El tipo de retorno estático es `Promise<PractitionerSettlementBatchListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `providerEntityId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | formato `date` | Sin descripción específica en OpenAPI. | `2026-07-31` |
| `to` | query | No | `string` | formato `date` | Sin descripción específica en OpenAPI. | `2026-07-31` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practitioner-settlement-batches HTTP/1.1
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
GET /practitioner-settlement-batches?providerEntityId=00000000-0000-4000-8000-000000000001&from=2026-07-31&to=2026-07-31 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSettlementBatchListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
      "carrierName": "Nombre de ejemplo",
      "providerEntityId": "00000000-0000-4000-8000-000000000001",
      "cadence": {},
      "periodStart": "2026-07-31",
      "periodEnd": "2026-07-31",
      "currencyCode": "BOB",
      "status": "SETTLEMENT_BATCH_ISSUED",
      "generatedAt": "2026-07-31T12:00:00.000Z",
      "replayed": true,
      "totals": {
        "totalBilledAmount": "valor-ejemplo",
        "totalApprovedAmount": "valor-ejemplo",
        "totalPatientAmount": "valor-ejemplo",
        "totalDeniedAmount": "valor-ejemplo",
        "totalReversalAdjustmentAmount": "valor-ejemplo"
      },
      "claims": [
        {
          "claimId": "00000000-0000-4000-8000-000000000001",
          "claimIdentifier": "valor-ejemplo",
          "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
          "adjudicationVersion": 1,
          "eobPublishedAt": "2026-07-31T12:00:00.000Z",
          "totalBilledAmount": "valor-ejemplo",
          "totalApprovedAmount": "valor-ejemplo",
          "totalPatientAmount": "valor-ejemplo",
          "totalDeniedAmount": "valor-ejemplo",
          "exclusionsCount": 1
        }
      ],
      "excludedClaims": [
        {
          "claimId": "00000000-0000-4000-8000-000000000001",
          "claimIdentifier": "valor-ejemplo",
          "reason": {}
        }
      ],
      "reversalAdjustments": [
        {
          "claimId": "00000000-0000-4000-8000-000000000001",
          "claimIdentifier": "valor-ejemplo",
          "previousBatchId": "00000000-0000-4000-8000-000000000001",
          "adjustmentAmount": "valor-ejemplo"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PractitionerSettlementBatchDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","providerEntityId":"00000000-0000-4000-8000-000000000001","cadence":{},"periodStart":"2026-07-31","periodEnd":"2026-07-31","currencyCode":"BOB","status":"SETTLEMENT_BATCH_ISSUED","generatedAt":"2026-07-31T12:00:00.000Z","replayed":true,"totals":{"totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","totalReversalAdjustmentAmount":"valor-ejemplo"},"claims":[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobPublishedAt":"2026-07-31T12:00:00.000Z","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","exclusionsCount":1}],"excludedClaims":[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","reason":{}}],"reversalAdjustments":[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","previousBatchId":"00000000-0000-4000-8000-000000000001","adjustmentAmount":"valor-ejemplo"}]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].providerEntityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].cadence` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SETTLEMENT_CADENCES)[number] | `{}` |
| `items[].periodStart` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `items[].periodEnd` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `items[].currencyCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `SETTLEMENT_BATCH_ISSUED` |
| `items[].generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].replayed` | Sí | `boolean` | Sin restricción adicional declarada | true cuando la clave natural ya existía (idempotencia, contrato §9) | `true` |
| `items[].totals` | Sí | `PractitionerSettlementBatchTotalsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","totalReversalAdjustmentAmount":"valor-ejemplo"}` |
| `items[].totals.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].totals.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | A transferir por la aseguradora | `valor-ejemplo` |
| `items[].totals.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Copagos percibidos en consulta | `valor-ejemplo` |
| `items[].totals.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Exclusiones aplicadas | `valor-ejemplo` |
| `items[].totals.totalReversalAdjustmentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].claims` | Sí | `array<PractitionerSettlementBatchClaimDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobPublishedAt":"2026-07-31T12:00:00.000Z","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","exclusionsCount":1}]` |
| `items[].claims[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].claims[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].claims[].adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].claims[].adjudicationVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].claims[].eobPublishedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].claims[].totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].claims[].totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].claims[].totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].claims[].totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].claims[].exclusionsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].excludedClaims` | Sí | `array<PractitionerSettlementBatchExcludedClaimDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","reason":{}}]` |
| `items[].excludedClaims[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].excludedClaims[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].excludedClaims[].reason` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SETTLEMENT_EXCLUSION_REASONS)[number] | `{}` |
| `items[].reversalAdjustments` | Sí | `array<PractitionerSettlementBatchReversalAdjustmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","previousBatchId":"00000000-0000-4000-8000-000000000001","adjustmentAmount":"valor-ejemplo"}]` |
| `items[].reversalAdjustments[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reversalAdjustments[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].reversalAdjustments[].previousBatchId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reversalAdjustments[].adjustmentAmount` | Sí | `string` | Sin restricción adicional declarada | Negativo | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | La organización activa no administra una aseguradora ni tiene prácticas, unidades diagnósticas o farmacias activas | Excepción explícita en src/modules/insurance/services/practitioner-settlement-batches.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioner-settlement-batches"
}
```

---

## 40. POST /practitioner-settlement-batches

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-practitioner-settlement`
- **Nombre:** Generar (o repetir) el lote de liquidación del período
- **Operation ID:** `PractitionerSettlementBatchesController_generate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSettlementBatchesController.generate](../../src/modules/insurance/controllers/practitioner-settlement-batches.controller.ts)

### Descripción de negocio

Generar (o repetir) el lote de liquidación del período. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Genera el lote del período, o devuelve el existente (contrato §9): `201` si es nuevo, `200` con `replayed: true` si ya existía.

### Descripción del sistema

NestJS resuelve `POST /practitioner-settlement-batches` en `PractitionerSettlementBatchesController_generate`. El controlador delega en `PractitionerSettlementBatchesService.generate`. Valida el body como `GeneratePractitionerSettlementBatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerSettlementBatchDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GeneratePractitionerSettlementBatchDto`; los campos opcionales se omiten.

```http
POST /practitioner-settlement-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "cadence": "WEEKLY",
  "periodStart": "2026-09-01"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `providerEntityId` | Sí | `string` | formato `uuid` | billing_provider_entity_id | `00000000-0000-4000-8000-000000000001` |
| `cadence` | Sí | `string` | valores: `WEEKLY`, `BIWEEKLY`, `MONTHLY` | Sin descripción específica en el contrato OpenAPI. | `WEEKLY` |
| `periodStart` | Sí | `string` | formato `date` | Día 1 (MONTHLY), día 1 o 16 (BIWEEKLY), o cualquiera (WEEKLY) | `2026-09-01` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practitioner-settlement-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "cadence": "WEEKLY",
  "periodStart": "2026-09-01"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSettlementBatchDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "carrierName": "Nombre de ejemplo",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "cadence": {},
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31",
  "currencyCode": "BOB",
  "status": "SETTLEMENT_BATCH_ISSUED",
  "generatedAt": "2026-07-31T12:00:00.000Z",
  "replayed": true,
  "totals": {
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "totalReversalAdjustmentAmount": "valor-ejemplo"
  },
  "claims": [
    {
      "claimId": "00000000-0000-4000-8000-000000000001",
      "claimIdentifier": "valor-ejemplo",
      "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
      "adjudicationVersion": 1,
      "eobPublishedAt": "2026-07-31T12:00:00.000Z",
      "totalBilledAmount": "valor-ejemplo",
      "totalApprovedAmount": "valor-ejemplo",
      "totalPatientAmount": "valor-ejemplo",
      "totalDeniedAmount": "valor-ejemplo",
      "exclusionsCount": 1
    }
  ],
  "excludedClaims": [
    {
      "claimId": "00000000-0000-4000-8000-000000000001",
      "claimIdentifier": "valor-ejemplo",
      "reason": {}
    }
  ],
  "reversalAdjustments": [
    {
      "claimId": "00000000-0000-4000-8000-000000000001",
      "claimIdentifier": "valor-ejemplo",
      "previousBatchId": "00000000-0000-4000-8000-000000000001",
      "adjustmentAmount": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `providerEntityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cadence` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SETTLEMENT_CADENCES)[number] | `{}` |
| `periodStart` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `periodEnd` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `currencyCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `SETTLEMENT_BATCH_ISSUED` |
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `replayed` | Sí | `boolean` | Sin restricción adicional declarada | true cuando la clave natural ya existía (idempotencia, contrato §9) | `true` |
| `totals` | Sí | `PractitionerSettlementBatchTotalsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","totalReversalAdjustmentAmount":"valor-ejemplo"}` |
| `totals.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totals.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | A transferir por la aseguradora | `valor-ejemplo` |
| `totals.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Copagos percibidos en consulta | `valor-ejemplo` |
| `totals.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Exclusiones aplicadas | `valor-ejemplo` |
| `totals.totalReversalAdjustmentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims` | Sí | `array<PractitionerSettlementBatchClaimDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobPublishedAt":"2026-07-31T12:00:00.000Z","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","exclusionsCount":1}]` |
| `claims[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `claims[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `claims[].adjudicationVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `claims[].eobPublishedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `claims[].totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].exclusionsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `excludedClaims` | Sí | `array<PractitionerSettlementBatchExcludedClaimDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","reason":{}}]` |
| `excludedClaims[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `excludedClaims[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `excludedClaims[].reason` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SETTLEMENT_EXCLUSION_REASONS)[number] | `{}` |
| `reversalAdjustments` | Sí | `array<PractitionerSettlementBatchReversalAdjustmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","previousBatchId":"00000000-0000-4000-8000-000000000001","adjustmentAmount":"valor-ejemplo"}]` |
| `reversalAdjustments[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reversalAdjustments[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reversalAdjustments[].previousBatchId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reversalAdjustments[].adjustmentAmount` | Sí | `string` | Sin restricción adicional declarada | Negativo | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
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
  "path": "/practitioner-settlement-batches"
}
```

---

## 41. GET /practitioner-settlement-batches/{id}

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-practitioner-settlement`
- **Nombre:** Consultar un lote de liquidación
- **Operation ID:** `PractitionerSettlementBatchesController_getById`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSettlementBatchesController.getById](../../src/modules/insurance/controllers/practitioner-settlement-batches.controller.ts)

### Descripción de negocio

Consultar un lote de liquidación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /practitioner-settlement-batches/{id}` en `PractitionerSettlementBatchesController_getById`. El controlador delega en `PractitionerSettlementBatchesService.getById`. No recibe body. El tipo de retorno estático es `Promise<PractitionerSettlementBatchDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practitioner-settlement-batches/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /practitioner-settlement-batches/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PractitionerSettlementBatchDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSettlementBatchDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "carrierName": "Nombre de ejemplo",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "cadence": {},
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31",
  "currencyCode": "BOB",
  "status": "SETTLEMENT_BATCH_ISSUED",
  "generatedAt": "2026-07-31T12:00:00.000Z",
  "replayed": true,
  "totals": {
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "totalReversalAdjustmentAmount": "valor-ejemplo"
  },
  "claims": [
    {
      "claimId": "00000000-0000-4000-8000-000000000001",
      "claimIdentifier": "valor-ejemplo",
      "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
      "adjudicationVersion": 1,
      "eobPublishedAt": "2026-07-31T12:00:00.000Z",
      "totalBilledAmount": "valor-ejemplo",
      "totalApprovedAmount": "valor-ejemplo",
      "totalPatientAmount": "valor-ejemplo",
      "totalDeniedAmount": "valor-ejemplo",
      "exclusionsCount": 1
    }
  ],
  "excludedClaims": [
    {
      "claimId": "00000000-0000-4000-8000-000000000001",
      "claimIdentifier": "valor-ejemplo",
      "reason": {}
    }
  ],
  "reversalAdjustments": [
    {
      "claimId": "00000000-0000-4000-8000-000000000001",
      "claimIdentifier": "valor-ejemplo",
      "previousBatchId": "00000000-0000-4000-8000-000000000001",
      "adjustmentAmount": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `providerEntityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cadence` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SETTLEMENT_CADENCES)[number] | `{}` |
| `periodStart` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `periodEnd` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `currencyCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `SETTLEMENT_BATCH_ISSUED` |
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `replayed` | Sí | `boolean` | Sin restricción adicional declarada | true cuando la clave natural ya existía (idempotencia, contrato §9) | `true` |
| `totals` | Sí | `PractitionerSettlementBatchTotalsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","totalReversalAdjustmentAmount":"valor-ejemplo"}` |
| `totals.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totals.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | A transferir por la aseguradora | `valor-ejemplo` |
| `totals.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Copagos percibidos en consulta | `valor-ejemplo` |
| `totals.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Exclusiones aplicadas | `valor-ejemplo` |
| `totals.totalReversalAdjustmentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims` | Sí | `array<PractitionerSettlementBatchClaimDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobPublishedAt":"2026-07-31T12:00:00.000Z","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","exclusionsCount":1}]` |
| `claims[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `claims[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `claims[].adjudicationVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `claims[].eobPublishedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `claims[].totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `claims[].exclusionsCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `excludedClaims` | Sí | `array<PractitionerSettlementBatchExcludedClaimDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","reason":{}}]` |
| `excludedClaims[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `excludedClaims[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `excludedClaims[].reason` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SETTLEMENT_EXCLUSION_REASONS)[number] | `{}` |
| `reversalAdjustments` | Sí | `array<PractitionerSettlementBatchReversalAdjustmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","previousBatchId":"00000000-0000-4000-8000-000000000001","adjustmentAmount":"valor-ejemplo"}]` |
| `reversalAdjustments[].claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reversalAdjustments[].claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reversalAdjustments[].previousBatchId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reversalAdjustments[].adjustmentAmount` | Sí | `string` | Sin restricción adicional declarada | Negativo | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioner-settlement-batches/{id}"
}
```

---

## 42. POST /prior-authorization-requests

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-prior-auth`
- **Nombre:** Solicitar autorización previa con items
- **Operation ID:** `PriorAuthController_submit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PriorAuthController.submit](../../src/modules/insurance/controllers/prior-auth.controller.ts)

### Descripción de negocio

Solicitar autorización previa con items. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-26-04. El servicio autoriza por membresía del prestador; mantiene el guard histórico para solicitudes genéricas.

### Descripción del sistema

NestJS resuelve `POST /prior-authorization-requests` en `PriorAuthController_submit`. El controlador delega en `PriorAuthService.submitRequest`. Valida el body como `CreatePriorAuthRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceStatusDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePriorAuthRequestDto`; los campos opcionales se omiten.

```http
POST /prior-authorization-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientCoverageId": "00000000-0000-4000-8000-000000000001",
  "requestingProviderEntityId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {}
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientCoverageId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inventoryReservationId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicationRequestId` | No | `string` | formato `uuid` | Receta del pedido vinculado | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestingProviderEntityId` | Sí | `string` | formato `uuid` | Entidad prestadora solicitante | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items` | Sí | `array<PriorAuthItemDto>` | mínimo 1 elemento(s) | 1..N ítems solicitados | `[{"serviceConceptId":"00000000-0000-4000-8000-000000000001","pharmacyProductId":"00000000-0000-4000-8000-000000000001","diagnosticStudyOfferingId":"00000000-0000-4000-8000-000000000001","requestedQuantity":"1","requestedAmount":"250.00"}]` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Servicio solicitado | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyProductId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].diagnosticStudyOfferingId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].requestedQuantity` | No | `string` | Sin restricción adicional declarada | Cantidad solicitada | `1` |
| `items[].requestedAmount` | No | `string` | Sin restricción adicional declarada | Monto solicitado | `250.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /prior-authorization-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientCoverageId": "00000000-0000-4000-8000-000000000001",
  "inventoryReservationId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "requestingProviderEntityId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "items": [
    {
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
      "requestedQuantity": "1",
      "requestedAmount": "250.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceStatusDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Cobertura no encontrada | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La receta requiere su pedido de farmacia vinculado | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 422 | `PRECONDITION_FAILED` | La autorización debe representar un pedido confirmado del prestador | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 422 | `PRECONDITION_FAILED` | La receta debe pertenecer al mismo pedido | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 422 | `PRECONDITION_FAILED` | La moneda no coincide con la cobertura | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 422 | `PRECONDITION_FAILED` | La autorización debe incluir todos los productos del pedido | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 422 | `PRECONDITION_FAILED` | Los productos e importes deben coincidir con el pedido | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 422 | `PRECONDITION_FAILED` | La autorización diagnóstica requiere una oferta, cantidad uno y moneda | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 422 | `PRECONDITION_FAILED` | Un reclamo sólo puede representar un pedido | Excepción explícita en src/modules/insurance/services/linked-claim-order.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura no corresponde a la aseguradora indicada | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 422 | `PRECONDITION_FAILED` | La moneda de la cobertura y del pedido debe coincidir | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 422 | `PRECONDITION_FAILED` | La cobertura debe estar activa y vigente para presentar el reclamo | Excepción explícita en src/modules/insurance/services/linked-claim-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/prior-authorization-requests"
}
```

---

## 43. POST /prior-authorization-requests/{id}/determinations

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-prior-auth`
- **Nombre:** Emitir determinación de autorización previa
- **Operation ID:** `PriorAuthController_determine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PriorAuthController.determine](../../src/modules/insurance/controllers/prior-auth.controller.ts)

### Descripción de negocio

Emitir determinación de autorización previa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /prior-authorization-requests/{id}/determinations` en `PriorAuthController_determine`. El controlador delega en `PriorAuthService.issueDetermination`. Valida el body como `CreateDeterminationDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDeterminationDto`; los campos opcionales se omiten.

```http
POST /prior-authorization-requests/00000000-0000-4000-8000-000000000001/determinations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `APPROVED`, `DENIED`, `PARTIAL` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `approvedQuantity` | No | `string` | Sin restricción adicional declarada | Cantidad aprobada | `valor-ejemplo` |
| `approvedAmount` | No | `string` | Sin restricción adicional declarada | Monto aprobado | `valor-ejemplo` |
| `validFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `validTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /prior-authorization-requests/00000000-0000-4000-8000-000000000001/determinations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED",
  "approvedQuantity": "valor-ejemplo",
  "approvedAmount": "valor-ejemplo",
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud no admite determinación en su estado actual | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 422 | `PRECONDITION_FAILED` | Un reclamo sólo puede representar un pedido | Excepción explícita en src/modules/insurance/services/linked-claim-order.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/prior-authorization-requests/{id}/determinations"
}
```

---

## 44. POST /provider-networks

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de red de prestadores (soporte)
- **Operation ID:** `InsuranceBackboneController_createProviderNetwork`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createProviderNetwork](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de red de prestadores (soporte). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create provider network.

### Descripción del sistema

NestJS resuelve `POST /provider-networks` en `InsuranceBackboneController_createProviderNetwork`. El controlador delega en `InsuranceBackboneService.createProviderNetwork`. Valida el body como `CreateProviderNetworkDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateProviderNetworkDto`; los campos opcionales se omiten.

```http
POST /provider-networks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "networkCode": "CODIGO_EJEMPLO",
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
| `insuranceCarrierId` | Sí | `string` | formato `uuid` | Aseguradora dueña de la red | `00000000-0000-4000-8000-000000000001` |
| `networkCode` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /provider-networks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "networkCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "effectiveFrom": "2026-07-31",
  "effectiveTo": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/provider-networks"
}
```

---

## 45. POST /provider-networks/{id}/memberships

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de membresía de prestador en la red
- **Operation ID:** `InsuranceBackboneController_addMembership`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.addMembership](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de membresía de prestador en la red. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /provider-networks/{id}/memberships` en `InsuranceBackboneController_addMembership`. El controlador delega en `InsuranceBackboneService.addMembership`. Valida el body como `InsuranceCreateMembershipDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceStatusDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InsuranceCreateMembershipDto`; los campos opcionales se omiten.

```http
POST /provider-networks/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerEntityId": "00000000-0000-4000-8000-000000000001"
}
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
| `providerEntityId` | Sí | `string` | formato `uuid` | Entidad prestadora (práctica/hospital/etc.) | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | No | `string` | formato `uuid` | Referencia a práctica si aplica | `00000000-0000-4000-8000-000000000001` |
| `contractReference` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /provider-networks/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "contractReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceStatusDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Red de prestadores no encontrada | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La red no está activa | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 422 | `PRECONDITION_FAILED` | La red está fuera de vigencia | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/provider-networks/{id}/memberships"
}
```

---

## 46. GET /public/portability/verify/{manifestHash}

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-portability-public`
- **Nombre:** Verificar la autenticidad de un certificado de portabilidad por su sello
- **Operation ID:** `InsurancePortabilityPublicController_verify`
- **Autenticación:** Pública
- **Implementación:** [InsurancePortabilityPublicController.verify](../../src/modules/insurance/controllers/insurance-portability-public.controller.ts)

### Descripción de negocio

Sin autenticación y sin PHI: confirma que el certificado existe y con qué se emitió.


### Descripción del sistema

NestJS resuelve `GET /public/portability/verify/{manifestHash}` en `InsurancePortabilityPublicController_verify`. El controlador delega en `InsurancePortabilityService.verify`. No recibe body. El tipo de retorno estático es `Promise<PortabilityVerificationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `manifestHash` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/portability/verify/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/portability/verify/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PortabilityVerificationResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PortabilityVerificationResponseDto>` | No |
| 404 | No existe un certificado con ese sello | `Promise<PortabilityVerificationResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PortabilityVerificationResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PortabilityVerificationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PortabilityVerificationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "VALID",
  "certificateId": "00000000-0000-4000-8000-000000000001",
  "manifestHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "generatedAt": "2026-09-18T18:00:00.000Z",
  "recordCount": 14,
  "algorithm": "SHA-256",
  "issuer": "AloVida"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `VALID` |
| `certificateId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `manifestHash` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `generatedAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-09-18T18:00:00.000Z` |
| `recordCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `14` |
| `algorithm` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `SHA-256` |
| `issuer` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `AloVida` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Certificado no encontrado | Excepción explícita en src/modules/insurance/services/insurance-portability.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/portability/verify/{manifestHash}"
}
```

---

## 47. POST /reconciliation-batches

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-reconciliation`
- **Nombre:** Abrir lote de conciliación
- **Operation ID:** `ReconciliationController_createBatch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReconciliationController.createBatch](../../src/modules/insurance/controllers/reconciliation.controller.ts)

### Descripción de negocio

Abrir lote de conciliación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /reconciliation-batches` en `ReconciliationController_createBatch`. El controlador delega en `ReconciliationService.createBatch`. Valida el body como `CreateReconciliationBatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceStatusDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReconciliationBatchDto`; los campos opcionales se omiten.

```http
POST /reconciliation-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31"
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
| `insuranceCarrierId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `providerEntityId` | Sí | `string` | formato `uuid` | Entidad prestadora conciliada | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `periodEnd` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reconciliation-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceStatusDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/reconciliation.service.ts |
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
  "path": "/reconciliation-batches"
}
```

---

## 48. POST /reconciliation-batches/{id}/items

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-reconciliation`
- **Nombre:** Agregar ítem de conciliación al lote
- **Operation ID:** `ReconciliationController_addItem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReconciliationController.addItem](../../src/modules/insurance/controllers/reconciliation.controller.ts)

### Descripción de negocio

Agregar ítem de conciliación al lote. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /reconciliation-batches/{id}/items` en `ReconciliationController_addItem`. El controlador delega en `ReconciliationService.addItem`. Valida el body como `CreateReconciliationItemDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReconciliationItemDto`; los campos opcionales se omiten.

```http
POST /reconciliation-batches/00000000-0000-4000-8000-000000000001/items HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceClaimId": "00000000-0000-4000-8000-000000000001",
  "claimAdjudicationVersionId": "00000000-0000-4000-8000-000000000001"
}
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
| `insuranceClaimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `claimAdjudicationVersionId` | Sí | `string` | formato `uuid` | Versión exacta de adjudicación liquidada | `00000000-0000-4000-8000-000000000001` |
| `expectedAmount` | No | `string` | Sin restricción adicional declarada | Monto esperado | `80.00` |
| `acceptedAmount` | No | `string` | Sin restricción adicional declarada | Monto aceptado | `80.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reconciliation-batches/00000000-0000-4000-8000-000000000001/items HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "insuranceClaimId": "00000000-0000-4000-8000-000000000001",
  "claimAdjudicationVersionId": "00000000-0000-4000-8000-000000000001",
  "expectedAmount": "80.00",
  "acceptedAmount": "80.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Lote de conciliación no encontrado | Excepción explícita en src/modules/insurance/services/reconciliation.service.ts |
| 404 | `NOT_FOUND` | Reclamo no encontrado | Excepción explícita en src/modules/insurance/services/reconciliation.service.ts |
| 404 | `NOT_FOUND` | Versión de adjudicación no encontrada | Excepción explícita en src/modules/insurance/services/reconciliation.service.ts |
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
  "path": "/reconciliation-batches/{id}/items"
}
```

---

