<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `billing`

- **Bloque:** Financiero y ERP (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)
- **Operaciones:** 15 (15 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 13 · BAJO 2
- **Tablas distintas que tocan:** 17
- **Respuestas de error y detalle contractual:** `openapi/endpoints/billing.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/billing/bills` | Registrar factura de proveedor con three-way match | MEDIO | 5 | SECURITY_ADMIN |
| 2 | POST | `/billing/documents/{id}:post-to-ledger` | Contabilizar documento (posting CxC/CxP) | BAJO | 4 | SECURITY_ADMIN |
| 3 | POST | `/billing/dunning-runs:execute` | Ejecutar ciclo de morosidad (dunning) | MEDIO | 6 | SECURITY_ADMIN |
| 4 | POST | `/billing/internal/dunning-runs/run-due` | Evaluar y disparar morosidad automática por tenant | MEDIO | 7 | SYSTEM, SECURITY_ADMIN |
| 5 | POST | `/billing/invoices:issue-from-encounter` | Emitir factura desde los cargos del encuentro | MEDIO | 4 | SECURITY_ADMIN |
| 6 | POST | `/billing/invoices/{id}:credit-note` | Emitir nota de crédito / castigo sobre una factura | MEDIO | 5 | SECURITY_ADMIN |
| 7 | POST | `/billing/kpi-snapshots:compute` | Calcular snapshot de KPI financiero y aging | MEDIO | 2 | SECURITY_ADMIN |
| 8 | POST | `/billing/patient-statements:generate` | Generar el estado de cuenta del paciente | MEDIO | 4 | SECURITY_ADMIN |
| 9 | POST | `/billing/payment-plans` | Configurar un plan de pagos del paciente | MEDIO | 4 | SECURITY_ADMIN |
| 10 | POST | `/billing/payments-made:execute` | Ejecutar pago a proveedor con asignación | MEDIO | 4 | SECURITY_ADMIN |
| 11 | POST | `/billing/payments-received:apply` | Aplicar un pago recibido con asignación multi-factura | MEDIO | 4 | SECURITY_ADMIN |
| 12 | POST | `/billing/reconciliation:clear` | Conciliar pagos vía documento de compensación | MEDIO | 4 | SECURITY_ADMIN |
| 13 | POST | `/billing/reimbursements:link` | Vincular reembolso de reclamo de seguro a la factura | MEDIO | 5 | SECURITY_ADMIN |
| 14 | GET | `/billing/service-catalog` | Listar el catálogo de servicios de la práctica | BAJO | 1 | sesión (sin roles) |
| 15 | POST | `/billing/service-catalog` | Dar de alta un servicio en el catálogo maestro | MEDIO | 2 | SECURITY_ADMIN |

---

## 1. POST /billing/bills

- **Origen:** CONTRATO
- **Nombre:** Registrar factura de proveedor con three-way match
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingPayablesController.registerBill` — `src/modules/billing/controllers/billing-payables.controller.ts:32`

### Qué es y para qué sirve (negocio)

Registrar factura de proveedor con three-way match. Caso de uso UC-17-04: BillsService.register. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:14`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/bills` la atiende `BillingPayablesController.registerBill` (src/modules/billing/controllers/billing-payables.controller.ts:32). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RegisterBillDto` (19 campos, 6 obligatorios). Delega en `BillsService.register`. Crea filas en billing.bill_lines, billing.billing_document_links, billing.bills. Lee billing.bills, billing.vendors.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-payables.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.bill_lines` | ESCRIBE | CREA | DIRECTA | BillingPayablesController.registerBill → BillsService.register → BillsRepository.createLine | `src/modules/billing/repositories/bills.repository.ts:209` |
| `billing.billing_document_links` | ESCRIBE | CREA | DIRECTA | BillingPayablesController.registerBill → BillsService.register → BillingDocumentLinksRepository.create | `src/modules/billing/repositories/document-links.repository.ts:66` |
| `billing.bills` | ESCRIBE | CREA | DIRECTA | BillingPayablesController.registerBill → BillsService.register → BillsRepository.create | `src/modules/billing/repositories/bills.repository.ts:177` |
| `billing.bills` | LEE | LEE | DIRECTA | BillingPayablesController.registerBill → BillsService.register → BillsRepository.findByNumber | `src/modules/billing/repositories/bills.repository.ts:155` |
| `billing.vendors` | LEE | LEE | DIRECTA | BillingPayablesController.registerBill → BillsService.register → BillsRepository.findVendor | `src/modules/billing/repositories/bills.repository.ts:166` |

### Cuerpo — DTO `RegisterBillDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica (practice.practices) | `src/modules/billing/dto/bill.dto.ts:114` |
| `vendorId` | `string` | Sí | formato uuid | `@IsUUID()` | Proveedor (billing.vendors) | `src/modules/billing/dto/bill.dto.ts:121` |
| `billNumber` | `string` | Sí | longitud máxima 60 | `@IsString()` `@MaxLength(60)` | Número de factura del proveedor | `src/modules/billing/dto/bill.dto.ts:129` |
| `issueDate` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de emisión (ISO); por defecto hoy | `src/modules/billing/dto/bill.dto.ts:139` |
| `dueDate` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de vencimiento (ISO) | `src/modules/billing/dto/bill.dto.ts:147` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Moneda (concepto) | `src/modules/billing/dto/bill.dto.ts:155` |
| `purchaseOrderId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden de compra (erp.purchase_orders) | `src/modules/billing/dto/bill.dto.ts:166` |
| `contractId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contrato (erp.contracts) | `src/modules/billing/dto/bill.dto.ts:177` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant (directory.tenants); requerido para el vínculo de documento | `src/modules/billing/dto/bill.dto.ts:189` |
| `lines` | `array<BillLineInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => BillLineInputDto)` | Líneas (al menos una) | `src/modules/billing/dto/bill.dto.ts:202` |
| `lines[].description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Descripción de la línea | `src/modules/billing/dto/bill.dto.ts:24` |
| `lines[].quantity` | `string` | Sí | — | `@IsNumberString()` | Cantidad | `src/modules/billing/dto/bill.dto.ts:31` |
| `lines[].unitPrice` | `string` | Sí | — | `@IsNumberString()` | Precio unitario | `src/modules/billing/dto/bill.dto.ts:38` |
| `lines[].taxAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto de impuesto de la línea | `src/modules/billing/dto/bill.dto.ts:49` |
| `lines[].expenseAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta de gasto (accounting.accounts) | `src/modules/billing/dto/bill.dto.ts:60` |
| `lines[].costCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Centro de costo (accounting.cost_centers) | `src/modules/billing/dto/bill.dto.ts:71` |
| `lines[].purchaseOrderItemId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ítem de orden de compra (erp.purchase_order_items) | `src/modules/billing/dto/bill.dto.ts:82` |
| `lines[].goodsReceiptItemId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ítem de recepción de bienes (erp.goods_receipt_items) | `src/modules/billing/dto/bill.dto.ts:93` |
| `lines[].serviceEntryItemId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ítem de hoja de servicio (erp.service_entry_items) | `src/modules/billing/dto/bill.dto.ts:104` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<BillResponseDto>` · DTO `BillResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/bill.dto.ts:211` |
| `billNumber` | `string` | Sí | — | — | Valor de bill number mantenido por la instancia. | `src/modules/billing/dto/bill.dto.ts:217` |
| `vendorId` | `string` | Sí | formato uuid | — | Identificador asociado a vendor. | `src/modules/billing/dto/bill.dto.ts:223` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/billing/dto/bill.dto.ts:229` |
| `subtotal` | `string` | No | — | — | Valor de subtotal mantenido por la instancia. | `src/modules/billing/dto/bill.dto.ts:235` |
| `taxTotal` | `string` | No | — | — | Valor de tax total mantenido por la instancia. | `src/modules/billing/dto/bill.dto.ts:241` |
| `total` | `string` | No | — | — | Valor de total mantenido por la instancia. | `src/modules/billing/dto/bill.dto.ts:247` |
| `balance` | `string` | No | — | — | Valor de balance mantenido por la instancia. | `src/modules/billing/dto/bill.dto.ts:253` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/billing/dto/bill.dto.ts:259` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-payables.controller.spec.ts:33` |

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /billing/documents/{id}:post-to-ledger

- **Origen:** CONTRATO
- **Nombre:** Contabilizar documento (posting CxC/CxP)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingOperationsController.postToLedger` — `src/modules/billing/controllers/billing-operations.controller.ts:55`

### Qué es y para qué sirve (negocio)

Contabilizar documento (posting CxC/CxP). Caso de uso UC-17-06: LedgerService.postToLedger. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:16`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/documents/{id}:post-to-ledger` la atiende `BillingOperationsController.postToLedger` (src/modules/billing/controllers/billing-operations.controller.ts:55). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PostToLedgerDto` (2 campos, 2 obligatorios). Delega en `LedgerService.postToLedger`. Lee billing.bills, billing.invoices, billing.payments_made, billing.payments_received.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-operations.controller.ts:55` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/billing/controllers/billing-operations.controller.ts:55` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.bills` | LEE | LEE | DIRECTA | BillingOperationsController.postToLedger → LedgerService.postToLedger → LedgerService.loadDocument → BillsRepository.findById | `src/modules/billing/repositories/bills.repository.ts:137` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingOperationsController.postToLedger → LedgerService.postToLedger → LedgerService.loadDocument → InvoicesRepository.findById | `src/modules/billing/repositories/invoices.repository.ts:137` |
| `billing.payments_made` | LEE | LEE | DIRECTA | BillingOperationsController.postToLedger → LedgerService.postToLedger → LedgerService.loadDocument → PaymentsMadeRepository.findById | `src/modules/billing/repositories/payments-made.repository.ts:93` |
| `billing.payments_received` | LEE | LEE | DIRECTA | BillingOperationsController.postToLedger → LedgerService.postToLedger → LedgerService.loadDocument → PaymentsReceivedRepository.findById | `src/modules/billing/repositories/payments-received.repository.ts:97` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PostToLedgerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `documentType` | `string` | Sí | valores: INVOICE, BILL, PAYMENT_RECEIVED, PAYMENT_MADE | `@IsIn(['INVOICE', 'BILL', 'PAYMENT_RECEIVED', 'PAYMENT_MADE'])` | Tipo del documento origen | `src/modules/billing/dto/posting.dto.ts:18` |
| `transactionId` | `string` | Sí | formato uuid | `@IsUUID()` | Asiento contable resuelto (accounting.journal_transactions) | `src/modules/billing/dto/posting.dto.ts:28` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "documentType": "INVOICE",
  "transactionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "documentType": "INVOICE",
  "transactionId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PostingResultDto>` · DTO `PostingResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/posting.dto.ts:37` |
| `documentType` | `string` | Sí | valores: INVOICE, BILL, PAYMENT_RECEIVED, PAYMENT_MADE | — | Valor de document type mantenido por la instancia. | `src/modules/billing/dto/posting.dto.ts:45` |
| `transactionId` | `string` | Sí | formato uuid | — | Identificador asociado a transaction. | `src/modules/billing/dto/posting.dto.ts:51` |
| `posted` | `boolean` | Sí | — | — | Valor de posted mantenido por la instancia. | `src/modules/billing/dto/posting.dto.ts:57` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-operations.controller.spec.ts:42` |

### Flujos

_Se completa en la fase de flujos._

---

## 3. POST /billing/dunning-runs:execute

- **Origen:** CONTRATO
- **Nombre:** Ejecutar ciclo de morosidad (dunning)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingOperationsController.executeDunning` — `src/modules/billing/controllers/billing-operations.controller.ts:80`

### Qué es y para qué sirve (negocio)

Ejecutar ciclo de morosidad (dunning). Caso de uso UC-17-10: DunningService.execute. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/dunning-runs:execute` la atiende `BillingOperationsController.executeDunning` (src/modules/billing/controllers/billing-operations.controller.ts:80). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ExecuteDunningRunDto` (10 campos, 4 obligatorios). Delega en `DunningService.execute`. Crea filas en billing.dunning_items, billing.dunning_runs. Actualiza billing.dunning_runs, billing.invoices. Lee billing.dunning_runs, billing.invoices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-operations.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.dunning_items` | ESCRIBE | CREA | DIRECTA | BillingOperationsController.executeDunning → DunningService.execute → DunningRepository.createItem | `src/modules/billing/repositories/dunning.repository.ts:135` |
| `billing.dunning_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingOperationsController.executeDunning → DunningService.execute | `src/modules/billing/services/dunning.service.ts:124` |
| `billing.dunning_runs` | ESCRIBE | CREA | DIRECTA | BillingOperationsController.executeDunning → DunningService.execute → DunningRepository.createRun | `src/modules/billing/repositories/dunning.repository.ts:111` |
| `billing.dunning_runs` | LEE | LEE | DIRECTA | BillingOperationsController.executeDunning → DunningService.execute → DunningRepository.findRunByNumber | `src/modules/billing/repositories/dunning.repository.ts:100` |
| `billing.invoices` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingOperationsController.executeDunning → DunningService.execute | `src/modules/billing/services/dunning.service.ts:118` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingOperationsController.executeDunning → DunningService.execute → InvoicesRepository.findById | `src/modules/billing/repositories/invoices.repository.ts:137` |

### Cuerpo — DTO `ExecuteDunningRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant (directory.tenants) | `src/modules/billing/dto/dunning.dto.ts:73` |
| `runNumber` | `string` | Sí | longitud máxima 60 | `@IsString()` `@MaxLength(60)` | Número de corrida (único por tenant) | `src/modules/billing/dto/dunning.dto.ts:81` |
| `runDate` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de la corrida (ISO); por defecto hoy | `src/modules/billing/dto/dunning.dto.ts:91` |
| `dunningLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nivel de morosidad (concepto) | `src/modules/billing/dto/dunning.dto.ts:102` |
| `items` | `array<DunningItemInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => DunningItemInputDto)` | Facturas morosas (al menos una) | `src/modules/billing/dto/dunning.dto.ts:115` |
| `items[].invoiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Factura morosa (billing.invoices) | `src/modules/billing/dto/dunning.dto.ts:27` |
| `items[].outstandingAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Saldo pendiente | `src/modules/billing/dto/dunning.dto.ts:35` |
| `items[].daysOverdue` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Días de mora | `src/modules/billing/dto/dunning.dto.ts:44` |
| `items[].dunningFee` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Recargo por mora | `src/modules/billing/dto/dunning.dto.ts:52` |
| `items[].businessPartnerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Socio de negocio (erp.business_partners) | `src/modules/billing/dto/dunning.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<DunningRunResponseDto>` · DTO `DunningRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/dunning.dto.ts:124` |
| `runNumber` | `string` | Sí | — | — | Valor de run number mantenido por la instancia. | `src/modules/billing/dto/dunning.dto.ts:130` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/billing/dto/dunning.dto.ts:136` |
| `itemCount` | `number` | Sí | — | — | Valor de item count mantenido por la instancia. | `src/modules/billing/dto/dunning.dto.ts:142` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-operations.controller.spec.ts:60` |

### Flujos

_Se completa en la fase de flujos._

---

## 4. POST /billing/internal/dunning-runs/run-due

- **Origen:** CONTRATO
- **Nombre:** Evaluar y disparar morosidad automática por tenant
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingOperationsController.runDueDunning` — `src/modules/billing/controllers/billing-operations.controller.ts:98`

### Qué es y para qué sirve (negocio)

Evaluar y disparar morosidad automática por tenant. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/internal/dunning-runs/run-due` la atiende `BillingOperationsController.runDueDunning` (src/modules/billing/controllers/billing-operations.controller.ts:98). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `RunDueDunningDto` (1 campo, 0 obligatorios). Delega en `DunningService.runDueDunning`. Crea filas en billing.dunning_items, billing.dunning_runs. Actualiza billing.dunning_runs, billing.invoices. Lee billing.dunning_runs, billing.invoices, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/billing/controllers/billing-operations.controller.ts:98` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.dunning_items` | ESCRIBE | CREA | DIRECTA | BillingOperationsController.runDueDunning → DunningService.runDueDunning → DunningRepository.createItem | `src/modules/billing/repositories/dunning.repository.ts:135` |
| `billing.dunning_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingOperationsController.runDueDunning → DunningService.runDueDunning | `src/modules/billing/services/dunning.service.ts:248` |
| `billing.dunning_runs` | ESCRIBE | CREA | DIRECTA | BillingOperationsController.runDueDunning → DunningService.runDueDunning → DunningRepository.createRun | `src/modules/billing/repositories/dunning.repository.ts:111` |
| `billing.dunning_runs` | LEE | LEE | DIRECTA | BillingOperationsController.runDueDunning → DunningService.runDueDunning → DunningRepository.findRunByNumber | `src/modules/billing/repositories/dunning.repository.ts:100` |
| `billing.invoices` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingOperationsController.runDueDunning → DunningService.runDueDunning | `src/modules/billing/services/dunning.service.ts:244` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingOperationsController.runDueDunning → DunningService.runDueDunning → InvoicesRepository.findOverdueByPractices | `src/modules/billing/repositories/invoices.repository.ts:186` |
| `practice.practices` | LEE | LEE | DIRECTA | BillingOperationsController.runDueDunning → DunningService.runDueDunning → PracticeTenantLookupService.findActive → PracticesRepository.findActive | `src/modules/practice/repositories/practices.repository.ts:81` |

### Cuerpo — DTO `RunDueDunningDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1; máximo 2000 | `@IsOptional()` `@IsInt()` `@Min(1)` | Máximo de facturas vencidas por tenant en esta corrida | `src/modules/billing/dto/dunning.dto.ts:159` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 500
}
```

</details>

### Respuesta — `Promise<RunDueDunningResponseDto>` · DTO `RunDueDunningResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantsProcessed` | `number` | Sí | — | — | Tenants con al menos una factura vencida | `src/modules/billing/dto/dunning.dto.ts:197` |
| `results` | `array<TenantDunningResultDto>` | Sí | — | — | Valor de results mantenido por la instancia. | `src/modules/billing/dto/dunning.dto.ts:203` |
| `results[].tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/billing/dto/dunning.dto.ts:168` |
| `results[].runId` | `string` | Sí | formato uuid | — | Identificador asociado a run. | `src/modules/billing/dto/dunning.dto.ts:174` |
| `results[].itemCount` | `number` | Sí | — | — | Facturas incluidas en la corrida | `src/modules/billing/dto/dunning.dto.ts:180` |
| `results[].skipped` | `boolean` | Sí | — | — | true si el tenant ya tenía una corrida automática hoy | `src/modules/billing/dto/dunning.dto.ts:188` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-operations.controller.spec.ts:67` |

### Flujos

_Se completa en la fase de flujos._

---

## 5. POST /billing/invoices:issue-from-encounter

- **Origen:** CONTRATO
- **Nombre:** Emitir factura desde los cargos del encuentro
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingReceivablesController.issueFromEncounter` — `src/modules/billing/controllers/billing-receivables.controller.ts:57`

### Qué es y para qué sirve (negocio)

Emitir factura desde los cargos del encuentro. Caso de uso UC-17-01: InvoicesService.issueFromEncounter. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:11`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/invoices:issue-from-encounter` la atiende `BillingReceivablesController.issueFromEncounter` (src/modules/billing/controllers/billing-receivables.controller.ts:57). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IssueInvoiceFromEncounterDto` (19 campos, 5 obligatorios). Delega en `InvoicesService.issueFromEncounter`. Crea filas en billing.billing_document_links, billing.invoice_lines, billing.invoices. Lee billing.invoices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-receivables.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.billing_document_links` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.issueFromEncounter → InvoicesService.issueFromEncounter → BillingDocumentLinksRepository.create | `src/modules/billing/repositories/document-links.repository.ts:66` |
| `billing.invoice_lines` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.issueFromEncounter → InvoicesService.issueFromEncounter → InvoicesRepository.createLine | `src/modules/billing/repositories/invoices.repository.ts:237` |
| `billing.invoices` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.issueFromEncounter → InvoicesService.issueFromEncounter → InvoicesRepository.create | `src/modules/billing/repositories/invoices.repository.ts:206` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingReceivablesController.issueFromEncounter → InvoicesService.issueFromEncounter → InvoicesRepository.findByNumber | `src/modules/billing/repositories/invoices.repository.ts:153` |

### Cuerpo — DTO `IssueInvoiceFromEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica emisora (practice.practices) | `src/modules/billing/dto/invoice.dto.ts:115` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente facturado (profiles.patient_profiles) | `src/modules/billing/dto/invoice.dto.ts:125` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro origen (clinical.encounters) | `src/modules/billing/dto/invoice.dto.ts:136` |
| `invoiceNumber` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Número de folio; si se omite se genera | `src/modules/billing/dto/invoice.dto.ts:147` |
| `issueDate` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de emisión (ISO); por defecto hoy | `src/modules/billing/dto/invoice.dto.ts:157` |
| `dueDate` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de vencimiento (ISO) | `src/modules/billing/dto/invoice.dto.ts:165` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Moneda (terminology.catalog_concepts) | `src/modules/billing/dto/invoice.dto.ts:176` |
| `claimId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Reclamo de seguro asociado (para el vínculo de documento) | `src/modules/billing/dto/invoice.dto.ts:187` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant (directory.tenants); requerido para registrar el vínculo de documento | `src/modules/billing/dto/invoice.dto.ts:199` |
| `lines` | `array<InvoiceLineInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => InvoiceLineInputDto)` | Líneas de cargo (al menos una) | `src/modules/billing/dto/invoice.dto.ts:212` |
| `lines[].serviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio del catálogo (billing.service_catalog) | `src/modules/billing/dto/invoice.dto.ts:27` |
| `lines[].description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Descripción libre de la línea | `src/modules/billing/dto/invoice.dto.ts:36` |
| `lines[].quantity` | `string` | Sí | — | `@IsNumberString()` | Cantidad | `src/modules/billing/dto/invoice.dto.ts:43` |
| `lines[].unitPrice` | `string` | Sí | — | `@IsNumberString()` | Precio unitario | `src/modules/billing/dto/invoice.dto.ts:50` |
| `lines[].discount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Descuento de línea | `src/modules/billing/dto/invoice.dto.ts:58` |
| `lines[].taxCodeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código de impuesto (billing.tax_codes) | `src/modules/billing/dto/invoice.dto.ts:69` |
| `lines[].taxAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto de impuesto de la línea | `src/modules/billing/dto/invoice.dto.ts:80` |
| `lines[].incomeAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta de ingreso (accounting.accounts) | `src/modules/billing/dto/invoice.dto.ts:91` |
| `lines[].costCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Centro de costo (accounting.cost_centers) | `src/modules/billing/dto/invoice.dto.ts:102` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<InvoiceResponseDto>` · DTO `InvoiceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/invoice.dto.ts:304` |
| `invoiceNumber` | `string` | Sí | — | — | Valor de invoice number mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:310` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/billing/dto/invoice.dto.ts:316` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado | `src/modules/billing/dto/invoice.dto.ts:322` |
| `subtotal` | `string` | No | — | — | Valor de subtotal mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:328` |
| `taxTotal` | `string` | No | — | — | Valor de tax total mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:334` |
| `discountTotal` | `string` | No | — | — | Valor de discount total mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:340` |
| `total` | `string` | No | — | — | Valor de total mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:346` |
| `paidTotal` | `string` | No | — | — | Valor de paid total mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:352` |
| `balance` | `string` | No | — | — | Valor de balance mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:358` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:364` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-receivables.controller.spec.ts:48` |

### Flujos

_Se completa en la fase de flujos._

---

## 6. POST /billing/invoices/{id}:credit-note

- **Origen:** CONTRATO
- **Nombre:** Emitir nota de crédito / castigo sobre una factura
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingReceivablesController.creditNote` — `src/modules/billing/controllers/billing-receivables.controller.ts:83`

### Qué es y para qué sirve (negocio)

Emitir nota de crédito / castigo sobre una factura. Caso de uso UC-17-03: InvoicesService.creditNote. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:13`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/invoices/{id}:credit-note` la atiende `BillingReceivablesController.creditNote` (src/modules/billing/controllers/billing-receivables.controller.ts:83). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreditNoteDto` (8 campos, 4 obligatorios). Delega en `InvoicesService.creditNote`. Crea filas en billing.billing_document_links, billing.invoice_lines, billing.invoices. Actualiza billing.invoices. Lee billing.invoices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-receivables.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/billing/controllers/billing-receivables.controller.ts:83` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.billing_document_links` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.creditNote → InvoicesService.creditNote → BillingDocumentLinksRepository.create | `src/modules/billing/repositories/document-links.repository.ts:66` |
| `billing.invoice_lines` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.creditNote → InvoicesService.creditNote → InvoicesRepository.createLine | `src/modules/billing/repositories/invoices.repository.ts:237` |
| `billing.invoices` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingReceivablesController.creditNote → InvoicesService.creditNote | `src/modules/billing/services/invoices.service.ts:232` |
| `billing.invoices` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.creditNote → InvoicesService.creditNote → InvoicesRepository.create | `src/modules/billing/repositories/invoices.repository.ts:206` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingReceivablesController.creditNote → InvoicesService.creditNote → InvoicesRepository.findById | `src/modules/billing/repositories/invoices.repository.ts:137` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreditNoteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Motivo del ajuste / nota de crédito | `src/modules/billing/dto/invoice.dto.ts:260` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant (directory.tenants); requerido para registrar el vínculo CREDIT_OF | `src/modules/billing/dto/invoice.dto.ts:272` |
| `writeOff` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es un castigo de saldo incobrable (write-off) | `src/modules/billing/dto/invoice.dto.ts:282` |
| `lines` | `array<CreditNoteLineInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CreditNoteLineInputDto)` | Líneas a revertir | `src/modules/billing/dto/invoice.dto.ts:295` |
| `lines[].description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Descripción del reverso | `src/modules/billing/dto/invoice.dto.ts:224` |
| `lines[].quantity` | `string` | Sí | — | `@IsNumberString()` | Cantidad (positiva; se invierte el signo del total) | `src/modules/billing/dto/invoice.dto.ts:234` |
| `lines[].unitPrice` | `string` | Sí | — | `@IsNumberString()` | Precio unitario a revertir | `src/modules/billing/dto/invoice.dto.ts:241` |
| `lines[].taxAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Impuesto a revertir | `src/modules/billing/dto/invoice.dto.ts:249` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<InvoiceResponseDto>` · DTO `InvoiceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/invoice.dto.ts:304` |
| `invoiceNumber` | `string` | Sí | — | — | Valor de invoice number mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:310` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/billing/dto/invoice.dto.ts:316` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado | `src/modules/billing/dto/invoice.dto.ts:322` |
| `subtotal` | `string` | No | — | — | Valor de subtotal mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:328` |
| `taxTotal` | `string` | No | — | — | Valor de tax total mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:334` |
| `discountTotal` | `string` | No | — | — | Valor de discount total mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:340` |
| `total` | `string` | No | — | — | Valor de total mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:346` |
| `paidTotal` | `string` | No | — | — | Valor de paid total mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:352` |
| `balance` | `string` | No | — | — | Valor de balance mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:358` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/billing/dto/invoice.dto.ts:364` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-receivables.controller.spec.ts:66` |

### Flujos

_Se completa en la fase de flujos._

---

## 7. POST /billing/kpi-snapshots:compute

- **Origen:** CONTRATO
- **Nombre:** Calcular snapshot de KPI financiero y aging
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingOperationsController.computeKpi` — `src/modules/billing/controllers/billing-operations.controller.ts:114`

### Qué es y para qué sirve (negocio)

Calcular snapshot de KPI financiero y aging. Caso de uso UC-17-12: KpiSnapshotsService.compute. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:22`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/kpi-snapshots:compute` la atiende `BillingOperationsController.computeKpi` (src/modules/billing/controllers/billing-operations.controller.ts:114). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ComputeKpiSnapshotDto` (6 campos, 3 obligatorios). Delega en `KpiSnapshotsService.compute`. Crea filas en billing.financial_kpi_snapshots. Lee billing.financial_kpi_snapshots.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-operations.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.financial_kpi_snapshots` | ESCRIBE | CREA | DIRECTA | BillingOperationsController.computeKpi → KpiSnapshotsService.compute → KpiSnapshotsRepository.create | `src/modules/billing/repositories/kpi-snapshots.repository.ts:68` |
| `billing.financial_kpi_snapshots` | LEE | LEE | DIRECTA | BillingOperationsController.computeKpi → KpiSnapshotsService.compute → KpiSnapshotsRepository.findExisting | `src/modules/billing/repositories/kpi-snapshots.repository.ts:48` |

### Cuerpo — DTO `ComputeKpiSnapshotDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica (practice.practices) | `src/modules/billing/dto/kpi-snapshot.dto.ts:19` |
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Periodo fiscal (accounting.fiscal_periods) | `src/modules/billing/dto/kpi-snapshot.dto.ts:30` |
| `kpiCode` | `string` | Sí | longitud máxima 60 | `@IsString()` `@MaxLength(60)` | Código de KPI (p. ej. DSO, AR_AGING, CASH_POSITION) | `src/modules/billing/dto/kpi-snapshot.dto.ts:40` |
| `valueNumeric` | `string` | Sí | — | `@IsNumberString()` | Valor calculado del KPI | `src/modules/billing/dto/kpi-snapshot.dto.ts:47` |
| `dimensionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Dimensiones del cálculo (JSON) | `src/modules/billing/dto/kpi-snapshot.dto.ts:55` |
| `computedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Marca del cálculo (ISO); por defecto ahora | `src/modules/billing/dto/kpi-snapshot.dto.ts:65` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "kpiCode": "CODIGO_EJEMPLO",
  "valueNumeric": "42.50"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "kpiCode": "CODIGO_EJEMPLO",
  "valueNumeric": "42.50",
  "dimensionJson": {},
  "computedAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<KpiSnapshotResponseDto>` · DTO `KpiSnapshotResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/kpi-snapshot.dto.ts:74` |
| `kpiCode` | `string` | Sí | — | — | Valor de kpi code mantenido por la instancia. | `src/modules/billing/dto/kpi-snapshot.dto.ts:80` |
| `valueNumeric` | `string` | Sí | — | — | Valor de value numeric mantenido por la instancia. | `src/modules/billing/dto/kpi-snapshot.dto.ts:86` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/billing/dto/kpi-snapshot.dto.ts:92` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-operations.controller.spec.ts:74` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. POST /billing/patient-statements:generate

- **Origen:** CONTRATO
- **Nombre:** Generar el estado de cuenta del paciente
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingReceivablesController.generateStatement` — `src/modules/billing/controllers/billing-receivables.controller.ts:112`

### Qué es y para qué sirve (negocio)

Generar el estado de cuenta del paciente. Caso de uso UC-17-09: PatientStatementsService.generate. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:19`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/patient-statements:generate` la atiende `BillingReceivablesController.generateStatement` (src/modules/billing/controllers/billing-receivables.controller.ts:112). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `GeneratePatientStatementDto` (6 campos, 4 obligatorios). Delega en `PatientStatementsService.generate`. Crea filas en billing.billing_document_links, billing.patient_statements. Lee billing.invoices, billing.patient_statements.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-receivables.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.billing_document_links` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.generateStatement → PatientStatementsService.generate → BillingDocumentLinksRepository.create | `src/modules/billing/repositories/document-links.repository.ts:66` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingReceivablesController.generateStatement → PatientStatementsService.generate → InvoicesRepository.findByPatientInRange | `src/modules/billing/repositories/invoices.repository.ts:164` |
| `billing.patient_statements` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.generateStatement → PatientStatementsService.generate → PatientStatementsRepository.create | `src/modules/billing/repositories/patient-statements.repository.ts:89` |
| `billing.patient_statements` | LEE | LEE | DIRECTA | BillingReceivablesController.generateStatement → PatientStatementsService.generate → PatientStatementsRepository.findByPeriod | `src/modules/billing/repositories/patient-statements.repository.ts:70` |

### Cuerpo — DTO `GeneratePatientStatementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica (practice.practices) | `src/modules/billing/dto/patient-statement.dto.ts:16` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/billing/dto/patient-statement.dto.ts:26` |
| `periodStart` | `string` | Sí | formato date-time | `@IsDateString()` | Inicio del periodo (ISO) | `src/modules/billing/dto/patient-statement.dto.ts:33` |
| `periodEnd` | `string` | Sí | formato date-time | `@IsDateString()` | Fin del periodo (ISO) | `src/modules/billing/dto/patient-statement.dto.ts:40` |
| `openingBalance` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Saldo de apertura; por defecto 0.00 | `src/modules/billing/dto/patient-statement.dto.ts:51` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant (directory.tenants); requerido para vincular las facturas incluidas | `src/modules/billing/dto/patient-statement.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "openingBalance": "0.00",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PatientStatementResponseDto>` · DTO `PatientStatementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/patient-statement.dto.ts:72` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/billing/dto/patient-statement.dto.ts:78` |
| `periodStart` | `string` | Sí | — | — | Valor de period start mantenido por la instancia. | `src/modules/billing/dto/patient-statement.dto.ts:84` |
| `periodEnd` | `string` | Sí | — | — | Valor de period end mantenido por la instancia. | `src/modules/billing/dto/patient-statement.dto.ts:90` |
| `openingBalance` | `string` | Sí | — | — | Valor de opening balance mantenido por la instancia. | `src/modules/billing/dto/patient-statement.dto.ts:96` |
| `charges` | `string` | Sí | — | — | Valor de charges mantenido por la instancia. | `src/modules/billing/dto/patient-statement.dto.ts:102` |
| `payments` | `string` | Sí | — | — | Valor de payments mantenido por la instancia. | `src/modules/billing/dto/patient-statement.dto.ts:108` |
| `closingBalance` | `string` | Sí | — | — | Valor de closing balance mantenido por la instancia. | `src/modules/billing/dto/patient-statement.dto.ts:114` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-receivables.controller.spec.ts:84` |

### Flujos

_Se completa en la fase de flujos._

---

## 9. POST /billing/payment-plans

- **Origen:** CONTRATO
- **Nombre:** Configurar un plan de pagos del paciente
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingReceivablesController.createPaymentPlan` — `src/modules/billing/controllers/billing-receivables.controller.ts:124`

### Qué es y para qué sirve (negocio)

Configurar un plan de pagos del paciente. Caso de uso UC-17-11: InvoicesService.createPaymentPlan. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:21`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/payment-plans` la atiende `BillingReceivablesController.createPaymentPlan` (src/modules/billing/controllers/billing-receivables.controller.ts:124). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePaymentPlanDto` (5 campos, 4 obligatorios). Delega en `InvoicesService.createPaymentPlan`. Crea filas en billing.billing_document_links, billing.invoices. Actualiza billing.invoices. Lee billing.invoices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-receivables.controller.ts:124` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.billing_document_links` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.createPaymentPlan → InvoicesService.createPaymentPlan → BillingDocumentLinksRepository.create | `src/modules/billing/repositories/document-links.repository.ts:66` |
| `billing.invoices` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingReceivablesController.createPaymentPlan → InvoicesService.createPaymentPlan | `src/modules/billing/services/invoices.service.ts:334` |
| `billing.invoices` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.createPaymentPlan → InvoicesService.createPaymentPlan → InvoicesRepository.create | `src/modules/billing/repositories/invoices.repository.ts:206` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingReceivablesController.createPaymentPlan → InvoicesService.createPaymentPlan → InvoicesRepository.findById | `src/modules/billing/repositories/invoices.repository.ts:137` |

### Cuerpo — DTO `CreatePaymentPlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceInvoiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Factura origen con saldo (billing.invoices) | `src/modules/billing/dto/payment-plan.dto.ts:40` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant (directory.tenants); requerido para vincular las cuotas | `src/modules/billing/dto/payment-plan.dto.ts:52` |
| `installments` | `array<InstallmentInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => InstallmentInputDto)` | Cuotas; la suma debe igualar el saldo origen | `src/modules/billing/dto/payment-plan.dto.ts:65` |
| `installments[].dueDate` | `string` | Sí | formato date-time | `@IsDateString()` | Fecha de vencimiento de la cuota (ISO) | `src/modules/billing/dto/payment-plan.dto.ts:20` |
| `installments[].amount` | `string` | Sí | — | `@IsNumberString()` | Importe de la cuota | `src/modules/billing/dto/payment-plan.dto.ts:27` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PaymentPlanResponseDto>` · DTO `PaymentPlanResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceInvoiceId` | `string` | Sí | formato uuid | — | Identificador asociado a source invoice. | `src/modules/billing/dto/payment-plan.dto.ts:101` |
| `installmentCount` | `number` | Sí | — | — | Valor de installment count mantenido por la instancia. | `src/modules/billing/dto/payment-plan.dto.ts:107` |
| `installments` | `array<GeneratedInstallmentDto>` | Sí | — | — | Valor de installments mantenido por la instancia. | `src/modules/billing/dto/payment-plan.dto.ts:113` |
| `installments[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/payment-plan.dto.ts:74` |
| `installments[].invoiceNumber` | `string` | Sí | — | — | Valor de invoice number mantenido por la instancia. | `src/modules/billing/dto/payment-plan.dto.ts:80` |
| `installments[].total` | `string` | Sí | — | — | Valor de total mantenido por la instancia. | `src/modules/billing/dto/payment-plan.dto.ts:86` |
| `installments[].dueDate` | `string` | Sí | — | — | Valor de due date mantenido por la instancia. | `src/modules/billing/dto/payment-plan.dto.ts:92` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-receivables.controller.spec.ts:91` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /billing/payments-made:execute

- **Origen:** CONTRATO
- **Nombre:** Ejecutar pago a proveedor con asignación
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingPayablesController.executePayment` — `src/modules/billing/controllers/billing-payables.controller.ts:46`

### Qué es y para qué sirve (negocio)

Ejecutar pago a proveedor con asignación. Caso de uso UC-17-05: PaymentsMadeService.execute. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:15`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/payments-made:execute` la atiende `BillingPayablesController.executePayment` (src/modules/billing/controllers/billing-payables.controller.ts:46). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ExecutePaymentMadeDto` (12 campos, 5 obligatorios). Delega en `PaymentsMadeService.execute`. Crea filas en billing.payable_payment_allocations, billing.payments_made. Actualiza billing.bills. Lee billing.bills.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-payables.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.bills` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingPayablesController.executePayment → PaymentsMadeService.execute | `src/modules/billing/services/payments-made.service.ts:145` |
| `billing.bills` | LEE | LEE | DIRECTA | BillingPayablesController.executePayment → PaymentsMadeService.execute → BillsRepository.findById | `src/modules/billing/repositories/bills.repository.ts:137` |
| `billing.payable_payment_allocations` | ESCRIBE | CREA | DIRECTA | BillingPayablesController.executePayment → PaymentsMadeService.execute → PaymentsMadeRepository.createAllocation | `src/modules/billing/repositories/payments-made.repository.ts:132` |
| `billing.payments_made` | ESCRIBE | CREA | DIRECTA | BillingPayablesController.executePayment → PaymentsMadeService.execute → PaymentsMadeRepository.create | `src/modules/billing/repositories/payments-made.repository.ts:104` |

### Cuerpo — DTO `ExecutePaymentMadeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica (practice.practices) | `src/modules/billing/dto/payment-made.dto.ts:70` |
| `vendorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Proveedor (billing.vendors) | `src/modules/billing/dto/payment-made.dto.ts:81` |
| `amount` | `string` | Sí | — | `@IsNumberString()` | Monto total del pago | `src/modules/billing/dto/payment-made.dto.ts:88` |
| `methodConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Método de pago (concepto); por defecto transferencia | `src/modules/billing/dto/payment-made.dto.ts:99` |
| `paidAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de pago (ISO) | `src/modules/billing/dto/payment-made.dto.ts:107` |
| `companyBankAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta bancaria origen (accounting.company_bank_accounts) | `src/modules/billing/dto/payment-made.dto.ts:118` |
| `allocations` | `array<PayableAllocationInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PayableAllocationInputDto)` | Asignaciones por factura (al menos una) | `src/modules/billing/dto/payment-made.dto.ts:131` |
| `allocations[].billId` | `string` | Sí | formato uuid | `@IsUUID()` | Factura de proveedor destino (billing.bills) | `src/modules/billing/dto/payment-made.dto.ts:23` |
| `allocations[].allocatedAmount` | `string` | Sí | — | `@IsNumberString()` | Monto asignado | `src/modules/billing/dto/payment-made.dto.ts:30` |
| `allocations[].discountAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Descuento | `src/modules/billing/dto/payment-made.dto.ts:38` |
| `allocations[].withholdingAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Retención (withholding) | `src/modules/billing/dto/payment-made.dto.ts:49` |
| `allocations[].openItemId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Partida abierta del subledger (accounting.open_items) | `src/modules/billing/dto/payment-made.dto.ts:60` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PaymentMadeResponseDto>` · DTO `PaymentMadeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/payment-made.dto.ts:167` |
| `amount` | `string` | Sí | — | — | Valor de amount mantenido por la instancia. | `src/modules/billing/dto/payment-made.dto.ts:173` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/billing/dto/payment-made.dto.ts:179` |
| `allocations` | `array<AllocatedBillDto>` | Sí | — | — | Valor de allocations mantenido por la instancia. | `src/modules/billing/dto/payment-made.dto.ts:185` |
| `allocations[].billId` | `string` | Sí | formato uuid | — | Identificador asociado a bill. | `src/modules/billing/dto/payment-made.dto.ts:140` |
| `allocations[].allocatedAmount` | `string` | Sí | — | — | Valor de allocated amount mantenido por la instancia. | `src/modules/billing/dto/payment-made.dto.ts:146` |
| `allocations[].balance` | `string` | No | — | — | Valor de balance mantenido por la instancia. | `src/modules/billing/dto/payment-made.dto.ts:152` |
| `allocations[].status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/billing/dto/payment-made.dto.ts:158` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-payables.controller.spec.ts:42` |

### Flujos

_Se completa en la fase de flujos._

---

## 11. POST /billing/payments-received:apply

- **Origen:** CONTRATO
- **Nombre:** Aplicar un pago recibido con asignación multi-factura
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingReceivablesController.applyPayment` — `src/modules/billing/controllers/billing-receivables.controller.ts:69`

### Qué es y para qué sirve (negocio)

Aplicar un pago recibido con asignación multi-factura. Caso de uso UC-17-02: PaymentsReceivedService.apply. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/payments-received:apply` la atiende `BillingReceivablesController.applyPayment` (src/modules/billing/controllers/billing-receivables.controller.ts:69). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ApplyPaymentReceivedDto` (12 campos, 5 obligatorios). Delega en `PaymentsReceivedService.apply`. Crea filas en billing.payments_received, billing.receivable_payment_allocations. Actualiza billing.invoices. Lee billing.invoices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-receivables.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.invoices` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingReceivablesController.applyPayment → PaymentsReceivedService.apply | `src/modules/billing/services/payments-received.service.ts:149` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingReceivablesController.applyPayment → PaymentsReceivedService.apply → InvoicesRepository.findById | `src/modules/billing/repositories/invoices.repository.ts:137` |
| `billing.payments_received` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.applyPayment → PaymentsReceivedService.apply → PaymentsReceivedRepository.create | `src/modules/billing/repositories/payments-received.repository.ts:108` |
| `billing.receivable_payment_allocations` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.applyPayment → PaymentsReceivedService.apply → PaymentsReceivedRepository.createAllocation | `src/modules/billing/repositories/payments-received.repository.ts:137` |

### Cuerpo — DTO `ApplyPaymentReceivedDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica (practice.practices) | `src/modules/billing/dto/payment-received.dto.ts:64` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente pagador (profiles.patient_profiles) | `src/modules/billing/dto/payment-received.dto.ts:75` |
| `amount` | `string` | Sí | — | `@IsNumberString()` | Monto total recibido | `src/modules/billing/dto/payment-received.dto.ts:82` |
| `methodConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Método de pago (concepto); por defecto efectivo | `src/modules/billing/dto/payment-received.dto.ts:93` |
| `receivedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de recepción (ISO) | `src/modules/billing/dto/payment-received.dto.ts:101` |
| `reference` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Referencia externa (voucher, txn) | `src/modules/billing/dto/payment-received.dto.ts:110` |
| `companyBankAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta bancaria receptora (accounting.company_bank_accounts) | `src/modules/billing/dto/payment-received.dto.ts:121` |
| `allocations` | `array<ReceivableAllocationInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ReceivableAllocationInputDto)` | Asignaciones por factura (al menos una) | `src/modules/billing/dto/payment-received.dto.ts:134` |
| `allocations[].invoiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Factura destino (billing.invoices) | `src/modules/billing/dto/payment-received.dto.ts:25` |
| `allocations[].allocatedAmount` | `string` | Sí | — | `@IsNumberString()` | Monto asignado a la factura | `src/modules/billing/dto/payment-received.dto.ts:32` |
| `allocations[].discountAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Descuento por pronto pago | `src/modules/billing/dto/payment-received.dto.ts:43` |
| `allocations[].openItemId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Partida abierta del subledger (accounting.open_items) | `src/modules/billing/dto/payment-received.dto.ts:54` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PaymentReceivedResponseDto>` · DTO `PaymentReceivedResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/payment-received.dto.ts:170` |
| `amount` | `string` | Sí | — | — | Valor de amount mantenido por la instancia. | `src/modules/billing/dto/payment-received.dto.ts:176` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/billing/dto/payment-received.dto.ts:182` |
| `allocations` | `array<AllocatedInvoiceDto>` | Sí | — | — | Valor de allocations mantenido por la instancia. | `src/modules/billing/dto/payment-received.dto.ts:188` |
| `allocations[].invoiceId` | `string` | Sí | formato uuid | — | Identificador asociado a invoice. | `src/modules/billing/dto/payment-received.dto.ts:143` |
| `allocations[].allocatedAmount` | `string` | Sí | — | — | Valor de allocated amount mantenido por la instancia. | `src/modules/billing/dto/payment-received.dto.ts:149` |
| `allocations[].balance` | `string` | No | — | — | Valor de balance mantenido por la instancia. | `src/modules/billing/dto/payment-received.dto.ts:155` |
| `allocations[].status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/billing/dto/payment-received.dto.ts:161` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-receivables.controller.spec.ts:59` |

### Flujos

_Se completa en la fase de flujos._

---

## 12. POST /billing/reconciliation:clear

- **Origen:** CONTRATO
- **Nombre:** Conciliar pagos vía documento de compensación
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingOperationsController.reconcile` — `src/modules/billing/controllers/billing-operations.controller.ts:68`

### Qué es y para qué sirve (negocio)

Conciliar pagos vía documento de compensación. Caso de uso UC-17-07: ReconciliationService.clear. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/reconciliation:clear` la atiende `BillingOperationsController.reconcile` (src/modules/billing/controllers/billing-operations.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReconciliationClearDto` (3 campos, 1 obligatorio). Delega en `ReconciliationService.clear`. Actualiza billing.payments_made, billing.payments_received. Lee billing.payments_made, billing.payments_received.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-operations.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.payments_made` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingOperationsController.reconcile → ReconciliationService.clear | `src/modules/billing/services/reconciliation.service.ts:103` |
| `billing.payments_made` | LEE | LEE | DIRECTA | BillingOperationsController.reconcile → ReconciliationService.clear → PaymentsMadeRepository.findById | `src/modules/billing/repositories/payments-made.repository.ts:93` |
| `billing.payments_received` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingOperationsController.reconcile → ReconciliationService.clear | `src/modules/billing/services/reconciliation.service.ts:84` |
| `billing.payments_received` | LEE | LEE | DIRECTA | BillingOperationsController.reconcile → ReconciliationService.clear → PaymentsReceivedRepository.findById | `src/modules/billing/repositories/payments-received.repository.ts:97` |

### Cuerpo — DTO `ReconciliationClearDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `clearingDocumentId` | `string` | Sí | formato uuid | `@IsUUID()` | Documento de compensación del lote (accounting.clearing_documents) | `src/modules/billing/dto/reconciliation.dto.ts:15` |
| `paymentReceivedIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Pagos recibidos a conciliar | `src/modules/billing/dto/reconciliation.dto.ts:28` |
| `paymentMadeIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Pagos emitidos a conciliar | `src/modules/billing/dto/reconciliation.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "clearingDocumentId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ReconciliationResultDto>` · DTO `ReconciliationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `clearingDocumentId` | `string` | Sí | formato uuid | — | Identificador asociado a clearing document. | `src/modules/billing/dto/reconciliation.dto.ts:50` |
| `reconciledReceived` | `number` | Sí | — | — | Valor de reconciled received mantenido por la instancia. | `src/modules/billing/dto/reconciliation.dto.ts:56` |
| `reconciledMade` | `number` | Sí | — | — | Valor de reconciled made mantenido por la instancia. | `src/modules/billing/dto/reconciliation.dto.ts:62` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-operations.controller.spec.ts:53` |

### Flujos

_Se completa en la fase de flujos._

---

## 13. POST /billing/reimbursements:link

- **Origen:** CONTRATO
- **Nombre:** Vincular reembolso de reclamo de seguro a la factura
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingReceivablesController.linkReimbursement` — `src/modules/billing/controllers/billing-receivables.controller.ts:98`

### Qué es y para qué sirve (negocio)

Vincular reembolso de reclamo de seguro a la factura. Caso de uso UC-17-08: ReimbursementsService.link. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/billing/README.md:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/reimbursements:link` la atiende `BillingReceivablesController.linkReimbursement` (src/modules/billing/controllers/billing-receivables.controller.ts:98). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LinkReimbursementDto` (5 campos, 3 obligatorios). Delega en `ReimbursementsService.link`. Crea filas en billing.billing_document_links, billing.reimbursements. Actualiza billing.invoices. Lee billing.invoices, billing.reimbursements.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-receivables.controller.ts:98` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.billing_document_links` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.linkReimbursement → ReimbursementsService.link → BillingDocumentLinksRepository.create | `src/modules/billing/repositories/document-links.repository.ts:66` |
| `billing.invoices` | ESCRIBE | ACTUALIZA | POR_TIPO | BillingReceivablesController.linkReimbursement → ReimbursementsService.link | `src/modules/billing/services/reimbursements.service.ts:98` |
| `billing.invoices` | LEE | LEE | DIRECTA | BillingReceivablesController.linkReimbursement → ReimbursementsService.link → InvoicesRepository.findById | `src/modules/billing/repositories/invoices.repository.ts:137` |
| `billing.reimbursements` | ESCRIBE | CREA | DIRECTA | BillingReceivablesController.linkReimbursement → ReimbursementsService.link → ReimbursementsRepository.create | `src/modules/billing/repositories/reimbursements.repository.ts:55` |
| `billing.reimbursements` | LEE | LEE | DIRECTA | BillingReceivablesController.linkReimbursement → ReimbursementsService.link → ReimbursementsRepository.findByClaim | `src/modules/billing/repositories/reimbursements.repository.ts:44` |

### Cuerpo — DTO `LinkReimbursementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `claimId` | `string` | Sí | formato uuid | `@IsUUID()` | Reclamo de seguro (insurance.insurance_claims) | `src/modules/billing/dto/reimbursement.dto.ts:19` |
| `invoiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Factura del paciente a acreditar (billing.invoices) | `src/modules/billing/dto/reimbursement.dto.ts:29` |
| `amount` | `string` | Sí | — | `@IsNumberString()` | Monto reembolsado por la aseguradora | `src/modules/billing/dto/reimbursement.dto.ts:39` |
| `receivedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de recepción del reembolso (ISO) | `src/modules/billing/dto/reimbursement.dto.ts:49` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant (directory.tenants); requerido para registrar el vínculo REIMBURSEMENT_OF | `src/modules/billing/dto/reimbursement.dto.ts:61` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "claimId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "30.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "claimId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "30.00",
  "receivedAt": "2026-07-31T12:00:00.000Z",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ReimbursementResponseDto>` · DTO `ReimbursementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/reimbursement.dto.ts:70` |
| `claimId` | `string` | Sí | formato uuid | — | Identificador asociado a claim. | `src/modules/billing/dto/reimbursement.dto.ts:76` |
| `amount` | `string` | Sí | — | — | Valor de amount mantenido por la instancia. | `src/modules/billing/dto/reimbursement.dto.ts:82` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/billing/dto/reimbursement.dto.ts:88` |
| `invoiceId` | `string` | Sí | formato uuid | — | Identificador asociado a invoice. | `src/modules/billing/dto/reimbursement.dto.ts:94` |
| `invoiceBalance` | `string` | No | — | — | Valor de invoice balance mantenido por la instancia. | `src/modules/billing/dto/reimbursement.dto.ts:100` |
| `invoiceStatus` | `string` | Sí | formato uuid | — | Valor de invoice status mantenido por la instancia. | `src/modules/billing/dto/reimbursement.dto.ts:106` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-receivables.controller.spec.ts:77` |

### Flujos

_Se completa en la fase de flujos._

---

## 14. GET /billing/service-catalog

- **Origen:** CONTRATO
- **Nombre:** Listar el catálogo de servicios de la práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingServiceCatalogController.search` — `src/modules/billing/controllers/billing-service-catalog.controller.ts:62`

### Qué es y para qué sirve (negocio)

Listar el catálogo de servicios de la práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /billing/service-catalog` la atiende `BillingServiceCatalogController.search` (src/modules/billing/controllers/billing-service-catalog.controller.ts:62). Exige sesión; el controlador no declara roles. Delega en `BillingServiceCatalogService.search`. Lee billing.service_catalog.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/billing/controllers/billing-service-catalog.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | BillingServiceCatalogController.search → BillingServiceCatalogService.search → ServiceCatalogRepository.searchPage | `src/modules/billing/repositories/service-catalog.repository.ts:129` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | Práctica (uuid) |
| `q` | query | No | `string` | Texto a buscar en el código o el nombre |
| `isActive` | query | No | `string` | Filtra por servicios activos (`true`) o inactivos (`false`) |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Servicios por página (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchServiceCatalogResponseDto>` · DTO `SearchServiceCatalogResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ServiceCatalogItemDto>` | Sí | — | — | Servicios de esta página, ordenados por código. | `src/modules/billing/dto/service-catalog.dto.ts:167` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:104` |
| `items[].practiceId` | `string` | Sí | formato uuid | — | Identificador asociado a practice. | `src/modules/billing/dto/service-catalog.dto.ts:110` |
| `items[].code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:116` |
| `items[].name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:122` |
| `items[].serviceConceptId` | `string` | No | formato uuid | — | Identificador asociado a service concept. | `src/modules/billing/dto/service-catalog.dto.ts:128` |
| `items[].defaultPrice` | `string` | Sí | — | — | Valor de default price mantenido por la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:134` |
| `items[].currencyConceptId` | `string` | No | formato uuid | — | Identificador asociado a currency concept. | `src/modules/billing/dto/service-catalog.dto.ts:140` |
| `items[].taxCodeId` | `string` | No | formato uuid | — | Identificador asociado a tax code. | `src/modules/billing/dto/service-catalog.dto.ts:146` |
| `items[].incomeAccountId` | `string` | No | formato uuid | — | Identificador asociado a income account. | `src/modules/billing/dto/service-catalog.dto.ts:152` |
| `items[].isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:158` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/billing/dto/service-catalog.dto.ts:173` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/billing/dto/service-catalog.dto.ts:179` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/billing/dto/service-catalog.dto.ts:185` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-service-catalog.controller.spec.ts:36` |

### Flujos

_Se completa en la fase de flujos._

---

## 15. POST /billing/service-catalog

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un servicio en el catálogo maestro
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BillingServiceCatalogController.create` — `src/modules/billing/controllers/billing-service-catalog.controller.ts:115`

### Qué es y para qué sirve (negocio)

Dar de alta un servicio en el catálogo maestro. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /billing/service-catalog` la atiende `BillingServiceCatalogController.create` (src/modules/billing/controllers/billing-service-catalog.controller.ts:115). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateServiceCatalogItemDto` (9 campos, 4 obligatorios). Delega en `BillingServiceCatalogService.create`. Crea filas en billing.service_catalog. Lee billing.service_catalog.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/billing/controllers/billing-service-catalog.controller.ts:115` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | ESCRIBE | CREA | DIRECTA | BillingServiceCatalogController.create → BillingServiceCatalogService.create → ServiceCatalogRepository.create | `src/modules/billing/repositories/service-catalog.repository.ts:146` |
| `billing.service_catalog` | LEE | LEE | DIRECTA | BillingServiceCatalogController.create → BillingServiceCatalogService.create → ServiceCatalogRepository.findByCode | `src/modules/billing/repositories/service-catalog.repository.ts:97` |

### Cuerpo — DTO `CreateServiceCatalogItemDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica (practice.practices) | `src/modules/billing/dto/service-catalog.dto.ts:18` |
| `code` | `string` | Sí | longitud máxima 60 | `@IsString()` `@MaxLength(60)` | Código interno del servicio | `src/modules/billing/dto/service-catalog.dto.ts:26` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre del servicio | `src/modules/billing/dto/service-catalog.dto.ts:34` |
| `serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de clasificación del servicio | `src/modules/billing/dto/service-catalog.dto.ts:45` |
| `defaultPrice` | `string` | Sí | — | `@IsNumberString()` | Precio de referencia; cada doctor puede cotizar otro precio | `src/modules/billing/dto/service-catalog.dto.ts:55` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Moneda (concepto) | `src/modules/billing/dto/service-catalog.dto.ts:63` |
| `taxCodeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código de impuesto (billing.tax_codes) | `src/modules/billing/dto/service-catalog.dto.ts:74` |
| `incomeAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta de ingreso (accounting.accounts) | `src/modules/billing/dto/service-catalog.dto.ts:85` |
| `isActive` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si queda disponible para cotizar; por defecto true | `src/modules/billing/dto/service-catalog.dto.ts:95` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "defaultPrice": "100.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ServiceCatalogItemDto>` · DTO `ServiceCatalogItemDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:104` |
| `practiceId` | `string` | Sí | formato uuid | — | Identificador asociado a practice. | `src/modules/billing/dto/service-catalog.dto.ts:110` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:116` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:122` |
| `serviceConceptId` | `string` | No | formato uuid | — | Identificador asociado a service concept. | `src/modules/billing/dto/service-catalog.dto.ts:128` |
| `defaultPrice` | `string` | Sí | — | — | Valor de default price mantenido por la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:134` |
| `currencyConceptId` | `string` | No | formato uuid | — | Identificador asociado a currency concept. | `src/modules/billing/dto/service-catalog.dto.ts:140` |
| `taxCodeId` | `string` | No | formato uuid | — | Identificador asociado a tax code. | `src/modules/billing/dto/service-catalog.dto.ts:146` |
| `incomeAccountId` | `string` | No | formato uuid | — | Identificador asociado a income account. | `src/modules/billing/dto/service-catalog.dto.ts:152` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/billing/dto/service-catalog.dto.ts:158` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/billing/controllers/billing-service-catalog.controller.spec.ts:73` |

### Flujos

_Se completa en la fase de flujos._

---

