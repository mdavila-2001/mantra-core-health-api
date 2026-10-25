<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `accounting`

- **Bloque:** Financiero y ERP (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)
- **Operaciones:** 45 (45 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 27 · BAJO 18
- **Tablas distintas que tocan:** 46
- **Respuestas de error y detalle contractual:** `openapi/endpoints/accounting.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/accounting/accounts` | Plan de cuentas de una práctica | BAJO | 2 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 2 | POST | `/accounting/accounts` | Crear una cuenta del plan contable | MEDIO | 3 | SECURITY_ADMIN |
| 3 | GET | `/accounting/accrual-objects` | Registro de devengos de una práctica | BAJO | 6 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 4 | POST | `/accounting/accrual-objects` | Crear objeto de devengo y su cronograma | MEDIO | 9 | SECURITY_ADMIN |
| 5 | POST | `/accounting/accruals/run` | Postear devengo periódico (accrual run) | MEDIO | 13 | SECURITY_ADMIN |
| 6 | GET | `/accounting/assets` | Registro de activos fijos de una práctica | BAJO | 3 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 7 | POST | `/accounting/assets/capitalize` | Capitalizar activo (alta y asignación) | MEDIO | 15 | SECURITY_ADMIN |
| 8 | GET | `/accounting/balance-sheet` | Balance general de una práctica a una fecha de corte | BAJO | 5 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 9 | POST | `/accounting/clearing-documents` | Compensar/clearing de partidas abiertas | MEDIO | 15 | SECURITY_ADMIN |
| 10 | POST | `/accounting/depreciation/run` | Ejecutar depreciación de activos (batch) | MEDIO | 14 | SECURITY_ADMIN |
| 11 | GET | `/accounting/dimensions` | Dimensiones analíticas de una práctica | BAJO | 8 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 12 | POST | `/accounting/exchange-rates` | Registrar tipo de cambio para conversión | MEDIO | 3 | SYSTEM |
| 13 | POST | `/accounting/fiscal-periods/{id}/lock` | Cerrar/bloquear un periodo fiscal | MEDIO | 4 | SECURITY_ADMIN |
| 14 | GET | `/accounting/fiscal-years` | Ejercicio fiscal vigente de una práctica | BAJO | 4 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 15 | POST | `/accounting/fiscal-years` | Abrir un ejercicio fiscal y sus periodos | MEDIO | 4 | SECURITY_ADMIN |
| 16 | GET | `/accounting/general-ledger` | Libro mayor de una cuenta (movimientos posteados, con saldo corrido) | BAJO | 5 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 17 | GET | `/accounting/income-statement` | Estado de resultados de una práctica | BAJO | 5 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 18 | GET | `/accounting/journal-transactions` | Libro diario de una práctica | BAJO | 2 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 19 | POST | `/accounting/journal-transactions` | Registrar y postear un asiento balanceado (partida doble) | MEDIO | 13 | SECURITY_ADMIN |
| 20 | GET | `/accounting/journal-transactions/{id}` | Un asiento con sus líneas | BAJO | 3 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 21 | POST | `/accounting/journal-transactions/{id}/approve` | Aprobar el asiento (rol de aprobación) | MEDIO | 4 | SECURITY_ADMIN, ACCOUNTING_APPROVER |
| 22 | POST | `/accounting/journal-transactions/{id}/classify` | Clasificar automáticamente el asiento | MEDIO | 7 | SECURITY_ADMIN, PRACTITIONER |
| 23 | GET | `/accounting/journal-transactions/{id}/document-flow` | Flujo del documento de un asiento | BAJO | 3 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 24 | POST | `/accounting/journal-transactions/{id}/files` | Adjuntar un documento soporte al asiento | MEDIO | 4 | SECURITY_ADMIN, PRACTITIONER |
| 25 | POST | `/accounting/journal-transactions/{id}/post` | Postear el asiento aprobado (efecto en el mayor) | MEDIO | 9 | SECURITY_ADMIN |
| 26 | POST | `/accounting/journal-transactions/{id}/reverse` | Reversar un asiento posteado (líneas espejo) | MEDIO | 15 | SECURITY_ADMIN |
| 27 | POST | `/accounting/journal-transactions/{id}/submit-review` | Enviar el asiento a revisión | MEDIO | 4 | SECURITY_ADMIN, PRACTITIONER |
| 28 | POST | `/accounting/journal-transactions/drafts` | Crear un asiento en borrador (DRAFT, sin postear) | MEDIO | 11 | SECURITY_ADMIN, PRACTITIONER |
| 29 | POST | `/accounting/liabilities/{id}/payments` | Liquidar cuota de pasivo (principal + interés) | MEDIO | 14 | SECURITY_ADMIN |
| 30 | GET | `/accounting/open-items` | Cartera abierta de una práctica | BAJO | 6 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 31 | POST | `/accounting/open-items` | Generar partida abierta en subledger | MEDIO | 5 | SECURITY_ADMIN |
| 32 | POST | `/accounting/postings/determine-accounts` | Determinar la cuenta objetivo por reglas vigentes | BAJO | 1 | SECURITY_ADMIN |
| 33 | GET | `/accounting/practitioner/assets` | Listar los activos propios de una práctica | BAJO | 3 | PRACTITIONER |
| 34 | POST | `/accounting/practitioner/assets` | Dar de alta un activo propio | MEDIO | 16 | PRACTITIONER |
| 35 | PATCH | `/accounting/practitioner/assets/{id}/automation` | Prender o apagar la automatización de un activo | MEDIO | 7 | PRACTITIONER |
| 36 | POST | `/accounting/practitioner/assets/{id}/progress` | Registrar el avance (depreciación) de un activo | MEDIO | 15 | PRACTITIONER |
| 37 | POST | `/accounting/practitioner/consultation-income` | Registrar ingreso por consulta pagada | MEDIO | 23 | PRACTITIONER |
| 38 | POST | `/accounting/practitioner/entries` | Registrar un gasto u otro ingreso | MEDIO | 17 | PRACTITIONER |
| 39 | GET | `/accounting/practitioner/liabilities` | Listar los pasivos propios de una práctica | BAJO | 3 | PRACTITIONER |
| 40 | POST | `/accounting/practitioner/liabilities` | Dar de alta un pasivo propio (préstamo) | MEDIO | 6 | PRACTITIONER |
| 41 | PATCH | `/accounting/practitioner/liabilities/{id}/automation` | Prender o apagar la automatización de un pasivo | MEDIO | 7 | PRACTITIONER |
| 42 | POST | `/accounting/practitioner/liabilities/{id}/progress` | Registrar el avance (pago de cuota) de un pasivo | MEDIO | 15 | PRACTITIONER |
| 43 | GET | `/accounting/practitioner/liabilities/{id}/schedule` | Cronograma de cuotas de un pasivo propio | BAJO | 5 | PRACTITIONER |
| 44 | GET | `/accounting/practitioner/paid-consultations` | Consultas pagadas sin registrar contablemente | BAJO | 4 | PRACTITIONER |
| 45 | GET | `/accounting/trial-balance` | Balance de sumas y saldos | BAJO | 4 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |

---

## 1. GET /accounting/accounts

- **Origen:** CONTRATO
- **Nombre:** Plan de cuentas de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.chartOfAccounts` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:73`

### Qué es y para qué sirve (negocio)

Plan de cuentas de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/accounts` la atiende `AccountingLedgerController.chartOfAccounts` (src/modules/accounting/controllers/accounting-ledger.controller.ts:73). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.chartOfAccounts`. Lee accounting.accounts, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.chartOfAccounts → LedgerReadService.chartOfAccounts → AccountsRepository.findByPractice | `src/modules/accounting/repositories/accounts.repository.ts:116` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.chartOfAccounts → LedgerReadService.chartOfAccounts → LedgerReadService.verifyPracticeTenant | `src/modules/accounting/services/ledger-read.service.ts:152` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ChartOfAccountsResponseDto>` · DTO `ChartOfAccountsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AccountItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:132` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:118` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:119` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:120` |
| `items[].accountTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:121` |
| `items[].normalBalanceConceptId` | `string` | Sí | formato uuid | — | Deudora o acreedora: es lo que da signo al saldo. | `src/modules/accounting/dto/ledger-read.dto.ts:123` |
| `items[].parentAccountId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:124` |
| `items[].currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:126` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:133` |
| `limit` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:134` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /accounting/accounts

- **Origen:** CONTRATO
- **Nombre:** Crear una cuenta del plan contable
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.createAccount` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:168`

### Qué es y para qué sirve (negocio)

Crear una cuenta del plan contable. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/accounts` la atiende `AccountingLedgerController.createAccount` (src/modules/accounting/controllers/accounting-ledger.controller.ts:168). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AccountingCreateAccountDto` (7 campos, 5 obligatorios). Delega en `LedgerService.createAccount`. Crea filas en accounting.accounts. Lee accounting.accounts, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:168` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.createAccount → LedgerService.createAccount → AccountsRepository.create | `src/modules/accounting/repositories/accounts.repository.ts:124` |
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.createAccount → LedgerService.createAccount → AccountsRepository.findByCode | `src/modules/accounting/repositories/accounts.repository.ts:89` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.createAccount → LedgerService.createAccount → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `AccountingCreateAccountDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica propietaria | `src/modules/accounting/dto/account.dto.ts:25` |
| `code` | `string` | Sí | longitud máxima 40 | `@IsString()` `@MaxLength(40)` | Código contable | `src/modules/accounting/dto/account.dto.ts:33` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre de la cuenta | `src/modules/accounting/dto/account.dto.ts:41` |
| `accountType` | `string` | Sí | valores: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE | `@IsIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])` | — | `src/modules/accounting/dto/account.dto.ts:48` |
| `normalBalance` | `string` | Sí | valores: DEBIT, CREDIT | `@IsIn(['DEBIT', 'CREDIT'])` | — | `src/modules/accounting/dto/account.dto.ts:55` |
| `isPostable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿La cuenta admite posteos directos? | `src/modules/accounting/dto/account.dto.ts:66` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/account.dto.ts:74` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "accountType": "ASSET",
  "normalBalance": "DEBIT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AccountResponseDto>` · DTO `AccountResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/account.dto.ts:82` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/accounting/dto/account.dto.ts:90` |
| `primaryContactId` | `string` | No | formato uuid | — | Contacto creado junto con la cuenta | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese código en la práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:110` |
| INTEGRACION | `test/integration/hardening/mch-018.int-spec.ts:83` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:52` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /accounting/accrual-objects

- **Origen:** CONTRATO
- **Nombre:** Registro de devengos de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingCockpitController.accrualObjects` — `src/modules/accounting/controllers/accounting-cockpit.controller.ts:115`

### Qué es y para qué sirve (negocio)

Registro de devengos de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/accrual-objects` la atiende `AccountingCockpitController.accrualObjects` (src/modules/accounting/controllers/accounting-cockpit.controller.ts:115). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `AccountingReadService.accrualObjects`. Lee accounting.accounts, accounting.accrual_objects, accounting.accrual_schedule_lines, accounting.fiscal_periods, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-cockpit.controller.ts:115` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingCockpitController.accrualObjects → AccountingReadService.accrualObjects → AccountsRepository.findByPractice | `src/modules/accounting/repositories/accounts.repository.ts:116` |
| `accounting.accrual_objects` | LEE | LEE | DIRECTA | AccountingCockpitController.accrualObjects → AccountingReadService.accrualObjects → AccrualRepository.findObjectsByPractice | `src/modules/accounting/repositories/accrual.repository.ts:204` |
| `accounting.accrual_schedule_lines` | LEE | LEE | DIRECTA | AccountingCockpitController.accrualObjects → AccountingReadService.accrualObjects → AccrualRepository.findScheduleLinesByObjectIds | `src/modules/accounting/repositories/accrual.repository.ts:226` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingCockpitController.accrualObjects → AccountingReadService.accrualObjects → FiscalRepository.findPeriodsByIds | `src/modules/accounting/repositories/fiscal.repository.ts:226` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingCockpitController.accrualObjects → AccountingReadService.accrualObjects → AccountingReadService.resolverPracticeTenant | `src/modules/accounting/services/accounting-read.service.ts:153` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingCockpitController.accrualObjects → AccountingReadService.accrualObjects → AccountingReadService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CockpitAccrualsDto>` · DTO `CockpitAccrualsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CockpitAccrualObjectDto>` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:257` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:225` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:227` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:229` |
| `items[].kind` | `string` | Sí | valores: EXPENSE, REVENUE | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:232` |
| `items[].totalAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:234` |
| `items[].periods` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:236` |
| `items[].postedPeriods` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:238` |
| `items[].remainingPeriods` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:240` |
| `items[].periodAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:242` |
| `items[].recognizedAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:244` |
| `items[].pendingAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:246` |
| `items[].startsOn` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:248` |
| `items[].completed` | `boolean` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:250` |
| `pendingTotal` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:259` |
| `periodCharge` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:261` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:263` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: No se pudo verificar la vinculación del profesional con la práctica; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:397` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-cockpit.controller.spec.ts:67` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingCockpitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /accounting/accrual-objects

- **Origen:** CONTRATO
- **Nombre:** Crear objeto de devengo y su cronograma
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingAccrualController.createAccrualObject` — `src/modules/accounting/controllers/accounting-accrual.controller.ts:30`

### Qué es y para qué sirve (negocio)

Crear objeto de devengo y su cronograma. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/accrual-objects` la atiende `AccountingAccrualController.createAccrualObject` (src/modules/accounting/controllers/accounting-accrual.controller.ts:30). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccrualObjectDto` (13 campos, 8 obligatorios). Delega en `AccrualService.createAccrualObject`. Crea filas en accounting.accrual_objects, accounting.accrual_schedule_lines. Lee accounting.accounts, accounting.accrual_objects, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.profit_centers, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-accrual.controller.ts:30` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccountingScopeService.accountsInTenant → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.accrual_objects` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccrualRepository.createObject | `src/modules/accounting/repositories/accrual.repository.ts:111` |
| `accounting.accrual_objects` | LEE | LEE | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccrualRepository.findObjectByNumber | `src/modules/accounting/repositories/accrual.repository.ts:40` |
| `accounting.accrual_schedule_lines` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccrualRepository.createScheduleLine | `src/modules/accounting/repositories/accrual.repository.ts:173` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccountingScopeService.costCentersInTenant → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccountingScopeService.periodInTenant → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccountingScopeService.periodInTenant → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccountingScopeService.accountsInTenant → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `CreateAccrualObjectDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/accrual.dto.ts:42` |
| `objectNumber` | `string` | Sí | longitud máxima 60 | `@IsString()` `@MaxLength(60)` | Número de objeto (único por tenant) | `src/modules/accounting/dto/accrual.dto.ts:53` |
| `expenseAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de gasto postable | `src/modules/accounting/dto/accrual.dto.ts:60` |
| `accrualAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de devengo postable | `src/modules/accounting/dto/accrual.dto.ts:67` |
| `costCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/accrual.dto.ts:75` |
| `profitCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/accrual.dto.ts:83` |
| `startDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/accounting/dto/accrual.dto.ts:91` |
| `endDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/accounting/dto/accrual.dto.ts:99` |
| `totalAmount` | `string` | Sí | — | `@IsNumberString()` | Importe total (= suma de planned) | `src/modules/accounting/dto/accrual.dto.ts:109` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/accrual.dto.ts:117` |
| `schedule` | `array<AccrualScheduleInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => AccrualScheduleInputDto)` | Cronograma (>=1 línea) | `src/modules/accounting/dto/accrual.dto.ts:130` |
| `schedule[].fiscalPeriodId` | `string` | Sí | formato uuid | `@IsUUID()` | Periodo fiscal de la línea | `src/modules/accounting/dto/accrual.dto.ts:22` |
| `schedule[].plannedAmount` | `string` | Sí | — | `@IsNumberString()` | Importe planificado del periodo | `src/modules/accounting/dto/accrual.dto.ts:32` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AccrualObjectResponseDto>` · DTO `AccrualObjectResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/accrual.dto.ts:172` |
| `objectNumber` | `string` | Sí | — | — | Valor de object number mantenido por la instancia. | `src/modules/accounting/dto/accrual.dto.ts:176` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/accrual.dto.ts:180` |
| `scheduleLineIds` | `array<string>` | Sí | — | — | Valor de schedule line ids mantenido por la instancia. | `src/modules/accounting/dto/accrual.dto.ts:184` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El número de objeto ya existe en el tenant |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suma del cronograma no iguala el total |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:234` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingAccrualController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /accounting/accruals/run

- **Origen:** CONTRATO
- **Nombre:** Postear devengo periódico (accrual run)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingAccrualController.runAccruals` — `src/modules/accounting/controllers/accounting-accrual.controller.ts:47`

### Qué es y para qué sirve (negocio)

Postear devengo periódico (accrual run). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/accruals/run` la atiende `AccountingAccrualController.runAccruals` (src/modules/accounting/controllers/accounting-accrual.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RunAccrualsDto` (4 campos, 4 obligatorios). Delega en `AccrualService.runAccruals`. Crea filas en accounting.accrual_postings, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Actualiza accounting.accrual_schedule_lines. Lee accounting.accounts, accounting.accrual_objects, accounting.accrual_schedule_lines, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.profit_centers, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-accrual.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.accrual_objects` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccountingScopeService.accrualObject → AccrualRepository.findObjectById | `src/modules/accounting/repositories/accrual.repository.ts:24` |
| `accounting.accrual_postings` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccrualRepository.createPosting | `src/modules/accounting/repositories/accrual.repository.ts:281` |
| `accounting.accrual_schedule_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingAccrualController.runAccruals → AccrualService.runAccruals | `src/modules/accounting/services/accrual.service.ts:236` |
| `accounting.accrual_schedule_lines` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccrualRepository.pendingLinesForPeriod | `src/modules/accounting/repositories/accrual.repository.ts:238` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `RunAccrualsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accrualObjectId` | `string` | Sí | formato uuid | `@IsUUID()` | Objeto de devengo a correr | `src/modules/accounting/dto/accrual.dto.ts:140` |
| `fiscalPeriodId` | `string` | Sí | formato uuid | `@IsUUID()` | Periodo fiscal ABIERTO a devengar | `src/modules/accounting/dto/accrual.dto.ts:150` |
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica del asiento generado | `src/modules/accounting/dto/accrual.dto.ts:157` |
| `postingDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/accrual.dto.ts:164` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "accrualObjectId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-01-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "accrualObjectId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-01-31"
}
```

</details>

### Respuesta — `Promise<AccrualRunResponseDto>` · DTO `AccrualRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `postedLines` | `number` | Sí | — | — | Valor de posted lines mantenido por la instancia. | `src/modules/accounting/dto/accrual.dto.ts:192` |
| `transactionIds` | `array<string>` | Sí | — | — | Transacciones de devengo generadas | `src/modules/accounting/dto/accrual.dto.ts:200` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto de devengo no define cuentas; PreconditionFailedException: No hay líneas de devengo pendientes en el periodo; PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingAccrualController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /accounting/assets

- **Origen:** CONTRATO
- **Nombre:** Registro de activos fijos de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingCockpitController.fixedAssets` — `src/modules/accounting/controllers/accounting-cockpit.controller.ts:99`

### Qué es y para qué sirve (negocio)

Registro de activos fijos de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/assets` la atiende `AccountingCockpitController.fixedAssets` (src/modules/accounting/controllers/accounting-cockpit.controller.ts:99). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `AccountingReadService.fixedAssets`. Lee accounting.assets, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-cockpit.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingCockpitController.fixedAssets → AccountingReadService.fixedAssets → AssetRepository.listByPractice | `src/modules/accounting/repositories/asset.repository.ts:99` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingCockpitController.fixedAssets → AccountingReadService.fixedAssets → AccountingReadService.resolverPracticeTenant | `src/modules/accounting/services/accounting-read.service.ts:153` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingCockpitController.fixedAssets → AccountingReadService.fixedAssets → AccountingReadService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CockpitFixedAssetsDto>` · DTO `CockpitFixedAssetsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CockpitFixedAssetDto>` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:209` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:180` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:182` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:184` |
| `items[].className` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:186` |
| `items[].classCode` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:188` |
| `items[].usefulLifeMonths` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:190` |
| `items[].acquisitionCost` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:192` |
| `items[].accumulatedDepreciation` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:194` |
| `items[].netBookValue` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:196` |
| `items[].monthlyDepreciation` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:198` |
| `items[].depreciable` | `boolean` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:200` |
| `items[].status` | `string` | Sí | valores: ACTIVE, RETIRED | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:202` |
| `totalAcquisition` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:211` |
| `totalAccumulated` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:213` |
| `totalNetBookValue` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:215` |
| `monthlyCharge` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:217` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:219` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: No se pudo verificar la vinculación del profesional con la práctica; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:383` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-cockpit.controller.spec.ts:58` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingCockpitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /accounting/assets/capitalize

- **Origen:** CONTRATO
- **Nombre:** Capitalizar activo (alta y asignación)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingAssetController.capitalize` — `src/modules/accounting/controllers/accounting-asset.controller.ts:30`

### Qué es y para qué sirve (negocio)

Capitalizar activo (alta y asignación). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/assets/capitalize` la atiende `AccountingAssetController.capitalize` (src/modules/accounting/controllers/accounting-asset.controller.ts:30). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CapitalizeAssetDto` (13 campos, 7 obligatorios). Delega en `AssetService.capitalize`. Crea filas en accounting.asset_assignments, accounting.asset_postings, accounting.asset_valuations, accounting.assets, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Lee accounting.accounts, accounting.assets, accounting.cost_centers, accounting.depreciation_areas, accounting.fiscal_periods, accounting.fiscal_years, accounting.profit_centers, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-asset.controller.ts:30` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.asset_assignments` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.createAssignment | `src/modules/accounting/repositories/asset.repository.ts:376` |
| `accounting.asset_postings` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.createPosting | `src/modules/accounting/repositories/asset.repository.ts:431` |
| `accounting.asset_valuations` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.createValuation | `src/modules/accounting/repositories/asset.repository.ts:320` |
| `accounting.assets` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.createAsset | `src/modules/accounting/repositories/asset.repository.ts:194` |
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.findByCode | `src/modules/accounting/repositories/asset.repository.ts:42` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.depreciation_areas` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AccountingScopeService.depreciationArea → AssetRepository.findDepreciationAreaById | `src/modules/accounting/repositories/asset.repository.ts:56` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `CapitalizeAssetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:20` |
| `code` | `string` | Sí | longitud máxima 40 | `@IsString()` `@MaxLength(40)` | Código del activo | `src/modules/accounting/dto/asset.dto.ts:28` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre del activo | `src/modules/accounting/dto/asset.dto.ts:36` |
| `acquisitionAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de adquisición (débito del alta) | `src/modules/accounting/dto/asset.dto.ts:46` |
| `offsetAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta banco/proveedor (crédito del alta) | `src/modules/accounting/dto/asset.dto.ts:56` |
| `acquisitionCost` | `string` | Sí | — | `@IsNumberString()` | Costo de adquisición | `src/modules/accounting/dto/asset.dto.ts:63` |
| `acquisitionDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/asset.dto.ts:70` |
| `usefulLifeMonths` | `number` | No | mayor que 0 | `@IsOptional()` `@IsInt()` `@IsPositive()` | Vida útil en meses | `src/modules/accounting/dto/asset.dto.ts:79` |
| `salvageValue` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/accounting/dto/asset.dto.ts:87` |
| `depreciationAreaId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Área de valoración | `src/modules/accounting/dto/asset.dto.ts:95` |
| `costCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:103` |
| `responsibleEmployeeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:111` |
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:119` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AssetResponseDto>` · DTO `AssetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/asset.dto.ts:182` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/accounting/dto/asset.dto.ts:186` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/asset.dto.ts:190` |
| `bookValue` | `string` | Sí | — | — | Valor de book value mantenido por la instancia. | `src/modules/accounting/dto/asset.dto.ts:194` |
| `transactionId` | `string` | Sí | formato uuid | — | Identificador asociado a transaction. | `src/modules/accounting/dto/asset.dto.ts:198` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un activo con ese código en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:216` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingAssetController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /accounting/balance-sheet

- **Origen:** CONTRATO
- **Nombre:** Balance general de una práctica a una fecha de corte
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.balanceSheet` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:145`

### Qué es y para qué sirve (negocio)

Balance general de una práctica a una fecha de corte. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/balance-sheet` la atiende `AccountingLedgerController.balanceSheet` (src/modules/accounting/controllers/accounting-ledger.controller.ts:145). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.balanceSheet`. Lee accounting.accounts, accounting.journal_transactions, accounting.ledger_entries, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:145` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.balanceSheet → LedgerReadService.balanceSheet → LedgerReadService.aggregatePostedByAccount → AccountsRepository.findByPractice | `src/modules/accounting/repositories/accounts.repository.ts:116` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.balanceSheet → LedgerReadService.balanceSheet → LedgerReadService.aggregatePostedByAccount → JournalRepository.findTransactions | `src/modules/accounting/repositories/journal.repository.ts:284` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.balanceSheet → LedgerReadService.balanceSheet → LedgerReadService.aggregatePostedByAccount → JournalRepository.findEntriesByTransactions | `src/modules/accounting/repositories/journal.repository.ts:329` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.balanceSheet → LedgerReadService.balanceSheet → LedgerReadService.verifyPracticeTenant | `src/modules/accounting/services/ledger-read.service.ts:152` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.balanceSheet → LedgerReadService.balanceSheet → LedgerReadService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |
| `fiscalPeriodId` | query | No | `string` | — |
| `from` | query | No | `string` | Estado de resultados: inicio de la ventana |
| `to` | query | No | `string` | Fin de la ventana (estado de resultados) o fecha de corte (balance general), inclusive |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BalanceSheetResponseDto>` · DTO `BalanceSheetResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `assetItems` | `array<FinancialStatementLineDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:417` |
| `assetItems[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:372` |
| `assetItems[].code` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:373` |
| `assetItems[].name` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:374` |
| `assetItems[].accountTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:375` |
| `assetItems[].amount` | `string` | Sí | — | — | Importe según la naturaleza de la cuenta | `src/modules/accounting/dto/ledger-read.dto.ts:378` |
| `liabilityItems` | `array<FinancialStatementLineDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:419` |
| `liabilityItems[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:372` |
| `liabilityItems[].code` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:373` |
| `liabilityItems[].name` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:374` |
| `liabilityItems[].accountTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:375` |
| `liabilityItems[].amount` | `string` | Sí | — | — | Importe según la naturaleza de la cuenta | `src/modules/accounting/dto/ledger-read.dto.ts:378` |
| `equityItems` | `array<FinancialStatementLineDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:421` |
| `equityItems[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:372` |
| `equityItems[].code` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:373` |
| `equityItems[].name` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:374` |
| `equityItems[].accountTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:375` |
| `equityItems[].amount` | `string` | Sí | — | — | Importe según la naturaleza de la cuenta | `src/modules/accounting/dto/ledger-read.dto.ts:378` |
| `netIncomeOfPeriod` | `string` | Sí | — | — | Ingresos menos gastos posteados hasta la fecha de corte | `src/modules/accounting/dto/ledger-read.dto.ts:425` |
| `totalAssets` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:426` |
| `totalLiabilities` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:427` |
| `totalEquity` | `string` | Sí | — | — | Patrimonio declarado + resultado del período | `src/modules/accounting/dto/ledger-read.dto.ts:429` |
| `totalLiabilitiesAndEquity` | `string` | Sí | — | — | totalLiabilities + totalEquity | `src/modules/accounting/dto/ledger-read.dto.ts:431` |
| `balanced` | `boolean` | Sí | — | — | activo == pasivo + patrimonio | `src/modules/accounting/dto/ledger-read.dto.ts:433` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:434` |
| `limit` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:435` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:436` |
| `truncated` | `boolean` | Sí | — | — | Si se alcanzó el tope y el informe está incompleto | `src/modules/accounting/dto/ledger-read.dto.ts:440` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: No se pudo verificar la vinculación del profesional con la práctica; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /accounting/clearing-documents

- **Origen:** CONTRATO
- **Nombre:** Compensar/clearing de partidas abiertas
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingSubledgerController.clearOpenItems` — `src/modules/accounting/controllers/accounting-subledger.controller.ts:47`

### Qué es y para qué sirve (negocio)

Compensar/clearing de partidas abiertas. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/clearing-documents` la atiende `AccountingSubledgerController.clearOpenItems` (src/modules/accounting/controllers/accounting-subledger.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateClearingDto` (11 campos, 6 obligatorios). Delega en `SubledgerService.clearOpenItems`. Crea filas en accounting.clearing_documents, accounting.clearing_items, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Lee accounting.accounts, accounting.clearing_documents, accounting.company_bank_accounts, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.open_items, accounting.profit_centers y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-subledger.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.clearing_documents` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → SubledgerRepository.createClearingDocument | `src/modules/accounting/repositories/subledger.repository.ts:263` |
| `accounting.clearing_documents` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → SubledgerRepository.findClearingByNumber | `src/modules/accounting/repositories/subledger.repository.ts:216` |
| `accounting.clearing_items` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → SubledgerRepository.createClearingItem | `src/modules/accounting/repositories/subledger.repository.ts:324` |
| `accounting.company_bank_accounts` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → AccountingScopeService.companyBankAccount → SubledgerRepository.findCompanyBankAccountById | `src/modules/accounting/repositories/subledger.repository.ts:49` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.open_items` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → AccountingScopeService.openItem → SubledgerRepository.findOpenItemById | `src/modules/accounting/repositories/subledger.repository.ts:60` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `accounting.subledger_accounts` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → AccountingScopeService.subledger → SubledgerRepository.findSubledgerById | `src/modules/accounting/repositories/subledger.repository.ts:34` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `CreateClearingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Organización del documento. Si se omite, es la de la práctica; si viene, debe coincidir. | `src/modules/accounting/dto/subledger.dto.ts:141` |
| `clearingNumber` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Número de clearing (único por tenant); autogenerado si se omite | `src/modules/accounting/dto/subledger.dto.ts:153` |
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica del asiento de compensación | `src/modules/accounting/dto/subledger.dto.ts:163` |
| `bankAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta banco/tesorería del contra-asiento | `src/modules/accounting/dto/subledger.dto.ts:173` |
| `companyBankAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/subledger.dto.ts:181` |
| `clearingDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/subledger.dto.ts:188` |
| `items` | `array<ClearingItemInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ClearingItemInputDto)` | Partidas a compensar (>=1) | `src/modules/accounting/dto/subledger.dto.ts:201` |
| `items[].openItemId` | `string` | Sí | formato uuid | `@IsUUID()` | Partida abierta ABIERTA | `src/modules/accounting/dto/subledger.dto.ts:100` |
| `items[].clearedAmount` | `string` | Sí | — | `@IsNumberString()` | Importe compensado | `src/modules/accounting/dto/subledger.dto.ts:107` |
| `items[].discountAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/accounting/dto/subledger.dto.ts:115` |
| `items[].exchangeDifferenceAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/accounting/dto/subledger.dto.ts:123` |

**Payload mínimo** (sólo los obligatorios):

```json
{
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ClearingResponseDto>` · DTO `ClearingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/subledger.dto.ts:225` |
| `clearingNumber` | `string` | Sí | — | — | Valor de clearing number mantenido por la instancia. | `src/modules/accounting/dto/subledger.dto.ts:229` |
| `transactionId` | `string` | Sí | formato uuid | — | Identificador asociado a transaction. | `src/modules/accounting/dto/subledger.dto.ts:233` |
| `clearedItems` | `number` | Sí | — | — | Valor de cleared items mantenido por la instancia. | `src/modules/accounting/dto/subledger.dto.ts:237` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La partida ya está compensada; ConflictException: El número de clearing ya existe en el tenant |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Importe compensado inválido; PreconditionFailedException: Las partidas no comparten subledger; PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingSubledgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /accounting/depreciation/run

- **Origen:** CONTRATO
- **Nombre:** Ejecutar depreciación de activos (batch)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingAssetController.runDepreciation` — `src/modules/accounting/controllers/accounting-asset.controller.ts:47`

### Qué es y para qué sirve (negocio)

Ejecutar depreciación de activos (batch). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/depreciation/run` la atiende `AccountingAssetController.runDepreciation` (src/modules/accounting/controllers/accounting-asset.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RunDepreciationDto` (6 campos, 5 obligatorios). Delega en `AssetService.runDepreciation`. Crea filas en accounting.asset_depreciations, accounting.asset_postings, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Actualiza accounting.assets. Lee accounting.accounts, accounting.asset_depreciations, accounting.assets, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.profit_centers, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-asset.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.asset_depreciations` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AssetRepository.createDepreciation | `src/modules/accounting/repositories/asset.repository.ts:499` |
| `accounting.asset_depreciations` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AssetRepository.findDepreciation | `src/modules/accounting/repositories/asset.repository.ts:460` |
| `accounting.asset_postings` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AssetRepository.createPosting | `src/modules/accounting/repositories/asset.repository.ts:431` |
| `accounting.assets` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingAssetController.runDepreciation → AssetService.runDepreciation | `src/modules/accounting/services/asset.service.ts:283` |
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AssetRepository.activeAssets | `src/modules/accounting/repositories/asset.repository.ts:79` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `RunDepreciationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:129` |
| `fiscalPeriodId` | `string` | Sí | formato uuid | `@IsUUID()` | Periodo fiscal ABIERTO | `src/modules/accounting/dto/asset.dto.ts:136` |
| `depreciationExpenseAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de gasto por depreciación (débito) | `src/modules/accounting/dto/asset.dto.ts:146` |
| `accumulatedDepreciationAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de depreciación acumulada (crédito) | `src/modules/accounting/dto/asset.dto.ts:156` |
| `postingDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/asset.dto.ts:163` |
| `assetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Limitar a un activo concreto | `src/modules/accounting/dto/asset.dto.ts:174` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "depreciationExpenseAccountId": "00000000-0000-4000-8000-000000000001",
  "accumulatedDepreciationAccountId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-01-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "depreciationExpenseAccountId": "00000000-0000-4000-8000-000000000001",
  "accumulatedDepreciationAccountId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-01-31",
  "assetId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DepreciationRunResponseDto>` · DTO `DepreciationRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `depreciatedAssets` | `number` | Sí | — | — | Valor de depreciated assets mantenido por la instancia. | `src/modules/accounting/dto/asset.dto.ts:206` |
| `transactionIds` | `array<string>` | Sí | — | — | Valor de transaction ids mantenido por la instancia. | `src/modules/accounting/dto/asset.dto.ts:210` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El asiento generado no balancea (debe != haber); PreconditionFailedException: No hay activos elegibles para depreciar en el periodo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingAssetController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /accounting/dimensions

- **Origen:** CONTRATO
- **Nombre:** Dimensiones analíticas de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingCockpitController.dimensions` — `src/modules/accounting/controllers/accounting-cockpit.controller.ts:68`

### Qué es y para qué sirve (negocio)

Dimensiones analíticas de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/dimensions` la atiende `AccountingCockpitController.dimensions` (src/modules/accounting/controllers/accounting-cockpit.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `AccountingReadService.dimensions`. Lee accounting.cost_centers, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, accounting.profit_centers, accounting.segments, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-cockpit.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingCockpitController.dimensions → AccountingReadService.dimensions → AccountingControllingRepository.listCostCentersByPractice | `src/modules/accounting/repositories/accounting-controlling.repository.ts:84` |
| `accounting.journal_entry_assignments` | LEE | LEE | DIRECTA | AccountingCockpitController.dimensions → AccountingReadService.dimensions → JournalRepository.findPostedEntriesWithAssignments | `src/modules/accounting/repositories/journal.repository.ts:579` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingCockpitController.dimensions → AccountingReadService.dimensions → JournalRepository.findPostedEntriesWithAssignments | `src/modules/accounting/repositories/journal.repository.ts:567` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingCockpitController.dimensions → AccountingReadService.dimensions → JournalRepository.findPostedEntriesWithAssignments | `src/modules/accounting/repositories/journal.repository.ts:574` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingCockpitController.dimensions → AccountingReadService.dimensions → AccountingControllingRepository.listProfitCentersByTenant | `src/modules/accounting/repositories/accounting-controlling.repository.ts:95` |
| `accounting.segments` | LEE | LEE | DIRECTA | AccountingCockpitController.dimensions → AccountingReadService.dimensions → AccountingControllingRepository.listSegmentsByTenant | `src/modules/accounting/repositories/accounting-controlling.repository.ts:106` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingCockpitController.dimensions → AccountingReadService.dimensions → AccountingReadService.resolverPracticeTenant | `src/modules/accounting/services/accounting-read.service.ts:153` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingCockpitController.dimensions → AccountingReadService.dimensions → AccountingReadService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CockpitDimensionsDto>` · DTO `CockpitDimensionsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CockpitDimensionDto>` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:148` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:129` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:131` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:133` |
| `items[].kind` | `string` | Sí | valores: COST_CENTER, PROFIT_CENTER, SEGMENT | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:136` |
| `items[].debit` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:138` |
| `items[].credit` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:140` |
| `items[].result` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:142` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:150` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: No se pudo verificar la vinculación del profesional con la práctica; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:339` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-cockpit.controller.spec.ts:43` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingCockpitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /accounting/exchange-rates

- **Origen:** CONTRATO
- **Nombre:** Registrar tipo de cambio para conversión
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingExchangeRateController.register` — `src/modules/accounting/controllers/accounting-exchange-rate.controller.ts:25`

### Qué es y para qué sirve (negocio)

Registrar tipo de cambio para conversión. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/exchange-rates` la atiende `AccountingExchangeRateController.register` (src/modules/accounting/controllers/accounting-exchange-rate.controller.ts:25). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `RegisterExchangeRateDto` (5 campos, 4 obligatorios). Delega en `ExchangeRateService.registerRate`. Crea filas en accounting.exchange_rates. Actualiza accounting.exchange_rates. Lee accounting.exchange_rates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/accounting/controllers/accounting-exchange-rate.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.exchange_rates` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingExchangeRateController.register → ExchangeRateService.registerRate | `src/modules/accounting/services/exchange-rate.service.ts:73` |
| `accounting.exchange_rates` | ESCRIBE | CREA | DIRECTA | AccountingExchangeRateController.register → ExchangeRateService.registerRate → ExchangeRateRepository.create | `src/modules/accounting/repositories/exchange-rate.repository.ts:59` |
| `accounting.exchange_rates` | LEE | LEE | DIRECTA | AccountingExchangeRateController.register → ExchangeRateService.registerRate → ExchangeRateRepository.findForPair | `src/modules/accounting/repositories/exchange-rate.repository.ts:16` |

### Cuerpo — DTO `RegisterExchangeRateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fromCurrencyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Moneda origen | `src/modules/accounting/dto/exchange-rate.dto.ts:18` |
| `toCurrencyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Moneda destino | `src/modules/accounting/dto/exchange-rate.dto.ts:25` |
| `rate` | `string` | Sí | — | `@IsNumberString()` | Tasa de conversión | `src/modules/accounting/dto/exchange-rate.dto.ts:32` |
| `validOn` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/exchange-rate.dto.ts:39` |
| `source` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/accounting/dto/exchange-rate.dto.ts:48` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fromCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
  "toCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
  "rate": "3.75",
  "validOn": "2026-01-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fromCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
  "toCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
  "rate": "3.75",
  "validOn": "2026-01-31",
  "source": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ExchangeRateResponseDto>` · DTO `ExchangeRateResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/exchange-rate.dto.ts:56` |
| `rate` | `string` | Sí | — | — | Valor de rate mantenido por la instancia. | `src/modules/accounting/dto/exchange-rate.dto.ts:60` |
| `validOn` | `string` | Sí | formato date-time | — | Valor de valid on mantenido por la instancia. | `src/modules/accounting/dto/exchange-rate.dto.ts:64` |
| `created` | `boolean` | Sí | — | — | ¿Se creó (true) o actualizó (false)? | `src/modules/accounting/dto/exchange-rate.dto.ts:69` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: El tipo de cambio es un dato de plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingExchangeRateController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /accounting/fiscal-periods/{id}/lock

- **Origen:** CONTRATO
- **Nombre:** Cerrar/bloquear un periodo fiscal
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingFiscalController.lockPeriod` — `src/modules/accounting/controllers/accounting-fiscal.controller.ts:55`

### Qué es y para qué sirve (negocio)

Cerrar/bloquear un periodo fiscal. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/fiscal-periods/{id}/lock` la atiende `AccountingFiscalController.lockPeriod` (src/modules/accounting/controllers/accounting-fiscal.controller.ts:55). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LockPeriodDto` (1 campo, 0 obligatorios). Delega en `FiscalService.lockPeriod`. Actualiza accounting.fiscal_periods. Lee accounting.fiscal_periods, accounting.fiscal_years, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-fiscal.controller.ts:55` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-fiscal.controller.ts:55` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.fiscal_periods` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingFiscalController.lockPeriod → FiscalService.lockPeriod | `src/modules/accounting/services/fiscal.service.ts:136` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingFiscalController.lockPeriod → FiscalService.lockPeriod → AccountingScopeService.periodInTenant → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingFiscalController.lockPeriod → FiscalService.lockPeriod → AccountingScopeService.periodInTenant → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingFiscalController.lockPeriod → FiscalService.lockPeriod → AccountingScopeService.periodInTenant → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LockPeriodDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/accounting/dto/fiscal.dto.ts:99` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<AccountingStatusDto>` · DTO `AccountingStatusDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Valor de ok mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:415` |
| `id` | `string` | No | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:419` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El periodo no está ABIERTO |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingFiscalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /accounting/fiscal-years

- **Origen:** CONTRATO
- **Nombre:** Ejercicio fiscal vigente de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingCockpitController.fiscalYear` — `src/modules/accounting/controllers/accounting-cockpit.controller.ts:37`

### Qué es y para qué sirve (negocio)

Ejercicio fiscal vigente de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/fiscal-years` la atiende `AccountingCockpitController.fiscalYear` (src/modules/accounting/controllers/accounting-cockpit.controller.ts:37). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `AccountingReadService.fiscalYear`. Lee accounting.fiscal_periods, accounting.fiscal_years, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-cockpit.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingCockpitController.fiscalYear → AccountingReadService.fiscalYear → FiscalRepository.findPeriodsByYear | `src/modules/accounting/repositories/fiscal.repository.ts:207` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingCockpitController.fiscalYear → AccountingReadService.fiscalYear → FiscalRepository.findYearsByPractice | `src/modules/accounting/repositories/fiscal.repository.ts:189` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingCockpitController.fiscalYear → AccountingReadService.fiscalYear → AccountingReadService.resolverPracticeTenant | `src/modules/accounting/services/accounting-read.service.ts:153` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingCockpitController.fiscalYear → AccountingReadService.fiscalYear → AccountingReadService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CockpitFiscalYearDto>` · DTO `CockpitFiscalYearDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fiscalYearId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:50` |
| `name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:52` |
| `startsOn` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:54` |
| `endsOn` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:56` |
| `currentPeriodId` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:58` |
| `periods` | `array<CockpitFiscalPeriodDto>` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:61` |
| `periods[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:33` |
| `periods[].periodNumber` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:35` |
| `periods[].name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:37` |
| `periods[].startsOn` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:39` |
| `periods[].endsOn` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:41` |
| `periods[].status` | `string` | Sí | valores: CLOSED, OPEN, PLANNED | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:44` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:63` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada; ResourceNotFoundException: La práctica no tiene ejercicios fiscales |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: No se pudo verificar la vinculación del profesional con la práctica; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:308` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-cockpit.controller.spec.ts:27` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingCockpitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /accounting/fiscal-years

- **Origen:** CONTRATO
- **Nombre:** Abrir un ejercicio fiscal y sus periodos
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingFiscalController.openFiscalYear` — `src/modules/accounting/controllers/accounting-fiscal.controller.ts:38`

### Qué es y para qué sirve (negocio)

Abrir un ejercicio fiscal y sus periodos. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/fiscal-years` la atiende `AccountingFiscalController.openFiscalYear` (src/modules/accounting/controllers/accounting-fiscal.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateFiscalYearDto` (8 campos, 8 obligatorios). Delega en `FiscalService.openFiscalYear`. Crea filas en accounting.fiscal_periods, accounting.fiscal_years. Lee accounting.fiscal_years, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-fiscal.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.fiscal_periods` | ESCRIBE | CREA | DIRECTA | AccountingFiscalController.openFiscalYear → FiscalService.openFiscalYear → FiscalRepository.createPeriod | `src/modules/accounting/repositories/fiscal.repository.ts:153` |
| `accounting.fiscal_years` | ESCRIBE | CREA | DIRECTA | AccountingFiscalController.openFiscalYear → FiscalService.openFiscalYear → FiscalRepository.createYear | `src/modules/accounting/repositories/fiscal.repository.ts:103` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingFiscalController.openFiscalYear → FiscalService.openFiscalYear → FiscalRepository.findYearByCode | `src/modules/accounting/repositories/fiscal.repository.ts:64` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingFiscalController.openFiscalYear → FiscalService.openFiscalYear → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `CreateFiscalYearDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/fiscal.dto.ts:49` |
| `code` | `string` | Sí | longitud máxima 40 | `@IsString()` `@MaxLength(40)` | Código del ejercicio (único por práctica) | `src/modules/accounting/dto/fiscal.dto.ts:60` |
| `startDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/fiscal.dto.ts:67` |
| `endDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/fiscal.dto.ts:74` |
| `periods` | `array<FiscalPeriodInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => FiscalPeriodInputDto)` | Periodos hijos (>=1) | `src/modules/accounting/dto/fiscal.dto.ts:87` |
| `periods[].code` | `string` | Sí | longitud máxima 40 | `@IsString()` `@MaxLength(40)` | Código del periodo (p. ej. 2026-01) | `src/modules/accounting/dto/fiscal.dto.ts:25` |
| `periods[].startDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/fiscal.dto.ts:32` |
| `periods[].endDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/fiscal.dto.ts:39` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<FiscalYearResponseDto>` · DTO `FiscalYearResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/fiscal.dto.ts:107` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/accounting/dto/fiscal.dto.ts:111` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/fiscal.dto.ts:115` |
| `periodIds` | `array<string>` | Sí | — | — | Ids de periodos creados | `src/modules/accounting/dto/fiscal.dto.ts:120` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El ejercicio ya existe en la práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:138` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingFiscalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /accounting/general-ledger

- **Origen:** CONTRATO
- **Nombre:** Libro mayor de una cuenta (movimientos posteados, con saldo corrido)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.generalLedger` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:111`

### Qué es y para qué sirve (negocio)

Libro mayor de una cuenta (movimientos posteados, con saldo corrido). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/general-ledger` la atiende `AccountingLedgerController.generalLedger` (src/modules/accounting/controllers/accounting-ledger.controller.ts:111). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.generalLedger`. Lee accounting.accounts, accounting.journal_transactions, accounting.ledger_entries, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | accountId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.generalLedger → LedgerReadService.generalLedger → AccountsRepository.findById | `src/modules/accounting/repositories/accounts.repository.ts:73` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.generalLedger → LedgerReadService.generalLedger → JournalRepository.findTransactions | `src/modules/accounting/repositories/journal.repository.ts:284` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.generalLedger → LedgerReadService.generalLedger → JournalRepository.findEntriesByTransactions | `src/modules/accounting/repositories/journal.repository.ts:329` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.generalLedger → LedgerReadService.generalLedger → LedgerReadService.verifyPracticeTenant | `src/modules/accounting/services/ledger-read.service.ts:152` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.generalLedger → LedgerReadService.generalLedger → LedgerReadService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |
| `accountId` | query | Sí | `string` | Cuenta a leer |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GeneralLedgerResponseDto>` · DTO `GeneralLedgerResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:304` |
| `code` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:305` |
| `name` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:306` |
| `normalBalanceConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:308` |
| `currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:309` |
| `openingBalance` | `string` | Sí | — | — | Saldo de apertura de la ventana pedida | `src/modules/accounting/dto/ledger-read.dto.ts:313` |
| `items` | `array<GeneralLedgerEntryItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:315` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:284` |
| `items[].transactionId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:285` |
| `items[].transactionNumber` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:286` |
| `items[].transactionDate` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:287` |
| `items[].directionConceptId` | `string` | Sí | formato uuid | — | Debe o haber. | `src/modules/accounting/dto/ledger-read.dto.ts:289` |
| `items[].debit` | `string` | Sí | — | — | Importe al debe, decimal como texto | `src/modules/accounting/dto/ledger-read.dto.ts:291` |
| `items[].credit` | `string` | Sí | — | — | Importe al haber, decimal como texto | `src/modules/accounting/dto/ledger-read.dto.ts:293` |
| `items[].runningBalance` | `string` | Sí | — | — | Saldo corrido según la naturaleza de la cuenta | `src/modules/accounting/dto/ledger-read.dto.ts:298` |
| `items[].memo` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:299` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:316` |
| `limit` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:317` |
| `nextCursor` | `string` | No | admite null | — | Cursor para la página siguiente, o null si no hay más | `src/modules/accounting/dto/ledger-read.dto.ts:322` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada; ResourceNotFoundException: Cuenta no encontrada en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: No se pudo verificar la vinculación del profesional con la práctica; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. GET /accounting/income-statement

- **Origen:** CONTRATO
- **Nombre:** Estado de resultados de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.incomeStatement` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:129`

### Qué es y para qué sirve (negocio)

Estado de resultados de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/income-statement` la atiende `AccountingLedgerController.incomeStatement` (src/modules/accounting/controllers/accounting-ledger.controller.ts:129). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.incomeStatement`. Lee accounting.accounts, accounting.journal_transactions, accounting.ledger_entries, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.incomeStatement → LedgerReadService.incomeStatement → LedgerReadService.aggregatePostedByAccount → AccountsRepository.findByPractice | `src/modules/accounting/repositories/accounts.repository.ts:116` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.incomeStatement → LedgerReadService.incomeStatement → LedgerReadService.aggregatePostedByAccount → JournalRepository.findTransactions | `src/modules/accounting/repositories/journal.repository.ts:284` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.incomeStatement → LedgerReadService.incomeStatement → LedgerReadService.aggregatePostedByAccount → JournalRepository.findEntriesByTransactions | `src/modules/accounting/repositories/journal.repository.ts:329` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.incomeStatement → LedgerReadService.incomeStatement → LedgerReadService.verifyPracticeTenant | `src/modules/accounting/services/ledger-read.service.ts:152` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.incomeStatement → LedgerReadService.incomeStatement → LedgerReadService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |
| `fiscalPeriodId` | query | No | `string` | — |
| `from` | query | No | `string` | Estado de resultados: inicio de la ventana |
| `to` | query | No | `string` | Fin de la ventana (estado de resultados) o fecha de corte (balance general), inclusive |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<IncomeStatementResponseDto>` · DTO `IncomeStatementResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revenueItems` | `array<FinancialStatementLineDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:389` |
| `revenueItems[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:372` |
| `revenueItems[].code` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:373` |
| `revenueItems[].name` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:374` |
| `revenueItems[].accountTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:375` |
| `revenueItems[].amount` | `string` | Sí | — | — | Importe según la naturaleza de la cuenta | `src/modules/accounting/dto/ledger-read.dto.ts:378` |
| `expenseItems` | `array<FinancialStatementLineDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:391` |
| `expenseItems[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:372` |
| `expenseItems[].code` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:373` |
| `expenseItems[].name` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:374` |
| `expenseItems[].accountTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:375` |
| `expenseItems[].amount` | `string` | Sí | — | — | Importe según la naturaleza de la cuenta | `src/modules/accounting/dto/ledger-read.dto.ts:378` |
| `totalRevenue` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:392` |
| `totalExpense` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:393` |
| `netIncome` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:394` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:395` |
| `limit` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:396` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:397` |
| `truncated` | `boolean` | Sí | — | — | Si se alcanzó el tope y el informe está incompleto | `src/modules/accounting/dto/ledger-read.dto.ts:401` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: No se pudo verificar la vinculación del profesional con la práctica; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /accounting/journal-transactions

- **Origen:** CONTRATO
- **Nombre:** Libro diario de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.listJournal` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:98`

### Qué es y para qué sirve (negocio)

Libro diario de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/journal-transactions` la atiende `AccountingLedgerController.listJournal` (src/modules/accounting/controllers/accounting-ledger.controller.ts:98). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.listJournal`. Lee accounting.journal_transactions, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:98` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.listJournal → LedgerReadService.listJournal → JournalRepository.findTransactions | `src/modules/accounting/repositories/journal.repository.ts:284` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.listJournal → LedgerReadService.listJournal → LedgerReadService.verifyPracticeTenant | `src/modules/accounting/services/ledger-read.service.ts:152` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | Práctica dueña del libro |
| `fiscalPeriodId` | query | No | `string` | Acotar a un período |
| `statusConceptId` | query | No | `string` | Acotar a un estado (borrador, posteado, reversado…) |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListJournalResponseDto>` · DTO `ListJournalResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<JournalTransactionItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:161` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:139` |
| `items[].transactionNumber` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:140` |
| `items[].transactionDate` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:141` |
| `items[].fiscalPeriodId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:142` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:144` |
| `items[].transactionTypeConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:146` |
| `items[].currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:147` |
| `items[].totalAmount` | `string` | No | admite null | — | Importe total, decimal como texto | `src/modules/accounting/dto/ledger-read.dto.ts:153` |
| `items[].postedAt` | `string` | No | formato date-time; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:155` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:162` |
| `limit` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:163` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /accounting/journal-transactions

- **Origen:** CONTRATO
- **Nombre:** Registrar y postear un asiento balanceado (partida doble)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.postJournal` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:185`

### Qué es y para qué sirve (negocio)

Registrar y postear un asiento balanceado (partida doble). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions` la atiende `AccountingLedgerController.postJournal` (src/modules/accounting/controllers/accounting-ledger.controller.ts:185). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PostJournalDto` (19 campos, 6 obligatorios). Delega en `LedgerService.postJournal`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, audit.audit_log. Lee accounting.accounts, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.journal_transactions, accounting.profit_centers, audit.audit_log, iam.sessions y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:185` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → LedgerService.writeLines → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → JournalRepository.findByTransactionNumber | `src/modules/accounting/repositories/journal.repository.ts:246` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → LedgerService.writeLines → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | AccountingLedgerController.postJournal → LedgerService.postJournal → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AccountingScopeService.assertPostingScope → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `PostJournalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica propietaria del asiento | `src/modules/accounting/dto/journal.dto.ts:125` |
| `transactionNumber` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Número de asiento (único por práctica); autogenerado si se omite | `src/modules/accounting/dto/journal.dto.ts:137` |
| `transactionDate` | `string` | Sí | formato date | `@IsDateString()` | Fecha contable | `src/modules/accounting/dto/journal.dto.ts:148` |
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Periodo fiscal ABIERTO | `src/modules/accounting/dto/journal.dto.ts:159` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:167` |
| `description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/accounting/dto/journal.dto.ts:176` |
| `reference` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/accounting/dto/journal.dto.ts:185` |
| `sourceDocumentType` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Tipo del documento origen (p. ej. INVOICE, APPOINTMENT, EXPENSE) | `src/modules/accounting/dto/journal.dto.ts:203` |
| `sourceDocumentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:209` |
| `lines` | `array<LedgerLineDto>` | Sí | mínimo 2 elemento(s) | `@IsArray()` `@ArrayMinSize(2)` `@ValidateNested({ each: true })` `@Type(() => LedgerLineDto)` | Líneas balanceadas (>=2) | `src/modules/accounting/dto/journal.dto.ts:222` |
| `lines[].accountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta contable postable | `src/modules/accounting/dto/journal.dto.ts:34` |
| `lines[].direction` | `string` | Sí | valores: DEBIT, CREDIT | `@IsIn(['DEBIT', 'CREDIT'])` | Dirección de la partida | `src/modules/accounting/dto/journal.dto.ts:44` |
| `lines[].amount` | `string` | Sí | patrón runtime POSITIVE_AMOUNT_REGEX | `@IsNumberString()` `@Matches(POSITIVE_AMOUNT_REGEX, { message: 'El importe de la línea debe ser positivo (sin signo)', })` | Importe positivo de la línea | `src/modules/accounting/dto/journal.dto.ts:57` |
| `lines[].costCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:65` |
| `lines[].profitCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:73` |
| `lines[].currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:81` |
| `lines[].fxRate` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tipo de cambio a moneda base | `src/modules/accounting/dto/journal.dto.ts:92` |
| `lines[].amountBase` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importe convertido a moneda base | `src/modules/accounting/dto/journal.dto.ts:103` |
| `lines[].memo` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/accounting/dto/journal.dto.ts:112` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<JournalTransactionResponseDto>` · DTO `JournalTransactionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:366` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:370` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:374` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:378` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:382` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:386` |
| `classification` | `JournalClassificationDto` | No | — | — | Evidencia de la clasificación; sólo la devuelve `classify` (MCH-018). | `src/modules/accounting/dto/journal.dto.ts:391` |
| `classification.decision` | `string` | No | valores: CLASIFICADA, SIN_REGLA, AMBIGUA | — | Resultado de evaluar el juego de reglas | `src/modules/accounting/dto/journal.dto.ts:338` |
| `classification.rulesetVersion` | `string` | No | — | — | Versión del juego de reglas evaluado | `src/modules/accounting/dto/journal.dto.ts:343` |
| `classification.ruleId` | `string` | No | — | — | Regla que decidió la imputación | `src/modules/accounting/dto/journal.dto.ts:348` |
| `classification.transactionTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a transaction type concept. | `src/modules/accounting/dto/journal.dto.ts:353` |
| `classification.reason` | `string` | No | — | — | Explicación legible de la decisión | `src/modules/accounting/dto/journal.dto.ts:358` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El número de asiento ya existe en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El asiento no tiene importe; PreconditionFailedException: El asiento no balancea (debe != haber); PreconditionFailedException: El periodo fiscal no está ABIERTO |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:182` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:59` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. GET /accounting/journal-transactions/{id}

- **Origen:** CONTRATO
- **Nombre:** Un asiento con sus líneas
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.getJournalTransaction` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:158`

### Qué es y para qué sirve (negocio)

Un asiento con sus líneas. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/journal-transactions/{id}` la atiende `AccountingLedgerController.getJournalTransaction` (src/modules/accounting/controllers/accounting-ledger.controller.ts:158). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.getJournalTransaction`. Lee accounting.journal_transactions, accounting.ledger_entries, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:158` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:158` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.getJournalTransaction → LedgerReadService.getJournalTransaction → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.getJournalTransaction → LedgerReadService.getJournalTransaction → JournalRepository.findEntriesByTransaction | `src/modules/accounting/repositories/journal.repository.ts:304` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.getJournalTransaction → LedgerReadService.getJournalTransaction → LedgerReadService.verifyPracticeTenant | `src/modules/accounting/services/ledger-read.service.ts:152` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<JournalTransactionDetailDto>` · DTO `JournalTransactionDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:183` |
| `practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:184` |
| `transactionNumber` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:185` |
| `transactionDate` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:186` |
| `fiscalPeriodId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:187` |
| `statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:189` |
| `currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:190` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:192` |
| `postedAt` | `string` | No | formato date-time; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:194` |
| `lines` | `array<LedgerEntryItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:195` |
| `lines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:168` |
| `lines[].lineNo` | `number` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:169` |
| `lines[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:170` |
| `lines[].directionConceptId` | `string` | Sí | formato uuid | — | Debe o haber. | `src/modules/accounting/dto/ledger-read.dto.ts:172` |
| `lines[].amountBase` | `string` | Sí | — | — | Importe en moneda base, decimal como texto | `src/modules/accounting/dto/ledger-read.dto.ts:174` |
| `lines[].costCenterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:175` |
| `lines[].currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asiento no encontrado; ResourceNotFoundException: Práctica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /accounting/journal-transactions/{id}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar el asiento (rol de aprobación)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.approve` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:264`

### Qué es y para qué sirve (negocio)

Aprobar el asiento (rol de aprobación). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/approve` la atiende `AccountingLedgerController.approve` (src/modules/accounting/controllers/accounting-ledger.controller.ts:264). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER. Valida el cuerpo como `JournalTransitionDto` (2 campos, 0 obligatorios). Delega en `LedgerService.approve`. Actualiza accounting.journal_transactions. Lee accounting.journal_transactions, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:264` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:264` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.approve → LedgerService.approve → LedgerService.transition | `src/modules/accounting/services/ledger.service.ts:887` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.approve → LedgerService.approve → LedgerService.transition → AccountingScopeService.transaction → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.approve → LedgerService.approve → LedgerService.transition → AccountingScopeService.transaction → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.approve → LedgerService.approve → LedgerService.transition → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `JournalTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó) | `src/modules/accounting/dto/journal.dto.ts:242` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Nota de auditoría de la transición | `src/modules/accounting/dto/journal.dto.ts:254` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<JournalTransactionResponseDto>` · DTO `JournalTransactionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:366` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:370` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:374` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:378` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:382` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:386` |
| `classification` | `JournalClassificationDto` | No | — | — | Evidencia de la clasificación; sólo la devuelve `classify` (MCH-018). | `src/modules/accounting/dto/journal.dto.ts:391` |
| `classification.decision` | `string` | No | valores: CLASIFICADA, SIN_REGLA, AMBIGUA | — | Resultado de evaluar el juego de reglas | `src/modules/accounting/dto/journal.dto.ts:338` |
| `classification.rulesetVersion` | `string` | No | — | — | Versión del juego de reglas evaluado | `src/modules/accounting/dto/journal.dto.ts:343` |
| `classification.ruleId` | `string` | No | — | — | Regla que decidió la imputación | `src/modules/accounting/dto/journal.dto.ts:348` |
| `classification.transactionTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a transaction type concept. | `src/modules/accounting/dto/journal.dto.ts:353` |
| `classification.reason` | `string` | No | — | — | Explicación legible de la decisión | `src/modules/accounting/dto/journal.dto.ts:358` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Se requiere un rol con autoridad de aprobación para aprobar el asiento |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:81` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /accounting/journal-transactions/{id}/classify

- **Origen:** CONTRATO
- **Nombre:** Clasificar automáticamente el asiento
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.classify` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:228`

### Qué es y para qué sirve (negocio)

Clasificar automáticamente el asiento. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/classify` la atiende `AccountingLedgerController.classify` (src/modules/accounting/controllers/accounting-ledger.controller.ts:228). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER. Valida el cuerpo como `JournalTransitionDto` (2 campos, 0 obligatorios). Delega en `LedgerService.classify`. Crea filas en audit.audit_log. Actualiza accounting.journal_transactions. Lee accounting.journal_transactions, audit.audit_log, iam.sessions, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:228` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:228` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.classify → LedgerService.classify | `src/modules/accounting/services/ledger.service.ts:399` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.classify → LedgerService.classify → AccountingScopeService.transaction → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.classify → LedgerService.classify → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingLedgerController.classify → LedgerService.classify → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | AccountingLedgerController.classify → LedgerService.classify → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.classify → LedgerService.classify → AccountingScopeService.transaction → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.classify → LedgerService.classify → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `JournalTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó) | `src/modules/accounting/dto/journal.dto.ts:242` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Nota de auditoría de la transición | `src/modules/accounting/dto/journal.dto.ts:254` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<JournalTransactionResponseDto>` · DTO `JournalTransactionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:366` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:370` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:374` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:378` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:382` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:386` |
| `classification` | `JournalClassificationDto` | No | — | — | Evidencia de la clasificación; sólo la devuelve `classify` (MCH-018). | `src/modules/accounting/dto/journal.dto.ts:391` |
| `classification.decision` | `string` | No | valores: CLASIFICADA, SIN_REGLA, AMBIGUA | — | Resultado de evaluar el juego de reglas | `src/modules/accounting/dto/journal.dto.ts:338` |
| `classification.rulesetVersion` | `string` | No | — | — | Versión del juego de reglas evaluado | `src/modules/accounting/dto/journal.dto.ts:343` |
| `classification.ruleId` | `string` | No | — | — | Regla que decidió la imputación | `src/modules/accounting/dto/journal.dto.ts:348` |
| `classification.transactionTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a transaction type concept. | `src/modules/accounting/dto/journal.dto.ts:353` |
| `classification.reason` | `string` | No | — | — | Explicación legible de la decisión | `src/modules/accounting/dto/journal.dto.ts:358` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: Transición de estado inválida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-018.int-spec.ts:107` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:71` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /accounting/journal-transactions/{id}/document-flow

- **Origen:** CONTRATO
- **Nombre:** Flujo del documento de un asiento
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingCockpitController.documentFlow` — `src/modules/accounting/controllers/accounting-cockpit.controller.ts:84`

### Qué es y para qué sirve (negocio)

Flujo del documento de un asiento. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/journal-transactions/{id}/document-flow` la atiende `AccountingCockpitController.documentFlow` (src/modules/accounting/controllers/accounting-cockpit.controller.ts:84). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `AccountingReadService.documentFlow`. Lee accounting.accounting_document_links, accounting.journal_transactions, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-cockpit.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-cockpit.controller.ts:84` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounting_document_links` | LEE | LEE | DIRECTA | AccountingCockpitController.documentFlow → AccountingReadService.documentFlow → JournalRepository.findReversalLinksForTransaction | `src/modules/accounting/repositories/journal.repository.ts:531` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingCockpitController.documentFlow → AccountingReadService.documentFlow → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingCockpitController.documentFlow → AccountingReadService.documentFlow → AccountingReadService.resolverPracticeTenant | `src/modules/accounting/services/accounting-read.service.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CockpitDocumentFlowDto>` · DTO `CockpitDocumentFlowDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CockpitDocumentFlowNodeDto>` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:174` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:156` |
| `items[].role` | `string` | Sí | valores: ORIGEN, ACTUAL, REVERSION | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:159` |
| `items[].transactionNumber` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:161` |
| `items[].transactionDate` | `string` | Sí | formato date-time | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:163` |
| `items[].totalAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:165` |
| `items[].status` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:167` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asiento no encontrado; ResourceNotFoundException: Práctica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:361` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-cockpit.controller.spec.ts:52` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingCockpitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /accounting/journal-transactions/{id}/files

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un documento soporte al asiento
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.attachFile` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:338`

### Qué es y para qué sirve (negocio)

Adjuntar un documento soporte al asiento. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/files` la atiende `AccountingLedgerController.attachFile` (src/modules/accounting/controllers/accounting-ledger.controller.ts:338). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER. Valida el cuerpo como `AttachFileDto` (2 campos, 1 obligatorio). Delega en `LedgerService.attachFile`. Crea filas en accounting.transaction_files. Lee accounting.journal_transactions, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:338` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:338` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.attachFile → LedgerService.attachFile → AccountingScopeService.transaction → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.transaction_files` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.attachFile → LedgerService.attachFile → JournalRepository.createFile | `src/modules/accounting/repositories/journal.repository.ts:659` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.attachFile → LedgerService.attachFile → AccountingScopeService.transaction → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.attachFile → LedgerService.attachFile → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachFileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo ya cargado en object storage | `src/modules/accounting/dto/journal.dto.ts:315` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:323` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AccountingStatusDto>` · DTO `AccountingStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Valor de ok mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:415` |
| `id` | `string` | No | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:419` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:107` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /accounting/journal-transactions/{id}/post

- **Origen:** CONTRATO
- **Nombre:** Postear el asiento aprobado (efecto en el mayor)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.post` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:282`

### Qué es y para qué sirve (negocio)

Postear el asiento aprobado (efecto en el mayor). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/post` la atiende `AccountingLedgerController.post` (src/modules/accounting/controllers/accounting-ledger.controller.ts:282). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `JournalTransitionDto` (2 campos, 0 obligatorios). Delega en `LedgerService.post`. Crea filas en audit.audit_log. Actualiza accounting.journal_transactions. Lee accounting.fiscal_periods, accounting.fiscal_years, accounting.journal_transactions, accounting.ledger_entries, audit.audit_log, iam.sessions, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:282` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.post → LedgerService.post | `src/modules/accounting/services/ledger.service.ts:511` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → AccountingScopeService.transaction → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → JournalRepository.ledgerEntriesForTransaction | `src/modules/accounting/repositories/journal.repository.ts:610` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.post → LedgerService.post → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | AccountingLedgerController.post → LedgerService.post → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → AccountingScopeService.transaction → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `JournalTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó) | `src/modules/accounting/dto/journal.dto.ts:242` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Nota de auditoría de la transición | `src/modules/accounting/dto/journal.dto.ts:254` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<JournalTransactionResponseDto>` · DTO `JournalTransactionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:366` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:370` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:374` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:378` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:382` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:386` |
| `classification` | `JournalClassificationDto` | No | — | — | Evidencia de la clasificación; sólo la devuelve `classify` (MCH-018). | `src/modules/accounting/dto/journal.dto.ts:391` |
| `classification.decision` | `string` | No | valores: CLASIFICADA, SIN_REGLA, AMBIGUA | — | Resultado de evaluar el juego de reglas | `src/modules/accounting/dto/journal.dto.ts:338` |
| `classification.rulesetVersion` | `string` | No | — | — | Versión del juego de reglas evaluado | `src/modules/accounting/dto/journal.dto.ts:343` |
| `classification.ruleId` | `string` | No | — | — | Regla que decidió la imputación | `src/modules/accounting/dto/journal.dto.ts:348` |
| `classification.transactionTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a transaction type concept. | `src/modules/accounting/dto/journal.dto.ts:353` |
| `classification.reason` | `string` | No | — | — | Explicación legible de la decisión | `src/modules/accounting/dto/journal.dto.ts:358` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado inválida; PreconditionFailedException: El periodo fiscal no está ABIERTO; PreconditionFailedException: El asiento no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:84` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /accounting/journal-transactions/{id}/reverse

- **Origen:** CONTRATO
- **Nombre:** Reversar un asiento posteado (líneas espejo)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.reverse` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:320`

### Qué es y para qué sirve (negocio)

Reversar un asiento posteado (líneas espejo). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/reverse` la atiende `AccountingLedgerController.reverse` (src/modules/accounting/controllers/accounting-ledger.controller.ts:320). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReverseJournalDto` (2 campos, 0 obligatorios). Delega en `LedgerService.reverseJournal`. Crea filas en accounting.accounting_document_links, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, audit.audit_log. Actualiza accounting.journal_transactions. Lee accounting.accounting_document_links, accounting.fiscal_periods, accounting.fiscal_years, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, audit.audit_log, iam.sessions y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:320` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:320` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounting_document_links` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.createLink | `src/modules/accounting/repositories/journal.repository.ts:486` |
| `accounting.accounting_document_links` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.findLink | `src/modules/accounting/repositories/journal.repository.ts:448` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_entry_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.assignmentForEntry | `src/modules/accounting/repositories/journal.repository.ts:628` |
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.reverse → LedgerService.reverseJournal | `src/modules/accounting/services/ledger.service.ts:655` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → AccountingScopeService.transaction → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.ledgerEntriesForTransaction | `src/modules/accounting/repositories/journal.repository.ts:610` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | AccountingLedgerController.reverse → LedgerService.reverseJournal → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → AccountingScopeService.transaction → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReverseJournalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Periodo fiscal ABIERTO de la reversa | `src/modules/accounting/dto/journal.dto.ts:268` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo de la reversa | `src/modules/accounting/dto/journal.dto.ts:277` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<JournalTransactionResponseDto>` · DTO `JournalTransactionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:366` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:370` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:374` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:378` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:382` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:386` |
| `classification` | `JournalClassificationDto` | No | — | — | Evidencia de la clasificación; sólo la devuelve `classify` (MCH-018). | `src/modules/accounting/dto/journal.dto.ts:391` |
| `classification.decision` | `string` | No | valores: CLASIFICADA, SIN_REGLA, AMBIGUA | — | Resultado de evaluar el juego de reglas | `src/modules/accounting/dto/journal.dto.ts:338` |
| `classification.rulesetVersion` | `string` | No | — | — | Versión del juego de reglas evaluado | `src/modules/accounting/dto/journal.dto.ts:343` |
| `classification.ruleId` | `string` | No | — | — | Regla que decidió la imputación | `src/modules/accounting/dto/journal.dto.ts:348` |
| `classification.transactionTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a transaction type concept. | `src/modules/accounting/dto/journal.dto.ts:353` |
| `classification.reason` | `string` | No | — | — | Explicación legible de la decisión | `src/modules/accounting/dto/journal.dto.ts:358` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El asiento ya fue reversado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado inválida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:208` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:97` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /accounting/journal-transactions/{id}/submit-review

- **Origen:** CONTRATO
- **Nombre:** Enviar el asiento a revisión
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.submitReview` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:246`

### Qué es y para qué sirve (negocio)

Enviar el asiento a revisión. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/submit-review` la atiende `AccountingLedgerController.submitReview` (src/modules/accounting/controllers/accounting-ledger.controller.ts:246). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER. Valida el cuerpo como `JournalTransitionDto` (2 campos, 0 obligatorios). Delega en `LedgerService.submitForReview`. Actualiza accounting.journal_transactions. Lee accounting.journal_transactions, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:246` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:246` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.submitReview → LedgerService.submitForReview → LedgerService.transition | `src/modules/accounting/services/ledger.service.ts:887` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.submitReview → LedgerService.submitForReview → LedgerService.transition → AccountingScopeService.transaction → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.submitReview → LedgerService.submitForReview → LedgerService.transition → AccountingScopeService.transaction → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.submitReview → LedgerService.submitForReview → LedgerService.transition → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `JournalTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó) | `src/modules/accounting/dto/journal.dto.ts:242` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Nota de auditoría de la transición | `src/modules/accounting/dto/journal.dto.ts:254` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fiscalPeriodId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<JournalTransactionResponseDto>` · DTO `JournalTransactionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:366` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:370` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:374` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:378` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:382` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:386` |
| `classification` | `JournalClassificationDto` | No | — | — | Evidencia de la clasificación; sólo la devuelve `classify` (MCH-018). | `src/modules/accounting/dto/journal.dto.ts:391` |
| `classification.decision` | `string` | No | valores: CLASIFICADA, SIN_REGLA, AMBIGUA | — | Resultado de evaluar el juego de reglas | `src/modules/accounting/dto/journal.dto.ts:338` |
| `classification.rulesetVersion` | `string` | No | — | — | Versión del juego de reglas evaluado | `src/modules/accounting/dto/journal.dto.ts:343` |
| `classification.ruleId` | `string` | No | — | — | Regla que decidió la imputación | `src/modules/accounting/dto/journal.dto.ts:348` |
| `classification.transactionTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a transaction type concept. | `src/modules/accounting/dto/journal.dto.ts:353` |
| `classification.reason` | `string` | No | — | — | Explicación legible de la decisión | `src/modules/accounting/dto/journal.dto.ts:358` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: Transición de estado inválida; PreconditionFailedException: El asiento debe clasificarse antes de enviarse a revisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-018.int-spec.ts:160` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:74` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /accounting/journal-transactions/drafts

- **Origen:** CONTRATO
- **Nombre:** Crear un asiento en borrador (DRAFT, sin postear)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.createDraft` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:207`

### Qué es y para qué sirve (negocio)

Crear un asiento en borrador (DRAFT, sin postear). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/drafts` la atiende `AccountingLedgerController.createDraft` (src/modules/accounting/controllers/accounting-ledger.controller.ts:207). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER. Valida el cuerpo como `PostJournalDto` (19 campos, 6 obligatorios). Delega en `LedgerService.createDraft`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Lee accounting.accounts, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.journal_transactions, accounting.profit_centers, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:207` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → JournalRepository.findByTransactionNumber | `src/modules/accounting/repositories/journal.repository.ts:246` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Cuerpo — DTO `PostJournalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica propietaria del asiento | `src/modules/accounting/dto/journal.dto.ts:125` |
| `transactionNumber` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Número de asiento (único por práctica); autogenerado si se omite | `src/modules/accounting/dto/journal.dto.ts:137` |
| `transactionDate` | `string` | Sí | formato date | `@IsDateString()` | Fecha contable | `src/modules/accounting/dto/journal.dto.ts:148` |
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Periodo fiscal ABIERTO | `src/modules/accounting/dto/journal.dto.ts:159` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:167` |
| `description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/accounting/dto/journal.dto.ts:176` |
| `reference` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/accounting/dto/journal.dto.ts:185` |
| `sourceDocumentType` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Tipo del documento origen (p. ej. INVOICE, APPOINTMENT, EXPENSE) | `src/modules/accounting/dto/journal.dto.ts:203` |
| `sourceDocumentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:209` |
| `lines` | `array<LedgerLineDto>` | Sí | mínimo 2 elemento(s) | `@IsArray()` `@ArrayMinSize(2)` `@ValidateNested({ each: true })` `@Type(() => LedgerLineDto)` | Líneas balanceadas (>=2) | `src/modules/accounting/dto/journal.dto.ts:222` |
| `lines[].accountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta contable postable | `src/modules/accounting/dto/journal.dto.ts:34` |
| `lines[].direction` | `string` | Sí | valores: DEBIT, CREDIT | `@IsIn(['DEBIT', 'CREDIT'])` | Dirección de la partida | `src/modules/accounting/dto/journal.dto.ts:44` |
| `lines[].amount` | `string` | Sí | patrón runtime POSITIVE_AMOUNT_REGEX | `@IsNumberString()` `@Matches(POSITIVE_AMOUNT_REGEX, { message: 'El importe de la línea debe ser positivo (sin signo)', })` | Importe positivo de la línea | `src/modules/accounting/dto/journal.dto.ts:57` |
| `lines[].costCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:65` |
| `lines[].profitCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:73` |
| `lines[].currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/journal.dto.ts:81` |
| `lines[].fxRate` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tipo de cambio a moneda base | `src/modules/accounting/dto/journal.dto.ts:92` |
| `lines[].amountBase` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importe convertido a moneda base | `src/modules/accounting/dto/journal.dto.ts:103` |
| `lines[].memo` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/accounting/dto/journal.dto.ts:112` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<JournalTransactionResponseDto>` · DTO `JournalTransactionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:366` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:370` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:374` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:378` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:382` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:386` |
| `classification` | `JournalClassificationDto` | No | — | — | Evidencia de la clasificación; sólo la devuelve `classify` (MCH-018). | `src/modules/accounting/dto/journal.dto.ts:391` |
| `classification.decision` | `string` | No | valores: CLASIFICADA, SIN_REGLA, AMBIGUA | — | Resultado de evaluar el juego de reglas | `src/modules/accounting/dto/journal.dto.ts:338` |
| `classification.rulesetVersion` | `string` | No | — | — | Versión del juego de reglas evaluado | `src/modules/accounting/dto/journal.dto.ts:343` |
| `classification.ruleId` | `string` | No | — | — | Regla que decidió la imputación | `src/modules/accounting/dto/journal.dto.ts:348` |
| `classification.transactionTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a transaction type concept. | `src/modules/accounting/dto/journal.dto.ts:353` |
| `classification.reason` | `string` | No | — | — | Explicación legible de la decisión | `src/modules/accounting/dto/journal.dto.ts:358` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El número de asiento ya existe en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El asiento no tiene importe; PreconditionFailedException: El asiento no balancea (debe != haber); PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-018.int-spec.ts:38` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:65` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /accounting/liabilities/{id}/payments

- **Origen:** CONTRATO
- **Nombre:** Liquidar cuota de pasivo (principal + interés)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLiabilityController.pay` — `src/modules/accounting/controllers/accounting-liability.controller.ts:33`

### Qué es y para qué sirve (negocio)

Liquidar cuota de pasivo (principal + interés). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/liabilities/{id}/payments` la atiende `AccountingLiabilityController.pay` (src/modules/accounting/controllers/accounting-liability.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PayLiabilityDto` (8 campos, 6 obligatorios). Delega en `LiabilityService.payLiability`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, accounting.liability_payments, accounting.liability_postings. Actualiza accounting.liabilities. Lee accounting.accounts, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.liabilities, accounting.liability_schedules, accounting.profit_centers, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-liability.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-liability.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.liabilities` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLiabilityController.pay → LiabilityService.payLiability | `src/modules/accounting/services/liability.service.ts:216` |
| `accounting.liabilities` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → AccountingScopeService.liabilityInPractice → LiabilityRepository.findById | `src/modules/accounting/repositories/liability.repository.ts:23` |
| `accounting.liability_payments` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → LiabilityRepository.createPayment | `src/modules/accounting/repositories/liability.repository.ts:257` |
| `accounting.liability_postings` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → LiabilityRepository.createPosting | `src/modules/accounting/repositories/liability.repository.ts:312` |
| `accounting.liability_schedules` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → LiabilityRepository.findScheduleById | `src/modules/accounting/repositories/liability.repository.ts:46` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PayLiabilityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica del asiento generado | `src/modules/accounting/dto/liability.dto.ts:16` |
| `amount` | `string` | Sí | — | `@IsNumberString()` | Importe total pagado (= principal + interés) | `src/modules/accounting/dto/liability.dto.ts:26` |
| `principalComponent` | `string` | Sí | — | `@IsNumberString()` | Componente de principal | `src/modules/accounting/dto/liability.dto.ts:33` |
| `interestComponent` | `string` | Sí | — | `@IsNumberString()` | Componente de interés | `src/modules/accounting/dto/liability.dto.ts:40` |
| `bankAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta banco/tesorería (crédito) | `src/modules/accounting/dto/liability.dto.ts:50` |
| `interestExpenseAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de gasto por interés (débito) | `src/modules/accounting/dto/liability.dto.ts:60` |
| `liabilityScheduleId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuota (installment) a saldar | `src/modules/accounting/dto/liability.dto.ts:71` |
| `paidAt` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/accounting/dto/liability.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "amount": "1200.00",
  "principalComponent": "1000.00",
  "interestComponent": "200.00",
  "bankAccountId": "00000000-0000-4000-8000-000000000001",
  "interestExpenseAccountId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<LiabilityPaymentResponseDto>` · DTO `LiabilityPaymentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/liability.dto.ts:87` |
| `transactionId` | `string` | Sí | formato uuid | — | Identificador asociado a transaction. | `src/modules/accounting/dto/liability.dto.ts:91` |
| `liabilityStatus` | `string` | Sí | — | — | Valor de liability status mantenido por la instancia. | `src/modules/accounting/dto/liability.dto.ts:95` |
| `outstandingAmount` | `string` | Sí | — | — | Valor de outstanding amount mantenido por la instancia. | `src/modules/accounting/dto/liability.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuota no encontrada para el pasivo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: principal + interés no iguala el importe; PreconditionFailedException: El pago debe ser positivo; PreconditionFailedException: El pasivo no está ACTIVO; PreconditionFailedException: El pasivo no tiene cuenta contable; PreconditionFailedException: La cuota ya está pagada; PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLiabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /accounting/open-items

- **Origen:** CONTRATO
- **Nombre:** Cartera abierta de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingCockpitController.openItems` — `src/modules/accounting/controllers/accounting-cockpit.controller.ts:53`

### Qué es y para qué sirve (negocio)

Cartera abierta de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/open-items` la atiende `AccountingCockpitController.openItems` (src/modules/accounting/controllers/accounting-cockpit.controller.ts:53). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `AccountingReadService.openItems`. Lee accounting.accounts, accounting.open_items, accounting.subledger_accounts, erp.business_partners, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-cockpit.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingCockpitController.openItems → AccountingReadService.openItems → AccountsRepository.findByPractice | `src/modules/accounting/repositories/accounts.repository.ts:116` |
| `accounting.open_items` | LEE | LEE | DIRECTA | AccountingCockpitController.openItems → AccountingReadService.openItems → SubledgerRepository.findOpenItemsByReconciliationAccounts | `src/modules/accounting/repositories/subledger.repository.ts:186` |
| `accounting.subledger_accounts` | LEE | LEE | DIRECTA | AccountingCockpitController.openItems → AccountingReadService.openItems → SubledgerRepository.findOpenItemsByReconciliationAccounts | `src/modules/accounting/repositories/subledger.repository.ts:179` |
| `erp.business_partners` | LEE | LEE | DIRECTA | AccountingCockpitController.openItems → AccountingReadService.openItems | `src/modules/accounting/services/accounting-read.service.ts:333` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingCockpitController.openItems → AccountingReadService.openItems → AccountingReadService.resolverPracticeTenant | `src/modules/accounting/services/accounting-read.service.ts:153` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingCockpitController.openItems → AccountingReadService.openItems → AccountingReadService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |
| `side` | query | No | `string` | Lado de la cartera a listar; sin filtro, ambos |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CockpitOpenItemsPageDto>` · DTO `CockpitOpenItemsPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CockpitOpenItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:114` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:69` |
| `items[].documentNumber` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:71` |
| `items[].accountCode` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:73` |
| `items[].accountName` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:75` |
| `items[].partnerName` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:77` |
| `items[].side` | `string` | Sí | valores: RECEIVABLE, PAYABLE | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:80` |
| `items[].documentDate` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:82` |
| `items[].dueDate` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:84` |
| `items[].amount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:86` |
| `items[].clearedAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:88` |
| `items[].openAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:90` |
| `items[].overdueDays` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:92` |
| `items[].agingBucket` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:94` |
| `aging` | `array<CockpitAgingBucketDto>` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:117` |
| `aging[].bucket` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:100` |
| `aging[].label` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:102` |
| `aging[].receivable` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:104` |
| `aging[].payable` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:106` |
| `aging[].count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:108` |
| `totalReceivable` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:119` |
| `totalPayable` | `string` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:121` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/accounting-cockpit.dto.ts:123` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: No se pudo verificar la vinculación del profesional con la práctica; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:322` |
| CONTROLADOR | `src/modules/accounting/controllers/accounting-cockpit.controller.spec.ts:37` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingCockpitController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /accounting/open-items

- **Origen:** CONTRATO
- **Nombre:** Generar partida abierta en subledger
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingSubledgerController.createOpenItem` — `src/modules/accounting/controllers/accounting-subledger.controller.ts:30`

### Qué es y para qué sirve (negocio)

Generar partida abierta en subledger. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/open-items` la atiende `AccountingSubledgerController.createOpenItem` (src/modules/accounting/controllers/accounting-subledger.controller.ts:30). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateOpenItemDto` (8 campos, 5 obligatorios). Delega en `SubledgerService.createOpenItem`. Crea filas en accounting.open_items. Lee accounting.journal_transactions, accounting.ledger_entries, accounting.subledger_accounts, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-subledger.controller.ts:30` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingSubledgerController.createOpenItem → SubledgerService.createOpenItem → AccountingScopeService.ledgerEntry → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingSubledgerController.createOpenItem → SubledgerService.createOpenItem → AccountingScopeService.ledgerEntry → JournalRepository.findLedgerEntryById | `src/modules/accounting/repositories/journal.repository.ts:230` |
| `accounting.open_items` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.createOpenItem → SubledgerService.createOpenItem → SubledgerRepository.createOpenItem | `src/modules/accounting/repositories/subledger.repository.ts:135` |
| `accounting.subledger_accounts` | LEE | LEE | DIRECTA | AccountingSubledgerController.createOpenItem → SubledgerService.createOpenItem → AccountingScopeService.subledger → SubledgerRepository.findSubledgerById | `src/modules/accounting/repositories/subledger.repository.ts:34` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingSubledgerController.createOpenItem → SubledgerService.createOpenItem → AccountingScopeService.ledgerEntry → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `CreateOpenItemDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/subledger.dto.ts:28` |
| `subledgerAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Subledger (cliente/proveedor) ya existente | `src/modules/accounting/dto/subledger.dto.ts:38` |
| `ledgerEntryId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea del mayor sobre cuenta de reconciliación | `src/modules/accounting/dto/subledger.dto.ts:48` |
| `documentType` | `string` | Sí | valores: INVOICE, BILL | `@IsIn(['INVOICE', 'BILL'])` | — | `src/modules/accounting/dto/subledger.dto.ts:55` |
| `documentNumber` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | — | `src/modules/accounting/dto/subledger.dto.ts:64` |
| `dueDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/accounting/dto/subledger.dto.ts:72` |
| `originalAmount` | `string` | Sí | — | `@IsNumberString()` | Importe original (= pendiente inicial) | `src/modules/accounting/dto/subledger.dto.ts:82` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/subledger.dto.ts:90` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subledgerAccountId": "00000000-0000-4000-8000-000000000001",
  "ledgerEntryId": "00000000-0000-4000-8000-000000000001",
  "documentType": "INVOICE",
  "originalAmount": "250.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<OpenItemResponseDto>` · DTO `OpenItemResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/subledger.dto.ts:209` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/subledger.dto.ts:213` |
| `outstandingAmount` | `string` | Sí | — | — | Valor de outstanding amount mantenido por la instancia. | `src/modules/accounting/dto/subledger.dto.ts:217` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:287` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingSubledgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. POST /accounting/postings/determine-accounts

- **Origen:** CONTRATO
- **Nombre:** Determinar la cuenta objetivo por reglas vigentes
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.determineAccounts` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:302`

### Qué es y para qué sirve (negocio)

Determinar la cuenta objetivo por reglas vigentes. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/postings/determine-accounts` la atiende `AccountingLedgerController.determineAccounts` (src/modules/accounting/controllers/accounting-ledger.controller.ts:302). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DetermineAccountsDto` (3 campos, 2 obligatorios). Delega en `LedgerService.determineAccounts`. Lee accounting.account_determination_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:302` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.account_determination_rules` | LEE | LEE | DIRECTA | AccountingLedgerController.determineAccounts → LedgerService.determineAccounts → AccountsRepository.findActiveRule | `src/modules/accounting/repositories/accounts.repository.ts:163` |

### Cuerpo — DTO `DetermineAccountsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant al que aplica la regla | `src/modules/accounting/dto/journal.dto.ts:287` |
| `postingScenarioConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Escenario de posteo | `src/modules/accounting/dto/journal.dto.ts:294` |
| `accountRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol de cuenta buscado | `src/modules/accounting/dto/journal.dto.ts:302` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "postingScenarioConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "postingScenarioConceptId": "00000000-0000-4000-8000-000000000001",
  "accountRoleConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DeterminedAccountResponseDto>` · DTO `DeterminedAccountResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ruleId` | `string` | Sí | formato uuid | — | Identificador asociado a rule. | `src/modules/accounting/dto/journal.dto.ts:399` |
| `targetAccountId` | `string` | Sí | formato uuid | — | Identificador asociado a target account. | `src/modules/accounting/dto/journal.dto.ts:403` |
| `priority` | `number` | Sí | admite null | — | Valor de priority mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:407` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay regla de determinación vigente para el escenario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:91` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /accounting/practitioner/assets

- **Origen:** CONTRATO
- **Nombre:** Listar los activos propios de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.listAssets` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:118`

### Qué es y para qué sirve (negocio)

Listar los activos propios de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/practitioner/assets` la atiende `AccountingPractitionerController.listAssets` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:118). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PractitionerAccountingService.listAssets`. Lee accounting.accounts, accounting.assets, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:118` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.listAssets → PractitionerAccountingService.listAssets → PractitionerAccountingService.currencyByAccount → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingPractitionerController.listAssets → PractitionerAccountingService.listAssets → AssetRepository.listByPractice | `src/modules/accounting/repositories/asset.repository.ts:99` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.listAssets → PractitionerAccountingService.listAssets → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<readonly AssetSummaryDto[]>` · DTO `AssetSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:44` |
| `code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:47` |
| `name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:50` |
| `statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:53` |
| `assetTypeConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:56` |
| `depreciationMethodConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:59` |
| `accountId` | `string` | No | formato uuid; admite null | — | La cuenta de adquisición elegida al dar de alta. | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:63` |
| `currencyConceptId` | `string` | No | formato uuid; admite null | — | Moneda de la cuenta de adquisición; `null` si la cuenta no la declara. | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:67` |
| `acquisitionDate` | `string` | No | formato date; admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:70` |
| `acquisitionCost` | `string` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:73` |
| `usefulLifeMonths` | `number` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:76` |
| `salvageValue` | `string` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:79` |
| `accumulatedDepreciation` | `string` | No | admite null | — | Avance: lo ya depreciado, decimal como texto. | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:83` |
| `bookValue` | `string` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:86` |
| `automated` | `boolean` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /accounting/practitioner/assets

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un activo propio
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.capitalizeAsset` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:129`

### Qué es y para qué sirve (negocio)

Dar de alta un activo propio. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/practitioner/assets` la atiende `AccountingPractitionerController.capitalizeAsset` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:129). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `CapitalizeAssetDto` (13 campos, 7 obligatorios). Delega en `PractitionerAccountingService.capitalizeOwnAsset`. Crea filas en accounting.asset_assignments, accounting.asset_postings, accounting.asset_valuations, accounting.assets, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Lee accounting.accounts, accounting.assets, accounting.cost_centers, accounting.depreciation_areas, accounting.fiscal_periods, accounting.fiscal_years, accounting.profit_centers, practice.practices y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.asset_assignments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AssetRepository.createAssignment | `src/modules/accounting/repositories/asset.repository.ts:376` |
| `accounting.asset_postings` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AssetRepository.createPosting | `src/modules/accounting/repositories/asset.repository.ts:431` |
| `accounting.asset_valuations` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AssetRepository.createValuation | `src/modules/accounting/repositories/asset.repository.ts:320` |
| `accounting.assets` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AssetRepository.createAsset | `src/modules/accounting/repositories/asset.repository.ts:194` |
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AssetRepository.findByCode | `src/modules/accounting/repositories/asset.repository.ts:42` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.depreciation_areas` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AccountingScopeService.depreciationArea → AssetRepository.findDepreciationAreaById | `src/modules/accounting/repositories/asset.repository.ts:56` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → AssetService.capitalize → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.capitalizeAsset → PractitionerAccountingService.capitalizeOwnAsset → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Cuerpo — DTO `CapitalizeAssetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:20` |
| `code` | `string` | Sí | longitud máxima 40 | `@IsString()` `@MaxLength(40)` | Código del activo | `src/modules/accounting/dto/asset.dto.ts:28` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre del activo | `src/modules/accounting/dto/asset.dto.ts:36` |
| `acquisitionAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de adquisición (débito del alta) | `src/modules/accounting/dto/asset.dto.ts:46` |
| `offsetAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta banco/proveedor (crédito del alta) | `src/modules/accounting/dto/asset.dto.ts:56` |
| `acquisitionCost` | `string` | Sí | — | `@IsNumberString()` | Costo de adquisición | `src/modules/accounting/dto/asset.dto.ts:63` |
| `acquisitionDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/asset.dto.ts:70` |
| `usefulLifeMonths` | `number` | No | mayor que 0 | `@IsOptional()` `@IsInt()` `@IsPositive()` | Vida útil en meses | `src/modules/accounting/dto/asset.dto.ts:79` |
| `salvageValue` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/accounting/dto/asset.dto.ts:87` |
| `depreciationAreaId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Área de valoración | `src/modules/accounting/dto/asset.dto.ts:95` |
| `costCenterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:103` |
| `responsibleEmployeeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:111` |
| `fiscalPeriodId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/asset.dto.ts:119` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AssetResponseDto>` · DTO `AssetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/asset.dto.ts:182` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/accounting/dto/asset.dto.ts:186` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/asset.dto.ts:190` |
| `bookValue` | `string` | Sí | — | — | Valor de book value mantenido por la instancia. | `src/modules/accounting/dto/asset.dto.ts:194` |
| `transactionId` | `string` | Sí | formato uuid | — | Identificador asociado a transaction. | `src/modules/accounting/dto/asset.dto.ts:198` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un activo con ese código en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. PATCH /accounting/practitioner/assets/{id}/automation

- **Origen:** CONTRATO
- **Nombre:** Prender o apagar la automatización de un activo
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.setAssetAutomation` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:146`

### Qué es y para qué sirve (negocio)

Prender o apagar la automatización de un activo. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PATCH /accounting/practitioner/assets/{id}/automation` la atiende `AccountingPractitionerController.setAssetAutomation` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:146). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `SetAutomationDto` (1 campo, 1 obligatorio). Delega en `PractitionerAccountingService.setAssetAutomation`. Crea filas en audit.audit_log. Actualiza accounting.assets. Lee accounting.assets, audit.audit_log, iam.sessions, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:146` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:146` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.assets` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingPractitionerController.setAssetAutomation → PractitionerAccountingService.setAssetAutomation → AssetRepository.setAutomated | `src/modules/accounting/repositories/asset.repository.ts:120` |
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingPractitionerController.setAssetAutomation → PractitionerAccountingService.setAssetAutomation → AssetRepository.setAutomated | `src/modules/accounting/repositories/asset.repository.ts:118` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.setAssetAutomation → PractitionerAccountingService.setAssetAutomation → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingPractitionerController.setAssetAutomation → PractitionerAccountingService.setAssetAutomation → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | AccountingPractitionerController.setAssetAutomation → PractitionerAccountingService.setAssetAutomation → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.setAssetAutomation → PractitionerAccountingService.setAssetAutomation → PractitionerAccountingService.assertOwnsAsset → AccountingScopeService.asset → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.setAssetAutomation → PractitionerAccountingService.setAssetAutomation → PractitionerAccountingService.assertOwnsAsset → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SetAutomationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `automated` | `boolean` | Sí | — | `@IsBoolean()` | Si un proceso automático puede avanzarlo solo | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "automated": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "automated": true
}
```

</details>

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Activo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /accounting/practitioner/assets/{id}/progress

- **Origen:** CONTRATO
- **Nombre:** Registrar el avance (depreciación) de un activo
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.registerAssetProgress` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:163`

### Qué es y para qué sirve (negocio)

Registrar el avance (depreciación) de un activo. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/practitioner/assets/{id}/progress` la atiende `AccountingPractitionerController.registerAssetProgress` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:163). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `RegisterAssetProgressDto` (3 campos, 2 obligatorios). Delega en `PractitionerAccountingService.registerAssetProgress`. Crea filas en accounting.asset_depreciations, accounting.asset_postings, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Actualiza accounting.assets. Lee accounting.accounts, accounting.asset_depreciations, accounting.assets, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.profit_centers, practice.practices y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:163` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:163` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.asset_depreciations` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → AssetRepository.createDepreciation | `src/modules/accounting/repositories/asset.repository.ts:499` |
| `accounting.asset_depreciations` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetRepository.findDepreciation | `src/modules/accounting/repositories/asset.repository.ts:460` |
| `accounting.asset_postings` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → AssetRepository.createPosting | `src/modules/accounting/repositories/asset.repository.ts:431` |
| `accounting.assets` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation | `src/modules/accounting/services/asset.service.ts:283` |
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → PractitionerAccountingService.assertOwnsAsset → AssetRepository.findById | `src/modules/accounting/repositories/asset.repository.ts:26` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → FiscalRepository.findOpenPeriodForPractice | `src/modules/accounting/repositories/fiscal.repository.ts:43` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → FiscalRepository.findOpenPeriodForPractice | `src/modules/accounting/repositories/fiscal.repository.ts:41` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → AssetService.runDepreciation → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerAssetProgress → PractitionerAccountingService.registerAssetProgress → PractitionerAccountingService.assertOwnsAsset → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RegisterAssetProgressDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `depreciationExpenseAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de gasto por depreciación (débito) | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:271` |
| `accumulatedDepreciationAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de depreciación acumulada (crédito) | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:278` |
| `postingDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha del posteo; por omisión, hoy | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:286` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "depreciationExpenseAccountId": "00000000-0000-4000-8000-000000000001",
  "accumulatedDepreciationAccountId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "depreciationExpenseAccountId": "00000000-0000-4000-8000-000000000001",
  "accumulatedDepreciationAccountId": "00000000-0000-4000-8000-000000000001",
  "postingDate": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<ProgressRegisteredResponseDto>` · DTO `ProgressRegisteredResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `transactionId` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:309` |
| `installmentNumber` | `number` | No | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:312` |
| `amount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:315` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: No hay un período fiscal abierto para esa fecha; PreconditionFailedException: El asiento generado no balancea (debe != haber); PreconditionFailedException: No hay activos elegibles para depreciar en el periodo; PreconditionFailedException: Este activo no tiene depreciación pendiente para el período abierto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. POST /accounting/practitioner/consultation-income

- **Origen:** CONTRATO
- **Nombre:** Registrar ingreso por consulta pagada
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.registerConsultationIncome` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:72`

### Qué es y para qué sirve (negocio)

Registrar ingreso por consulta pagada. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/practitioner/consultation-income` la atiende `AccountingPractitionerController.registerConsultationIncome` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:72). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `RegisterConsultationIncomeDto` (7 campos, 5 obligatorios). Delega en `PractitionerAccountingService.registerConsultationIncome`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, accounting.transaction_files, messaging.notification_requests. Lee accounting.accounts, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.journal_transactions, accounting.profit_centers, billing.bills, billing.invoices y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → JournalRepository.findByTransactionNumber | `src/modules/accounting/repositories/journal.repository.ts:246` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `accounting.transaction_files` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.attachFile → JournalRepository.createFile | `src/modules/accounting/repositories/journal.repository.ts:659` |
| `billing.bills` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.postToLedger → LedgerService.loadDocument → BillsRepository.findById | `src/modules/billing/repositories/bills.repository.ts:137` |
| `billing.invoices` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome | `src/modules/accounting/services/practitioner-accounting.service.ts:200` |
| `billing.payments_made` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.postToLedger → LedgerService.loadDocument → PaymentsMadeRepository.findById | `src/modules/billing/repositories/payments-made.repository.ts:93` |
| `billing.payments_received` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.postToLedger → LedgerService.loadDocument → PaymentsReceivedRepository.findById | `src/modules/billing/repositories/payments-received.repository.ts:97` |
| `clinical.appointments` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome | `src/modules/accounting/services/practitioner-accounting.service.ts:234` |
| `clinical.encounters` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome | `src/modules/accounting/services/practitioner-accounting.service.ts:230` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → AccountingScopeService.invoice → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Cuerpo — DTO `RegisterConsultationIncomeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:64` |
| `invoiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:69` |
| `debitAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:74` |
| `creditAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:79` |
| `transactionDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:84` |
| `description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:91` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:97` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "debitAccountId": "00000000-0000-4000-8000-000000000001",
  "creditAccountId": "00000000-0000-4000-8000-000000000001",
  "transactionDate": "2026-01-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PractitionerEntryResponseDto>` · DTO `PractitionerEntryResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `transactionId` | `string` | Sí | formato uuid | — | Asiento creado (en DRAFT: ver `docs` para el flujo hasta POSTED). | `src/modules/accounting/dto/practitioner-entry.dto.ts:158` |
| `transactionNumber` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:159` |
| `status` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:160` |
| `totalAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:161` |
| `invoiceId` | `string` | No | formato uuid; admite null | — | Factura anclada a este asiento, si el registro fue un ingreso de consulta. | `src/modules/accounting/dto/practitioner-entry.dto.ts:164` |
| `notificationRequestId` | `string` | No | formato uuid; admite null | — | Notificación in-app generada para el doctor, si la infraestructura de mensajería la aceptó. | `src/modules/accounting/dto/practitioner-entry.dto.ts:167` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: La factura ya tiene un asiento contable asociado; ConflictException: El número de asiento ya existe en la práctica; ConflictException: El documento ya fue contabilizado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: La factura no pertenece a esa práctica; PreconditionFailedException: La factura todavía no está pagada; PreconditionFailedException: La factura no está ligada a un encuentro clínico: no se puede confirmar que sea de este profesional; PreconditionFailedException: La consulta de esa factura no es de este profesional; PreconditionFailedException: La factura no registra un importe pagado; PreconditionFailedException: El asiento no tiene importe; PreconditionFailedException: El asiento no balancea (debe != haber); PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /accounting/practitioner/entries

- **Origen:** CONTRATO
- **Nombre:** Registrar un gasto u otro ingreso
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.registerSimpleEntry` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:93`

### Qué es y para qué sirve (negocio)

Registrar un gasto u otro ingreso. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/practitioner/entries` la atiende `AccountingPractitionerController.registerSimpleEntry` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:93). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `RegisterSimpleEntryDto` (8 campos, 7 obligatorios). Delega en `PractitionerAccountingService.registerSimpleEntry`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, accounting.transaction_files, messaging.notification_requests. Lee accounting.accounts, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.journal_transactions, accounting.profit_centers, messaging.message_channels, messaging.message_templates y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → JournalRepository.findByTransactionNumber | `src/modules/accounting/repositories/journal.repository.ts:246` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `accounting.transaction_files` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.attachFile → JournalRepository.createFile | `src/modules/accounting/repositories/journal.repository.ts:659` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → AccountingScopeService.assertPostingScope → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Cuerpo — DTO `RegisterSimpleEntryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:112` |
| `kind` | `string` | Sí | valores: EXPENSE, OTHER_INCOME | `@IsIn(SIMPLE_ENTRY_KINDS)` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:117` |
| `debitAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:122` |
| `creditAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:127` |
| `amount` | `string` | Sí | patrón runtime POSITIVE_AMOUNT_REGEX | `@IsNumberString()` `@Matches(POSITIVE_AMOUNT_REGEX, { message: 'El importe debe ser positivo (sin signo)', })` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:135` |
| `transactionDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:140` |
| `description` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:146` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:152` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PractitionerEntryResponseDto>` · DTO `PractitionerEntryResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `transactionId` | `string` | Sí | formato uuid | — | Asiento creado (en DRAFT: ver `docs` para el flujo hasta POSTED). | `src/modules/accounting/dto/practitioner-entry.dto.ts:158` |
| `transactionNumber` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:159` |
| `status` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:160` |
| `totalAmount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:161` |
| `invoiceId` | `string` | No | formato uuid; admite null | — | Factura anclada a este asiento, si el registro fue un ingreso de consulta. | `src/modules/accounting/dto/practitioner-entry.dto.ts:164` |
| `notificationRequestId` | `string` | No | formato uuid; admite null | — | Notificación in-app generada para el doctor, si la infraestructura de mensajería la aceptó. | `src/modules/accounting/dto/practitioner-entry.dto.ts:167` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: El número de asiento ya existe en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: El asiento no tiene importe; PreconditionFailedException: El asiento no balancea (debe != haber); PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. GET /accounting/practitioner/liabilities

- **Origen:** CONTRATO
- **Nombre:** Listar los pasivos propios de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.listLiabilities` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:181`

### Qué es y para qué sirve (negocio)

Listar los pasivos propios de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/practitioner/liabilities` la atiende `AccountingPractitionerController.listLiabilities` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:181). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PractitionerAccountingService.listLiabilities`. Lee accounting.accounts, accounting.liabilities, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:181` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.listLiabilities → PractitionerAccountingService.listLiabilities → PractitionerAccountingService.currencyByAccount → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.liabilities` | LEE | LEE | DIRECTA | AccountingPractitionerController.listLiabilities → PractitionerAccountingService.listLiabilities → LiabilityRepository.listByPractice | `src/modules/accounting/repositories/liability.repository.ts:65` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.listLiabilities → PractitionerAccountingService.listLiabilities → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<readonly LiabilitySummaryDto[]>` · DTO `LiabilitySummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:99` |
| `code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:102` |
| `name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:105` |
| `creditorName` | `string` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:108` |
| `liabilityTypeConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:111` |
| `accountId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:114` |
| `currencyConceptId` | `string` | No | formato uuid; admite null | — | Moneda de la cuenta contable del pasivo; `null` si no la declara. | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:118` |
| `principalAmount` | `string` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:121` |
| `outstandingAmount` | `string` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:124` |
| `interestRate` | `string` | No | admite null | — | Tasa anual, en por ciento, decimal como texto. | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:128` |
| `startDate` | `string` | No | formato date; admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:131` |
| `dueDate` | `string` | No | formato date; admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:134` |
| `statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:137` |
| `automated` | `boolean` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:140` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. POST /accounting/practitioner/liabilities

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un pasivo propio (préstamo)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.createLiability` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:192`

### Qué es y para qué sirve (negocio)

Dar de alta un pasivo propio (préstamo). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/practitioner/liabilities` la atiende `AccountingPractitionerController.createLiability` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:192). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `CreateOwnLiabilityDto` (10 campos, 7 obligatorios). Delega en `PractitionerAccountingService.createOwnLiability`. Crea filas en accounting.liabilities, accounting.liability_schedules. Lee accounting.accounts, accounting.liabilities, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:192` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.createLiability → PractitionerAccountingService.createOwnLiability → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.liabilities` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.createLiability → PractitionerAccountingService.createOwnLiability → LiabilityRepository.createLiability | `src/modules/accounting/repositories/liability.repository.ts:120` |
| `accounting.liabilities` | LEE | LEE | DIRECTA | AccountingPractitionerController.createLiability → PractitionerAccountingService.createOwnLiability | `src/modules/accounting/services/practitioner-accounting.service.ts:652` |
| `accounting.liability_schedules` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.createLiability → PractitionerAccountingService.createOwnLiability → LiabilityRepository.createSchedule | `src/modules/accounting/repositories/liability.repository.ts:162` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.createLiability → PractitionerAccountingService.createOwnLiability → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.createLiability → PractitionerAccountingService.createOwnLiability → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Cuerpo — DTO `CreateOwnLiabilityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:147` |
| `code` | `string` | Sí | longitud máxima 40 | `@IsString()` `@MaxLength(40)` | Código del pasivo | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:152` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre del pasivo | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:157` |
| `creditorName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:163` |
| `accountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta contable del pasivo | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:167` |
| `principalAmount` | `string` | Sí | — | `@IsNumberString()` | Monto del préstamo | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:171` |
| `interestRate` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tasa de interés anual, en por ciento | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:179` |
| `installments` | `number` | Sí | mínimo 1; máximo 360 | `@IsInt()` `@Min(1)` `@Max(360)` | Número de cuotas mensuales | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:185` |
| `startDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:189` |
| `automated` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si un proceso automático puede pagar sus cuotas solo (por omisión, sí) | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:197` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "accountId": "00000000-0000-4000-8000-000000000001",
  "principalAmount": "5000.00",
  "installments": 12,
  "startDate": "2026-09-05"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "creditorName": "Nombre de ejemplo",
  "accountId": "00000000-0000-4000-8000-000000000001",
  "principalAmount": "5000.00",
  "interestRate": "12.00",
  "installments": 12,
  "startDate": "2026-09-05",
  "automated": true
}
```

</details>

### Respuesta — `Promise<LiabilityCreatedResponseDto>` · DTO `LiabilityCreatedResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:227` |
| `code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:230` |
| `schedule` | `array<object>` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:233` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un pasivo con ese código en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. PATCH /accounting/practitioner/liabilities/{id}/automation

- **Origen:** CONTRATO
- **Nombre:** Prender o apagar la automatización de un pasivo
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.setLiabilityAutomation` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:224`

### Qué es y para qué sirve (negocio)

Prender o apagar la automatización de un pasivo. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PATCH /accounting/practitioner/liabilities/{id}/automation` la atiende `AccountingPractitionerController.setLiabilityAutomation` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:224). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `SetAutomationDto` (1 campo, 1 obligatorio). Delega en `PractitionerAccountingService.setLiabilityAutomation`. Crea filas en audit.audit_log. Actualiza accounting.liabilities. Lee accounting.liabilities, audit.audit_log, iam.sessions, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:224` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:224` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.liabilities` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingPractitionerController.setLiabilityAutomation → PractitionerAccountingService.setLiabilityAutomation → LiabilityRepository.setAutomated | `src/modules/accounting/repositories/liability.repository.ts:87` |
| `accounting.liabilities` | LEE | LEE | DIRECTA | AccountingPractitionerController.setLiabilityAutomation → PractitionerAccountingService.setLiabilityAutomation → LiabilityRepository.setAutomated | `src/modules/accounting/repositories/liability.repository.ts:85` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.setLiabilityAutomation → PractitionerAccountingService.setLiabilityAutomation → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingPractitionerController.setLiabilityAutomation → PractitionerAccountingService.setLiabilityAutomation → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | AccountingPractitionerController.setLiabilityAutomation → PractitionerAccountingService.setLiabilityAutomation → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.setLiabilityAutomation → PractitionerAccountingService.setLiabilityAutomation → PractitionerAccountingService.assertOwnsLiability → AccountingScopeService.liability → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.setLiabilityAutomation → PractitionerAccountingService.setLiabilityAutomation → PractitionerAccountingService.assertOwnsLiability → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SetAutomationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `automated` | `boolean` | Sí | — | `@IsBoolean()` | Si un proceso automático puede avanzarlo solo | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "automated": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "automated": true
}
```

</details>

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Pasivo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. POST /accounting/practitioner/liabilities/{id}/progress

- **Origen:** CONTRATO
- **Nombre:** Registrar el avance (pago de cuota) de un pasivo
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.registerLiabilityProgress` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:241`

### Qué es y para qué sirve (negocio)

Registrar el avance (pago de cuota) de un pasivo. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/practitioner/liabilities/{id}/progress` la atiende `AccountingPractitionerController.registerLiabilityProgress` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:241). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `RegisterLiabilityProgressDto` (2 campos, 2 obligatorios). Delega en `PractitionerAccountingService.registerLiabilityProgress`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, accounting.liability_payments, accounting.liability_postings. Actualiza accounting.liabilities. Lee accounting.accounts, accounting.cost_centers, accounting.fiscal_periods, accounting.fiscal_years, accounting.liabilities, accounting.liability_schedules, accounting.profit_centers, practice.practices y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:241` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:241` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.accountsInPractice → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.cost_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.costCentersInPractice → AccountingControllingRepository.findCostCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:60` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:175` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.periodInPractice → AccountingScopeService.periodAndYear → FiscalRepository.findYearById | `src/modules/accounting/repositories/fiscal.repository.ts:17` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:409` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:345` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:379` |
| `accounting.liabilities` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability | `src/modules/accounting/services/liability.service.ts:216` |
| `accounting.liabilities` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → PractitionerAccountingService.assertOwnsLiability → LiabilityRepository.findById | `src/modules/accounting/repositories/liability.repository.ts:23` |
| `accounting.liability_payments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → LiabilityRepository.createPayment | `src/modules/accounting/repositories/liability.repository.ts:257` |
| `accounting.liability_postings` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → LiabilityRepository.createPosting | `src/modules/accounting/repositories/liability.repository.ts:312` |
| `accounting.liability_schedules` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityRepository.findNextDueSchedule | `src/modules/accounting/repositories/liability.repository.ts:210` |
| `accounting.profit_centers` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → PostingHelper.post → AccountingScopeService.assertPostingScope → AccountingScopeService.profitCentersInTenant → AccountingControllingRepository.findProfitCentersByIds | `src/modules/accounting/repositories/accounting-controlling.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → LiabilityService.payLiability → AccountingScopeService.practice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerLiabilityProgress → PractitionerAccountingService.registerLiabilityProgress → PractitionerAccountingService.assertOwnsLiability → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RegisterLiabilityProgressDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bankAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta banco/tesorería (crédito) | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:296` |
| `interestExpenseAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta de gasto por interés (débito) | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:303` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "bankAccountId": "00000000-0000-4000-8000-000000000001",
  "interestExpenseAccountId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "bankAccountId": "00000000-0000-4000-8000-000000000001",
  "interestExpenseAccountId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ProgressRegisteredResponseDto>` · DTO `ProgressRegisteredResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `transactionId` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:309` |
| `installmentNumber` | `number` | No | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:312` |
| `amount` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:315` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuota no encontrada para el pasivo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: Este pasivo no tiene cuotas pendientes; PreconditionFailedException: principal + interés no iguala el importe; PreconditionFailedException: El pago debe ser positivo; PreconditionFailedException: El pasivo no está ACTIVO; PreconditionFailedException: El pasivo no tiene cuenta contable; PreconditionFailedException: La cuota ya está pagada; PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. GET /accounting/practitioner/liabilities/{id}/schedule

- **Origen:** CONTRATO
- **Nombre:** Cronograma de cuotas de un pasivo propio
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.readLiabilitySchedule` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:209`

### Qué es y para qué sirve (negocio)

Cronograma de cuotas de un pasivo propio. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/practitioner/liabilities/{id}/schedule` la atiende `AccountingPractitionerController.readLiabilitySchedule` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:209). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PractitionerAccountingService.readLiabilitySchedule`. Lee accounting.accounts, accounting.liabilities, accounting.liability_schedules, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:209` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:209` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingPractitionerController.readLiabilitySchedule → PractitionerAccountingService.readLiabilitySchedule → PractitionerAccountingService.currencyByAccount → AccountsRepository.findByIds | `src/modules/accounting/repositories/accounts.repository.ts:153` |
| `accounting.liabilities` | LEE | LEE | DIRECTA | AccountingPractitionerController.readLiabilitySchedule → PractitionerAccountingService.readLiabilitySchedule → LiabilityRepository.findById | `src/modules/accounting/repositories/liability.repository.ts:23` |
| `accounting.liability_schedules` | LEE | LEE | DIRECTA | AccountingPractitionerController.readLiabilitySchedule → PractitionerAccountingService.readLiabilitySchedule → LiabilityRepository.listSchedules | `src/modules/accounting/repositories/liability.repository.ts:189` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingPractitionerController.readLiabilitySchedule → PractitionerAccountingService.readLiabilitySchedule → PractitionerAccountingService.assertOwnsLiability → AccountingScopeService.liability → AccountingScopeService.byPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.readLiabilitySchedule → PractitionerAccountingService.readLiabilitySchedule → PractitionerAccountingService.assertOwnsLiability → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LiabilityScheduleResponseDto>` · DTO `LiabilityScheduleResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `liabilityId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:245` |
| `code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:248` |
| `principalAmount` | `string` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:251` |
| `outstandingAmount` | `string` | No | admite null | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:254` |
| `currencyConceptId` | `string` | No | formato uuid; admite null | — | Moneda de la cuenta contable del pasivo, si la declara. | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:258` |
| `schedule` | `array<object>` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-assets-liabilities.dto.ts:261` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Pasivo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. GET /accounting/practitioner/paid-consultations

- **Origen:** CONTRATO
- **Nombre:** Consultas pagadas sin registrar contablemente
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.listPaidConsultations` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:57`

### Qué es y para qué sirve (negocio)

Consultas pagadas sin registrar contablemente. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/practitioner/paid-consultations` la atiende `AccountingPractitionerController.listPaidConsultations` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:57). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PractitionerAccountingService.listPaidConsultations`. Lee billing.invoices, clinical.appointments, clinical.encounters, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.invoices` | LEE | LEE | DIRECTA | AccountingPractitionerController.listPaidConsultations → PractitionerAccountingService.listPaidConsultations | `src/modules/accounting/services/practitioner-accounting.service.ts:151` |
| `clinical.appointments` | LEE | LEE | DIRECTA | AccountingPractitionerController.listPaidConsultations → PractitionerAccountingService.listPaidConsultations | `src/modules/accounting/services/practitioner-accounting.service.ts:133` |
| `clinical.encounters` | LEE | LEE | DIRECTA | AccountingPractitionerController.listPaidConsultations → PractitionerAccountingService.listPaidConsultations | `src/modules/accounting/services/practitioner-accounting.service.ts:142` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.listPaidConsultations → PractitionerAccountingService.listPaidConsultations → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PaidConsultationsResponseDto>` · DTO `PaidConsultationsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PaidConsultationDto>` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:48` |
| `items[].invoiceId` | `string` | Sí | formato uuid | — | Factura pagada (`billing.invoices.id`). | `src/modules/accounting/dto/practitioner-entry.dto.ts:26` |
| `items[].invoiceNumber` | `string` | Sí | — | — | Número de factura, legible. | `src/modules/accounting/dto/practitioner-entry.dto.ts:28` |
| `items[].encounterId` | `string` | No | formato uuid; admite null | — | Encuentro clínico del que salió la factura. | `src/modules/accounting/dto/practitioner-entry.dto.ts:31` |
| `items[].appointmentId` | `string` | No | formato uuid; admite null | — | Cita de la que salió el encuentro, si la hay. | `src/modules/accounting/dto/practitioner-entry.dto.ts:34` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | Paciente atendido. | `src/modules/accounting/dto/practitioner-entry.dto.ts:36` |
| `items[].issueDate` | `string` | Sí | formato date-time | — | Fecha de emisión de la factura. | `src/modules/accounting/dto/practitioner-entry.dto.ts:38` |
| `items[].paidTotal` | `string` | Sí | — | — | Importe pagado. | `src/modules/accounting/dto/practitioner-entry.dto.ts:40` |
| `items[].currencyConceptId` | `string` | No | formato uuid; admite null | — | Moneda (concepto), si la factura la declara. | `src/modules/accounting/dto/practitioner-entry.dto.ts:43` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/practitioner-entry.dto.ts:49` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. GET /accounting/trial-balance

- **Origen:** CONTRATO
- **Nombre:** Balance de sumas y saldos
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.trialBalance` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:84`

### Qué es y para qué sirve (negocio)

Balance de sumas y saldos. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/trial-balance` la atiende `AccountingLedgerController.trialBalance` (src/modules/accounting/controllers/accounting-ledger.controller.ts:84). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.trialBalance`. Lee accounting.accounts, accounting.journal_transactions, accounting.ledger_entries, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.trialBalance → LedgerReadService.trialBalance → AccountsRepository.findByPractice | `src/modules/accounting/repositories/accounts.repository.ts:116` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.trialBalance → LedgerReadService.trialBalance → JournalRepository.findTransactions | `src/modules/accounting/repositories/journal.repository.ts:284` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.trialBalance → LedgerReadService.trialBalance → JournalRepository.findEntriesByTransactions | `src/modules/accounting/repositories/journal.repository.ts:329` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.trialBalance → LedgerReadService.trialBalance → LedgerReadService.verifyPracticeTenant | `src/modules/accounting/services/ledger-read.service.ts:152` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | query | Sí | `string` | — |
| `fiscalPeriodId` | query | No | `string` | — |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TrialBalanceResponseDto>` · DTO `TrialBalanceResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<TrialBalanceItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:215` |
| `items[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:200` |
| `items[].code` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:201` |
| `items[].name` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:202` |
| `items[].normalBalanceConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:204` |
| `items[].debit` | `string` | Sí | — | — | Suma del debe | `src/modules/accounting/dto/ledger-read.dto.ts:205` |
| `items[].credit` | `string` | Sí | — | — | Suma del haber | `src/modules/accounting/dto/ledger-read.dto.ts:206` |
| `items[].balance` | `string` | Sí | — | — | Saldo según la naturaleza de la cuenta | `src/modules/accounting/dto/ledger-read.dto.ts:210` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:216` |
| `totalDebit` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:217` |
| `totalCredit` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:218` |
| `balanced` | `boolean` | Sí | — | — | El conjunto cuadra | `src/modules/accounting/dto/ledger-read.dto.ts:227` |
| `transactionsIncluded` | `number` | Sí | — | — | Asientos POSTEADOS incluidos en la agregación | `src/modules/accounting/dto/ledger-read.dto.ts:229` |
| `truncated` | `boolean` | Sí | — | — | Si se alcanzó el tope y el balance está incompleto | `src/modules/accounting/dto/ledger-read.dto.ts:234` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La práctica consultada pertenece a otra organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

