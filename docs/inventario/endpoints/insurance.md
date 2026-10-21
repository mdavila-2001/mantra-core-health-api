<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `insurance`

- **Bloque:** Financiero y ERP (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)
- **Operaciones:** 29 (28 en el contrato, 1 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 23 · BAJO 6
- **Tablas distintas que tocan:** 30
- **Respuestas de error y detalle contractual:** `openapi/endpoints/insurance.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/broker-commission-statements` | Generar liquidación de comisión de broker | MEDIO | 4 | BILLING, FINANCE |
| 2 | POST | `/claim-disputes/{id}/appeal-decisions` | Emitir decisión de apelación (inmutable) | MEDIO | 4 | BILLING, FINANCE |
| 3 | POST | `/coordination-of-benefits` | Determinar coordinación de beneficios (COB) | MEDIO | 4 | BILLING, FINANCE |
| 4 | POST | `/coverage-eligibility-requests` | Solicitar y resolver elegibilidad (270/271) | MEDIO | 5 | BILLING, FINANCE |
| 5 | POST | `/employer-groups` | Alta de grupo empleador (soporte) | MEDIO | 1 | SECURITY_ADMIN |
| 6 | GET | `/insurance-brokers` | Listar los brokers del tenant activo | BAJO | 3 | sesión (sin roles) |
| 7 | POST | `/insurance-brokers` | Alta de broker (soporte) | MEDIO | 1 | SECURITY_ADMIN |
| 8 | GET | `/insurance-brokers/{id}` | Consultar el perfil y las vinculaciones de un broker | BAJO | 4 | sesión (sin roles) |
| 9 | POST | `/insurance-brokers/{id}/agreements` | Alta de acuerdo broker–aseguradora (soporte) | MEDIO | 3 | SECURITY_ADMIN |
| 10 | GET | `/insurance-brokers/{id}/clients` | Listar la cartera comercial de un broker (sin datos clínicos) | BAJO | 3 | sesión (sin roles) |
| 11 | GET | `/insurance-carrier-catalog` | Aseguradoras privadas y públicas con sus planes de salud. | BAJO | 3 | pública |
| 12 | GET | `/insurance-carriers` | Listar las aseguradoras del tenant activo | BAJO | 5 | sesión (sin roles) |
| 13 | POST | `/insurance-carriers` | Alta de aseguradora (soporte) | MEDIO | 1 | SECURITY_ADMIN |
| 14 | GET | `/insurance-carriers/{id}` | Consultar el catálogo y la red de una aseguradora | BAJO | 7 | sesión (sin roles) |
| 15 | POST | `/insurance-carriers/{id}/products` | Alta de producto de aseguradora (soporte) | MEDIO | 2 | SECURITY_ADMIN |
| 16 | POST | `/insurance-claims` | Enviar reclamo con líneas (837) | MEDIO | 5 | BILLING, FINANCE |
| 17 | POST | `/insurance-claims/{id}/adjudications` | Adjudicar reclamo por línea (835) | MEDIO | 6 | BILLING, FINANCE |
| 18 | POST | `/insurance-claims/{id}/disputes` | Abrir disputa sobre adjudicación | MEDIO | 2 | BILLING, FINANCE |
| 19 | POST | `/insurance-claims/{id}/eob` | Publicar Explicación de Beneficios (EOB) | MEDIO | 5 | BILLING, FINANCE |
| 20 | POST | `/insurance-claims/{id}/reversals` | Registrar reversión de reclamo | MEDIO | 4 | BILLING, FINANCE |
| 21 | POST | `/insurance-plans/{id}/benefits` | Alta de beneficio de plan (soporte) | MEDIO | 2 | SECURITY_ADMIN |
| 22 | POST | `/insurance-products/{id}/plans` | Alta de plan (soporte) | MEDIO | 2 | SECURITY_ADMIN |
| 23 | POST | `/patient-coverages` | Registrar cobertura de paciente y dependientes | MEDIO | 5 | BILLING, FINANCE |
| 24 | POST | `/prior-authorization-requests` | Solicitar autorización previa con items | MEDIO | 3 | BILLING, FINANCE |
| 25 | POST | `/prior-authorization-requests/{id}/determinations` | Emitir determinación de autorización previa | MEDIO | 4 | BILLING, FINANCE |
| 26 | POST | `/provider-networks` | Alta de red de prestadores (soporte) | MEDIO | 2 | SECURITY_ADMIN |
| 27 | POST | `/provider-networks/{id}/memberships` | Alta de membresía de prestador en la red | MEDIO | 2 | SECURITY_ADMIN |
| 28 | POST | `/reconciliation-batches` | Abrir lote de conciliación | MEDIO | 2 | SECURITY_ADMIN |
| 29 | POST | `/reconciliation-batches/{id}/items` | Agregar ítem de conciliación al lote | MEDIO | 4 | SECURITY_ADMIN |

---

## 1. POST /broker-commission-statements

- **Origen:** CONTRATO
- **Nombre:** Generar liquidación de comisión de broker
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BrokerCommissionController.generate` — `src/modules/insurance/controllers/broker-commission.controller.ts:24`

### Qué es y para qué sirve (negocio)

Generar liquidación de comisión de broker. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /broker-commission-statements` la atiende `BrokerCommissionController.generate` (src/modules/insurance/controllers/broker-commission.controller.ts:24). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateCommissionStatementDto` (6 campos, 4 obligatorios). Delega en `BrokerCommissionService.generate`. Crea filas en insurance.broker_commission_statements. Lee insurance.broker_carrier_agreements, insurance.broker_commission_statements, insurance.insurance_brokers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/broker-commission.controller.ts:24` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_carrier_agreements` | LEE | LEE | DIRECTA | BrokerCommissionController.generate → BrokerCommissionService.generate → CatalogRepository.findAgreement | `src/modules/insurance/repositories/catalog.repository.ts:249` |
| `insurance.broker_commission_statements` | ESCRIBE | CREA | DIRECTA | BrokerCommissionController.generate → BrokerCommissionService.generate → SettlementRepository.createStatement | `src/modules/insurance/repositories/settlement.repository.ts:99` |
| `insurance.broker_commission_statements` | LEE | LEE | DIRECTA | BrokerCommissionController.generate → BrokerCommissionService.generate → SettlementRepository.findStatementByUnique | `src/modules/insurance/repositories/settlement.repository.ts:81` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | BrokerCommissionController.generate → BrokerCommissionService.generate → CatalogRepository.findBroker | `src/modules/insurance/repositories/catalog.repository.ts:200` |

### Cuerpo — DTO `CreateCommissionStatementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceBrokerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/broker-commission.dto.ts:11` |
| `brokerCarrierAgreementId` | `string` | Sí | formato uuid | `@IsUUID()` | Acuerdo broker–aseguradora | `src/modules/insurance/dto/broker-commission.dto.ts:18` |
| `periodStart` | `string` | Sí | formato date | `@IsString()` | — | `src/modules/insurance/dto/broker-commission.dto.ts:25` |
| `periodEnd` | `string` | Sí | formato date | `@IsString()` | — | `src/modules/insurance/dto/broker-commission.dto.ts:32` |
| `grossPremiumAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Prima bruta del periodo | `src/modules/insurance/dto/broker-commission.dto.ts:43` |
| `commissionAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Comisión calculada | `src/modules/insurance/dto/broker-commission.dto.ts:51` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "insuranceBrokerId": "00000000-0000-4000-8000-000000000001",
  "brokerCarrierAgreementId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "insuranceBrokerId": "00000000-0000-4000-8000-000000000001",
  "brokerCarrierAgreementId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31",
  "grossPremiumAmount": "10000.00",
  "commissionAmount": "500.00"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Broker no encontrado; ResourceNotFoundException: Acuerdo broker–aseguradora no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe liquidación para el periodo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El acuerdo no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:BrokerCommissionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /claim-disputes/{id}/appeal-decisions

- **Origen:** CONTRATO
- **Nombre:** Emitir decisión de apelación (inmutable)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AppealsController.decide` — `src/modules/insurance/controllers/appeals.controller.ts:32`

### Qué es y para qué sirve (negocio)

Emitir decisión de apelación (inmutable). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /claim-disputes/{id}/appeal-decisions` la atiende `AppealsController.decide` (src/modules/insurance/controllers/appeals.controller.ts:32). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateAppealDecisionDto` (3 campos, 1 obligatorio). Delega en `AppealsService.decide`. Crea filas en insurance.claim_appeal_decisions. Actualiza insurance.claim_disputes. Lee insurance.claim_appeal_decisions, insurance.claim_disputes.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/appeals.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/appeals.controller.ts:32` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_appeal_decisions` | ESCRIBE | CREA | DIRECTA | AppealsController.decide → AppealsService.decide → DisputeRepository.createAppealDecision | `src/modules/insurance/repositories/dispute.repository.ts:45` |
| `insurance.claim_appeal_decisions` | LEE | LEE | DIRECTA | AppealsController.decide → AppealsService.decide → DisputeRepository.latestDecision | `src/modules/insurance/repositories/dispute.repository.ts:27` |
| `insurance.claim_disputes` | ESCRIBE | ACTUALIZA | POR_TIPO | AppealsController.decide → AppealsService.decide | `src/modules/insurance/services/appeals.service.ts:87` |
| `insurance.claim_disputes` | LEE | LEE | DIRECTA | AppealsController.decide → AppealsService.decide → DisputeRepository.findDispute | `src/modules/insurance/repositories/dispute.repository.ts:19` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAppealDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: UPHELD, OVERTURNED | `@IsIn(['UPHELD', 'OVERTURNED'])` | — | `src/modules/insurance/dto/appeals.dto.ts:17` |
| `adjustedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto ajustado tras la decisión | `src/modules/insurance/dto/appeals.dto.ts:28` |
| `rationaleText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/dto/appeals.dto.ts:37` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "UPHELD"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "UPHELD",
  "adjustedAmount": "15.00",
  "rationaleText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Disputa no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La disputa no admite decisión en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:AppealsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /coordination-of-benefits

- **Origen:** CONTRATO
- **Nombre:** Determinar coordinación de beneficios (COB)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CoverageController.determineCob` — `src/modules/insurance/controllers/coverage.controller.ts:52`

### Qué es y para qué sirve (negocio)

Determinar coordinación de beneficios (COB). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /coordination-of-benefits` la atiende `CoverageController.determineCob` (src/modules/insurance/controllers/coverage.controller.ts:52). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateCobDto` (5 campos, 2 obligatorios). Delega en `CoverageService.determineCob`. Crea filas en insurance.coordination_of_benefits. Actualiza insurance.coordination_of_benefits. Lee insurance.coordination_of_benefits, insurance.patient_coverages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/coverage.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.coordination_of_benefits` | ESCRIBE | ACTUALIZA | POR_TIPO | CoverageController.determineCob → CoverageService.determineCob | `src/modules/insurance/services/coverage.service.ts:223` |
| `insurance.coordination_of_benefits` | ESCRIBE | CREA | DIRECTA | CoverageController.determineCob → CoverageService.determineCob → CoverageRepository.createCob | `src/modules/insurance/repositories/coverage.repository.ts:144` |
| `insurance.coordination_of_benefits` | LEE | LEE | DIRECTA | CoverageController.determineCob → CoverageService.determineCob → CoverageRepository.latestActiveCob | `src/modules/insurance/repositories/coverage.repository.ts:126` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | CoverageController.determineCob → CoverageService.determineCob → CoverageRepository.findCoverage | `src/modules/insurance/repositories/coverage.repository.ts:32` |

### Cuerpo — DTO `CreateCobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/coverage.dto.ts:146` |
| `primaryPatientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | Cobertura primaria | `src/modules/insurance/dto/coverage.dto.ts:153` |
| `secondaryPatientCoverageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cobertura secundaria | `src/modules/insurance/dto/coverage.dto.ts:161` |
| `tertiaryPatientCoverageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cobertura terciaria | `src/modules/insurance/dto/coverage.dto.ts:169` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/coverage.dto.ts:177` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "primaryPatientCoverageId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "primaryPatientCoverageId": "00000000-0000-4000-8000-000000000001",
  "secondaryPatientCoverageId": "00000000-0000-4000-8000-000000000001",
  "tertiaryPatientCoverageId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cobertura primaria no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: COB requiere al menos una cobertura secundaria |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:CoverageController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /coverage-eligibility-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar y resolver elegibilidad (270/271)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CoverageController.requestEligibility` — `src/modules/insurance/controllers/coverage.controller.ts:41`

### Qué es y para qué sirve (negocio)

Solicitar y resolver elegibilidad (270/271). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /coverage-eligibility-requests` la atiende `CoverageController.requestEligibility` (src/modules/insurance/controllers/coverage.controller.ts:41). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateEligibilityRequestDto` (4 campos, 1 obligatorio). Delega en `CoverageService.requestEligibility`. Crea filas en insurance.coverage_eligibility_requests, insurance.coverage_eligibility_responses. Actualiza insurance.coverage_eligibility_requests. Lee insurance.coverage_eligibility_requests, insurance.patient_coverages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/coverage.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.coverage_eligibility_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | CoverageController.requestEligibility → CoverageService.requestEligibility | `src/modules/insurance/services/coverage.service.ts:182` |
| `insurance.coverage_eligibility_requests` | ESCRIBE | CREA | DIRECTA | CoverageController.requestEligibility → CoverageService.requestEligibility → CoverageRepository.createEligibilityRequest | `src/modules/insurance/repositories/coverage.repository.ts:181` |
| `insurance.coverage_eligibility_requests` | LEE | LEE | DIRECTA | CoverageController.requestEligibility → CoverageService.requestEligibility → CoverageRepository.findRequestByIdempotency | `src/modules/insurance/repositories/coverage.repository.ts:167` |
| `insurance.coverage_eligibility_responses` | ESCRIBE | CREA | DIRECTA | CoverageController.requestEligibility → CoverageService.requestEligibility → CoverageRepository.createEligibilityResponse | `src/modules/insurance/repositories/coverage.repository.ts:203` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | CoverageController.requestEligibility → CoverageService.requestEligibility → CoverageRepository.findCoverage | `src/modules/insurance/repositories/coverage.repository.ts:32` |

### Cuerpo — DTO `CreateEligibilityRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/coverage.dto.ts:110` |
| `serviceDate` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/coverage.dto.ts:118` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/dto/coverage.dto.ts:127` |
| `benefitSummary` | `object` | No | — | `@IsOptional()` | Resumen de beneficios recibido del pagador | `src/modules/insurance/dto/coverage.dto.ts:136` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientCoverageId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientCoverageId": "00000000-0000-4000-8000-000000000001",
  "serviceDate": "2026-07-31",
  "idempotencyKey": "valor-ejemplo",
  "benefitSummary": {}
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cobertura no encontrada |
| 409 | `CONFLICT` | ConflictException: Solicitud de elegibilidad duplicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:CoverageController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /employer-groups

- **Origen:** CONTRATO
- **Nombre:** Alta de grupo empleador (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createEmployerGroup` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:197`

### Qué es y para qué sirve (negocio)

Alta de grupo empleador (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /employer-groups` la atiende `InsuranceBackboneController.createEmployerGroup` (src/modules/insurance/controllers/insurance-backbone.controller.ts:197). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateEmployerGroupDto` (3 campos, 3 obligatorios). Delega en `InsuranceBackboneService.createEmployerGroup`. Crea filas en insurance.employer_groups.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:197` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.employer_groups` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createEmployerGroup → InsuranceBackboneService.createEmployerGroup → CatalogRepository.createEmployerGroup | `src/modules/insurance/repositories/catalog.repository.ts:231` |

### Cuerpo — DTO `CreateEmployerGroupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/backbone.dto.ts:222` |
| `groupCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/dto/backbone.dto.ts:231` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/dto/backbone.dto.ts:240` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "groupCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "groupCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /insurance-brokers

- **Origen:** CONTRATO
- **Nombre:** Listar los brokers del tenant activo
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceReadController.listBrokers` — `src/modules/insurance/controllers/insurance-read.controller.ts:77`

### Qué es y para qué sirve (negocio)

Listar los brokers del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-brokers` la atiende `InsuranceReadController.listBrokers` (src/modules/insurance/controllers/insurance-read.controller.ts:77). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.listBrokers`. Lee insurance.broker_carrier_agreements, insurance.insurance_brokers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/controllers/insurance-read.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_carrier_agreements` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokers → InsuranceReadService.listBrokers → InsuranceReadRepository.findAgreements | `src/modules/insurance/repositories/read.repository.ts:166` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokers → InsuranceReadService.listBrokers → InsuranceReadRepository.findBrokersByTenant | `src/modules/insurance/repositories/read.repository.ts:137` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokers → InsuranceReadService.listBrokers → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/repositories/read.repository.ts:200` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BrokerDirectoryResponseDto>` · DTO `BrokerDirectoryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BrokerSummaryDto>` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:373` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:323` |
| `items[].brokerCode` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:327` |
| `items[].legalName` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:331` |
| `items[].licenseNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:335` |
| `items[].jurisdiction` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:339` |
| `items[].jurisdiction.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].jurisdiction.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:343` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `items[].verification` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:347` |
| `items[].verification.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `items[].verification.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `items[].independent` | `boolean` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:358` |
| `items[].currentCarrierCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:362` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/dto/read.dto.ts:366` |
| `count` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:377` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /insurance-brokers

- **Origen:** CONTRATO
- **Nombre:** Alta de broker (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createBroker` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:159`

### Qué es y para qué sirve (negocio)

Alta de broker (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-brokers` la atiende `InsuranceBackboneController.createBroker` (src/modules/insurance/controllers/insurance-backbone.controller.ts:159). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateBrokerDto` (4 campos, 3 obligatorios). Delega en `InsuranceBackboneService.createBroker`. Crea filas en insurance.insurance_brokers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_brokers` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createBroker → InsuranceBackboneService.createBroker → CatalogRepository.createBroker | `src/modules/insurance/repositories/catalog.repository.ts:213` |

### Cuerpo — DTO `CreateBrokerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/backbone.dto.ts:185` |
| `brokerCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/dto/backbone.dto.ts:194` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/dto/backbone.dto.ts:203` |
| `licenseNumber` | `string` | No | longitud máxima 80 | `@IsOptional()` `@IsString()` `@MaxLength(80)` | — | `src/modules/insurance/dto/backbone.dto.ts:212` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "brokerCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "brokerCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "licenseNumber": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /insurance-brokers/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil y las vinculaciones de un broker
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceReadController.getBroker` — `src/modules/insurance/controllers/insurance-read.controller.ts:90`

### Qué es y para qué sirve (negocio)

Consultar el perfil y las vinculaciones de un broker. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-brokers/{id}` la atiende `InsuranceReadController.getBroker` (src/modules/insurance/controllers/insurance-read.controller.ts:90). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.getBroker`. Lee insurance.broker_carrier_agreements, insurance.insurance_brokers, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/controllers/insurance-read.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/insurance-read.controller.ts:90` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_carrier_agreements` | LEE | LEE | DIRECTA | InsuranceReadController.getBroker → InsuranceReadService.getBroker → InsuranceReadRepository.findAgreements | `src/modules/insurance/repositories/read.repository.ts:166` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | InsuranceReadController.getBroker → InsuranceReadService.getBroker → InsuranceReadRepository.findBrokerByTenant | `src/modules/insurance/repositories/read.repository.ts:150` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceReadController.getBroker → InsuranceReadService.getBroker → InsuranceReadRepository.findCarriersByIds | `src/modules/insurance/repositories/read.repository.ts:179` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.getBroker → InsuranceReadService.getBroker → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/repositories/read.repository.ts:200` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BrokerProfileDto>` · DTO `BrokerProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:323` |
| `brokerCode` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:327` |
| `legalName` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:331` |
| `licenseNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:335` |
| `jurisdiction` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:339` |
| `jurisdiction.code` | `string` | Sí | — | — | — | sin fuente |
| `jurisdiction.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:343` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `verification` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:347` |
| `verification.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `verification.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `independent` | `boolean` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:358` |
| `currentCarrierCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:362` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/dto/read.dto.ts:366` |
| `agreements` | `array<BrokerAgreementDto>` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:390` |
| `agreements[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:273` |
| `agreements[].insuranceCarrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:277` |
| `agreements[].carrierLegalName` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:281` |
| `agreements[].agreementCode` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:285` |
| `agreements[].commissionModel` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:289` |
| `agreements[].commissionModel.code` | `string` | Sí | — | — | — | sin fuente |
| `agreements[].commissionModel.display` | `string` | Sí | — | — | — | sin fuente |
| `agreements[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:293` |
| `agreements[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:297` |
| `agreements[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:301` |
| `agreements[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `agreements[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `agreements[].current` | `boolean` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:312` |
| `agreements[].contractFileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/dto/read.dto.ts:316` |
| `publicProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/dto/read.dto.ts:400` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Broker no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /insurance-brokers/{id}/agreements

- **Origen:** CONTRATO
- **Nombre:** Alta de acuerdo broker–aseguradora (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createAgreement` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:178`

### Qué es y para qué sirve (negocio)

Alta de acuerdo broker–aseguradora (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-brokers/{id}/agreements` la atiende `InsuranceBackboneController.createAgreement` (src/modules/insurance/controllers/insurance-backbone.controller.ts:178). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateBrokerAgreementDto` (4 campos, 2 obligatorios). Delega en `InsuranceBackboneService.createAgreement`. Crea filas en insurance.broker_carrier_agreements. Lee insurance.insurance_brokers, insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/insurance-backbone.controller.ts:178` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_carrier_agreements` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createAgreement → InsuranceBackboneService.createAgreement → CatalogRepository.createAgreement | `src/modules/insurance/repositories/catalog.repository.ts:262` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createAgreement → InsuranceBackboneService.createAgreement → CatalogRepository.findBroker | `src/modules/insurance/repositories/catalog.repository.ts:200` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createAgreement → InsuranceBackboneService.createAgreement → CatalogRepository.findCarrier | `src/modules/insurance/repositories/catalog.repository.ts:36` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateBrokerAgreementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/backbone.dto.ts:250` |
| `agreementCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/dto/backbone.dto.ts:259` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/backbone.dto.ts:267` |
| `effectiveTo` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/backbone.dto.ts:275` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "agreementCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "agreementCode": "CODIGO_EJEMPLO",
  "effectiveFrom": "2026-07-31",
  "effectiveTo": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Broker no encontrado; ResourceNotFoundException: Aseguradora no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. GET /insurance-brokers/{id}/clients

- **Origen:** CONTRATO
- **Nombre:** Listar la cartera comercial de un broker (sin datos clínicos)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceReadController.listBrokerClients` — `src/modules/insurance/controllers/insurance-read.controller.ts:108`

### Qué es y para qué sirve (negocio)

Listar la cartera comercial de un broker (sin datos clínicos). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-brokers/{id}/clients` la atiende `InsuranceReadController.listBrokerClients` (src/modules/insurance/controllers/insurance-read.controller.ts:108). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.listBrokerClients`. Lee insurance.broker_clients, insurance.insurance_brokers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/controllers/insurance-read.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/insurance-read.controller.ts:108` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_clients` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokerClients → InsuranceReadService.listBrokerClients → InsuranceReadRepository.findBrokerClients | `src/modules/insurance/repositories/read.repository.ts:187` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokerClients → InsuranceReadService.listBrokerClients → InsuranceReadRepository.findBrokerByTenant | `src/modules/insurance/repositories/read.repository.ts:150` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokerClients → InsuranceReadService.listBrokerClients → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/repositories/read.repository.ts:200` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BrokerPortfolioResponseDto>` · DTO `BrokerPortfolioResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BrokerClientDto>` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:449` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:414` |
| `items[].patientProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/dto/read.dto.ts:418` |
| `items[].employerGroupId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/dto/read.dto.ts:422` |
| `items[].clientType` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:426` |
| `items[].clientType.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `items[].clientType.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `items[].assignedBrokerUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/dto/read.dto.ts:430` |
| `items[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:434` |
| `items[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:438` |
| `items[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:442` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `count` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:453` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Broker no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /insurance-carrier-catalog

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Aseguradoras privadas y públicas con sus planes de salud.
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCatalogController.listCatalog` — `src/modules/insurance/controllers/insurance-catalog.controller.ts:37`

### Qué es y para qué sirve (negocio)

Aseguradoras privadas y públicas con sus planes de salud. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-carrier-catalog` la atiende `InsuranceCatalogController.listCatalog` (src/modules/insurance/controllers/insurance-catalog.controller.ts:37). Es una ruta pública: no exige token. Delega en `InsuranceCatalogService.listHealthCatalog`. Lee insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/insurance/controllers/insurance-catalog.controller.ts:37` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 60, ttl: 60_000 } }) | `src/modules/insurance/controllers/insurance-catalog.controller.ts:37` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog | `src/modules/insurance/services/insurance-catalog.service.ts:56` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog | `src/modules/insurance/services/insurance-catalog.service.ts:68` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog | `src/modules/insurance/services/insurance-catalog.service.ts:64` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CarrierCatalogResponseDto>` · DTO `CarrierCatalogResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `carriers` | `array<CarrierCatalogEntryDto>` | Sí | — | — | Las aseguradoras del catálogo boliviano, privadas y públicas. | `src/modules/insurance/dto/carrier-catalog.dto.ts:64` |
| `carriers[].id` | `string` | Sí | formato uuid | — | Identificador de la aseguradora. | `src/modules/insurance/dto/carrier-catalog.dto.ts:28` |
| `carriers[].code` | `string` | Sí | — | — | Código estable de la aseguradora. | `src/modules/insurance/dto/carrier-catalog.dto.ts:32` |
| `carriers[].name` | `string` | Sí | — | — | Cómo se la nombra en el giro comercial. | `src/modules/insurance/dto/carrier-catalog.dto.ts:36` |
| `carriers[].legalName` | `string` | Sí | — | — | Nombre con el que está constituida. | `src/modules/insurance/dto/carrier-catalog.dto.ts:40` |
| `carriers[].isPublic` | `boolean` | Sí | — | — | Si es un seguro público o de la seguridad social (CNS, CPS, SUS…). **Se deriva del catálogo sembrado, no de la base.** El modelo tiene una sola tabla de pagador y ninguna columna que separe una caja de salud de una compañía de seguros, así que la fuente de verdad es el mismo catálogo que decidió qué sembrar. Consecuencia a tener presente: una aseguradora dada de alta por otra vía no aparece en este listado hasta que el modelo tenga un tipo de pagador persistido. | `src/modules/insurance/dto/carrier-catalog.dto.ts:53` |
| `carriers[].plans` | `array<CarrierCatalogPlanDto>` | Sí | — | — | Sus planes de salud activos. | `src/modules/insurance/dto/carrier-catalog.dto.ts:57` |
| `carriers[].plans[].id` | `string` | Sí | formato uuid | — | Identificador del plan; es lo que viaja en el alta. | `src/modules/insurance/dto/carrier-catalog.dto.ts:7` |
| `carriers[].plans[].code` | `string` | Sí | — | — | Código del plan dentro de su aseguradora. `BASE` es el plan comodín de cada compañía: la opción «no sé cuál tengo». Se expone para que la pantalla pueda nombrarlo así en vez de mostrar el nombre técnico con el que está guardado. | `src/modules/insurance/dto/carrier-catalog.dto.ts:17` |
| `carriers[].plans[].name` | `string` | Sí | — | — | Cómo se llama el plan. | `src/modules/insurance/dto/carrier-catalog.dto.ts:21` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /insurance-carriers

- **Origen:** CONTRATO
- **Nombre:** Listar las aseguradoras del tenant activo
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceReadController.listCarriers` — `src/modules/insurance/controllers/insurance-read.controller.ts:48`

### Qué es y para qué sirve (negocio)

Listar las aseguradoras del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-carriers` la atiende `InsuranceReadController.listCarriers` (src/modules/insurance/controllers/insurance-read.controller.ts:48). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.listCarriers`. Lee insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.provider_networks, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/controllers/insurance-read.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadRepository.findCarriersByTenant | `src/modules/insurance/repositories/read.repository.ts:34` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadRepository.findActivePlans | `src/modules/insurance/repositories/read.repository.ts:78` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadRepository.findActiveProducts | `src/modules/insurance/repositories/read.repository.ts:62` |
| `insurance.provider_networks` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadRepository.findActiveNetworks | `src/modules/insurance/repositories/read.repository.ts:110` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/repositories/read.repository.ts:200` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CarrierDirectoryResponseDto>` · DTO `CarrierDirectoryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CarrierSummaryDto>` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:82` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:31` |
| `items[].carrierCode` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:35` |
| `items[].legalName` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:39` |
| `items[].regulatorIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:43` |
| `items[].jurisdiction` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:47` |
| `items[].jurisdiction.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].jurisdiction.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:51` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `items[].verification` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:59` |
| `items[].verification.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `items[].verification.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `items[].productCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:63` |
| `items[].planCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:67` |
| `items[].networkCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:71` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/dto/read.dto.ts:75` |
| `count` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:86` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /insurance-carriers

- **Origen:** CONTRATO
- **Nombre:** Alta de aseguradora (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createCarrier` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:50`

### Qué es y para qué sirve (negocio)

Alta de aseguradora (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-carriers` la atiende `InsuranceBackboneController.createCarrier` (src/modules/insurance/controllers/insurance-backbone.controller.ts:50). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCarrierDto` (4 campos, 3 obligatorios). Delega en `InsuranceBackboneService.createCarrier`. Crea filas en insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createCarrier → InsuranceBackboneService.createCarrier → CatalogRepository.createCarrier | `src/modules/insurance/repositories/catalog.repository.ts:62` |

### Cuerpo — DTO `CreateCarrierDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario | `src/modules/insurance/dto/backbone.dto.ts:19` |
| `carrierCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/dto/backbone.dto.ts:28` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/dto/backbone.dto.ts:37` |
| `regulatorIdentifier` | `string` | No | longitud máxima 80 | `@IsOptional()` `@IsString()` `@MaxLength(80)` | — | `src/modules/insurance/dto/backbone.dto.ts:46` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "carrierCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "carrierCode": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "regulatorIdentifier": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ResourceStatusDto>` · DTO `ResourceStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/insurance/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/insurance/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /insurance-carriers/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar el catálogo y la red de una aseguradora
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceReadController.getCarrier` — `src/modules/insurance/controllers/insurance-read.controller.ts:61`

### Qué es y para qué sirve (negocio)

Consultar el catálogo y la red de una aseguradora. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-carriers/{id}` la atiende `InsuranceReadController.getCarrier` (src/modules/insurance/controllers/insurance-read.controller.ts:61). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.getCarrier`. Lee insurance.insurance_carriers, insurance.insurance_plan_benefits, insurance.insurance_plans, insurance.insurance_products, insurance.network_provider_memberships, insurance.provider_networks, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/controllers/insurance-read.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/insurance-read.controller.ts:61` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findCarrierByTenant | `src/modules/insurance/repositories/read.repository.ts:53` |
| `insurance.insurance_plan_benefits` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActiveBenefits | `src/modules/insurance/repositories/read.repository.ts:94` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActivePlans | `src/modules/insurance/repositories/read.repository.ts:78` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActiveProducts | `src/modules/insurance/repositories/read.repository.ts:62` |
| `insurance.network_provider_memberships` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActiveMemberships | `src/modules/insurance/repositories/read.repository.ts:126` |
| `insurance.provider_networks` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActiveNetworks | `src/modules/insurance/repositories/read.repository.ts:110` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/repositories/read.repository.ts:200` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CarrierDetailDto>` · DTO `CarrierDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:31` |
| `carrierCode` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:35` |
| `legalName` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:39` |
| `regulatorIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:43` |
| `jurisdiction` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:47` |
| `jurisdiction.code` | `string` | Sí | — | — | — | sin fuente |
| `jurisdiction.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:51` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `verification` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:59` |
| `verification.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `verification.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `productCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:63` |
| `planCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:67` |
| `networkCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:71` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/dto/read.dto.ts:75` |
| `products` | `array<ProductDto>` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:262` |
| `products[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:190` |
| `products[].productCode` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:194` |
| `products[].name` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:198` |
| `products[].productType` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:202` |
| `products[].productType.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `products[].productType.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `products[].marketSegment` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:206` |
| `products[].marketSegment.code` | `string` | Sí | — | — | — | sin fuente |
| `products[].marketSegment.display` | `string` | Sí | — | — | — | sin fuente |
| `products[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:210` |
| `products[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `products[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `products[].plans` | `array<PlanDto>` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:214` |
| `products[].plans[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:142` |
| `products[].plans[].planCode` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:146` |
| `products[].plans[].name` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:150` |
| `products[].plans[].planType` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:154` |
| `products[].plans[].planType.code` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].planType.display` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:158` |
| `products[].plans[].currency.code` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].currency.display` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:162` |
| `products[].plans[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:166` |
| `products[].plans[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:170` |
| `products[].plans[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `products[].plans[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `products[].plans[].policyDocumentFileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/dto/read.dto.ts:179` |
| `products[].plans[].benefits` | `array<PlanBenefitDto>` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:183` |
| `products[].plans[].benefits[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:93` |
| `products[].plans[].benefits[].category` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:97` |
| `products[].plans[].benefits[].category.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `products[].plans[].benefits[].category.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `products[].plans[].benefits[].service` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:101` |
| `products[].plans[].benefits[].service.code` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].benefits[].service.display` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].benefits[].coveragePercent` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:111` |
| `products[].plans[].benefits[].copayAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:115` |
| `products[].plans[].benefits[].deductibleAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:119` |
| `products[].plans[].benefits[].annualLimitAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:123` |
| `products[].plans[].benefits[].requiresPriorAuthorization` | `boolean` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:127` |
| `products[].plans[].benefits[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:131` |
| `products[].plans[].benefits[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:135` |
| `networks` | `array<ProviderNetworkDto>` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:266` |
| `networks[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:221` |
| `networks[].networkCode` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:225` |
| `networks[].name` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:229` |
| `networks[].networkType` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:233` |
| `networks[].networkType.code` | `string` | Sí | — | — | — | sin fuente |
| `networks[].networkType.display` | `string` | Sí | — | — | — | sin fuente |
| `networks[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:237` |
| `networks[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `networks[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `networks[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:241` |
| `networks[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:245` |
| `networks[].memberCount` | `number` | Sí | — | — | — | `src/modules/insurance/dto/read.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /insurance-carriers/{id}/products

- **Origen:** CONTRATO
- **Nombre:** Alta de producto de aseguradora (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createProduct` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:69`

### Qué es y para qué sirve (negocio)

Alta de producto de aseguradora (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-carriers/{id}/products` la atiende `InsuranceBackboneController.createProduct` (src/modules/insurance/controllers/insurance-backbone.controller.ts:69). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `InsuranceCreateProductDto` (2 campos, 2 obligatorios). Delega en `InsuranceBackboneService.createProduct`. Crea filas en insurance.insurance_products. Lee insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/insurance-backbone.controller.ts:69` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createProduct → InsuranceBackboneService.createProduct → CatalogRepository.findCarrier | `src/modules/insurance/repositories/catalog.repository.ts:36` |
| `insurance.insurance_products` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createProduct → InsuranceBackboneService.createProduct → CatalogRepository.createProduct | `src/modules/insurance/repositories/catalog.repository.ts:93` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `InsuranceCreateProductDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `productCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/dto/backbone.dto.ts:59` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/dto/backbone.dto.ts:68` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "productCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "productCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /insurance-claims

- **Origen:** CONTRATO
- **Nombre:** Enviar reclamo con líneas (837)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.submit` — `src/modules/insurance/controllers/claims.controller.ts:40`

### Qué es y para qué sirve (negocio)

Enviar reclamo con líneas (837). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims` la atiende `ClaimsController.submit` (src/modules/insurance/controllers/claims.controller.ts:40). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateClaimDto` (12 campos, 7 obligatorios). Delega en `ClaimsService.submitClaim`. Crea filas en insurance.insurance_claim_lines, insurance.insurance_claims. Lee insurance.insurance_carriers, insurance.insurance_claims, insurance.patient_coverages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/claims.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → CatalogRepository.findCarrier | `src/modules/insurance/repositories/catalog.repository.ts:36` |
| `insurance.insurance_claim_lines` | ESCRIBE | CREA | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimRepository.createLine | `src/modules/insurance/repositories/claim.repository.ts:84` |
| `insurance.insurance_claims` | ESCRIBE | CREA | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimRepository.createClaim | `src/modules/insurance/repositories/claim.repository.ts:56` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimRepository.findByIdempotency | `src/modules/insurance/repositories/claim.repository.ts:43` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → CoverageRepository.findCoverage | `src/modules/insurance/repositories/coverage.repository.ts:32` |

### Cuerpo — DTO `CreateClaimDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/claims.dto.ts:72` |
| `patientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/claims.dto.ts:79` |
| `billingProviderEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad facturadora | `src/modules/insurance/dto/claims.dto.ts:86` |
| `claimIdentifier` | `string` | Sí | longitud máxima 80 | `@IsString()` `@MaxLength(80)` | — | `src/modules/insurance/dto/claims.dto.ts:94` |
| `priorAuthorizationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Autorización previa vinculada | `src/modules/insurance/dto/claims.dto.ts:105` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/dto/claims.dto.ts:114` |
| `lines` | `array<ClaimLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ClaimLineDto)` | 1..N líneas | `src/modules/insurance/dto/claims.dto.ts:124` |
| `lines[].lineSequence` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Secuencia única dentro del reclamo | `src/modules/insurance/dto/claims.dto.ts:28` |
| `lines[].serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/dto/claims.dto.ts:36` |
| `lines[].quantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/dto/claims.dto.ts:44` |
| `lines[].billedAmount` | `string` | Sí | — | `@IsNumberString()` | Monto facturado | `src/modules/insurance/dto/claims.dto.ts:51` |
| `lines[].patientResponsibilityAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Responsabilidad del paciente | `src/modules/insurance/dto/claims.dto.ts:62` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceStatusDto>` · DTO `ResourceStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/insurance/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/insurance/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada; ResourceNotFoundException: Cobertura no encontrada |
| 409 | `CONFLICT` | ConflictException: Reclamo duplicado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /insurance-claims/{id}/adjudications

- **Origen:** CONTRATO
- **Nombre:** Adjudicar reclamo por línea (835)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.adjudicate` — `src/modules/insurance/controllers/claims.controller.ts:51`

### Qué es y para qué sirve (negocio)

Adjudicar reclamo por línea (835). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/adjudications` la atiende `ClaimsController.adjudicate` (src/modules/insurance/controllers/claims.controller.ts:51). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateAdjudicationDto` (10 campos, 4 obligatorios). Delega en `ClaimsService.adjudicate`. Crea filas en insurance.claim_adjudication_versions, insurance.claim_line_adjudications. Actualiza insurance.insurance_claims. Lee insurance.claim_adjudication_versions, insurance.insurance_claim_lines, insurance.insurance_claims.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/claims.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/claims.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_adjudication_versions` | ESCRIBE | CREA | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimRepository.createVersion | `src/modules/insurance/repositories/claim.repository.ts:126` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimRepository.latestVersion | `src/modules/insurance/repositories/claim.repository.ts:109` |
| `insurance.claim_line_adjudications` | ESCRIBE | CREA | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimRepository.createLineAdjudication | `src/modules/insurance/repositories/claim.repository.ts:147` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimRepository.findLine | `src/modules/insurance/repositories/claim.repository.ts:71` |
| `insurance.insurance_claims` | ESCRIBE | ACTUALIZA | POR_TIPO | ClaimsController.adjudicate → ClaimsService.adjudicate | `src/modules/insurance/services/claims.service.ts:200` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimRepository.findClaim | `src/modules/insurance/repositories/claim.repository.ts:30` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAdjudicationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: APPROVED, DENIED | `@IsIn(['APPROVED', 'DENIED'])` | — | `src/modules/insurance/dto/claims.dto.ts:175` |
| `totalApprovedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/dto/claims.dto.ts:183` |
| `totalPatientAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/dto/claims.dto.ts:191` |
| `totalDeniedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/dto/claims.dto.ts:199` |
| `lineAdjudications` | `array<LineAdjudicationDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => LineAdjudicationDto)` | Una por línea del reclamo | `src/modules/insurance/dto/claims.dto.ts:212` |
| `lineAdjudications[].insuranceClaimLineId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea del reclamo adjudicada | `src/modules/insurance/dto/claims.dto.ts:134` |
| `lineAdjudications[].decision` | `string` | Sí | valores: APPROVED, DENIED | `@IsIn(['APPROVED', 'DENIED'])` | — | `src/modules/insurance/dto/claims.dto.ts:141` |
| `lineAdjudications[].approvedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/dto/claims.dto.ts:149` |
| `lineAdjudications[].patientAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/dto/claims.dto.ts:157` |
| `lineAdjudications[].deniedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/dto/claims.dto.ts:165` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reclamo no encontrado; ResourceNotFoundException: Línea de reclamo no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El reclamo no está en estado adjudicable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /insurance-claims/{id}/disputes

- **Origen:** CONTRATO
- **Nombre:** Abrir disputa sobre adjudicación
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.openDispute` — `src/modules/insurance/controllers/claims.controller.ts:87`

### Qué es y para qué sirve (negocio)

Abrir disputa sobre adjudicación. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/disputes` la atiende `ClaimsController.openDispute` (src/modules/insurance/controllers/claims.controller.ts:87). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateDisputeDto` (4 campos, 1 obligatorio). Delega en `ClaimsService.openDispute`. Crea filas en insurance.claim_disputes. Lee insurance.insurance_claims.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/claims.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/claims.controller.ts:87` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_disputes` | ESCRIBE | CREA | DIRECTA | ClaimsController.openDispute → ClaimsService.openDispute → ClaimRepository.createDispute | `src/modules/insurance/repositories/claim.repository.ts:228` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.openDispute → ClaimsService.openDispute → ClaimRepository.findClaim | `src/modules/insurance/repositories/claim.repository.ts:30` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDisputeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `claimAdjudicationVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión de adjudicación disputada | `src/modules/insurance/dto/claims.dto.ts:270` |
| `initiatedBy` | `string` | Sí | valores: PROVIDER, PATIENT | `@IsIn(['PROVIDER', 'PATIENT'])` | Parte que inicia | `src/modules/insurance/dto/claims.dto.ts:280` |
| `initiatedByEntityId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/dto/claims.dto.ts:288` |
| `filingDeadline` | `string` | No | formato date | `@IsOptional()` `@IsString()` | Fecha límite de presentación | `src/modules/insurance/dto/claims.dto.ts:300` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "initiatedBy": "PROVIDER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "claimAdjudicationVersionId": "00000000-0000-4000-8000-000000000001",
  "initiatedBy": "PROVIDER",
  "initiatedByEntityId": "00000000-0000-4000-8000-000000000001",
  "filingDeadline": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<ResourceStatusDto>` · DTO `ResourceStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/insurance/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/insurance/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reclamo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /insurance-claims/{id}/eob

- **Origen:** CONTRATO
- **Nombre:** Publicar Explicación de Beneficios (EOB)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.publishEob` — `src/modules/insurance/controllers/claims.controller.ts:63`

### Qué es y para qué sirve (negocio)

Publicar Explicación de Beneficios (EOB). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/eob` la atiende `ClaimsController.publishEob` (src/modules/insurance/controllers/claims.controller.ts:63). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `PublishEobDto` (1 campo, 0 obligatorios). Delega en `ClaimsService.publishEob`. Crea filas en insurance.patient_explanations_of_benefit. Lee insurance.claim_adjudication_versions, insurance.insurance_claims, insurance.patient_coverages, insurance.patient_explanations_of_benefit.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/claims.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/claims.controller.ts:63` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimRepository.latestVersion | `src/modules/insurance/repositories/claim.repository.ts:109` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimRepository.findClaim | `src/modules/insurance/repositories/claim.repository.ts:30` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → CoverageRepository.findCoverage | `src/modules/insurance/repositories/coverage.repository.ts:32` |
| `insurance.patient_explanations_of_benefit` | ESCRIBE | CREA | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimRepository.createEob | `src/modules/insurance/repositories/claim.repository.ts:183` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimRepository.findEob | `src/modules/insurance/repositories/claim.repository.ts:167` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishEobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `documentRecordId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento generado (object storage) | `src/modules/insurance/dto/claims.dto.ts:226` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "documentRecordId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reclamo no encontrado |
| 409 | `CONFLICT` | ConflictException: La EOB ya fue publicada para esta versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No existe adjudicación in_force para publicar EOB |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /insurance-claims/{id}/reversals

- **Origen:** CONTRATO
- **Nombre:** Registrar reversión de reclamo
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.reverse` — `src/modules/insurance/controllers/claims.controller.ts:75`

### Qué es y para qué sirve (negocio)

Registrar reversión de reclamo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/reversals` la atiende `ClaimsController.reverse` (src/modules/insurance/controllers/claims.controller.ts:75). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateReversalDto` (3 campos, 1 obligatorio). Delega en `ClaimsService.reverse`. Crea filas en insurance.claim_reversals. Actualiza insurance.insurance_claims. Lee insurance.claim_adjudication_versions, insurance.insurance_claims.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/claims.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/claims.controller.ts:75` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimRepository.findVersion | `src/modules/insurance/repositories/claim.repository.ts:102` |
| `insurance.claim_reversals` | ESCRIBE | CREA | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimRepository.createReversal | `src/modules/insurance/repositories/claim.repository.ts:205` |
| `insurance.insurance_claims` | ESCRIBE | ACTUALIZA | POR_TIPO | ClaimsController.reverse → ClaimsService.reverse | `src/modules/insurance/services/claims.service.ts:303` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimRepository.findClaim | `src/modules/insurance/repositories/claim.repository.ts:30` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateReversalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reversedAdjudicationVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión de adjudicación a revertir | `src/modules/insurance/dto/claims.dto.ts:239` |
| `reversalAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/dto/claims.dto.ts:247` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/dto/claims.dto.ts:256` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reversedAdjudicationVersionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reversedAdjudicationVersionId": "00000000-0000-4000-8000-000000000001",
  "reversalAmount": "80.00",
  "idempotencyKey": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reclamo no encontrado; ResourceNotFoundException: Versión de adjudicación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El reclamo no está en estado reversible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /insurance-plans/{id}/benefits

- **Origen:** CONTRATO
- **Nombre:** Alta de beneficio de plan (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createBenefit` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:109`

### Qué es y para qué sirve (negocio)

Alta de beneficio de plan (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-plans/{id}/benefits` la atiende `InsuranceBackboneController.createBenefit` (src/modules/insurance/controllers/insurance-backbone.controller.ts:109). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePlanBenefitDto` (3 campos, 0 obligatorios). Delega en `InsuranceBackboneService.createBenefit`. Crea filas en insurance.insurance_plan_benefits. Lee insurance.insurance_plans.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/insurance-backbone.controller.ts:109` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_plan_benefits` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createBenefit → InsuranceBackboneService.createBenefit → CatalogRepository.createBenefit | `src/modules/insurance/repositories/catalog.repository.ts:136` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceBackboneController.createBenefit → InsuranceBackboneService.createBenefit → CatalogRepository.findPlan | `src/modules/insurance/repositories/catalog.repository.ts:108` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePlanBenefitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/backbone.dto.ts:112` |
| `requiresPriorAuthorization` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere autorización previa | `src/modules/insurance/dto/backbone.dto.ts:120` |
| `coveragePercent` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Porcentaje de cobertura | `src/modules/insurance/dto/backbone.dto.ts:131` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "effectiveFrom": "2026-07-31",
  "requiresPriorAuthorization": true,
  "coveragePercent": "80"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /insurance-products/{id}/plans

- **Origen:** CONTRATO
- **Nombre:** Alta de plan (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createPlan` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:89`

### Qué es y para qué sirve (negocio)

Alta de plan (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-products/{id}/plans` la atiende `InsuranceBackboneController.createPlan` (src/modules/insurance/controllers/insurance-backbone.controller.ts:89). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePlanDto` (3 campos, 2 obligatorios). Delega en `InsuranceBackboneService.createPlan`. Crea filas en insurance.insurance_plans. Lee insurance.insurance_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/insurance-backbone.controller.ts:89` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_plans` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createPlan → InsuranceBackboneService.createPlan → CatalogRepository.createPlan | `src/modules/insurance/repositories/catalog.repository.ts:118` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceBackboneController.createPlan → InsuranceBackboneService.createPlan → CatalogRepository.findProduct | `src/modules/insurance/repositories/catalog.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `planCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/dto/backbone.dto.ts:80` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/dto/backbone.dto.ts:89` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | Vigencia desde (ISO date) | `src/modules/insurance/dto/backbone.dto.ts:101` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "planCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "planCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "effectiveFrom": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Producto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /patient-coverages

- **Origen:** CONTRATO
- **Nombre:** Registrar cobertura de paciente y dependientes
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CoverageController.enroll` — `src/modules/insurance/controllers/coverage.controller.ts:30`

### Qué es y para qué sirve (negocio)

Registrar cobertura de paciente y dependientes. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /patient-coverages` la atiende `CoverageController.enroll` (src/modules/insurance/controllers/coverage.controller.ts:30). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateCoverageDto` (9 campos, 3 obligatorios). Delega en `CoverageService.enrollCoverage`. Crea filas en insurance.broker_clients, insurance.coverage_dependents, insurance.patient_coverages. Lee insurance.insurance_plans, insurance.patient_coverages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/coverage.controller.ts:30` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_clients` | ESCRIBE | CREA | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CoverageRepository.createBrokerClient | `src/modules/insurance/repositories/coverage.repository.ts:114` |
| `insurance.coverage_dependents` | ESCRIBE | CREA | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CoverageRepository.createDependent | `src/modules/insurance/repositories/coverage.repository.ts:96` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CatalogRepository.findPlan | `src/modules/insurance/repositories/catalog.repository.ts:108` |
| `insurance.patient_coverages` | ESCRIBE | CREA | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CoverageRepository.createCoverage | `src/modules/insurance/repositories/coverage.repository.ts:78` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CoverageRepository.findByMemberAndPlan | `src/modules/insurance/repositories/coverage.repository.ts:48` |

### Cuerpo — DTO `CreateCoverageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insurancePlanId` | `string` | Sí | formato uuid | `@IsUUID()` | Plan de seguro afiliado | `src/modules/insurance/dto/coverage.dto.ts:41` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del paciente/afiliado | `src/modules/insurance/dto/coverage.dto.ts:48` |
| `memberIdentifier` | `string` | Sí | longitud mínima 1; longitud máxima 80 | `@IsString()` `@MinLength(1)` `@MaxLength(80)` | Identificador de afiliado (member id) | `src/modules/insurance/dto/coverage.dto.ts:60` |
| `policyIdentifier` | `string` | No | longitud máxima 80 | `@IsOptional()` `@IsString()` `@MaxLength(80)` | — | `src/modules/insurance/dto/coverage.dto.ts:69` |
| `coverageOrder` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Orden de coordinación (1=primaria) | `src/modules/insurance/dto/coverage.dto.ts:78` |
| `insuranceBrokerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Broker que intermedia (vincula broker_clients) | `src/modules/insurance/dto/coverage.dto.ts:89` |
| `dependents` | `array<CoverageDependentDto>` | No | máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => CoverageDependentDto)` | — | `src/modules/insurance/dto/coverage.dto.ts:100` |
| `dependents[].dependentPatientProfileId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/coverage.dto.ts:23` |
| `dependents[].relationship` | `string` | No | valores: SPOUSE, CHILD | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/coverage.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "insurancePlanId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "memberIdentifier": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceStatusDto>` · DTO `ResourceStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/insurance/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/insurance/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan no encontrado |
| 409 | `CONFLICT` | ConflictException: El afiliado ya tiene cobertura en ese plan |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El plan no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:CoverageController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /prior-authorization-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar autorización previa con items
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PriorAuthController.submit` — `src/modules/insurance/controllers/prior-auth.controller.ts:37`

### Qué es y para qué sirve (negocio)

Solicitar autorización previa con items. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /prior-authorization-requests` la atiende `PriorAuthController.submit` (src/modules/insurance/controllers/prior-auth.controller.ts:37). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreatePriorAuthRequestDto` (7 campos, 3 obligatorios). Delega en `PriorAuthService.submitRequest`. Crea filas en insurance.prior_authorization_items, insurance.prior_authorization_requests. Lee insurance.patient_coverages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/prior-auth.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → CoverageRepository.findCoverage | `src/modules/insurance/repositories/coverage.repository.ts:32` |
| `insurance.prior_authorization_items` | ESCRIBE | CREA | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → PriorAuthRepository.createItem | `src/modules/insurance/repositories/prior-auth.repository.ts:59` |
| `insurance.prior_authorization_requests` | ESCRIBE | CREA | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → PriorAuthRepository.createRequest | `src/modules/insurance/repositories/prior-auth.repository.ts:41` |

### Cuerpo — DTO `CreatePriorAuthRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/prior-auth.dto.ts:49` |
| `requestingProviderEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad prestadora solicitante | `src/modules/insurance/dto/prior-auth.dto.ts:59` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/dto/prior-auth.dto.ts:68` |
| `items` | `array<PriorAuthItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PriorAuthItemDto)` | 1..N ítems solicitados | `src/modules/insurance/dto/prior-auth.dto.ts:81` |
| `items[].serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio solicitado | `src/modules/insurance/dto/prior-auth.dto.ts:23` |
| `items[].requestedQuantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Cantidad solicitada | `src/modules/insurance/dto/prior-auth.dto.ts:31` |
| `items[].requestedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto solicitado | `src/modules/insurance/dto/prior-auth.dto.ts:39` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientCoverageId": "00000000-0000-4000-8000-000000000001",
  "requestingProviderEntityId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {}
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceStatusDto>` · DTO `ResourceStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/insurance/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/insurance/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cobertura no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:PriorAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /prior-authorization-requests/{id}/determinations

- **Origen:** CONTRATO
- **Nombre:** Emitir determinación de autorización previa
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PriorAuthController.determine` — `src/modules/insurance/controllers/prior-auth.controller.ts:48`

### Qué es y para qué sirve (negocio)

Emitir determinación de autorización previa. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /prior-authorization-requests/{id}/determinations` la atiende `PriorAuthController.determine` (src/modules/insurance/controllers/prior-auth.controller.ts:48). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateDeterminationDto` (5 campos, 1 obligatorio). Delega en `PriorAuthService.issueDetermination`. Crea filas en insurance.prior_authorization_determinations. Actualiza insurance.prior_authorization_requests. Lee insurance.prior_authorization_determinations, insurance.prior_authorization_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/controllers/prior-auth.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/prior-auth.controller.ts:48` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.prior_authorization_determinations` | ESCRIBE | CREA | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → PriorAuthRepository.createDetermination | `src/modules/insurance/repositories/prior-auth.repository.ts:90` |
| `insurance.prior_authorization_determinations` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → PriorAuthRepository.maxDeterminationVersion | `src/modules/insurance/repositories/prior-auth.repository.ts:71` |
| `insurance.prior_authorization_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | PriorAuthController.determine → PriorAuthService.issueDetermination | `src/modules/insurance/services/prior-auth.service.ts:147` |
| `insurance.prior_authorization_requests` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → PriorAuthRepository.findRequest | `src/modules/insurance/repositories/prior-auth.repository.ts:27` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDeterminationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, DENIED, PARTIAL | `@IsIn(['APPROVED', 'DENIED', 'PARTIAL'])` | — | `src/modules/insurance/dto/prior-auth.dto.ts:91` |
| `approvedQuantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Cantidad aprobada | `src/modules/insurance/dto/prior-auth.dto.ts:99` |
| `approvedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto aprobado | `src/modules/insurance/dto/prior-auth.dto.ts:107` |
| `validFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/prior-auth.dto.ts:115` |
| `validTo` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/prior-auth.dto.ts:123` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "APPROVED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "approvedQuantity": "valor-ejemplo",
  "approvedAmount": "valor-ejemplo",
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de autorización no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no admite determinación en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:PriorAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /provider-networks

- **Origen:** CONTRATO
- **Nombre:** Alta de red de prestadores (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createProviderNetwork` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:128`

### Qué es y para qué sirve (negocio)

Alta de red de prestadores (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /provider-networks` la atiende `InsuranceBackboneController.createProviderNetwork` (src/modules/insurance/controllers/insurance-backbone.controller.ts:128). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateProviderNetworkDto` (5 campos, 3 obligatorios). Delega en `InsuranceBackboneService.createProviderNetwork`. Crea filas en insurance.provider_networks. Lee insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:128` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createProviderNetwork → InsuranceBackboneService.createProviderNetwork → CatalogRepository.findCarrier | `src/modules/insurance/repositories/catalog.repository.ts:36` |
| `insurance.provider_networks` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createProviderNetwork → InsuranceBackboneService.createProviderNetwork → CatalogRepository.createProviderNetwork | `src/modules/insurance/repositories/catalog.repository.ts:167` |

### Cuerpo — DTO `CreateProviderNetworkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | Aseguradora dueña de la red | `src/modules/insurance/dto/backbone.dto.ts:141` |
| `networkCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/dto/backbone.dto.ts:150` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/dto/backbone.dto.ts:159` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/backbone.dto.ts:167` |
| `effectiveTo` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/dto/backbone.dto.ts:175` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "networkCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "networkCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "effectiveFrom": "2026-07-31",
  "effectiveTo": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /provider-networks/{id}/memberships

- **Origen:** CONTRATO
- **Nombre:** Alta de membresía de prestador en la red
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.addMembership` — `src/modules/insurance/controllers/insurance-backbone.controller.ts:140`

### Qué es y para qué sirve (negocio)

Alta de membresía de prestador en la red. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /provider-networks/{id}/memberships` la atiende `InsuranceBackboneController.addMembership` (src/modules/insurance/controllers/insurance-backbone.controller.ts:140). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `InsuranceCreateMembershipDto` (3 campos, 1 obligatorio). Delega en `InsuranceBackboneService.addMembership`. Crea filas en insurance.network_provider_memberships. Lee insurance.provider_networks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/insurance-backbone.controller.ts:140` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/insurance-backbone.controller.ts:140` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.network_provider_memberships` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.addMembership → InsuranceBackboneService.addMembership → CatalogRepository.createMembership | `src/modules/insurance/repositories/catalog.repository.ts:185` |
| `insurance.provider_networks` | LEE | LEE | DIRECTA | InsuranceBackboneController.addMembership → InsuranceBackboneService.addMembership → CatalogRepository.findProviderNetwork | `src/modules/insurance/repositories/catalog.repository.ts:154` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `InsuranceCreateMembershipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad prestadora (práctica/hospital/etc.) | `src/modules/insurance/dto/backbone.dto.ts:289` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia a práctica si aplica | `src/modules/insurance/dto/backbone.dto.ts:300` |
| `contractReference` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/dto/backbone.dto.ts:309` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "providerEntityId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "contractReference": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ResourceStatusDto>` · DTO `ResourceStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/insurance/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/insurance/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Red de prestadores no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La red no está activa; PreconditionFailedException: La red está fuera de vigencia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /reconciliation-batches

- **Origen:** CONTRATO
- **Nombre:** Abrir lote de conciliación
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReconciliationController.createBatch` — `src/modules/insurance/controllers/reconciliation.controller.ts:36`

### Qué es y para qué sirve (negocio)

Abrir lote de conciliación. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /reconciliation-batches` la atiende `ReconciliationController.createBatch` (src/modules/insurance/controllers/reconciliation.controller.ts:36). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateReconciliationBatchDto` (4 campos, 4 obligatorios). Delega en `ReconciliationService.createBatch`. Crea filas en insurance.insurance_reconciliation_batches. Lee insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/reconciliation.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ReconciliationController.createBatch → ReconciliationService.createBatch → CatalogRepository.findCarrier | `src/modules/insurance/repositories/catalog.repository.ts:36` |
| `insurance.insurance_reconciliation_batches` | ESCRIBE | CREA | DIRECTA | ReconciliationController.createBatch → ReconciliationService.createBatch → SettlementRepository.createBatch | `src/modules/insurance/repositories/settlement.repository.ts:40` |

### Cuerpo — DTO `CreateReconciliationBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/reconciliation.dto.ts:11` |
| `providerEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad prestadora conciliada | `src/modules/insurance/dto/reconciliation.dto.ts:18` |
| `periodStart` | `string` | Sí | formato date | `@IsString()` | — | `src/modules/insurance/dto/reconciliation.dto.ts:25` |
| `periodEnd` | `string` | Sí | formato date | `@IsString()` | — | `src/modules/insurance/dto/reconciliation.dto.ts:32` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31",
  "periodEnd": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<ResourceStatusDto>` · DTO `ResourceStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/insurance/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/insurance/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ReconciliationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /reconciliation-batches/{id}/items

- **Origen:** CONTRATO
- **Nombre:** Agregar ítem de conciliación al lote
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReconciliationController.addItem` — `src/modules/insurance/controllers/reconciliation.controller.ts:48`

### Qué es y para qué sirve (negocio)

Agregar ítem de conciliación al lote. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /reconciliation-batches/{id}/items` la atiende `ReconciliationController.addItem` (src/modules/insurance/controllers/reconciliation.controller.ts:48). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateReconciliationItemDto` (4 campos, 2 obligatorios). Delega en `ReconciliationService.addItem`. Crea filas en insurance.insurance_reconciliation_items. Lee insurance.claim_adjudication_versions, insurance.insurance_claims, insurance.insurance_reconciliation_batches.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/controllers/reconciliation.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/controllers/reconciliation.controller.ts:48` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → ClaimRepository.findVersion | `src/modules/insurance/repositories/claim.repository.ts:102` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → ClaimRepository.findClaim | `src/modules/insurance/repositories/claim.repository.ts:30` |
| `insurance.insurance_reconciliation_batches` | LEE | LEE | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → SettlementRepository.findBatch | `src/modules/insurance/repositories/settlement.repository.ts:27` |
| `insurance.insurance_reconciliation_items` | ESCRIBE | CREA | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → SettlementRepository.createItem | `src/modules/insurance/repositories/settlement.repository.ts:57` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateReconciliationItemDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceClaimId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/dto/reconciliation.dto.ts:42` |
| `claimAdjudicationVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión exacta de adjudicación liquidada | `src/modules/insurance/dto/reconciliation.dto.ts:52` |
| `expectedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto esperado | `src/modules/insurance/dto/reconciliation.dto.ts:60` |
| `acceptedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto aceptado | `src/modules/insurance/dto/reconciliation.dto.ts:68` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "insuranceClaimId": "00000000-0000-4000-8000-000000000001",
  "claimAdjudicationVersionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "insuranceClaimId": "00000000-0000-4000-8000-000000000001",
  "claimAdjudicationVersionId": "00000000-0000-4000-8000-000000000001",
  "expectedAmount": "80.00",
  "acceptedAmount": "80.00"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lote de conciliación no encontrado; ResourceNotFoundException: Reclamo no encontrado; ResourceNotFoundException: Versión de adjudicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ReconciliationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

