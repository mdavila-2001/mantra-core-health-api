<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `accounting`

Referencia exhaustiva de 27 operación(es) del módulo `accounting`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `accounting-accruals`, `accounting-assets`, `accounting-fiscal`, `accounting-fx`, `accounting-ledger`, `accounting-liabilities`, `accounting-practitioner`, `accounting-subledger`
- **Controladores:** `AccountingAccrualController`, `AccountingAssetController`, `AccountingExchangeRateController`, `AccountingFiscalController`, `AccountingLedgerController`, `AccountingLiabilityController`, `AccountingPractitionerController`, `AccountingSubledgerController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /accounting/accounts](#1-get-accounting-accounts) — Plan de cuentas de una práctica
2. [POST /accounting/accounts](#2-post-accounting-accounts) — Crear una cuenta del plan contable
3. [POST /accounting/accrual-objects](#3-post-accounting-accrual-objects) — Crear objeto de devengo y su cronograma
4. [POST /accounting/accruals/run](#4-post-accounting-accruals-run) — Postear devengo periódico (accrual run)
5. [POST /accounting/assets/capitalize](#5-post-accounting-assets-capitalize) — Capitalizar activo (alta y asignación)
6. [POST /accounting/clearing-documents](#6-post-accounting-clearing-documents) — Compensar/clearing de partidas abiertas
7. [POST /accounting/depreciation/run](#7-post-accounting-depreciation-run) — Ejecutar depreciación de activos (batch)
8. [POST /accounting/exchange-rates](#8-post-accounting-exchange-rates) — Registrar tipo de cambio para conversión
9. [POST /accounting/fiscal-periods/{id}/lock](#9-post-accounting-fiscal-periods-id-lock) — Cerrar/bloquear un periodo fiscal
10. [POST /accounting/fiscal-years](#10-post-accounting-fiscal-years) — Abrir un ejercicio fiscal y sus periodos
11. [GET /accounting/journal-transactions](#11-get-accounting-journal-transactions) — Libro diario de una práctica
12. [POST /accounting/journal-transactions](#12-post-accounting-journal-transactions) — Registrar y postear un asiento balanceado (partida doble)
13. [GET /accounting/journal-transactions/{id}](#13-get-accounting-journal-transactions-id) — Un asiento con sus líneas
14. [POST /accounting/journal-transactions/{id}/approve](#14-post-accounting-journal-transactions-id-approve) — Aprobar el asiento (rol de aprobación)
15. [POST /accounting/journal-transactions/{id}/classify](#15-post-accounting-journal-transactions-id-classify) — Clasificar automáticamente el asiento
16. [POST /accounting/journal-transactions/{id}/files](#16-post-accounting-journal-transactions-id-files) — Adjuntar un documento soporte al asiento
17. [POST /accounting/journal-transactions/{id}/post](#17-post-accounting-journal-transactions-id-post) — Postear el asiento aprobado (efecto en el mayor)
18. [POST /accounting/journal-transactions/{id}/reverse](#18-post-accounting-journal-transactions-id-reverse) — Reversar un asiento posteado (líneas espejo)
19. [POST /accounting/journal-transactions/{id}/submit-review](#19-post-accounting-journal-transactions-id-submit-review) — Enviar el asiento a revisión
20. [POST /accounting/journal-transactions/drafts](#20-post-accounting-journal-transactions-drafts) — Crear un asiento en borrador (DRAFT, sin postear)
21. [POST /accounting/liabilities/{id}/payments](#21-post-accounting-liabilities-id-payments) — Liquidar cuota de pasivo (principal + interés)
22. [POST /accounting/open-items](#22-post-accounting-open-items) — Generar partida abierta en subledger
23. [POST /accounting/postings/determine-accounts](#23-post-accounting-postings-determine-accounts) — Determinar la cuenta objetivo por reglas vigentes
24. [POST /accounting/practitioner/consultation-income](#24-post-accounting-practitioner-consultation-income) — Registrar ingreso por consulta pagada
25. [POST /accounting/practitioner/entries](#25-post-accounting-practitioner-entries) — Registrar un gasto u otro ingreso
26. [GET /accounting/practitioner/paid-consultations](#26-get-accounting-practitioner-paid-consultations) — Consultas pagadas sin registrar contablemente
27. [GET /accounting/trial-balance](#27-get-accounting-trial-balance) — Balance de sumas y saldos

---

## 1. GET /accounting/accounts

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Plan de cuentas de una práctica
- **Operation ID:** `AccountingLedgerController_chartOfAccounts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.chartOfAccounts](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Plan de cuentas de una práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-16-01·L: el plan de cuentas de una práctica.

### Descripción del sistema

NestJS resuelve `GET /accounting/accounts` en `AccountingLedgerController_chartOfAccounts`. El controlador delega en `LedgerReadService.chartOfAccounts`. No recibe body. El tipo de retorno estático es `Promise<ChartOfAccountsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /accounting/accounts?practiceId=00000000-0000-4000-8000-000000000001&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `ACCOUNTING_APPROVER`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /accounting/accounts?practiceId=00000000-0000-4000-8000-000000000001&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ChartOfAccountsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ChartOfAccountsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ChartOfAccountsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ChartOfAccountsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ChartOfAccountsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ChartOfAccountsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChartOfAccountsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "1.1.01",
      "name": "Banco",
      "accountTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "normalBalanceConceptId": "00000000-0000-4000-8000-000000000001",
      "parentAccountId": "00000000-0000-4000-8000-000000000001",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1,
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<AccountItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"1.1.01","name":"Banco","accountTypeConceptId":"00000000-0000-4000-8000-000000000001","normalBalanceConceptId":"00000000-0000-4000-8000-000000000001","parentAccountId":"00000000-0000-4000-8000-000000000001","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1.1.01` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Banco` |
| `items[].accountTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].normalBalanceConceptId` | Sí | `string` | formato `uuid` | Deudora o acreedora: es lo que da signo al saldo. | `00000000-0000-4000-8000-000000000001` |
| `items[].parentAccountId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].currencyConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | La práctica consultada pertenece a otra organización | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/accounts"
}
```

---

## 2. POST /accounting/accounts

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Crear una cuenta del plan contable
- **Operation ID:** `AccountingLedgerController_createAccount`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.createAccount](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Crear una cuenta del plan contable. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Soporte: alta de cuenta del plan contable.

### Descripción del sistema

NestJS resuelve `POST /accounting/accounts` en `AccountingLedgerController_createAccount`. El controlador delega en `LedgerService.createAccount`. Valida el body como `AccountingCreateAccountDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccountResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AccountingCreateAccountDto`; los campos opcionales se omiten.

```http
POST /accounting/accounts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "accountType": "ASSET",
  "normalBalance": "DEBIT"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica propietaria | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 40 | Código contable | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre de la cuenta | `Nombre de ejemplo` |
| `accountType` | Sí | `string` | valores: `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE` | Sin descripción específica en el contrato OpenAPI. | `ASSET` |
| `normalBalance` | Sí | `string` | valores: `DEBIT`, `CREDIT` | Sin descripción específica en el contrato OpenAPI. | `DEBIT` |
| `isPostable` | No | `boolean` | Sin restricción adicional declarada | ¿La cuenta admite posteos directos? | `true` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/accounts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "accountType": "ASSET",
  "normalBalance": "DEBIT",
  "isPostable": true,
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccountResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccountResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "primaryContactId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `primaryContactId` | No | `string` | formato `uuid` | Contacto creado junto con la cuenta | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/accounting/accounts"
}
```

---

## 3. POST /accounting/accrual-objects

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-accruals`
- **Nombre:** Crear objeto de devengo y su cronograma
- **Operation ID:** `AccountingAccrualController_createAccrualObject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingAccrualController.createAccrualObject](../../src/modules/accounting/controllers/accounting-accrual.controller.ts)

### Descripción de negocio

Crear objeto de devengo y su cronograma. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/accrual-objects` en `AccountingAccrualController_createAccrualObject`. El controlador delega en `AccrualService.createAccrualObject`. Valida el body como `CreateAccrualObjectDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccrualObjectResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAccrualObjectDto`; los campos opcionales se omiten.

```http
POST /accounting/accrual-objects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "objectNumber": "valor-ejemplo",
  "expenseAccountId": "00000000-0000-4000-8000-000000000001",
  "accrualAccountId": "00000000-0000-4000-8000-000000000001",
  "totalAmount": "300.00",
  "schedule": [
    {
      "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
      "plannedAmount": "100.00"
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
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `objectNumber` | Sí | `string` | longitud máxima 60 | Número de objeto (único por tenant) | `valor-ejemplo` |
| `expenseAccountId` | Sí | `string` | formato `uuid` | Cuenta de gasto postable | `00000000-0000-4000-8000-000000000001` |
| `accrualAccountId` | Sí | `string` | formato `uuid` | Cuenta de devengo postable | `00000000-0000-4000-8000-000000000001` |
| `costCenterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `profitCenterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `endDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Importe total (= suma de planned) | `300.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schedule` | Sí | `array<AccrualScheduleInputDto>` | mínimo 1 elemento(s) | Cronograma (>=1 línea) | `[{"fiscalPeriodId":"00000000-0000-4000-8000-000000000001","plannedAmount":"100.00"}]` |
| `schedule[].fiscalPeriodId` | Sí | `string` | formato `uuid` | Periodo fiscal de la línea | `00000000-0000-4000-8000-000000000001` |
| `schedule[].plannedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe planificado del periodo | `100.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/accrual-objects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "objectNumber": "valor-ejemplo",
  "expenseAccountId": "00000000-0000-4000-8000-000000000001",
  "accrualAccountId": "00000000-0000-4000-8000-000000000001",
  "costCenterId": "00000000-0000-4000-8000-000000000001",
  "profitCenterId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "totalAmount": "300.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "schedule": [
    {
      "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
      "plannedAmount": "100.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccrualObjectResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccrualObjectResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccrualObjectResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccrualObjectResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccrualObjectResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccrualObjectResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccrualObjectResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccrualObjectResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccrualObjectResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccrualObjectResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "objectNumber": "valor-ejemplo",
  "status": "ok",
  "scheduleLineIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `objectNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de object number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `scheduleLineIds` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de schedule line ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El número de objeto ya existe en el tenant | Excepción explícita en src/modules/accounting/services/accrual.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La suma del cronograma no iguala el total | Excepción explícita en src/modules/accounting/services/accrual.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/accrual-objects"
}
```

---

## 4. POST /accounting/accruals/run

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-accruals`
- **Nombre:** Postear devengo periódico (accrual run)
- **Operation ID:** `AccountingAccrualController_runAccruals`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingAccrualController.runAccruals](../../src/modules/accounting/controllers/accounting-accrual.controller.ts)

### Descripción de negocio

Postear devengo periódico (accrual run). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/accruals/run` en `AccountingAccrualController_runAccruals`. El controlador delega en `AccrualService.runAccruals`. Valida el body como `RunAccrualsDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccrualRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunAccrualsDto`; los campos opcionales se omiten.

```http
POST /accounting/accruals/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "accrualObjectId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-01-31"
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
| `accrualObjectId` | Sí | `string` | formato `uuid` | Objeto de devengo a correr | `00000000-0000-4000-8000-000000000001` |
| `fiscalPeriodId` | Sí | `string` | formato `uuid` | Periodo fiscal ABIERTO a devengar | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Práctica del asiento generado | `00000000-0000-4000-8000-000000000001` |
| `postingDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-01-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/accruals/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "accrualObjectId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-01-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccrualRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccrualRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccrualRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccrualRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccrualRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccrualRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccrualRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccrualRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccrualRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccrualRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "postedLines": 1,
  "transactionIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `postedLines` | Sí | `number` | Sin restricción adicional declarada | Valor de posted lines mantenido por la instancia. | `1` |
| `transactionIds` | Sí | `array<string>` | Sin restricción adicional declarada | Transacciones de devengo generadas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto de devengo no encontrado | Excepción explícita en src/modules/accounting/services/accrual.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objeto de devengo no define cuentas | Excepción explícita en src/modules/accounting/services/accrual.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay líneas de devengo pendientes en el periodo | Excepción explícita en src/modules/accounting/services/accrual.service.ts |
| 422 | `PRECONDITION_FAILED` | El asiento generado no balancea (debe != haber) | Excepción explícita en src/modules/accounting/services/posting.helper.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/accruals/run"
}
```

---

## 5. POST /accounting/assets/capitalize

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-assets`
- **Nombre:** Capitalizar activo (alta y asignación)
- **Operation ID:** `AccountingAssetController_capitalize`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingAssetController.capitalize](../../src/modules/accounting/controllers/accounting-asset.controller.ts)

### Descripción de negocio

Capitalizar activo (alta y asignación). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/assets/capitalize` en `AccountingAssetController_capitalize`. El controlador delega en `AssetService.capitalize`. Valida el body como `CapitalizeAssetDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssetResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CapitalizeAssetDto`; los campos opcionales se omiten.

```http
POST /accounting/assets/capitalize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "acquisitionAccountId": "00000000-0000-4000-8000-000000000001",
  "offsetAccountId": "00000000-0000-4000-8000-000000000001",
  "acquisitionCost": "10000.00",
  "acquisitionDate": "2026-01-15"
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
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 40 | Código del activo | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre del activo | `Nombre de ejemplo` |
| `acquisitionAccountId` | Sí | `string` | formato `uuid` | Cuenta de adquisición (débito del alta) | `00000000-0000-4000-8000-000000000001` |
| `offsetAccountId` | Sí | `string` | formato `uuid` | Cuenta banco/proveedor (crédito del alta) | `00000000-0000-4000-8000-000000000001` |
| `acquisitionCost` | Sí | `string` | Sin restricción adicional declarada | Costo de adquisición | `10000.00` |
| `acquisitionDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-01-15` |
| `usefulLifeMonths` | No | `number` | mayor que 0 | Vida útil en meses | `60` |
| `salvageValue` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `depreciationAreaId` | No | `string` | formato `uuid` | Área de valoración | `00000000-0000-4000-8000-000000000001` |
| `costCenterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `responsibleEmployeeId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fiscalPeriodId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/assets/capitalize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "acquisitionAccountId": "00000000-0000-4000-8000-000000000001",
  "offsetAccountId": "00000000-0000-4000-8000-000000000001",
  "acquisitionCost": "10000.00",
  "acquisitionDate": "2026-01-15",
  "usefulLifeMonths": 60,
  "salvageValue": "0.00",
  "depreciationAreaId": "00000000-0000-4000-8000-000000000001",
  "costCenterId": "00000000-0000-4000-8000-000000000001",
  "responsibleEmployeeId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AssetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "ok",
  "bookValue": "valor-ejemplo",
  "transactionId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `bookValue` | Sí | `string` | Sin restricción adicional declarada | Valor de book value mantenido por la instancia. | `valor-ejemplo` |
| `transactionId` | Sí | `string` | formato `uuid` | Identificador asociado a transaction. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un activo con ese código en la práctica | Excepción explícita en src/modules/accounting/services/asset.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El asiento generado no balancea (debe != haber) | Excepción explícita en src/modules/accounting/services/posting.helper.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/assets/capitalize"
}
```

---

## 6. POST /accounting/clearing-documents

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-subledger`
- **Nombre:** Compensar/clearing de partidas abiertas
- **Operation ID:** `AccountingSubledgerController_clearOpenItems`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingSubledgerController.clearOpenItems](../../src/modules/accounting/controllers/accounting-subledger.controller.ts)

### Descripción de negocio

Compensar/clearing de partidas abiertas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/clearing-documents` en `AccountingSubledgerController_clearOpenItems`. El controlador delega en `SubledgerService.clearOpenItems`. Valida el body como `CreateClearingDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClearingResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateClearingDto`; los campos opcionales se omiten.

```http
POST /accounting/clearing-documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "bankAccountId": "00000000-0000-4000-8000-000000000001",
  "clearingDate": "2026-02-01",
  "items": [
    {
      "openItemId": "00000000-0000-4000-8000-000000000001",
      "clearedAmount": "100.00"
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
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clearingNumber` | No | `string` | longitud máxima 60 | Número de clearing (único por tenant); autogenerado si se omite | `valor-ejemplo` |
| `practiceId` | Sí | `string` | formato `uuid` | Práctica del asiento de compensación | `00000000-0000-4000-8000-000000000001` |
| `bankAccountId` | Sí | `string` | formato `uuid` | Cuenta banco/tesorería del contra-asiento | `00000000-0000-4000-8000-000000000001` |
| `companyBankAccountId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clearingDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-02-01` |
| `items` | Sí | `array<ClearingItemInputDto>` | mínimo 1 elemento(s) | Partidas a compensar (>=1) | `[{"openItemId":"00000000-0000-4000-8000-000000000001","clearedAmount":"100.00","discountAmount":"0.00","exchangeDifferenceAmount":"0.00"}]` |
| `items[].openItemId` | Sí | `string` | formato `uuid` | Partida abierta ABIERTA | `00000000-0000-4000-8000-000000000001` |
| `items[].clearedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe compensado | `100.00` |
| `items[].discountAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `items[].exchangeDifferenceAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/clearing-documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "clearingNumber": "valor-ejemplo",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "bankAccountId": "00000000-0000-4000-8000-000000000001",
  "companyBankAccountId": "00000000-0000-4000-8000-000000000001",
  "clearingDate": "2026-02-01",
  "items": [
    {
      "openItemId": "00000000-0000-4000-8000-000000000001",
      "clearedAmount": "100.00",
      "discountAmount": "0.00",
      "exchangeDifferenceAmount": "0.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ClearingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ClearingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClearingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClearingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClearingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClearingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClearingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClearingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClearingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClearingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "clearingNumber": "valor-ejemplo",
  "transactionId": "00000000-0000-4000-8000-000000000001",
  "clearedItems": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `clearingNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de clearing number mantenido por la instancia. | `valor-ejemplo` |
| `transactionId` | Sí | `string` | formato `uuid` | Identificador asociado a transaction. | `00000000-0000-4000-8000-000000000001` |
| `clearedItems` | Sí | `number` | Sin restricción adicional declarada | Valor de cleared items mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Partida abierta no encontrada | Excepción explícita en src/modules/accounting/services/subledger.service.ts |
| 404 | `NOT_FOUND` | Subledger no encontrado | Excepción explícita en src/modules/accounting/services/subledger.service.ts |
| 409 | `CONFLICT` | La partida ya está compensada | Excepción explícita en src/modules/accounting/services/subledger.service.ts |
| 409 | `CONFLICT` | El número de clearing ya existe en el tenant | Excepción explícita en src/modules/accounting/services/subledger.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Importe compensado inválido | Excepción explícita en src/modules/accounting/services/subledger.service.ts |
| 422 | `PRECONDITION_FAILED` | Las partidas no comparten subledger | Excepción explícita en src/modules/accounting/services/subledger.service.ts |
| 422 | `PRECONDITION_FAILED` | El asiento generado no balancea (debe != haber) | Excepción explícita en src/modules/accounting/services/posting.helper.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/clearing-documents"
}
```

---

## 7. POST /accounting/depreciation/run

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-assets`
- **Nombre:** Ejecutar depreciación de activos (batch)
- **Operation ID:** `AccountingAssetController_runDepreciation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingAssetController.runDepreciation](../../src/modules/accounting/controllers/accounting-asset.controller.ts)

### Descripción de negocio

Ejecutar depreciación de activos (batch). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/depreciation/run` en `AccountingAssetController_runDepreciation`. El controlador delega en `AssetService.runDepreciation`. Valida el body como `RunDepreciationDto` y consume `application/json`. El tipo de retorno estático es `Promise<DepreciationRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunDepreciationDto`; los campos opcionales se omiten.

```http
POST /accounting/depreciation/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "depreciationExpenseAccountId": "00000000-0000-4000-8000-000000000001",
  "accumulatedDepreciationAccountId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-01-31"
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
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fiscalPeriodId` | Sí | `string` | formato `uuid` | Periodo fiscal ABIERTO | `00000000-0000-4000-8000-000000000001` |
| `depreciationExpenseAccountId` | Sí | `string` | formato `uuid` | Cuenta de gasto por depreciación (débito) | `00000000-0000-4000-8000-000000000001` |
| `accumulatedDepreciationAccountId` | Sí | `string` | formato `uuid` | Cuenta de depreciación acumulada (crédito) | `00000000-0000-4000-8000-000000000001` |
| `postingDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-01-31` |
| `assetId` | No | `string` | formato `uuid` | Limitar a un activo concreto | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/depreciation/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "depreciationExpenseAccountId": "00000000-0000-4000-8000-000000000001",
  "accumulatedDepreciationAccountId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-01-31",
  "assetId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DepreciationRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DepreciationRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DepreciationRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DepreciationRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DepreciationRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DepreciationRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DepreciationRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DepreciationRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DepreciationRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DepreciationRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "depreciatedAssets": 1,
  "transactionIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `depreciatedAssets` | Sí | `number` | Sin restricción adicional declarada | Valor de depreciated assets mantenido por la instancia. | `1` |
| `transactionIds` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de transaction ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No hay activos elegibles para depreciar en el periodo | Excepción explícita en src/modules/accounting/services/asset.service.ts |
| 422 | `PRECONDITION_FAILED` | El asiento generado no balancea (debe != haber) | Excepción explícita en src/modules/accounting/services/posting.helper.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/depreciation/run"
}
```

---

## 8. POST /accounting/exchange-rates

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-fx`
- **Nombre:** Registrar tipo de cambio para conversión
- **Operation ID:** `AccountingExchangeRateController_register`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingExchangeRateController.register](../../src/modules/accounting/controllers/accounting-exchange-rate.controller.ts)

### Descripción de negocio

Registrar tipo de cambio para conversión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/exchange-rates` en `AccountingExchangeRateController_register`. El controlador delega en `ExchangeRateService.registerRate`. Valida el body como `RegisterExchangeRateDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExchangeRateResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterExchangeRateDto`; los campos opcionales se omiten.

```http
POST /accounting/exchange-rates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
  "toCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
  "rate": "3.75",
  "validOn": "2026-01-31"
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
| `fromCurrencyConceptId` | Sí | `string` | formato `uuid` | Moneda origen | `00000000-0000-4000-8000-000000000001` |
| `toCurrencyConceptId` | Sí | `string` | formato `uuid` | Moneda destino | `00000000-0000-4000-8000-000000000001` |
| `rate` | Sí | `string` | Sin restricción adicional declarada | Tasa de conversión | `3.75` |
| `validOn` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-01-31` |
| `source` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/exchange-rates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
  "toCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
  "rate": "3.75",
  "validOn": "2026-01-31",
  "source": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExchangeRateResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExchangeRateResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExchangeRateResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExchangeRateResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExchangeRateResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExchangeRateResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExchangeRateResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExchangeRateResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExchangeRateResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExchangeRateResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "rate": "valor-ejemplo",
  "validOn": "2026-07-31T12:00:00.000Z",
  "created": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `rate` | Sí | `string` | Sin restricción adicional declarada | Valor de rate mantenido por la instancia. | `valor-ejemplo` |
| `validOn` | Sí | `string` | formato `date-time` | Valor de valid on mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | ¿Se creó (true) o actualizó (false)? | `true` |

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
  "path": "/accounting/exchange-rates"
}
```

---

## 9. POST /accounting/fiscal-periods/{id}/lock

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-fiscal`
- **Nombre:** Cerrar/bloquear un periodo fiscal
- **Operation ID:** `AccountingFiscalController_lockPeriod`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingFiscalController.lockPeriod](../../src/modules/accounting/controllers/accounting-fiscal.controller.ts)

### Descripción de negocio

Cerrar/bloquear un periodo fiscal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/fiscal-periods/{id}/lock` en `AccountingFiscalController_lockPeriod`. El controlador delega en `FiscalService.lockPeriod`. Valida el body como `LockPeriodDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccountingStatusDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LockPeriodDto`; los campos opcionales se omiten.

```http
POST /accounting/fiscal-periods/00000000-0000-4000-8000-000000000001/lock HTTP/1.1
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
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/fiscal-periods/00000000-0000-4000-8000-000000000001/lock HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccountingStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Valor de ok mantenido por la instancia. | `true` |
| `id` | No | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Periodo fiscal no encontrado | Excepción explícita en src/modules/accounting/services/fiscal.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El periodo no está ABIERTO | Excepción explícita en src/modules/accounting/services/fiscal.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/fiscal-periods/{id}/lock"
}
```

---

## 10. POST /accounting/fiscal-years

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-fiscal`
- **Nombre:** Abrir un ejercicio fiscal y sus periodos
- **Operation ID:** `AccountingFiscalController_openFiscalYear`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingFiscalController.openFiscalYear](../../src/modules/accounting/controllers/accounting-fiscal.controller.ts)

### Descripción de negocio

Abrir un ejercicio fiscal y sus periodos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/fiscal-years` en `AccountingFiscalController_openFiscalYear`. El controlador delega en `FiscalService.openFiscalYear`. Valida el body como `CreateFiscalYearDto` y consume `application/json`. El tipo de retorno estático es `Promise<FiscalYearResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFiscalYearDto`; los campos opcionales se omiten.

```http
POST /accounting/fiscal-years HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "periods": [
    {
      "code": "CODIGO_EJEMPLO",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31"
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
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 40 | Código del ejercicio (único por práctica) | `CODIGO_EJEMPLO` |
| `startDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `endDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `periods` | Sí | `array<FiscalPeriodInputDto>` | mínimo 1 elemento(s) | Periodos hijos (>=1) | `[{"code":"CODIGO_EJEMPLO","startDate":"2026-07-31","endDate":"2026-07-31"}]` |
| `periods[].code` | Sí | `string` | longitud máxima 40 | Código del periodo (p. ej. 2026-01) | `CODIGO_EJEMPLO` |
| `periods[].startDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `periods[].endDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/fiscal-years HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "periods": [
    {
      "code": "CODIGO_EJEMPLO",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FiscalYearResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FiscalYearResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FiscalYearResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FiscalYearResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FiscalYearResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FiscalYearResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FiscalYearResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FiscalYearResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FiscalYearResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FiscalYearResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "ok",
  "periodIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `periodIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de periodos creados | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El ejercicio ya existe en la práctica | Excepción explícita en src/modules/accounting/services/fiscal.service.ts |
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
  "path": "/accounting/fiscal-years"
}
```

---

## 11. GET /accounting/journal-transactions

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Libro diario de una práctica
- **Operation ID:** `AccountingLedgerController_listJournal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.listJournal](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Libro diario de una práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-16-01·L: el libro diario.

### Descripción del sistema

NestJS resuelve `GET /accounting/journal-transactions` en `AccountingLedgerController_listJournal`. El controlador delega en `LedgerReadService.listJournal`. No recibe body. El tipo de retorno estático es `Promise<ListJournalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | formato `uuid` | Práctica dueña del libro | `00000000-0000-4000-8000-000000000001` |
| `fiscalPeriodId` | query | No | `string` | formato `uuid` | Acotar a un período | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | query | No | `string` | formato `uuid` | Acotar a un estado (borrador, posteado, reversado…) | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | formato `date` | Sin descripción específica en OpenAPI. | `2026-07-31` |
| `to` | query | No | `string` | formato `date` | Sin descripción específica en OpenAPI. | `2026-07-31` |
| `limit` | query | No | `number` | máximo 500 | Sin descripción específica en OpenAPI. | `100` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /accounting/journal-transactions?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `ACCOUNTING_APPROVER`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /accounting/journal-transactions?practiceId=00000000-0000-4000-8000-000000000001&fiscalPeriodId=00000000-0000-4000-8000-000000000001&statusConceptId=00000000-0000-4000-8000-000000000001&from=2026-07-31&to=2026-07-31&limit=100 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListJournalResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListJournalResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListJournalResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListJournalResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListJournalResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListJournalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListJournalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "transactionNumber": "valor-ejemplo",
      "transactionDate": "2026-07-31",
      "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "transactionTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "totalAmount": "valor-ejemplo",
      "postedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<JournalTransactionItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","transactionNumber":"valor-ejemplo","transactionDate":"2026-07-31","fiscalPeriodId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","transactionTypeConceptId":"00000000-0000-4000-8000-000000000001","currencyConceptId":"00000000-0000-4000-8000-000000000001","totalAmount":"valor-ejemplo","postedAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].transactionNumber` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].transactionDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `items[].fiscalPeriodId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].transactionTypeConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].currencyConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].totalAmount` | No | `string` | admite null | Importe total, decimal como texto | `valor-ejemplo` |
| `items[].postedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | La práctica consultada pertenece a otra organización | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/journal-transactions"
}
```

---

## 12. POST /accounting/journal-transactions

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Registrar y postear un asiento balanceado (partida doble)
- **Operation ID:** `AccountingLedgerController_postJournal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.postJournal](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Registrar y postear un asiento balanceado (partida doble). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/journal-transactions` en `AccountingLedgerController_postJournal`. El controlador delega en `LedgerService.postJournal`. Valida el body como `PostJournalDto` y consume `application/json`. El tipo de retorno estático es `Promise<JournalTransactionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PostJournalDto`; los campos opcionales se omiten.

```http
POST /accounting/journal-transactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "transactionDate": "2026-01-31",
  "lines": [
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "direction": "DEBIT",
      "amount": "100.00"
    },
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "direction": "DEBIT",
      "amount": "100.00"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica propietaria del asiento | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | No | `string` | longitud máxima 60 | Número de asiento (único por práctica); autogenerado si se omite | `valor-ejemplo` |
| `transactionDate` | Sí | `string` | formato `date` | Fecha contable | `2026-01-31` |
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal ABIERTO | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `reference` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceDocumentType` | No | `string` | longitud máxima 40 | Tipo del documento origen (p. ej. INVOICE, APPOINTMENT, EXPENSE) | `valor-ejemplo` |
| `sourceDocumentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines` | Sí | `array<LedgerLineDto>` | mínimo 2 elemento(s) | Líneas balanceadas (>=2) | `[{"accountId":"00000000-0000-4000-8000-000000000001","direction":"DEBIT","amount":"100.00","costCenterId":"00000000-0000-4000-8000-000000000001","profitCenterId":"00000000-0000-4000-8000-000000000001","currencyConceptId":"00000000-0000-4000-8000-000000000001","fxRate":"3.75","amountBase":"375.00","memo":"valor-ejemplo"},{"accountId":"00000000-0000-4000-8000-000000000001","direction":"DEBIT","amount":"100.00","costCenterId":"00000000-0000-4000-8000-000000000001","profitCenterId":"00000000-0000-4000-8000-000000000001","currencyConceptId":"00000000-0000-4000-8000-000000000001","fxRate":"3.75","amountBase":"375.00","memo":"valor-ejemplo"}]` |
| `lines[].accountId` | Sí | `string` | formato `uuid` | Cuenta contable postable | `00000000-0000-4000-8000-000000000001` |
| `lines[].direction` | Sí | `string` | valores: `DEBIT`, `CREDIT` | Dirección de la partida | `DEBIT` |
| `lines[].amount` | Sí | `string` | patrón runtime `POSITIVE_AMOUNT_REGEX` | Importe positivo de la línea | `100.00` |
| `lines[].costCenterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].profitCenterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].fxRate` | No | `string` | Sin restricción adicional declarada | Tipo de cambio a moneda base | `3.75` |
| `lines[].amountBase` | No | `string` | Sin restricción adicional declarada | Importe convertido a moneda base | `375.00` |
| `lines[].memo` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/journal-transactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "transactionDate": "2026-01-31",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "reference": "valor-ejemplo",
  "sourceDocumentType": "valor-ejemplo",
  "sourceDocumentId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "direction": "DEBIT",
      "amount": "100.00",
      "costCenterId": "00000000-0000-4000-8000-000000000001",
      "profitCenterId": "00000000-0000-4000-8000-000000000001",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "fxRate": "3.75",
      "amountBase": "375.00",
      "memo": "valor-ejemplo"
    },
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "direction": "DEBIT",
      "amount": "100.00",
      "costCenterId": "00000000-0000-4000-8000-000000000001",
      "profitCenterId": "00000000-0000-4000-8000-000000000001",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "fxRate": "3.75",
      "amountBase": "375.00",
      "memo": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JournalTransactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "lineCount": 1,
  "postedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de transaction number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de total amount mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |
| `postedAt` | Sí | `string` | formato `date-time`; admite null | Valor de posted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/accounting/journal-transactions"
}
```

---

## 13. GET /accounting/journal-transactions/{id}

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Un asiento con sus líneas
- **Operation ID:** `AccountingLedgerController_getJournalTransaction`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.getJournalTransaction](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Un asiento con sus líneas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-16-01·D: el asiento con sus líneas, que es lo que se audita.

### Descripción del sistema

NestJS resuelve `GET /accounting/journal-transactions/{id}` en `AccountingLedgerController_getJournalTransaction`. El controlador delega en `LedgerReadService.getJournalTransaction`. No recibe body. El tipo de retorno estático es `Promise<JournalTransactionDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /accounting/journal-transactions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `ACCOUNTING_APPROVER`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /accounting/journal-transactions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JournalTransactionDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<JournalTransactionDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<JournalTransactionDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<JournalTransactionDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<JournalTransactionDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<JournalTransactionDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<JournalTransactionDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JournalTransactionDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "transactionDate": "2026-07-31",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "totalAmount": "valor-ejemplo",
  "postedAt": "2026-07-31T12:00:00.000Z",
  "lines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "lineNo": 1,
      "accountId": "00000000-0000-4000-8000-000000000001",
      "directionConceptId": "00000000-0000-4000-8000-000000000001",
      "amountBase": "valor-ejemplo",
      "costCenterId": "00000000-0000-4000-8000-000000000001",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `transactionDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `fiscalPeriodId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `postedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `lines` | Sí | `array<LedgerEntryItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","lineNo":1,"accountId":"00000000-0000-4000-8000-000000000001","directionConceptId":"00000000-0000-4000-8000-000000000001","amountBase":"valor-ejemplo","costCenterId":"00000000-0000-4000-8000-000000000001","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `lines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].lineNo` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].accountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].directionConceptId` | Sí | `string` | formato `uuid` | Debe o haber. | `00000000-0000-4000-8000-000000000001` |
| `lines[].amountBase` | Sí | `string` | Sin restricción adicional declarada | Importe en moneda base, decimal como texto | `valor-ejemplo` |
| `lines[].costCenterId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].currencyConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | La práctica consultada pertenece a otra organización | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 404 | `NOT_FOUND` | Asiento no encontrado | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/journal-transactions/{id}"
}
```

---

## 14. POST /accounting/journal-transactions/{id}/approve

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Aprobar el asiento (rol de aprobación)
- **Operation ID:** `AccountingLedgerController_approve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.approve](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Aprobar el asiento (rol de aprobación). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: REDESA C-17 — PENDING_REVIEW → APPROVED (exige rol de aprobación).

### Descripción del sistema

NestJS resuelve `POST /accounting/journal-transactions/{id}/approve` en `AccountingLedgerController_approve`. El controlador delega en `LedgerService.approve`. Valida el body como `JournalTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<JournalTransactionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `JournalTransitionDto`; los campos opcionales se omiten.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `ACCOUNTING_APPROVER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó) | `00000000-0000-4000-8000-000000000001` |
| `note` | No | `string` | longitud máxima 500 | Nota de auditoría de la transición | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JournalTransactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "lineCount": 1,
  "postedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de transaction number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de total amount mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |
| `postedAt` | Sí | `string` | formato `date-time`; admite null | Valor de posted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, ACCOUNTING_APPROVER. | Roles/tenant/guards de autorización |
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
  "path": "/accounting/journal-transactions/{id}/approve"
}
```

---

## 15. POST /accounting/journal-transactions/{id}/classify

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Clasificar automáticamente el asiento
- **Operation ID:** `AccountingLedgerController_classify`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.classify](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Clasificar automáticamente el asiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: REDESA C-17 — DRAFT → AUTO_CLASSIFIED.

### Descripción del sistema

NestJS resuelve `POST /accounting/journal-transactions/{id}/classify` en `AccountingLedgerController_classify`. El controlador delega en `LedgerService.classify`. Valida el body como `JournalTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<JournalTransactionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `JournalTransitionDto`; los campos opcionales se omiten.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/classify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó) | `00000000-0000-4000-8000-000000000001` |
| `note` | No | `string` | longitud máxima 500 | Nota de auditoría de la transición | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/classify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JournalTransactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "lineCount": 1,
  "postedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de transaction number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de total amount mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |
| `postedAt` | Sí | `string` | formato `date-time`; admite null | Valor de posted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
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
  "path": "/accounting/journal-transactions/{id}/classify"
}
```

---

## 16. POST /accounting/journal-transactions/{id}/files

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Adjuntar un documento soporte al asiento
- **Operation ID:** `AccountingLedgerController_attachFile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.attachFile](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Adjuntar un documento soporte al asiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/journal-transactions/{id}/files` en `AccountingLedgerController_attachFile`. El controlador delega en `LedgerService.attachFile`. Valida el body como `AttachFileDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccountingStatusDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AttachFileDto`; los campos opcionales se omiten.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/files HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fileId` | Sí | `string` | formato `uuid` | Archivo ya cargado en object storage | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/files HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccountingStatusDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccountingStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccountingStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Valor de ok mantenido por la instancia. | `true` |
| `id` | No | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
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
  "path": "/accounting/journal-transactions/{id}/files"
}
```

---

## 17. POST /accounting/journal-transactions/{id}/post

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Postear el asiento aprobado (efecto en el mayor)
- **Operation ID:** `AccountingLedgerController_post`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.post](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Postear el asiento aprobado (efecto en el mayor). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: REDESA C-17 — APPROVED → POSTED (posteo efectivo en el mayor).

### Descripción del sistema

NestJS resuelve `POST /accounting/journal-transactions/{id}/post` en `AccountingLedgerController_post`. El controlador delega en `LedgerService.post`. Valida el body como `JournalTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<JournalTransactionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `JournalTransitionDto`; los campos opcionales se omiten.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/post HTTP/1.1
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
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó) | `00000000-0000-4000-8000-000000000001` |
| `note` | No | `string` | longitud máxima 500 | Nota de auditoría de la transición | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/post HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JournalTransactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "lineCount": 1,
  "postedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de transaction number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de total amount mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |
| `postedAt` | Sí | `string` | formato `date-time`; admite null | Valor de posted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/accounting/journal-transactions/{id}/post"
}
```

---

## 18. POST /accounting/journal-transactions/{id}/reverse

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Reversar un asiento posteado (líneas espejo)
- **Operation ID:** `AccountingLedgerController_reverse`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.reverse](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Reversar un asiento posteado (líneas espejo). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/journal-transactions/{id}/reverse` en `AccountingLedgerController_reverse`. El controlador delega en `LedgerService.reverseJournal`. Valida el body como `ReverseJournalDto` y consume `application/json`. El tipo de retorno estático es `Promise<JournalTransactionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReverseJournalDto`; los campos opcionales se omiten.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/reverse HTTP/1.1
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
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal ABIERTO de la reversa | `00000000-0000-4000-8000-000000000001` |
| `reason` | No | `string` | longitud máxima 500 | Motivo de la reversa | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/reverse HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JournalTransactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "lineCount": 1,
  "postedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de transaction number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de total amount mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |
| `postedAt` | Sí | `string` | formato `date-time`; admite null | Valor de posted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/accounting/journal-transactions/{id}/reverse"
}
```

---

## 19. POST /accounting/journal-transactions/{id}/submit-review

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Enviar el asiento a revisión
- **Operation ID:** `AccountingLedgerController_submitReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.submitReview](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Enviar el asiento a revisión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: REDESA C-17 — AUTO_CLASSIFIED → PENDING_REVIEW.

### Descripción del sistema

NestJS resuelve `POST /accounting/journal-transactions/{id}/submit-review` en `AccountingLedgerController_submitReview`. El controlador delega en `LedgerService.submitForReview`. Valida el body como `JournalTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<JournalTransactionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `JournalTransitionDto`; los campos opcionales se omiten.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/submit-review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó) | `00000000-0000-4000-8000-000000000001` |
| `note` | No | `string` | longitud máxima 500 | Nota de auditoría de la transición | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/journal-transactions/00000000-0000-4000-8000-000000000001/submit-review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JournalTransactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "lineCount": 1,
  "postedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de transaction number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de total amount mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |
| `postedAt` | Sí | `string` | formato `date-time`; admite null | Valor de posted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
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
  "path": "/accounting/journal-transactions/{id}/submit-review"
}
```

---

## 20. POST /accounting/journal-transactions/drafts

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Crear un asiento en borrador (DRAFT, sin postear)
- **Operation ID:** `AccountingLedgerController_createDraft`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.createDraft](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Un PRACTITIONER solo puede crear borradores en una práctica a la que esté vinculado con una asignación de rol activa (Carril 18); el servicio lo verifica y responde 422 si no.

Contexto declarado en el controlador: REDESA C-17 — crea el asiento en estado DRAFT (sin postear). Punto de entrada del flujo canónico DRAFT → AUTO_CLASSIFIED → PENDING_REVIEW → APPROVED → POSTED.

### Descripción del sistema

NestJS resuelve `POST /accounting/journal-transactions/drafts` en `AccountingLedgerController_createDraft`. El controlador delega en `LedgerService.createDraft`. Valida el body como `PostJournalDto` y consume `application/json`. El tipo de retorno estático es `Promise<JournalTransactionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PostJournalDto`; los campos opcionales se omiten.

```http
POST /accounting/journal-transactions/drafts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "transactionDate": "2026-01-31",
  "lines": [
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "direction": "DEBIT",
      "amount": "100.00"
    },
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "direction": "DEBIT",
      "amount": "100.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica propietaria del asiento | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | No | `string` | longitud máxima 60 | Número de asiento (único por práctica); autogenerado si se omite | `valor-ejemplo` |
| `transactionDate` | Sí | `string` | formato `date` | Fecha contable | `2026-01-31` |
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal ABIERTO | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `reference` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceDocumentType` | No | `string` | longitud máxima 40 | Tipo del documento origen (p. ej. INVOICE, APPOINTMENT, EXPENSE) | `valor-ejemplo` |
| `sourceDocumentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines` | Sí | `array<LedgerLineDto>` | mínimo 2 elemento(s) | Líneas balanceadas (>=2) | `[{"accountId":"00000000-0000-4000-8000-000000000001","direction":"DEBIT","amount":"100.00","costCenterId":"00000000-0000-4000-8000-000000000001","profitCenterId":"00000000-0000-4000-8000-000000000001","currencyConceptId":"00000000-0000-4000-8000-000000000001","fxRate":"3.75","amountBase":"375.00","memo":"valor-ejemplo"},{"accountId":"00000000-0000-4000-8000-000000000001","direction":"DEBIT","amount":"100.00","costCenterId":"00000000-0000-4000-8000-000000000001","profitCenterId":"00000000-0000-4000-8000-000000000001","currencyConceptId":"00000000-0000-4000-8000-000000000001","fxRate":"3.75","amountBase":"375.00","memo":"valor-ejemplo"}]` |
| `lines[].accountId` | Sí | `string` | formato `uuid` | Cuenta contable postable | `00000000-0000-4000-8000-000000000001` |
| `lines[].direction` | Sí | `string` | valores: `DEBIT`, `CREDIT` | Dirección de la partida | `DEBIT` |
| `lines[].amount` | Sí | `string` | patrón runtime `POSITIVE_AMOUNT_REGEX` | Importe positivo de la línea | `100.00` |
| `lines[].costCenterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].profitCenterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].fxRate` | No | `string` | Sin restricción adicional declarada | Tipo de cambio a moneda base | `3.75` |
| `lines[].amountBase` | No | `string` | Sin restricción adicional declarada | Importe convertido a moneda base | `375.00` |
| `lines[].memo` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/journal-transactions/drafts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "transactionDate": "2026-01-31",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "reference": "valor-ejemplo",
  "sourceDocumentType": "valor-ejemplo",
  "sourceDocumentId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "direction": "DEBIT",
      "amount": "100.00",
      "costCenterId": "00000000-0000-4000-8000-000000000001",
      "profitCenterId": "00000000-0000-4000-8000-000000000001",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "fxRate": "3.75",
      "amountBase": "375.00",
      "memo": "valor-ejemplo"
    },
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "direction": "DEBIT",
      "amount": "100.00",
      "costCenterId": "00000000-0000-4000-8000-000000000001",
      "profitCenterId": "00000000-0000-4000-8000-000000000001",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "fxRate": "3.75",
      "amountBase": "375.00",
      "memo": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JournalTransactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JournalTransactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "lineCount": 1,
  "postedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de transaction number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de total amount mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |
| `postedAt` | Sí | `string` | formato `date-time`; admite null | Valor de posted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
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
  "path": "/accounting/journal-transactions/drafts"
}
```

---

## 21. POST /accounting/liabilities/{id}/payments

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-liabilities`
- **Nombre:** Liquidar cuota de pasivo (principal + interés)
- **Operation ID:** `AccountingLiabilityController_pay`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLiabilityController.pay](../../src/modules/accounting/controllers/accounting-liability.controller.ts)

### Descripción de negocio

Liquidar cuota de pasivo (principal + interés). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/liabilities/{id}/payments` en `AccountingLiabilityController_pay`. El controlador delega en `LiabilityService.payLiability`. Valida el body como `PayLiabilityDto` y consume `application/json`. El tipo de retorno estático es `Promise<LiabilityPaymentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PayLiabilityDto`; los campos opcionales se omiten.

```http
POST /accounting/liabilities/00000000-0000-4000-8000-000000000001/payments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "1200.00",
  "principalComponent": "1000.00",
  "interestComponent": "200.00",
  "bankAccountId": "00000000-0000-4000-8000-000000000001",
  "interestExpenseAccountId": "00000000-0000-4000-8000-000000000001"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica del asiento generado | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Importe total pagado (= principal + interés) | `1200.00` |
| `principalComponent` | Sí | `string` | Sin restricción adicional declarada | Componente de principal | `1000.00` |
| `interestComponent` | Sí | `string` | Sin restricción adicional declarada | Componente de interés | `200.00` |
| `bankAccountId` | Sí | `string` | formato `uuid` | Cuenta banco/tesorería (crédito) | `00000000-0000-4000-8000-000000000001` |
| `interestExpenseAccountId` | Sí | `string` | formato `uuid` | Cuenta de gasto por interés (débito) | `00000000-0000-4000-8000-000000000001` |
| `liabilityScheduleId` | No | `string` | formato `uuid` | Cuota (installment) a saldar | `00000000-0000-4000-8000-000000000001` |
| `paidAt` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-02-01` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/liabilities/00000000-0000-4000-8000-000000000001/payments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "1200.00",
  "principalComponent": "1000.00",
  "interestComponent": "200.00",
  "bankAccountId": "00000000-0000-4000-8000-000000000001",
  "interestExpenseAccountId": "00000000-0000-4000-8000-000000000001",
  "liabilityScheduleId": "00000000-0000-4000-8000-000000000001",
  "paidAt": "2026-02-01"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LiabilityPaymentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LiabilityPaymentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transactionId": "00000000-0000-4000-8000-000000000001",
  "liabilityStatus": "valor-ejemplo",
  "outstandingAmount": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transactionId` | Sí | `string` | formato `uuid` | Identificador asociado a transaction. | `00000000-0000-4000-8000-000000000001` |
| `liabilityStatus` | Sí | `string` | Sin restricción adicional declarada | Valor de liability status mantenido por la instancia. | `valor-ejemplo` |
| `outstandingAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de outstanding amount mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Pasivo no encontrado | Excepción explícita en src/modules/accounting/services/liability.service.ts |
| 404 | `NOT_FOUND` | Cuota no encontrada para el pasivo | Excepción explícita en src/modules/accounting/services/liability.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | principal + interés no iguala el importe | Excepción explícita en src/modules/accounting/services/liability.service.ts |
| 422 | `PRECONDITION_FAILED` | El pago debe ser positivo | Excepción explícita en src/modules/accounting/services/liability.service.ts |
| 422 | `PRECONDITION_FAILED` | El pasivo no está ACTIVO | Excepción explícita en src/modules/accounting/services/liability.service.ts |
| 422 | `PRECONDITION_FAILED` | El pasivo no tiene cuenta contable | Excepción explícita en src/modules/accounting/services/liability.service.ts |
| 422 | `PRECONDITION_FAILED` | El asiento generado no balancea (debe != haber) | Excepción explícita en src/modules/accounting/services/posting.helper.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/liabilities/{id}/payments"
}
```

---

## 22. POST /accounting/open-items

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-subledger`
- **Nombre:** Generar partida abierta en subledger
- **Operation ID:** `AccountingSubledgerController_createOpenItem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingSubledgerController.createOpenItem](../../src/modules/accounting/controllers/accounting-subledger.controller.ts)

### Descripción de negocio

Generar partida abierta en subledger. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/open-items` en `AccountingSubledgerController_createOpenItem`. El controlador delega en `SubledgerService.createOpenItem`. Valida el body como `CreateOpenItemDto` y consume `application/json`. El tipo de retorno estático es `Promise<OpenItemResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateOpenItemDto`; los campos opcionales se omiten.

```http
POST /accounting/open-items HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subledgerAccountId": "00000000-0000-4000-8000-000000000001",
  "ledgerEntryId": "00000000-0000-4000-8000-000000000001",
  "documentType": "INVOICE",
  "originalAmount": "250.00"
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
| `subledgerAccountId` | Sí | `string` | formato `uuid` | Subledger (cliente/proveedor) ya existente | `00000000-0000-4000-8000-000000000001` |
| `ledgerEntryId` | Sí | `string` | formato `uuid` | Línea del mayor sobre cuenta de reconciliación | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | valores: `INVOICE`, `BILL` | Sin descripción específica en el contrato OpenAPI. | `INVOICE` |
| `documentNumber` | No | `string` | longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `dueDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `originalAmount` | Sí | `string` | Sin restricción adicional declarada | Importe original (= pendiente inicial) | `250.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/open-items HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subledgerAccountId": "00000000-0000-4000-8000-000000000001",
  "ledgerEntryId": "00000000-0000-4000-8000-000000000001",
  "documentType": "INVOICE",
  "documentNumber": "valor-ejemplo",
  "dueDate": "2026-07-31",
  "originalAmount": "250.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OpenItemResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OpenItemResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OpenItemResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OpenItemResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OpenItemResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OpenItemResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OpenItemResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OpenItemResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OpenItemResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OpenItemResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "outstandingAmount": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `outstandingAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de outstanding amount mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Subledger no encontrado | Excepción explícita en src/modules/accounting/services/subledger.service.ts |
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
  "path": "/accounting/open-items"
}
```

---

## 23. POST /accounting/postings/determine-accounts

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Determinar la cuenta objetivo por reglas vigentes
- **Operation ID:** `AccountingLedgerController_determineAccounts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.determineAccounts](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Determinar la cuenta objetivo por reglas vigentes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accounting/postings/determine-accounts` en `AccountingLedgerController_determineAccounts`. El controlador delega en `LedgerService.determineAccounts`. Valida el body como `DetermineAccountsDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeterminedAccountResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DetermineAccountsDto`; los campos opcionales se omiten.

```http
POST /accounting/postings/determine-accounts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "postingScenarioConceptId": "00000000-0000-4000-8000-000000000001"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant al que aplica la regla | `00000000-0000-4000-8000-000000000001` |
| `postingScenarioConceptId` | Sí | `string` | formato `uuid` | Escenario de posteo | `00000000-0000-4000-8000-000000000001` |
| `accountRoleConceptId` | No | `string` | formato `uuid` | Rol de cuenta buscado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/postings/determine-accounts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "postingScenarioConceptId": "00000000-0000-4000-8000-000000000001",
  "accountRoleConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeterminedAccountResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeterminedAccountResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ruleId": "00000000-0000-4000-8000-000000000001",
  "targetAccountId": "00000000-0000-4000-8000-000000000001",
  "priority": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ruleId` | Sí | `string` | formato `uuid` | Identificador asociado a rule. | `00000000-0000-4000-8000-000000000001` |
| `targetAccountId` | Sí | `string` | formato `uuid` | Identificador asociado a target account. | `00000000-0000-4000-8000-000000000001` |
| `priority` | Sí | `number` | admite null | Valor de priority mantenido por la instancia. | `1` |

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
  "path": "/accounting/postings/determine-accounts"
}
```

---

## 24. POST /accounting/practitioner/consultation-income

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-practitioner`
- **Nombre:** Registrar ingreso por consulta pagada
- **Operation ID:** `AccountingPractitionerController_registerConsultationIncome`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingPractitionerController.registerConsultationIncome](../../src/modules/accounting/controllers/accounting-practitioner.controller.ts)

### Descripción de negocio

El importe sale de la factura (paid_total), no del cliente. Ancla la factura al asiento creado y dispara una notificación contable in-app.

Contexto declarado en el controlador: Registrar el ingreso de una consulta pagada.

### Descripción del sistema

NestJS resuelve `POST /accounting/practitioner/consultation-income` en `AccountingPractitionerController_registerConsultationIncome`. El controlador delega en `PractitionerAccountingService.registerConsultationIncome`. Valida el body como `RegisterConsultationIncomeDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerEntryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterConsultationIncomeDto`; los campos opcionales se omiten.

```http
POST /accounting/practitioner/consultation-income HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "debitAccountId": "00000000-0000-4000-8000-000000000001",
  "creditAccountId": "00000000-0000-4000-8000-000000000001",
  "transactionDate": "2026-01-31"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `invoiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `debitAccountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `creditAccountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `transactionDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-01-31` |
| `description` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `fileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/practitioner/consultation-income HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "debitAccountId": "00000000-0000-4000-8000-000000000001",
  "creditAccountId": "00000000-0000-4000-8000-000000000001",
  "transactionDate": "2026-01-31",
  "description": "Texto descriptivo de ejemplo",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerEntryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "transactionId": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "notificationRequestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `transactionId` | Sí | `string` | formato `uuid` | Asiento creado (en DRAFT: ver `docs` para el flujo hasta POSTED). | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `invoiceId` | No | `string` | formato `uuid`; admite null | Factura anclada a este asiento, si el registro fue un ingreso de consulta. | `00000000-0000-4000-8000-000000000001` |
| `notificationRequestId` | No | `string` | formato `uuid`; admite null | Notificación in-app generada para el doctor, si la infraestructura de mensajería la aceptó. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Factura no encontrada | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | La factura ya tiene un asiento contable asociado | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La factura no pertenece a esa práctica | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | La factura todavía no está pagada | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | La factura no está ligada a un encuentro clínico: no se puede confirmar que sea de este profesional | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | La consulta de esa factura no es de este profesional | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | La factura no registra un importe pagado | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional no tiene una vinculación activa con esa práctica | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/practitioner/consultation-income"
}
```

---

## 25. POST /accounting/practitioner/entries

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-practitioner`
- **Nombre:** Registrar un gasto u otro ingreso
- **Operation ID:** `AccountingPractitionerController_registerSimpleEntry`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingPractitionerController.registerSimpleEntry](../../src/modules/accounting/controllers/accounting-practitioner.controller.ts)

### Descripción de negocio

Crea un asiento en DRAFT de dos líneas balanceadas. Sigue el flujo canónico DRAFT → AUTO_CLASSIFIED → PENDING_REVIEW → APPROVED → POSTED; el profesional puede crear y enviar a revisión, no aprobar ni postear.

Contexto declarado en el controlador: Registrar un gasto o un ingreso que no proviene de una consulta.

### Descripción del sistema

NestJS resuelve `POST /accounting/practitioner/entries` en `AccountingPractitionerController_registerSimpleEntry`. El controlador delega en `PractitionerAccountingService.registerSimpleEntry`. Valida el body como `RegisterSimpleEntryDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerEntryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterSimpleEntryDto`; los campos opcionales se omiten.

```http
POST /accounting/practitioner/entries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "kind": "EXPENSE",
  "debitAccountId": "00000000-0000-4000-8000-000000000001",
  "creditAccountId": "00000000-0000-4000-8000-000000000001",
  "amount": "100.00",
  "transactionDate": "2026-01-31",
  "description": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `EXPENSE`, `OTHER_INCOME` | Sin descripción específica en el contrato OpenAPI. | `EXPENSE` |
| `debitAccountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `creditAccountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | patrón runtime `POSITIVE_AMOUNT_REGEX` | Sin descripción específica en el contrato OpenAPI. | `100.00` |
| `transactionDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-01-31` |
| `description` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `fileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accounting/practitioner/entries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "kind": "EXPENSE",
  "debitAccountId": "00000000-0000-4000-8000-000000000001",
  "creditAccountId": "00000000-0000-4000-8000-000000000001",
  "amount": "100.00",
  "transactionDate": "2026-01-31",
  "description": "Texto descriptivo de ejemplo",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerEntryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerEntryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "transactionId": "00000000-0000-4000-8000-000000000001",
  "transactionNumber": "valor-ejemplo",
  "status": "ok",
  "totalAmount": "valor-ejemplo",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "notificationRequestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `transactionId` | Sí | `string` | formato `uuid` | Asiento creado (en DRAFT: ver `docs` para el flujo hasta POSTED). | `00000000-0000-4000-8000-000000000001` |
| `transactionNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ok` |
| `totalAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `invoiceId` | No | `string` | formato `uuid`; admite null | Factura anclada a este asiento, si el registro fue un ingreso de consulta. | `00000000-0000-4000-8000-000000000001` |
| `notificationRequestId` | No | `string` | formato `uuid`; admite null | Notificación in-app generada para el doctor, si la infraestructura de mensajería la aceptó. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional no tiene una vinculación activa con esa práctica | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/practitioner/entries"
}
```

---

## 26. GET /accounting/practitioner/paid-consultations

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-practitioner`
- **Nombre:** Consultas pagadas sin registrar contablemente
- **Operation ID:** `AccountingPractitionerController_listPaidConsultations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingPractitionerController.listPaidConsultations](../../src/modules/accounting/controllers/accounting-practitioner.controller.ts)

### Descripción de negocio

Sale de citas → encuentros → facturas pagadas del profesional autenticado, filtradas por práctica y por no tener ya un asiento asociado.

Contexto declarado en el controlador: Facturas pagadas del profesional, en esa práctica, sin asiento contable todavía.

### Descripción del sistema

NestJS resuelve `GET /accounting/practitioner/paid-consultations` en `AccountingPractitionerController_listPaidConsultations`. El controlador delega en `PractitionerAccountingService.listPaidConsultations`. No recibe body. El tipo de retorno estático es `Promise<PaidConsultationsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /accounting/practitioner/paid-consultations?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /accounting/practitioner/paid-consultations?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PaidConsultationsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PaidConsultationsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PaidConsultationsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PaidConsultationsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PaidConsultationsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PaidConsultationsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaidConsultationsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "invoiceNumber": "valor-ejemplo",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "appointmentId": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "issueDate": "2026-07-31T12:00:00.000Z",
      "paidTotal": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PaidConsultationDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"invoiceId":"00000000-0000-4000-8000-000000000001","invoiceNumber":"valor-ejemplo","encounterId":"00000000-0000-4000-8000-000000000001","appointmentId":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","issueDate":"2026-07-31T12:00:00.000Z","paidTotal":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].invoiceId` | Sí | `string` | formato `uuid` | Factura pagada (`billing.invoices.id`). | `00000000-0000-4000-8000-000000000001` |
| `items[].invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Número de factura, legible. | `valor-ejemplo` |
| `items[].encounterId` | No | `string` | formato `uuid`; admite null | Encuentro clínico del que salió la factura. | `00000000-0000-4000-8000-000000000001` |
| `items[].appointmentId` | No | `string` | formato `uuid`; admite null | Cita de la que salió el encuentro, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Paciente atendido. | `00000000-0000-4000-8000-000000000001` |
| `items[].issueDate` | Sí | `string` | formato `date-time` | Fecha de emisión de la factura. | `2026-07-31T12:00:00.000Z` |
| `items[].paidTotal` | Sí | `string` | Sin restricción adicional declarada | Importe pagado. | `valor-ejemplo` |
| `items[].currencyConceptId` | No | `string` | formato `uuid`; admite null | Moneda (concepto), si la factura la declara. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional no tiene una vinculación activa con esa práctica | Excepción explícita en src/modules/accounting/services/practitioner-accounting.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/practitioner/paid-consultations"
}
```

---

## 27. GET /accounting/trial-balance

- **Módulo:** `accounting`
- **Etiqueta OpenAPI:** `accounting-ledger`
- **Nombre:** Balance de sumas y saldos
- **Operation ID:** `AccountingLedgerController_trialBalance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccountingLedgerController.trialBalance](../../src/modules/accounting/controllers/accounting-ledger.controller.ts)

### Descripción de negocio

Agrega sólo los asientos POSTEADOS: un borrador no es un hecho contable. Declara `balanced`, que es la comprobación de la que depende que el resto signifique algo.

Contexto declarado en el controlador: UC-16-06: balance de sumas y saldos.

### Descripción del sistema

NestJS resuelve `GET /accounting/trial-balance` en `AccountingLedgerController_trialBalance`. El controlador delega en `LedgerReadService.trialBalance`. No recibe body. El tipo de retorno estático es `Promise<TrialBalanceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fiscalPeriodId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | formato `date` | Sin descripción específica en OpenAPI. | `2026-07-31` |
| `to` | query | No | `string` | formato `date` | Sin descripción específica en OpenAPI. | `2026-07-31` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /accounting/trial-balance?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `ACCOUNTING_APPROVER`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /accounting/trial-balance?practiceId=00000000-0000-4000-8000-000000000001&fiscalPeriodId=00000000-0000-4000-8000-000000000001&from=2026-07-31&to=2026-07-31 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TrialBalanceResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<TrialBalanceResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<TrialBalanceResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<TrialBalanceResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TrialBalanceResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TrialBalanceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrialBalanceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "accountId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "normalBalanceConceptId": "00000000-0000-4000-8000-000000000001",
      "debit": "valor-ejemplo",
      "credit": "valor-ejemplo",
      "balance": "valor-ejemplo"
    }
  ],
  "count": 1,
  "totalDebit": "valor-ejemplo",
  "totalCredit": "valor-ejemplo",
  "balanced": true,
  "transactionsIncluded": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<TrialBalanceItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"accountId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","normalBalanceConceptId":"00000000-0000-4000-8000-000000000001","debit":"valor-ejemplo","credit":"valor-ejemplo","balance":"valor-ejemplo"}]` |
| `items[].accountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].normalBalanceConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].debit` | Sí | `string` | Sin restricción adicional declarada | Suma del debe | `valor-ejemplo` |
| `items[].credit` | Sí | `string` | Sin restricción adicional declarada | Suma del haber | `valor-ejemplo` |
| `items[].balance` | Sí | `string` | Sin restricción adicional declarada | Saldo según la naturaleza de la cuenta | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `totalDebit` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalCredit` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `balanced` | Sí | `boolean` | Sin restricción adicional declarada | El conjunto cuadra | `true` |
| `transactionsIncluded` | Sí | `number` | Sin restricción adicional declarada | Asientos POSTEADOS incluidos en la agregación | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Si se alcanzó el tope y el balance está incompleto | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | La práctica consultada pertenece a otra organización | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/accounting/services/ledger-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accounting/trial-balance"
}
```

---

