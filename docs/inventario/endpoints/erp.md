<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `erp`

- **Bloque:** Financiero y ERP (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)
- **Operaciones:** 17 (17 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 17 · BAJO 0
- **Tablas distintas que tocan:** 18
- **Respuestas de error y detalle contractual:** `openapi/endpoints/erp.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/erp/bills/{billId}/invoice-match-runs` | Conciliar la factura contra orden y recepción (three-way match) | MEDIO | 3 | ERP_ADMIN, ACCOUNTS_PAYABLE |
| 2 | POST | `/erp/business-partners` | Alta de socio de negocio con su cuenta bancaria | MEDIO | 3 | ERP_ADMIN |
| 3 | POST | `/erp/business-partners/{id}/bank-accounts/{accId}/verify` | Verificar la cuenta bancaria del socio | MEDIO | 3 | ERP_ADMIN |
| 4 | POST | `/erp/contracts` | Crear un contrato en borrador | MEDIO | 3 | ERP_ADMIN, CONTRACT_MANAGER |
| 5 | POST | `/erp/contracts/{id}/amendments` | Enmendar el contrato | MEDIO | 2 | ERP_ADMIN, CONTRACT_MANAGER |
| 6 | POST | `/erp/contracts/{id}/approval-requests` | Solicitar o resolver la aprobación del contrato | MEDIO | 3 | ERP_ADMIN, CONTRACT_MANAGER |
| 7 | POST | `/erp/contracts/{id}/payment-schedules/generate` | Generar el cronograma de cuotas del contrato | MEDIO | 3 | ERP_ADMIN, SYSTEM_WORKER |
| 8 | POST | `/erp/contracts/{id}/renewals` | Renovar el contrato extendiendo su vigencia | MEDIO | 2 | ERP_ADMIN, CONTRACT_MANAGER |
| 9 | POST | `/erp/contracts/{id}/terminations` | Terminar el contrato y liquidarlo | MEDIO | 3 | ERP_ADMIN, CONTRACT_MANAGER |
| 10 | POST | `/erp/employees/{id}/time-off` | Solicitar una ausencia | MEDIO | 3 | ERP_ADMIN, HR_ADMIN, EMPLOYEE |
| 11 | POST | `/erp/employees/{id}/time-off/{reqId}/approve` | Aprobar o rechazar la solicitud de ausencia | MEDIO | 2 | ERP_ADMIN, HR_ADMIN |
| 12 | POST | `/erp/employees/onboard` | Alta de empleado | MEDIO | 1 | ERP_ADMIN, HR_ADMIN |
| 13 | POST | `/erp/lease-contracts/{id}/valuations` | Registrar la valoración IFRS 16 del arrendamiento | MEDIO | 1 | ERP_ADMIN, ACCOUNTANT |
| 14 | POST | `/erp/purchase-orders` | Emitir una orden de compra desde la requisición | MEDIO | 3 | ERP_ADMIN, BUYER |
| 15 | POST | `/erp/purchase-orders/{id}/goods-receipts` | Registrar la recepción de mercancía | MEDIO | 4 | ERP_ADMIN, BUYER, WAREHOUSE |
| 16 | POST | `/erp/purchase-orders/{id}/service-entry-sheets` | Registrar la hoja de servicios prestados | MEDIO | 2 | ERP_ADMIN, BUYER |
| 17 | POST | `/erp/sales-orders` | Crear una orden de venta | MEDIO | 2 | ERP_ADMIN, SALES |

---

## 1. POST /erp/bills/{billId}/invoice-match-runs

- **Origen:** CONTRATO
- **Nombre:** Conciliar la factura contra orden y recepción (three-way match)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.runInvoiceMatch` — `src/modules/erp/controllers/erp.controller.ts:254`

### Qué es y para qué sirve (negocio)

Conciliar la factura contra orden y recepción (three-way match). Caso de uso UC-38-13: Three-way match. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/bills/{billId}/invoice-match-runs` la atiende `ErpController.runInvoiceMatch` (src/modules/erp/controllers/erp.controller.ts:254). Exige sesión con alguno de los roles ERP_ADMIN, ACCOUNTS_PAYABLE. Valida el cuerpo como `CreateInvoiceMatchDto` (4 campos, 3 obligatorios). Delega en `ErpOperationsService.runInvoiceMatch`. Crea filas en erp.invoice_match_runs. Lee erp.purchase_order_items, erp.purchase_orders.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, ACCOUNTS_PAYABLE | `src/modules/erp/controllers/erp.controller.ts:254` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: billId | `src/modules/erp/controllers/erp.controller.ts:254` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.invoice_match_runs` | ESCRIBE | CREA | DIRECTA | ErpController.runInvoiceMatch → ErpOperationsService.runInvoiceMatch → ErpOperationsRepository.createInvoiceMatchRun | `src/modules/erp/repositories/erp-operations.repository.ts:600` |
| `erp.purchase_order_items` | LEE | LEE | DIRECTA | ErpController.runInvoiceMatch → ErpOperationsService.runInvoiceMatch → ErpOperationsRepository.findItemsByPurchaseOrder | `src/modules/erp/repositories/erp-operations.repository.ts:365` |
| `erp.purchase_orders` | LEE | LEE | DIRECTA | ErpController.runInvoiceMatch → ErpOperationsService.runInvoiceMatch → ErpOperationsRepository.findPurchaseOrderForUpdate | `src/modules/erp/repositories/erp-operations.repository.ts:287` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `billId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateInvoiceMatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:901` |
| `purchaseOrderId` | `string` | Sí | formato uuid | `@IsUUID()` | Orden de compra contra la que se concilia | `src/modules/erp/dto/erp.dto.ts:911` |
| `invoicedAmount` | `string` | Sí | — | `@IsNumberString()` | Importe facturado por el proveedor | `src/modules/erp/dto/erp.dto.ts:921` |
| `toleranceAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tolerancia admitida antes de marcar desviación | `src/modules/erp/dto/erp.dto.ts:932` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderId": "00000000-0000-4000-8000-000000000001",
  "invoicedAmount": "2500.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderId": "00000000-0000-4000-8000-000000000001",
  "invoicedAmount": "2500.00",
  "toleranceAmount": "10.00"
}
```

</details>

### Respuesta — `Promise<InvoiceMatchResponseDto>` · DTO `InvoiceMatchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:943` |
| `matchedAmount` | `string` | Sí | — | — | Importe de la orden contra el que se comparó | `src/modules/erp/dto/erp.dto.ts:949` |
| `varianceAmount` | `string` | Sí | — | — | Diferencia entre lo facturado y lo ordenado | `src/modules/erp/dto/erp.dto.ts:955` |
| `matched` | `boolean` | Sí | — | — | true si la diferencia queda dentro de la tolerancia | `src/modules/erp/dto/erp.dto.ts:963` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden de compra no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:169` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-13`

---

## 2. POST /erp/business-partners

- **Origen:** CONTRATO
- **Nombre:** Alta de socio de negocio con su cuenta bancaria
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createPartner` — `src/modules/erp/controllers/erp.controller.ts:63`

### Qué es y para qué sirve (negocio)

Alta de socio de negocio con su cuenta bancaria. Caso de uso UC-38-01: Alta de socio con cuenta bancaria. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/business-partners` la atiende `ErpController.createPartner` (src/modules/erp/controllers/erp.controller.ts:63). Exige sesión con alguno de los roles ERP_ADMIN. Valida el cuerpo como `CreatePartnerDto` (8 campos, 4 obligatorios). Delega en `ErpContractsService.createPartner`. Crea filas en erp.business_partner_bank_accounts, erp.business_partners. Lee erp.business_partners.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN | `src/modules/erp/controllers/erp.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.business_partner_bank_accounts` | ESCRIBE | CREA | DIRECTA | ErpController.createPartner → ErpContractsService.createPartner → ErpContractsRepository.createBankAccount | `src/modules/erp/repositories/erp-contracts.repository.ts:230` |
| `erp.business_partners` | ESCRIBE | CREA | DIRECTA | ErpController.createPartner → ErpContractsService.createPartner → ErpContractsRepository.createPartner | `src/modules/erp/repositories/erp-contracts.repository.ts:139` |
| `erp.business_partners` | LEE | LEE | DIRECTA | ErpController.createPartner → ErpContractsService.createPartner → ErpContractsRepository.findPartnerByNumber | `src/modules/erp/repositories/erp-contracts.repository.ts:175` |

### Cuerpo — DTO `CreatePartnerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:28` |
| `partnerNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Número de socio, único por tenant | `src/modules/erp/dto/erp.dto.ts:39` |
| `category` | `string` | Sí | valores: SUPPLIER, CUSTOMER, BOTH | `@IsIn(['SUPPLIER', 'CUSTOMER', 'BOTH'])` | — | `src/modules/erp/dto/erp.dto.ts:46` |
| `displayName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/erp/dto/erp.dto.ts:54` |
| `legalName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/erp/dto/erp.dto.ts:63` |
| `taxId` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Identificación fiscal | `src/modules/erp/dto/erp.dto.ts:72` |
| `bankName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Cuenta bancaria principal a registrar con el alta | `src/modules/erp/dto/erp.dto.ts:83` |
| `ibanMasked` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | IBAN enmascarado; nunca el número completo | `src/modules/erp/dto/erp.dto.ts:94` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "partnerNumber": "valor-ejemplo",
  "category": "SUPPLIER",
  "displayName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PartnerResponseDto>` · DTO `PartnerResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:105` |
| `partnerNumber` | `string` | Sí | — | — | Valor de partner number mantenido por la instancia. | `src/modules/erp/dto/erp.dto.ts:111` |
| `bankAccountId` | `string` | No | formato uuid | — | Identificador asociado a bank account. | `src/modules/erp/dto/erp.dto.ts:117` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un socio con ese número |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:253` |
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:59` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-01`

---

## 3. POST /erp/business-partners/{id}/bank-accounts/{accId}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar la cuenta bancaria del socio
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.verifyBankAccount` — `src/modules/erp/controllers/erp.controller.ts:75`

### Qué es y para qué sirve (negocio)

Verificar la cuenta bancaria del socio. Caso de uso UC-38-02: Verificar cuenta bancaria. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/business-partners/{id}/bank-accounts/{accId}/verify` la atiende `ErpController.verifyBankAccount` (src/modules/erp/controllers/erp.controller.ts:75). Exige sesión con alguno de los roles ERP_ADMIN. Delega en `ErpContractsService.verifyBankAccount`. Actualiza erp.business_partner_bank_accounts. Lee erp.business_partner_bank_accounts, erp.business_partners.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN | `src/modules/erp/controllers/erp.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, accId | `src/modules/erp/controllers/erp.controller.ts:75` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.business_partner_bank_accounts` | ESCRIBE | ACTUALIZA | POR_TIPO | ErpController.verifyBankAccount → ErpContractsService.verifyBankAccount | `src/modules/erp/services/erp-contracts.service.ts:187` |
| `erp.business_partner_bank_accounts` | LEE | LEE | DIRECTA | ErpController.verifyBankAccount → ErpContractsService.verifyBankAccount → ErpContractsRepository.findBankAccountForUpdate | `src/modules/erp/repositories/erp-contracts.repository.ts:259` |
| `erp.business_partners` | LEE | LEE | DIRECTA | ErpController.verifyBankAccount → ErpContractsService.verifyBankAccount → ErpContractsRepository.findPartnerById | `src/modules/erp/repositories/erp-contracts.repository.ts:166` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `accId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VerifyBankAccountResponseDto>` · DTO `VerifyBankAccountResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bankAccountId` | `string` | Sí | formato uuid | — | Identificador asociado a bank account. | `src/modules/erp/dto/erp.dto.ts:128` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a verification status concept. | `src/modules/erp/dto/erp.dto.ts:134` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Socio de negocio no encontrado; ResourceNotFoundException: Cuenta bancaria no encontrada |
| 409 | `CONFLICT` | ConflictException: La cuenta ya está verificada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no pertenece a ese socio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:70` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-02`

---

## 4. POST /erp/contracts

- **Origen:** CONTRATO
- **Nombre:** Crear un contrato en borrador
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createContract` — `src/modules/erp/controllers/erp.controller.ts:91`

### Qué es y para qué sirve (negocio)

Crear un contrato en borrador. Caso de uso UC-38-03: Crear contrato en borrador. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/contracts` la atiende `ErpController.createContract` (src/modules/erp/controllers/erp.controller.ts:91). Exige sesión con alguno de los roles ERP_ADMIN, CONTRACT_MANAGER. Valida el cuerpo como `ErpCreateContractDto` (9 campos, 6 obligatorios). Delega en `ErpContractsService.createContract`. Crea filas en erp.contracts. Lee erp.business_partners, erp.contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, CONTRACT_MANAGER | `src/modules/erp/controllers/erp.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.business_partners` | LEE | LEE | DIRECTA | ErpController.createContract → ErpContractsService.createContract → ErpContractsRepository.findPartnerById | `src/modules/erp/repositories/erp-contracts.repository.ts:166` |
| `erp.contracts` | ESCRIBE | CREA | DIRECTA | ErpController.createContract → ErpContractsService.createContract → ErpContractsRepository.createContract | `src/modules/erp/repositories/erp-contracts.repository.ts:274` |
| `erp.contracts` | LEE | LEE | DIRECTA | ErpController.createContract → ErpContractsService.createContract → ErpContractsRepository.findContractByNumber | `src/modules/erp/repositories/erp-contracts.repository.ts:330` |

### Cuerpo — DTO `ErpCreateContractDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:148` |
| `contractNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Número de contrato, único por tenant | `src/modules/erp/dto/erp.dto.ts:159` |
| `contractType` | `string` | Sí | valores: SERVICE, SUPPLY, LEASE | `@IsIn(['SERVICE', 'SUPPLY', 'LEASE'])` | — | `src/modules/erp/dto/erp.dto.ts:166` |
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/erp/dto/erp.dto.ts:174` |
| `primaryBusinessPartnerId` | `string` | Sí | formato uuid | `@IsUUID()` | Socio de negocio contraparte | `src/modules/erp/dto/erp.dto.ts:181` |
| `startDate` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:188` |
| `endDate` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:196` |
| `totalValue` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/erp/dto/erp.dto.ts:204` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/erp/dto/erp.dto.ts:213` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "contractNumber": "valor-ejemplo",
  "contractType": "SERVICE",
  "title": "valor-ejemplo",
  "primaryBusinessPartnerId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ContractResponseDto>` · DTO `ContractResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:224` |
| `contractCode` | `string` | Sí | — | — | Valor de contract code mantenido por la instancia. | sin fuente |
| `externalProviderId` | `string` | Sí | formato uuid | — | Identificador asociado a external provider. | sin fuente |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del contrato | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Socio de negocio no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe un contrato con ese número |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato debe terminar después de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:84` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-03`

---

## 5. POST /erp/contracts/{id}/amendments

- **Origen:** CONTRATO
- **Nombre:** Enmendar el contrato
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createAmendment` — `src/modules/erp/controllers/erp.controller.ts:119`

### Qué es y para qué sirve (negocio)

Enmendar el contrato. Caso de uso UC-38-05: Enmendar contrato. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/contracts/{id}/amendments` la atiende `ErpController.createAmendment` (src/modules/erp/controllers/erp.controller.ts:119). Exige sesión con alguno de los roles ERP_ADMIN, CONTRACT_MANAGER. Valida el cuerpo como `CreateAmendmentDto` (4 campos, 2 obligatorios). Delega en `ErpContractsService.createAmendment`. Crea filas en erp.contract_amendments. Lee erp.contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, CONTRACT_MANAGER | `src/modules/erp/controllers/erp.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:119` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.contract_amendments` | ESCRIBE | CREA | DIRECTA | ErpController.createAmendment → ErpContractsService.createAmendment → ErpContractsRepository.createAmendment | `src/modules/erp/repositories/erp-contracts.repository.ts:424` |
| `erp.contracts` | LEE | LEE | DIRECTA | ErpController.createAmendment → ErpContractsService.createAmendment → ErpContractsService.assertMutableContract → ErpContractsRepository.findContractByIdForUpdate | `src/modules/erp/repositories/erp-contracts.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAmendmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `baseVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión sobre la que se enmienda | `src/modules/erp/dto/erp.dto.ts:304` |
| `amendmentType` | `string` | Sí | valores: SCOPE, PRICE | `@IsIn(['SCOPE', 'PRICE'])` | — | `src/modules/erp/dto/erp.dto.ts:311` |
| `reasonText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/erp/dto/erp.dto.ts:320` |
| `effectiveDate` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:328` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "baseVersionId": "00000000-0000-4000-8000-000000000001",
  "amendmentType": "SCOPE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "baseVersionId": "00000000-0000-4000-8000-000000000001",
  "amendmentType": "SCOPE",
  "reasonText": "Texto descriptivo de ejemplo",
  "effectiveDate": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ContractChangeResponseDto>` · DTO `ContractChangeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:404` |
| `contractId` | `string` | Sí | formato uuid | — | Identificador asociado a contract. | `src/modules/erp/dto/erp.dto.ts:410` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:416` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contrato no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato no admite cambios en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:105` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-05`

---

## 6. POST /erp/contracts/{id}/approval-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar o resolver la aprobación del contrato
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.requestApproval` — `src/modules/erp/controllers/erp.controller.ts:103`

### Qué es y para qué sirve (negocio)

Solicitar o resolver la aprobación del contrato. Caso de uso UC-38-04: Solicitar/resolver aprobación. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/contracts/{id}/approval-requests` la atiende `ErpController.requestApproval` (src/modules/erp/controllers/erp.controller.ts:103). Exige sesión con alguno de los roles ERP_ADMIN, CONTRACT_MANAGER. Valida el cuerpo como `ErpRequestApprovalDto` (2 campos, 0 obligatorios). Delega en `ErpContractsService.requestApproval`. Crea filas en erp.contract_approval_requests. Actualiza erp.contracts. Lee erp.contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, CONTRACT_MANAGER | `src/modules/erp/controllers/erp.controller.ts:103` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:103` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.contract_approval_requests` | ESCRIBE | CREA | DIRECTA | ErpController.requestApproval → ErpContractsService.requestApproval → ErpContractsRepository.createApprovalRequest | `src/modules/erp/repositories/erp-contracts.repository.ts:365` |
| `erp.contracts` | ESCRIBE | ACTUALIZA | POR_TIPO | ErpController.requestApproval → ErpContractsService.requestApproval | `src/modules/erp/services/erp-contracts.service.ts:324` |
| `erp.contracts` | LEE | LEE | DIRECTA | ErpController.requestApproval → ErpContractsService.requestApproval → ErpContractsRepository.findContractByIdForUpdate | `src/modules/erp/repositories/erp-contracts.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ErpRequestApprovalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Fecha límite de la aprobación | `src/modules/erp/dto/erp.dto.ts:257` |
| `decision` | `string` | No | valores: APPROVED, REJECTED | `@IsOptional()` `@IsIn(['APPROVED', 'REJECTED'])` | Decisión inmediata cuando el aprobador resuelve en el acto | `src/modules/erp/dto/erp.dto.ts:268` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "dueAt": "2026-07-31T12:00:00.000Z",
  "decision": "APPROVED"
}
```

</details>

### Respuesta — `Promise<ApprovalResponseDto>` · DTO `ApprovalResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:279` |
| `changeRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a change request. | sin fuente |
| `changeStatusConceptId` | `string` | Sí | formato uuid | — | Estado del cambio tras la decisión | sin fuente |
| `approvedSteps` | `number` | Sí | — | — | Pasos aprobados hasta ahora | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contrato no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato está terminado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:85` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-04`

---

## 7. POST /erp/contracts/{id}/payment-schedules/generate

- **Origen:** CONTRATO
- **Nombre:** Generar el cronograma de cuotas del contrato
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.generatePaymentSchedule` — `src/modules/erp/controllers/erp.controller.ts:161`

### Qué es y para qué sirve (negocio)

Generar el cronograma de cuotas del contrato. Caso de uso UC-38-16: Cronograma de cuotas. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/contracts/{id}/payment-schedules/generate` la atiende `ErpController.generatePaymentSchedule` (src/modules/erp/controllers/erp.controller.ts:161). Exige sesión con alguno de los roles ERP_ADMIN, SYSTEM_WORKER. Valida el cuerpo como `GeneratePaymentScheduleDto` (4 campos, 2 obligatorios). Delega en `ErpContractsService.generatePaymentSchedule`. Crea filas en erp.contract_payment_schedules. Lee erp.contract_payment_schedules, erp.contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, SYSTEM_WORKER | `src/modules/erp/controllers/erp.controller.ts:161` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:161` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.contract_payment_schedules` | ESCRIBE | CREA | DIRECTA | ErpController.generatePaymentSchedule → ErpContractsService.generatePaymentSchedule → ErpContractsRepository.createPaymentSchedule | `src/modules/erp/repositories/erp-contracts.repository.ts:619` |
| `erp.contract_payment_schedules` | LEE | LEE | DIRECTA | ErpController.generatePaymentSchedule → ErpContractsService.generatePaymentSchedule → ErpContractsRepository.findSchedulesByContract | `src/modules/erp/repositories/erp-contracts.repository.ts:640` |
| `erp.contracts` | LEE | LEE | DIRECTA | ErpController.generatePaymentSchedule → ErpContractsService.generatePaymentSchedule → ErpContractsRepository.findContractByIdForUpdate | `src/modules/erp/repositories/erp-contracts.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `GeneratePaymentScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `installments` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Número de cuotas a generar | `src/modules/erp/dto/erp.dto.ts:427` |
| `firstDueDate` | `string` | Sí | formato date-time | `@IsISO8601()` | Fecha de la primera cuota | `src/modules/erp/dto/erp.dto.ts:437` |
| `intervalDays` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Días entre cuotas | `src/modules/erp/dto/erp.dto.ts:449` |
| `direction` | `string` | No | valores: OUTBOUND, INBOUND | `@IsOptional()` `@IsIn(['OUTBOUND', 'INBOUND'])` | Sentido del pago | `src/modules/erp/dto/erp.dto.ts:460` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "installments": 1,
  "firstDueDate": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "installments": 1,
  "firstDueDate": "2026-07-31T12:00:00.000Z",
  "intervalDays": 30,
  "direction": "OUTBOUND"
}
```

</details>

### Respuesta — `Promise<PaymentScheduleResponseDto>` · DTO `PaymentScheduleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `contractId` | `string` | Sí | formato uuid | — | Identificador asociado a contract. | `src/modules/erp/dto/erp.dto.ts:471` |
| `created` | `number` | Sí | — | — | Cuotas creadas en esta ejecución | `src/modules/erp/dto/erp.dto.ts:477` |
| `installmentAmount` | `string` | Sí | — | — | Importe de cada cuota | `src/modules/erp/dto/erp.dto.ts:483` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contrato no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato no tiene valor total del que derivar las cuotas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:124` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-16`

---

## 8. POST /erp/contracts/{id}/renewals

- **Origen:** CONTRATO
- **Nombre:** Renovar el contrato extendiendo su vigencia
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createRenewal` — `src/modules/erp/controllers/erp.controller.ts:135`

### Qué es y para qué sirve (negocio)

Renovar el contrato extendiendo su vigencia. Caso de uso UC-38-06: Renovar contrato. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/contracts/{id}/renewals` la atiende `ErpController.createRenewal` (src/modules/erp/controllers/erp.controller.ts:135). Exige sesión con alguno de los roles ERP_ADMIN, CONTRACT_MANAGER. Valida el cuerpo como `CreateRenewalDto` (3 campos, 2 obligatorios). Delega en `ErpContractsService.createRenewal`. Crea filas en erp.contract_renewals. Lee erp.contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, CONTRACT_MANAGER | `src/modules/erp/controllers/erp.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:135` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.contract_renewals` | ESCRIBE | CREA | DIRECTA | ErpController.createRenewal → ErpContractsService.createRenewal → ErpContractsRepository.createRenewal | `src/modules/erp/repositories/erp-contracts.repository.ts:488` |
| `erp.contracts` | LEE | LEE | DIRECTA | ErpController.createRenewal → ErpContractsService.createRenewal → ErpContractsService.assertMutableContract → ErpContractsRepository.findContractByIdForUpdate | `src/modules/erp/repositories/erp-contracts.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateRenewalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `renewalType` | `string` | Sí | valores: AUTOMATIC, NEGOTIATED | `@IsIn(['AUTOMATIC', 'NEGOTIATED'])` | — | `src/modules/erp/dto/erp.dto.ts:338` |
| `newEndDate` | `string` | Sí | formato date-time | `@IsISO8601()` | Nueva fecha de fin | `src/modules/erp/dto/erp.dto.ts:345` |
| `proposedValue` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/erp/dto/erp.dto.ts:353` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "renewalType": "AUTOMATIC",
  "newEndDate": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "renewalType": "AUTOMATIC",
  "newEndDate": "2026-07-31T12:00:00.000Z",
  "proposedValue": "130000.00"
}
```

</details>

### Respuesta — `Promise<ContractChangeResponseDto>` · DTO `ContractChangeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:404` |
| `contractId` | `string` | Sí | formato uuid | — | Identificador asociado a contract. | `src/modules/erp/dto/erp.dto.ts:410` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:416` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contrato no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato no admite cambios en su estado actual; PreconditionFailedException: La renovación debe extender la vigencia más allá del fin actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:106` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-06`

---

## 9. POST /erp/contracts/{id}/terminations

- **Origen:** CONTRATO
- **Nombre:** Terminar el contrato y liquidarlo
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createTermination` — `src/modules/erp/controllers/erp.controller.ts:148`

### Qué es y para qué sirve (negocio)

Terminar el contrato y liquidarlo. Caso de uso UC-38-07: Terminar y liquidar. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/contracts/{id}/terminations` la atiende `ErpController.createTermination` (src/modules/erp/controllers/erp.controller.ts:148). Exige sesión con alguno de los roles ERP_ADMIN, CONTRACT_MANAGER. Valida el cuerpo como `CreateTerminationDto` (4 campos, 2 obligatorios). Delega en `ErpContractsService.createTermination`. Crea filas en erp.contract_terminations. Actualiza erp.contracts. Lee erp.contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, CONTRACT_MANAGER | `src/modules/erp/controllers/erp.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:148` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.contract_terminations` | ESCRIBE | CREA | DIRECTA | ErpController.createTermination → ErpContractsService.createTermination → ErpContractsRepository.createTermination | `src/modules/erp/repositories/erp-contracts.repository.ts:557` |
| `erp.contracts` | ESCRIBE | ACTUALIZA | POR_TIPO | ErpController.createTermination → ErpContractsService.createTermination | `src/modules/erp/services/erp-contracts.service.ts:487` |
| `erp.contracts` | LEE | LEE | DIRECTA | ErpController.createTermination → ErpContractsService.createTermination → ErpContractsRepository.findContractByIdForUpdate | `src/modules/erp/repositories/erp-contracts.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateTerminationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `terminationType` | `string` | Sí | valores: CAUSE, CONVENIENCE | `@IsIn(['CAUSE', 'CONVENIENCE'])` | — | `src/modules/erp/dto/erp.dto.ts:363` |
| `effectiveDate` | `string` | Sí | formato date-time | `@IsISO8601()` | Fecha efectiva de la terminación | `src/modules/erp/dto/erp.dto.ts:373` |
| `reasonText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/erp/dto/erp.dto.ts:382` |
| `settlementAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Liquidación pactada | `src/modules/erp/dto/erp.dto.ts:393` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "terminationType": "CAUSE",
  "effectiveDate": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "terminationType": "CAUSE",
  "effectiveDate": "2026-07-31T12:00:00.000Z",
  "reasonText": "Texto descriptivo de ejemplo",
  "settlementAmount": "5000.00"
}
```

</details>

### Respuesta — `Promise<ContractChangeResponseDto>` · DTO `ContractChangeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:404` |
| `contractId` | `string` | Sí | formato uuid | — | Identificador asociado a contract. | `src/modules/erp/dto/erp.dto.ts:410` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:416` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contrato no encontrado |
| 409 | `CONFLICT` | ConflictException: El contrato ya está terminado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:107` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-07`

---

## 10. POST /erp/employees/{id}/time-off

- **Origen:** CONTRATO
- **Nombre:** Solicitar una ausencia
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.requestTimeOff` — `src/modules/erp/controllers/erp.controller.ts:189`

### Qué es y para qué sirve (negocio)

Solicitar una ausencia. Caso de uso UC-38-09: Solicitar y resolver ausencia. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/employees/{id}/time-off` la atiende `ErpController.requestTimeOff` (src/modules/erp/controllers/erp.controller.ts:189). Exige sesión con alguno de los roles ERP_ADMIN, HR_ADMIN, EMPLOYEE. Valida el cuerpo como `RequestTimeOffDto` (4 campos, 3 obligatorios). Delega en `ErpOperationsService.requestTimeOff`. Crea filas en erp.time_off_requests. Lee erp.employees, erp.time_off_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, HR_ADMIN, EMPLOYEE | `src/modules/erp/controllers/erp.controller.ts:189` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:189` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.employees` | LEE | LEE | DIRECTA | ErpController.requestTimeOff → ErpOperationsService.requestTimeOff → ErpOperationsRepository.findEmployeeById | `src/modules/erp/repositories/erp-operations.repository.ts:147` |
| `erp.time_off_requests` | ESCRIBE | CREA | DIRECTA | ErpController.requestTimeOff → ErpOperationsService.requestTimeOff → ErpOperationsRepository.createTimeOffRequest | `src/modules/erp/repositories/erp-operations.repository.ts:194` |
| `erp.time_off_requests` | LEE | LEE | DIRECTA | ErpController.requestTimeOff → ErpOperationsService.requestTimeOff → ErpOperationsRepository.findOverlappingTimeOff | `src/modules/erp/repositories/erp-operations.repository.ts:239` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RequestTimeOffDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `leaveType` | `string` | Sí | valores: VACATION, SICK | `@IsIn(['VACATION', 'SICK'])` | — | `src/modules/erp/dto/erp.dto.ts:561` |
| `startDate` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:568` |
| `endDate` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:575` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/erp/dto/erp.dto.ts:584` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "leaveType": "VACATION",
  "startDate": "2026-07-31T12:00:00.000Z",
  "endDate": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "leaveType": "VACATION",
  "startDate": "2026-07-31T12:00:00.000Z",
  "endDate": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<TimeOffResponseDto>` · DTO `TimeOffResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:605` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:611` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Empleado no encontrado |
| 409 | `CONFLICT` | ConflictException: El empleado ya tiene una ausencia en esas fechas |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ausencia debe terminar después de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 38 — ERP — etapa `UC-38-09`

---

## 11. POST /erp/employees/{id}/time-off/{reqId}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar o rechazar la solicitud de ausencia
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.approveTimeOff` — `src/modules/erp/controllers/erp.controller.ts:202`

### Qué es y para qué sirve (negocio)

Aprobar o rechazar la solicitud de ausencia. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/employees/{id}/time-off/{reqId}/approve` la atiende `ErpController.approveTimeOff` (src/modules/erp/controllers/erp.controller.ts:202). Exige sesión con alguno de los roles ERP_ADMIN, HR_ADMIN. Valida el cuerpo como `ApproveTimeOffDto` (1 campo, 1 obligatorio). Delega en `ErpOperationsService.approveTimeOff`. Actualiza erp.time_off_requests. Lee erp.time_off_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, HR_ADMIN | `src/modules/erp/controllers/erp.controller.ts:202` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, reqId | `src/modules/erp/controllers/erp.controller.ts:202` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.time_off_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ErpController.approveTimeOff → ErpOperationsService.approveTimeOff | `src/modules/erp/services/erp-operations.service.ts:202` |
| `erp.time_off_requests` | LEE | LEE | DIRECTA | ErpController.approveTimeOff → ErpOperationsService.approveTimeOff → ErpOperationsRepository.findTimeOffForUpdate | `src/modules/erp/repositories/erp-operations.repository.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `reqId` | path | Sí | `string` | — |

### Cuerpo — DTO `ApproveTimeOffDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `approved` | `boolean` | Sí | — | `@IsIn([true, false])` | true aprueba la solicitud; false la rechaza | `src/modules/erp/dto/erp.dto.ts:594` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "approved": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "approved": true
}
```

</details>

### Respuesta — `Promise<TimeOffResponseDto>` · DTO `TimeOffResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:605` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:611` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de ausencia no encontrada |
| 409 | `CONFLICT` | ConflictException: La solicitud ya fue resuelta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:138` |

### Flujos

- Módulo 38 — ERP — etapa `ctrl:ErpController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /erp/employees/onboard

- **Origen:** CONTRATO
- **Nombre:** Alta de empleado
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.onboardEmployee` — `src/modules/erp/controllers/erp.controller.ts:177`

### Qué es y para qué sirve (negocio)

Alta de empleado. Caso de uso UC-38-08: Alta de empleado. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/employees/onboard` la atiende `ErpController.onboardEmployee` (src/modules/erp/controllers/erp.controller.ts:177). Exige sesión con alguno de los roles ERP_ADMIN, HR_ADMIN. Valida el cuerpo como `OnboardEmployeeDto` (5 campos, 2 obligatorios). Delega en `ErpOperationsService.onboardEmployee`. Crea filas en erp.employees.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, HR_ADMIN | `src/modules/erp/controllers/erp.controller.ts:177` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.employees` | ESCRIBE | CREA | DIRECTA | ErpController.onboardEmployee → ErpOperationsService.onboardEmployee → ErpOperationsRepository.createEmployee | `src/modules/erp/repositories/erp-operations.repository.ts:121` |

### Cuerpo — DTO `OnboardEmployeeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:493` |
| `fullName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/erp/dto/erp.dto.ts:501` |
| `personUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario de la plataforma vinculado | `src/modules/erp/dto/erp.dto.ts:512` |
| `hireDate` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:520` |
| `baseSalary` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/erp/dto/erp.dto.ts:528` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fullName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fullName": "Nombre de ejemplo",
  "personUserId": "00000000-0000-4000-8000-000000000001",
  "hireDate": "2026-07-31T12:00:00.000Z",
  "baseSalary": "8000.00"
}
```

</details>

### Respuesta — `Promise<EmployeeResponseDto>` · DTO `EmployeeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:539` |
| `fullName` | `string` | Sí | — | — | Valor de full name mantenido por la instancia. | `src/modules/erp/dto/erp.dto.ts:545` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:551` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 38 — ERP — etapa `UC-38-08`

---

## 13. POST /erp/lease-contracts/{id}/valuations

- **Origen:** CONTRATO
- **Nombre:** Registrar la valoración IFRS 16 del arrendamiento
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createLeaseValuation` — `src/modules/erp/controllers/erp.controller.ts:283`

### Qué es y para qué sirve (negocio)

Registrar la valoración IFRS 16 del arrendamiento. Caso de uso UC-38-15: Valoración IFRS 16. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/lease-contracts/{id}/valuations` la atiende `ErpController.createLeaseValuation` (src/modules/erp/controllers/erp.controller.ts:283). Exige sesión con alguno de los roles ERP_ADMIN, ACCOUNTANT. Valida el cuerpo como `CreateLeaseValuationDto` (5 campos, 3 obligatorios). Delega en `ErpOperationsService.createLeaseValuation`. Crea filas en erp.lease_valuations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, ACCOUNTANT | `src/modules/erp/controllers/erp.controller.ts:283` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:283` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.lease_valuations` | ESCRIBE | CREA | DIRECTA | ErpController.createLeaseValuation → ErpOperationsService.createLeaseValuation → ErpOperationsRepository.createLeaseValuation | `src/modules/erp/repositories/erp-operations.repository.ts:737` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateLeaseValuationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valuationDate` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:1040` |
| `rightOfUseAssetValue` | `string` | Sí | — | `@IsNumberString()` | Valor del activo por derecho de uso | `src/modules/erp/dto/erp.dto.ts:1050` |
| `leaseLiabilityValue` | `string` | Sí | — | `@IsNumberString()` | Pasivo por arrendamiento | `src/modules/erp/dto/erp.dto.ts:1057` |
| `interestExpense` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/erp/dto/erp.dto.ts:1065` |
| `depreciationExpense` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/erp/dto/erp.dto.ts:1073` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "valuationDate": "2026-07-31T12:00:00.000Z",
  "rightOfUseAssetValue": "95000.00",
  "leaseLiabilityValue": "92000.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "valuationDate": "2026-07-31T12:00:00.000Z",
  "rightOfUseAssetValue": "95000.00",
  "leaseLiabilityValue": "92000.00",
  "interestExpense": "1200.00",
  "depreciationExpense": "2500.00"
}
```

</details>

### Respuesta — `Promise<LeaseValuationResponseDto>` · DTO `LeaseValuationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:1084` |
| `leaseContractId` | `string` | Sí | formato uuid | — | Identificador asociado a lease contract. | `src/modules/erp/dto/erp.dto.ts:1090` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:1096` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 38 — ERP — etapa `UC-38-15`

---

## 14. POST /erp/purchase-orders

- **Origen:** CONTRATO
- **Nombre:** Emitir una orden de compra desde la requisición
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createPurchaseOrder` — `src/modules/erp/controllers/erp.controller.ts:216`

### Qué es y para qué sirve (negocio)

Emitir una orden de compra desde la requisición. Caso de uso UC-38-10: Emitir orden de compra. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/purchase-orders` la atiende `ErpController.createPurchaseOrder` (src/modules/erp/controllers/erp.controller.ts:216). Exige sesión con alguno de los roles ERP_ADMIN, BUYER. Valida el cuerpo como `ErpCreatePurchaseOrderDto` (11 campos, 7 obligatorios). Delega en `ErpOperationsService.createPurchaseOrder`. Crea filas en erp.purchase_order_items, erp.purchase_orders. Lee erp.business_partners.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, BUYER | `src/modules/erp/controllers/erp.controller.ts:216` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.business_partners` | LEE | LEE | DIRECTA | ErpController.createPurchaseOrder → ErpOperationsService.createPurchaseOrder → ErpContractsRepository.findPartnerById | `src/modules/erp/repositories/erp-contracts.repository.ts:166` |
| `erp.purchase_order_items` | ESCRIBE | CREA | DIRECTA | ErpController.createPurchaseOrder → ErpOperationsService.createPurchaseOrder → ErpOperationsRepository.createPurchaseOrderItem | `src/modules/erp/repositories/erp-operations.repository.ts:338` |
| `erp.purchase_orders` | ESCRIBE | CREA | DIRECTA | ErpController.createPurchaseOrder → ErpOperationsService.createPurchaseOrder → ErpOperationsRepository.createPurchaseOrder | `src/modules/erp/repositories/erp-operations.repository.ts:258` |

### Cuerpo — DTO `ErpCreatePurchaseOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:655` |
| `purchaseOrderNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Número de orden, único por tenant | `src/modules/erp/dto/erp.dto.ts:666` |
| `supplierBusinessPartnerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:673` |
| `purchaseRequisitionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Requisición de origen | `src/modules/erp/dto/erp.dto.ts:681` |
| `contractId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contrato marco | `src/modules/erp/dto/erp.dto.ts:689` |
| `expectedDeliveryDate` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:697` |
| `items` | `array<PurchaseOrderItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PurchaseOrderItemDto)` | — | `src/modules/erp/dto/erp.dto.ts:707` |
| `items[].itemType` | `string` | Sí | valores: MATERIAL, SERVICE | `@IsIn(['MATERIAL', 'SERVICE'])` | — | `src/modules/erp/dto/erp.dto.ts:621` |
| `items[].description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/erp/dto/erp.dto.ts:630` |
| `items[].quantity` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/erp/dto/erp.dto.ts:637` |
| `items[].unitPrice` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/erp/dto/erp.dto.ts:644` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PurchaseOrderResponseDto>` · DTO `PurchaseOrderResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:718` |
| `purchaseOrderNumber` | `string` | Sí | — | — | Valor de purchase order number mantenido por la instancia. | `src/modules/erp/dto/erp.dto.ts:724` |
| `lineIds` | `array<string>` | Sí | — | — | Ids de las líneas creadas | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:153` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-10`

---

## 15. POST /erp/purchase-orders/{id}/goods-receipts

- **Origen:** CONTRATO
- **Nombre:** Registrar la recepción de mercancía
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createGoodsReceipt` — `src/modules/erp/controllers/erp.controller.ts:228`

### Qué es y para qué sirve (negocio)

Registrar la recepción de mercancía. Caso de uso UC-38-11: Recepción de mercancía. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/purchase-orders/{id}/goods-receipts` la atiende `ErpController.createGoodsReceipt` (src/modules/erp/controllers/erp.controller.ts:228). Exige sesión con alguno de los roles ERP_ADMIN, BUYER, WAREHOUSE. Valida el cuerpo como `ErpCreateGoodsReceiptDto` (7 campos, 5 obligatorios). Delega en `ErpOperationsService.createGoodsReceipt`. Crea filas en erp.goods_receipt_items, erp.goods_receipts. Actualiza erp.purchase_orders. Lee erp.purchase_orders.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, BUYER, WAREHOUSE | `src/modules/erp/controllers/erp.controller.ts:228` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:228` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.goods_receipt_items` | ESCRIBE | CREA | DIRECTA | ErpController.createGoodsReceipt → ErpOperationsService.createGoodsReceipt → ErpOperationsRepository.createGoodsReceiptItem | `src/modules/erp/repositories/erp-operations.repository.ts:467` |
| `erp.goods_receipts` | ESCRIBE | CREA | DIRECTA | ErpController.createGoodsReceipt → ErpOperationsService.createGoodsReceipt → ErpOperationsRepository.createGoodsReceipt | `src/modules/erp/repositories/erp-operations.repository.ts:408` |
| `erp.purchase_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | ErpController.createGoodsReceipt → ErpOperationsService.createGoodsReceipt | `src/modules/erp/services/erp-operations.service.ts:364` |
| `erp.purchase_orders` | LEE | LEE | DIRECTA | ErpController.createGoodsReceipt → ErpOperationsService.createGoodsReceipt → ErpOperationsRepository.findPurchaseOrderForUpdate | `src/modules/erp/repositories/erp-operations.repository.ts:287` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ErpCreateGoodsReceiptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:778` |
| `receiptNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Número de recepción | `src/modules/erp/dto/erp.dto.ts:786` |
| `supplierDeliveryReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia del albarán del proveedor | `src/modules/erp/dto/erp.dto.ts:795` |
| `items` | `array<GoodsReceiptItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => GoodsReceiptItemDto)` | — | `src/modules/erp/dto/erp.dto.ts:805` |
| `items[].purchaseOrderItemId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea de la orden que se recibe | `src/modules/erp/dto/erp.dto.ts:749` |
| `items[].receivedQuantity` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/erp/dto/erp.dto.ts:756` |
| `items[].acceptedQuantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Cantidad aceptada tras control de calidad | `src/modules/erp/dto/erp.dto.ts:767` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<GoodsReceiptResponseDto>` · DTO `GoodsReceiptResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:816` |
| `receiptNumber` | `string` | Sí | — | — | Valor de receipt number mantenido por la instancia. | `src/modules/erp/dto/erp.dto.ts:822` |
| `lotIds` | `array<string>` | Sí | — | — | Ids de lotes afectados | sin fuente |
| `ledgerEntryIds` | `array<string>` | Sí | — | — | Ids de asientos del ledger | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden de compra no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La orden de compra está cerrada; PreconditionFailedException: La cantidad aceptada no puede superar la recibida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:154` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-11`

---

## 16. POST /erp/purchase-orders/{id}/service-entry-sheets

- **Origen:** CONTRATO
- **Nombre:** Registrar la hoja de servicios prestados
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createServiceEntrySheet` — `src/modules/erp/controllers/erp.controller.ts:241`

### Qué es y para qué sirve (negocio)

Registrar la hoja de servicios prestados. Caso de uso UC-38-12: Hoja de servicios. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/purchase-orders/{id}/service-entry-sheets` la atiende `ErpController.createServiceEntrySheet` (src/modules/erp/controllers/erp.controller.ts:241). Exige sesión con alguno de los roles ERP_ADMIN, BUYER. Valida el cuerpo como `CreateServiceEntrySheetDto` (4 campos, 2 obligatorios). Delega en `ErpOperationsService.createServiceEntrySheet`. Crea filas en erp.service_entry_sheets. Lee erp.purchase_orders.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, BUYER | `src/modules/erp/controllers/erp.controller.ts:241` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/erp/controllers/erp.controller.ts:241` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.purchase_orders` | LEE | LEE | DIRECTA | ErpController.createServiceEntrySheet → ErpOperationsService.createServiceEntrySheet → ErpOperationsRepository.findPurchaseOrderForUpdate | `src/modules/erp/repositories/erp-operations.repository.ts:287` |
| `erp.service_entry_sheets` | ESCRIBE | CREA | DIRECTA | ErpController.createServiceEntrySheet → ErpOperationsService.createServiceEntrySheet → ErpOperationsRepository.createServiceEntrySheet | `src/modules/erp/repositories/erp-operations.repository.ts:531` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateServiceEntrySheetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:844` |
| `sheetNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/erp/dto/erp.dto.ts:852` |
| `performedFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:860` |
| `performedTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/erp/dto/erp.dto.ts:868` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sheetNumber": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sheetNumber": "valor-ejemplo",
  "performedFrom": "2026-07-31T12:00:00.000Z",
  "performedTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ServiceEntrySheetResponseDto>` · DTO `ServiceEntrySheetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:879` |
| `sheetNumber` | `string` | Sí | — | — | Valor de sheet number mantenido por la instancia. | `src/modules/erp/dto/erp.dto.ts:885` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:891` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden de compra no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 38 — ERP — etapa `UC-38-12`

---

## 17. POST /erp/sales-orders

- **Origen:** CONTRATO
- **Nombre:** Crear una orden de venta
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ErpController.createSalesOrder` — `src/modules/erp/controllers/erp.controller.ts:271`

### Qué es y para qué sirve (negocio)

Crear una orden de venta. Caso de uso UC-38-14: Orden de venta. Dentro del módulo (descripción del modelo, en inglés): «Tenant-level enterprise resource management that complements the per-practice accounting subledgers (module 16/16B).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/erp/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_38_erp.puml:47`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /erp/sales-orders` la atiende `ErpController.createSalesOrder` (src/modules/erp/controllers/erp.controller.ts:271). Exige sesión con alguno de los roles ERP_ADMIN, SALES. Valida el cuerpo como `CreateSalesOrderDto` (5 campos, 3 obligatorios). Delega en `ErpOperationsService.createSalesOrder`. Crea filas en erp.sales_orders. Lee erp.business_partners.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ERP_ADMIN, SALES | `src/modules/erp/controllers/erp.controller.ts:271` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `erp.business_partners` | LEE | LEE | DIRECTA | ErpController.createSalesOrder → ErpOperationsService.createSalesOrder → ErpContractsRepository.findPartnerById | `src/modules/erp/repositories/erp-contracts.repository.ts:166` |
| `erp.sales_orders` | ESCRIBE | CREA | DIRECTA | ErpController.createSalesOrder → ErpOperationsService.createSalesOrder → ErpOperationsRepository.createSalesOrder | `src/modules/erp/repositories/erp-operations.repository.ts:668` |

### Cuerpo — DTO `CreateSalesOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:973` |
| `salesOrderNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/erp/dto/erp.dto.ts:981` |
| `customerBusinessPartnerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:988` |
| `opportunityId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Oportunidad ganada que la origina | `src/modules/erp/dto/erp.dto.ts:999` |
| `contractId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/erp/dto/erp.dto.ts:1007` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "salesOrderNumber": "valor-ejemplo",
  "customerBusinessPartnerId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "salesOrderNumber": "valor-ejemplo",
  "customerBusinessPartnerId": "00000000-0000-4000-8000-000000000001",
  "opportunityId": "00000000-0000-4000-8000-000000000001",
  "contractId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SalesOrderResponseDto>` · DTO `SalesOrderResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/erp/dto/erp.dto.ts:1018` |
| `salesOrderNumber` | `string` | Sí | — | — | Valor de sales order number mantenido por la instancia. | `src/modules/erp/dto/erp.dto.ts:1024` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/erp/dto/erp.dto.ts:1030` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cliente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/erp.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/erp/controllers/erp.controller.spec.ts:183` |

### Flujos

- Módulo 38 — ERP — etapa `UC-38-14`

---

