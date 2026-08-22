<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `billing`

Referencia exhaustiva de 15 operación(es) del módulo `billing`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `billing-operations`, `billing-payables`, `billing-receivables`, `billing-service-catalog`
- **Controladores:** `BillingOperationsController`, `BillingPayablesController`, `BillingReceivablesController`, `BillingServiceCatalogController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /billing/bills](#1-post-billing-bills) — Registrar factura de proveedor con three-way match
2. [POST /billing/documents/{id}:post-to-ledger](#2-post-billing-documents-id-post-to-ledger) — Contabilizar documento (posting CxC/CxP)
3. [POST /billing/dunning-runs:execute](#3-post-billing-dunning-runs-execute) — Ejecutar ciclo de morosidad (dunning)
4. [POST /billing/internal/dunning-runs/run-due](#4-post-billing-internal-dunning-runs-run-due) — Evaluar y disparar morosidad automática por tenant
5. [POST /billing/invoices:issue-from-encounter](#5-post-billing-invoices-issue-from-encounter) — Emitir factura desde los cargos del encuentro
6. [POST /billing/invoices/{id}:credit-note](#6-post-billing-invoices-id-credit-note) — Emitir nota de crédito / castigo sobre una factura
7. [POST /billing/kpi-snapshots:compute](#7-post-billing-kpi-snapshots-compute) — Calcular snapshot de KPI financiero y aging
8. [POST /billing/patient-statements:generate](#8-post-billing-patient-statements-generate) — Generar el estado de cuenta del paciente
9. [POST /billing/payment-plans](#9-post-billing-payment-plans) — Configurar un plan de pagos del paciente
10. [POST /billing/payments-made:execute](#10-post-billing-payments-made-execute) — Ejecutar pago a proveedor con asignación
11. [POST /billing/payments-received:apply](#11-post-billing-payments-received-apply) — Aplicar un pago recibido con asignación multi-factura
12. [POST /billing/reconciliation:clear](#12-post-billing-reconciliation-clear) — Conciliar pagos vía documento de compensación
13. [POST /billing/reimbursements:link](#13-post-billing-reimbursements-link) — Vincular reembolso de reclamo de seguro a la factura
14. [GET /billing/service-catalog](#14-get-billing-service-catalog) — Listar el catálogo de servicios de la práctica
15. [POST /billing/service-catalog](#15-post-billing-service-catalog) — Dar de alta un servicio en el catálogo maestro

---

## 1. POST /billing/bills

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-payables`
- **Nombre:** Registrar factura de proveedor con three-way match
- **Operation ID:** `BillingPayablesController_registerBill`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingPayablesController.registerBill](../../src/modules/billing/controllers/billing-payables.controller.ts)

### Descripción de negocio

Registrar factura de proveedor con three-way match. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/bills` en `BillingPayablesController_registerBill`. El controlador delega en `BillsService.register`. Valida el body como `RegisterBillDto` y consume `application/json`. El tipo de retorno estático es `Promise<BillResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterBillDto`; los campos opcionales se omiten.

```http
POST /billing/bills HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "vendorId": "00000000-0000-4000-8000-000000000001",
  "billNumber": "valor-ejemplo",
  "lines": [
    {
      "quantity": "1",
      "unitPrice": "100.00"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `vendorId` | Sí | `string` | formato `uuid` | Proveedor (billing.vendors) | `00000000-0000-4000-8000-000000000001` |
| `billNumber` | Sí | `string` | longitud máxima 60 | Número de factura del proveedor | `valor-ejemplo` |
| `issueDate` | No | `string` | formato `date-time` | Fecha de emisión (ISO); por defecto hoy | `2026-07-31T12:00:00.000Z` |
| `dueDate` | No | `string` | formato `date-time` | Fecha de vencimiento (ISO) | `2026-07-31T12:00:00.000Z` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda (concepto) | `00000000-0000-4000-8000-000000000001` |
| `purchaseOrderId` | No | `string` | formato `uuid` | Orden de compra (erp.purchase_orders) | `00000000-0000-4000-8000-000000000001` |
| `contractId` | No | `string` | formato `uuid` | Contrato (erp.contracts) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para el vínculo de documento | `00000000-0000-4000-8000-000000000001` |
| `lines` | Sí | `array<BillLineInputDto>` | mínimo 1 elemento(s) | Líneas (al menos una) | `[{"description":"Texto descriptivo de ejemplo","quantity":"1","unitPrice":"100.00","taxAmount":"0.00","expenseAccountId":"00000000-0000-4000-8000-000000000001","costCenterId":"00000000-0000-4000-8000-000000000001","purchaseOrderItemId":"00000000-0000-4000-8000-000000000001","goodsReceiptItemId":"00000000-0000-4000-8000-000000000001","serviceEntryItemId":"00000000-0000-4000-8000-000000000001"}]` |
| `lines[].description` | No | `string` | longitud máxima 500 | Descripción de la línea | `Texto descriptivo de ejemplo` |
| `lines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Cantidad | `1` |
| `lines[].unitPrice` | Sí | `string` | Sin restricción adicional declarada | Precio unitario | `100.00` |
| `lines[].taxAmount` | No | `string` | Sin restricción adicional declarada | Monto de impuesto de la línea | `0.00` |
| `lines[].expenseAccountId` | No | `string` | formato `uuid` | Cuenta de gasto (accounting.accounts) | `00000000-0000-4000-8000-000000000001` |
| `lines[].costCenterId` | No | `string` | formato `uuid` | Centro de costo (accounting.cost_centers) | `00000000-0000-4000-8000-000000000001` |
| `lines[].purchaseOrderItemId` | No | `string` | formato `uuid` | Ítem de orden de compra (erp.purchase_order_items) | `00000000-0000-4000-8000-000000000001` |
| `lines[].goodsReceiptItemId` | No | `string` | formato `uuid` | Ítem de recepción de bienes (erp.goods_receipt_items) | `00000000-0000-4000-8000-000000000001` |
| `lines[].serviceEntryItemId` | No | `string` | formato `uuid` | Ítem de hoja de servicio (erp.service_entry_items) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/bills HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "vendorId": "00000000-0000-4000-8000-000000000001",
  "billNumber": "valor-ejemplo",
  "issueDate": "2026-07-31T12:00:00.000Z",
  "dueDate": "2026-07-31T12:00:00.000Z",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderId": "00000000-0000-4000-8000-000000000001",
  "contractId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "description": "Texto descriptivo de ejemplo",
      "quantity": "1",
      "unitPrice": "100.00",
      "taxAmount": "0.00",
      "expenseAccountId": "00000000-0000-4000-8000-000000000001",
      "costCenterId": "00000000-0000-4000-8000-000000000001",
      "purchaseOrderItemId": "00000000-0000-4000-8000-000000000001",
      "goodsReceiptItemId": "00000000-0000-4000-8000-000000000001",
      "serviceEntryItemId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BillResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BillResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "billNumber": "valor-ejemplo",
  "vendorId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "subtotal": "valor-ejemplo",
  "taxTotal": "valor-ejemplo",
  "total": "valor-ejemplo",
  "balance": "valor-ejemplo",
  "lineCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `billNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de bill number mantenido por la instancia. | `valor-ejemplo` |
| `vendorId` | Sí | `string` | formato `uuid` | Identificador asociado a vendor. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `subtotal` | No | `string` | Sin restricción adicional declarada | Valor de subtotal mantenido por la instancia. | `valor-ejemplo` |
| `taxTotal` | No | `string` | Sin restricción adicional declarada | Valor de tax total mantenido por la instancia. | `valor-ejemplo` |
| `total` | No | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/billing/services/bills.service.ts |
| 409 | `CONFLICT` | La factura del proveedor ya fue capturada | Excepción explícita en src/modules/billing/services/bills.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor no está activo | Excepción explícita en src/modules/billing/services/bills.service.ts |
| 422 | `PRECONDITION_FAILED` | Three-way match: la línea con orden de compra requiere recepción de bienes | Excepción explícita en src/modules/billing/services/bills.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/bills"
}
```

---

## 2. POST /billing/documents/{id}:post-to-ledger

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Contabilizar documento (posting CxC/CxP)
- **Operation ID:** `BillingOperationsController_postToLedger`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.postToLedger](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Contabilizar documento (posting CxC/CxP). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/documents/{id}:post-to-ledger` en `BillingOperationsController_postToLedger`. El controlador delega en `LedgerService.postToLedger`. Valida el body como `PostToLedgerDto` y consume `application/json`. El tipo de retorno estático es `Promise<PostingResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PostToLedgerDto`; los campos opcionales se omiten.

```http
POST /billing/documents/00000000-0000-4000-8000-000000000001:post-to-ledger HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentType": "INVOICE",
  "transactionId": "00000000-0000-4000-8000-000000000001"
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
| `documentType` | Sí | `string` | valores: `INVOICE`, `BILL`, `PAYMENT_RECEIVED`, `PAYMENT_MADE` | Tipo del documento origen | `INVOICE` |
| `transactionId` | Sí | `string` | formato `uuid` | Asiento contable resuelto (accounting.journal_transactions) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/documents/00000000-0000-4000-8000-000000000001:post-to-ledger HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentType": "INVOICE",
  "transactionId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PostingResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "documentType": "INVOICE",
  "transactionId": "00000000-0000-4000-8000-000000000001",
  "posted": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | valores: `INVOICE`, `BILL`, `PAYMENT_RECEIVED`, `PAYMENT_MADE` | Valor de document type mantenido por la instancia. | `INVOICE` |
| `transactionId` | Sí | `string` | formato `uuid` | Identificador asociado a transaction. | `00000000-0000-4000-8000-000000000001` |
| `posted` | Sí | `boolean` | Sin restricción adicional declarada | Valor de posted mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Documento no encontrado | Excepción explícita en src/modules/billing/services/ledger.service.ts |
| 409 | `CONFLICT` | El documento ya fue contabilizado | Excepción explícita en src/modules/billing/services/ledger.service.ts |
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
  "path": "/billing/documents/{id}:post-to-ledger"
}
```

---

## 3. POST /billing/dunning-runs:execute

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Ejecutar ciclo de morosidad (dunning)
- **Operation ID:** `BillingOperationsController_executeDunning`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.executeDunning](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Ejecutar ciclo de morosidad (dunning). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/dunning-runs:execute` en `BillingOperationsController_executeDunning`. El controlador delega en `DunningService.execute`. Valida el body como `ExecuteDunningRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<DunningRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExecuteDunningRunDto`; los campos opcionales se omiten.

```http
POST /billing/dunning-runs:execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "runNumber": "valor-ejemplo",
  "items": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `runNumber` | Sí | `string` | longitud máxima 60 | Número de corrida (único por tenant) | `valor-ejemplo` |
| `runDate` | No | `string` | formato `date-time` | Fecha de la corrida (ISO); por defecto hoy | `2026-07-31T12:00:00.000Z` |
| `dunningLevelConceptId` | No | `string` | formato `uuid` | Nivel de morosidad (concepto) | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<DunningItemInputDto>` | mínimo 1 elemento(s) | Facturas morosas (al menos una) | `[{"invoiceId":"00000000-0000-4000-8000-000000000001","outstandingAmount":"50.00","daysOverdue":30,"dunningFee":"0.00","businessPartnerId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].invoiceId` | Sí | `string` | formato `uuid` | Factura morosa (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `items[].outstandingAmount` | No | `string` | Sin restricción adicional declarada | Saldo pendiente | `50.00` |
| `items[].daysOverdue` | No | `number` | mínimo 0 | Días de mora | `30` |
| `items[].dunningFee` | No | `string` | Sin restricción adicional declarada | Recargo por mora | `0.00` |
| `items[].businessPartnerId` | No | `string` | formato `uuid` | Socio de negocio (erp.business_partners) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/dunning-runs:execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "runNumber": "valor-ejemplo",
  "runDate": "2026-07-31T12:00:00.000Z",
  "dunningLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "outstandingAmount": "50.00",
      "daysOverdue": 30,
      "dunningFee": "0.00",
      "businessPartnerId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DunningRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "runNumber": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "itemCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `runNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de run number mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `itemCount` | Sí | `number` | Sin restricción adicional declarada | Valor de item count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El número de corrida ya existe para el tenant | Excepción explícita en src/modules/billing/services/dunning.service.ts |
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
  "path": "/billing/dunning-runs:execute"
}
```

---

## 4. POST /billing/internal/dunning-runs/run-due

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Evaluar y disparar morosidad automática por tenant
- **Operation ID:** `BillingOperationsController_runDueDunning`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.runDueDunning](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Idempotente por día (`AUTO-<fecha>` por tenant): reintentar el mismo día no duplica la corrida.

Contexto declarado en el controlador: Fase 4 del plan de corrección de workers: descubrimiento + disparo diario de morosidad, por tenant. `dunning-runs:execute` (arriba) sigue siendo el contrato para una corrida puntual con facturas elegidas a mano; este endpoint es lo que hace falta para que exista una corrida automática sin que nadie tenga que armar la lista de facturas.

### Descripción del sistema

NestJS resuelve `POST /billing/internal/dunning-runs/run-due` en `BillingOperationsController_runDueDunning`. El controlador delega en `DunningService.runDueDunning`. Valida el body como `RunDueDunningDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunDueDunningResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunDueDunningDto`; los campos opcionales se omiten.

```http
POST /billing/internal/dunning-runs/run-due HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1; máximo 2000 | Máximo de facturas vencidas por tenant en esta corrida | `500` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/internal/dunning-runs/run-due HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 500
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunDueDunningResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "tenantsProcessed": 1,
  "results": [
    {
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "runId": "00000000-0000-4000-8000-000000000001",
      "itemCount": 1,
      "skipped": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantsProcessed` | Sí | `number` | Sin restricción adicional declarada | Tenants con al menos una factura vencida | `1` |
| `results` | Sí | `array<TenantDunningResultDto>` | Sin restricción adicional declarada | Valor de results mantenido por la instancia. | `[{"tenantId":"00000000-0000-4000-8000-000000000001","runId":"00000000-0000-4000-8000-000000000001","itemCount":1,"skipped":true}]` |
| `results[].tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `results[].runId` | Sí | `string` | formato `uuid` | Identificador asociado a run. | `00000000-0000-4000-8000-000000000001` |
| `results[].itemCount` | Sí | `number` | Sin restricción adicional declarada | Facturas incluidas en la corrida | `1` |
| `results[].skipped` | Sí | `boolean` | Sin restricción adicional declarada | true si el tenant ya tenía una corrida automática hoy | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/billing/internal/dunning-runs/run-due"
}
```

---

## 5. POST /billing/invoices:issue-from-encounter

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Emitir factura desde los cargos del encuentro
- **Operation ID:** `BillingReceivablesController_issueFromEncounter`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.issueFromEncounter](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Emitir factura desde los cargos del encuentro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/invoices:issue-from-encounter` en `BillingReceivablesController_issueFromEncounter`. El controlador delega en `InvoicesService.issueFromEncounter`. Valida el body como `IssueInvoiceFromEncounterDto` y consume `application/json`. El tipo de retorno estático es `Promise<InvoiceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueInvoiceFromEncounterDto`; los campos opcionales se omiten.

```http
POST /billing/invoices:issue-from-encounter HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "quantity": "1",
      "unitPrice": "100.00"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica emisora (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente facturado (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro origen (clinical.encounters) | `00000000-0000-4000-8000-000000000001` |
| `invoiceNumber` | No | `string` | longitud máxima 60 | Número de folio; si se omite se genera | `valor-ejemplo` |
| `issueDate` | No | `string` | formato `date-time` | Fecha de emisión (ISO); por defecto hoy | `2026-07-31T12:00:00.000Z` |
| `dueDate` | No | `string` | formato `date-time` | Fecha de vencimiento (ISO) | `2026-07-31T12:00:00.000Z` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda (terminology.catalog_concepts) | `00000000-0000-4000-8000-000000000001` |
| `claimId` | No | `string` | formato `uuid` | Reclamo de seguro asociado (para el vínculo de documento) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para registrar el vínculo de documento | `00000000-0000-4000-8000-000000000001` |
| `lines` | Sí | `array<InvoiceLineInputDto>` | mínimo 1 elemento(s) | Líneas de cargo (al menos una) | `[{"serviceId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo","quantity":"1","unitPrice":"100.00","discount":"0.00","taxCodeId":"00000000-0000-4000-8000-000000000001","taxAmount":"0.00","incomeAccountId":"00000000-0000-4000-8000-000000000001","costCenterId":"00000000-0000-4000-8000-000000000001"}]` |
| `lines[].serviceId` | No | `string` | formato `uuid` | Servicio del catálogo (billing.service_catalog) | `00000000-0000-4000-8000-000000000001` |
| `lines[].description` | No | `string` | longitud máxima 500 | Descripción libre de la línea | `Texto descriptivo de ejemplo` |
| `lines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Cantidad | `1` |
| `lines[].unitPrice` | Sí | `string` | Sin restricción adicional declarada | Precio unitario | `100.00` |
| `lines[].discount` | No | `string` | Sin restricción adicional declarada | Descuento de línea | `0.00` |
| `lines[].taxCodeId` | No | `string` | formato `uuid` | Código de impuesto (billing.tax_codes) | `00000000-0000-4000-8000-000000000001` |
| `lines[].taxAmount` | No | `string` | Sin restricción adicional declarada | Monto de impuesto de la línea | `0.00` |
| `lines[].incomeAccountId` | No | `string` | formato `uuid` | Cuenta de ingreso (accounting.accounts) | `00000000-0000-4000-8000-000000000001` |
| `lines[].costCenterId` | No | `string` | formato `uuid` | Centro de costo (accounting.cost_centers) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/invoices:issue-from-encounter HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "invoiceNumber": "valor-ejemplo",
  "issueDate": "2026-07-31T12:00:00.000Z",
  "dueDate": "2026-07-31T12:00:00.000Z",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "claimId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "serviceId": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo",
      "quantity": "1",
      "unitPrice": "100.00",
      "discount": "0.00",
      "taxCodeId": "00000000-0000-4000-8000-000000000001",
      "taxAmount": "0.00",
      "incomeAccountId": "00000000-0000-4000-8000-000000000001",
      "costCenterId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InvoiceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "invoiceNumber": "valor-ejemplo",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "subtotal": "valor-ejemplo",
  "taxTotal": "valor-ejemplo",
  "discountTotal": "valor-ejemplo",
  "total": "valor-ejemplo",
  "paidTotal": "valor-ejemplo",
  "balance": "valor-ejemplo",
  "lineCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de invoice number mantenido por la instancia. | `valor-ejemplo` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado | `00000000-0000-4000-8000-000000000001` |
| `subtotal` | No | `string` | Sin restricción adicional declarada | Valor de subtotal mantenido por la instancia. | `valor-ejemplo` |
| `taxTotal` | No | `string` | Sin restricción adicional declarada | Valor de tax total mantenido por la instancia. | `valor-ejemplo` |
| `discountTotal` | No | `string` | Sin restricción adicional declarada | Valor de discount total mantenido por la instancia. | `valor-ejemplo` |
| `total` | No | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `paidTotal` | No | `string` | Sin restricción adicional declarada | Valor de paid total mantenido por la instancia. | `valor-ejemplo` |
| `balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El número de factura ya existe en la práctica | Excepción explícita en src/modules/billing/services/invoices.service.ts |
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
  "path": "/billing/invoices:issue-from-encounter"
}
```

---

## 6. POST /billing/invoices/{id}:credit-note

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Emitir nota de crédito / castigo sobre una factura
- **Operation ID:** `BillingReceivablesController_creditNote`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.creditNote](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Emitir nota de crédito / castigo sobre una factura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/invoices/{id}:credit-note` en `BillingReceivablesController_creditNote`. El controlador delega en `InvoicesService.creditNote`. Valida el body como `CreditNoteDto` y consume `application/json`. El tipo de retorno estático es `Promise<InvoiceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreditNoteDto`; los campos opcionales se omiten.

```http
POST /billing/invoices/00000000-0000-4000-8000-000000000001:credit-note HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "lines": [
    {
      "quantity": "1",
      "unitPrice": "100.00"
    }
  ]
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
| `reason` | Sí | `string` | longitud máxima 500 | Motivo del ajuste / nota de crédito | `Texto descriptivo de ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para registrar el vínculo CREDIT_OF | `00000000-0000-4000-8000-000000000001` |
| `writeOff` | No | `boolean` | Sin restricción adicional declarada | Si es un castigo de saldo incobrable (write-off) | `true` |
| `lines` | Sí | `array<CreditNoteLineInputDto>` | mínimo 1 elemento(s) | Líneas a revertir | `[{"description":"Texto descriptivo de ejemplo","quantity":"1","unitPrice":"100.00","taxAmount":"0.00"}]` |
| `lines[].description` | No | `string` | longitud máxima 500 | Descripción del reverso | `Texto descriptivo de ejemplo` |
| `lines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Cantidad (positiva; se invierte el signo del total) | `1` |
| `lines[].unitPrice` | Sí | `string` | Sin restricción adicional declarada | Precio unitario a revertir | `100.00` |
| `lines[].taxAmount` | No | `string` | Sin restricción adicional declarada | Impuesto a revertir | `0.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/invoices/00000000-0000-4000-8000-000000000001:credit-note HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "writeOff": true,
  "lines": [
    {
      "description": "Texto descriptivo de ejemplo",
      "quantity": "1",
      "unitPrice": "100.00",
      "taxAmount": "0.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InvoiceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "invoiceNumber": "valor-ejemplo",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "subtotal": "valor-ejemplo",
  "taxTotal": "valor-ejemplo",
  "discountTotal": "valor-ejemplo",
  "total": "valor-ejemplo",
  "paidTotal": "valor-ejemplo",
  "balance": "valor-ejemplo",
  "lineCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de invoice number mantenido por la instancia. | `valor-ejemplo` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado | `00000000-0000-4000-8000-000000000001` |
| `subtotal` | No | `string` | Sin restricción adicional declarada | Valor de subtotal mantenido por la instancia. | `valor-ejemplo` |
| `taxTotal` | No | `string` | Sin restricción adicional declarada | Valor de tax total mantenido por la instancia. | `valor-ejemplo` |
| `discountTotal` | No | `string` | Sin restricción adicional declarada | Valor de discount total mantenido por la instancia. | `valor-ejemplo` |
| `total` | No | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `paidTotal` | No | `string` | Sin restricción adicional declarada | Valor de paid total mantenido por la instancia. | `valor-ejemplo` |
| `balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Valor de line count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Factura no encontrada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto de la nota de crédito excede el saldo de la factura | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/invoices/{id}:credit-note"
}
```

---

## 7. POST /billing/kpi-snapshots:compute

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Calcular snapshot de KPI financiero y aging
- **Operation ID:** `BillingOperationsController_computeKpi`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.computeKpi](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Calcular snapshot de KPI financiero y aging. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/kpi-snapshots:compute` en `BillingOperationsController_computeKpi`. El controlador delega en `KpiSnapshotsService.compute`. Valida el body como `ComputeKpiSnapshotDto` y consume `application/json`. El tipo de retorno estático es `Promise<KpiSnapshotResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ComputeKpiSnapshotDto`; los campos opcionales se omiten.

```http
POST /billing/kpi-snapshots:compute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "kpiCode": "CODIGO_EJEMPLO",
  "valueNumeric": "42.50"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `fiscalPeriodId` | No | `string` | formato `uuid` | Periodo fiscal (accounting.fiscal_periods) | `00000000-0000-4000-8000-000000000001` |
| `kpiCode` | Sí | `string` | longitud máxima 60 | Código de KPI (p. ej. DSO, AR_AGING, CASH_POSITION) | `CODIGO_EJEMPLO` |
| `valueNumeric` | Sí | `string` | Sin restricción adicional declarada | Valor calculado del KPI | `42.50` |
| `dimensionJson` | No | `object` | Sin restricción adicional declarada | Dimensiones del cálculo (JSON) | `{}` |
| `computedAt` | No | `string` | formato `date-time` | Marca del cálculo (ISO); por defecto ahora | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/kpi-snapshots:compute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "kpiCode": "CODIGO_EJEMPLO",
  "valueNumeric": "42.50",
  "dimensionJson": {},
  "computedAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `KpiSnapshotResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kpiCode": "CODIGO_EJEMPLO",
  "valueNumeric": "valor-ejemplo",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `kpiCode` | Sí | `string` | Sin restricción adicional declarada | Valor de kpi code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `valueNumeric` | Sí | `string` | Sin restricción adicional declarada | Valor de value numeric mantenido por la instancia. | `valor-ejemplo` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El snapshot de KPI ya fue calculado para esa marca | Excepción explícita en src/modules/billing/services/kpi-snapshots.service.ts |
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
  "path": "/billing/kpi-snapshots:compute"
}
```

---

## 8. POST /billing/patient-statements:generate

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Generar el estado de cuenta del paciente
- **Operation ID:** `BillingReceivablesController_generateStatement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.generateStatement](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Generar el estado de cuenta del paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/patient-statements:generate` en `BillingReceivablesController_generateStatement`. El controlador delega en `PatientStatementsService.generate`. Valida el body como `GeneratePatientStatementDto` y consume `application/json`. El tipo de retorno estático es `Promise<PatientStatementResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GeneratePatientStatementDto`; los campos opcionales se omiten.

```http
POST /billing/patient-statements:generate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | Sí | `string` | formato `date-time` | Inicio del periodo (ISO) | `2026-07-31T12:00:00.000Z` |
| `periodEnd` | Sí | `string` | formato `date-time` | Fin del periodo (ISO) | `2026-07-31T12:00:00.000Z` |
| `openingBalance` | No | `string` | Sin restricción adicional declarada | Saldo de apertura; por defecto 0.00 | `0.00` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para vincular las facturas incluidas | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/patient-statements:generate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "openingBalance": "0.00",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientStatementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "valor-ejemplo",
  "periodEnd": "valor-ejemplo",
  "openingBalance": "valor-ejemplo",
  "charges": "valor-ejemplo",
  "payments": "valor-ejemplo",
  "closingBalance": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | Sí | `string` | Sin restricción adicional declarada | Valor de period start mantenido por la instancia. | `valor-ejemplo` |
| `periodEnd` | Sí | `string` | Sin restricción adicional declarada | Valor de period end mantenido por la instancia. | `valor-ejemplo` |
| `openingBalance` | Sí | `string` | Sin restricción adicional declarada | Valor de opening balance mantenido por la instancia. | `valor-ejemplo` |
| `charges` | Sí | `string` | Sin restricción adicional declarada | Valor de charges mantenido por la instancia. | `valor-ejemplo` |
| `payments` | Sí | `string` | Sin restricción adicional declarada | Valor de payments mantenido por la instancia. | `valor-ejemplo` |
| `closingBalance` | Sí | `string` | Sin restricción adicional declarada | Valor de closing balance mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un estado de cuenta para el periodo | Excepción explícita en src/modules/billing/services/patient-statements.service.ts |
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
  "path": "/billing/patient-statements:generate"
}
```

---

## 9. POST /billing/payment-plans

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Configurar un plan de pagos del paciente
- **Operation ID:** `BillingReceivablesController_createPaymentPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.createPaymentPlan](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Configurar un plan de pagos del paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/payment-plans` en `BillingReceivablesController_createPaymentPlan`. El controlador delega en `InvoicesService.createPaymentPlan`. Valida el body como `CreatePaymentPlanDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentPlanResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePaymentPlanDto`; los campos opcionales se omiten.

```http
POST /billing/payment-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceInvoiceId": "00000000-0000-4000-8000-000000000001",
  "installments": [
    {
      "dueDate": "2026-07-31T12:00:00.000Z",
      "amount": "25.00"
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
| `sourceInvoiceId` | Sí | `string` | formato `uuid` | Factura origen con saldo (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para vincular las cuotas | `00000000-0000-4000-8000-000000000001` |
| `installments` | Sí | `array<InstallmentInputDto>` | mínimo 1 elemento(s) | Cuotas; la suma debe igualar el saldo origen | `[{"dueDate":"2026-07-31T12:00:00.000Z","amount":"25.00"}]` |
| `installments[].dueDate` | Sí | `string` | formato `date-time` | Fecha de vencimiento de la cuota (ISO) | `2026-07-31T12:00:00.000Z` |
| `installments[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe de la cuota | `25.00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/payment-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceInvoiceId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "installments": [
    {
      "dueDate": "2026-07-31T12:00:00.000Z",
      "amount": "25.00"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentPlanResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "sourceInvoiceId": "00000000-0000-4000-8000-000000000001",
  "installmentCount": 1,
  "installments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "invoiceNumber": "valor-ejemplo",
      "total": "valor-ejemplo",
      "dueDate": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceInvoiceId` | Sí | `string` | formato `uuid` | Identificador asociado a source invoice. | `00000000-0000-4000-8000-000000000001` |
| `installmentCount` | Sí | `number` | Sin restricción adicional declarada | Valor de installment count mantenido por la instancia. | `1` |
| `installments` | Sí | `array<GeneratedInstallmentDto>` | Sin restricción adicional declarada | Valor de installments mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","invoiceNumber":"valor-ejemplo","total":"valor-ejemplo","dueDate":"valor-ejemplo"}]` |
| `installments[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `installments[].invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de invoice number mantenido por la instancia. | `valor-ejemplo` |
| `installments[].total` | Sí | `string` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `valor-ejemplo` |
| `installments[].dueDate` | Sí | `string` | Sin restricción adicional declarada | Valor de due date mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Factura origen no encontrada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La factura origen no tiene saldo | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma de cuotas debe igualar el saldo de la factura | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/payment-plans"
}
```

---

## 10. POST /billing/payments-made:execute

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-payables`
- **Nombre:** Ejecutar pago a proveedor con asignación
- **Operation ID:** `BillingPayablesController_executePayment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingPayablesController.executePayment](../../src/modules/billing/controllers/billing-payables.controller.ts)

### Descripción de negocio

Ejecutar pago a proveedor con asignación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/payments-made:execute` en `BillingPayablesController_executePayment`. El controlador delega en `PaymentsMadeService.execute`. Valida el body como `ExecutePaymentMadeDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentMadeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExecutePaymentMadeDto`; los campos opcionales se omiten.

```http
POST /billing/payments-made:execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "100.00",
  "allocations": [
    {
      "billId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "100.00"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `vendorId` | No | `string` | formato `uuid` | Proveedor (billing.vendors) | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Monto total del pago | `100.00` |
| `methodConceptId` | No | `string` | formato `uuid` | Método de pago (concepto); por defecto transferencia | `00000000-0000-4000-8000-000000000001` |
| `paidAt` | No | `string` | formato `date-time` | Fecha de pago (ISO) | `2026-07-31T12:00:00.000Z` |
| `companyBankAccountId` | No | `string` | formato `uuid` | Cuenta bancaria origen (accounting.company_bank_accounts) | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<PayableAllocationInputDto>` | mínimo 1 elemento(s) | Asignaciones por factura (al menos una) | `[{"billId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"100.00","discountAmount":"0.00","withholdingAmount":"0.00","openItemId":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].billId` | Sí | `string` | formato `uuid` | Factura de proveedor destino (billing.bills) | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | Sin restricción adicional declarada | Monto asignado | `100.00` |
| `allocations[].discountAmount` | No | `string` | Sin restricción adicional declarada | Descuento | `0.00` |
| `allocations[].withholdingAmount` | No | `string` | Sin restricción adicional declarada | Retención (withholding) | `0.00` |
| `allocations[].openItemId` | No | `string` | formato `uuid` | Partida abierta del subledger (accounting.open_items) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/payments-made:execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "vendorId": "00000000-0000-4000-8000-000000000001",
  "amount": "100.00",
  "methodConceptId": "00000000-0000-4000-8000-000000000001",
  "paidAt": "2026-07-31T12:00:00.000Z",
  "companyBankAccountId": "00000000-0000-4000-8000-000000000001",
  "allocations": [
    {
      "billId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "100.00",
      "discountAmount": "0.00",
      "withholdingAmount": "0.00",
      "openItemId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentMadeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "amount": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "allocations": [
    {
      "billId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "valor-ejemplo",
      "balance": "valor-ejemplo",
      "status": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<AllocatedBillDto>` | Sin restricción adicional declarada | Valor de allocations mantenido por la instancia. | `[{"billId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"valor-ejemplo","balance":"valor-ejemplo","status":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].billId` | Sí | `string` | formato `uuid` | Identificador asociado a bill. | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de allocated amount mantenido por la instancia. | `valor-ejemplo` |
| `allocations[].balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `allocations[].status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Factura de proveedor no encontrada | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto del pago debe ser positivo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma asignada más retención excede el monto del pago | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La factura de proveedor no tiene saldo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación excede el saldo de la factura de proveedor | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/payments-made:execute"
}
```

---

## 11. POST /billing/payments-received:apply

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Aplicar un pago recibido con asignación multi-factura
- **Operation ID:** `BillingReceivablesController_applyPayment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.applyPayment](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Aplicar un pago recibido con asignación multi-factura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/payments-received:apply` en `BillingReceivablesController_applyPayment`. El controlador delega en `PaymentsReceivedService.apply`. Valida el body como `ApplyPaymentReceivedDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentReceivedResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyPaymentReceivedDto`; los campos opcionales se omiten.

```http
POST /billing/payments-received:apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "50.00",
  "allocations": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "50.00"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente pagador (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Monto total recibido | `50.00` |
| `methodConceptId` | No | `string` | formato `uuid` | Método de pago (concepto); por defecto efectivo | `00000000-0000-4000-8000-000000000001` |
| `receivedAt` | No | `string` | formato `date-time` | Fecha de recepción (ISO) | `2026-07-31T12:00:00.000Z` |
| `reference` | No | `string` | longitud máxima 120 | Referencia externa (voucher, txn) | `valor-ejemplo` |
| `companyBankAccountId` | No | `string` | formato `uuid` | Cuenta bancaria receptora (accounting.company_bank_accounts) | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<ReceivableAllocationInputDto>` | mínimo 1 elemento(s) | Asignaciones por factura (al menos una) | `[{"invoiceId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"50.00","discountAmount":"0.00","openItemId":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].invoiceId` | Sí | `string` | formato `uuid` | Factura destino (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | Sin restricción adicional declarada | Monto asignado a la factura | `50.00` |
| `allocations[].discountAmount` | No | `string` | Sin restricción adicional declarada | Descuento por pronto pago | `0.00` |
| `allocations[].openItemId` | No | `string` | formato `uuid` | Partida abierta del subledger (accounting.open_items) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/payments-received:apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "amount": "50.00",
  "methodConceptId": "00000000-0000-4000-8000-000000000001",
  "receivedAt": "2026-07-31T12:00:00.000Z",
  "reference": "valor-ejemplo",
  "companyBankAccountId": "00000000-0000-4000-8000-000000000001",
  "allocations": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "50.00",
      "discountAmount": "0.00",
      "openItemId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentReceivedResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "amount": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "allocations": [
    {
      "invoiceId": "00000000-0000-4000-8000-000000000001",
      "allocatedAmount": "valor-ejemplo",
      "balance": "valor-ejemplo",
      "status": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<AllocatedInvoiceDto>` | Sin restricción adicional declarada | Valor de allocations mantenido por la instancia. | `[{"invoiceId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"valor-ejemplo","balance":"valor-ejemplo","status":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].invoiceId` | Sí | `string` | formato `uuid` | Identificador asociado a invoice. | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de allocated amount mantenido por la instancia. | `valor-ejemplo` |
| `allocations[].balance` | No | `string` | Sin restricción adicional declarada | Valor de balance mantenido por la instancia. | `valor-ejemplo` |
| `allocations[].status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Factura no encontrada | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto del pago debe ser positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma asignada excede el monto del pago | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La factura no tiene saldo pendiente | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación excede el saldo de la factura | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/payments-received:apply"
}
```

---

## 12. POST /billing/reconciliation:clear

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-operations`
- **Nombre:** Conciliar pagos vía documento de compensación
- **Operation ID:** `BillingOperationsController_reconcile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingOperationsController.reconcile](../../src/modules/billing/controllers/billing-operations.controller.ts)

### Descripción de negocio

Conciliar pagos vía documento de compensación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/reconciliation:clear` en `BillingOperationsController_reconcile`. El controlador delega en `ReconciliationService.clear`. Valida el body como `ReconciliationClearDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReconciliationResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReconciliationClearDto`; los campos opcionales se omiten.

```http
POST /billing/reconciliation:clear HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "clearingDocumentId": "00000000-0000-4000-8000-000000000001"
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
| `clearingDocumentId` | Sí | `string` | formato `uuid` | Documento de compensación del lote (accounting.clearing_documents) | `00000000-0000-4000-8000-000000000001` |
| `paymentReceivedIds` | No | `array<string>` | formato `uuid` | Pagos recibidos a conciliar | `["00000000-0000-4000-8000-000000000001"]` |
| `paymentMadeIds` | No | `array<string>` | formato `uuid` | Pagos emitidos a conciliar | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/reconciliation:clear HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "clearingDocumentId": "00000000-0000-4000-8000-000000000001",
  "paymentReceivedIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "paymentMadeIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReconciliationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "clearingDocumentId": "00000000-0000-4000-8000-000000000001",
  "reconciledReceived": 1,
  "reconciledMade": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `clearingDocumentId` | Sí | `string` | formato `uuid` | Identificador asociado a clearing document. | `00000000-0000-4000-8000-000000000001` |
| `reconciledReceived` | Sí | `number` | Sin restricción adicional declarada | Valor de reconciled received mantenido por la instancia. | `1` |
| `reconciledMade` | Sí | `number` | Sin restricción adicional declarada | Valor de reconciled made mantenido por la instancia. | `1` |

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
  "path": "/billing/reconciliation:clear"
}
```

---

## 13. POST /billing/reimbursements:link

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Vincular reembolso de reclamo de seguro a la factura
- **Operation ID:** `BillingReceivablesController_linkReimbursement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.linkReimbursement](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Vincular reembolso de reclamo de seguro a la factura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/reimbursements:link` en `BillingReceivablesController_linkReimbursement`. El controlador delega en `ReimbursementsService.link`. Valida el body como `LinkReimbursementDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReimbursementResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LinkReimbursementDto`; los campos opcionales se omiten.

```http
POST /billing/reimbursements:link HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "claimId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "30.00"
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
| `claimId` | Sí | `string` | formato `uuid` | Reclamo de seguro (insurance.insurance_claims) | `00000000-0000-4000-8000-000000000001` |
| `invoiceId` | Sí | `string` | formato `uuid` | Factura del paciente a acreditar (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Monto reembolsado por la aseguradora | `30.00` |
| `receivedAt` | No | `string` | formato `date-time` | Fecha de recepción del reembolso (ISO) | `2026-07-31T12:00:00.000Z` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (directory.tenants); requerido para registrar el vínculo REIMBURSEMENT_OF | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/reimbursements:link HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "claimId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "30.00",
  "receivedAt": "2026-07-31T12:00:00.000Z",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReimbursementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "claimId": "00000000-0000-4000-8000-000000000001",
  "amount": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "invoiceBalance": "valor-ejemplo",
  "invoiceStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `claimId` | Sí | `string` | formato `uuid` | Identificador asociado a claim. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `invoiceId` | Sí | `string` | formato `uuid` | Identificador asociado a invoice. | `00000000-0000-4000-8000-000000000001` |
| `invoiceBalance` | No | `string` | Sin restricción adicional declarada | Valor de invoice balance mantenido por la instancia. | `valor-ejemplo` |
| `invoiceStatus` | Sí | `string` | formato `uuid` | Valor de invoice status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Factura no encontrada | Excepción explícita en src/modules/billing/services/reimbursements.service.ts |
| 409 | `CONFLICT` | El reclamo ya tiene un reembolso registrado | Excepción explícita en src/modules/billing/services/reimbursements.service.ts |
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
  "path": "/billing/reimbursements:link"
}
```

---

## 14. GET /billing/service-catalog

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Listar el catálogo de servicios de la práctica
- **Operation ID:** `BillingServiceCatalogController_search`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.search](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Listar el catálogo de servicios de la práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lista el catálogo de servicios de una práctica, buscable por código o nombre.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog` en `BillingServiceCatalogController_search`. El controlador delega en `BillingServiceCatalogService.search`. No recibe body. El tipo de retorno estático es `Promise<SearchServiceCatalogResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Práctica (uuid) | `00000000-0000-4000-8000-000000000001` |
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el código o el nombre | `valor-ejemplo` |
| `isActive` | query | No | `string` | Sin restricción adicional declarada | Filtra por servicios activos (`true`) o inactivos (`false`) | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Servicios por página (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/service-catalog?practiceId=00000000-0000-4000-8000-000000000001&q=valor-ejemplo&isActive=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchServiceCatalogResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "defaultPrice": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "taxCodeId": "00000000-0000-4000-8000-000000000001",
      "incomeAccountId": "00000000-0000-4000-8000-000000000001",
      "isActive": true
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ServiceCatalogItemDto>` | Sin restricción adicional declarada | Servicios de esta página, ordenados por código. | `[{"id":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","defaultPrice":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001","taxCodeId":"00000000-0000-4000-8000-000000000001","incomeAccountId":"00000000-0000-4000-8000-000000000001","isActive":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Valor de default price mantenido por la instancia. | `valor-ejemplo` |
| `items[].currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].taxCodeId` | No | `string` | formato `uuid` | Identificador asociado a tax code. | `00000000-0000-4000-8000-000000000001` |
| `items[].incomeAccountId` | No | `string` | formato `uuid` | Identificador asociado a income account. | `00000000-0000-4000-8000-000000000001` |
| `items[].isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

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
  "path": "/billing/service-catalog"
}
```

---

## 15. POST /billing/service-catalog

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Dar de alta un servicio en el catálogo maestro
- **Operation ID:** `BillingServiceCatalogController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.create](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Dar de alta un servicio en el catálogo maestro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea un servicio nuevo en el catálogo maestro.

### Descripción del sistema

NestJS resuelve `POST /billing/service-catalog` en `BillingServiceCatalogController_create`. El controlador delega en `BillingServiceCatalogService.create`. Valida el body como `CreateServiceCatalogItemDto` y consume `application/json`. El tipo de retorno estático es `Promise<ServiceCatalogItemDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateServiceCatalogItemDto`; los campos opcionales se omiten.

```http
POST /billing/service-catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "defaultPrice": "100.00"
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
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 60 | Código interno del servicio | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre del servicio | `Nombre de ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Concepto de clasificación del servicio | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Precio de referencia; cada doctor puede cotizar otro precio | `100.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda (concepto) | `00000000-0000-4000-8000-000000000001` |
| `taxCodeId` | No | `string` | formato `uuid` | Código de impuesto (billing.tax_codes) | `00000000-0000-4000-8000-000000000001` |
| `incomeAccountId` | No | `string` | formato `uuid` | Cuenta de ingreso (accounting.accounts) | `00000000-0000-4000-8000-000000000001` |
| `isActive` | No | `boolean` | Sin restricción adicional declarada | Si queda disponible para cotizar; por defecto true | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/service-catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "100.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "taxCodeId": "00000000-0000-4000-8000-000000000001",
  "incomeAccountId": "00000000-0000-4000-8000-000000000001",
  "isActive": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceCatalogItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "taxCodeId": "00000000-0000-4000-8000-000000000001",
  "incomeAccountId": "00000000-0000-4000-8000-000000000001",
  "isActive": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Valor de default price mantenido por la instancia. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `taxCodeId` | No | `string` | formato `uuid` | Identificador asociado a tax code. | `00000000-0000-4000-8000-000000000001` |
| `incomeAccountId` | No | `string` | formato `uuid` | Identificador asociado a income account. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un servicio con ese código en el catálogo | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
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
  "path": "/billing/service-catalog"
}
```

---

