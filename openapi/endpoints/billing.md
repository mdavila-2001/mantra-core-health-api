<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `billing`

Referencia exhaustiva de 34 operación(es) del módulo `billing`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `billing-operations`, `billing-payables`, `billing-receivables`, `billing-service-catalog`, `billing-simulated`
- **Controladores:** `BillingOperationsController`, `BillingPayablesController`, `BillingReceivablesController`, `BillingServiceCatalogController`, `BillingSimulatedController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /billing/bills](#1-post-billing-bills) — Registrar factura de proveedor con three-way match
2. [POST /billing/documents/{id}:post-to-ledger](#2-post-billing-documents-id-post-to-ledger) — Contabilizar documento (posting CxC/CxP)
3. [POST /billing/dunning-runs:execute](#3-post-billing-dunning-runs-execute) — Ejecutar ciclo de morosidad (dunning)
4. [POST /billing/internal/dunning-runs/run-due](#4-post-billing-internal-dunning-runs-run-due) — Evaluar y disparar morosidad automática por tenant
5. [GET /billing/invoices](#5-get-billing-invoices) — Listar las facturas de la práctica
6. [POST /billing/invoices:issue-from-encounter](#6-post-billing-invoices-issue-from-encounter) — Emitir factura desde los cargos del encuentro
7. [GET /billing/invoices/{id}](#7-get-billing-invoices-id) — Detalle de una factura, con sus líneas
8. [POST /billing/invoices/{id}:credit-note](#8-post-billing-invoices-id-credit-note) — Emitir nota de crédito / castigo sobre una factura
9. [POST /billing/kpi-snapshots:compute](#9-post-billing-kpi-snapshots-compute) — Calcular snapshot de KPI financiero y aging
10. [GET /billing/patient-statements](#10-get-billing-patient-statements) — Listar los estados de cuenta de la práctica
11. [POST /billing/patient-statements:generate](#11-post-billing-patient-statements-generate) — Generar el estado de cuenta del paciente
12. [POST /billing/payment-plans](#12-post-billing-payment-plans) — Configurar un plan de pagos del paciente
13. [POST /billing/payments-made:execute](#13-post-billing-payments-made-execute) — Ejecutar pago a proveedor con asignación
14. [POST /billing/payments-received:apply](#14-post-billing-payments-received-apply) — Aplicar un pago recibido con asignación multi-factura
15. [POST /billing/reconciliation:clear](#15-post-billing-reconciliation-clear) — Conciliar pagos vía documento de compensación
16. [POST /billing/reimbursements:link](#16-post-billing-reimbursements-link) — Vincular reembolso de reclamo de seguro a la factura
17. [GET /billing/service-catalog](#17-get-billing-service-catalog) — Listar el catálogo de servicios de la práctica
18. [POST /billing/service-catalog](#18-post-billing-service-catalog) — Dar de alta un servicio en el catálogo maestro
19. [PATCH /billing/service-catalog/{id}](#19-patch-billing-service-catalog-id) — Corregir un servicio del catálogo de mi práctica
20. [GET /billing/service-catalog/procedure-specialties](#20-get-billing-service-catalog-procedure-specialties) — Listar las especialidades del nomenclador de procedimientos
21. [GET /billing/service-catalog/procedures](#21-get-billing-service-catalog-procedures) — Listar el nomenclador de procedimientos (arancel de referencia)
22. [GET /billing/simulated/catalogs](#22-get-billing-simulated-catalogs) — Catálogos paramétricos del SIAT simulado
23. [GET /billing/simulated/charges](#23-get-billing-simulated-charges) — Cobros de consultas (opcionalmente de una persona)
24. [POST /billing/simulated/charges/{chargeId}/instances/{instanceId}/payments](#24-post-billing-simulated-charges-chargeid-instances-instanceid-payments) — Pago de una instancia de plan (no soportado: 409 NOT_A_PLAN)
25. [POST /billing/simulated/charges/{chargeId}/invoices](#25-post-billing-simulated-charges-chargeid-invoices) — Emitir la factura SIAT simulada de un cobro pagado
26. [POST /billing/simulated/charges/{chargeId}/payment](#26-post-billing-simulated-charges-chargeid-payment) — Registrar el pago real de un cobro
27. [GET /billing/simulated/invoices/{invoiceId}](#27-get-billing-simulated-invoices-invoiceid) — Una factura simulada, dentro del alcance de quien la pide
28. [POST /billing/simulated/invoices/{invoiceId}/annulment](#28-post-billing-simulated-invoices-invoiceid-annulment) — Anular la factura (sólo administración)
29. [POST /billing/simulated/invoices/{invoiceId}/annulment-reversal](#29-post-billing-simulated-invoices-invoiceid-annulment-reversal) — Revertir la anulación (sólo administración)
30. [POST /billing/simulated/invoices/{invoiceId}/email](#30-post-billing-simulated-invoices-invoiceid-email) — Encolar el envío (simulado, no se envía) de la factura
31. [GET /billing/simulated/my-invoices](#31-get-billing-simulated-my-invoices) — Mis facturas: recibidas (paciente) o emitidas (quien factura)
32. [GET /billing/simulated/my-invoices/{invoiceId}](#32-get-billing-simulated-my-invoices-invoiceid) — Una de mis facturas
33. [GET /billing/simulated/outbox](#33-get-billing-simulated-outbox) — Bandeja de correo simulada (sólo administración)
34. [GET /billing/simulated/status](#34-get-billing-simulated-status) — Estado fiscal simulado: emisores y credenciales sintéticas

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
| `lines[].quantity` | Sí | `string` | patrón runtime `QUANTITY_PATTERN` | Cantidad | `1` |
| `lines[].unitPrice` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Precio unitario | `100.00` |
| `lines[].taxAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Monto de impuesto de la línea | `0.00` |
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
| 504 | Operación completada correctamente. | `Promise<BillResponseDto>` | No |

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
| 504 | Operación completada correctamente. | `Promise<PostingResultDto>` | No |

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
| 504 | Operación completada correctamente. | `Promise<DunningRunResponseDto>` | No |

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
| 504 | Operación completada correctamente. | `Promise<RunDueDunningResponseDto>` | No |

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

## 5. GET /billing/invoices

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Listar las facturas de la práctica
- **Operation ID:** `BillingReceivablesController_listInvoices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.listInvoices](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Listar las facturas de la práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CV-12 — facturación deja de ser el único placeholder del menú: listado de facturas de la práctica, sin ninguna acción de cobro.

### Descripción del sistema

NestJS resuelve `GET /billing/invoices` en `BillingReceivablesController_listInvoices`. El controlador delega en `InvoicesService.listByPractice`. No recibe body. El tipo de retorno estático es `Promise<ListInvoicesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Práctica (uuid) | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Facturas por página | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/invoices?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /billing/invoices?practiceId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ListInvoicesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListInvoicesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "invoiceNumber": "valor-ejemplo",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "status": "00000000-0000-4000-8000-000000000001",
      "issueDate": "2026-07-31",
      "dueDate": "2026-07-31",
      "total": "valor-ejemplo",
      "balance": "valor-ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
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
| `items` | Sí | `array<InvoiceSummaryDto>` | Sin restricción adicional declarada | Facturas de esta página, ordenadas por `id`. | `[{"id":"00000000-0000-4000-8000-000000000001","invoiceNumber":"valor-ejemplo","patientProfileId":"00000000-0000-4000-8000-000000000001","status":"00000000-0000-4000-8000-000000000001","issueDate":"2026-07-31","dueDate":"2026-07-31","total":"valor-ejemplo","balance":"valor-ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].invoiceNumber` | Sí | `string` | Sin restricción adicional declarada | Número de factura. | `valor-ejemplo` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Paciente facturado. | `00000000-0000-4000-8000-000000000001` |
| `items[].status` | Sí | `string` | formato `uuid` | Concepto de estado. | `00000000-0000-4000-8000-000000000001` |
| `items[].issueDate` | Sí | `string` | formato `date` | Fecha de emisión. | `2026-07-31` |
| `items[].dueDate` | No | `string` | formato `date` | Fecha de vencimiento, si tiene. | `2026-07-31` |
| `items[].total` | No | `string` | Sin restricción adicional declarada | Importe total. | `valor-ejemplo` |
| `items[].balance` | No | `string` | Sin restricción adicional declarada | Saldo pendiente. | `valor-ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha de alta. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/invoices"
}
```

---

## 6. POST /billing/invoices:issue-from-encounter

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
| `lines[].quantity` | Sí | `string` | patrón runtime `QUANTITY_PATTERN` | Cantidad | `1` |
| `lines[].unitPrice` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Precio unitario | `100.00` |
| `lines[].discount` | No | `string` | patrón runtime `MONEY_PATTERN` | Descuento de línea | `0.00` |
| `lines[].taxCodeId` | No | `string` | formato `uuid` | Código de impuesto (billing.tax_codes) | `00000000-0000-4000-8000-000000000001` |
| `lines[].taxAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Monto de impuesto de la línea | `0.00` |
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
| 504 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |

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
| 404 | `NOT_FOUND` | INVOICE_ENCOUNTER_NOT_FOUND.message | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 409 | `CONFLICT` | El número de factura ya existe en la práctica | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Los servicios con seguro se facturan al paciente desde la solicitud de seguro, con su parte calculada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
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

## 7. GET /billing/invoices/{id}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Detalle de una factura, con sus líneas
- **Operation ID:** `BillingReceivablesController_getInvoice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.getInvoice](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Detalle de una factura, con sus líneas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CV-12 — detalle de una factura con sus líneas.

### Descripción del sistema

NestJS resuelve `GET /billing/invoices/{id}` en `BillingReceivablesController_getInvoice`. El controlador delega en `InvoicesService.getDetail`. No recibe body. El tipo de retorno estático es `Promise<InvoiceDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Práctica (uuid) | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/invoices/00000000-0000-4000-8000-000000000001?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/invoices/00000000-0000-4000-8000-000000000001?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<InvoiceDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InvoiceDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "lines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo",
      "quantity": "valor-ejemplo",
      "unitPrice": "valor-ejemplo",
      "discount": "valor-ejemplo",
      "taxAmount": "valor-ejemplo",
      "lineTotal": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `lines` | Sí | `array<InvoiceLineDto>` | Sin restricción adicional declarada | Líneas de la factura. | `[{"id":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo","quantity":"valor-ejemplo","unitPrice":"valor-ejemplo","discount":"valor-ejemplo","taxAmount":"valor-ejemplo","lineTotal":"valor-ejemplo"}]` |
| `lines[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `lines[].description` | No | `string` | Sin restricción adicional declarada | Descripción de la línea. | `Texto descriptivo de ejemplo` |
| `lines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Cantidad facturada. | `valor-ejemplo` |
| `lines[].unitPrice` | Sí | `string` | Sin restricción adicional declarada | Precio unitario. | `valor-ejemplo` |
| `lines[].discount` | No | `string` | Sin restricción adicional declarada | Descuento de la línea, si tiene. | `valor-ejemplo` |
| `lines[].taxAmount` | No | `string` | Sin restricción adicional declarada | Impuesto de la línea, si tiene. | `valor-ejemplo` |
| `lines[].lineTotal` | No | `string` | Sin restricción adicional declarada | Importe total de la línea. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Factura no encontrada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/invoices/{id}"
}
```

---

## 8. POST /billing/invoices/{id}:credit-note

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
| `lines[].quantity` | Sí | `string` | patrón runtime `QUANTITY_PATTERN` | Cantidad (positiva; se invierte el signo del total) | `1` |
| `lines[].unitPrice` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Precio unitario a revertir | `100.00` |
| `lines[].taxAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Impuesto a revertir | `0.00` |

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
| 504 | Operación completada correctamente. | `Promise<InvoiceResponseDto>` | No |

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
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La nota de crédito debe revertir un importe positivo | Excepción explícita en src/modules/billing/services/invoices.service.ts |
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

## 9. POST /billing/kpi-snapshots:compute

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
| 504 | Operación completada correctamente. | `Promise<KpiSnapshotResponseDto>` | No |

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

## 10. GET /billing/patient-statements

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-receivables`
- **Nombre:** Listar los estados de cuenta de la práctica
- **Operation ID:** `BillingReceivablesController_listStatements`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingReceivablesController.listStatements](../../src/modules/billing/controllers/billing-receivables.controller.ts)

### Descripción de negocio

Listar los estados de cuenta de la práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CV-12 — estados de cuenta de la práctica, sólo lectura.

### Descripción del sistema

NestJS resuelve `GET /billing/patient-statements` en `BillingReceivablesController_listStatements`. El controlador delega en `PatientStatementsService.listByPractice`. No recibe body. El tipo de retorno estático es `Promise<ListPatientStatementsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | query | Sí | `string` | Sin restricción adicional declarada | Práctica (uuid) | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Estados de cuenta por página | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/patient-statements?practiceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /billing/patient-statements?practiceId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ListPatientStatementsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListPatientStatementsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
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
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PatientStatementResponseDto>` | Sin restricción adicional declarada | Estados de cuenta de esta página, ordenados por `id`. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","periodStart":"valor-ejemplo","periodEnd":"valor-ejemplo","openingBalance":"valor-ejemplo","charges":"valor-ejemplo","payments":"valor-ejemplo","closingBalance":"valor-ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].periodStart` | Sí | `string` | Sin restricción adicional declarada | Valor de period start mantenido por la instancia. | `valor-ejemplo` |
| `items[].periodEnd` | Sí | `string` | Sin restricción adicional declarada | Valor de period end mantenido por la instancia. | `valor-ejemplo` |
| `items[].openingBalance` | Sí | `string` | Sin restricción adicional declarada | Valor de opening balance mantenido por la instancia. | `valor-ejemplo` |
| `items[].charges` | Sí | `string` | Sin restricción adicional declarada | Valor de charges mantenido por la instancia. | `valor-ejemplo` |
| `items[].payments` | Sí | `string` | Sin restricción adicional declarada | Valor de payments mantenido por la instancia. | `valor-ejemplo` |
| `items[].closingBalance` | Sí | `string` | Sin restricción adicional declarada | Valor de closing balance mantenido por la instancia. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/patient-statements.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/patient-statements"
}
```

---

## 11. POST /billing/patient-statements:generate

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
| 504 | Operación completada correctamente. | `Promise<PatientStatementResponseDto>` | No |

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

## 12. POST /billing/payment-plans

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
| `installments[].amount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Importe de la cuota | `25.00` |

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
| 504 | Operación completada correctamente. | `Promise<PaymentPlanResponseDto>` | No |

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
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La factura origen no tiene saldo | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | Cada cuota del plan debe ser un importe positivo | Excepción explícita en src/modules/billing/services/invoices.service.ts |
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

## 13. POST /billing/payments-made:execute

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
| `amount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto total del pago | `100.00` |
| `methodConceptId` | No | `string` | formato `uuid` | Método de pago (concepto); por defecto transferencia | `00000000-0000-4000-8000-000000000001` |
| `paidAt` | No | `string` | formato `date-time` | Fecha de pago (ISO) | `2026-07-31T12:00:00.000Z` |
| `companyBankAccountId` | No | `string` | formato `uuid` | Cuenta bancaria origen (accounting.company_bank_accounts) | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<PayableAllocationInputDto>` | mínimo 1 elemento(s) | Asignaciones por factura (al menos una) | `[{"billId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"100.00","discountAmount":"0.00","withholdingAmount":"0.00","openItemId":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].billId` | Sí | `string` | formato `uuid` | Factura de proveedor destino (billing.bills) | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto asignado | `100.00` |
| `allocations[].discountAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Descuento | `0.00` |
| `allocations[].withholdingAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Retención (withholding) | `0.00` |
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
| 504 | Operación completada correctamente. | `Promise<PaymentMadeResponseDto>` | No |

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
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto del pago debe ser positivo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación debe ser un importe positivo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | El descuento debe ser un importe no negativo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
| 422 | `PRECONDITION_FAILED` | La retención debe ser un importe no negativo | Excepción explícita en src/modules/billing/services/payments-made.service.ts |
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

## 14. POST /billing/payments-received:apply

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
| `amount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto total recibido | `50.00` |
| `methodConceptId` | No | `string` | formato `uuid` | Método de pago (concepto); por defecto efectivo | `00000000-0000-4000-8000-000000000001` |
| `receivedAt` | No | `string` | formato `date-time` | Fecha de recepción (ISO) | `2026-07-31T12:00:00.000Z` |
| `reference` | No | `string` | longitud máxima 120 | Referencia externa (voucher, txn) | `valor-ejemplo` |
| `companyBankAccountId` | No | `string` | formato `uuid` | Cuenta bancaria receptora (accounting.company_bank_accounts) | `00000000-0000-4000-8000-000000000001` |
| `allocations` | Sí | `array<ReceivableAllocationInputDto>` | mínimo 1 elemento(s) | Asignaciones por factura (al menos una) | `[{"invoiceId":"00000000-0000-4000-8000-000000000001","allocatedAmount":"50.00","discountAmount":"0.00","openItemId":"00000000-0000-4000-8000-000000000001"}]` |
| `allocations[].invoiceId` | Sí | `string` | formato `uuid` | Factura destino (billing.invoices) | `00000000-0000-4000-8000-000000000001` |
| `allocations[].allocatedAmount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto asignado a la factura | `50.00` |
| `allocations[].discountAmount` | No | `string` | patrón runtime `MONEY_PATTERN` | Descuento por pronto pago | `0.00` |
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
| 504 | Operación completada correctamente. | `Promise<PaymentReceivedResponseDto>` | No |

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
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto del pago debe ser positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación debe ser un importe positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | El descuento debe ser un importe no negativo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma asignada excede el monto del pago | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | El cobro está en pausa mientras el paciente tenga una objeción abierta | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
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

## 15. POST /billing/reconciliation:clear

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
| 504 | Operación completada correctamente. | `Promise<ReconciliationResultDto>` | No |

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

## 16. POST /billing/reimbursements:link

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
| `amount` | Sí | `string` | patrón runtime `MONEY_PATTERN` | Monto reembolsado por la aseguradora | `30.00` |
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
| 504 | Operación completada correctamente. | `Promise<ReimbursementResponseDto>` | No |

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
| 409 | `CONFLICT` | El reclamo ya tiene un reembolso registrado | Excepción explícita en src/modules/billing/services/reimbursements.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El monto del reembolso debe ser positivo | Excepción explícita en src/modules/billing/services/reimbursements.service.ts |
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

## 17. GET /billing/service-catalog

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
| 504 | Consulta completada correctamente. | `Promise<SearchServiceCatalogResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchServiceCatalogResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "descriptionText": "Texto descriptivo de ejemplo",
      "termsText": "valor-ejemplo",
      "imageFileId": "00000000-0000-4000-8000-000000000001",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "defaultPrice": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "currencyCode": "BOB",
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
| `items` | Sí | `array<ServiceCatalogItemDto>` | Sin restricción adicional declarada | Servicios de esta página, ordenados por código. | `[{"id":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","descriptionText":"Texto descriptivo de ejemplo","termsText":"valor-ejemplo","imageFileId":"00000000-0000-4000-8000-000000000001","serviceConceptId":"00000000-0000-4000-8000-000000000001","defaultPrice":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001","currencyCode":"BOB","taxCodeId":"00000000-0000-4000-8000-000000000001","incomeAccountId":"00000000-0000-4000-8000-000000000001","isActive":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].descriptionText` | No | `string` | Sin restricción adicional declarada | Valor de description text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `items[].termsText` | No | `string` | Sin restricción adicional declarada | Términos propios del servicio (carril 22). Ausente = usa los términos por defecto, cuyo texto legal provee el propietario. | `valor-ejemplo` |
| `items[].imageFileId` | No | `string` | formato `uuid` | Identificador asociado a image file. Es el id de un archivo de `common.files`, no una URL. Quién puede leer ese contenido lo decide `common.files`, y hoy sólo lo entrega a quien lo subió o a un rol de revisión. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Valor de default price mantenido por la instancia. | `valor-ejemplo` |
| `items[].currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].currencyCode` | No | `string` | Sin restricción adicional declarada | Sigla de la moneda | `BOB` |
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

## 18. POST /billing/service-catalog

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Dar de alta un servicio en el catálogo maestro
- **Operation ID:** `BillingServiceCatalogController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.create](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

La administración lo da de alta en cualquier práctica de su organización; un profesional, sólo en su consultorio propio.

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Práctica (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 120 | Código interno del servicio | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre del servicio | `Nombre de ejemplo` |
| `descriptionText` | No | `string` | longitud máxima 2000 | Descripción larga del servicio, para la tarjeta | `Texto descriptivo de ejemplo` |
| `imageFileId` | No | `string` | formato `uuid` | Imagen del servicio (`common.files`) | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Concepto de clasificación del servicio | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | patrón runtime `PRICE_PATTERN` | Precio de referencia; cada doctor puede cotizar otro precio | `100.00` |
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
  "descriptionText": "Texto descriptivo de ejemplo",
  "imageFileId": "00000000-0000-4000-8000-000000000001",
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
| 504 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceCatalogItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "imageFileId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
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
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Valor de description text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Términos propios del servicio (carril 22). Ausente = usa los términos por defecto, cuyo texto legal provee el propietario. | `valor-ejemplo` |
| `imageFileId` | No | `string` | formato `uuid` | Identificador asociado a image file. Es el id de un archivo de `common.files`, no una URL. Quién puede leer ese contenido lo decide `common.files`, y hoy sólo lo entrega a quien lo subió o a un rol de revisión. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Valor de default price mantenido por la instancia. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sigla de la moneda | `BOB` |
| `taxCodeId` | No | `string` | formato `uuid` | Identificador asociado a tax code. | `00000000-0000-4000-8000-000000000001` |
| `incomeAccountId` | No | `string` | formato `uuid` | Identificador asociado a income account. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
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

## 19. PATCH /billing/service-catalog/{id}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Corregir un servicio del catálogo de mi práctica
- **Operation ID:** `BillingServiceCatalogController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.update](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Corregir un servicio del catálogo de mi práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Corrige un servicio del catálogo de una práctica propia. Los roles son más anchos que los del alta a propósito: quien atiende pone el precio de lo que ofrece en **su** práctica, y la cuenta administradora corrige lo que dio de alta. El alcance no lo decide el rol sino la vinculación —o el tenant—, y se comprueba en el servicio; un servicio de otra práctica responde **404**, igual que uno inexistente.

### Descripción del sistema

NestJS resuelve `PATCH /billing/service-catalog/{id}` en `BillingServiceCatalogController_update`. El controlador delega en `BillingServiceCatalogService.update`. Valida el body como `UpdateServiceCatalogItemDto` y consume `application/json`. El tipo de retorno estático es `Promise<ServiceCatalogItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateServiceCatalogItemDto`; los campos opcionales se omiten.

```http
PATCH /billing/service-catalog/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | No | `string` | longitud máxima 200 | Nombre del servicio | `Nombre de ejemplo` |
| `defaultPrice` | No | `string` | patrón runtime `PRICE_PATTERN` | Precio de referencia del servicio | `150.00` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda del precio (concepto). Sólo se acepta junto con `defaultPrice` | `00000000-0000-4000-8000-000000000001` |
| `isActive` | No | `boolean` | Sin restricción adicional declarada | Si el servicio sigue disponible para cotizar | `true` |
| `termsText` | No | `string` | longitud máxima 20000; admite null | Términos propios del servicio. null vuelve a los términos por defecto | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /billing/service-catalog/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "defaultPrice": "150.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "isActive": true,
  "termsText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ServiceCatalogItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceCatalogItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "descriptionText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "imageFileId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "defaultPrice": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "currencyCode": "BOB",
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
| `descriptionText` | No | `string` | Sin restricción adicional declarada | Valor de description text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `termsText` | No | `string` | Sin restricción adicional declarada | Términos propios del servicio (carril 22). Ausente = usa los términos por defecto, cuyo texto legal provee el propietario. | `valor-ejemplo` |
| `imageFileId` | No | `string` | formato `uuid` | Identificador asociado a image file. Es el id de un archivo de `common.files`, no una URL. Quién puede leer ese contenido lo decide `common.files`, y hoy sólo lo entrega a quien lo subió o a un rol de revisión. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `defaultPrice` | Sí | `string` | Sin restricción adicional declarada | Valor de default price mantenido por la instancia. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Identificador asociado a currency concept. | `00000000-0000-4000-8000-000000000001` |
| `currencyCode` | No | `string` | Sin restricción adicional declarada | Sigla de la moneda | `BOB` |
| `taxCodeId` | No | `string` | formato `uuid` | Identificador asociado a tax code. | `00000000-0000-4000-8000-000000000001` |
| `incomeAccountId` | No | `string` | formato `uuid` | Identificador asociado a income account. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/billing/services/billing-service-catalog.service.ts |
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
  "path": "/billing/service-catalog/{id}"
}
```

---

## 20. GET /billing/service-catalog/procedure-specialties

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Listar las especialidades del nomenclador de procedimientos
- **Operation ID:** `BillingServiceCatalogController_listProcedureSpecialties`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.listProcedureSpecialties](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Listar las especialidades del nomenclador de procedimientos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Las especialidades del nomenclador de procedimientos, con su recuento. Es lo que permite dibujar el filtro **sin traer las 4408 entradas**: la pantalla pide esto una vez y después pagina dentro de la especialidad elegida. Sin `@Roles` por la misma razón que la lectura del catálogo: es un arancel de referencia público, y cualquier profesional que arme un presupuesto necesita resolverlo. Lo que sigue siendo administrativo es el **alta** del servicio.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog/procedure-specialties` en `BillingServiceCatalogController_listProcedureSpecialties`. El controlador delega en `ProcedureNomenclatureService.listSpecialties`. No recibe body. El tipo de retorno estático es `Promise<ProcedureSpecialtiesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog/procedure-specialties HTTP/1.1
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
GET /billing/service-catalog/procedure-specialties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ProcedureSpecialtiesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProcedureSpecialtiesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "specialty": "Cardiología",
      "count": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ProcedureSpecialtyDto>` | Sin restricción adicional declarada | Especialidades, ordenadas alfabéticamente en español. | `[{"specialty":"Cardiología","count":1}]` |
| `items[].specialty` | Sí | `string` | Sin restricción adicional declarada | Nombre de la especialidad, tal cual lo publica el arancel. | `Cardiología` |
| `items[].count` | Sí | `number` | Sin restricción adicional declarada | Cuántos procedimientos agrupa. | `1` |

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
  "path": "/billing/service-catalog/procedure-specialties"
}
```

---

## 21. GET /billing/service-catalog/procedures

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-service-catalog`
- **Nombre:** Listar el nomenclador de procedimientos (arancel de referencia)
- **Operation ID:** `BillingServiceCatalogController_searchProcedures`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingServiceCatalogController.searchProcedures](../../src/modules/billing/controllers/billing-service-catalog.controller.ts)

### Descripción de negocio

Listar el nomenclador de procedimientos (arancel de referencia). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El nomenclador de procedimientos, por cursor.

### Descripción del sistema

NestJS resuelve `GET /billing/service-catalog/procedures` en `BillingServiceCatalogController_searchProcedures`. El controlador delega en `ProcedureNomenclatureService.search`. No recibe body. El tipo de retorno estático es `Promise<ProcedureNomenclatureResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `specialty` | query | No | `string` | Sin restricción adicional declarada | Especialidad exacta, tal cual la publica el arancel | `valor-ejemplo` |
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el nombre del procedimiento | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Entradas por página | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/service-catalog/procedures HTTP/1.1
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
GET /billing/service-catalog/procedures?specialty=valor-ejemplo&q=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ProcedureNomenclatureResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProcedureNomenclatureResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL",
      "display": "General",
      "specialty": "Auditoría Médica",
      "group": "I",
      "referencePrice": 150,
      "priceUnit": "UMA",
      "ocrSuspect": true
    }
  ],
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ProcedureNomenclatureItemDto>` | Sin restricción adicional declarada | Entradas de esta página. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL","display":"General","specialty":"Auditoría Médica","group":"I","referencePrice":150,"priceUnit":"UMA","ocrSuspect":true}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Concepto de terminología que representa el procedimiento. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del arancel, tal cual lo publica el documento de origen. | `procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre del procedimiento. | `General` |
| `items[].specialty` | Sí | `string` | admite null | Especialidad bajo la que el arancel lo agrupa. | `Auditoría Médica` |
| `items[].group` | Sí | `string` | admite null | Grupo dentro de la especialidad, si el arancel lo declara. | `I` |
| `items[].referencePrice` | Sí | `string` | admite null | Precio de referencia, como cadena. **Es de referencia y de una unidad que puede no ser dinero**: ver . No se convierte a moneda acá — el factor de conversión de la UMA no está declarado en ninguna parte del producto. | `150` |
| `items[].priceUnit` | Sí | `string` | admite null | Unidad del precio: `UMA` o `USD`. `UMA` **no es una moneda**: es la unidad de cuenta del arancel de honorarios de Santa Cruz. Viaja tal cual para que quien importe sepa qué está copiando. | `UMA` |
| `items[].ocrSuspect` | Sí | `boolean` | Sin restricción adicional declarada | Si el texto de origen necesita revisión humana. Son las 228 entradas que salieron dañadas del reconocimiento óptico del arancel —se ven a simple vista: «Angioplastia periférica por balén»—. El catálogo las marca y la pantalla tiene que avisarlo: importar una de éstas en silencio mete un nombre y un precio dudosos en la lista de un profesional. | `true` |
| `nextCursor` | Sí | `string` | admite null | Cursor de la página siguiente, o `null` si esta es la última. | `valor-ejemplo` |

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
  "path": "/billing/service-catalog/procedures"
}
```

---

## 22. GET /billing/simulated/catalogs

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Catálogos paramétricos del SIAT simulado
- **Operation ID:** `BillingSimulatedController_catalogs`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.catalogs](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Catálogos paramétricos del SIAT simulado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/catalogs` en `BillingSimulatedController_catalogs`. El controlador delega en `BillingSimulatedService.catalogs`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/catalogs HTTP/1.1
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
GET /billing/simulated/catalogs HTTP/1.1
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
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/catalogs"
}
```

---

## 23. GET /billing/simulated/charges

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Cobros de consultas (opcionalmente de una persona)
- **Operation ID:** `BillingSimulatedController_charges`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.charges](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Cobros de consultas (opcionalmente de una persona). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/charges` en `BillingSimulatedController_charges`. El controlador delega en `BillingSimulatedService.listCharges`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/charges?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/simulated/charges?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/charges"
}
```

---

## 24. POST /billing/simulated/charges/{chargeId}/instances/{instanceId}/payments

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Pago de una instancia de plan (no soportado: 409 NOT_A_PLAN)
- **Operation ID:** `BillingSimulatedController_instancePayment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.instancePayment](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Pago de una instancia de plan (no soportado: 409 NOT_A_PLAN). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/charges/{chargeId}/instances/{instanceId}/payments` en `BillingSimulatedController_instancePayment`. El controlador delega en `BillingSimulatedService.registerInstancePayment`. Valida el body como `SimulatedInstancePaymentDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `chargeId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `instanceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedInstancePaymentDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/instances/00000000-0000-4000-8000-000000000001/payments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "methodCode": 1,
  "amount": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `methodCode` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Decimal en texto | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/instances/00000000-0000-4000-8000-000000000001/payments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "methodCode": 1,
  "amount": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 409 | `CONFLICT` | El servicio es de una sola instancia: se cobra y se factura de una vez | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
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
  "path": "/billing/simulated/charges/{chargeId}/instances/{instanceId}/payments"
}
```

---

## 25. POST /billing/simulated/charges/{chargeId}/invoices

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Emitir la factura SIAT simulada de un cobro pagado
- **Operation ID:** `BillingSimulatedController_issue`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.issue](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Emitir la factura SIAT simulada de un cobro pagado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/charges/{chargeId}/invoices` en `BillingSimulatedController_issue`. El controlador delega en `BillingSimulatedService.issueInvoice`. Valida el body como `SimulatedIssueInvoiceDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `chargeId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedIssueInvoiceDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/invoices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "buyer": {
    "name": "Nombre de ejemplo",
    "documentTypeCode": 1,
    "documentNumber": "valor-ejemplo"
  }
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `buyer` | Sí | `SimulatedBuyerDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","documentTypeCode":1,"documentNumber":"valor-ejemplo","complement":{},"email":{}}` |
| `buyer.name` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `buyer.documentTypeCode` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `buyer.documentNumber` | Sí | `string` | longitud máxima 20 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `buyer.complement` | No | `object` | longitud máxima 5 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `buyer.email` | No | `object` | longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `additionalDiscount` | No | `object` | Sin restricción adicional declarada | Descuento adicional, decimal en texto | `{}` |
| `simulation` | No | `SimulatedSimulationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"forceMessageCode":1}` |
| `simulation.forceMessageCode` | No | `number` | Sin restricción adicional declarada | Sólo simulador: forzar un mensaje del catálogo oficial | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/invoices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "buyer": {
    "name": "Nombre de ejemplo",
    "documentTypeCode": 1,
    "documentNumber": "valor-ejemplo",
    "complement": {},
    "email": {}
  },
  "additionalDiscount": {},
  "simulation": {
    "forceMessageCode": 1
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 409 | `CONFLICT` | El cobro ya tiene la factura ${String(vigente[0]['n'])} vigente | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El cobro todavía no está pagado | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/charges/{chargeId}/invoices"
}
```

---

## 26. POST /billing/simulated/charges/{chargeId}/payment

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Registrar el pago real de un cobro
- **Operation ID:** `BillingSimulatedController_payment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.payment](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Registrar el pago real de un cobro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/charges/{chargeId}/payment` en `BillingSimulatedController_payment`. El controlador delega en `BillingSimulatedService.registerPayment`. Valida el body como `SimulatedRegisterPaymentDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `chargeId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedRegisterPaymentDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/payment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "methodCode": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `methodCode` | Sí | `number` | Sin restricción adicional declarada | Código del catálogo SIMULADO de métodos de pago | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/charges/00000000-0000-4000-8000-000000000001/payment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "methodCode": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | INVOICE_ENCOUNTER_NOT_FOUND.message | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 409 | `CONFLICT` | El cobro ya está pagado | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 409 | `CONFLICT` | El número de factura ya existe en la práctica | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La consulta no tiene precio: defina el precio del servicio «${cobro.catalogName}» en el catálogo de servicios de la práctica | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 422 | `PRECONDITION_FAILED` | Los servicios con seguro se facturan al paciente desde la solicitud de seguro, con su parte calculada | Excepción explícita en src/modules/billing/services/invoices.service.ts |
| 422 | `PRECONDITION_FAILED` | El monto del pago debe ser positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación debe ser un importe positivo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | El descuento debe ser un importe no negativo | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | La suma asignada excede el monto del pago | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
| 422 | `PRECONDITION_FAILED` | El cobro está en pausa mientras el paciente tenga una objeción abierta | Excepción explícita en src/modules/billing/services/payments-received.service.ts |
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
  "path": "/billing/simulated/charges/{chargeId}/payment"
}
```

---

## 27. GET /billing/simulated/invoices/{invoiceId}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Una factura simulada, dentro del alcance de quien la pide
- **Operation ID:** `BillingSimulatedController_invoice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.invoice](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Una factura simulada, dentro del alcance de quien la pide. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/invoices/{invoiceId}` en `BillingSimulatedController_invoice`. El controlador delega en `BillingSimulatedService.invoice`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/invoices/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/simulated/invoices/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/invoices/{invoiceId}"
}
```

---

## 28. POST /billing/simulated/invoices/{invoiceId}/annulment

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Anular la factura (sólo administración)
- **Operation ID:** `BillingSimulatedController_annul`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.annul](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Anular la factura (sólo administración). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/invoices/{invoiceId}/annulment` en `BillingSimulatedController_annul`. El controlador delega en `BillingSimulatedService.annul`. Valida el body como `SimulatedAnnulDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedAnnulDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/annulment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonCode": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reasonCode` | Sí | `number` | Sin restricción adicional declarada | Motivo del catálogo SIMULADO de anulación | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/annulment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonCode": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
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
  "path": "/billing/simulated/invoices/{invoiceId}/annulment"
}
```

---

## 29. POST /billing/simulated/invoices/{invoiceId}/annulment-reversal

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Revertir la anulación (sólo administración)
- **Operation ID:** `BillingSimulatedController_revert`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.revert](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Revertir la anulación (sólo administración). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/invoices/{invoiceId}/annulment-reversal` en `BillingSimulatedController_revert`. El controlador delega en `BillingSimulatedService.revertAnnulment`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/annulment-reversal HTTP/1.1
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
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/annulment-reversal HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/invoices/{invoiceId}/annulment-reversal"
}
```

---

## 30. POST /billing/simulated/invoices/{invoiceId}/email

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Encolar el envío (simulado, no se envía) de la factura
- **Operation ID:** `BillingSimulatedController_email`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.email](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Encolar el envío (simulado, no se envía) de la factura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /billing/simulated/invoices/{invoiceId}/email` en `BillingSimulatedController_email`. El controlador delega en `BillingSimulatedService.email`. Valida el body como `SimulatedEmailDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulatedEmailDto`; los campos opcionales se omiten.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/email HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "to": "paciente@correo.com"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `to` | Sí | `string` | longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `paciente@correo.com` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /billing/simulated/invoices/00000000-0000-4000-8000-000000000001/email HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "to": "paciente@correo.com"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
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
  "path": "/billing/simulated/invoices/{invoiceId}/email"
}
```

---

## 31. GET /billing/simulated/my-invoices

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Mis facturas: recibidas (paciente) o emitidas (quien factura)
- **Operation ID:** `BillingSimulatedController_myInvoices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.myInvoices](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Mis facturas: recibidas (paciente) o emitidas (quien factura). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/my-invoices` en `BillingSimulatedController_myInvoices`. El controlador delega en `BillingSimulatedService.myInvoices`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/my-invoices HTTP/1.1
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
GET /billing/simulated/my-invoices HTTP/1.1
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
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/my-invoices"
}
```

---

## 32. GET /billing/simulated/my-invoices/{invoiceId}

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Una de mis facturas
- **Operation ID:** `BillingSimulatedController_myInvoice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.myInvoice](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Una de mis facturas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/my-invoices/{invoiceId}` en `BillingSimulatedController_myInvoice`. El controlador delega en `BillingSimulatedService.myInvoice`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `invoiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/my-invoices/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /billing/simulated/my-invoices/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/my-invoices/{invoiceId}"
}
```

---

## 33. GET /billing/simulated/outbox

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Bandeja de correo simulada (sólo administración)
- **Operation ID:** `BillingSimulatedController_outbox`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.outbox](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Bandeja de correo simulada (sólo administración). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/outbox` en `BillingSimulatedController_outbox`. El controlador delega en `BillingSimulatedService.outbox`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/outbox HTTP/1.1
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
GET /billing/simulated/outbox HTTP/1.1
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
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la administración de la clínica puede hacer esto | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/outbox"
}
```

---

## 34. GET /billing/simulated/status

- **Módulo:** `billing`
- **Etiqueta OpenAPI:** `billing-simulated`
- **Nombre:** Estado fiscal simulado: emisores y credenciales sintéticas
- **Operation ID:** `BillingSimulatedController_status`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BillingSimulatedController.status](../../src/modules/billing/controllers/billing-simulated.controller.ts)

### Descripción de negocio

Estado fiscal simulado: emisores y credenciales sintéticas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /billing/simulated/status` en `BillingSimulatedController_status`. El controlador delega en `BillingSimulatedService.status`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /billing/simulated/status HTTP/1.1
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
GET /billing/simulated/status HTTP/1.1
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
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Su rol no permite operar la facturación | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 404 | `NOT_FOUND` | La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false) | Excepción explícita en src/modules/billing/services/billing-simulated.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/billing/simulated/status"
}
```

---

