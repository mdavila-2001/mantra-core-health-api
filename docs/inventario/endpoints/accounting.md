<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `accounting`

- **Bloque:** Financiero y ERP (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)
- **Operaciones:** 27 (27 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 21 · BAJO 6
- **Tablas distintas que tocan:** 39
- **Respuestas de error y detalle contractual:** `openapi/endpoints/accounting.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/accounting/accounts` | Plan de cuentas de una práctica | BAJO | 2 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 2 | POST | `/accounting/accounts` | Crear una cuenta del plan contable | MEDIO | 2 | SECURITY_ADMIN |
| 3 | POST | `/accounting/accrual-objects` | Crear objeto de devengo y su cronograma | MEDIO | 3 | SECURITY_ADMIN |
| 4 | POST | `/accounting/accruals/run` | Postear devengo periódico (accrual run) | MEDIO | 7 | SECURITY_ADMIN |
| 5 | POST | `/accounting/assets/capitalize` | Capitalizar activo (alta y asignación) | MEDIO | 8 | SECURITY_ADMIN |
| 6 | POST | `/accounting/clearing-documents` | Compensar/clearing de partidas abiertas | MEDIO | 8 | SECURITY_ADMIN |
| 7 | POST | `/accounting/depreciation/run` | Ejecutar depreciación de activos (batch) | MEDIO | 8 | SECURITY_ADMIN |
| 8 | POST | `/accounting/exchange-rates` | Registrar tipo de cambio para conversión | MEDIO | 3 | SECURITY_ADMIN |
| 9 | POST | `/accounting/fiscal-periods/{id}/lock` | Cerrar/bloquear un periodo fiscal | MEDIO | 2 | SECURITY_ADMIN |
| 10 | POST | `/accounting/fiscal-years` | Abrir un ejercicio fiscal y sus periodos | MEDIO | 3 | SECURITY_ADMIN |
| 11 | GET | `/accounting/journal-transactions` | Libro diario de una práctica | BAJO | 2 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 12 | POST | `/accounting/journal-transactions` | Registrar y postear un asiento balanceado (partida doble) | MEDIO | 7 | SECURITY_ADMIN |
| 13 | GET | `/accounting/journal-transactions/{id}` | Un asiento con sus líneas | BAJO | 3 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |
| 14 | POST | `/accounting/journal-transactions/{id}/approve` | Aprobar el asiento (rol de aprobación) | MEDIO | 3 | SECURITY_ADMIN, ACCOUNTING_APPROVER |
| 15 | POST | `/accounting/journal-transactions/{id}/classify` | Clasificar automáticamente el asiento | MEDIO | 3 | SECURITY_ADMIN, PRACTITIONER |
| 16 | POST | `/accounting/journal-transactions/{id}/files` | Adjuntar un documento soporte al asiento | MEDIO | 3 | SECURITY_ADMIN, PRACTITIONER |
| 17 | POST | `/accounting/journal-transactions/{id}/post` | Postear el asiento aprobado (efecto en el mayor) | MEDIO | 6 | SECURITY_ADMIN |
| 18 | POST | `/accounting/journal-transactions/{id}/reverse` | Reversar un asiento posteado (líneas espejo) | MEDIO | 11 | SECURITY_ADMIN |
| 19 | POST | `/accounting/journal-transactions/{id}/submit-review` | Enviar el asiento a revisión | MEDIO | 3 | SECURITY_ADMIN, PRACTITIONER |
| 20 | POST | `/accounting/journal-transactions/drafts` | Crear un asiento en borrador (DRAFT, sin postear) | MEDIO | 5 | SECURITY_ADMIN, PRACTITIONER |
| 21 | POST | `/accounting/liabilities/{id}/payments` | Liquidar cuota de pasivo (principal + interés) | MEDIO | 8 | SECURITY_ADMIN |
| 22 | POST | `/accounting/open-items` | Generar partida abierta en subledger | MEDIO | 2 | SECURITY_ADMIN |
| 23 | POST | `/accounting/postings/determine-accounts` | Determinar la cuenta objetivo por reglas vigentes | BAJO | 1 | SECURITY_ADMIN |
| 24 | POST | `/accounting/practitioner/consultation-income` | Registrar ingreso por consulta pagada | MEDIO | 17 | PRACTITIONER |
| 25 | POST | `/accounting/practitioner/entries` | Registrar un gasto u otro ingreso | MEDIO | 11 | PRACTITIONER |
| 26 | GET | `/accounting/practitioner/paid-consultations` | Consultas pagadas sin registrar contablemente | BAJO | 4 | PRACTITIONER |
| 27 | GET | `/accounting/trial-balance` | Balance de sumas y saldos | BAJO | 4 | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER |

---

## 1. GET /accounting/accounts

- **Origen:** CONTRATO
- **Nombre:** Plan de cuentas de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.chartOfAccounts` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:67`

### Qué es y para qué sirve (negocio)

Plan de cuentas de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/accounts` la atiende `AccountingLedgerController.chartOfAccounts` (src/modules/accounting/controllers/accounting-ledger.controller.ts:67). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.chartOfAccounts`. Lee accounting.accounts, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.chartOfAccounts → LedgerReadService.chartOfAccounts → AccountsRepository.findByPractice | `src/modules/accounting/repositories/accounts.repository.ts:116` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.chartOfAccounts → LedgerReadService.chartOfAccounts → LedgerReadService.verificarPracticaDelTenant | `src/modules/accounting/services/ledger-read.service.ts:82` |

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
| `items` | `array<AccountItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:131` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:117` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:118` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:119` |
| `items[].accountTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:120` |
| `items[].normalBalanceConceptId` | `string` | Sí | formato uuid | — | Deudora o acreedora: es lo que da signo al saldo. | `src/modules/accounting/dto/ledger-read.dto.ts:122` |
| `items[].parentAccountId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:123` |
| `items[].currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:125` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:132` |
| `limit` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:133` |

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
- **Implementación:** `AccountingLedgerController.createAccount` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:112`

### Qué es y para qué sirve (negocio)

Crear una cuenta del plan contable. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/accounts` la atiende `AccountingLedgerController.createAccount` (src/modules/accounting/controllers/accounting-ledger.controller.ts:112). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AccountingCreateAccountDto` (7 campos, 5 obligatorios). Delega en `LedgerService.createAccount`. Crea filas en accounting.accounts. Lee accounting.accounts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.createAccount → LedgerService.createAccount → AccountsRepository.create | `src/modules/accounting/repositories/accounts.repository.ts:124` |
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.createAccount → LedgerService.createAccount → AccountsRepository.findByCode | `src/modules/accounting/repositories/accounts.repository.ts:89` |

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
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:52` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /accounting/accrual-objects

- **Origen:** CONTRATO
- **Nombre:** Crear objeto de devengo y su cronograma
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingAccrualController.createAccrualObject` — `src/modules/accounting/controllers/accounting-accrual.controller.ts:25`

### Qué es y para qué sirve (negocio)

Crear objeto de devengo y su cronograma. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/accrual-objects` la atiende `AccountingAccrualController.createAccrualObject` (src/modules/accounting/controllers/accounting-accrual.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccrualObjectDto` (13 campos, 8 obligatorios). Delega en `AccrualService.createAccrualObject`. Crea filas en accounting.accrual_objects, accounting.accrual_schedule_lines. Lee accounting.accrual_objects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-accrual.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accrual_objects` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccrualRepository.createObject | `src/modules/accounting/repositories/accrual.repository.ts:111` |
| `accounting.accrual_objects` | LEE | LEE | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccrualRepository.findObjectByNumber | `src/modules/accounting/repositories/accrual.repository.ts:40` |
| `accounting.accrual_schedule_lines` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.createAccrualObject → AccrualService.createAccrualObject → AccrualRepository.createScheduleLine | `src/modules/accounting/repositories/accrual.repository.ts:173` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingAccrualController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /accounting/accruals/run

- **Origen:** CONTRATO
- **Nombre:** Postear devengo periódico (accrual run)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingAccrualController.runAccruals` — `src/modules/accounting/controllers/accounting-accrual.controller.ts:37`

### Qué es y para qué sirve (negocio)

Postear devengo periódico (accrual run). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/accruals/run` la atiende `AccountingAccrualController.runAccruals` (src/modules/accounting/controllers/accounting-accrual.controller.ts:37). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RunAccrualsDto` (4 campos, 4 obligatorios). Delega en `AccrualService.runAccruals`. Crea filas en accounting.accrual_postings, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Actualiza accounting.accrual_schedule_lines. Lee accounting.accrual_objects, accounting.accrual_schedule_lines.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-accrual.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accrual_objects` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccrualRepository.findObjectById | `src/modules/accounting/repositories/accrual.repository.ts:24` |
| `accounting.accrual_postings` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccrualRepository.createPosting | `src/modules/accounting/repositories/accrual.repository.ts:238` |
| `accounting.accrual_schedule_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingAccrualController.runAccruals → AccrualService.runAccruals | `src/modules/accounting/services/accrual.service.ts:215` |
| `accounting.accrual_schedule_lines` | LEE | LEE | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → AccrualRepository.pendingLinesForPeriod | `src/modules/accounting/repositories/accrual.repository.ts:195` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingAccrualController.runAccruals → AccrualService.runAccruals → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto de devengo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto de devengo no define cuentas; PreconditionFailedException: No hay líneas de devengo pendientes en el periodo; PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingAccrualController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /accounting/assets/capitalize

- **Origen:** CONTRATO
- **Nombre:** Capitalizar activo (alta y asignación)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingAssetController.capitalize` — `src/modules/accounting/controllers/accounting-asset.controller.ts:25`

### Qué es y para qué sirve (negocio)

Capitalizar activo (alta y asignación). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/assets/capitalize` la atiende `AccountingAssetController.capitalize` (src/modules/accounting/controllers/accounting-asset.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CapitalizeAssetDto` (13 campos, 7 obligatorios). Delega en `AssetService.capitalize`. Crea filas en accounting.asset_assignments, accounting.asset_postings, accounting.asset_valuations, accounting.assets, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Lee accounting.assets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-asset.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.asset_assignments` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.createAssignment | `src/modules/accounting/repositories/asset.repository.ts:309` |
| `accounting.asset_postings` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.createPosting | `src/modules/accounting/repositories/asset.repository.ts:364` |
| `accounting.asset_valuations` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.createValuation | `src/modules/accounting/repositories/asset.repository.ts:253` |
| `accounting.assets` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.createAsset | `src/modules/accounting/repositories/asset.repository.ts:127` |
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → AssetRepository.findByCode | `src/modules/accounting/repositories/asset.repository.ts:40` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.capitalize → AssetService.capitalize → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingAssetController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /accounting/clearing-documents

- **Origen:** CONTRATO
- **Nombre:** Compensar/clearing de partidas abiertas
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingSubledgerController.clearOpenItems` — `src/modules/accounting/controllers/accounting-subledger.controller.ts:37`

### Qué es y para qué sirve (negocio)

Compensar/clearing de partidas abiertas. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/clearing-documents` la atiende `AccountingSubledgerController.clearOpenItems` (src/modules/accounting/controllers/accounting-subledger.controller.ts:37). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateClearingDto` (11 campos, 7 obligatorios). Delega en `SubledgerService.clearOpenItems`. Crea filas en accounting.clearing_documents, accounting.clearing_items, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Lee accounting.clearing_documents, accounting.open_items, accounting.subledger_accounts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-subledger.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.clearing_documents` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → SubledgerRepository.createClearingDocument | `src/modules/accounting/repositories/subledger.repository.ts:194` |
| `accounting.clearing_documents` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → SubledgerRepository.findClearingByNumber | `src/modules/accounting/repositories/subledger.repository.ts:147` |
| `accounting.clearing_items` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → SubledgerRepository.createClearingItem | `src/modules/accounting/repositories/subledger.repository.ts:255` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |
| `accounting.open_items` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → SubledgerRepository.findOpenItemById | `src/modules/accounting/repositories/subledger.repository.ts:36` |
| `accounting.subledger_accounts` | LEE | LEE | DIRECTA | AccountingSubledgerController.clearOpenItems → SubledgerService.clearOpenItems → SubledgerRepository.findSubledgerById | `src/modules/accounting/repositories/subledger.repository.ts:25` |

### Cuerpo — DTO `CreateClearingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/accounting/dto/subledger.dto.ts:133` |
| `clearingNumber` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | Número de clearing (único por tenant); autogenerado si se omite | `src/modules/accounting/dto/subledger.dto.ts:145` |
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica del asiento de compensación | `src/modules/accounting/dto/subledger.dto.ts:155` |
| `bankAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta banco/tesorería del contra-asiento | `src/modules/accounting/dto/subledger.dto.ts:165` |
| `companyBankAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/accounting/dto/subledger.dto.ts:173` |
| `clearingDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/accounting/dto/subledger.dto.ts:180` |
| `items` | `array<ClearingItemInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ClearingItemInputDto)` | Partidas a compensar (>=1) | `src/modules/accounting/dto/subledger.dto.ts:193` |
| `items[].openItemId` | `string` | Sí | formato uuid | `@IsUUID()` | Partida abierta ABIERTA | `src/modules/accounting/dto/subledger.dto.ts:100` |
| `items[].clearedAmount` | `string` | Sí | — | `@IsNumberString()` | Importe compensado | `src/modules/accounting/dto/subledger.dto.ts:107` |
| `items[].discountAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/accounting/dto/subledger.dto.ts:115` |
| `items[].exchangeDifferenceAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/accounting/dto/subledger.dto.ts:123` |

**Payload mínimo** (sólo los obligatorios):

```json
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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/subledger.dto.ts:217` |
| `clearingNumber` | `string` | Sí | — | — | Valor de clearing number mantenido por la instancia. | `src/modules/accounting/dto/subledger.dto.ts:221` |
| `transactionId` | `string` | Sí | formato uuid | — | Identificador asociado a transaction. | `src/modules/accounting/dto/subledger.dto.ts:225` |
| `clearedItems` | `number` | Sí | — | — | Valor de cleared items mantenido por la instancia. | `src/modules/accounting/dto/subledger.dto.ts:229` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Partida abierta no encontrada; ResourceNotFoundException: Subledger no encontrado |
| 409 | `CONFLICT` | ConflictException: La partida ya está compensada; ConflictException: El número de clearing ya existe en el tenant |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Importe compensado inválido; PreconditionFailedException: Las partidas no comparten subledger; PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingSubledgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /accounting/depreciation/run

- **Origen:** CONTRATO
- **Nombre:** Ejecutar depreciación de activos (batch)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingAssetController.runDepreciation` — `src/modules/accounting/controllers/accounting-asset.controller.ts:37`

### Qué es y para qué sirve (negocio)

Ejecutar depreciación de activos (batch). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/depreciation/run` la atiende `AccountingAssetController.runDepreciation` (src/modules/accounting/controllers/accounting-asset.controller.ts:37). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RunDepreciationDto` (6 campos, 5 obligatorios). Delega en `AssetService.runDepreciation`. Crea filas en accounting.asset_depreciations, accounting.asset_postings, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Actualiza accounting.assets. Lee accounting.asset_depreciations, accounting.assets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-asset.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.asset_depreciations` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AssetRepository.createDepreciation | `src/modules/accounting/repositories/asset.repository.ts:432` |
| `accounting.asset_depreciations` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AssetRepository.findDepreciation | `src/modules/accounting/repositories/asset.repository.ts:393` |
| `accounting.asset_postings` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AssetRepository.createPosting | `src/modules/accounting/repositories/asset.repository.ts:364` |
| `accounting.assets` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingAssetController.runDepreciation → AssetService.runDepreciation | `src/modules/accounting/services/asset.service.ts:243` |
| `accounting.assets` | LEE | LEE | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → AssetRepository.activeAssets | `src/modules/accounting/repositories/asset.repository.ts:56` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingAssetController.runDepreciation → AssetService.runDepreciation → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |

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

## 8. POST /accounting/exchange-rates

- **Origen:** CONTRATO
- **Nombre:** Registrar tipo de cambio para conversión
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingExchangeRateController.register` — `src/modules/accounting/controllers/accounting-exchange-rate.controller.ts:20`

### Qué es y para qué sirve (negocio)

Registrar tipo de cambio para conversión. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/exchange-rates` la atiende `AccountingExchangeRateController.register` (src/modules/accounting/controllers/accounting-exchange-rate.controller.ts:20). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RegisterExchangeRateDto` (5 campos, 4 obligatorios). Delega en `ExchangeRateService.registerRate`. Crea filas en accounting.exchange_rates. Actualiza accounting.exchange_rates. Lee accounting.exchange_rates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-exchange-rate.controller.ts:20` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.exchange_rates` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingExchangeRateController.register → ExchangeRateService.registerRate | `src/modules/accounting/services/exchange-rate.service.ts:60` |
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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingExchangeRateController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /accounting/fiscal-periods/{id}/lock

- **Origen:** CONTRATO
- **Nombre:** Cerrar/bloquear un periodo fiscal
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingFiscalController.lockPeriod` — `src/modules/accounting/controllers/accounting-fiscal.controller.ts:45`

### Qué es y para qué sirve (negocio)

Cerrar/bloquear un periodo fiscal. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/fiscal-periods/{id}/lock` la atiende `AccountingFiscalController.lockPeriod` (src/modules/accounting/controllers/accounting-fiscal.controller.ts:45). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LockPeriodDto` (1 campo, 0 obligatorios). Delega en `FiscalService.lockPeriod`. Actualiza accounting.fiscal_periods. Lee accounting.fiscal_periods.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-fiscal.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-fiscal.controller.ts:45` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.fiscal_periods` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingFiscalController.lockPeriod → FiscalService.lockPeriod | `src/modules/accounting/services/fiscal.service.ts:128` |
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingFiscalController.lockPeriod → FiscalService.lockPeriod → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:144` |

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
| `ok` | `boolean` | Sí | — | — | Valor de ok mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:375` |
| `id` | `string` | No | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:379` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Periodo fiscal no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El periodo no está ABIERTO |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingFiscalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /accounting/fiscal-years

- **Origen:** CONTRATO
- **Nombre:** Abrir un ejercicio fiscal y sus periodos
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingFiscalController.openFiscalYear` — `src/modules/accounting/controllers/accounting-fiscal.controller.ts:33`

### Qué es y para qué sirve (negocio)

Abrir un ejercicio fiscal y sus periodos. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/fiscal-years` la atiende `AccountingFiscalController.openFiscalYear` (src/modules/accounting/controllers/accounting-fiscal.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateFiscalYearDto` (8 campos, 8 obligatorios). Delega en `FiscalService.openFiscalYear`. Crea filas en accounting.fiscal_periods, accounting.fiscal_years. Lee accounting.fiscal_years.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-fiscal.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.fiscal_periods` | ESCRIBE | CREA | DIRECTA | AccountingFiscalController.openFiscalYear → FiscalService.openFiscalYear → FiscalRepository.createPeriod | `src/modules/accounting/repositories/fiscal.repository.ts:122` |
| `accounting.fiscal_years` | ESCRIBE | CREA | DIRECTA | AccountingFiscalController.openFiscalYear → FiscalService.openFiscalYear → FiscalRepository.createYear | `src/modules/accounting/repositories/fiscal.repository.ts:72` |
| `accounting.fiscal_years` | LEE | LEE | DIRECTA | AccountingFiscalController.openFiscalYear → FiscalService.openFiscalYear → FiscalRepository.findYearByCode | `src/modules/accounting/repositories/fiscal.repository.ts:33` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingFiscalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /accounting/journal-transactions

- **Origen:** CONTRATO
- **Nombre:** Libro diario de una práctica
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.listJournal` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:92`

### Qué es y para qué sirve (negocio)

Libro diario de una práctica. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/journal-transactions` la atiende `AccountingLedgerController.listJournal` (src/modules/accounting/controllers/accounting-ledger.controller.ts:92). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.listJournal`. Lee accounting.journal_transactions, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.listJournal → LedgerReadService.listJournal → JournalRepository.findTransactions | `src/modules/accounting/repositories/journal.repository.ts:269` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.listJournal → LedgerReadService.listJournal → LedgerReadService.verificarPracticaDelTenant | `src/modules/accounting/services/ledger-read.service.ts:82` |

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
| `items` | `array<JournalTransactionItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:160` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:138` |
| `items[].transactionNumber` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:139` |
| `items[].transactionDate` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:140` |
| `items[].fiscalPeriodId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:141` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:143` |
| `items[].transactionTypeConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:145` |
| `items[].currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:146` |
| `items[].totalAmount` | `string` | No | admite null | — | Importe total, decimal como texto | `src/modules/accounting/dto/ledger-read.dto.ts:152` |
| `items[].postedAt` | `string` | No | formato date-time; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:154` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:161` |
| `limit` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:162` |

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

## 12. POST /accounting/journal-transactions

- **Origen:** CONTRATO
- **Nombre:** Registrar y postear un asiento balanceado (partida doble)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.postJournal` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:124`

### Qué es y para qué sirve (negocio)

Registrar y postear un asiento balanceado (partida doble). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions` la atiende `AccountingLedgerController.postJournal` (src/modules/accounting/controllers/accounting-ledger.controller.ts:124). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PostJournalDto` (19 campos, 6 obligatorios). Delega en `LedgerService.postJournal`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, audit.audit_log. Lee accounting.fiscal_periods, accounting.journal_transactions, audit.audit_log.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:124` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:144` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → LedgerService.writeLines → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → JournalRepository.findByTransactionNumber | `src/modules/accounting/repositories/journal.repository.ts:231` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → LedgerService.writeLines → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingLedgerController.postJournal → LedgerService.postJournal → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:331` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:335` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:339` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:343` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:347` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:351` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Periodo fiscal no encontrado |
| 409 | `CONFLICT` | ConflictException: El número de asiento ya existe en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El asiento no tiene importe; PreconditionFailedException: El asiento no balancea (debe != haber); PreconditionFailedException: El periodo fiscal no está ABIERTO |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:59` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /accounting/journal-transactions/{id}

- **Origen:** CONTRATO
- **Nombre:** Un asiento con sus líneas
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.getJournalTransaction` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:102`

### Qué es y para qué sirve (negocio)

Un asiento con sus líneas. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/journal-transactions/{id}` la atiende `AccountingLedgerController.getJournalTransaction` (src/modules/accounting/controllers/accounting-ledger.controller.ts:102). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.getJournalTransaction`. Lee accounting.journal_transactions, accounting.ledger_entries, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:102` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.getJournalTransaction → LedgerReadService.getJournalTransaction → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.getJournalTransaction → LedgerReadService.getJournalTransaction → JournalRepository.findEntriesByTransaction | `src/modules/accounting/repositories/journal.repository.ts:289` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.getJournalTransaction → LedgerReadService.getJournalTransaction → LedgerReadService.verificarPracticaDelTenant | `src/modules/accounting/services/ledger-read.service.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<JournalTransactionDetailDto>` · DTO `JournalTransactionDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:182` |
| `practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:183` |
| `transactionNumber` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:184` |
| `transactionDate` | `string` | Sí | formato date | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:185` |
| `fiscalPeriodId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:186` |
| `statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:188` |
| `currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:189` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:191` |
| `postedAt` | `string` | No | formato date-time; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:193` |
| `lines` | `array<LedgerEntryItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:194` |
| `lines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:167` |
| `lines[].lineNo` | `number` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:168` |
| `lines[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:169` |
| `lines[].directionConceptId` | `string` | Sí | formato uuid | — | Debe o haber. | `src/modules/accounting/dto/ledger-read.dto.ts:171` |
| `lines[].amountBase` | `string` | Sí | — | — | Importe en moneda base, decimal como texto | `src/modules/accounting/dto/ledger-read.dto.ts:173` |
| `lines[].costCenterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:174` |
| `lines[].currencyConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:176` |

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

## 14. POST /accounting/journal-transactions/{id}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar el asiento (rol de aprobación)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.approve` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:183`

### Qué es y para qué sirve (negocio)

Aprobar el asiento (rol de aprobación). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/approve` la atiende `AccountingLedgerController.approve` (src/modules/accounting/controllers/accounting-ledger.controller.ts:183). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER. Valida el cuerpo como `JournalTransitionDto` (2 campos, 0 obligatorios). Delega en `LedgerService.approve`. Actualiza accounting.journal_transactions. Lee accounting.journal_transactions, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:183` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:183` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.approve → LedgerService.approve → LedgerService.transition | `src/modules/accounting/services/ledger.service.ts:796` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.approve → LedgerService.approve → LedgerService.transition → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.approve → LedgerService.approve → LedgerService.transition → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:175` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:331` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:335` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:339` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:343` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:347` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:351` |

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

## 15. POST /accounting/journal-transactions/{id}/classify

- **Origen:** CONTRATO
- **Nombre:** Clasificar automáticamente el asiento
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.classify` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:157`

### Qué es y para qué sirve (negocio)

Clasificar automáticamente el asiento. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/classify` la atiende `AccountingLedgerController.classify` (src/modules/accounting/controllers/accounting-ledger.controller.ts:157). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER. Valida el cuerpo como `JournalTransitionDto` (2 campos, 0 obligatorios). Delega en `LedgerService.classify`. Actualiza accounting.journal_transactions. Lee accounting.journal_transactions, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:157` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:157` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.classify → LedgerService.classify → LedgerService.transition | `src/modules/accounting/services/ledger.service.ts:796` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.classify → LedgerService.classify → LedgerService.transition → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.classify → LedgerService.classify → LedgerService.transition → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:175` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:331` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:335` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:339` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:343` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:347` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:351` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asiento no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: Transición de estado inválida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:71` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /accounting/journal-transactions/{id}/files

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un documento soporte al asiento
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.attachFile` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:237`

### Qué es y para qué sirve (negocio)

Adjuntar un documento soporte al asiento. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/files` la atiende `AccountingLedgerController.attachFile` (src/modules/accounting/controllers/accounting-ledger.controller.ts:237). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER. Valida el cuerpo como `AttachFileDto` (2 campos, 1 obligatorio). Delega en `LedgerService.attachFile`. Crea filas en accounting.transaction_files. Lee accounting.journal_transactions, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:237` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:237` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.attachFile → LedgerService.attachFile → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.transaction_files` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.attachFile → LedgerService.attachFile → JournalRepository.createFile | `src/modules/accounting/repositories/journal.repository.ts:546` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.attachFile → LedgerService.attachFile → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:175` |

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
| `ok` | `boolean` | Sí | — | — | Valor de ok mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:375` |
| `id` | `string` | No | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:379` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asiento no encontrado |
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

## 17. POST /accounting/journal-transactions/{id}/post

- **Origen:** CONTRATO
- **Nombre:** Postear el asiento aprobado (efecto en el mayor)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.post` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:196`

### Qué es y para qué sirve (negocio)

Postear el asiento aprobado (efecto en el mayor). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/post` la atiende `AccountingLedgerController.post` (src/modules/accounting/controllers/accounting-ledger.controller.ts:196). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `JournalTransitionDto` (2 campos, 0 obligatorios). Delega en `LedgerService.post`. Crea filas en audit.audit_log. Actualiza accounting.journal_transactions. Lee accounting.fiscal_periods, accounting.journal_transactions, accounting.ledger_entries, audit.audit_log.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:196` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.fiscal_periods` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → FiscalRepository.findPeriodById | `src/modules/accounting/repositories/fiscal.repository.ts:144` |
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.post → LedgerService.post | `src/modules/accounting/services/ledger.service.ts:405` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → JournalRepository.ledgerEntriesForTransaction | `src/modules/accounting/repositories/journal.repository.ts:497` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.post → LedgerService.post → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingLedgerController.post → LedgerService.post → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:331` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:335` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:339` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:343` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:347` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:351` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asiento no encontrado; ResourceNotFoundException: Periodo fiscal no encontrado |
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

## 18. POST /accounting/journal-transactions/{id}/reverse

- **Origen:** CONTRATO
- **Nombre:** Reversar un asiento posteado (líneas espejo)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.reverse` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:224`

### Qué es y para qué sirve (negocio)

Reversar un asiento posteado (líneas espejo). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/reverse` la atiende `AccountingLedgerController.reverse` (src/modules/accounting/controllers/accounting-ledger.controller.ts:224). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReverseJournalDto` (2 campos, 0 obligatorios). Delega en `LedgerService.reverseJournal`. Crea filas en accounting.accounting_document_links, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, audit.audit_log. Actualiza accounting.journal_transactions. Lee accounting.accounting_document_links, accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, audit.audit_log.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:224` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:224` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounting_document_links` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.createLink | `src/modules/accounting/repositories/journal.repository.ts:471` |
| `accounting.accounting_document_links` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.findLink | `src/modules/accounting/repositories/journal.repository.ts:433` |
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_entry_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.assignmentForEntry | `src/modules/accounting/repositories/journal.repository.ts:515` |
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.reverse → LedgerService.reverseJournal | `src/modules/accounting/services/ledger.service.ts:567` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → JournalRepository.ledgerEntriesForTransaction | `src/modules/accounting/repositories/journal.repository.ts:497` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AccountingLedgerController.reverse → LedgerService.reverseJournal → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:331` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:335` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:339` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:343` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:347` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:351` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asiento no encontrado |
| 409 | `CONFLICT` | ConflictException: El asiento ya fue reversado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado inválida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:97` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /accounting/journal-transactions/{id}/submit-review

- **Origen:** CONTRATO
- **Nombre:** Enviar el asiento a revisión
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.submitReview` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:170`

### Qué es y para qué sirve (negocio)

Enviar el asiento a revisión. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/{id}/submit-review` la atiende `AccountingLedgerController.submitReview` (src/modules/accounting/controllers/accounting-ledger.controller.ts:170). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER. Valida el cuerpo como `JournalTransitionDto` (2 campos, 0 obligatorios). Delega en `LedgerService.submitForReview`. Actualiza accounting.journal_transactions. Lee accounting.journal_transactions, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-ledger.controller.ts:170` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLedgerController.submitReview → LedgerService.submitForReview → LedgerService.transition | `src/modules/accounting/services/ledger.service.ts:796` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.submitReview → LedgerService.submitForReview → LedgerService.transition → JournalRepository.findTransactionById | `src/modules/accounting/repositories/journal.repository.ts:215` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.submitReview → LedgerService.submitForReview → LedgerService.transition → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:175` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:331` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:335` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:339` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:343` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:347` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:351` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asiento no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: Transición de estado inválida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:74` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /accounting/journal-transactions/drafts

- **Origen:** CONTRATO
- **Nombre:** Crear un asiento en borrador (DRAFT, sin postear)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.createDraft` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:141`

### Qué es y para qué sirve (negocio)

Crear un asiento en borrador (DRAFT, sin postear). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/journal-transactions/drafts` la atiende `AccountingLedgerController.createDraft` (src/modules/accounting/controllers/accounting-ledger.controller.ts:141). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER. Valida el cuerpo como `PostJournalDto` (19 campos, 6 obligatorios). Delega en `LedgerService.createDraft`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries. Lee accounting.journal_transactions, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:141` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → JournalRepository.findByTransactionNumber | `src/modules/accounting/repositories/journal.repository.ts:231` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingLedgerController.createDraft → LedgerService.createDraft → LedgerService.assertPractitionerOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:175` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/journal.dto.ts:331` |
| `transactionNumber` | `string` | Sí | — | — | Valor de transaction number mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:335` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:339` |
| `totalAmount` | `string` | Sí | — | — | Valor de total amount mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:343` |
| `lineCount` | `number` | Sí | — | — | Valor de line count mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:347` |
| `postedAt` | `string` | Sí | formato date-time; admite null | — | Valor de posted at mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:351` |

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
| CONTROLADOR | `src/modules/accounting/controllers/accounting-ledger.controller.spec.ts:65` |

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLedgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /accounting/liabilities/{id}/payments

- **Origen:** CONTRATO
- **Nombre:** Liquidar cuota de pasivo (principal + interés)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLiabilityController.pay` — `src/modules/accounting/controllers/accounting-liability.controller.ts:28`

### Qué es y para qué sirve (negocio)

Liquidar cuota de pasivo (principal + interés). Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/liabilities/{id}/payments` la atiende `AccountingLiabilityController.pay` (src/modules/accounting/controllers/accounting-liability.controller.ts:28). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PayLiabilityDto` (8 campos, 6 obligatorios). Delega en `LiabilityService.payLiability`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, accounting.liability_payments, accounting.liability_postings. Actualiza accounting.liabilities. Lee accounting.liabilities, accounting.liability_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-liability.controller.ts:28` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/accounting/controllers/accounting-liability.controller.ts:28` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → PostingHelper.post → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |
| `accounting.liabilities` | ESCRIBE | ACTUALIZA | POR_TIPO | AccountingLiabilityController.pay → LiabilityService.payLiability | `src/modules/accounting/services/liability.service.ts:186` |
| `accounting.liabilities` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → LiabilityRepository.findById | `src/modules/accounting/repositories/liability.repository.ts:22` |
| `accounting.liability_payments` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → LiabilityRepository.createPayment | `src/modules/accounting/repositories/liability.repository.ts:79` |
| `accounting.liability_postings` | ESCRIBE | CREA | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → LiabilityRepository.createPosting | `src/modules/accounting/repositories/liability.repository.ts:134` |
| `accounting.liability_schedules` | LEE | LEE | DIRECTA | AccountingLiabilityController.pay → LiabilityService.payLiability → LiabilityRepository.findScheduleById | `src/modules/accounting/repositories/liability.repository.ts:36` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Pasivo no encontrado; ResourceNotFoundException: Cuota no encontrada para el pasivo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: principal + interés no iguala el importe; PreconditionFailedException: El pago debe ser positivo; PreconditionFailedException: El pasivo no está ACTIVO; PreconditionFailedException: El pasivo no tiene cuenta contable; PreconditionFailedException: El asiento generado no balancea (debe != haber) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingLiabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /accounting/open-items

- **Origen:** CONTRATO
- **Nombre:** Generar partida abierta en subledger
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingSubledgerController.createOpenItem` — `src/modules/accounting/controllers/accounting-subledger.controller.ts:25`

### Qué es y para qué sirve (negocio)

Generar partida abierta en subledger. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/open-items` la atiende `AccountingSubledgerController.createOpenItem` (src/modules/accounting/controllers/accounting-subledger.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateOpenItemDto` (8 campos, 5 obligatorios). Delega en `SubledgerService.createOpenItem`. Crea filas en accounting.open_items. Lee accounting.subledger_accounts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-subledger.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.open_items` | ESCRIBE | CREA | DIRECTA | AccountingSubledgerController.createOpenItem → SubledgerService.createOpenItem → SubledgerRepository.createOpenItem | `src/modules/accounting/repositories/subledger.repository.ts:111` |
| `accounting.subledger_accounts` | LEE | LEE | DIRECTA | AccountingSubledgerController.createOpenItem → SubledgerService.createOpenItem → SubledgerRepository.findSubledgerById | `src/modules/accounting/repositories/subledger.repository.ts:25` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/accounting/dto/subledger.dto.ts:201` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/accounting/dto/subledger.dto.ts:205` |
| `outstandingAmount` | `string` | Sí | — | — | Valor de outstanding amount mantenido por la instancia. | `src/modules/accounting/dto/subledger.dto.ts:209` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Subledger no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingSubledgerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /accounting/postings/determine-accounts

- **Origen:** CONTRATO
- **Nombre:** Determinar la cuenta objetivo por reglas vigentes
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.determineAccounts` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:211`

### Qué es y para qué sirve (negocio)

Determinar la cuenta objetivo por reglas vigentes. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/postings/determine-accounts` la atiende `AccountingLedgerController.determineAccounts` (src/modules/accounting/controllers/accounting-ledger.controller.ts:211). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DetermineAccountsDto` (3 campos, 2 obligatorios). Delega en `LedgerService.determineAccounts`. Lee accounting.account_determination_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/accounting/controllers/accounting-ledger.controller.ts:211` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.account_determination_rules` | LEE | LEE | DIRECTA | AccountingLedgerController.determineAccounts → LedgerService.determineAccounts → AccountsRepository.findActiveRule | `src/modules/accounting/repositories/accounts.repository.ts:151` |

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
| `ruleId` | `string` | Sí | formato uuid | — | Identificador asociado a rule. | `src/modules/accounting/dto/journal.dto.ts:359` |
| `targetAccountId` | `string` | Sí | formato uuid | — | Identificador asociado a target account. | `src/modules/accounting/dto/journal.dto.ts:363` |
| `priority` | `number` | Sí | admite null | — | Valor de priority mantenido por la instancia. | `src/modules/accounting/dto/journal.dto.ts:367` |

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

## 24. POST /accounting/practitioner/consultation-income

- **Origen:** CONTRATO
- **Nombre:** Registrar ingreso por consulta pagada
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.registerConsultationIncome` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:54`

### Qué es y para qué sirve (negocio)

Registrar ingreso por consulta pagada. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/practitioner/consultation-income` la atiende `AccountingPractitionerController.registerConsultationIncome` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:54). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `RegisterConsultationIncomeDto` (7 campos, 5 obligatorios). Delega en `PractitionerAccountingService.registerConsultationIncome`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, accounting.transaction_files, messaging.notification_requests. Lee accounting.journal_transactions, billing.bills, billing.invoices, billing.payments_made, billing.payments_received, clinical.appointments, clinical.encounters, messaging.message_channels y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → JournalRepository.findByTransactionNumber | `src/modules/accounting/repositories/journal.repository.ts:231` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |
| `accounting.transaction_files` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.attachFile → JournalRepository.createFile | `src/modules/accounting/repositories/journal.repository.ts:546` |
| `billing.bills` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.postToLedger → LedgerService.loadDocument → BillsRepository.findById | `src/modules/billing/repositories/bills.repository.ts:137` |
| `billing.invoices` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome | `src/modules/accounting/services/practitioner-accounting.service.ts:151` |
| `billing.payments_made` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.postToLedger → LedgerService.loadDocument → PaymentsMadeRepository.findById | `src/modules/billing/repositories/payments-made.repository.ts:93` |
| `billing.payments_received` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → LedgerService.postToLedger → LedgerService.loadDocument → PaymentsReceivedRepository.findById | `src/modules/billing/repositories/payments-received.repository.ts:97` |
| `clinical.appointments` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome | `src/modules/accounting/services/practitioner-accounting.service.ts:185` |
| `clinical.encounters` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome | `src/modules/accounting/services/practitioner-accounting.service.ts:181` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerConsultationIncome → PractitionerAccountingService.registerConsultationIncome → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:175` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Factura no encontrada; ResourceNotFoundException: Documento no encontrado; ResourceNotFoundException: Asiento no encontrado; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: La factura ya tiene un asiento contable asociado; ConflictException: El número de asiento ya existe en la práctica; ConflictException: El documento ya fue contabilizado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: La factura no pertenece a esa práctica; PreconditionFailedException: La factura todavía no está pagada; PreconditionFailedException: La factura no está ligada a un encuentro clínico: no se puede confirmar que sea de este profesional; PreconditionFailedException: La consulta de esa factura no es de este profesional; PreconditionFailedException: La factura no registra un importe pagado; PreconditionFailedException: El asiento no tiene importe; PreconditionFailedException: El asiento no balancea (debe != haber); PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /accounting/practitioner/entries

- **Origen:** CONTRATO
- **Nombre:** Registrar un gasto u otro ingreso
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.registerSimpleEntry` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:70`

### Qué es y para qué sirve (negocio)

Registrar un gasto u otro ingreso. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /accounting/practitioner/entries` la atiende `AccountingPractitionerController.registerSimpleEntry` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:70). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `RegisterSimpleEntryDto` (8 campos, 7 obligatorios). Delega en `PractitionerAccountingService.registerSimpleEntry`. Crea filas en accounting.journal_entry_assignments, accounting.journal_transactions, accounting.ledger_entries, accounting.transaction_files, messaging.notification_requests. Lee accounting.journal_transactions, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_entry_assignments` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createAssignment | `src/modules/accounting/repositories/journal.repository.ts:394` |
| `accounting.journal_transactions` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → JournalRepository.createTransaction | `src/modules/accounting/repositories/journal.repository.ts:330` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → JournalRepository.findByTransactionNumber | `src/modules/accounting/repositories/journal.repository.ts:231` |
| `accounting.ledger_entries` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.createDraft → LedgerService.writeLines → JournalRepository.createLedgerEntry | `src/modules/accounting/repositories/journal.repository.ts:364` |
| `accounting.transaction_files` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → LedgerService.attachFile → JournalRepository.createFile | `src/modules/accounting/repositories/journal.repository.ts:546` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.notifyAccounting → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.registerSimpleEntry → PractitionerAccountingService.registerSimpleEntry → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:175` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asiento no encontrado; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: El número de asiento ya existe en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: El asiento no tiene importe; PreconditionFailedException: El asiento no balancea (debe != haber); PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/accounting.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 16 — Accounting (Libro Mayor y Subledgers) — etapa `ctrl:AccountingPractitionerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. GET /accounting/practitioner/paid-consultations

- **Origen:** CONTRATO
- **Nombre:** Consultas pagadas sin registrar contablemente
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingPractitionerController.listPaidConsultations` — `src/modules/accounting/controllers/accounting-practitioner.controller.ts:39`

### Qué es y para qué sirve (negocio)

Consultas pagadas sin registrar contablemente. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/practitioner/paid-consultations` la atiende `AccountingPractitionerController.listPaidConsultations` (src/modules/accounting/controllers/accounting-practitioner.controller.ts:39). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PractitionerAccountingService.listPaidConsultations`. Lee billing.invoices, clinical.appointments, clinical.encounters, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/accounting/controllers/accounting-practitioner.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.invoices` | LEE | LEE | DIRECTA | AccountingPractitionerController.listPaidConsultations → PractitionerAccountingService.listPaidConsultations | `src/modules/accounting/services/practitioner-accounting.service.ts:105` |
| `clinical.appointments` | LEE | LEE | DIRECTA | AccountingPractitionerController.listPaidConsultations → PractitionerAccountingService.listPaidConsultations | `src/modules/accounting/services/practitioner-accounting.service.ts:87` |
| `clinical.encounters` | LEE | LEE | DIRECTA | AccountingPractitionerController.listPaidConsultations → PractitionerAccountingService.listPaidConsultations | `src/modules/accounting/services/practitioner-accounting.service.ts:96` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccountingPractitionerController.listPaidConsultations → PractitionerAccountingService.listPaidConsultations → PractitionerAccountingService.assertOwnsPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:175` |

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

## 27. GET /accounting/trial-balance

- **Origen:** CONTRATO
- **Nombre:** Balance de sumas y saldos
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccountingLedgerController.trialBalance` — `src/modules/accounting/controllers/accounting-ledger.controller.ts:78`

### Qué es y para qué sirve (negocio)

Balance de sumas y saldos. Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /accounting/trial-balance` la atiende `AccountingLedgerController.trialBalance` (src/modules/accounting/controllers/accounting-ledger.controller.ts:78). Exige sesión con alguno de los roles SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER. Delega en `LedgerReadService.trialBalance`. Lee accounting.accounts, accounting.journal_transactions, accounting.ledger_entries, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `src/modules/accounting/controllers/accounting-ledger.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | practiceId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.accounts` | LEE | LEE | DIRECTA | AccountingLedgerController.trialBalance → LedgerReadService.trialBalance → AccountsRepository.findByPractice | `src/modules/accounting/repositories/accounts.repository.ts:116` |
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | AccountingLedgerController.trialBalance → LedgerReadService.trialBalance → JournalRepository.findTransactions | `src/modules/accounting/repositories/journal.repository.ts:269` |
| `accounting.ledger_entries` | LEE | LEE | DIRECTA | AccountingLedgerController.trialBalance → LedgerReadService.trialBalance → JournalRepository.findEntriesByTransactions | `src/modules/accounting/repositories/journal.repository.ts:314` |
| `practice.practices` | LEE | LEE | DIRECTA | AccountingLedgerController.trialBalance → LedgerReadService.trialBalance → LedgerReadService.verificarPracticaDelTenant | `src/modules/accounting/services/ledger-read.service.ts:82` |

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
| `items` | `array<TrialBalanceItemDto>` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:214` |
| `items[].accountId` | `string` | Sí | formato uuid | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:199` |
| `items[].code` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:200` |
| `items[].name` | `string` | No | admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:201` |
| `items[].normalBalanceConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:203` |
| `items[].debit` | `string` | Sí | — | — | Suma del debe | `src/modules/accounting/dto/ledger-read.dto.ts:204` |
| `items[].credit` | `string` | Sí | — | — | Suma del haber | `src/modules/accounting/dto/ledger-read.dto.ts:205` |
| `items[].balance` | `string` | Sí | — | — | Saldo según la naturaleza de la cuenta | `src/modules/accounting/dto/ledger-read.dto.ts:209` |
| `count` | `number` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:215` |
| `totalDebit` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:216` |
| `totalCredit` | `string` | Sí | — | — | — | `src/modules/accounting/dto/ledger-read.dto.ts:217` |
| `balanced` | `boolean` | Sí | — | — | El conjunto cuadra | `src/modules/accounting/dto/ledger-read.dto.ts:226` |
| `transactionsIncluded` | `number` | Sí | — | — | Asientos POSTEADOS incluidos en la agregación | `src/modules/accounting/dto/ledger-read.dto.ts:228` |
| `truncated` | `boolean` | Sí | — | — | Si se alcanzó el tope y el balance está incompleto | `src/modules/accounting/dto/ledger-read.dto.ts:233` |

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

