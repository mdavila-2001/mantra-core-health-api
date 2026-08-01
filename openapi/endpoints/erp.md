<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `erp`

Referencia exhaustiva de 17 operación(es) del módulo `erp`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `erp`
- **Controladores:** `ErpController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /erp/bills/{billId}/invoice-match-runs](#1-post-erp-bills-billid-invoice-match-runs) — Conciliar la factura contra orden y recepción (three-way match)
2. [POST /erp/business-partners](#2-post-erp-business-partners) — Alta de socio de negocio con su cuenta bancaria
3. [POST /erp/business-partners/{id}/bank-accounts/{accId}/verify](#3-post-erp-business-partners-id-bank-accounts-accid-verify) — Verificar la cuenta bancaria del socio
4. [POST /erp/contracts](#4-post-erp-contracts) — Crear un contrato en borrador
5. [POST /erp/contracts/{id}/amendments](#5-post-erp-contracts-id-amendments) — Enmendar el contrato
6. [POST /erp/contracts/{id}/approval-requests](#6-post-erp-contracts-id-approval-requests) — Solicitar o resolver la aprobación del contrato
7. [POST /erp/contracts/{id}/payment-schedules/generate](#7-post-erp-contracts-id-payment-schedules-generate) — Generar el cronograma de cuotas del contrato
8. [POST /erp/contracts/{id}/renewals](#8-post-erp-contracts-id-renewals) — Renovar el contrato extendiendo su vigencia
9. [POST /erp/contracts/{id}/terminations](#9-post-erp-contracts-id-terminations) — Terminar el contrato y liquidarlo
10. [POST /erp/employees/{id}/time-off](#10-post-erp-employees-id-time-off) — Solicitar una ausencia
11. [POST /erp/employees/{id}/time-off/{reqId}/approve](#11-post-erp-employees-id-time-off-reqid-approve) — Aprobar o rechazar la solicitud de ausencia
12. [POST /erp/employees/onboard](#12-post-erp-employees-onboard) — Alta de empleado
13. [POST /erp/lease-contracts/{id}/valuations](#13-post-erp-lease-contracts-id-valuations) — Registrar la valoración IFRS 16 del arrendamiento
14. [POST /erp/purchase-orders](#14-post-erp-purchase-orders) — Emitir una orden de compra desde la requisición
15. [POST /erp/purchase-orders/{id}/goods-receipts](#15-post-erp-purchase-orders-id-goods-receipts) — Registrar la recepción de mercancía
16. [POST /erp/purchase-orders/{id}/service-entry-sheets](#16-post-erp-purchase-orders-id-service-entry-sheets) — Registrar la hoja de servicios prestados
17. [POST /erp/sales-orders](#17-post-erp-sales-orders) — Crear una orden de venta

---

## 1. POST /erp/bills/{billId}/invoice-match-runs

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Conciliar la factura contra orden y recepción (three-way match)
- **Operation ID:** `ErpController_runInvoiceMatch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.runInvoiceMatch](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Una diferencia mayor que la tolerancia se marca como desviación.


### Descripción del sistema

NestJS resuelve `POST /erp/bills/{billId}/invoice-match-runs` en `ErpController_runInvoiceMatch`. El controlador delega en `ErpOperationsService.runInvoiceMatch`. Valida el body como `CreateInvoiceMatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<InvoiceMatchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `billId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateInvoiceMatchDto`; los campos opcionales se omiten.

```http
POST /erp/bills/00000000-0000-4000-8000-000000000001/invoice-match-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderId": "00000000-0000-4000-8000-000000000001",
  "invoicedAmount": "2500.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `ACCOUNTS_PAYABLE`.
- Deben ser UUID válidos: `billId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `purchaseOrderId` | Sí | `string` | formato `uuid` | Orden de compra contra la que se concilia | `00000000-0000-4000-8000-000000000001` |
| `invoicedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe facturado por el proveedor | `2500.00` |
| `toleranceAmount` | No | `string` | Sin restricción adicional declarada | Tolerancia admitida antes de marcar desviación | `10.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/bills/00000000-0000-4000-8000-000000000001/invoice-match-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderId": "00000000-0000-4000-8000-000000000001",
  "invoicedAmount": "2500.00",
  "toleranceAmount": "10.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InvoiceMatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InvoiceMatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "matchedAmount": "valor-ejemplo",
  "varianceAmount": "valor-ejemplo",
  "matched": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `matchedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe de la orden contra el que se comparó | `valor-ejemplo` |
| `varianceAmount` | Sí | `string` | Sin restricción adicional declarada | Diferencia entre lo facturado y lo ordenado | `valor-ejemplo` |
| `matched` | Sí | `boolean` | Sin restricción adicional declarada | true si la diferencia queda dentro de la tolerancia | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, ACCOUNTS_PAYABLE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden de compra no encontrada | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
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
  "path": "/erp/bills/{billId}/invoice-match-runs"
}
```

---

## 2. POST /erp/business-partners

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Alta de socio de negocio con su cuenta bancaria
- **Operation ID:** `ErpController_createPartner`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createPartner](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Alta de socio de negocio con su cuenta bancaria. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/business-partners` en `ErpController_createPartner`. El controlador delega en `ErpContractsService.createPartner`. Valida el body como `CreatePartnerDto` y consume `application/json`. El tipo de retorno estático es `Promise<PartnerResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePartnerDto`; los campos opcionales se omiten.

```http
POST /erp/business-partners HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "partnerNumber": "valor-ejemplo",
  "category": "SUPPLIER",
  "displayName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `partnerNumber` | Sí | `string` | longitud máxima 100 | Número de socio, único por tenant | `valor-ejemplo` |
| `category` | Sí | `string` | valores: `SUPPLIER`, `CUSTOMER`, `BOTH` | Sin descripción específica en el contrato OpenAPI. | `SUPPLIER` |
| `displayName` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `legalName` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `taxId` | No | `string` | longitud máxima 50 | Identificación fiscal | `00000000-0000-4000-8000-000000000001` |
| `bankName` | No | `string` | longitud máxima 200 | Cuenta bancaria principal a registrar con el alta | `Nombre de ejemplo` |
| `ibanMasked` | No | `string` | longitud máxima 50 | IBAN enmascarado; nunca el número completo | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/business-partners HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "partnerNumber": "valor-ejemplo",
  "category": "SUPPLIER",
  "displayName": "Nombre de ejemplo",
  "legalName": "Nombre de ejemplo",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "bankName": "Nombre de ejemplo",
  "ibanMasked": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PartnerResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PartnerResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PartnerResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PartnerResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PartnerResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PartnerResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PartnerResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PartnerResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PartnerResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PartnerResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "partnerNumber": "valor-ejemplo",
  "bankAccountId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `partnerNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de partner number mantenido por la instancia. | `valor-ejemplo` |
| `bankAccountId` | No | `string` | formato `uuid` | Identificador asociado a bank account. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un socio con ese número | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
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
  "path": "/erp/business-partners"
}
```

---

## 3. POST /erp/business-partners/{id}/bank-accounts/{accId}/verify

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Verificar la cuenta bancaria del socio
- **Operation ID:** `ErpController_verifyBankAccount`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.verifyBankAccount](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Requisito para usarla en pagos salientes.


### Descripción del sistema

NestJS resuelve `POST /erp/business-partners/{id}/bank-accounts/{accId}/verify` en `ErpController_verifyBankAccount`. El controlador delega en `ErpContractsService.verifyBankAccount`. No recibe body. El tipo de retorno estático es `Promise<VerifyBankAccountResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `accId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /erp/business-partners/00000000-0000-4000-8000-000000000001/bank-accounts/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`.
- Deben ser UUID válidos: `id`, `accId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /erp/business-partners/00000000-0000-4000-8000-000000000001/bank-accounts/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerifyBankAccountResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerifyBankAccountResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bankAccountId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bankAccountId` | Sí | `string` | formato `uuid` | Identificador asociado a bank account. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a verification status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Socio de negocio no encontrado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 404 | `NOT_FOUND` | Cuenta bancaria no encontrada | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 409 | `CONFLICT` | La cuenta ya está verificada | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no pertenece a ese socio | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/erp/business-partners/{id}/bank-accounts/{accId}/verify"
}
```

---

## 4. POST /erp/contracts

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Crear un contrato en borrador
- **Operation ID:** `ErpController_createContract`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createContract](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Crear un contrato en borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/contracts` en `ErpController_createContract`. El controlador delega en `ErpContractsService.createContract`. Valida el body como `ErpCreateContractDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContractResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ErpCreateContractDto`; los campos opcionales se omiten.

```http
POST /erp/contracts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "contractNumber": "valor-ejemplo",
  "contractType": "SERVICE",
  "title": "valor-ejemplo",
  "primaryBusinessPartnerId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `CONTRACT_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `contractNumber` | Sí | `string` | longitud máxima 100 | Número de contrato, único por tenant | `valor-ejemplo` |
| `contractType` | Sí | `string` | valores: `SERVICE`, `SUPPLY`, `LEASE` | Sin descripción específica en el contrato OpenAPI. | `SERVICE` |
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `primaryBusinessPartnerId` | Sí | `string` | formato `uuid` | Socio de negocio contraparte | `00000000-0000-4000-8000-000000000001` |
| `startDate` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `totalValue` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `120000.00` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/contracts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "contractNumber": "valor-ejemplo",
  "contractType": "SERVICE",
  "title": "valor-ejemplo",
  "primaryBusinessPartnerId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31T12:00:00.000Z",
  "endDate": "2026-07-31T12:00:00.000Z",
  "totalValue": "120000.00",
  "description": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContractResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContractResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "contractCode": "CODIGO_EJEMPLO",
  "externalProviderId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `contractCode` | Sí | `string` | Sin restricción adicional declarada | Valor de contract code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `externalProviderId` | Sí | `string` | formato `uuid` | Identificador asociado a external provider. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del contrato | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, CONTRACT_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Socio de negocio no encontrado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 409 | `CONFLICT` | Ya existe un contrato con ese número | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El contrato debe terminar después de empezar | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/erp/contracts"
}
```

---

## 5. POST /erp/contracts/{id}/amendments

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Enmendar el contrato
- **Operation ID:** `ErpController_createAmendment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createAmendment](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

La enmienda devuelve el contrato a aprobación pendiente.


### Descripción del sistema

NestJS resuelve `POST /erp/contracts/{id}/amendments` en `ErpController_createAmendment`. El controlador delega en `ErpContractsService.createAmendment`. Valida el body como `CreateAmendmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContractChangeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAmendmentDto`; los campos opcionales se omiten.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/amendments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "baseVersionId": "00000000-0000-4000-8000-000000000001",
  "amendmentType": "SCOPE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `CONTRACT_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `baseVersionId` | Sí | `string` | formato `uuid` | Versión sobre la que se enmienda | `00000000-0000-4000-8000-000000000001` |
| `amendmentType` | Sí | `string` | valores: `SCOPE`, `PRICE` | Sin descripción específica en el contrato OpenAPI. | `SCOPE` |
| `reasonText` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `effectiveDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/amendments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "baseVersionId": "00000000-0000-4000-8000-000000000001",
  "amendmentType": "SCOPE",
  "reasonText": "Texto descriptivo de ejemplo",
  "effectiveDate": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContractChangeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "contractId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `contractId` | Sí | `string` | formato `uuid` | Identificador asociado a contract. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, CONTRACT_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El contrato no admite cambios en su estado actual | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/erp/contracts/{id}/amendments"
}
```

---

## 6. POST /erp/contracts/{id}/approval-requests

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Solicitar o resolver la aprobación del contrato
- **Operation ID:** `ErpController_requestApproval`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.requestApproval](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Aprobar activa el contrato.


### Descripción del sistema

NestJS resuelve `POST /erp/contracts/{id}/approval-requests` en `ErpController_requestApproval`. El controlador delega en `ErpContractsService.requestApproval`. Valida el body como `ErpRequestApprovalDto` y consume `application/json`. El tipo de retorno estático es `Promise<ApprovalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ErpRequestApprovalDto`; los campos opcionales se omiten.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/approval-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `CONTRACT_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dueAt` | No | `string` | formato `date-time` | Fecha límite de la aprobación | `2026-07-31T12:00:00.000Z` |
| `decision` | No | `string` | valores: `APPROVED`, `REJECTED` | Decisión inmediata cuando el aprobador resuelve en el acto | `APPROVED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/approval-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dueAt": "2026-07-31T12:00:00.000Z",
  "decision": "APPROVED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ApprovalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "changeStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "approvedSteps": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `changeRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a change request. | `00000000-0000-4000-8000-000000000001` |
| `changeStatusConceptId` | Sí | `string` | formato `uuid` | Estado del cambio tras la decisión | `00000000-0000-4000-8000-000000000001` |
| `approvedSteps` | Sí | `number` | Sin restricción adicional declarada | Pasos aprobados hasta ahora | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, CONTRACT_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El contrato está terminado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/erp/contracts/{id}/approval-requests"
}
```

---

## 7. POST /erp/contracts/{id}/payment-schedules/generate

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Generar el cronograma de cuotas del contrato
- **Operation ID:** `ErpController_generatePaymentSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.generatePaymentSchedule](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Idempotente: si ya existen cuotas no se regeneran.


### Descripción del sistema

NestJS resuelve `POST /erp/contracts/{id}/payment-schedules/generate` en `ErpController_generatePaymentSchedule`. El controlador delega en `ErpContractsService.generatePaymentSchedule`. Valida el body como `GeneratePaymentScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentScheduleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GeneratePaymentScheduleDto`; los campos opcionales se omiten.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/payment-schedules/generate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "installments": 1,
  "firstDueDate": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `SYSTEM_WORKER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `installments` | Sí | `number` | mínimo 1 | Número de cuotas a generar | `1` |
| `firstDueDate` | Sí | `string` | formato `date-time` | Fecha de la primera cuota | `2026-07-31T12:00:00.000Z` |
| `intervalDays` | No | `number` | mínimo 1 | Días entre cuotas | `30` |
| `direction` | No | `string` | valores: `OUTBOUND`, `INBOUND` | Sentido del pago | `OUTBOUND` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/payment-schedules/generate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "installments": 1,
  "firstDueDate": "2026-07-31T12:00:00.000Z",
  "intervalDays": 30,
  "direction": "OUTBOUND"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentScheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentScheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "contractId": "00000000-0000-4000-8000-000000000001",
  "created": 1,
  "installmentAmount": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `contractId` | Sí | `string` | formato `uuid` | Identificador asociado a contract. | `00000000-0000-4000-8000-000000000001` |
| `created` | Sí | `number` | Sin restricción adicional declarada | Cuotas creadas en esta ejecución | `1` |
| `installmentAmount` | Sí | `string` | Sin restricción adicional declarada | Importe de cada cuota | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, SYSTEM_WORKER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El contrato no tiene valor total del que derivar las cuotas | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/erp/contracts/{id}/payment-schedules/generate"
}
```

---

## 8. POST /erp/contracts/{id}/renewals

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Renovar el contrato extendiendo su vigencia
- **Operation ID:** `ErpController_createRenewal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createRenewal](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Renovar el contrato extendiendo su vigencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/contracts/{id}/renewals` en `ErpController_createRenewal`. El controlador delega en `ErpContractsService.createRenewal`. Valida el body como `CreateRenewalDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContractChangeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRenewalDto`; los campos opcionales se omiten.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/renewals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "renewalType": "AUTOMATIC",
  "newEndDate": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `CONTRACT_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `renewalType` | Sí | `string` | valores: `AUTOMATIC`, `NEGOTIATED` | Sin descripción específica en el contrato OpenAPI. | `AUTOMATIC` |
| `newEndDate` | Sí | `string` | formato `date-time` | Nueva fecha de fin | `2026-07-31T12:00:00.000Z` |
| `proposedValue` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `130000.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/renewals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "renewalType": "AUTOMATIC",
  "newEndDate": "2026-07-31T12:00:00.000Z",
  "proposedValue": "130000.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContractChangeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "contractId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `contractId` | Sí | `string` | formato `uuid` | Identificador asociado a contract. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, CONTRACT_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La renovación debe extender la vigencia más allá del fin actual | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 422 | `PRECONDITION_FAILED` | El contrato no admite cambios en su estado actual | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/erp/contracts/{id}/renewals"
}
```

---

## 9. POST /erp/contracts/{id}/terminations

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Terminar el contrato y liquidarlo
- **Operation ID:** `ErpController_createTermination`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createTermination](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Terminar el contrato y liquidarlo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/contracts/{id}/terminations` en `ErpController_createTermination`. El controlador delega en `ErpContractsService.createTermination`. Valida el body como `CreateTerminationDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContractChangeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTerminationDto`; los campos opcionales se omiten.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/terminations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "terminationType": "CAUSE",
  "effectiveDate": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `CONTRACT_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `terminationType` | Sí | `string` | valores: `CAUSE`, `CONVENIENCE` | Sin descripción específica en el contrato OpenAPI. | `CAUSE` |
| `effectiveDate` | Sí | `string` | formato `date-time` | Fecha efectiva de la terminación | `2026-07-31T12:00:00.000Z` |
| `reasonText` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `settlementAmount` | No | `string` | Sin restricción adicional declarada | Liquidación pactada | `5000.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/contracts/00000000-0000-4000-8000-000000000001/terminations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "terminationType": "CAUSE",
  "effectiveDate": "2026-07-31T12:00:00.000Z",
  "reasonText": "Texto descriptivo de ejemplo",
  "settlementAmount": "5000.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContractChangeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContractChangeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "contractId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `contractId` | Sí | `string` | formato `uuid` | Identificador asociado a contract. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, CONTRACT_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
| 409 | `CONFLICT` | El contrato ya está terminado | Excepción explícita en src/modules/erp/services/erp-contracts.service.ts |
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
  "path": "/erp/contracts/{id}/terminations"
}
```

---

## 10. POST /erp/employees/{id}/time-off

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Solicitar una ausencia
- **Operation ID:** `ErpController_requestTimeOff`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.requestTimeOff](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Solicitar una ausencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/employees/{id}/time-off` en `ErpController_requestTimeOff`. El controlador delega en `ErpOperationsService.requestTimeOff`. Valida el body como `RequestTimeOffDto` y consume `application/json`. El tipo de retorno estático es `Promise<TimeOffResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestTimeOffDto`; los campos opcionales se omiten.

```http
POST /erp/employees/00000000-0000-4000-8000-000000000001/time-off HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "leaveType": "VACATION",
  "startDate": "2026-07-31T12:00:00.000Z",
  "endDate": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `HR_ADMIN`, `EMPLOYEE`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `leaveType` | Sí | `string` | valores: `VACATION`, `SICK` | Sin descripción específica en el contrato OpenAPI. | `VACATION` |
| `startDate` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endDate` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/employees/00000000-0000-4000-8000-000000000001/time-off HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "leaveType": "VACATION",
  "startDate": "2026-07-31T12:00:00.000Z",
  "endDate": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TimeOffResponseDto`. Ejemplo completo derivado de ese DTO:

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, HR_ADMIN, EMPLOYEE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Empleado no encontrado | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
| 409 | `CONFLICT` | El empleado ya tiene una ausencia en esas fechas | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ausencia debe terminar después de empezar | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/erp/employees/{id}/time-off"
}
```

---

## 11. POST /erp/employees/{id}/time-off/{reqId}/approve

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Aprobar o rechazar la solicitud de ausencia
- **Operation ID:** `ErpController_approveTimeOff`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.approveTimeOff](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Aprobar o rechazar la solicitud de ausencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/employees/{id}/time-off/{reqId}/approve` en `ErpController_approveTimeOff`. El controlador delega en `ErpOperationsService.approveTimeOff`. Valida el body como `ApproveTimeOffDto` y consume `application/json`. El tipo de retorno estático es `Promise<TimeOffResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reqId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApproveTimeOffDto`; los campos opcionales se omiten.

```http
POST /erp/employees/00000000-0000-4000-8000-000000000001/time-off/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approved": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `HR_ADMIN`.
- Deben ser UUID válidos: `id`, `reqId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `approved` | Sí | `boolean` | Sin restricción adicional declarada | true aprueba la solicitud; false la rechaza | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/employees/00000000-0000-4000-8000-000000000001/time-off/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approved": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TimeOffResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TimeOffResponseDto`. Ejemplo completo derivado de ese DTO:

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, HR_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de ausencia no encontrada | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
| 409 | `CONFLICT` | La solicitud ya fue resuelta | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
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
  "path": "/erp/employees/{id}/time-off/{reqId}/approve"
}
```

---

## 12. POST /erp/employees/onboard

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Alta de empleado
- **Operation ID:** `ErpController_onboardEmployee`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.onboardEmployee](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Alta de empleado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/employees/onboard` en `ErpController_onboardEmployee`. El controlador delega en `ErpOperationsService.onboardEmployee`. Valida el body como `OnboardEmployeeDto` y consume `application/json`. El tipo de retorno estático es `Promise<EmployeeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OnboardEmployeeDto`; los campos opcionales se omiten.

```http
POST /erp/employees/onboard HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fullName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `HR_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fullName` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `personUserId` | No | `string` | formato `uuid` | Usuario de la plataforma vinculado | `00000000-0000-4000-8000-000000000001` |
| `hireDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `baseSalary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `8000.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/employees/onboard HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fullName": "Nombre de ejemplo",
  "personUserId": "00000000-0000-4000-8000-000000000001",
  "hireDate": "2026-07-31T12:00:00.000Z",
  "baseSalary": "8000.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EmployeeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EmployeeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EmployeeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EmployeeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EmployeeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EmployeeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EmployeeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EmployeeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EmployeeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EmployeeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "fullName": "Nombre de ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `fullName` | Sí | `string` | Sin restricción adicional declarada | Valor de full name mantenido por la instancia. | `Nombre de ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, HR_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/erp/employees/onboard"
}
```

---

## 13. POST /erp/lease-contracts/{id}/valuations

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Registrar la valoración IFRS 16 del arrendamiento
- **Operation ID:** `ErpController_createLeaseValuation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createLeaseValuation](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Registrar la valoración IFRS 16 del arrendamiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/lease-contracts/{id}/valuations` en `ErpController_createLeaseValuation`. El controlador delega en `ErpOperationsService.createLeaseValuation`. Valida el body como `CreateLeaseValuationDto` y consume `application/json`. El tipo de retorno estático es `Promise<LeaseValuationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateLeaseValuationDto`; los campos opcionales se omiten.

```http
POST /erp/lease-contracts/00000000-0000-4000-8000-000000000001/valuations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valuationDate": "2026-07-31T12:00:00.000Z",
  "rightOfUseAssetValue": "95000.00",
  "leaseLiabilityValue": "92000.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `ACCOUNTANT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `valuationDate` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `rightOfUseAssetValue` | Sí | `string` | Sin restricción adicional declarada | Valor del activo por derecho de uso | `95000.00` |
| `leaseLiabilityValue` | Sí | `string` | Sin restricción adicional declarada | Pasivo por arrendamiento | `92000.00` |
| `interestExpense` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1200.00` |
| `depreciationExpense` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2500.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/lease-contracts/00000000-0000-4000-8000-000000000001/valuations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valuationDate": "2026-07-31T12:00:00.000Z",
  "rightOfUseAssetValue": "95000.00",
  "leaseLiabilityValue": "92000.00",
  "interestExpense": "1200.00",
  "depreciationExpense": "2500.00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LeaseValuationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LeaseValuationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "leaseContractId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `leaseContractId` | Sí | `string` | formato `uuid` | Identificador asociado a lease contract. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, ACCOUNTANT. | Roles/tenant/guards de autorización |
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
  "path": "/erp/lease-contracts/{id}/valuations"
}
```

---

## 14. POST /erp/purchase-orders

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Emitir una orden de compra desde la requisición
- **Operation ID:** `ErpController_createPurchaseOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createPurchaseOrder](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Emitir una orden de compra desde la requisición. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/purchase-orders` en `ErpController_createPurchaseOrder`. El controlador delega en `ErpOperationsService.createPurchaseOrder`. Valida el body como `ErpCreatePurchaseOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<PurchaseOrderResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ErpCreatePurchaseOrderDto`; los campos opcionales se omiten.

```http
POST /erp/purchase-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderNumber": "valor-ejemplo",
  "supplierBusinessPartnerId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "itemType": "MATERIAL",
      "quantity": "10",
      "unitPrice": "250.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `BUYER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `purchaseOrderNumber` | Sí | `string` | longitud máxima 100 | Número de orden, único por tenant | `valor-ejemplo` |
| `supplierBusinessPartnerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `purchaseRequisitionId` | No | `string` | formato `uuid` | Requisición de origen | `00000000-0000-4000-8000-000000000001` |
| `contractId` | No | `string` | formato `uuid` | Contrato marco | `00000000-0000-4000-8000-000000000001` |
| `expectedDeliveryDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items` | Sí | `array<PurchaseOrderItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"itemType":"MATERIAL","description":"Texto descriptivo de ejemplo","quantity":"10","unitPrice":"250.00"}]` |
| `items[].itemType` | Sí | `string` | valores: `MATERIAL`, `SERVICE` | Sin descripción específica en el contrato OpenAPI. | `MATERIAL` |
| `items[].description` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `10` |
| `items[].unitPrice` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `250.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/purchase-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderNumber": "valor-ejemplo",
  "supplierBusinessPartnerId": "00000000-0000-4000-8000-000000000001",
  "purchaseRequisitionId": "00000000-0000-4000-8000-000000000001",
  "contractId": "00000000-0000-4000-8000-000000000001",
  "expectedDeliveryDate": "2026-07-31T12:00:00.000Z",
  "items": [
    {
      "itemType": "MATERIAL",
      "description": "Texto descriptivo de ejemplo",
      "quantity": "10",
      "unitPrice": "250.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PurchaseOrderResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderNumber": "valor-ejemplo",
  "lineIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `purchaseOrderNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de purchase order number mantenido por la instancia. | `valor-ejemplo` |
| `lineIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de las líneas creadas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, BUYER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
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
  "path": "/erp/purchase-orders"
}
```

---

## 15. POST /erp/purchase-orders/{id}/goods-receipts

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Registrar la recepción de mercancía
- **Operation ID:** `ErpController_createGoodsReceipt`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createGoodsReceipt](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Registrar la recepción de mercancía. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/purchase-orders/{id}/goods-receipts` en `ErpController_createGoodsReceipt`. El controlador delega en `ErpOperationsService.createGoodsReceipt`. Valida el body como `ErpCreateGoodsReceiptDto` y consume `application/json`. El tipo de retorno estático es `Promise<GoodsReceiptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ErpCreateGoodsReceiptDto`; los campos opcionales se omiten.

```http
POST /erp/purchase-orders/00000000-0000-4000-8000-000000000001/goods-receipts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "receiptNumber": "valor-ejemplo",
  "items": [
    {
      "purchaseOrderItemId": "00000000-0000-4000-8000-000000000001",
      "receivedQuantity": "10"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `BUYER`, `WAREHOUSE`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `receiptNumber` | Sí | `string` | longitud máxima 100 | Número de recepción | `valor-ejemplo` |
| `supplierDeliveryReference` | No | `string` | Sin restricción adicional declarada | Referencia del albarán del proveedor | `valor-ejemplo` |
| `items` | Sí | `array<GoodsReceiptItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"purchaseOrderItemId":"00000000-0000-4000-8000-000000000001","receivedQuantity":"10","acceptedQuantity":"9"}]` |
| `items[].purchaseOrderItemId` | Sí | `string` | formato `uuid` | Línea de la orden que se recibe | `00000000-0000-4000-8000-000000000001` |
| `items[].receivedQuantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `10` |
| `items[].acceptedQuantity` | No | `string` | Sin restricción adicional declarada | Cantidad aceptada tras control de calidad | `9` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/purchase-orders/00000000-0000-4000-8000-000000000001/goods-receipts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "receiptNumber": "valor-ejemplo",
  "supplierDeliveryReference": "valor-ejemplo",
  "items": [
    {
      "purchaseOrderItemId": "00000000-0000-4000-8000-000000000001",
      "receivedQuantity": "10",
      "acceptedQuantity": "9"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GoodsReceiptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "receiptNumber": "valor-ejemplo",
  "lotIds": [
    "valor-ejemplo"
  ],
  "ledgerEntryIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `receiptNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de receipt number mantenido por la instancia. | `valor-ejemplo` |
| `lotIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de lotes afectados | `["valor-ejemplo"]` |
| `ledgerEntryIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de asientos del ledger | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, BUYER, WAREHOUSE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden de compra no encontrada | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La orden de compra está cerrada | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
| 422 | `PRECONDITION_FAILED` | La cantidad aceptada no puede superar la recibida | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/erp/purchase-orders/{id}/goods-receipts"
}
```

---

## 16. POST /erp/purchase-orders/{id}/service-entry-sheets

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Registrar la hoja de servicios prestados
- **Operation ID:** `ErpController_createServiceEntrySheet`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createServiceEntrySheet](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Registrar la hoja de servicios prestados. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/purchase-orders/{id}/service-entry-sheets` en `ErpController_createServiceEntrySheet`. El controlador delega en `ErpOperationsService.createServiceEntrySheet`. Valida el body como `CreateServiceEntrySheetDto` y consume `application/json`. El tipo de retorno estático es `Promise<ServiceEntrySheetResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateServiceEntrySheetDto`; los campos opcionales se omiten.

```http
POST /erp/purchase-orders/00000000-0000-4000-8000-000000000001/service-entry-sheets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sheetNumber": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `BUYER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sheetNumber` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `performedFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `performedTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/purchase-orders/00000000-0000-4000-8000-000000000001/service-entry-sheets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sheetNumber": "valor-ejemplo",
  "performedFrom": "2026-07-31T12:00:00.000Z",
  "performedTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ServiceEntrySheetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceEntrySheetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sheetNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `sheetNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de sheet number mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, BUYER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden de compra no encontrada | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
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
  "path": "/erp/purchase-orders/{id}/service-entry-sheets"
}
```

---

## 17. POST /erp/sales-orders

- **Módulo:** `erp`
- **Etiqueta OpenAPI:** `erp`
- **Nombre:** Crear una orden de venta
- **Operation ID:** `ErpController_createSalesOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ErpController.createSalesOrder](../../src/modules/erp/controllers/erp.controller.ts)

### Descripción de negocio

Crear una orden de venta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /erp/sales-orders` en `ErpController_createSalesOrder`. El controlador delega en `ErpOperationsService.createSalesOrder`. Valida el body como `CreateSalesOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<SalesOrderResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSalesOrderDto`; los campos opcionales se omiten.

```http
POST /erp/sales-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "salesOrderNumber": "valor-ejemplo",
  "customerBusinessPartnerId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ERP_ADMIN`, `SALES`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `salesOrderNumber` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `customerBusinessPartnerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `opportunityId` | No | `string` | formato `uuid` | Oportunidad ganada que la origina | `00000000-0000-4000-8000-000000000001` |
| `contractId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /erp/sales-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "salesOrderNumber": "valor-ejemplo",
  "customerBusinessPartnerId": "00000000-0000-4000-8000-000000000001",
  "opportunityId": "00000000-0000-4000-8000-000000000001",
  "contractId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SalesOrderResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SalesOrderResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SalesOrderResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SalesOrderResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SalesOrderResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SalesOrderResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SalesOrderResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SalesOrderResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SalesOrderResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SalesOrderResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "salesOrderNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `salesOrderNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de sales order number mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ERP_ADMIN, SALES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cliente no encontrado | Excepción explícita en src/modules/erp/services/erp-operations.service.ts |
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
  "path": "/erp/sales-orders"
}
```

---

