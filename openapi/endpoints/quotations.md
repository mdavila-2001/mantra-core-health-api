<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `quotations`

Referencia exhaustiva de 3 operación(es) del módulo `quotations`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `quotations`
- **Controladores:** `QuotationsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /quotations](#1-get-quotations) — Listar las cotizaciones de un paciente
2. [POST /quotations](#2-post-quotations) — Crear una cotización
3. [GET /quotations/{id}](#3-get-quotations-id) — Buscar una cotización por id

---

## 1. GET /quotations

- **Módulo:** `quotations`
- **Etiqueta OpenAPI:** `quotations`
- **Nombre:** Listar las cotizaciones de un paciente
- **Operation ID:** `QuotationsController_listByPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QuotationsController.listByPatient](../../src/modules/quotations/controllers/quotations.controller.ts)

### Descripción de negocio

Listar las cotizaciones de un paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lista las cotizaciones de un paciente, más recientes primero, acotadas a las prácticas que el actor alcanza (vinculación activa, u organización propia para la cuenta administradora).

### Descripción del sistema

NestJS resuelve `GET /quotations` en `QuotationsController_listByPatient`. El controlador delega en `QuotationsService.listQuotationsByPatient`. No recibe body. El tipo de retorno estático es `Promise<QuotationResponseDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Paciente (profiles.patient_profiles, uuid) | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /quotations?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /quotations?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<QuotationResponseDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<QuotationResponseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<QuotationResponseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<QuotationResponseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<QuotationResponseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<QuotationResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QuotationResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "practiceId": "00000000-0000-4000-8000-000000000001",
    "patientProfileId": "00000000-0000-4000-8000-000000000001",
    "createdByPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
    "attentionDate": "valor-ejemplo",
    "appointmentId": "00000000-0000-4000-8000-000000000001",
    "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
    "serviceNameSnapshot": "Nombre de ejemplo",
    "offeredPrice": "valor-ejemplo",
    "currencyConceptId": "00000000-0000-4000-8000-000000000001",
    "paymentPlanInstallmentCount": 1,
    "downPaymentAmount": "valor-ejemplo",
    "paymentFrequency": "valor-ejemplo",
    "validUntil": "valor-ejemplo",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "installments": [
      {
        "installmentNumber": 1,
        "dueDate": "valor-ejemplo",
        "amount": "valor-ejemplo"
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
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/quotations"
}
```

---

## 2. POST /quotations

- **Módulo:** `quotations`
- **Etiqueta OpenAPI:** `quotations`
- **Nombre:** Crear una cotización
- **Operation ID:** `QuotationsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QuotationsController.create](../../src/modules/quotations/controllers/quotations.controller.ts)

### Descripción de negocio

Crear una cotización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea una cotización: congela el servicio cotizado y el plan de pagos.

### Descripción del sistema

NestJS resuelve `POST /quotations` en `QuotationsController_create`. El controlador delega en `QuotationsService.createQuotation`. Valida el body como `CreateQuotationDto` y consume `application/json`. El tipo de retorno estático es `Promise<QuotationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateQuotationDto`; los campos opcionales se omiten.

```http
POST /quotations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "attentionDate": "2026-07-31T12:00:00.000Z",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "offeredPrice": "1500.00",
  "paymentPlanInstallmentCount": 1,
  "downPaymentAmount": "190.00",
  "paymentFrequency": "WEEKLY",
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "2026-10-10",
      "amount": "233.34"
    }
  ],
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente cotizado (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `attentionDate` | Sí | `string` | formato `date-time` | Fecha de atención (ISO) | `2026-07-31T12:00:00.000Z` |
| `appointmentId` | No | `string` | formato `uuid` | Cita asociada, opcional (scheduling) | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Servicio del catálogo (billing.service_catalog) | `00000000-0000-4000-8000-000000000001` |
| `offeredPrice` | Sí | `string` | patrón runtime `PRICE_PATTERN` | Precio ofrecido al paciente (editable respecto del catálogo) | `1500.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda (concepto) | `00000000-0000-4000-8000-000000000001` |
| `paymentPlanInstallmentCount` | Sí | `number` | mínimo 0; máximo MAX_INSTALLMENTS | Cantidad de cuotas del plan de pagos | `1` |
| `downPaymentAmount` | Sí | `string` | patrón runtime `PRICE_PATTERN` | Anticipo, entre 0 y el precio ofrecido. Sin interés. | `190.00` |
| `paymentFrequency` | Sí | `string` | valores: `WEEKLY`, `BIWEEKLY`, `MONTHLY` | Frecuencia de partida del cronograma | `WEEKLY` |
| `installments` | Sí | `array<QuotationInstallmentInputDto>` | máximo MAX_INSTALLMENTS elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"installmentNumber":1,"dueDate":"2026-10-10","amount":"233.34"}]` |
| `installments[].installmentNumber` | Sí | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `installments[].dueDate` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-10-10` |
| `installments[].amount` | Sí | `string` | patrón runtime `PRICE_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `233.34` |
| `validUntil` | Sí | `string` | formato `date-time` | Fecha de validez de la oferta (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /quotations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "attentionDate": "2026-07-31T12:00:00.000Z",
  "appointmentId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "offeredPrice": "1500.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "paymentPlanInstallmentCount": 1,
  "downPaymentAmount": "190.00",
  "paymentFrequency": "WEEKLY",
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "2026-10-10",
      "amount": "233.34"
    }
  ],
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<QuotationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QuotationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "createdByPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "attentionDate": "valor-ejemplo",
  "appointmentId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "serviceNameSnapshot": "Nombre de ejemplo",
  "offeredPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "paymentPlanInstallmentCount": 1,
  "downPaymentAmount": "valor-ejemplo",
  "paymentFrequency": "valor-ejemplo",
  "validUntil": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z",
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "valor-ejemplo",
      "amount": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `createdByPractitionerProfileId` | Sí | `string` | formato `uuid` | Profesional que armó la cotización. | `00000000-0000-4000-8000-000000000001` |
| `attentionDate` | Sí | `string` | Sin restricción adicional declarada | Fecha de atención sobre la que se cotizó (ISO). | `valor-ejemplo` |
| `appointmentId` | No | `string` | formato `uuid` | Cita asociada, opcional. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Servicio del catálogo cotizado. | `00000000-0000-4000-8000-000000000001` |
| `serviceNameSnapshot` | Sí | `string` | Sin restricción adicional declarada | Nombre del servicio, congelado al momento de crear la cotización. | `Nombre de ejemplo` |
| `offeredPrice` | Sí | `string` | Sin restricción adicional declarada | Precio ofrecido al paciente. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `paymentPlanInstallmentCount` | Sí | `number` | Sin restricción adicional declarada | Cantidad de cuotas del plan de pagos. | `1` |
| `downPaymentAmount` | Sí | `string` | Sin restricción adicional declarada | Anticipo: lo que se paga el día de la atención. | `valor-ejemplo` |
| `paymentFrequency` | Sí | `string` | Sin restricción adicional declarada | Frecuencia de partida del cronograma (`WEEKLY`, `BIWEEKLY` o `MONTHLY`). | `valor-ejemplo` |
| `validUntil` | Sí | `string` | Sin restricción adicional declarada | Fecha hasta la que la oferta es válida (ISO). | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la cotización. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó la cotización. | `2026-07-31T12:00:00.000Z` |
| `installments` | Sí | `array<QuotationInstallmentDto>` | Sin restricción adicional declarada | Cuotas congeladas del plan de pagos. | `[{"installmentNumber":1,"dueDate":"valor-ejemplo","amount":"valor-ejemplo"}]` |
| `installments[].installmentNumber` | Sí | `number` | Sin restricción adicional declarada | Número de orden de la cuota dentro del plan (1-based). | `1` |
| `installments[].dueDate` | Sí | `string` | Sin restricción adicional declarada | Fecha de vencimiento de la cuota (ISO). | `valor-ejemplo` |
| `installments[].amount` | Sí | `string` | Sin restricción adicional declarada | Monto de la cuota. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Servicio no encontrado en el catálogo | Excepción explícita en src/modules/quotations/services/quotations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Se requiere un perfil profesional para crear una cotización | Excepción explícita en src/modules/quotations/services/quotations.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional no tiene una vinculación activa con esa práctica | Excepción explícita en src/modules/quotations/services/quotations.service.ts |
| 422 | `PRECONDITION_FAILED` | validUntil debe ser posterior a attentionDate | Excepción explícita en src/modules/quotations/services/quotations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/quotations"
}
```

---

## 3. GET /quotations/{id}

- **Módulo:** `quotations`
- **Etiqueta OpenAPI:** `quotations`
- **Nombre:** Buscar una cotización por id
- **Operation ID:** `QuotationsController_findById`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QuotationsController.findById](../../src/modules/quotations/controllers/quotations.controller.ts)

### Descripción de negocio

Buscar una cotización por id. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Trae una cotización con sus cuotas. Una cotización de una práctica que el actor no alcanza responde el mismo 404 que una inexistente.

### Descripción del sistema

NestJS resuelve `GET /quotations/{id}` en `QuotationsController_findById`. El controlador delega en `QuotationsService.getQuotation`. No recibe body. El tipo de retorno estático es `Promise<QuotationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /quotations/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /quotations/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<QuotationResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<QuotationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QuotationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "createdByPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "attentionDate": "valor-ejemplo",
  "appointmentId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "serviceNameSnapshot": "Nombre de ejemplo",
  "offeredPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "paymentPlanInstallmentCount": 1,
  "downPaymentAmount": "valor-ejemplo",
  "paymentFrequency": "valor-ejemplo",
  "validUntil": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z",
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "valor-ejemplo",
      "amount": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `createdByPractitionerProfileId` | Sí | `string` | formato `uuid` | Profesional que armó la cotización. | `00000000-0000-4000-8000-000000000001` |
| `attentionDate` | Sí | `string` | Sin restricción adicional declarada | Fecha de atención sobre la que se cotizó (ISO). | `valor-ejemplo` |
| `appointmentId` | No | `string` | formato `uuid` | Cita asociada, opcional. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Servicio del catálogo cotizado. | `00000000-0000-4000-8000-000000000001` |
| `serviceNameSnapshot` | Sí | `string` | Sin restricción adicional declarada | Nombre del servicio, congelado al momento de crear la cotización. | `Nombre de ejemplo` |
| `offeredPrice` | Sí | `string` | Sin restricción adicional declarada | Precio ofrecido al paciente. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `paymentPlanInstallmentCount` | Sí | `number` | Sin restricción adicional declarada | Cantidad de cuotas del plan de pagos. | `1` |
| `downPaymentAmount` | Sí | `string` | Sin restricción adicional declarada | Anticipo: lo que se paga el día de la atención. | `valor-ejemplo` |
| `paymentFrequency` | Sí | `string` | Sin restricción adicional declarada | Frecuencia de partida del cronograma (`WEEKLY`, `BIWEEKLY` o `MONTHLY`). | `valor-ejemplo` |
| `validUntil` | Sí | `string` | Sin restricción adicional declarada | Fecha hasta la que la oferta es válida (ISO). | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la cotización. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó la cotización. | `2026-07-31T12:00:00.000Z` |
| `installments` | Sí | `array<QuotationInstallmentDto>` | Sin restricción adicional declarada | Cuotas congeladas del plan de pagos. | `[{"installmentNumber":1,"dueDate":"valor-ejemplo","amount":"valor-ejemplo"}]` |
| `installments[].installmentNumber` | Sí | `number` | Sin restricción adicional declarada | Número de orden de la cuota dentro del plan (1-based). | `1` |
| `installments[].dueDate` | Sí | `string` | Sin restricción adicional declarada | Fecha de vencimiento de la cuota (ISO). | `valor-ejemplo` |
| `installments[].amount` | Sí | `string` | Sin restricción adicional declarada | Monto de la cuota. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cotización no encontrada | Excepción explícita en src/modules/quotations/services/quotations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/quotations/{id}"
}
```

---

