<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `insurance`

Referencia exhaustiva de 28 operación(es) del módulo `insurance`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `insurance-appeals`, `insurance-backbone`, `insurance-broker-commission`, `insurance-claims`, `insurance-coverage`, `insurance-prior-auth`, `insurance-read`, `insurance-reconciliation`
- **Controladores:** `AppealsController`, `BrokerCommissionController`, `ClaimsController`, `CoverageController`, `InsuranceBackboneController`, `InsuranceReadController`, `PriorAuthController`, `ReconciliationController`
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
11. [GET /insurance-carriers](#11-get-insurance-carriers) — Listar las aseguradoras del tenant activo
12. [POST /insurance-carriers](#12-post-insurance-carriers) — Alta de aseguradora (soporte)
13. [GET /insurance-carriers/{id}](#13-get-insurance-carriers-id) — Consultar el catálogo y la red de una aseguradora
14. [POST /insurance-carriers/{id}/products](#14-post-insurance-carriers-id-products) — Alta de producto de aseguradora (soporte)
15. [POST /insurance-claims](#15-post-insurance-claims) — Enviar reclamo con líneas (837)
16. [POST /insurance-claims/{id}/adjudications](#16-post-insurance-claims-id-adjudications) — Adjudicar reclamo por línea (835)
17. [POST /insurance-claims/{id}/disputes](#17-post-insurance-claims-id-disputes) — Abrir disputa sobre adjudicación
18. [POST /insurance-claims/{id}/eob](#18-post-insurance-claims-id-eob) — Publicar Explicación de Beneficios (EOB)
19. [POST /insurance-claims/{id}/reversals](#19-post-insurance-claims-id-reversals) — Registrar reversión de reclamo
20. [POST /insurance-plans/{id}/benefits](#20-post-insurance-plans-id-benefits) — Alta de beneficio de plan (soporte)
21. [POST /insurance-products/{id}/plans](#21-post-insurance-products-id-plans) — Alta de plan (soporte)
22. [POST /patient-coverages](#22-post-patient-coverages) — Registrar cobertura de paciente y dependientes
23. [POST /prior-authorization-requests](#23-post-prior-authorization-requests) — Solicitar autorización previa con items
24. [POST /prior-authorization-requests/{id}/determinations](#24-post-prior-authorization-requests-id-determinations) — Emitir determinación de autorización previa
25. [POST /provider-networks](#25-post-provider-networks) — Alta de red de prestadores (soporte)
26. [POST /provider-networks/{id}/memberships](#26-post-provider-networks-id-memberships) — Alta de membresía de prestador en la red
27. [POST /reconciliation-batches](#27-post-reconciliation-batches) — Abrir lote de conciliación
28. [POST /reconciliation-batches/{id}/items](#28-post-reconciliation-batches-id-items) — Agregar ítem de conciliación al lote

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

## 11. GET /insurance-carriers

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
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CarrierSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","carrierCode":"ASEG-001","legalName":"Nombre de ejemplo","regulatorIdentifier":"valor-ejemplo","jurisdiction":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"verification":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"productCount":1,"planCount":1,"networkCount":1,"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].carrierCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ASEG-001` |
| `items[].legalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].regulatorIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
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

## 12. POST /insurance-carriers

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
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

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

## 13. GET /insurance-carriers/{id}

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
| `products` | Sí | `array<ProductDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","productType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"marketSegment":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"plans":[{"id":"00000000-0000-4000-8000-000000000001","planCode":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","planType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"policyDocumentFileId":"00000000-0000-4000-8000-000000000001","benefits":[{"id":"00000000-0000-4000-8000-000000000001","category":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"service":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"coveragePercent":"valor-ejemplo","copayAmount":"valor-ejemplo","deductibleAmount":"valor-ejemplo","annualLimitAmount":"valor-ejemplo","requiresPriorAuthorization":true,"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo"}]}]}]` |
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
| `products[].plans` | Sí | `array<PlanDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","planCode":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","planType":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"currency":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"policyDocumentFileId":"00000000-0000-4000-8000-000000000001","benefits":[{"id":"00000000-0000-4000-8000-000000000001","category":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"service":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"coveragePercent":"valor-ejemplo","copayAmount":"valor-ejemplo","deductibleAmount":"valor-ejemplo","annualLimitAmount":"valor-ejemplo","requiresPriorAuthorization":true,"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo"}]}]` |
| `products[].plans[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `products[].plans[].planCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `products[].plans[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `products[].plans[].planType` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].plans[].planType.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].plans[].planType.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans[].currency` | Sí | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].plans[].currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].plans[].currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans[].effectiveFrom` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].effectiveTo` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `products[].plans[].status` | Sí | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `products[].plans[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `products[].plans[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `products[].plans[].policyDocumentFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `products[].plans[].benefits` | Sí | `array<PlanBenefitDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","category":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"service":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"coveragePercent":"valor-ejemplo","copayAmount":"valor-ejemplo","deductibleAmount":"valor-ejemplo","annualLimitAmount":"valor-ejemplo","requiresPriorAuthorization":true,"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo"}]` |
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

## 14. POST /insurance-carriers/{id}/products

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

## 15. POST /insurance-claims

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims`
- **Nombre:** Enviar reclamo con líneas (837)
- **Operation ID:** `ClaimsController_submit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsController.submit](../../src/modules/insurance/controllers/claims.controller.ts)

### Descripción de negocio

Enviar reclamo con líneas (837). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /insurance-claims` en `ClaimsController_submit`. El controlador delega en `ClaimsService.submitClaim`. Valida el body como `CreateClaimDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceStatusDto>`.

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
| `priorAuthorizationRequestId` | No | `string` | formato `uuid` | Autorización previa vinculada | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<ClaimLineDto>` | mínimo 1 elemento(s) | 1..N líneas | `[{"lineSequence":1,"serviceConceptId":"00000000-0000-4000-8000-000000000001","quantity":"1","billedAmount":"100.00","patientResponsibilityAmount":"20.00"}]` |
| `lines[].lineSequence` | Sí | `number` | mínimo 1 | Secuencia única dentro del reclamo | `1` |
| `lines[].serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].quantity` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].billedAmount` | Sí | `string` | Sin restricción adicional declarada | Monto facturado | `100.00` |
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
  "priorAuthorizationRequestId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "lines": [
    {
      "lineSequence": 1,
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "quantity": "1",
      "billedAmount": "100.00",
      "patientResponsibilityAmount": "20.00"
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
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Aseguradora no encontrada | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 404 | `NOT_FOUND` | Cobertura no encontrada | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 409 | `CONFLICT` | Reclamo duplicado | Excepción explícita en src/modules/insurance/services/claims.service.ts |
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
  "path": "/insurance-claims"
}
```

---

## 16. POST /insurance-claims/{id}/adjudications

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
| `totalApprovedAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `totalPatientAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `20.00` |
| `totalDeniedAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `lineAdjudications` | Sí | `array<LineAdjudicationDto>` | mínimo 1 elemento(s) | Una por línea del reclamo | `[{"insuranceClaimLineId":"00000000-0000-4000-8000-000000000001","decision":"APPROVED","approvedAmount":"80.00","patientAmount":"20.00","deniedAmount":"0.00"}]` |
| `lineAdjudications[].insuranceClaimLineId` | Sí | `string` | formato `uuid` | Línea del reclamo adjudicada | `00000000-0000-4000-8000-000000000001` |
| `lineAdjudications[].decision` | Sí | `string` | valores: `APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
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
  "totalApprovedAmount": "80.00",
  "totalPatientAmount": "20.00",
  "totalDeniedAmount": "0.00",
  "lineAdjudications": [
    {
      "insuranceClaimLineId": "00000000-0000-4000-8000-000000000001",
      "decision": "APPROVED",
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
| 404 | `NOT_FOUND` | Reclamo no encontrado | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 404 | `NOT_FOUND` | Línea de reclamo no encontrada | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El reclamo no está en estado adjudicable | Excepción explícita en src/modules/insurance/services/claims.service.ts |
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

## 17. POST /insurance-claims/{id}/disputes

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-claims`
- **Nombre:** Abrir disputa sobre adjudicación
- **Operation ID:** `ClaimsController_openDispute`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClaimsController.openDispute](../../src/modules/insurance/controllers/claims.controller.ts)

### Descripción de negocio

Abrir disputa sobre adjudicación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


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
- Roles admitidos por `@Roles`: `BILLING`, `FINANCE`.
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
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reclamo no encontrado | Excepción explícita en src/modules/insurance/services/claims.service.ts |
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

## 18. POST /insurance-claims/{id}/eob

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
| 404 | `NOT_FOUND` | Reclamo no encontrado | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 409 | `CONFLICT` | La EOB ya fue publicada para esta versión | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No existe adjudicación in_force para publicar EOB | Excepción explícita en src/modules/insurance/services/claims.service.ts |
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

## 19. POST /insurance-claims/{id}/reversals

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
| 404 | `NOT_FOUND` | Reclamo no encontrado | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 404 | `NOT_FOUND` | Versión de adjudicación no encontrada | Excepción explícita en src/modules/insurance/services/claims.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El reclamo no está en estado reversible | Excepción explícita en src/modules/insurance/services/claims.service.ts |
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

## 20. POST /insurance-plans/{id}/benefits

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de beneficio de plan (soporte)
- **Operation ID:** `InsuranceBackboneController_createBenefit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createBenefit](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de beneficio de plan (soporte). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create benefit.

### Descripción del sistema

NestJS resuelve `POST /insurance-plans/{id}/benefits` en `InsuranceBackboneController_createBenefit`. El controlador delega en `InsuranceBackboneService.createBenefit`. Valida el body como `CreatePlanBenefitDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePlanBenefitDto`; los campos opcionales se omiten.

```http
POST /insurance-plans/00000000-0000-4000-8000-000000000001/benefits HTTP/1.1
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
| `effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `requiresPriorAuthorization` | No | `boolean` | Sin restricción adicional declarada | Requiere autorización previa | `true` |
| `coveragePercent` | No | `string` | Sin restricción adicional declarada | Porcentaje de cobertura | `80` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /insurance-plans/00000000-0000-4000-8000-000000000001/benefits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "effectiveFrom": "2026-07-31",
  "requiresPriorAuthorization": true,
  "coveragePercent": "80"
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
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-plans/{id}/benefits"
}
```

---

## 21. POST /insurance-products/{id}/plans

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-backbone`
- **Nombre:** Alta de plan (soporte)
- **Operation ID:** `InsuranceBackboneController_createPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsuranceBackboneController.createPlan](../../src/modules/insurance/controllers/insurance-backbone.controller.ts)

### Descripción de negocio

Alta de plan (soporte). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create plan.

### Descripción del sistema

NestJS resuelve `POST /insurance-products/{id}/plans` en `InsuranceBackboneController_createPlan`. El controlador delega en `InsuranceBackboneService.createPlan`. Valida el body como `CreatePlanDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `planCode` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `effectiveFrom` | No | `string` | formato `date` | Vigencia desde (ISO date) | `2026-07-31` |

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
| 404 | `NOT_FOUND` | Producto no encontrado | Excepción explícita en src/modules/insurance/services/insurance-backbone.service.ts |
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
  "path": "/insurance-products/{id}/plans"
}
```

---

## 22. POST /patient-coverages

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
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

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

## 23. POST /prior-authorization-requests

- **Módulo:** `insurance`
- **Etiqueta OpenAPI:** `insurance-prior-auth`
- **Nombre:** Solicitar autorización previa con items
- **Operation ID:** `PriorAuthController_submit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PriorAuthController.submit](../../src/modules/insurance/controllers/prior-auth.controller.ts)

### Descripción de negocio

Solicitar autorización previa con items. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


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
| `requestingProviderEntityId` | Sí | `string` | formato `uuid` | Entidad prestadora solicitante | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items` | Sí | `array<PriorAuthItemDto>` | mínimo 1 elemento(s) | 1..N ítems solicitados | `[{"serviceConceptId":"00000000-0000-4000-8000-000000000001","requestedQuantity":"1","requestedAmount":"250.00"}]` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Servicio solicitado | `00000000-0000-4000-8000-000000000001` |
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
  "requestingProviderEntityId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "items": [
    {
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
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
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: BILLING, FINANCE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cobertura no encontrada | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
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
  "path": "/prior-authorization-requests"
}
```

---

## 24. POST /prior-authorization-requests/{id}/determinations

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
| 404 | `NOT_FOUND` | Solicitud de autorización no encontrada | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud no admite determinación en su estado actual | Excepción explícita en src/modules/insurance/services/prior-auth.service.ts |
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

## 25. POST /provider-networks

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

## 26. POST /provider-networks/{id}/memberships

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
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

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

## 27. POST /reconciliation-batches

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
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

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

## 28. POST /reconciliation-batches/{id}/items

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

