<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `insurance`

- **Bloque:** Financiero y ERP (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)
- **Operaciones:** 72 (72 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 27 · MEDIO 22 · BAJO 23
- **Tablas distintas que tocan:** 92
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
| 11 | GET | `/insurance-campaigns` | Listar las campañas de la aseguradora activa | ALTO | 8 | sesión (sin roles) |
| 12 | POST | `/insurance-campaigns` | Crear una campaña preventiva de la aseguradora | ALTO | 14 | sesión (sin roles) |
| 13 | GET | `/insurance-campaigns/{id}` | Consultar una campaña de la aseguradora activa | ALTO | 8 | sesión (sin roles) |
| 14 | PATCH | `/insurance-campaigns/{id}` | Editar una campaña en borrador o pausada (422 si está activa o vencida) | ALTO | 15 | sesión (sin roles) |
| 15 | PATCH | `/insurance-campaigns/{id}/status` | Activar, pausar o finalizar una campaña (transiciones cerradas) | ALTO | 9 | sesión (sin roles) |
| 16 | GET | `/insurance-campaigns/active` | Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`) | BAJO | 4 | pública |
| 17 | GET | `/insurance-campaigns/my-benefits` | Campañas vigentes de mi aseguradora, para el afiliado autenticado | ALTO | 12 | sesión (sin roles) |
| 18 | GET | `/insurance-campaigns/patient/{patientProfileId}` | Campañas vigentes de la aseguradora del afiliado (sólo el titular) | ALTO | 12 | sesión (sin roles) |
| 19 | GET | `/insurance-carrier-catalog` | Catálogo público de aseguradoras y sus planes de salud | BAJO | 7 | pública |
| 20 | GET | `/insurance-carriers` | Listar las aseguradoras del tenant activo | BAJO | 6 | sesión (sin roles) |
| 21 | POST | `/insurance-carriers` | Alta de aseguradora (soporte) | MEDIO | 1 | SECURITY_ADMIN |
| 22 | GET | `/insurance-carriers/{id}` | Consultar el catálogo y la red de una aseguradora | BAJO | 8 | sesión (sin roles) |
| 23 | PUT | `/insurance-carriers/{id}/contact-channels` | Configurar los canales de contacto de la aseguradora del tenant activo | ALTO | 3 | sesión (sin roles) |
| 24 | POST | `/insurance-carriers/{id}/products` | Alta de producto de aseguradora (soporte) | MEDIO | 2 | SECURITY_ADMIN |
| 25 | GET | `/insurance-claims` | Listar las solicitudes de seguro presentadas (cursor) | BAJO | 11 | BILLING_OPERATOR, SECURITY_ADMIN |
| 26 | POST | `/insurance-claims` | Enviar reclamo con líneas (837) | MEDIO | 22 | BILLING, FINANCE |
| 27 | GET | `/insurance-claims/{id}` | Consultar una solicitud de seguro con sus ítems y su dictamen | BAJO | 20 | BILLING_OPERATOR, SECURITY_ADMIN |
| 28 | POST | `/insurance-claims/{id}/adjudications` | Adjudicar reclamo por línea (835) | MEDIO | 19 | BILLING, FINANCE |
| 29 | POST | `/insurance-claims/{id}/disputes` | Abrir disputa sobre adjudicación | MEDIO | 10 | BILLING, FINANCE, BILLING_OPERATOR, SECURITY_ADMIN, PATIENT |
| 30 | POST | `/insurance-claims/{id}/eob` | Publicar Explicación de Beneficios (EOB) | MEDIO | 21 | BILLING, FINANCE |
| 31 | POST | `/insurance-claims/{id}/patient-invoice` | Facturar al paciente su parte de un servicio reclamado | MEDIO | 25 | BILLING, FINANCE |
| 32 | POST | `/insurance-claims/{id}/reversals` | Registrar reversión de reclamo | MEDIO | 15 | BILLING, FINANCE |
| 33 | POST | `/insurance-claims/quote` | Cotizar un cobro a la aseguradora (sin guardar) | BAJO | 10 | BILLING, FINANCE |
| 34 | POST | `/insurance-plans/{planId}/benefits` | Crear una cobertura de un plan administrable | ALTO | 5 | sesión (sin roles) |
| 35 | PUT | `/insurance-plans/{planId}/benefits/{benefitId}` | Editar importes de una cobertura | ALTO | 6 | sesión (sin roles) |
| 36 | PUT | `/insurance-plans/{planId}/benefits/{benefitId}/rules` | Editar reglas de aprobación de una cobertura | ALTO | 6 | sesión (sin roles) |
| 37 | PUT | `/insurance-plans/{planId}/premium` | Declarar la prima de lista mensual de un plan administrable | ALTO | 5 | sesión (sin roles) |
| 38 | POST | `/insurance-products/{productId}/plans` | Crear un plan del carrier del tenant activo | ALTO | 4 | sesión (sin roles) |
| 39 | GET | `/insurance/analytics/loss-ratio` | Tablero de siniestralidad, gasto per cápita y epidemiología de la aseguradora del tenant activo | BAJO | 19 | sesión (sin roles) |
| 40 | GET | `/insurance/campaigns` | Listar las campañas de la aseguradora activa | ALTO | 8 | sesión (sin roles) |
| 41 | POST | `/insurance/campaigns` | Crear una campaña preventiva de la aseguradora | ALTO | 14 | sesión (sin roles) |
| 42 | GET | `/insurance/campaigns/{id}` | Consultar una campaña de la aseguradora activa | ALTO | 8 | sesión (sin roles) |
| 43 | PATCH | `/insurance/campaigns/{id}` | Editar una campaña en borrador o pausada (422 si está activa o vencida) | ALTO | 15 | sesión (sin roles) |
| 44 | PATCH | `/insurance/campaigns/{id}/status` | Activar, pausar o finalizar una campaña (transiciones cerradas) | ALTO | 9 | sesión (sin roles) |
| 45 | GET | `/insurance/campaigns/active` | Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`) | BAJO | 4 | pública |
| 46 | GET | `/insurance/campaigns/my-benefits` | Campañas vigentes de mi aseguradora, para el afiliado autenticado | ALTO | 12 | sesión (sin roles) |
| 47 | GET | `/insurance/campaigns/patient/{patientProfileId}` | Campañas vigentes de la aseguradora del afiliado (sólo el titular) | ALTO | 12 | sesión (sin roles) |
| 48 | GET | `/insurance/my-claims` | Solicitudes de seguro propias, con su dictamen vigente | BAJO | 19 | sesión (sin roles) |
| 49 | POST | `/insurance/patients/conversation` | Abrir o reutilizar la conversación interna con un paciente autorizado | ALTO | 16 | sesión (sin roles) |
| 50 | GET | `/insurance/patients/options` | Aseguradoras disponibles en el alcance autorizado | BAJO | 2 | sesión (sin roles) |
| 51 | POST | `/insurance/patients/search` | Consultar directorio de pacientes autorizado | ALTO | 13 | sesión (sin roles) |
| 52 | GET | `/insurance/portability/certificates/{certificateId}/json` | Descargar el certificado de portabilidad en JSON interoperable | ALTO | 9 | sesión (sin roles) |
| 53 | GET | `/insurance/portability/certificates/{certificateId}/pdf` | Descargar el certificado de portabilidad en PDF | ALTO | 9 | sesión (sin roles) |
| 54 | POST | `/insurance/portability/export` | Exportar el historial de póliza y siniestralidad del titular a 1 clic | ALTO | 37 | sesión (sin roles) |
| 55 | GET | `/insurance/received-claims` | Solicitudes de seguro recibidas por la aseguradora activa | BAJO | 15 | sesión (sin roles) |
| 56 | POST | `/insurance/received-claims/{id}/decision` | Dictaminar una solicitud recibida (definitivo) | ALTO | 28 | sesión (sin roles) |
| 57 | POST | `/patient-coverages` | Registrar cobertura de paciente y dependientes | MEDIO | 5 | BILLING, FINANCE |
| 58 | GET | `/patient-coverages/by-patient/{patientProfileId}` | Seguros de una persona, para quien cobra | BAJO | 6 | BILLING, FINANCE |
| 59 | GET | `/patient-coverages/me` | Mi cobertura | BAJO | 3 | BILLING, FINANCE, PATIENT |
| 60 | GET | `/practitioner-settlement-batches` | Listar los lotes de liquidación del alcance del actor | BAJO | 10 | sesión (sin roles) |
| 61 | POST | `/practitioner-settlement-batches` | Generar (o repetir) el lote de liquidación del período | ALTO | 13 | sesión (sin roles) |
| 62 | GET | `/practitioner-settlement-batches/{id}` | Consultar un lote de liquidación | BAJO | 11 | sesión (sin roles) |
| 63 | GET | `/practitioners/{profileId}/insurance-networks` | Aseguradoras con las que trabaja el profesional | BAJO | 4 | SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT |
| 64 | POST | `/prior-authorization-requests` | Solicitar autorización previa con items | MEDIO | 14 | BILLING, FINANCE |
| 65 | GET | `/prior-authorization-requests/{id}` | Detalle de una solicitud de aprobación (aseguradora) | BAJO | 13 | BILLING, FINANCE |
| 66 | POST | `/prior-authorization-requests/{id}/determinations` | Emitir determinación de autorización previa | MEDIO | 18 | BILLING, FINANCE |
| 67 | GET | `/prior-authorization-requests/inbox` | Bandeja de solicitudes de aprobación (aseguradora) | BAJO | 13 | BILLING, FINANCE |
| 68 | POST | `/provider-networks` | Alta de red de prestadores (soporte) | MEDIO | 2 | SECURITY_ADMIN |
| 69 | POST | `/provider-networks/{id}/memberships` | Alta de membresía de prestador en la red | MEDIO | 2 | SECURITY_ADMIN |
| 70 | GET | `/public/portability/verify/{manifestHash}` | Verificar la autenticidad de un certificado de portabilidad por su sello | BAJO | 2 | pública |
| 71 | POST | `/reconciliation-batches` | Abrir lote de conciliación | MEDIO | 3 | SECURITY_ADMIN |
| 72 | POST | `/reconciliation-batches/{id}/items` | Agregar ítem de conciliación al lote | MEDIO | 6 | SECURITY_ADMIN |

---

## 1. POST /broker-commission-statements

- **Origen:** CONTRATO
- **Nombre:** Generar liquidación de comisión de broker
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BrokerCommissionController.generate` — `src/modules/insurance/presentation/controllers/broker-commission.controller.ts:29`

### Qué es y para qué sirve (negocio)

Generar liquidación de comisión de broker. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /broker-commission-statements` la atiende `BrokerCommissionController.generate` (src/modules/insurance/presentation/controllers/broker-commission.controller.ts:29). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateCommissionStatementDto` (6 campos, 4 obligatorios). Delega en `BrokerCommissionService.generate`. Crea filas en insurance.broker_commission_statements. Lee insurance.broker_carrier_agreements, insurance.broker_commission_statements, insurance.insurance_brokers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/broker-commission.controller.ts:29` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_carrier_agreements` | LEE | LEE | DIRECTA | BrokerCommissionController.generate → BrokerCommissionService.generate → CatalogRepository.findAgreement | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:292` |
| `insurance.broker_commission_statements` | ESCRIBE | CREA | DIRECTA | BrokerCommissionController.generate → BrokerCommissionService.generate → SettlementRepository.createStatement | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:279` |
| `insurance.broker_commission_statements` | LEE | LEE | DIRECTA | BrokerCommissionController.generate → BrokerCommissionService.generate → SettlementRepository.findStatementByUnique | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:261` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | BrokerCommissionController.generate → BrokerCommissionService.generate → CatalogRepository.findBroker | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:243` |

### Cuerpo — DTO `CreateCommissionStatementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceBrokerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/broker-commission.dto.ts:11` |
| `brokerCarrierAgreementId` | `string` | Sí | formato uuid | `@IsUUID()` | Acuerdo broker–aseguradora | `src/modules/insurance/presentation/dto/broker-commission.dto.ts:18` |
| `periodStart` | `string` | Sí | formato date | `@IsString()` | — | `src/modules/insurance/presentation/dto/broker-commission.dto.ts:25` |
| `periodEnd` | `string` | Sí | formato date | `@IsString()` | — | `src/modules/insurance/presentation/dto/broker-commission.dto.ts:32` |
| `grossPremiumAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Prima bruta del periodo | `src/modules/insurance/presentation/dto/broker-commission.dto.ts:43` |
| `commissionAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Comisión calculada | `src/modules/insurance/presentation/dto/broker-commission.dto.ts:51` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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
- **Implementación:** `AppealsController.decide` — `src/modules/insurance/presentation/controllers/appeals.controller.ts:37`

### Qué es y para qué sirve (negocio)

Emitir decisión de apelación (inmutable). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /claim-disputes/{id}/appeal-decisions` la atiende `AppealsController.decide` (src/modules/insurance/presentation/controllers/appeals.controller.ts:37). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateAppealDecisionDto` (3 campos, 1 obligatorio). Delega en `AppealsService.decide`. Crea filas en insurance.claim_appeal_decisions. Actualiza insurance.claim_disputes. Lee insurance.claim_appeal_decisions, insurance.claim_disputes.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/appeals.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/appeals.controller.ts:37` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_appeal_decisions` | ESCRIBE | CREA | DIRECTA | AppealsController.decide → AppealsService.decide → DisputeRepository.createAppealDecision | `src/modules/insurance/infrastructure/repositories/dispute.repository.ts:45` |
| `insurance.claim_appeal_decisions` | LEE | LEE | DIRECTA | AppealsController.decide → AppealsService.decide → DisputeRepository.latestDecision | `src/modules/insurance/infrastructure/repositories/dispute.repository.ts:27` |
| `insurance.claim_disputes` | ESCRIBE | ACTUALIZA | POR_TIPO | AppealsController.decide → AppealsService.decide | `src/modules/insurance/application/services/appeals.service.ts:90` |
| `insurance.claim_disputes` | LEE | LEE | DIRECTA | AppealsController.decide → AppealsService.decide → DisputeRepository.findDispute | `src/modules/insurance/infrastructure/repositories/dispute.repository.ts:19` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAppealDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: UPHELD, OVERTURNED | `@IsIn(['UPHELD', 'OVERTURNED'])` | — | `src/modules/insurance/presentation/dto/appeals.dto.ts:17` |
| `adjustedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto ajustado tras la decisión | `src/modules/insurance/presentation/dto/appeals.dto.ts:28` |
| `rationaleText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/appeals.dto.ts:37` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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
- **Implementación:** `CoverageController.determineCob` — `src/modules/insurance/presentation/controllers/coverage.controller.ts:117`

### Qué es y para qué sirve (negocio)

Determinar coordinación de beneficios (COB). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /coordination-of-benefits` la atiende `CoverageController.determineCob` (src/modules/insurance/presentation/controllers/coverage.controller.ts:117). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateCobDto` (5 campos, 2 obligatorios). Delega en `CoverageService.determineCob`. Crea filas en insurance.coordination_of_benefits. Actualiza insurance.coordination_of_benefits. Lee insurance.coordination_of_benefits, insurance.patient_coverages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/coverage.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.coordination_of_benefits` | ESCRIBE | ACTUALIZA | POR_TIPO | CoverageController.determineCob → CoverageService.determineCob | `src/modules/insurance/application/services/coverage.service.ts:340` |
| `insurance.coordination_of_benefits` | ESCRIBE | CREA | DIRECTA | CoverageController.determineCob → CoverageService.determineCob → CoverageRepository.createCob | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:315` |
| `insurance.coordination_of_benefits` | LEE | LEE | DIRECTA | CoverageController.determineCob → CoverageService.determineCob → CoverageRepository.latestActiveCob | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:297` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | CoverageController.determineCob → CoverageService.determineCob → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |

### Cuerpo — DTO `CreateCobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:147` |
| `primaryPatientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | Cobertura primaria | `src/modules/insurance/presentation/dto/coverage.dto.ts:154` |
| `secondaryPatientCoverageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cobertura secundaria | `src/modules/insurance/presentation/dto/coverage.dto.ts:162` |
| `tertiaryPatientCoverageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cobertura terciaria | `src/modules/insurance/presentation/dto/coverage.dto.ts:170` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:178` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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
- **Implementación:** `CoverageController.requestEligibility` — `src/modules/insurance/presentation/controllers/coverage.controller.ts:101`

### Qué es y para qué sirve (negocio)

Solicitar y resolver elegibilidad (270/271). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /coverage-eligibility-requests` la atiende `CoverageController.requestEligibility` (src/modules/insurance/presentation/controllers/coverage.controller.ts:101). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateEligibilityRequestDto` (4 campos, 1 obligatorio). Delega en `CoverageService.requestEligibility`. Crea filas en insurance.coverage_eligibility_requests, insurance.coverage_eligibility_responses. Actualiza insurance.coverage_eligibility_requests. Lee insurance.coverage_eligibility_requests, insurance.patient_coverages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/coverage.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.coverage_eligibility_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | CoverageController.requestEligibility → CoverageService.requestEligibility | `src/modules/insurance/application/services/coverage.service.ts:299` |
| `insurance.coverage_eligibility_requests` | ESCRIBE | CREA | DIRECTA | CoverageController.requestEligibility → CoverageService.requestEligibility → CoverageRepository.createEligibilityRequest | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:352` |
| `insurance.coverage_eligibility_requests` | LEE | LEE | DIRECTA | CoverageController.requestEligibility → CoverageService.requestEligibility → CoverageRepository.findRequestByIdempotency | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:338` |
| `insurance.coverage_eligibility_responses` | ESCRIBE | CREA | DIRECTA | CoverageController.requestEligibility → CoverageService.requestEligibility → CoverageRepository.createEligibilityResponse | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:374` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | CoverageController.requestEligibility → CoverageService.requestEligibility → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |

### Cuerpo — DTO `CreateEligibilityRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:111` |
| `serviceDate` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:119` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:128` |
| `benefitSummary` | `object` | No | — | `@IsOptional()` | Resumen de beneficios recibido del pagador | `src/modules/insurance/presentation/dto/coverage.dto.ts:137` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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
- **Implementación:** `InsuranceBackboneController.createEmployerGroup` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:344`

### Qué es y para qué sirve (negocio)

Alta de grupo empleador (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /employer-groups` la atiende `InsuranceBackboneController.createEmployerGroup` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:344). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateEmployerGroupDto` (3 campos, 3 obligatorios). Delega en `InsuranceBackboneService.createEmployerGroup`. Crea filas en insurance.employer_groups.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:344` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.employer_groups` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createEmployerGroup → InsuranceBackboneService.createEmployerGroup → CatalogRepository.createEmployerGroup | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:274` |

### Cuerpo — DTO `CreateEmployerGroupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:539` |
| `groupCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:548` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:557` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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
- **Implementación:** `InsuranceReadController.listBrokers` — `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:81`

### Qué es y para qué sirve (negocio)

Listar los brokers del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-brokers` la atiende `InsuranceReadController.listBrokers` (src/modules/insurance/presentation/controllers/insurance-read.controller.ts:81). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.listBrokers`. Lee insurance.broker_carrier_agreements, insurance.insurance_brokers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_carrier_agreements` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokers → InsuranceReadService.listBrokers → InsuranceReadRepository.findAgreements | `src/modules/insurance/infrastructure/repositories/read.repository.ts:166` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokers → InsuranceReadService.listBrokers → InsuranceReadRepository.findBrokersByTenant | `src/modules/insurance/infrastructure/repositories/read.repository.ts:137` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokers → InsuranceReadService.listBrokers → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/infrastructure/repositories/read.repository.ts:200` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BrokerDirectoryResponseDto>` · DTO `BrokerDirectoryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BrokerSummaryDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:414` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:364` |
| `items[].brokerCode` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:368` |
| `items[].legalName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:372` |
| `items[].licenseNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:376` |
| `items[].jurisdiction` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:380` |
| `items[].jurisdiction.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].jurisdiction.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:384` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `items[].verification` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:388` |
| `items[].verification.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `items[].verification.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `items[].independent` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:399` |
| `items[].currentCarrierCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:403` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:407` |
| `count` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:418` |

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
- **Implementación:** `InsuranceBackboneController.createBroker` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:296`

### Qué es y para qué sirve (negocio)

Alta de broker (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-brokers` la atiende `InsuranceBackboneController.createBroker` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:296). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateBrokerDto` (4 campos, 3 obligatorios). Delega en `InsuranceBackboneService.createBroker`. Crea filas en insurance.insurance_brokers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:296` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_brokers` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createBroker → InsuranceBackboneService.createBroker → CatalogRepository.createBroker | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:256` |

### Cuerpo — DTO `CreateBrokerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:502` |
| `brokerCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:511` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:520` |
| `licenseNumber` | `string` | No | longitud máxima 80 | `@IsOptional()` `@IsString()` `@MaxLength(80)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:529` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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
- **Implementación:** `InsuranceReadController.getBroker` — `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:94`

### Qué es y para qué sirve (negocio)

Consultar el perfil y las vinculaciones de un broker. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-brokers/{id}` la atiende `InsuranceReadController.getBroker` (src/modules/insurance/presentation/controllers/insurance-read.controller.ts:94). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.getBroker`. Lee insurance.broker_carrier_agreements, insurance.insurance_brokers, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:94` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_carrier_agreements` | LEE | LEE | DIRECTA | InsuranceReadController.getBroker → InsuranceReadService.getBroker → InsuranceReadRepository.findAgreements | `src/modules/insurance/infrastructure/repositories/read.repository.ts:166` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | InsuranceReadController.getBroker → InsuranceReadService.getBroker → InsuranceReadRepository.findBrokerByTenant | `src/modules/insurance/infrastructure/repositories/read.repository.ts:150` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceReadController.getBroker → InsuranceReadService.getBroker → InsuranceReadRepository.findCarriersByIds | `src/modules/insurance/infrastructure/repositories/read.repository.ts:179` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.getBroker → InsuranceReadService.getBroker → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/infrastructure/repositories/read.repository.ts:200` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BrokerProfileDto>` · DTO `BrokerProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:364` |
| `brokerCode` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:368` |
| `legalName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:372` |
| `licenseNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:376` |
| `jurisdiction` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:380` |
| `jurisdiction.code` | `string` | Sí | — | — | — | sin fuente |
| `jurisdiction.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:384` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `verification` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:388` |
| `verification.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `verification.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `independent` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:399` |
| `currentCarrierCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:403` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:407` |
| `agreements` | `array<BrokerAgreementDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:431` |
| `agreements[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:314` |
| `agreements[].insuranceCarrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:318` |
| `agreements[].carrierLegalName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:322` |
| `agreements[].agreementCode` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:326` |
| `agreements[].commissionModel` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:330` |
| `agreements[].commissionModel.code` | `string` | Sí | — | — | — | sin fuente |
| `agreements[].commissionModel.display` | `string` | Sí | — | — | — | sin fuente |
| `agreements[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:334` |
| `agreements[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:338` |
| `agreements[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:342` |
| `agreements[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `agreements[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `agreements[].current` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:353` |
| `agreements[].contractFileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:357` |
| `publicProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:441` |

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
- **Implementación:** `InsuranceBackboneController.createAgreement` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:320`

### Qué es y para qué sirve (negocio)

Alta de acuerdo broker–aseguradora (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-brokers/{id}/agreements` la atiende `InsuranceBackboneController.createAgreement` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:320). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateBrokerAgreementDto` (4 campos, 2 obligatorios). Delega en `InsuranceBackboneService.createAgreement`. Crea filas en insurance.broker_carrier_agreements. Lee insurance.insurance_brokers, insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:320` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:320` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_carrier_agreements` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createAgreement → InsuranceBackboneService.createAgreement → CatalogRepository.createAgreement | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:305` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createAgreement → InsuranceBackboneService.createAgreement → CatalogRepository.findBroker | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:243` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createAgreement → InsuranceBackboneService.createAgreement → CatalogRepository.findCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:36` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateBrokerAgreementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:567` |
| `agreementCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:576` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:584` |
| `effectiveTo` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:592` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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
- **Implementación:** `InsuranceReadController.listBrokerClients` — `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:112`

### Qué es y para qué sirve (negocio)

Listar la cartera comercial de un broker (sin datos clínicos). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-brokers/{id}/clients` la atiende `InsuranceReadController.listBrokerClients` (src/modules/insurance/presentation/controllers/insurance-read.controller.ts:112). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.listBrokerClients`. Lee insurance.broker_clients, insurance.insurance_brokers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:112` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_clients` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokerClients → InsuranceReadService.listBrokerClients → InsuranceReadRepository.findBrokerClients | `src/modules/insurance/infrastructure/repositories/read.repository.ts:187` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokerClients → InsuranceReadService.listBrokerClients → InsuranceReadRepository.findBrokerByTenant | `src/modules/insurance/infrastructure/repositories/read.repository.ts:150` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.listBrokerClients → InsuranceReadService.listBrokerClients → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/infrastructure/repositories/read.repository.ts:200` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BrokerPortfolioResponseDto>` · DTO `BrokerPortfolioResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BrokerClientDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:490` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:455` |
| `items[].patientProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:459` |
| `items[].employerGroupId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:463` |
| `items[].clientType` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:467` |
| `items[].clientType.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `items[].clientType.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `items[].assignedBrokerUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:471` |
| `items[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:475` |
| `items[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:479` |
| `items[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:483` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `count` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:494` |

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

## 11. GET /insurance-campaigns

- **Origen:** CONTRATO
- **Nombre:** Listar las campañas de la aseguradora activa
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.list` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:77`

### Qué es y para qué sirve (negocio)

Listar las campañas de la aseguradora activa. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns` la atiende `InsuranceCampaignsController.list` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:77). Exige sesión; el controlador no declara roles. Delega en `InsuranceCampaignsService.list`. Crea filas en audit.audit_log. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsRepository.listRowsByCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:233` |
| `insurance.insurance_campaigns` | LEE | LEE | POR_SQL | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsRepository.listRowsByCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:233` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsRepository.listRowsByCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:233` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `type` | query | No | `string` | — |
| `status` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InsuranceCampaignPageDto>` · DTO `InsuranceCampaignPageDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<InsuranceCampaignResponseDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:388` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `items[].title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `items[].description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `items[].campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `items[].status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `items[].effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `items[].targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `items[].targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `items[].validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `items[].validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `items[].activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `items[].partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `items[].partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `items[].partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `items[].partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `items[].partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `items[].partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `items[].updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:392` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: Cursor inválido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /insurance-campaigns

- **Origen:** CONTRATO
- **Nombre:** Crear una campaña preventiva de la aseguradora
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.create` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:61`

### Qué es y para qué sirve (negocio)

Crear una campaña preventiva de la aseguradora. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-campaigns` la atiende `InsuranceCampaignsController.create` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:61). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateInsuranceCampaignDto` (15 campos, 10 obligatorios). Delega en `InsuranceCampaignsService.create`. Crea filas en audit.audit_log, insurance.insurance_campaign_partners, insurance.insurance_campaigns. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, insurance.network_provider_memberships, insurance.provider_networks y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.createPartner | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:151` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.detail → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |
| `insurance.insurance_campaigns` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.createCampaign | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:131` |
| `insurance.insurance_campaigns` | LEE | LEE | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.findByCarrierAndCode | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:102` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.administrableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.network_provider_memberships` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.assertPartnersBelongToCarrier → InsuranceCampaignsRepository.membershipBelongsToCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:374` |
| `insurance.provider_networks` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.assertPartnersBelongToCarrier → InsuranceCampaignsRepository.membershipBelongsToCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:374` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |

### Cuerpo — DTO `CreateInsuranceCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | patrón runtime /^[A-Z0-9][A-Z0-9-]{2,39}$/ | `@Matches(/^[A-Z0-9][A-Z0-9-]{2,39}$/, { message: 'El código debe tener de 3 a 40 caracteres: mayúsculas, dígitos y guiones', })` | Único por aseguradora; mayúsculas, dígitos y guiones. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:118` |
| `title` | `string` | Sí | longitud mínima 3; longitud máxima 200 | `@IsString()` `@Length(3, 200)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:125` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:131` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | `@IsIn(CAMPAIGN_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:135` |
| `targetConditionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:145` |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(100)` | Porcentaje del copago que la aseguradora bonifica. 100 = copago Bs. 0. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:158` |
| `validFrom` | `string` | Sí | formato date; patrón runtime DATE_ONLY | `@Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:163` |
| `validTo` | `string` | Sí | formato date; patrón runtime DATE_ONLY | `@Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:168` |
| `partners` | `array<InsuranceCampaignPartnerInputDto>` | Sí | mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => InsuranceCampaignPartnerInputDto)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:176` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | `@IsIn(CAMPAIGN_PARTNER_ROLES)` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:78` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | `@IsIn(CAMPAIGN_PARTNER_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:82` |
| `partners[].name` | `string` | Sí | longitud mínima 2; longitud máxima 160 | `@IsString()` `@Length(2, 160)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:87` |
| `partners[].partnerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:96` |
| `partners[].networkProviderMembershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía de la red de prestadores de la aseguradora, si aplica. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:105` |
| `activate` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es true, la campaña nace ACTIVE en vez de DRAFT. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:184` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "campaignType": "LABORATORY",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "activate": false
}
```

</details>

### Respuesta — `Promise<InsuranceCampaignResponseDto>` · DTO `InsuranceCampaignResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: validTo debe ser igual o posterior a validFrom; BadRequestException: No se puede activar una campaña cuya vigencia ya terminó; BadRequestException: El código CIE-10 {code} no está en el catálogo |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, INSURANCE_OPERATOR con membresía activa, o administrador de la plataforma; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campaña no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una campaña con ese código en la aseguradora |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La membresía de red del aliado no pertenece a esta aseguradora |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /insurance-campaigns/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar una campaña de la aseguradora activa
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.getById` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:148`

### Qué es y para qué sirve (negocio)

Consultar una campaña de la aseguradora activa. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns/{id}` la atiende `InsuranceCampaignsController.getById` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:148). Exige sesión; el controlador no declara roles. Delega en `InsuranceCampaignsService.getById`. Crea filas en audit.audit_log. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:148` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |
| `insurance.insurance_campaigns` | LEE | LEE | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.assertNotCrossTenant → InsuranceCampaignsRepository.findAnyById | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:123` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InsuranceCampaignResponseDto>` · DTO `InsuranceCampaignResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora; ForbiddenException: La campaña pertenece a otra aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campaña no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. PATCH /insurance-campaigns/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una campaña en borrador o pausada (422 si está activa o vencida)
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.update` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:178`

### Qué es y para qué sirve (negocio)

Editar una campaña en borrador o pausada (422 si está activa o vencida). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PATCH /insurance-campaigns/{id}` la atiende `InsuranceCampaignsController.update` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:178). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateInsuranceCampaignDto` (13 campos, 0 obligatorios). Delega en `InsuranceCampaignsService.update`. Crea filas en audit.audit_log, insurance.insurance_campaign_partners. Actualiza insurance.insurance_campaigns. Borra de insurance.insurance_campaign_partners. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, insurance.network_provider_memberships, insurance.provider_networks y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:178` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | BORRA | BORRA | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.deletePartners | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:143` |
| `insurance.insurance_campaign_partners` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.createPartner | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:151` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.detail → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |
| `insurance.insurance_campaigns` | ESCRIBE | ACTUALIZA | POR_TIPO | InsuranceCampaignsController.update → InsuranceCampaignsService.update | `src/modules/insurance/application/services/insurance-campaigns.service.ts:387` |
| `insurance.insurance_campaigns` | LEE | LEE | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.requireOwnedEntity → InsuranceCampaignsRepository.findEntityForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:111` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.administrableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.network_provider_memberships` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.assertPartnersBelongToCarrier → InsuranceCampaignsRepository.membershipBelongsToCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:374` |
| `insurance.provider_networks` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.assertPartnersBelongToCarrier → InsuranceCampaignsRepository.membershipBelongsToCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:374` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateInsuranceCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@Length(3, 200)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:206` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:212` |
| `campaignType` | `string` | No | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | `@IsOptional()` `@IsIn(CAMPAIGN_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:217` |
| `targetConditionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:227` |
| `copayBonusPercentage` | `number` | No | mínimo 0; máximo 100 | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(100)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:239` |
| `validFrom` | `string` | No | formato date; patrón runtime DATE_ONLY | `@IsOptional()` `@Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:245` |
| `validTo` | `string` | No | formato date; patrón runtime DATE_ONLY | `@IsOptional()` `@Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:251` |
| `partners` | `array<InsuranceCampaignPartnerInputDto>` | No | mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => InsuranceCampaignPartnerInputDto)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:260` |
| `partners[].role` | `string` | No | valores: SPONSOR, PROVIDER | `@IsIn(CAMPAIGN_PARTNER_ROLES)` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:78` |
| `partners[].type` | `string` | No | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | `@IsIn(CAMPAIGN_PARTNER_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:82` |
| `partners[].name` | `string` | No | longitud mínima 2; longitud máxima 160 | `@IsString()` `@Length(2, 160)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:87` |
| `partners[].partnerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:96` |
| `partners[].networkProviderMembershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía de la red de prestadores de la aseguradora, si aplica. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:105` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<InsuranceCampaignResponseDto>` · DTO `InsuranceCampaignResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: validTo debe ser igual o posterior a validFrom; BadRequestException: El código CIE-10 {code} no está en el catálogo |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, INSURANCE_OPERATOR con membresía activa, o administrador de la plataforma; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora; ForbiddenException: La campaña pertenece a otra aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campaña no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una campaña en estado {current} no se puede editar; pausela primero; PreconditionFailedException: La membresía de red del aliado no pertenece a esta aseguradora |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. PATCH /insurance-campaigns/{id}/status

- **Origen:** CONTRATO
- **Nombre:** Activar, pausar o finalizar una campaña (transiciones cerradas)
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.changeStatus` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:159`

### Qué es y para qué sirve (negocio)

Activar, pausar o finalizar una campaña (transiciones cerradas). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PATCH /insurance-campaigns/{id}/status` la atiende `InsuranceCampaignsController.changeStatus` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:159). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateInsuranceCampaignStatusDto` (1 campo, 1 obligatorio). Delega en `InsuranceCampaignsService.changeStatus`. Crea filas en audit.audit_log. Actualiza insurance.insurance_campaigns. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:159` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |
| `insurance.insurance_campaigns` | ESCRIBE | ACTUALIZA | POR_TIPO | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus | `src/modules/insurance/application/services/insurance-campaigns.service.ts:324` |
| `insurance.insurance_campaigns` | LEE | LEE | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsService.requireOwnedEntity → InsuranceCampaignsRepository.findEntityForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:111` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsService.administrableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateInsuranceCampaignStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: ACTIVE, PAUSED, EXPIRED | `@IsIn(CAMPAIGN_TARGET_STATUSES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:191` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "ACTIVE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "ACTIVE"
}
```

</details>

### Respuesta — `Promise<InsuranceCampaignResponseDto>` · DTO `InsuranceCampaignResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, INSURANCE_OPERATOR con membresía activa, o administrador de la plataforma; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora; ForbiddenException: La campaña pertenece a otra aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campaña no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una campaña en estado {current} no puede pasar a {target}; PreconditionFailedException: La campaña ya venció: no se puede activar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /insurance-campaigns/active

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.listActive` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:93`

### Qué es y para qué sirve (negocio)

Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns/active` la atiende `InsuranceCampaignsController.listActive` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:93). Es una ruta pública: no exige token. Delega en `InsuranceCampaignsService.listActivePublic`. Lee insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:93` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listActive → InsuranceCampaignsService.listActivePublic → InsuranceCampaignsRepository.listPublicActiveRows | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:353` |
| `insurance.insurance_campaigns` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listActive → InsuranceCampaignsService.listActivePublic → InsuranceCampaignsRepository.listPublicActiveRows | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:353` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listActive → InsuranceCampaignsService.listActivePublic → InsuranceCampaignsRepository.listPublicActiveRows | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:353` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listActive → InsuranceCampaignsService.listActivePublic → InsuranceCampaignsRepository.listPublicActiveRows | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:353` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `carrierId` | query | No | `string` | Acota a una aseguradora. Sin filtro, trae de todas. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientCampaignDto[]>` · DTO `PatientCampaignDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:416` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:419` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:422` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:425` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:428` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:431` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:434` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:437` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:440` |
| `carrierName` | `string` | Sí | — | — | Nombre de la aseguradora que ofrece la campaña. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:445` |
| `partners` | `array<PatientCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:448` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:398` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:401` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:404` |

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

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. GET /insurance-campaigns/my-benefits

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de mi aseguradora, para el afiliado autenticado
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.myBenefits` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:108`

### Qué es y para qué sirve (negocio)

Campañas vigentes de mi aseguradora, para el afiliado autenticado. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns/my-benefits` la atiende `InsuranceCampaignsController.myBenefits` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:108). Exige sesión; el controlador no declara roles. Delega en `InsuranceCampaignsService.listMyBenefits`. Crea filas en audit.audit_log. Lee audit.audit_log, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |
| `insurance.insurance_campaigns` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientCampaignDto[]>` · DTO `PatientCampaignDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:416` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:419` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:422` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:425` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:428` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:431` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:434` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:437` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:440` |
| `carrierName` | `string` | Sí | — | — | Nombre de la aseguradora que ofrece la campaña. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:445` |
| `partners` | `array<PatientCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:448` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:398` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:401` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:404` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La cuenta no tiene un perfil de paciente asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /insurance-campaigns/patient/{patientProfileId}

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de la aseguradora del afiliado (sólo el titular)
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.listForPatient` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:129`

### Qué es y para qué sirve (negocio)

Campañas vigentes de la aseguradora del afiliado (sólo el titular). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-campaigns/patient/{patientProfileId}` la atiende `InsuranceCampaignsController.listForPatient` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:129). Exige sesión; el controlador no declara roles. Delega en `InsuranceCampaignsService.listActiveForPatient`. Crea filas en audit.audit_log. Lee audit.audit_log, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:129` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |
| `insurance.insurance_campaigns` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientCampaignDto[]>` · DTO `PatientCampaignDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:416` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:419` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:422` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:425` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:428` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:431` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:434` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:437` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:440` |
| `carrierName` | `string` | Sí | — | — | Nombre de la aseguradora que ofrece la campaña. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:445` |
| `partners` | `array<PatientCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:448` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:398` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:401` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:404` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil o la plataforma pueden modificarlo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. GET /insurance-carrier-catalog

- **Origen:** CONTRATO
- **Nombre:** Catálogo público de aseguradoras y sus planes de salud
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCatalogController.listCatalog` — `src/modules/insurance/presentation/controllers/insurance-catalog.controller.ts:37`

### Qué es y para qué sirve (negocio)

Catálogo público de aseguradoras y sus planes de salud. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-carrier-catalog` la atiende `InsuranceCatalogController.listCatalog` (src/modules/insurance/presentation/controllers/insurance-catalog.controller.ts:37). Es una ruta pública: no exige token. Delega en `InsuranceCatalogService.listHealthCatalog`. Lee directory.tenant_memberships, directory.tenants, iam.authentication_credentials, iam.users, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/insurance/presentation/controllers/insurance-catalog.controller.ts:37` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 60, ttl: 60_000 } }) | `src/modules/insurance/presentation/controllers/insurance-catalog.controller.ts:37` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog → InsuranceCatalogService.findPrivateWithAccount | `src/modules/insurance/application/services/insurance-catalog.service.ts:166` |
| `directory.tenants` | LEE | LEE | POR_SQL | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog → InsuranceCatalogService.findPrivateWithAccount | `src/modules/insurance/application/services/insurance-catalog.service.ts:166` |
| `iam.authentication_credentials` | LEE | LEE | POR_SQL | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog → InsuranceCatalogService.findPrivateWithAccount | `src/modules/insurance/application/services/insurance-catalog.service.ts:166` |
| `iam.users` | LEE | LEE | POR_SQL | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog → InsuranceCatalogService.findPrivateWithAccount | `src/modules/insurance/application/services/insurance-catalog.service.ts:166` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog | `src/modules/insurance/application/services/insurance-catalog.service.ts:92` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog | `src/modules/insurance/application/services/insurance-catalog.service.ts:104` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceCatalogController.listCatalog → InsuranceCatalogService.listHealthCatalog | `src/modules/insurance/application/services/insurance-catalog.service.ts:100` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CarrierCatalogResponseDto>` · DTO `CarrierCatalogResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `carriers` | `array<CarrierCatalogEntryDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:64` |
| `carriers[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:28` |
| `carriers[].code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:32` |
| `carriers[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:36` |
| `carriers[].legalName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:40` |
| `carriers[].isPublic` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:53` |
| `carriers[].plans` | `array<CarrierCatalogPlanDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:57` |
| `carriers[].plans[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:7` |
| `carriers[].plans[].code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:17` |
| `carriers[].plans[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/carrier-catalog.dto.ts:21` |

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

## 20. GET /insurance-carriers

- **Origen:** CONTRATO
- **Nombre:** Listar las aseguradoras del tenant activo
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceReadController.listCarriers` — `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:49`

### Qué es y para qué sirve (negocio)

Listar las aseguradoras del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-carriers` la atiende `InsuranceReadController.listCarriers` (src/modules/insurance/presentation/controllers/insurance-read.controller.ts:49). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.listCarriers`. Lee directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.provider_networks, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadRepository.findCarriersByTenant | `src/modules/insurance/infrastructure/repositories/read.repository.ts:34` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadRepository.findActivePlans | `src/modules/insurance/infrastructure/repositories/read.repository.ts:78` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadRepository.findActiveProducts | `src/modules/insurance/infrastructure/repositories/read.repository.ts:62` |
| `insurance.provider_networks` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadRepository.findActiveNetworks | `src/modules/insurance/infrastructure/repositories/read.repository.ts:110` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.listCarriers → InsuranceReadService.listCarriers → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/infrastructure/repositories/read.repository.ts:200` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CarrierDirectoryResponseDto>` · DTO `CarrierDirectoryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CarrierSummaryDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:101` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:31` |
| `items[].carrierCode` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:35` |
| `items[].legalName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:39` |
| `items[].regulatorIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:43` |
| `items[].whatsappNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:50` |
| `items[].callCenterPhone` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:54` |
| `items[].supportEmail` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:58` |
| `items[].jurisdiction` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:62` |
| `items[].jurisdiction.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].jurisdiction.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:66` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `items[].verification` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:74` |
| `items[].verification.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `items[].verification.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `items[].productCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:78` |
| `items[].planCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:82` |
| `items[].networkCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:86` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:90` |
| `items[].canAdminister` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:94` |
| `count` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:105` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-coverage-copays.int-spec.ts:125` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /insurance-carriers

- **Origen:** CONTRATO
- **Nombre:** Alta de aseguradora (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createCarrier` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:68`

### Qué es y para qué sirve (negocio)

Alta de aseguradora (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-carriers` la atiende `InsuranceBackboneController.createCarrier` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCarrierDto` (4 campos, 3 obligatorios). Delega en `InsuranceBackboneService.createCarrier`. Crea filas en insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createCarrier → InsuranceBackboneService.createCarrier → CatalogRepository.createCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:62` |

### Cuerpo — DTO `CreateCarrierDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario | `src/modules/insurance/presentation/dto/backbone.dto.ts:67` |
| `carrierCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:76` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:85` |
| `regulatorIdentifier` | `string` | No | longitud máxima 80 | `@IsOptional()` `@IsString()` `@MaxLength(80)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:94` |

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
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/presentation/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:36` |

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

## 22. GET /insurance-carriers/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar el catálogo y la red de una aseguradora
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceReadController.getCarrier` — `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:64`

### Qué es y para qué sirve (negocio)

Consultar el catálogo y la red de una aseguradora. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-carriers/{id}` la atiende `InsuranceReadController.getCarrier` (src/modules/insurance/presentation/controllers/insurance-read.controller.ts:64). Exige sesión; el controlador no declara roles. Delega en `InsuranceReadService.getCarrier`. Lee directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plan_benefits, insurance.insurance_plans, insurance.insurance_products, insurance.network_provider_memberships, insurance.provider_networks, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-read.controller.ts:64` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findCarrierByTenant | `src/modules/insurance/infrastructure/repositories/read.repository.ts:53` |
| `insurance.insurance_plan_benefits` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActiveBenefits | `src/modules/insurance/infrastructure/repositories/read.repository.ts:94` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActivePlans | `src/modules/insurance/infrastructure/repositories/read.repository.ts:78` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActiveProducts | `src/modules/insurance/infrastructure/repositories/read.repository.ts:62` |
| `insurance.network_provider_memberships` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActiveMemberships | `src/modules/insurance/infrastructure/repositories/read.repository.ts:126` |
| `insurance.provider_networks` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadRepository.findActiveNetworks | `src/modules/insurance/infrastructure/repositories/read.repository.ts:110` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsuranceReadController.getCarrier → InsuranceReadService.getCarrier → InsuranceReadService.conceptMap → InsuranceReadRepository.findConcepts | `src/modules/insurance/infrastructure/repositories/read.repository.ts:200` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CarrierDetailDto>` · DTO `CarrierDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:31` |
| `carrierCode` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:35` |
| `legalName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:39` |
| `regulatorIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:43` |
| `whatsappNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:50` |
| `callCenterPhone` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:54` |
| `supportEmail` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:58` |
| `jurisdiction` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:62` |
| `jurisdiction.code` | `string` | Sí | — | — | — | sin fuente |
| `jurisdiction.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:66` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `verification` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:74` |
| `verification.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `verification.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `productCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:78` |
| `planCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:82` |
| `networkCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:86` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:90` |
| `canAdminister` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:94` |
| `products` | `array<ProductDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:303` |
| `products[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:231` |
| `products[].productCode` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:235` |
| `products[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:239` |
| `products[].productType` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:243` |
| `products[].productType.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `products[].productType.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `products[].marketSegment` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:247` |
| `products[].marketSegment.code` | `string` | Sí | — | — | — | sin fuente |
| `products[].marketSegment.display` | `string` | Sí | — | — | — | sin fuente |
| `products[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:251` |
| `products[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `products[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `products[].plans` | `array<PlanDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:255` |
| `products[].plans[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:176` |
| `products[].plans[].planCode` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:180` |
| `products[].plans[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:184` |
| `products[].plans[].planType` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:188` |
| `products[].plans[].planType.code` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].planType.display` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:192` |
| `products[].plans[].currency.code` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].currency.display` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].monthlyPremiumAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:199` |
| `products[].plans[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:203` |
| `products[].plans[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:207` |
| `products[].plans[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:211` |
| `products[].plans[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `products[].plans[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `products[].plans[].policyDocumentFileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:220` |
| `products[].plans[].benefits` | `array<PlanBenefitDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:224` |
| `products[].plans[].benefits[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:123` |
| `products[].plans[].benefits[].category` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:127` |
| `products[].plans[].benefits[].category.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `products[].plans[].benefits[].category.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `products[].plans[].benefits[].service` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:131` |
| `products[].plans[].benefits[].service.code` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].benefits[].service.display` | `string` | Sí | — | — | — | sin fuente |
| `products[].plans[].benefits[].coveragePercent` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:141` |
| `products[].plans[].benefits[].copayAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:145` |
| `products[].plans[].benefits[].deductibleAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:149` |
| `products[].plans[].benefits[].annualLimitAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:153` |
| `products[].plans[].benefits[].requiresPriorAuthorization` | `boolean` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:157` |
| `products[].plans[].benefits[].approvalRules` | `BenefitApprovalRulesDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:161` |
| `products[].plans[].benefits[].approvalRules.requiredDocuments` | `array<string>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:114` |
| `products[].plans[].benefits[].approvalRules.exclusionNotes` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:117` |
| `products[].plans[].benefits[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:165` |
| `products[].plans[].benefits[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:169` |
| `networks` | `array<ProviderNetworkDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:307` |
| `networks[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:262` |
| `networks[].networkCode` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:266` |
| `networks[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:270` |
| `networks[].networkType` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:274` |
| `networks[].networkType.code` | `string` | Sí | — | — | — | sin fuente |
| `networks[].networkType.display` | `string` | Sí | — | — | — | sin fuente |
| `networks[].status` | `InsuranceConceptDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:278` |
| `networks[].status.code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `networks[].status.display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `networks[].effectiveFrom` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:282` |
| `networks[].effectiveTo` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:286` |
| `networks[].memberCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:290` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:191` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. PUT /insurance-carriers/{id}/contact-channels

- **Origen:** CONTRATO
- **Nombre:** Configurar los canales de contacto de la aseguradora del tenant activo
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.updateContactChannels` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:98`

### Qué es y para qué sirve (negocio)

Configurar los canales de contacto de la aseguradora del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PUT /insurance-carriers/{id}/contact-channels` la atiende `InsuranceBackboneController.updateContactChannels` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:98). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateCarrierContactChannelsDto` (3 campos, 3 obligatorios). Delega en `InsuranceBackboneService.updateContactChannels`. Actualiza insurance.insurance_carriers. Lee directory.tenant_memberships, insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:98` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:98` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateContactChannels → InsuranceBackboneService.updateContactChannels → InsuranceBackboneService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | ESCRIBE | ACTUALIZA | POR_TIPO | InsuranceBackboneController.updateContactChannels → InsuranceBackboneService.updateContactChannels | `src/modules/insurance/application/services/insurance-backbone.service.ts:129` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateContactChannels → InsuranceBackboneService.updateContactChannels → InsuranceBackboneService.administrableCarrier → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateCarrierContactChannelsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `whatsappNumber` | `string` | Sí | longitud máxima 32; patrón runtime /^\+[1-9]\d{7,14}$/; admite null | `@ValidateIf((_object, value) => value !== null)` `@Transform(({ value }: { value: unknown }): unknown => typeof value === 'string' ? value.replace(/[\s().-]/g, '') : value, )` `@IsString()` `@MaxLength(32)` `@Matches(/^\+[1-9]\d{7,14}$/, { message: 'El número de WhatsApp debe tener formato internacional E.164 (ej. +59171234567)', })` | Número de WhatsApp de atención al cliente, en formato E.164 | `src/modules/insurance/presentation/dto/backbone.dto.ts:398` |
| `callCenterPhone` | `string` | Sí | longitud máxima 32; patrón runtime /^[+\d][\d\s().-]{4,31}$/; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsString()` `@MaxLength(32)` `@Matches(/^[+\d][\d\s().-]{4,31}$/, { message: 'El teléfono del call center sólo admite dígitos, "+", espacios y separadores', })` | Teléfono o línea gratuita de atención al cliente | `src/modules/insurance/presentation/dto/backbone.dto.ts:418` |
| `supportEmail` | `string` | Sí | formato email; longitud máxima 120; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsEmail()` `@MaxLength(120)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:429` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "whatsappNumber": "+59171548278",
  "callCenterPhone": "800-10-6060",
  "supportEmail": "siniestros@aseguradora.com.bo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "whatsappNumber": "+59171548278",
  "callCenterPhone": "800-10-6060",
  "supportEmail": "siniestros@aseguradora.com.bo"
}
```

</details>

### Respuesta — `Promise<CarrierContactChannelsDto>` · DTO `CarrierContactChannelsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:436` |
| `whatsappNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:440` |
| `callCenterPhone` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:444` |
| `supportEmail` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:448` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /insurance-carriers/{id}/products

- **Origen:** CONTRATO
- **Nombre:** Alta de producto de aseguradora (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createProduct` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:125`

### Qué es y para qué sirve (negocio)

Alta de producto de aseguradora (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-carriers/{id}/products` la atiende `InsuranceBackboneController.createProduct` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:125). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `InsuranceCreateProductDto` (2 campos, 2 obligatorios). Delega en `InsuranceBackboneService.createProduct`. Crea filas en insurance.insurance_products. Lee insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:125` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:125` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createProduct → InsuranceBackboneService.createProduct → CatalogRepository.findCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:36` |
| `insurance.insurance_products` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createProduct → InsuranceBackboneService.createProduct → CatalogRepository.createProduct | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:105` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `InsuranceCreateProductDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `productCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:107` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:116` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:74` |
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:76` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. GET /insurance-claims

- **Origen:** CONTRATO
- **Nombre:** Listar las solicitudes de seguro presentadas (cursor)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsReadController.listClaims` — `src/modules/insurance/presentation/controllers/claims-read.controller.ts:63`

### Qué es y para qué sirve (negocio)

Listar las solicitudes de seguro presentadas (cursor). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-claims` la atiende `ClaimsReadController.listClaims` (src/modules/insurance/presentation/controllers/claims-read.controller.ts:63). Exige sesión con alguno de los roles BILLING_OPERATOR, SECURITY_ADMIN. Delega en `ClaimsReadService.listClaims`. Lee diagnostic_units.diagnostic_units, insurance.claim_adjudication_versions, insurance.claim_disputes, insurance.insurance_brokers, insurance.insurance_carriers, insurance.insurance_claims, insurance.patient_coverages, practice.practices y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING_OPERATOR, SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/claims-read.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.resolveScope → ClaimReadRepository.findDiagnosticUnitsByTenant | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:178` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.buildRows → ClaimReadRepository.findAdjudicationsByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:385` |
| `insurance.claim_disputes` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.buildRows → ClaimReadRepository.findDisputesByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:424` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.buildRows | `src/modules/insurance/application/services/claims-read.service.ts:398` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.resolveScope → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimReadRepository.findClaimsPage | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:247` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.buildRows → ClaimReadRepository.findCoveragesByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:356` |
| `practice.practices` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.resolveScope → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.buildRows → ClaimReadRepository.findPatientProfilesByProfileIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:163` |
| `profiles.persons` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.buildRows → ClaimReadRepository.findPersonsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClaimsReadController.listClaims → ClaimsReadService.listClaims → ClaimsReadService.buildRows → ClaimsReadService.conceptMap → ClaimReadRepository.findConceptsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:186` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `statusConceptId` | query | No | `string` | — |
| `insuranceCarrierId` | query | No | `string` | — |
| `submittedFrom` | query | No | `string` | — |
| `submittedTo` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ClaimListResponseDto>` · DTO `ClaimListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ClaimListItemDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:200` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:122` |
| `items[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:126` |
| `items[].patient` | `ClaimPatientDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:130` |
| `items[].patient.id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:87` |
| `items[].patient.displayName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:96` |
| `items[].patient.patientCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:100` |
| `items[].patient.memberIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:104` |
| `items[].carrierName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:134` |
| `items[].insuranceCarrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:138` |
| `items[].carrierWhatsappNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:146` |
| `items[].carrierCallCenterPhone` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:150` |
| `items[].carrierSupportEmail` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:154` |
| `items[].policyIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:158` |
| `items[].policyBrokerName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:167` |
| `items[].billedTotal` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:171` |
| `items[].billedTotal.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `items[].billedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `items[].billedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].billedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:181` |
| `items[].approvedTotal.amount` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `items[].approvedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].submittedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:185` |
| `items[].status` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:189` |
| `items[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].hasOpenDispute` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:193` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:204` |

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

- src / modules / insurance — etapa `ctrl:ClaimsReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /insurance-claims

- **Origen:** CONTRATO
- **Nombre:** Enviar reclamo con líneas (837)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.submit` — `src/modules/insurance/presentation/controllers/claims.controller.ts:100`

### Qué es y para qué sirve (negocio)

Enviar reclamo con líneas (837). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims` la atiende `ClaimsController.submit` (src/modules/insurance/presentation/controllers/claims.controller.ts:100). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateClaimDto` (18 campos, 7 obligatorios). Delega en `ClaimsService.submitClaim`. Crea filas en insurance.insurance_claim_lines, insurance.insurance_claims. Lee authz.care_relationships, clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenant_memberships, insurance.insurance_claim_lines, insurance.insurance_claims, insurance.insurance_plan_benefits y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/claims.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimCareRelationshipGate.assertCareRelationship → PatientCareRelationshipAdapter.hasCareRelationshipForPayment → CareRelationshipsRepository.hasActiveInTenantAt | `src/modules/authz/repositories/care-relationships.repository.ts:138` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockServiceRequest | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:73` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findOfferings | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:132` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_claim_lines` | ESCRIBE | CREA | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimRepository.createLine | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:110` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimsService.replayLinkedClaim | `src/modules/insurance/application/services/claims.service.ts:277` |
| `insurance.insurance_claims` | ESCRIBE | CREA | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimRepository.createClaim | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:82` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim | `src/modules/insurance/application/services/claims.service.ts:139` |
| `insurance.insurance_plan_benefits` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimCoveragePolicy.evaluate → ClaimCoveragePolicy.benefitFor | `src/modules/insurance/application/services/claim-coverage-policy.ts:320` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → CatalogRepository.findPlanForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:129` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimAccessService.coverageForOrder → CatalogRepository.findProduct | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:80` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |
| `insurance.prior_authorization_determinations` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimCoveragePolicy.evaluate → ClaimCoveragePolicy.assertPriorAuthorization → ClaimCoveragePolicy.latestDetermination | `src/modules/insurance/application/services/claim-coverage-policy.ts:516` |
| `insurance.prior_authorization_items` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimCoveragePolicy.evaluate → ClaimCoveragePolicy.assertPriorAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:411` |
| `insurance.prior_authorization_requests` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimsService.validatePriorAuthorization | `src/modules/insurance/application/services/claims.service.ts:441` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findReservationLines | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:96` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockPharmacyOrder | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:65` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProposedSubstitutions | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:111` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findPharmacies | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:146` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProducts | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:153` |
| `practice.practices` | LEE | LEE | DIRECTA | ClaimsController.submit → ClaimsService.submitClaim → ClaimsService.assertProviderClaimScope → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |

### Cuerpo — DTO `CreateClaimDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:104` |
| `patientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:111` |
| `billingProviderEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad facturadora | `src/modules/insurance/presentation/dto/claims.dto.ts:118` |
| `claimIdentifier` | `string` | Sí | longitud máxima 80 | `@IsString()` `@MaxLength(80)` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:126` |
| `inventoryReservationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:132` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:138` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Moneda declarada por el prestador diagnóstico | `src/modules/insurance/presentation/dto/claims.dto.ts:146` |
| `priorAuthorizationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Autorización previa vinculada | `src/modules/insurance/presentation/dto/claims.dto.ts:156` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:165` |
| `lines` | `array<ClaimLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ClaimLineDto)` | 1..N líneas | `src/modules/insurance/presentation/dto/claims.dto.ts:175` |
| `lines[].lineSequence` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Secuencia única dentro del reclamo | `src/modules/insurance/presentation/dto/claims.dto.ts:31` |
| `lines[].serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:39` |
| `lines[].quantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:47` |
| `lines[].billedAmount` | `string` | Sí | — | `@IsNumberString()` | Monto facturado | `src/modules/insurance/presentation/dto/claims.dto.ts:54` |
| `lines[].inventoryReservationLineId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:60` |
| `lines[].diagnosticStudyOfferingId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:65` |
| `lines[].supportingClinicalReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:83` |
| `lines[].patientResponsibilityAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Responsabilidad del paciente | `src/modules/insurance/presentation/dto/claims.dto.ts:94` |

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
  "inventoryReservationId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "priorAuthorizationRequestId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "lines": [
    {
      "lineSequence": 1,
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "quantity": "1",
      "billedAmount": "100.00",
      "inventoryReservationLineId": "00000000-0000-4000-8000-000000000001",
      "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
      "supportingClinicalReference": "ENC-2026-00412",
      "patientResponsibilityAmount": "20.00"
    }
  ]
}
```

</details>

### Respuesta — `Promise<CreatedClaimDto>` · DTO `CreatedClaimDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/presentation/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:36` |
| `lineIds` | `array<string>` | No | — | — | IDs de líneas vinculadas en orden de lineSequence | `src/modules/insurance/presentation/dto/claims.dto.ts:458` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cobertura no encontrada |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia corresponde a otro reclamo; ConflictException: La clave de idempotencia requiere las mismas líneas; ConflictException: El pedido ya tiene un reclamo activo; ConflictException: Reclamo duplicado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reclamo sólo puede representar un pedido; PreconditionFailedException: Las secuencias de líneas deben ser únicas; PreconditionFailedException: Los ítems vinculados requieren el pedido completo; PreconditionFailedException: La moneda del importe diagnóstico debe declararse; PreconditionFailedException: El pedido debe estar confirmado y sin sustituciones pendientes antes del retiro; PreconditionFailedException: La cobertura no corresponde a la aseguradora indicada; PreconditionFailedException: La moneda de la cobertura y del pedido debe coincidir; PreconditionFailedException: La cobertura debe estar activa y vigente para presentar el reclamo; PreconditionFailedException: El reclamo debe representar exactamente el pedido y su prestador; PreconditionFailedException: Las líneas deben coincidir con las cantidades e importes del pedido; PreconditionFailedException: La autorización previa debe pertenecer a la misma cobertura y pedido; PreconditionFailedException: La cobertura del paciente no corresponde al plan del cobro |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-coverage-copays.int-spec.ts:481` |

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. GET /insurance-claims/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar una solicitud de seguro con sus ítems y su dictamen
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsReadController.getClaim` — `src/modules/insurance/presentation/controllers/claims-read.controller.ts:84`

### Qué es y para qué sirve (negocio)

Consultar una solicitud de seguro con sus ítems y su dictamen. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance-claims/{id}` la atiende `ClaimsReadController.getClaim` (src/modules/insurance/presentation/controllers/claims-read.controller.ts:84). Exige sesión con alguno de los roles BILLING_OPERATOR, SECURITY_ADMIN. Delega en `ClaimsReadService.getClaim`. Lee clinical.diagnostic_reports, clinical.service_requests, diagnostic_units.diagnostic_units, diagnostics.diagnostic_report_versions, directory.tenants, insurance.claim_adjudication_versions, insurance.claim_disputes, insurance.claim_line_adjudications y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING_OPERATOR, SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/claims-read.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/claims-read.controller.ts:84` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.resolveDuplicateStudy → DuplicateStudyDescriptionAdapter.describeByReportId → DuplicateStudyDetector.describeByReportId | `src/modules/clinical/services/duplicate-study-detector.ts:311` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.resolveDuplicateStudy → ClaimReadRepository.findSourceRequest | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:170` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.resolveScope → ClaimReadRepository.findDiagnosticUnitsByTenant | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:178` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.resolveDuplicateStudy → DuplicateStudyDescriptionAdapter.describeByReportId → DuplicateStudyDetector.describeByReportId → DuplicateStudyDetector.releasedVersionOf | `src/modules/clinical/services/duplicate-study-detector.ts:375` |
| `directory.tenants` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.resolveDuplicateStudy → DuplicateStudyDescriptionAdapter.describeByReportId → DuplicateStudyDetector.describeByReportId → DuplicateStudyDetector.describe → DuplicateStudyDetector.providerName | `src/modules/clinical/services/duplicate-study-detector.ts:425` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimReadRepository.findAdjudicationsByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:385` |
| `insurance.claim_disputes` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimReadRepository.findDisputesByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:424` |
| `insurance.claim_line_adjudications` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimReadRepository.findLineAdjudications | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:398` |
| `insurance.claim_reversals` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim | `src/modules/insurance/application/services/claims-read.service.ts:205` |
| `insurance.insurance_brokers` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.buildRows | `src/modules/insurance/application/services/claims-read.service.ts:398` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.resolveScope → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimReadRepository.findLinesByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:365` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimReadRepository.findClaimInScope | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:334` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.buildRows → ClaimReadRepository.findCoveragesByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:356` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimReadRepository.findEobsByVersionIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:413` |
| `practice.practices` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.resolveScope → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.buildRows → ClaimReadRepository.findPatientProfilesByProfileIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:163` |
| `profiles.persons` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.buildRows → ClaimReadRepository.findPersonsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.conceptMap → ClaimReadRepository.findConceptsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:186` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | ClaimsReadController.getClaim → ClaimsReadService.getClaim → ClaimsReadService.resolveDuplicateStudy → DuplicateStudyDescriptionAdapter.describeByReportId → DuplicateStudyDetector.describeByReportId → DuplicateStudyDetector.describe → DuplicateStudyDetector.designationOrDisplay → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ClaimDetailDto>` · DTO `ClaimDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `header` | `ClaimListItemDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:462` |
| `header.id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:122` |
| `header.claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:126` |
| `header.patient` | `ClaimPatientDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:130` |
| `header.patient.id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:87` |
| `header.patient.displayName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:96` |
| `header.patient.patientCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:100` |
| `header.patient.memberIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:104` |
| `header.carrierName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:134` |
| `header.insuranceCarrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:138` |
| `header.carrierWhatsappNumber` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:146` |
| `header.carrierCallCenterPhone` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:150` |
| `header.carrierSupportEmail` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:154` |
| `header.policyIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:158` |
| `header.policyBrokerName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:167` |
| `header.billedTotal` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:171` |
| `header.billedTotal.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `header.billedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `header.billedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `header.billedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `header.approvedTotal` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:181` |
| `header.approvedTotal.amount` | `string` | Sí | — | — | — | sin fuente |
| `header.approvedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `header.approvedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `header.approvedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `header.submittedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:185` |
| `header.status` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:189` |
| `header.status.code` | `string` | Sí | — | — | — | sin fuente |
| `header.status.display` | `string` | Sí | — | — | — | sin fuente |
| `header.hasOpenDispute` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:193` |
| `lines` | `array<ClaimLineViewDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:466` |
| `lines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:256` |
| `lines[].lineSequence` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:260` |
| `lines[].service` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:264` |
| `lines[].service.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].service.display` | `string` | Sí | — | — | — | sin fuente |
| `lines[].billedAmount` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:268` |
| `lines[].billedAmount.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `lines[].billedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `lines[].billedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].billedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `lines[].patientResponsibilityAmount` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:272` |
| `lines[].patientResponsibilityAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `lines[].patientResponsibilityAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `lines[].patientResponsibilityAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].patientResponsibilityAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `lines[].approvedAmount` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:276` |
| `lines[].approvedAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `lines[].approvedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `lines[].approvedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].approvedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `lines[].deniedAmount` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:280` |
| `lines[].deniedAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `lines[].deniedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `lines[].deniedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].deniedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `lines[].decision` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:284` |
| `lines[].decision.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].decision.display` | `string` | Sí | — | — | — | sin fuente |
| `lines[].denialReason` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:288` |
| `lines[].denialReason.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].denialReason.display` | `string` | Sí | — | — | — | sin fuente |
| `lines[].policyClauseReference` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:297` |
| `lines[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:301` |
| `lines[].referenceType` | `string` | Sí | valores: DIAGNOSTIC_STUDY, MEDICATION_DISPENSATION; admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:314` |
| `lines[].reference` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:318` |
| `lines[].duplicateStudy` | `ClaimLineDuplicateStudyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:327` |
| `lines[].duplicateStudy.previousDiagnosticReportId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `lines[].duplicateStudy.studyName` | `string` | Sí | — | — | — | sin fuente |
| `lines[].duplicateStudy.performedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `lines[].duplicateStudy.daysAgo` | `number` | Sí | — | — | — | sin fuente |
| `lines[].duplicateStudy.providerName` | `string` | Sí | — | — | — | sin fuente |
| `lines[].duplicateStudy.justification` | `string` | Sí | admite null | — | — | sin fuente |
| `lines[].duplicateStudy.reused` | `boolean` | Sí | — | — | — | sin fuente |
| `lineBilledTotal` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:470` |
| `lineBilledTotal.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `lineBilledTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `lineBilledTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `lineBilledTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `lineApprovedTotal` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:474` |
| `lineApprovedTotal.amount` | `string` | Sí | — | — | — | sin fuente |
| `lineApprovedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `lineApprovedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `lineApprovedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudication` | `ClaimAdjudicationDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:478` |
| `adjudication.id` | `string` | Sí | formato uuid | — | — | sin fuente |
| `adjudication.adjudicationVersion` | `number` | Sí | — | — | — | sin fuente |
| `adjudication.outcome` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `adjudication.outcome.code` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.outcome.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.dispositionText` | `string` | Sí | admite null | — | — | sin fuente |
| `adjudication.totalApprovedAmount` | `MoneyDto` | Sí | admite null | — | — | sin fuente |
| `adjudication.totalApprovedAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.totalApprovedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `adjudication.totalApprovedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.totalApprovedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.totalPatientAmount` | `MoneyDto` | Sí | admite null | — | — | sin fuente |
| `adjudication.totalPatientAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.totalPatientAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `adjudication.totalPatientAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.totalPatientAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.totalDeniedAmount` | `MoneyDto` | Sí | admite null | — | — | sin fuente |
| `adjudication.totalDeniedAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.totalDeniedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `adjudication.totalDeniedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.totalDeniedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudication.adjudicatedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `adjudicationHistory` | `array<ClaimAdjudicationDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:482` |
| `adjudicationHistory[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:334` |
| `adjudicationHistory[].adjudicationVersion` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:338` |
| `adjudicationHistory[].outcome` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:342` |
| `adjudicationHistory[].outcome.code` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].outcome.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].dispositionText` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:346` |
| `adjudicationHistory[].totalApprovedAmount` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:350` |
| `adjudicationHistory[].totalApprovedAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].totalApprovedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `adjudicationHistory[].totalApprovedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].totalApprovedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].totalPatientAmount` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:354` |
| `adjudicationHistory[].totalPatientAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].totalPatientAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `adjudicationHistory[].totalPatientAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].totalPatientAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].totalDeniedAmount` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:358` |
| `adjudicationHistory[].totalDeniedAmount.amount` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].totalDeniedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `adjudicationHistory[].totalDeniedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].totalDeniedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `adjudicationHistory[].adjudicatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:362` |
| `disputes` | `array<ClaimDisputeSummaryDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:486` |
| `disputes[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:369` |
| `disputes[].disputeType` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:373` |
| `disputes[].disputeType.code` | `string` | Sí | — | — | — | sin fuente |
| `disputes[].disputeType.display` | `string` | Sí | — | — | — | sin fuente |
| `disputes[].disputeReason` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:377` |
| `disputes[].disputeReason.code` | `string` | Sí | — | — | — | sin fuente |
| `disputes[].disputeReason.display` | `string` | Sí | — | — | — | sin fuente |
| `disputes[].status` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:381` |
| `disputes[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `disputes[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `disputes[].submittedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:385` |
| `disputes[].filingDeadline` | `string` | Sí | formato date; admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:389` |
| `settlement` | `ClaimSettlementBreakdownDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:496` |
| `settlement.availability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:420` |
| `settlement.totalBilledAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:424` |
| `settlement.totalApprovedAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:427` |
| `settlement.totalPatientAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:430` |
| `settlement.totalDeniedAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:433` |
| `settlement.reconciled` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:436` |
| `settlement.exclusions` | `array<ClaimExclusionDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:439` |
| `settlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:395` |
| `settlement.exclusions[].itemName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:398` |
| `settlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/insurance/presentation/dto/claims-read.dto.ts:401` |
| `settlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:404` |
| `settlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:407` |
| `eob` | `ClaimEobDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:500` |
| `eob.id` | `string` | Sí | formato uuid | — | — | sin fuente |
| `eob.publishedAt` | `string` | Sí | formato date-time | — | — | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /insurance-claims/{id}/adjudications

- **Origen:** CONTRATO
- **Nombre:** Adjudicar reclamo por línea (835)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.adjudicate` — `src/modules/insurance/presentation/controllers/claims.controller.ts:150`

### Qué es y para qué sirve (negocio)

Adjudicar reclamo por línea (835). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/adjudications` la atiende `ClaimsController.adjudicate` (src/modules/insurance/presentation/controllers/claims.controller.ts:150). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateAdjudicationDto` (14 campos, 4 obligatorios). Delega en `ClaimsService.adjudicate`. Crea filas en insurance.claim_adjudication_versions, insurance.claim_line_adjudications. Lee clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenant_memberships, insurance.claim_adjudication_versions, insurance.insurance_carriers, insurance.insurance_claim_lines, insurance.insurance_claims y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/claims.controller.ts:150` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/claims.controller.ts:150` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockServiceRequest | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:73` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findOfferings | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:132` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimAccessService.assertInsurer → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.claim_adjudication_versions` | ESCRIBE | CREA | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimRepository.createVersion | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:152` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimRepository.latestVersion | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:135` |
| `insurance.claim_line_adjudications` | ESCRIBE | CREA | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimRepository.createLineAdjudication | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:173` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → ClaimsService.assertLegacyClaimParty → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation | `src/modules/insurance/application/services/claims.service.ts:474` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → ClaimRepository.findClaim | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:30` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.validateCurrentOrder → LinkedClaimAccessService.coverageForOrder → CatalogRepository.findPlan | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:120` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.validateCurrentOrder → LinkedClaimAccessService.coverageForOrder → CatalogRepository.findProduct | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:80` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.validateCurrentOrder → LinkedClaimAccessService.coverageForOrder → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findReservationLines | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:96` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockPharmacyOrder | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:65` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProposedSubstitutions | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:111` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findPharmacies | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:146` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProducts | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:153` |
| `practice.practices` | LEE | LEE | DIRECTA | ClaimsController.adjudicate → ClaimsService.adjudicate → ClaimsService.claimForMutation → ClaimsService.assertLegacyClaimParty → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAdjudicationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: APPROVED, DENIED | `@IsIn(['APPROVED', 'DENIED'])` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:301` |
| `dispositionText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:324` |
| `totalApprovedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:332` |
| `totalPatientAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:340` |
| `totalDeniedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:348` |
| `lineAdjudications` | `array<LineAdjudicationDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => LineAdjudicationDto)` | Una por línea del reclamo | `src/modules/insurance/presentation/dto/claims.dto.ts:361` |
| `lineAdjudications[].insuranceClaimLineId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea del reclamo adjudicada | `src/modules/insurance/presentation/dto/claims.dto.ts:185` |
| `lineAdjudications[].decision` | `string` | Sí | valores: APPROVED, DENIED | `@IsIn(['APPROVED', 'DENIED'])` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:192` |
| `lineAdjudications[].reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo catalogado de la denegación (concepto de terminology). El catálogo interno todavía no declara sus miembros — AC-16-8. | `src/modules/insurance/presentation/dto/claims.dto.ts:217` |
| `lineAdjudications[].policyClauseReference` | `string` | No | longitud mínima 1; longitud máxima 255 | `@ValidateIf( (o: LineAdjudicationDto) => o.decision === 'DENIED' \|\| o.policyClauseReference !== undefined, )` `@IsNotEmpty({ message: 'La referencia de cláusula contractual es obligatoria al denegar una prestación', })` `@IsString()` `@MaxLength(255)` | Cita textual de la cláusula contractual que fundamenta la exclusión. Obligatoria cuando decision === DENIED. | `src/modules/insurance/presentation/dto/claims.dto.ts:250` |
| `lineAdjudications[].denialRationale` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Fundamentación circunstanciada de la exclusión, por ítem. | `src/modules/insurance/presentation/dto/claims.dto.ts:267` |
| `lineAdjudications[].approvedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:275` |
| `lineAdjudications[].patientAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:283` |
| `lineAdjudications[].deniedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:291` |

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
  "dispositionText": "Prestaciones cubiertas por el plan familiar.",
  "totalApprovedAmount": "80.00",
  "totalPatientAmount": "20.00",
  "totalDeniedAmount": "0.00",
  "lineAdjudications": [
    {
      "insuranceClaimLineId": "00000000-0000-4000-8000-000000000001",
      "decision": "APPROVED",
      "reasonConceptId": "00000000-0000-4000-8000-000000000001",
      "policyClauseReference": "Cláusula 12.3: Medicamento no cubierto en plan ambulatorio",
      "denialRationale": "El principio activo solicitado no está contemplado en el vademécum de cobertura ambulatoria contratado.",
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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Línea de reclamo no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reclamo sólo puede representar un pedido; PreconditionFailedException: El reclamo no está en estado adjudicable; PreconditionFailedException: El pedido cambió; se requiere revisar el reclamo; PreconditionFailedException: La cobertura no corresponde a la aseguradora indicada; PreconditionFailedException: La moneda de la cobertura y del pedido debe coincidir; PreconditionFailedException: La cobertura debe estar activa y vigente para presentar el reclamo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /insurance-claims/{id}/disputes

- **Origen:** CONTRATO
- **Nombre:** Abrir disputa sobre adjudicación
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.openDispute` — `src/modules/insurance/presentation/controllers/claims.controller.ts:220`

### Qué es y para qué sirve (negocio)

Abrir disputa sobre adjudicación. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/disputes` la atiende `ClaimsController.openDispute` (src/modules/insurance/presentation/controllers/claims.controller.ts:220). Exige sesión con alguno de los roles BILLING, FINANCE, BILLING_OPERATOR, SECURITY_ADMIN, PATIENT. Valida el cuerpo como `ClaimDisputeDto` (5 campos, 1 obligatorio). Delega en `ClaimsService.openDispute`, `PatientChargeObjectionService.object`. Crea filas en insurance.claim_disputes, messaging.domain_events, messaging.outbox_messages. Lee insurance.claim_disputes, insurance.insurance_claims, insurance.patient_coverages, messaging.outbox_messages, practice.practices, profiles.patient_profiles, profiles.person_account_links. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE, BILLING_OPERATOR, SECURITY_ADMIN, PATIENT | `src/modules/insurance/presentation/controllers/claims.controller.ts:220` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/claims.controller.ts:220` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_disputes` | ESCRIBE | CREA | DIRECTA | ClaimsController.openDispute → ClaimsService.openDispute → ClaimRepository.createDispute | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:287` |
| `insurance.claim_disputes` | LEE | LEE | DIRECTA | ClaimsController.openDispute → ClaimsService.openDispute → ClaimRepository.findOpenDispute | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:275` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.openDispute → ClaimsService.openDispute → ClaimRepository.findClaimForUpdate | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:51` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsController.openDispute → PatientChargeObjectionService.object → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClaimsController.openDispute → PatientChargeObjectionService.object → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClaimsController.openDispute → PatientChargeObjectionService.object → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClaimsController.openDispute → PatientChargeObjectionService.object → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.practices` | LEE | LEE | DIRECTA | ClaimsController.openDispute → PatientChargeObjectionService.object → PracticeTenantLookupAdapter.findTenantOfPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClaimsController.openDispute → PatientChargeObjectionService.object → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClaimsController.openDispute → PatientChargeObjectionService.object → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/insurance/infrastructure/adapters/claim-decision-publisher.adapter.ts:13` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ClaimDisputeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `claimAdjudicationVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión de adjudicación disputada | `src/modules/insurance/presentation/dto/claims.dto.ts:419` |
| `initiatedBy` | `string` | Sí | valores: PROVIDER, PATIENT | `@IsIn(['PROVIDER', 'PATIENT'])` | Parte que inicia | `src/modules/insurance/presentation/dto/claims.dto.ts:429` |
| `initiatedByEntityId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:437` |
| `filingDeadline` | `string` | No | formato date | `@IsOptional()` `@IsString()` | Fecha límite de presentación | `src/modules/insurance/presentation/dto/claims.dto.ts:449` |
| `objectionReason` | `string` | No | valores: AMOUNT_DIFFERS, SERVICE_NOT_RECEIVED, NOT_INFORMED | `@IsOptional()` `@IsIn(PATIENT_OBJECTION_REASONS)` | Motivo de la objeción del paciente. Por defecto, NOT_INFORMED. Lo ignora la apelación del prestador. | `src/modules/insurance/presentation/dto/claim-dispute.dto.ts:31` |

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
  "filingDeadline": "2026-07-31",
  "objectionReason": "AMOUNT_DIFFERS"
}
```

</details>

### Respuesta — `Promise<ResourceStatusDto>` · DTO `ResourceStatusDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/presentation/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil o la plataforma pueden modificarlo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El reclamo fue revertido: ya no hay un cobro que objetar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. POST /insurance-claims/{id}/eob

- **Origen:** CONTRATO
- **Nombre:** Publicar Explicación de Beneficios (EOB)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.publishEob` — `src/modules/insurance/presentation/controllers/claims.controller.ts:168`

### Qué es y para qué sirve (negocio)

Publicar Explicación de Beneficios (EOB). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/eob` la atiende `ClaimsController.publishEob` (src/modules/insurance/presentation/controllers/claims.controller.ts:168). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `PublishEobDto` (1 campo, 0 obligatorios). Delega en `ClaimsService.publishEob`. Crea filas en insurance.patient_explanations_of_benefit. Lee clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenant_memberships, insurance.claim_adjudication_versions, insurance.claim_line_adjudications, insurance.claim_reversals, insurance.insurance_carriers y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/claims.controller.ts:168` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/claims.controller.ts:168` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockServiceRequest | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:73` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findOfferings | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:132` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimAccessService.assertInsurer → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimRepository.latestVersion | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:135` |
| `insurance.claim_line_adjudications` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob | `src/modules/insurance/application/services/claims.service.ts:610` |
| `insurance.claim_reversals` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob | `src/modules/insurance/application/services/claims.service.ts:608` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → ClaimsService.assertLegacyClaimParty → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation | `src/modules/insurance/application/services/claims.service.ts:474` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → ClaimRepository.findClaim | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:30` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.validateCurrentOrder → LinkedClaimAccessService.coverageForOrder → CatalogRepository.findPlan | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:120` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.validateCurrentOrder → LinkedClaimAccessService.coverageForOrder → CatalogRepository.findProduct | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:80` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |
| `insurance.patient_explanations_of_benefit` | ESCRIBE | CREA | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimRepository.createEob | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:209` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimRepository.findEob | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:193` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findReservationLines | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:96` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockPharmacyOrder | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:65` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProposedSubstitutions | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:111` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findPharmacies | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:146` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProducts | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:153` |
| `practice.practices` | LEE | LEE | DIRECTA | ClaimsController.publishEob → ClaimsService.publishEob → ClaimsService.claimForMutation → ClaimsService.assertLegacyClaimParty → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishEobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `documentRecordId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento generado (object storage) | `src/modules/insurance/presentation/dto/claims.dto.ts:375` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La EOB ya fue publicada para esta versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reclamo sólo puede representar un pedido; PreconditionFailedException: No existe adjudicación vigente para publicar; PreconditionFailedException: El pedido cambió; se requiere revisar el reclamo; PreconditionFailedException: La cobertura no corresponde a la aseguradora indicada; PreconditionFailedException: La moneda de la cobertura y del pedido debe coincidir; PreconditionFailedException: La cobertura debe estar activa y vigente para presentar el reclamo; PreconditionFailedException: El reclamo está revertido; PreconditionFailedException: La cobertura del paciente no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /insurance-claims/{id}/patient-invoice

- **Origen:** CONTRATO
- **Nombre:** Facturar al paciente su parte de un servicio reclamado
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.issuePatientInvoice` — `src/modules/insurance/presentation/controllers/claims.controller.ts:125`

### Qué es y para qué sirve (negocio)

Facturar al paciente su parte de un servicio reclamado. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/patient-invoice` la atiende `ClaimsController.issuePatientInvoice` (src/modules/insurance/presentation/controllers/claims.controller.ts:125). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `IssuePatientInvoiceDto` (3 campos, 1 obligatorio). Delega en `ClaimPatientInvoiceService.issue`. Crea filas en billing.invoice_lines, billing.invoices, messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages. Actualiza iam.devices. Lee billing.invoice_lines, iam.devices, insurance.insurance_claim_lines, insurance.insurance_claims, insurance.insurance_plan_benefits, insurance.patient_coverages, insurance.prior_authorization_determinations, insurance.prior_authorization_items y 9 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/claims.controller.ts:125` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/claims.controller.ts:125` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.invoice_lines` | ESCRIBE | CREA | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → BillingPatientInvoiceAdapter.issuePatientInvoice → InvoicesRepository.createLine | `src/modules/billing/repositories/invoices.repository.ts:318` |
| `billing.invoice_lines` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → BillingPatientInvoiceAdapter.findInvoiceLineByClaimLine | `src/modules/insurance/infrastructure/adapters/billing-patient-invoice.adapter.ts:32` |
| `billing.invoices` | ESCRIBE | CREA | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → BillingPatientInvoiceAdapter.issuePatientInvoice → InvoicesRepository.create | `src/modules/billing/repositories/invoices.repository.ts:287` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimRepository.findLine | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:97` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimRepository.findClaimForUpdate | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:51` |
| `insurance.insurance_plan_benefits` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.benefitFor | `src/modules/insurance/application/services/claim-coverage-policy.ts:320` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |
| `insurance.prior_authorization_determinations` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization → ClaimCoveragePolicy.latestDetermination | `src/modules/insurance/application/services/claim-coverage-policy.ts:516` |
| `insurance.prior_authorization_items` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:411` |
| `insurance.prior_authorization_requests` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:393` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → ClaimPatientInvoiceService.issueLocked → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClaimsController.issuePatientInvoice → ClaimPatientInvoiceService.issue → PatientNoticeAdapter.notifyPatient → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/insurance/infrastructure/adapters/claim-decision-publisher.adapter.ts:13` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IssuePatientInvoiceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `claimLineId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea del reclamo que se le factura al paciente | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:28` |
| `patientAmount` | `string` | No | patrón runtime MONEY_PATTERN | `@IsOptional()` `@Matches(MONEY_PATTERN, { message: 'patientAmount debe ser un importe con hasta dos decimales', })` | Confirmación del importe mostrado. Nunca se usa como monto: si difiere del cálculo del servidor, 422. | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:39` |
| `description` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Texto de la línea de factura; por defecto lo arma el servidor. | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "claimLineId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "claimLineId": "00000000-0000-4000-8000-000000000001",
  "patientAmount": "140.00",
  "description": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<PatientInvoiceIssuedDto>` · DTO `PatientInvoiceIssuedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `invoiceId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:58` |
| `invoiceLineId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:61` |
| `invoiceNumber` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:64` |
| `claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:67` |
| `claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:70` |
| `chargeKind` | `string` | Sí | valores: INSURED_SHARE, PRIVATE_FULL | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:73` |
| `billedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:76` |
| `coveragePercent` | `object` | No | admite null | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:79` |
| `copayAmount` | `object` | No | admite null | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:82` |
| `patientAmount` | `string` | Sí | — | — | Lo que paga el paciente | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:85` |
| `insurerAmount` | `string` | Sí | — | — | Lo que paga la aseguradora | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:88` |
| `currencyConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/claim-patient-invoice.dto.ts:91` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El proveedor configurado para el canal in-app no existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cobertura del paciente no corresponde al plan del cobro; PreconditionFailedException: {outcome.message}; PreconditionFailedException: No hay canal in-app activo: falta correr el seed de mensajería; PreconditionFailedException: El canal in-app no tiene configuración de proveedor activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. POST /insurance-claims/{id}/reversals

- **Origen:** CONTRATO
- **Nombre:** Registrar reversión de reclamo
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.reverse` — `src/modules/insurance/presentation/controllers/claims.controller.ts:186`

### Qué es y para qué sirve (negocio)

Registrar reversión de reclamo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/{id}/reversals` la atiende `ClaimsController.reverse` (src/modules/insurance/presentation/controllers/claims.controller.ts:186). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateReversalDto` (3 campos, 1 obligatorio). Delega en `ClaimsService.reverse`. Crea filas en insurance.claim_reversals. Lee clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenant_memberships, insurance.claim_adjudication_versions, insurance.insurance_carriers, insurance.insurance_claim_lines, insurance.insurance_claims y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/claims.controller.ts:186` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/claims.controller.ts:186` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockServiceRequest | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:73` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findOfferings | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:132` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimAccessService.assertInsurer → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimRepository.findVersion | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:128` |
| `insurance.claim_reversals` | ESCRIBE | CREA | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimRepository.createReversal | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:231` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → ClaimsService.assertLegacyClaimParty → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation | `src/modules/insurance/application/services/claims.service.ts:474` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → ClaimRepository.findClaim | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:30` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findReservationLines | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:96` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockPharmacyOrder | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:65` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProposedSubstitutions | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:111` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findPharmacies | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:146` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProducts | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:153` |
| `practice.practices` | LEE | LEE | DIRECTA | ClaimsController.reverse → ClaimsService.reverse → ClaimsService.claimForMutation → ClaimsService.assertLegacyClaimParty → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateReversalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reversedAdjudicationVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión de adjudicación a revertir | `src/modules/insurance/presentation/dto/claims.dto.ts:388` |
| `reversalAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:396` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:405` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de adjudicación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reclamo sólo puede representar un pedido; PreconditionFailedException: El reclamo no está en estado reversible; PreconditionFailedException: Sólo puede revertirse la versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. POST /insurance-claims/quote

- **Origen:** CONTRATO
- **Nombre:** Cotizar un cobro a la aseguradora (sin guardar)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClaimsController.quote` — `src/modules/insurance/presentation/controllers/claims.controller.ts:81`

### Qué es y para qué sirve (negocio)

Cotizar un cobro a la aseguradora (sin guardar). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-claims/quote` la atiende `ClaimsController.quote` (src/modules/insurance/presentation/controllers/claims.controller.ts:81). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `ClaimQuoteDto` (12 campos, 5 obligatorios). Delega en `ClaimQuoteService.quote`. Lee authz.care_relationships, insurance.insurance_claim_lines, insurance.insurance_claims, insurance.insurance_plan_benefits, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages, insurance.prior_authorization_determinations y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/claims.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → ClaimCareRelationshipGate.assertCareRelationship → PatientCareRelationshipAdapter.hasCareRelationshipForPayment → CareRelationshipsRepository.hasActiveInTenantAt | `src/modules/authz/repositories/care-relationships.repository.ts:138` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization → ClaimCoveragePolicy.billedUnderAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:500` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization → ClaimCoveragePolicy.billedUnderAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:495` |
| `insurance.insurance_plan_benefits` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.benefitFor | `src/modules/insurance/application/services/claim-coverage-policy.ts:320` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → CatalogRepository.findPlanForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:129` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → CatalogRepository.findPlanForCarrier → CatalogRepository.findProductForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:89` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |
| `insurance.prior_authorization_determinations` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization → ClaimCoveragePolicy.latestDetermination | `src/modules/insurance/application/services/claim-coverage-policy.ts:516` |
| `insurance.prior_authorization_items` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:411` |
| `insurance.prior_authorization_requests` | LEE | LEE | DIRECTA | ClaimsController.quote → ClaimQuoteService.quote → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:393` |

### Cuerpo — DTO `ClaimQuoteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:40` |
| `patientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:44` |
| `priorAuthorizationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Aprobación previa que se piensa vincular al cobro | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:52` |
| `lines` | `array<ClaimLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ClaimLineDto)` | 1..N líneas. `patientResponsibilityAmount` se ignora: lo calcula el servidor. | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:63` |
| `lines[].lineSequence` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Secuencia única dentro del reclamo | `src/modules/insurance/presentation/dto/claims.dto.ts:31` |
| `lines[].serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:39` |
| `lines[].quantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:47` |
| `lines[].billedAmount` | `string` | Sí | — | `@IsNumberString()` | Monto facturado | `src/modules/insurance/presentation/dto/claims.dto.ts:54` |
| `lines[].inventoryReservationLineId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:60` |
| `lines[].diagnosticStudyOfferingId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:65` |
| `lines[].supportingClinicalReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/insurance/presentation/dto/claims.dto.ts:83` |
| `lines[].patientResponsibilityAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Responsabilidad del paciente | `src/modules/insurance/presentation/dto/claims.dto.ts:94` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "patientCoverageId": "00000000-0000-4000-8000-000000000001",
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
  "priorAuthorizationRequestId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "lineSequence": 1,
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "quantity": "1",
      "billedAmount": "100.00",
      "inventoryReservationLineId": "00000000-0000-4000-8000-000000000001",
      "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
      "supportingClinicalReference": "ENC-2026-00412",
      "patientResponsibilityAmount": "20.00"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ClaimQuoteResultDto>` · DTO `ClaimQuoteResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `canSubmit` | `boolean` | Sí | — | — | Todas las líneas se podrían enviar hoy. Si es `false`, el botón «Enviar a la aseguradora» debe quedar deshabilitado y explicar el motivo. | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:130` |
| `currencyConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:133` |
| `totalBilledAmount` | `object` | No | admite null | — | `null` si algún monto no es un decimal válido. | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:140` |
| `totalPatientAmount` | `object` | No | admite null | — | `null` mientras alguna línea no tenga reparto calculable. | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:147` |
| `totalInsurerAmount` | `object` | No | admite null | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:150` |
| `lines` | `array<ClaimQuoteLineResultDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:153` |
| `lines[].lineSequence` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:69` |
| `lines[].serviceConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:72` |
| `lines[].billedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:75` |
| `lines[].covered` | `boolean` | Sí | — | — | El plan cubre el servicio y el reparto se pudo calcular. No implica que el cobro se pueda enviar: mire `reason`. | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:81` |
| `lines[].coveragePercent` | `object` | No | admite null | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:84` |
| `lines[].copayAmount` | `object` | No | admite null | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:87` |
| `lines[].deductibleAmount` | `object` | No | admite null | — | Informativo: el deducible todavía no se aplica al reparto (decisión del propietario). | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:95` |
| `lines[].requiresPriorAuthorization` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:98` |
| `lines[].priorAuthorizationStatus` | `string` | No | valores: NOT_REQUIRED, APPROVED, MISSING, PENDING, DENIED, EXPIRED, MISMATCH, AMOUNT_EXCEEDED; admite null | — | `null` si el servicio no tiene beneficio vigente. | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:105` |
| `lines[].patientAmount` | `object` | No | admite null | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:108` |
| `lines[].insurerAmount` | `object` | No | admite null | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:111` |
| `lines[].reason` | `object` | No | admite null | — | Motivo tipificado por el que esta línea no se podría cobrar (por ejemplo `PRIOR_AUTHORIZATION_REQUIRED`). | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:118` |
| `lines[].message` | `object` | No | admite null | — | — | `src/modules/insurance/presentation/dto/claim-quote.dto.ts:121` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Las secuencias de líneas deben ser únicas; PreconditionFailedException: La cobertura no corresponde a la aseguradora indicada; PreconditionFailedException: La cobertura del paciente no corresponde al plan del cobro |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /insurance-plans/{planId}/benefits

- **Origen:** CONTRATO
- **Nombre:** Crear una cobertura de un plan administrable
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createBenefit` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:174`

### Qué es y para qué sirve (negocio)

Crear una cobertura de un plan administrable. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-plans/{planId}/benefits` la atiende `InsuranceBackboneController.createBenefit` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:174). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreatePlanBenefitDto` (9 campos, 1 obligatorio). Delega en `InsuranceBackboneService.createBenefit`. Crea filas en insurance.insurance_plan_benefits. Lee directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:174` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:174` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceBackboneController.createBenefit → InsuranceBackboneService.createBenefit → InsuranceBackboneService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createBenefit → InsuranceBackboneService.createBenefit → InsuranceBackboneService.administrableCarrier → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plan_benefits` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createBenefit → InsuranceBackboneService.createBenefit → CatalogRepository.createBenefit | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:179` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceBackboneController.createBenefit → InsuranceBackboneService.createBenefit → CatalogRepository.findPlanForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:129` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceBackboneController.createBenefit → InsuranceBackboneService.createBenefit → CatalogRepository.findPlanForCarrier → CatalogRepository.findProductForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:89` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePlanBenefitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `benefitCategoryConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:202` |
| `serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:208` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:216` |
| `effectiveTo` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` `@IsOnOrAfter('effectiveFrom', { message: 'effectiveTo debe ser igual o posterior a effectiveFrom', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:225` |
| `requiresPriorAuthorization` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere autorización previa | `src/modules/insurance/presentation/dto/backbone.dto.ts:233` |
| `coveragePercent` | `string` | No | patrón runtime COVERAGE_PATTERN | `@IsOptional()` `@IsNumberString()` `@Matches(COVERAGE_PATTERN, { message: 'coveragePercent debe estar entre 0 y 100 con hasta dos decimales', })` | Porcentaje de cobertura | `src/modules/insurance/presentation/dto/backbone.dto.ts:247` |
| `copayAmount` | `string` | No | patrón runtime MONEY_PATTERN | `@IsOptional()` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'copayAmount debe ser no negativo y tener hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:256` |
| `deductibleAmount` | `string` | No | patrón runtime MONEY_PATTERN | `@IsOptional()` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'deductibleAmount debe ser no negativo y tener hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:266` |
| `annualLimitAmount` | `string` | No | patrón runtime MONEY_PATTERN | `@IsOptional()` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'annualLimitAmount debe ser no negativo y tener hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:276` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "benefitCategoryConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "benefitCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31",
  "effectiveTo": "2026-07-31",
  "requiresPriorAuthorization": true,
  "coveragePercent": "80",
  "copayAmount": "25.00",
  "deductibleAmount": "100.00",
  "annualLimitAmount": "5000.00"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada; ResourceNotFoundException: Plan no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:160` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. PUT /insurance-plans/{planId}/benefits/{benefitId}

- **Origen:** CONTRATO
- **Nombre:** Editar importes de una cobertura
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.updateBenefit` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:191`

### Qué es y para qué sirve (negocio)

Editar importes de una cobertura. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PUT /insurance-plans/{planId}/benefits/{benefitId}` la atiende `InsuranceBackboneController.updateBenefit` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:191). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdatePlanBenefitDto` (4 campos, 4 obligatorios). Delega en `InsuranceBackboneService.updateBenefit`. Actualiza insurance.insurance_plan_benefits. Lee directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plan_benefits, insurance.insurance_plans, insurance.insurance_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:191` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId, benefitId | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:191` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefit → InsuranceBackboneService.updateBenefit → InsuranceBackboneService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefit → InsuranceBackboneService.updateBenefit → InsuranceBackboneService.administrableCarrier → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plan_benefits` | ESCRIBE | ACTUALIZA | POR_TIPO | InsuranceBackboneController.updateBenefit → InsuranceBackboneService.updateBenefit | `src/modules/insurance/application/services/insurance-backbone.service.ts:327` |
| `insurance.insurance_plan_benefits` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefit → InsuranceBackboneService.updateBenefit → CatalogRepository.findBenefitForPlanAndCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:148` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefit → InsuranceBackboneService.updateBenefit → CatalogRepository.findBenefitForPlanAndCarrier → CatalogRepository.findPlanForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:129` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefit → InsuranceBackboneService.updateBenefit → CatalogRepository.findBenefitForPlanAndCarrier → CatalogRepository.findPlanForCarrier → CatalogRepository.findProductForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:89` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |
| `benefitId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdatePlanBenefitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `coveragePercent` | `string` | Sí | patrón runtime COVERAGE_PATTERN; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsNumberString()` `@Matches(COVERAGE_PATTERN, { message: 'coveragePercent debe estar entre 0 y 100 con hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:287` |
| `copayAmount` | `string` | Sí | patrón runtime MONEY_PATTERN; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'copayAmount debe ser no negativo y tener hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:295` |
| `deductibleAmount` | `string` | Sí | patrón runtime MONEY_PATTERN; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'deductibleAmount debe ser no negativo y tener hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:304` |
| `annualLimitAmount` | `string` | Sí | patrón runtime MONEY_PATTERN; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'annualLimitAmount debe ser no negativo y tener hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:313` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "coveragePercent": "80.00",
  "copayAmount": "25.00",
  "deductibleAmount": "100.00",
  "annualLimitAmount": "5000.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "coveragePercent": "80.00",
  "copayAmount": "25.00",
  "deductibleAmount": "100.00",
  "annualLimitAmount": "5000.00"
}
```

</details>

### Respuesta — `Promise<OkResultDto>` · DTO `OkResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/insurance/presentation/dto/common.dto.ts:45` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada; ResourceNotFoundException: Beneficio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:171` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. PUT /insurance-plans/{planId}/benefits/{benefitId}/rules

- **Origen:** CONTRATO
- **Nombre:** Editar reglas de aprobación de una cobertura
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.updateBenefitRules` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:208`

### Qué es y para qué sirve (negocio)

Editar reglas de aprobación de una cobertura. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PUT /insurance-plans/{planId}/benefits/{benefitId}/rules` la atiende `InsuranceBackboneController.updateBenefitRules` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:208). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdatePlanBenefitRulesDto` (3 campos, 3 obligatorios). Delega en `InsuranceBackboneService.updateBenefitRules`. Actualiza insurance.insurance_plan_benefits. Lee directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plan_benefits, insurance.insurance_plans, insurance.insurance_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:208` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId, benefitId | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:208` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefitRules → InsuranceBackboneService.updateBenefitRules → InsuranceBackboneService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefitRules → InsuranceBackboneService.updateBenefitRules → InsuranceBackboneService.administrableCarrier → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plan_benefits` | ESCRIBE | ACTUALIZA | POR_TIPO | InsuranceBackboneController.updateBenefitRules → InsuranceBackboneService.updateBenefitRules | `src/modules/insurance/application/services/insurance-backbone.service.ts:369` |
| `insurance.insurance_plan_benefits` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefitRules → InsuranceBackboneService.updateBenefitRules → CatalogRepository.findBenefitForPlanAndCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:148` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefitRules → InsuranceBackboneService.updateBenefitRules → CatalogRepository.findBenefitForPlanAndCarrier → CatalogRepository.findPlanForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:129` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceBackboneController.updateBenefitRules → InsuranceBackboneService.updateBenefitRules → CatalogRepository.findBenefitForPlanAndCarrier → CatalogRepository.findPlanForCarrier → CatalogRepository.findProductForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:89` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |
| `benefitId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdatePlanBenefitRulesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requiresPriorAuthorization` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:348` |
| `requiredDocuments` | `array<string>` | Sí | — | `@IsArray()` `@ArrayUnique()` `@IsIn(APPROVAL_DOCUMENT_CODES, { each: true })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:354` |
| `exclusionNotes` | `string` | Sí | longitud máxima 1000; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsString()` `@MaxLength(1000)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:360` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "requiresPriorAuthorization": true,
  "requiredDocuments": [
    "FIRMA_MEDICO"
  ],
  "exclusionNotes": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "requiresPriorAuthorization": true,
  "requiredDocuments": [
    "FIRMA_MEDICO"
  ],
  "exclusionNotes": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<OkResultDto>` · DTO `OkResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/insurance/presentation/dto/common.dto.ts:45` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada; ResourceNotFoundException: Beneficio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:181` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. PUT /insurance-plans/{planId}/premium

- **Origen:** CONTRATO
- **Nombre:** Declarar la prima de lista mensual de un plan administrable
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.updatePlanPremium` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:230`

### Qué es y para qué sirve (negocio)

Declarar la prima de lista mensual de un plan administrable. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PUT /insurance-plans/{planId}/premium` la atiende `InsuranceBackboneController.updatePlanPremium` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:230). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdatePlanPremiumDto` (1 campo, 1 obligatorio). Delega en `InsuranceBackboneService.updatePlanPremium`. Actualiza insurance.insurance_plans. Lee directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:230` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:230` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceBackboneController.updatePlanPremium → InsuranceBackboneService.updatePlanPremium → InsuranceBackboneService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.updatePlanPremium → InsuranceBackboneService.updatePlanPremium → InsuranceBackboneService.administrableCarrier → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | InsuranceBackboneController.updatePlanPremium → InsuranceBackboneService.updatePlanPremium | `src/modules/insurance/application/services/insurance-backbone.service.ts:287` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceBackboneController.updatePlanPremium → InsuranceBackboneService.updatePlanPremium → CatalogRepository.findPlanForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:129` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceBackboneController.updatePlanPremium → InsuranceBackboneService.updatePlanPremium → CatalogRepository.findPlanForCarrier → CatalogRepository.findProductForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:89` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdatePlanPremiumDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `monthlyPremiumAmount` | `string` | Sí | patrón runtime MONEY_PATTERN; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'monthlyPremiumAmount debe ser no negativo y tener hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:331` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "monthlyPremiumAmount": "350.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "monthlyPremiumAmount": "350.00"
}
```

</details>

### Respuesta — `Promise<PlanPremiumDto>` · DTO `PlanPremiumDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:337` |
| `monthlyPremiumAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:341` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada; ResourceNotFoundException: Plan no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /insurance-products/{productId}/plans

- **Origen:** CONTRATO
- **Nombre:** Crear un plan del carrier del tenant activo
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createPlan` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:150`

### Qué es y para qué sirve (negocio)

Crear un plan del carrier del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance-products/{productId}/plans` la atiende `InsuranceBackboneController.createPlan` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:150). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreatePlanDto` (6 campos, 2 obligatorios). Delega en `InsuranceBackboneService.createPlan`. Crea filas en insurance.insurance_plans. Lee directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:150` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: productId | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:150` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceBackboneController.createPlan → InsuranceBackboneService.createPlan → InsuranceBackboneService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createPlan → InsuranceBackboneService.createPlan → InsuranceBackboneService.administrableCarrier → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plans` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createPlan → InsuranceBackboneService.createPlan → CatalogRepository.createPlan | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:161` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceBackboneController.createPlan → InsuranceBackboneService.createPlan → CatalogRepository.findProductForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:89` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `productId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `planCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:128` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:137` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Vigencia desde (ISO date) | `src/modules/insurance/presentation/dto/backbone.dto.ts:149` |
| `effectiveTo` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` `@IsOnOrAfter('effectiveFrom', { message: 'effectiveTo debe ser igual o posterior a effectiveFrom', })` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:158` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:175` |
| `monthlyPremiumAmount` | `string` | No | patrón runtime MONEY_PATTERN | `@IsOptional()` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'monthlyPremiumAmount debe ser no negativo y tener hasta dos decimales', })` | Prima de lista mensual del plan, en la moneda del plan | `src/modules/insurance/presentation/dto/backbone.dto.ts:194` |

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
  "effectiveFrom": "2026-07-31",
  "effectiveTo": "2026-07-31",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "monthlyPremiumAmount": "350.00"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada; ResourceNotFoundException: Producto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:149` |
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:85` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceBackboneController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. GET /insurance/analytics/loss-ratio

- **Origen:** CONTRATO
- **Nombre:** Tablero de siniestralidad, gasto per cápita y epidemiología de la aseguradora del tenant activo
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceAnalyticsController.getLossRatioAnalytics` — `src/modules/insurance/presentation/controllers/insurance-analytics.controller.ts:40`

### Qué es y para qué sirve (negocio)

Tablero de siniestralidad, gasto per cápita y epidemiología de la aseguradora del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/analytics/loss-ratio` la atiende `InsuranceAnalyticsController.getLossRatioAnalytics` (src/modules/insurance/presentation/controllers/insurance-analytics.controller.ts:40). Exige sesión; el controlador no declara roles. Delega en `InsuranceAnalyticsService.getLossRatioAnalytics`. Lee clinical.appointments, clinical.conditions, clinical.encounters, clinical.immunizations, directory.tenant_memberships, insurance.claim_adjudication_versions, insurance.coverage_dependents, insurance.insurance_carriers y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-analytics.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.appointments` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.specialties | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:474` |
| `clinical.conditions` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.prevalentPathologies | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:555` |
| `clinical.encounters` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.specialties | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:474` |
| `clinical.immunizations` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.immunization | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:634` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.claim_adjudication_versions` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.kpis | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:166` |
| `insurance.coverage_dependents` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.kpis | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:166` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claim_lines` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.topMedications | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:409` |
| `insurance.insurance_claims` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.dominantCurrency | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:127` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → CatalogRepository.findPlanForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:129` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → CatalogRepository.findPlanForCarrier → CatalogRepository.findProductForCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:89` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.dominantCurrency | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:127` |
| `pharmacy_inventory.medication_dispensation_lines` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.topMedications | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:409` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.topMedications | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:409` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.specialties | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:474` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.topMedications | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:409` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.prevalentPathologies | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:555` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | InsuranceAnalyticsController.getLossRatioAnalytics → InsuranceAnalyticsService.getLossRatioAnalytics → InsuranceAnalyticsRepository.prevalentPathologies | `src/modules/insurance/infrastructure/repositories/insurance-analytics.repository.ts:555` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `startDate` | query | No | `string` | Fecha de inicio del periodo (inclusive). Sin ella: 12 meses atrás. |
| `endDate` | query | No | `string` | Fecha de fin del periodo (inclusive). Sin ella: hoy en La Paz. |
| `planId` | query | No | `string` | Acota el tablero a un plan del carrier del tenant activo. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InsuranceDashboardAnalyticsResponseDto>` · DTO `InsuranceDashboardAnalyticsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `carrierId` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:235` |
| `carrierLegalName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:238` |
| `startDate` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:241` |
| `endDate` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:244` |
| `currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:253` |
| `currency.code` | `string` | Sí | — | — | — | sin fuente |
| `currency.display` | `string` | Sí | — | — | — | sin fuente |
| `kpis` | `LossRatioKpiDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:256` |
| `kpis.totalClaimsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:53` |
| `kpis.adjudicatedClaimsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:57` |
| `kpis.pendingClaimsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:61` |
| `kpis.otherCurrencyClaimsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:69` |
| `kpis.totalBilledAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:73` |
| `kpis.totalApprovedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:77` |
| `kpis.totalPatientCopayAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:81` |
| `kpis.totalDeniedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:85` |
| `kpis.approvalRatePercent` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:89` |
| `kpis.activeAffiliatesCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:93` |
| `kpis.periodMonths` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:97` |
| `kpis.averageMonthlyPerCapitaExpense` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:101` |
| `kpis.averageAnnualPerCapitaExpense` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:105` |
| `kpis.estimatedPremiumsTotal` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:114` |
| `kpis.coveragesWithoutPremiumCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:118` |
| `kpis.lossRatioPercent` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:122` |
| `monthlyTrends` | `array<MonthlyTrendDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:259` |
| `monthlyTrends[].period` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:128` |
| `monthlyTrends[].billedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:131` |
| `monthlyTrends[].approvedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:134` |
| `monthlyTrends[].claimsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:137` |
| `topMedications` | `array<TopMedicationDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:262` |
| `topMedications[].medicationCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:150` |
| `topMedications[].medicationName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:153` |
| `topMedications[].dispensationsCount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:157` |
| `topMedications[].totalExpenseAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:160` |
| `topMedications[].sharePercent` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:164` |
| `specialties` | `array<SpecialtyDistributionDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:265` |
| `specialties[].specialtyCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:178` |
| `specialties[].specialtyName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:181` |
| `specialties[].consultationsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:184` |
| `specialties[].totalExpenseAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:188` |
| `prevalentPathologies` | `array<PrevalentPathologyDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:268` |
| `prevalentPathologies[].code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:199` |
| `prevalentPathologies[].description` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:202` |
| `prevalentPathologies[].casesCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:206` |
| `prevalentPathologies[].percentage` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:210` |
| `immunization` | `ImmunizationRateDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:271` |
| `immunization.vaccinatedCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:222` |
| `immunization.unvaccinatedCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:225` |
| `immunization.vaccinationRatePercent` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-analytics.dto.ts:229` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Rol insuficiente para ver la analítica de la aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aseguradora no encontrada; ResourceNotFoundException: Plan no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: startDate debe ser anterior o igual a endDate |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. GET /insurance/campaigns

- **Origen:** CONTRATO
- **Nombre:** Listar las campañas de la aseguradora activa
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.list` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:77`

### Qué es y para qué sirve (negocio)

Listar las campañas de la aseguradora activa. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns` la atiende `InsuranceCampaignsController.list` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:77). Exige sesión; el controlador no declara roles. Delega en `InsuranceCampaignsService.list`. Crea filas en audit.audit_log. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsRepository.listRowsByCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:233` |
| `insurance.insurance_campaigns` | LEE | LEE | POR_SQL | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsRepository.listRowsByCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:233` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.list → InsuranceCampaignsService.list → InsuranceCampaignsRepository.listRowsByCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:233` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `type` | query | No | `string` | — |
| `status` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InsuranceCampaignPageDto>` · DTO `InsuranceCampaignPageDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<InsuranceCampaignResponseDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:388` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `items[].title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `items[].description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `items[].campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `items[].status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `items[].effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `items[].targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `items[].targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `items[].validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `items[].validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `items[].activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `items[].partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `items[].partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `items[].partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `items[].partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `items[].partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `items[].partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `items[].updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:392` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: Cursor inválido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:225` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. POST /insurance/campaigns

- **Origen:** CONTRATO
- **Nombre:** Crear una campaña preventiva de la aseguradora
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.create` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:61`

### Qué es y para qué sirve (negocio)

Crear una campaña preventiva de la aseguradora. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance/campaigns` la atiende `InsuranceCampaignsController.create` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:61). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateInsuranceCampaignDto` (15 campos, 10 obligatorios). Delega en `InsuranceCampaignsService.create`. Crea filas en audit.audit_log, insurance.insurance_campaign_partners, insurance.insurance_campaigns. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, insurance.network_provider_memberships, insurance.provider_networks y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.createPartner | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:151` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.detail → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |
| `insurance.insurance_campaigns` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.createCampaign | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:131` |
| `insurance.insurance_campaigns` | LEE | LEE | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.findByCarrierAndCode | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:102` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.administrableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.network_provider_memberships` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.assertPartnersBelongToCarrier → InsuranceCampaignsRepository.membershipBelongsToCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:374` |
| `insurance.provider_networks` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsService.assertPartnersBelongToCarrier → InsuranceCampaignsRepository.membershipBelongsToCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:374` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | InsuranceCampaignsController.create → InsuranceCampaignsService.create → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |

### Cuerpo — DTO `CreateInsuranceCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | patrón runtime /^[A-Z0-9][A-Z0-9-]{2,39}$/ | `@Matches(/^[A-Z0-9][A-Z0-9-]{2,39}$/, { message: 'El código debe tener de 3 a 40 caracteres: mayúsculas, dígitos y guiones', })` | Único por aseguradora; mayúsculas, dígitos y guiones. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:118` |
| `title` | `string` | Sí | longitud mínima 3; longitud máxima 200 | `@IsString()` `@Length(3, 200)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:125` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:131` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | `@IsIn(CAMPAIGN_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:135` |
| `targetConditionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:145` |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(100)` | Porcentaje del copago que la aseguradora bonifica. 100 = copago Bs. 0. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:158` |
| `validFrom` | `string` | Sí | formato date; patrón runtime DATE_ONLY | `@Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:163` |
| `validTo` | `string` | Sí | formato date; patrón runtime DATE_ONLY | `@Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:168` |
| `partners` | `array<InsuranceCampaignPartnerInputDto>` | Sí | mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => InsuranceCampaignPartnerInputDto)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:176` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | `@IsIn(CAMPAIGN_PARTNER_ROLES)` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:78` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | `@IsIn(CAMPAIGN_PARTNER_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:82` |
| `partners[].name` | `string` | Sí | longitud mínima 2; longitud máxima 160 | `@IsString()` `@Length(2, 160)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:87` |
| `partners[].partnerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:96` |
| `partners[].networkProviderMembershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía de la red de prestadores de la aseguradora, si aplica. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:105` |
| `activate` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es true, la campaña nace ACTIVE en vez de DRAFT. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:184` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "campaignType": "LABORATORY",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CMP-CARDIO-2026",
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "activate": false
}
```

</details>

### Respuesta — `Promise<InsuranceCampaignResponseDto>` · DTO `InsuranceCampaignResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: validTo debe ser igual o posterior a validFrom; BadRequestException: No se puede activar una campaña cuya vigencia ya terminó; BadRequestException: El código CIE-10 {code} no está en el catálogo |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, INSURANCE_OPERATOR con membresía activa, o administrador de la plataforma; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campaña no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una campaña con ese código en la aseguradora |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La membresía de red del aliado no pertenece a esta aseguradora |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:194` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. GET /insurance/campaigns/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar una campaña de la aseguradora activa
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.getById` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:148`

### Qué es y para qué sirve (negocio)

Consultar una campaña de la aseguradora activa. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns/{id}` la atiende `InsuranceCampaignsController.getById` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:148). Exige sesión; el controlador no declara roles. Delega en `InsuranceCampaignsService.getById`. Crea filas en audit.audit_log. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:148` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.auditDenied → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |
| `insurance.insurance_campaigns` | LEE | LEE | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.assertNotCrossTenant → InsuranceCampaignsRepository.findAnyById | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:123` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsService.readableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.getById → InsuranceCampaignsService.getById → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InsuranceCampaignResponseDto>` · DTO `InsuranceCampaignResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora; ForbiddenException: La campaña pertenece a otra aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campaña no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:214` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. PATCH /insurance/campaigns/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una campaña en borrador o pausada (422 si está activa o vencida)
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.update` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:178`

### Qué es y para qué sirve (negocio)

Editar una campaña en borrador o pausada (422 si está activa o vencida). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PATCH /insurance/campaigns/{id}` la atiende `InsuranceCampaignsController.update` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:178). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateInsuranceCampaignDto` (13 campos, 0 obligatorios). Delega en `InsuranceCampaignsService.update`. Crea filas en audit.audit_log, insurance.insurance_campaign_partners. Actualiza insurance.insurance_campaigns. Borra de insurance.insurance_campaign_partners. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, insurance.network_provider_memberships, insurance.provider_networks y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:178` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | BORRA | BORRA | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.deletePartners | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:143` |
| `insurance.insurance_campaign_partners` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.createPartner | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:151` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.detail → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |
| `insurance.insurance_campaigns` | ESCRIBE | ACTUALIZA | POR_TIPO | InsuranceCampaignsController.update → InsuranceCampaignsService.update | `src/modules/insurance/application/services/insurance-campaigns.service.ts:387` |
| `insurance.insurance_campaigns` | LEE | LEE | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.requireOwnedEntity → InsuranceCampaignsRepository.findEntityForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:111` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.administrableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.network_provider_memberships` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.assertPartnersBelongToCarrier → InsuranceCampaignsRepository.membershipBelongsToCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:374` |
| `insurance.provider_networks` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsService.assertPartnersBelongToCarrier → InsuranceCampaignsRepository.membershipBelongsToCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:374` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | InsuranceCampaignsController.update → InsuranceCampaignsService.update → InsuranceCampaignsRepository.resolveIcd10ConceptId | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:167` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateInsuranceCampaignDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@Length(3, 200)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:206` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:212` |
| `campaignType` | `string` | No | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | `@IsOptional()` `@IsIn(CAMPAIGN_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:217` |
| `targetConditionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código CIE-10 de la patología que se previene. Sólo descriptivo: no filtra afiliados (D4). | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:227` |
| `copayBonusPercentage` | `number` | No | mínimo 0; máximo 100 | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(100)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:239` |
| `validFrom` | `string` | No | formato date; patrón runtime DATE_ONLY | `@IsOptional()` `@Matches(DATE_ONLY, { message: 'validFrom debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:245` |
| `validTo` | `string` | No | formato date; patrón runtime DATE_ONLY | `@IsOptional()` `@Matches(DATE_ONLY, { message: 'validTo debe ser AAAA-MM-DD' })` `@IsISO8601({ strict: true })` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:251` |
| `partners` | `array<InsuranceCampaignPartnerInputDto>` | No | mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => InsuranceCampaignPartnerInputDto)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:260` |
| `partners[].role` | `string` | No | valores: SPONSOR, PROVIDER | `@IsIn(CAMPAIGN_PARTNER_ROLES)` | SPONSOR = importadora o fabricante que financia; PROVIDER = donde el afiliado se atiende | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:78` |
| `partners[].type` | `string` | No | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | `@IsIn(CAMPAIGN_PARTNER_TYPES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:82` |
| `partners[].name` | `string` | No | longitud mínima 2; longitud máxima 160 | `@IsString()` `@Length(2, 160)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:87` |
| `partners[].partnerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia blanda al tenant del aliado, si es un tenant del sistema. Sin FK física. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:96` |
| `partners[].networkProviderMembershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía de la red de prestadores de la aseguradora, si aplica. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:105` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "title": "Chequeo Preventivo Cardiovascular y Perfil Lipídico",
  "description": "Texto descriptivo de ejemplo",
  "campaignType": "LABORATORY",
  "targetConditionCode": "I10",
  "copayBonusPercentage": 100,
  "validFrom": "2026-09-25",
  "validTo": "2026-11-24",
  "partners": [
    {
      "role": "SPONSOR",
      "type": "IMPORTER",
      "name": "Laboratorio Central AloVida",
      "partnerTenantId": "00000000-0000-4000-8000-000000000001",
      "networkProviderMembershipId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<InsuranceCampaignResponseDto>` · DTO `InsuranceCampaignResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: validTo debe ser igual o posterior a validFrom; BadRequestException: El código CIE-10 {code} no está en el catálogo |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, INSURANCE_OPERATOR con membresía activa, o administrador de la plataforma; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora; ForbiddenException: La campaña pertenece a otra aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campaña no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una campaña en estado {current} no se puede editar; pausela primero; PreconditionFailedException: La membresía de red del aliado no pertenece a esta aseguradora |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:334` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. PATCH /insurance/campaigns/{id}/status

- **Origen:** CONTRATO
- **Nombre:** Activar, pausar o finalizar una campaña (transiciones cerradas)
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.changeStatus` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:159`

### Qué es y para qué sirve (negocio)

Activar, pausar o finalizar una campaña (transiciones cerradas). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`PATCH /insurance/campaigns/{id}/status` la atiende `InsuranceCampaignsController.changeStatus` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:159). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateInsuranceCampaignStatusDto` (1 campo, 1 obligatorio). Delega en `InsuranceCampaignsService.changeStatus`. Crea filas en audit.audit_log. Actualiza insurance.insurance_campaigns. Lee audit.audit_log, directory.tenant_memberships, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:159` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsService.administrableCarrier → DirectoryTenantAdministrationAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |
| `insurance.insurance_campaigns` | ESCRIBE | ACTUALIZA | POR_TIPO | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus | `src/modules/insurance/application/services/insurance-campaigns.service.ts:324` |
| `insurance.insurance_campaigns` | LEE | LEE | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsService.requireOwnedEntity → InsuranceCampaignsRepository.findEntityForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:111` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsService.administrableCarrier → InsuranceCampaignsService.carrierOf → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.changeStatus → InsuranceCampaignsService.changeStatus → InsuranceCampaignsRepository.getRowForCarrier | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:186` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateInsuranceCampaignStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: ACTIVE, PAUSED, EXPIRED | `@IsIn(CAMPAIGN_TARGET_STATUSES)` | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:191` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "ACTIVE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "ACTIVE"
}
```

</details>

### Respuesta — `Promise<InsuranceCampaignResponseDto>` · DTO `InsuranceCampaignResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:335` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:338` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:341` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:344` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:347` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:350` |
| `effectiveStatus` | `string` | Sí | valores: DRAFT, ACTIVE, PAUSED, EXPIRED | — | EXPIRED si validTo ya pasó, aunque `status` siga ACTIVE/PAUSED: el vencimiento es por fecha, no por transición (CA-04). No hay cron. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:358` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:361` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:364` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:367` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:370` |
| `activatedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:373` |
| `partners` | `array<InsuranceCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:376` |
| `partners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:317` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:320` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:323` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:326` |
| `partners[].networkProviderMembershipId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:329` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:379` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere operar dentro de una aseguradora: indique el X-Tenant-Id de su organización; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, INSURANCE_OPERATOR con membresía activa, o administrador de la plataforma; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma; ForbiddenException: La organización activa no es una aseguradora; ForbiddenException: La campaña pertenece a otra aseguradora |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campaña no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una campaña en estado {current} no puede pasar a {target}; PreconditionFailedException: La campaña ya venció: no se puede activar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:248` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. GET /insurance/campaigns/active

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.listActive` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:93`

### Qué es y para qué sirve (negocio)

Campañas vigentes de cualquier aseguradora (o de una, con `carrierId`). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns/active` la atiende `InsuranceCampaignsController.listActive` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:93). Es una ruta pública: no exige token. Delega en `InsuranceCampaignsService.listActivePublic`. Lee insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:93` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listActive → InsuranceCampaignsService.listActivePublic → InsuranceCampaignsRepository.listPublicActiveRows | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:353` |
| `insurance.insurance_campaigns` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listActive → InsuranceCampaignsService.listActivePublic → InsuranceCampaignsRepository.listPublicActiveRows | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:353` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listActive → InsuranceCampaignsService.listActivePublic → InsuranceCampaignsRepository.listPublicActiveRows | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:353` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listActive → InsuranceCampaignsService.listActivePublic → InsuranceCampaignsRepository.listPublicActiveRows | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:353` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `carrierId` | query | No | `string` | Acota a una aseguradora. Sin filtro, trae de todas. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientCampaignDto[]>` · DTO `PatientCampaignDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:416` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:419` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:422` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:425` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:428` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:431` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:434` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:437` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:440` |
| `carrierName` | `string` | Sí | — | — | Nombre de la aseguradora que ofrece la campaña. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:445` |
| `partners` | `array<PatientCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:448` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:398` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:401` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:404` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:348` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. GET /insurance/campaigns/my-benefits

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de mi aseguradora, para el afiliado autenticado
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.myBenefits` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:108`

### Qué es y para qué sirve (negocio)

Campañas vigentes de mi aseguradora, para el afiliado autenticado. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns/my-benefits` la atiende `InsuranceCampaignsController.myBenefits` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:108). Exige sesión; el controlador no declara roles. Delega en `InsuranceCampaignsService.listMyBenefits`. Crea filas en audit.audit_log. Lee audit.audit_log, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |
| `insurance.insurance_campaigns` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.myBenefits → InsuranceCampaignsService.listMyBenefits → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientCampaignDto[]>` · DTO `PatientCampaignDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:416` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:419` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:422` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:425` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:428` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:431` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:434` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:437` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:440` |
| `carrierName` | `string` | Sí | — | — | Nombre de la aseguradora que ofrece la campaña. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:445` |
| `partners` | `array<PatientCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:448` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:398` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:401` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:404` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La cuenta no tiene un perfil de paciente asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 47. GET /insurance/campaigns/patient/{patientProfileId}

- **Origen:** CONTRATO
- **Nombre:** Campañas vigentes de la aseguradora del afiliado (sólo el titular)
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceCampaignsController.listForPatient` — `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:129`

### Qué es y para qué sirve (negocio)

Campañas vigentes de la aseguradora del afiliado (sólo el titular). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/campaigns/patient/{patientProfileId}` la atiende `InsuranceCampaignsController.listForPatient` (src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:129). Exige sesión; el controlador no declara roles. Delega en `InsuranceCampaignsService.listActiveForPatient`. Crea filas en audit.audit_log. Lee audit.audit_log, iam.sessions, insurance.insurance_campaign_partners, insurance.insurance_campaigns, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:129` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → AuditTrailAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.insurance_campaign_partners` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |
| `insurance.insurance_campaigns` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.findCurrentCarrierIdsForPatient | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:265` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsService.assertOwnership → PatientOwnershipAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsuranceCampaignsController.listForPatient → InsuranceCampaignsService.listActiveForPatient → InsuranceCampaignsRepository.listActiveRowsForCarriers | `src/modules/insurance/infrastructure/repositories/insurance-campaigns.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientCampaignDto[]>` · DTO `PatientCampaignDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:416` |
| `code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:419` |
| `title` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:422` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:425` |
| `campaignType` | `string` | Sí | valores: LABORATORY, PHARMACY, DIAGNOSTIC_IMAGING, VACCINATION | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:428` |
| `targetCondition` | `InsuranceCampaignConditionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:431` |
| `targetCondition.code` | `string` | Sí | — | — | — | sin fuente |
| `targetCondition.display` | `string` | Sí | admite null | — | — | sin fuente |
| `copayBonusPercentage` | `number` | Sí | mínimo 0; máximo 100 | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:434` |
| `validFrom` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:437` |
| `validTo` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:440` |
| `carrierName` | `string` | Sí | — | — | Nombre de la aseguradora que ofrece la campaña. | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:445` |
| `partners` | `array<PatientCampaignPartnerDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:448` |
| `partners[].role` | `string` | Sí | valores: SPONSOR, PROVIDER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:398` |
| `partners[].type` | `string` | Sí | valores: IMPORTER, MANUFACTURER, LABORATORY, PHARMACY, MEDICAL_CENTER | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:401` |
| `partners[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-campaigns.dto.ts:404` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil o la plataforma pueden modificarlo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsuranceCampaignsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 48. GET /insurance/my-claims

- **Origen:** CONTRATO
- **Nombre:** Solicitudes de seguro propias, con su dictamen vigente
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MyClaimsController.listMyClaims` — `src/modules/insurance/presentation/controllers/my-claims.controller.ts:30`

### Qué es y para qué sirve (negocio)

Solicitudes de seguro propias, con su dictamen vigente. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/my-claims` la atiende `MyClaimsController.listMyClaims` (src/modules/insurance/presentation/controllers/my-claims.controller.ts:30). Exige sesión; el controlador no declara roles. Delega en `MyClaimsService.list`. Lee clinical.encounters, diagnostic_units.diagnostic_units, iam.users, insurance.claim_adjudication_versions, insurance.claim_disputes, insurance.insurance_carriers, insurance.insurance_claim_lines, insurance.insurance_claims y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/my-claims.controller.ts:30` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/insurance/presentation/controllers/my-claims.controller.ts:30` |
| CABECERA | x-tenant-id (obligatoria) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → ClaimReadRepository.findEncountersByPractitioner | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:132` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readCenter → ClaimReadRepository.findActiveDiagnosticUnitsForTenant | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:143` |
| `iam.users` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → InsurerReceivedClaimsService.buildMyItems → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findUsersByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:493` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → InsurerReceivedClaimsService.buildMyItems → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findAdjudicationsByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:385` |
| `insurance.claim_disputes` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → PatientChargeBreakdownService.read | `src/modules/insurance/application/services/patient-charge-breakdown.service.ts:84` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → InsurerReceivedClaimsService.buildMyItems → ClaimReadRepository.findCarriersByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:347` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → PatientChargeBreakdownService.read | `src/modules/insurance/application/services/patient-charge-breakdown.service.ts:79` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims | `src/modules/insurance/application/services/my-claims.service.ts:140` |
| `insurance.insurance_plan_benefits` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → PatientChargeBreakdownService.read → PatientChargeBreakdownService.breakdownOf → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.benefitFor | `src/modules/insurance/application/services/claim-coverage-policy.ts:320` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → InsurerReceivedClaimsService.buildMyItems → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPlansByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:487` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list | `src/modules/insurance/application/services/my-claims.service.ts:76` |
| `insurance.prior_authorization_determinations` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → PatientChargeBreakdownService.read → PatientChargeBreakdownService.breakdownOf → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization → ClaimCoveragePolicy.latestDetermination | `src/modules/insurance/application/services/claim-coverage-policy.ts:516` |
| `insurance.prior_authorization_items` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → PatientChargeBreakdownService.read → PatientChargeBreakdownService.breakdownOf → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:411` |
| `insurance.prior_authorization_requests` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → PatientChargeBreakdownService.read → PatientChargeBreakdownService.breakdownOf → ClaimCoveragePolicy.quoteLine → ClaimCoveragePolicy.assertPriorAuthorization | `src/modules/insurance/application/services/claim-coverage-policy.ts:393` |
| `practice.practices` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → InsurerReceivedClaimsService.buildMyItems → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPracticesByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:469` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → InsurerReceivedClaimsService.buildMyItems → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPatientProfilesByProfileIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:163` |
| `profiles.persons` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → InsurerReceivedClaimsService.buildMyItems → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPersonsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:155` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → InsurerReceivedClaimsService.buildMyItems → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findSpecialtiesByPractitionerIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:456` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | MyClaimsController.listMyClaims → MyClaimsService.list → MyClaimsService.readClaims → PatientChargeBreakdownService.read → PatientChargeBreakdownService.conceptNames → ClaimReadRepository.findConceptsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:186` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `x-tenant-id` | header | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyClaimListDto>` · DTO `MyClaimListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `view` | `string` | Sí | valores: PATIENT, PRACTITIONER, LABORATORY, IMAGING, NONE | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:201` |
| `items` | `array<MyClaimDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:204` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:142` |
| `items[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:145` |
| `items[].patientName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:148` |
| `items[].practitioner` | `MyClaimPractitionerDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:151` |
| `items[].practitioner.displayName` | `string` | Sí | — | — | — | sin fuente |
| `items[].practitioner.specialty` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].providerName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:154` |
| `items[].service` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:157` |
| `items[].service.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].service.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].additionalServiceCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:160` |
| `items[].billedTotal` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:163` |
| `items[].billedTotal.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `items[].billedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `items[].billedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].billedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:166` |
| `items[].approvedTotal.amount` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `items[].approvedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].submittedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:169` |
| `items[].serviceDate` | `string` | Sí | formato date; admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:172` |
| `items[].insurerName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:175` |
| `items[].planName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:178` |
| `items[].status` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:181` |
| `items[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].decision` | `MyClaimDecisionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:184` |
| `items[].decision.outcome` | `string` | Sí | valores: APPROVED, PARTIAL, REJECTED | — | — | sin fuente |
| `items[].decision.decidedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `items[].decision.reason` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].breakdown` | `MyClaimBreakdownDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:191` |
| `items[].breakdown.currencyCode` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].breakdown.patientTotal` | `string` | Sí | — | — | — | sin fuente |
| `items[].breakdown.insurerTotal` | `string` | Sí | — | — | — | sin fuente |
| `items[].breakdown.lines` | `array<MyClaimBreakdownLineDto>` | Sí | — | — | — | sin fuente |
| `items[].breakdown.lines[].key` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:50` |
| `items[].breakdown.lines[].service` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:54` |
| `items[].breakdown.lines[].billedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:58` |
| `items[].breakdown.lines[].coveragePercent` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:62` |
| `items[].breakdown.lines[].copayAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:66` |
| `items[].breakdown.lines[].patientAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:70` |
| `items[].breakdown.lines[].insurerAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:74` |
| `items[].breakdown.lines[].chargeKind` | `string` | Sí | valores: INSURED_SHARE, PRIVATE_FULL | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:78` |
| `items[].breakdown.lines[].authorizationStatus` | `string` | Sí | valores: NOT_REQUIRED, APPROVED, MISSING, PENDING, DENIED, EXPIRED, MISMATCH, AMOUNT_EXCEEDED; admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:86` |
| `items[].patientObjection` | `MyClaimObjectionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:195` |
| `items[].patientObjection.id` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].patientObjection.reason` | `string` | Sí | valores: AMOUNT_DIFFERS, SERVICE_NOT_RECEIVED, NOT_INFORMED | — | — | sin fuente |
| `items[].patientObjection.submittedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `items[].patientObjection.status` | `string` | Sí | valores: OPEN, RESOLVED | — | — | sin fuente |
| `truncated` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/my-claims.dto.ts:207` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: X-Tenant-Id debe ser un UUID |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No hay acceso a las solicitudes del tenant indicado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/insurance/presentation/controllers/my-claims.controller.spec.ts:19` |

### Flujos

- src / modules / insurance — etapa `ctrl:MyClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 49. POST /insurance/patients/conversation

- **Origen:** CONTRATO
- **Nombre:** Abrir o reutilizar la conversación interna con un paciente autorizado
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurerPatientsController.openConversation` — `src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:74`

### Qué es y para qué sirve (negocio)

Abrir o reutilizar la conversación interna con un paciente autorizado. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance/patients/conversation` la atiende `InsurerPatientsController.openConversation` (src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:74). Exige sesión; el controlador no declara roles. Valida el cuerpo como `InsurerPatientConversationDto` (2 campos, 2 obligatorios). Delega en `InsurerPatientsService.openConversation`. Crea filas en audit.data_access_log, community.conversation_participants, community.conversations. Lee common.contact_points, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, directory.tenant_memberships, directory.tenants, iam.users y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:74` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → InsurerPatientsService.recordAccess → PatientDirectoryAdapter.record → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `common.contact_points` | LEE | LEE | POR_SQL | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → PatientDirectoryAdapter.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → PatientDirectoryAdapter.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → PatientDirectoryAdapter.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → PatientDirectoryAdapter.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | LEE | LEE | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → PatientDirectoryAdapter.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.user_blocks` | LEE | LEE | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → PatientDirectoryAdapter.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → InsurerPatientsService.resolveScope → InsurerContextService.resolve → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `directory.tenants` | LEE | LEE | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → PatientDirectoryAdapter.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |
| `iam.users` | LEE | LEE | POR_SQL | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation | `src/modules/insurance/application/services/insurer-patients.service.ts:428` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → InsurerPatientsService.resolveScope → InsurerContextService.resolve → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `profiles.persons` | LEE | LEE | POR_SQL | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsurerPatientsController.openConversation → InsurerPatientsService.openConversation → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |

### Cuerpo — DTO `InsurerPatientConversationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:181` |
| `channel` | `string` | Sí | valores: internal | `@IsIn(['internal'])` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:184` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "internal"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "internal"
}
```

</details>

### Respuesta — `Promise<InsurerPatientConversationResponseDto>` · DTO `InsurerPatientConversationResponseDto` · HTTP `200`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversationId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:189` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {accessDenied}; ForbiddenException: {ACCESS_DENIED}; ForbiddenException: Una organización no inicia conversaciones por este canal |
| 404 | `NOT_FOUND` | NotFoundException: Paciente no disponible |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La mensajería no está disponible para estos perfiles; PreconditionFailedException: Las conversaciones grupales se crean desde el flujo de grupos; PreconditionFailedException: Los participantes de una conversación deben ser distintos; PreconditionFailedException: Una conversación directa requiere exactamente dos participantes; PreconditionFailedException: La persona no está disponible para iniciar una conversación; PreconditionFailedException: No se puede iniciar una conversación entre perfiles bloqueados |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:306` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsurerPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. GET /insurance/patients/options

- **Origen:** CONTRATO
- **Nombre:** Aseguradoras disponibles en el alcance autorizado
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurerPatientsController.options` — `src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:59`

### Qué es y para qué sirve (negocio)

Aseguradoras disponibles en el alcance autorizado. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/patients/options` la atiende `InsurerPatientsController.options` (src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:59). Exige sesión; el controlador no declara roles. Delega en `InsurerPatientsService.options`. Lee directory.tenant_memberships, insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsurerPatientsController.options → InsurerPatientsService.options → InsurerPatientsService.resolveScope → InsurerContextService.resolve → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsurerPatientsController.options → InsurerPatientsService.options → InsurerPatientsService.resolveScope → InsurerContextService.resolve → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InsurerPatientOptionsDto>` · DTO `InsurerPatientOptionsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insurers` | `array<InsurerPatientCarrierDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:133` |
| `insurers[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:126` |
| `insurers[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:128` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {accessDenied}; ForbiddenException: {ACCESS_DENIED} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:311` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsurerPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 51. POST /insurance/patients/search

- **Origen:** CONTRATO
- **Nombre:** Consultar directorio de pacientes autorizado
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurerPatientsController.listPatients` — `src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:35`

### Qué es y para qué sirve (negocio)

Consultar directorio de pacientes autorizado. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance/patients/search` la atiende `InsurerPatientsController.listPatients` (src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:35). Exige sesión; el controlador no declara roles. Valida el cuerpo como `InsurerPatientSearchQueryDto` (11 campos, 0 obligatorios). Delega en `InsurerPatientsService.list`. Crea filas en audit.data_access_log. Lee common.contact_points, community.public_profiles, directory.tenant_memberships, iam.users, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:35` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.recordAccess → PatientDirectoryAdapter.record → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `common.contact_points` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `community.public_profiles` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.resolveScope → InsurerContextService.resolve → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.users` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.resolveScope → InsurerContextService.resolve → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readCoverages | `src/modules/insurance/application/services/insurer-patients.service.ts:278` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readCoverages | `src/modules/insurance/application/services/insurer-patients.service.ts:278` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readCoverages | `src/modules/insurance/application/services/insurer-patients.service.ts:278` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `profiles.persons` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | InsurerPatientsController.listPatients → InsurerPatientsService.list → InsurerPatientsService.readPeople | `src/modules/insurance/application/services/insurer-patients.service.ts:220` |

### Cuerpo — DTO `InsurerPatientSearchQueryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cursor` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | Cursor opaco de la página anterior | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:49` |
| `limit` | `number` | No | valores: 10, 25, 50 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@IsIn(INSURER_PATIENT_PAGE_SIZES)` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:56` |
| `search` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Nombre, teléfono o correo (contiene, sin tildes). | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:65` |
| `genderConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sexo administrativo | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:70` |
| `occupation` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Profesión de catálogo o texto libre | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:79` |
| `insuranceCarrierId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:84` |
| `birthDateFrom` | `string` | No | patrón runtime /^\d{4}-\d{2}-\d{2}$/ | `@IsOptional()` `@IsISO8601({ strict: true })` `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:90` |
| `birthDateTo` | `string` | No | patrón runtime /^\d{4}-\d{2}-\d{2}$/ | `@IsOptional()` `@IsISO8601({ strict: true })` `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:96` |
| `insuranceStatus` | `string` | No | valores: ALL, WITH_INSURANCE, NO_INSURANCE | `@IsOptional()` `@IsIn(INSURER_PATIENT_INSURANCE_STATUSES)` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:104` |
| `sortBy` | `string` | No | valores: fullName, birthDate, createdAt | `@IsOptional()` `@IsIn(INSURER_PATIENT_SORT_FIELDS)` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:112` |
| `sortDirection` | `string` | No | valores: asc, desc | `@IsOptional()` `@IsIn(INSURER_PATIENT_SORT_DIRECTIONS)` | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:120` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "cursor": "valor-ejemplo",
  "limit": 25,
  "search": "valor-ejemplo",
  "genderConceptId": "00000000-0000-4000-8000-000000000001",
  "occupation": "valor-ejemplo",
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "birthDateFrom": "1980-01-01",
  "birthDateTo": "1999-12-31",
  "insuranceStatus": "ALL",
  "sortBy": "fullName",
  "sortDirection": "asc"
}
```

</details>

### Respuesta — `Promise<InsurerPatientListDto>` · DTO `InsurerPatientListDto` · HTTP `200`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<InsurerPatientListItemDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:169` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:146` |
| `items[].fullName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:148` |
| `items[].birthDate` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:150` |
| `items[].age` | `number` | No | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:152` |
| `items[].phone` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:154` |
| `items[].email` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:156` |
| `items[].genderCode` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:158` |
| `items[].occupationDisplay` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:160` |
| `items[].insurers` | `array<InsurerPatientCarrierDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:162` |
| `items[].insurers[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:126` |
| `items[].insurers[].name` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:128` |
| `items[].messaging` | `InsurerPatientMessagingDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:164` |
| `items[].messaging.channel` | `string` | Sí | valores: internal | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:138` |
| `items[].messaging.available` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:140` |
| `total` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:171` |
| `limit` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:173` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurer-patients.dto.ts:175` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {accessDenied}; ForbiddenException: {ACCESS_DENIED} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:237` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsurerPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 52. GET /insurance/portability/certificates/{certificateId}/json

- **Origen:** CONTRATO
- **Nombre:** Descargar el certificado de portabilidad en JSON interoperable
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurancePortabilityController.downloadJson` — `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:122`

### Qué es y para qué sirve (negocio)

Descargar el certificado de portabilidad en JSON interoperable. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/portability/certificates/{certificateId}/json` la atiende `InsurancePortabilityController.downloadJson` (src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:122). Exige sesión; el controlador no declara roles. Delega en `InsurancePortabilityService.downloadJson`. Crea filas en audit.audit_log. Lee audit.audit_log, common.file_versions, common.files, health_data.health_export_jobs, health_data.health_export_manifests, iam.sessions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:122` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: certificateId | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:122` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.recordAudit → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.recordAudit → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `common.file_versions` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilitySupportAdapter.downloadFile → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilitySupportAdapter.downloadFile → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `health_data.health_export_jobs` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilityService.loadCertificate → InsurancePortabilitySupportAdapter.findExportJobById → DataReleaseRepository.findExportJobById | `src/modules/health_data/repositories/data-release.repository.ts:401` |
| `health_data.health_export_manifests` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilityService.loadCertificate → InsurancePortabilitySupportAdapter.findManifest → DataReleaseRepository.findManifest | `src/modules/health_data/repositories/data-release.repository.ts:371` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.recordAudit → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadJson → InsurancePortabilityService.downloadJson → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `certificateId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Certificado no encontrado; ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-portability.int-spec.ts:132` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsurancePortabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 53. GET /insurance/portability/certificates/{certificateId}/pdf

- **Origen:** CONTRATO
- **Nombre:** Descargar el certificado de portabilidad en PDF
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurancePortabilityController.downloadPdf` — `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:84`

### Qué es y para qué sirve (negocio)

Descargar el certificado de portabilidad en PDF. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/portability/certificates/{certificateId}/pdf` la atiende `InsurancePortabilityController.downloadPdf` (src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:84). Exige sesión; el controlador no declara roles. Delega en `InsurancePortabilityService.renderPdf`. Crea filas en audit.audit_log. Lee audit.audit_log, common.file_versions, common.files, health_data.health_export_jobs, health_data.health_export_manifests, iam.sessions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: certificateId | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:84` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.recordAudit → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.recordAudit → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `common.file_versions` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilitySupportAdapter.downloadFile → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilitySupportAdapter.downloadFile → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `health_data.health_export_jobs` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilityService.loadCertificate → InsurancePortabilitySupportAdapter.findExportJobById → DataReleaseRepository.findExportJobById | `src/modules/health_data/repositories/data-release.repository.ts:401` |
| `health_data.health_export_manifests` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilityService.loadCertificate → InsurancePortabilitySupportAdapter.findManifest → DataReleaseRepository.findManifest | `src/modules/health_data/repositories/data-release.repository.ts:371` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.recordAudit → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | InsurancePortabilityController.downloadPdf → InsurancePortabilityService.renderPdf → InsurancePortabilityService.loadCertificate → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `certificateId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Certificado no encontrado; ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:InsurancePortabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 54. POST /insurance/portability/export

- **Origen:** CONTRATO
- **Nombre:** Exportar el historial de póliza y siniestralidad del titular a 1 clic
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurancePortabilityController.export` — `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:58`

### Qué es y para qué sirve (negocio)

Exportar el historial de póliza y siniestralidad del titular a 1 clic. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance/portability/export` la atiende `InsurancePortabilityController.export` (src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:58). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RequestPortabilityExportDto` (3 campos, 1 obligatorio). Delega en `InsurancePortabilityService.export`. Crea filas en audit.audit_log, audit.data_access_log, audit.dsar_requests, common.file_versions, common.files, health_data.health_export_jobs, health_data.health_export_manifests, health_data.health_provenance_records y 2 más. Actualiza messaging.queued_jobs. Lee audit.audit_log, clinical.conditions, clinical.encounters, common.identifiers, diagnostic_units.diagnostic_units, directory.branches, directory.tenants, iam.sessions y 18 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle(EXPORT_RATE_LIMIT) | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:58` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `audit.dsar_requests` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → DsarRequestsRepository.create | `src/modules/audit/repositories/dsar-requests.repository.ts:44` |
| `clinical.conditions` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.conditionsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:241` |
| `clinical.encounters` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.encountersOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:267` |
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.storeGeneratedFile → FileUploadService.storeGenerated → FileUploadService.persistBytes → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.files` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.storeGeneratedFile → FileUploadService.storeGenerated → FileUploadService.persistBytes → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `common.identifiers` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityService.resolvePatientParts → InsurancePortabilitySupportAdapter.resolvePatientParts → IdentifiersRepository.findCurrentByOwner | `src/modules/common/repositories/identifiers.repository.ts:126` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.claimsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:164` |
| `directory.branches` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.encountersOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:267` |
| `directory.tenants` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.encountersOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:267` |
| `health_data.health_export_jobs` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → DataReleaseRepository.createExportJob | `src/modules/health_data/repositories/data-release.repository.ts:260` |
| `health_data.health_export_manifests` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → DataReleaseRepository.createExportManifest | `src/modules/health_data/repositories/data-release.repository.ts:340` |
| `health_data.health_provenance_records` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → HealthProvenanceRepository.createProvenanceRecord | `src/modules/health_data/repositories/health-provenance.repository.ts:122` |
| `health_data.health_provenance_targets` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → HealthProvenanceRepository.createProvenanceTarget | `src/modules/health_data/repositories/health-provenance.repository.ts:173` |
| `iam.sessions` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.persistExport → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `insurance.claim_adjudication_versions` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.claimsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:164` |
| `insurance.claim_line_adjudications` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.claimsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:164` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claim_lines` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.claimsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:164` |
| `insurance.insurance_claims` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.claimsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:164` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.policiesOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:123` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.policiesOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:123` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.policiesOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:123` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.storeGeneratedFile → FileUploadService.storeGenerated → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.storeGeneratedFile → FileUploadService.storeGenerated → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.storeGeneratedFile → FileUploadService.storeGenerated → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilitySupportAdapter.storeGeneratedFile → FileUploadService.storeGenerated → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.claimsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:164` |
| `practice.practices` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.claimsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:164` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityService.resolvePatientParts → InsurancePortabilitySupportAdapter.resolvePatientParts → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityService.assertOwnership → InsurancePortabilitySupportAdapter.assertOwnsPatientProfile → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityService.resolvePatientParts → InsurancePortabilitySupportAdapter.resolvePatientParts → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityService.conceptMap → InsurancePortabilityRepository.findConceptsByIds | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:114` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.conditionsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:241` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | InsurancePortabilityController.export → InsurancePortabilityService.export → InsurancePortabilityRepository.conditionsOfPatient | `src/modules/insurance/infrastructure/repositories/insurance-portability.repository.ts:241` |

### Cuerpo — DTO `RequestPortabilityExportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:27` |
| `format` | `string` | No | valores: PDF, JSON, BUNDLE | `@IsOptional()` `@IsEnum(PortabilityExportFormat)` | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:35` |
| `targetInsurerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "format": "BUNDLE",
  "targetInsurerTenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PortabilityExportResultDto>` · DTO `PortabilityExportResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `certificateId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:419` |
| `manifestHash` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:424` |
| `generatedAt` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:427` |
| `format` | `string` | Sí | valores: PDF, JSON, BUNDLE | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:430` |
| `recordCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:433` |
| `policiesCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:436` |
| `pdfDownloadUrl` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:439` |
| `jsonDownloadUrl` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:444` |
| `verificationUrl` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:449` |
| `summary` | `PortabilitySummaryDto` | Sí | — | `@ValidateNested()` `@Type(() => PortabilitySummaryDto)` | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:454` |
| `summary.currencyCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:337` |
| `summary.allTime` | `PortabilityPeriodStatsDto` | Sí | — | `@ValidateNested()` `@Type(() => PortabilityPeriodStatsDto)` | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:342` |
| `summary.allTime.claimsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:285` |
| `summary.allTime.approvedCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:288` |
| `summary.allTime.deniedCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:291` |
| `summary.allTime.pendingCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:294` |
| `summary.allTime.billedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:297` |
| `summary.allTime.coveredAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:300` |
| `summary.allTime.patientCopayAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:303` |
| `summary.allTime.deniedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:306` |
| `summary.allTime.firstClaimAt` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:309` |
| `summary.allTime.lastClaimAt` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:312` |
| `summary.allTime.coveredMonths` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:316` |
| `summary.last36Months` | `PortabilityPeriodStatsDto` | Sí | — | `@ValidateNested()` `@Type(() => PortabilityPeriodStatsDto)` | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:347` |
| `summary.last36Months.claimsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:285` |
| `summary.last36Months.approvedCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:288` |
| `summary.last36Months.deniedCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:291` |
| `summary.last36Months.pendingCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:294` |
| `summary.last36Months.billedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:297` |
| `summary.last36Months.coveredAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:300` |
| `summary.last36Months.patientCopayAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:303` |
| `summary.last36Months.deniedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:306` |
| `summary.last36Months.firstClaimAt` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:309` |
| `summary.last36Months.lastClaimAt` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:312` |
| `summary.last36Months.coveredMonths` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:316` |
| `summary.byYear` | `array<PortabilityYearStatsDto>` | Sí | — | `@ValidateNested({ each: true })` `@Type(() => PortabilityYearStatsDto)` | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:352` |
| `summary.byYear[].year` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:322` |
| `summary.byYear[].claimsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:325` |
| `summary.byYear[].billedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:328` |
| `summary.byYear[].coveredAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:331` |
| `summary.claimsOver2000Count` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:355` |
| `summary.estimatedLossRatioPercent` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:363` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil o la plataforma pueden modificarlo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La aseguradora declarada no existe; ResourceNotFoundException: Paciente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El artefacto generado no tiene contenido; PreconditionFailedException: El artefacto generado excede el tamaño máximo permitido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-portability.int-spec.ts:92` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsurancePortabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 55. GET /insurance/received-claims

- **Origen:** CONTRATO
- **Nombre:** Solicitudes de seguro recibidas por la aseguradora activa
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurerReceivedClaimsController.listReceivedClaims` — `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:67`

### Qué es y para qué sirve (negocio)

Solicitudes de seguro recibidas por la aseguradora activa. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /insurance/received-claims` la atiende `InsurerReceivedClaimsController.listReceivedClaims` (src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:67). Exige sesión; el controlador no declara roles. Delega en `InsurerReceivedClaimsService.list`. Lee clinical.encounters, diagnostic_units.diagnostic_units, directory.tenant_memberships, iam.users, insurance.claim_adjudication_versions, insurance.insurance_carriers, insurance.insurance_claim_lines, insurance.insurance_claims y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findEncountersByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:441` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findDiagnosticUnitsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:478` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.resolveCarrier → InsurerContextService.resolve → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.users` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findUsersByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:493` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findAdjudicationsByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:385` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.resolveCarrier → InsurerContextService.resolve → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findLinesByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:365` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → ClaimReadRepository.findClaimsPage | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:247` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPlansByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:487` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findCoveragesByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:356` |
| `practice.practices` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPracticesByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:469` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPatientProfilesByProfileIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:163` |
| `profiles.persons` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPersonsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:155` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findSpecialtiesByPractitionerIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:456` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.listReceivedClaims → InsurerReceivedClaimsService.list → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → InsurerReceivedClaimsService.conceptMap → ClaimReadRepository.findConceptsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:186` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReceivedClaimListDto>` · DTO `ReceivedClaimListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ReceivedClaimDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:231` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:145` |
| `items[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:149` |
| `items[].patient` | `ClaimPatientDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:153` |
| `items[].patient.id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:87` |
| `items[].patient.displayName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:96` |
| `items[].patient.patientCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:100` |
| `items[].patient.memberIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:104` |
| `items[].practitioner` | `ReceivedClaimPractitionerDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:157` |
| `items[].practitioner.id` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].practitioner.displayName` | `string` | Sí | — | — | — | sin fuente |
| `items[].practitioner.specialty` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].providerName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:161` |
| `items[].service` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:165` |
| `items[].service.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].service.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].additionalServiceCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:169` |
| `items[].billedTotal` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:173` |
| `items[].billedTotal.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `items[].billedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `items[].billedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].billedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:177` |
| `items[].approvedTotal.amount` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `items[].approvedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].approvedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].submittedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:181` |
| `items[].serviceDate` | `string` | Sí | formato date; admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:185` |
| `items[].policyIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:189` |
| `items[].planName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:193` |
| `items[].status` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:202` |
| `items[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].lines` | `array<ReceivedClaimLineDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:206` |
| `items[].lines[].sequence` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:94` |
| `items[].lines[].code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:98` |
| `items[].lines[].display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:102` |
| `items[].lines[].quantity` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:106` |
| `items[].lines[].unitPrice` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:110` |
| `items[].lines[].unitPrice.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `items[].lines[].unitPrice.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `items[].lines[].unitPrice.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].lines[].unitPrice.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].lines[].billedAmount` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:114` |
| `items[].lines[].billedAmount.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `items[].lines[].billedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `items[].lines[].billedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].lines[].billedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `items[].decision` | `ReceivedClaimDecisionViewDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:210` |
| `items[].decision.outcome` | `string` | Sí | valores: APPROVED, PARTIAL, REJECTED | — | — | sin fuente |
| `items[].decision.decidedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `items[].decision.decidedBy` | `string` | Sí | — | — | — | sin fuente |
| `items[].decision.reason` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].invoice` | `object` | Sí | admite null | — | Siempre null hasta que se decida dónde persiste la factura de la aseguradora | `src/modules/insurance/presentation/dto/received-claims.dto.ts:224` |
| `truncated` | `boolean` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:235` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {accessDenied} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.spec.ts:35` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsurerReceivedClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 56. POST /insurance/received-claims/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Dictaminar una solicitud recibida (definitivo)
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurerReceivedClaimsController.decideReceivedClaim` — `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:96`

### Qué es y para qué sirve (negocio)

Dictaminar una solicitud recibida (definitivo). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /insurance/received-claims/{id}/decision` la atiende `InsurerReceivedClaimsController.decideReceivedClaim` (src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:96). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ReceivedClaimDecisionDto` (4 campos, 1 obligatorio). Delega en `InsurerReceivedClaimsService.decide`. Crea filas en insurance.claim_adjudication_versions, insurance.claim_line_adjudications, messaging.domain_events, messaging.outbox_messages. Actualiza insurance.insurance_claims. Lee clinical.encounters, clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenant_memberships, iam.users, insurance.claim_adjudication_versions, insurance.insurance_carriers y 15 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:96` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findEncountersByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:441` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockServiceRequest | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:73` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findOfferings | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:132` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findDiagnosticUnitsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:478` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.resolveCarrier → InsurerContextService.resolve → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.users` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findUsersByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:493` |
| `insurance.claim_adjudication_versions` | ESCRIBE | CREA | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.writeDecision → ClaimRepository.createVersion | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:152` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → ClaimRepository.latestVersion | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:135` |
| `insurance.claim_line_adjudications` | ESCRIBE | CREA | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.writeDecision → ClaimRepository.createLineAdjudication | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:173` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.resolveCarrier → InsurerContextService.resolve → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → ClaimReadRepository.findLinesByClaimIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:365` |
| `insurance.insurance_claims` | ESCRIBE | ACTUALIZA | POR_TIPO | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.writeDecision | `src/modules/insurance/application/services/insurer-received-claims.service.ts:519` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → ClaimReadRepository.findClaimInScope | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:334` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPlansByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:487` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findCoveragesByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:356` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.publishDecision → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.publishDecision → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.publishDecision → ClaimDecisionPublisherAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findReservationLines | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:96` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockPharmacyOrder | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:65` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProposedSubstitutions | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:111` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findPharmacies | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:146` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProducts | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:153` |
| `practice.practices` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPracticesByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:469` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPatientProfilesByProfileIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:163` |
| `profiles.persons` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findPersonsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:155` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → ClaimReadRepository.findSpecialtiesByPractitionerIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:456` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | InsurerReceivedClaimsController.decideReceivedClaim → InsurerReceivedClaimsService.decide → InsurerReceivedClaimsService.buildItems → InsurerReceivedClaimsService.loadContext → InsurerReceivedClaimsService.conceptMap → ClaimReadRepository.findConceptsByIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:186` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/insurance/infrastructure/adapters/claim-decision-publisher.adapter.ts:13` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReceivedClaimDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: APPROVED, PARTIAL, REJECTED | `@IsIn(RECEIVED_CLAIM_OUTCOMES)` | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:38` |
| `approvedAmount` | `string` | No | patrón runtime MONEY_PATTERN | `@IsOptional()` `@IsNumberString()` `@Matches(MONEY_PATTERN, { message: 'approvedAmount debe ser no negativo y tener hasta dos decimales', })` | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:51` |
| `reason` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:58` |
| `policyClauseReference` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:72` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "outcome": "APPROVED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "outcome": "APPROVED",
  "approvedAmount": "200.00",
  "reason": "Texto descriptivo de ejemplo",
  "policyClauseReference": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReceivedClaimDto>` · DTO `ReceivedClaimDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:145` |
| `claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:149` |
| `patient` | `ClaimPatientDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:153` |
| `patient.id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:87` |
| `patient.displayName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:96` |
| `patient.patientCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:100` |
| `patient.memberIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:104` |
| `practitioner` | `ReceivedClaimPractitionerDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:157` |
| `practitioner.id` | `string` | Sí | formato uuid | — | — | sin fuente |
| `practitioner.displayName` | `string` | Sí | — | — | — | sin fuente |
| `practitioner.specialty` | `string` | Sí | admite null | — | — | sin fuente |
| `providerName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:161` |
| `service` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:165` |
| `service.code` | `string` | Sí | — | — | — | sin fuente |
| `service.display` | `string` | Sí | — | — | — | sin fuente |
| `additionalServiceCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:169` |
| `billedTotal` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:173` |
| `billedTotal.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `billedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `billedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `billedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `approvedTotal` | `MoneyDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:177` |
| `approvedTotal.amount` | `string` | Sí | — | — | — | sin fuente |
| `approvedTotal.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | sin fuente |
| `approvedTotal.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `approvedTotal.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `submittedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:181` |
| `serviceDate` | `string` | Sí | formato date; admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:185` |
| `policyIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:189` |
| `planName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:193` |
| `status` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:202` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `lines` | `array<ReceivedClaimLineDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:206` |
| `lines[].sequence` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:94` |
| `lines[].code` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:98` |
| `lines[].display` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:102` |
| `lines[].quantity` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:106` |
| `lines[].unitPrice` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:110` |
| `lines[].unitPrice.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `lines[].unitPrice.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `lines[].unitPrice.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].unitPrice.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `lines[].billedAmount` | `MoneyDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:114` |
| `lines[].billedAmount.amount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:67` |
| `lines[].billedAmount.currency` | `InsuranceConceptDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/claims-read.dto.ts:71` |
| `lines[].billedAmount.currency.code` | `string` | Sí | — | — | — | sin fuente |
| `lines[].billedAmount.currency.display` | `string` | Sí | — | — | — | sin fuente |
| `decision` | `ReceivedClaimDecisionViewDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/received-claims.dto.ts:210` |
| `decision.outcome` | `string` | Sí | valores: APPROVED, PARTIAL, REJECTED | — | — | sin fuente |
| `decision.decidedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `decision.decidedBy` | `string` | Sí | — | — | — | sin fuente |
| `decision.reason` | `string` | Sí | admite null | — | — | sin fuente |
| `invoice` | `object` | Sí | admite null | — | Siempre null hasta que se decida dónde persiste la factura de la aseguradora | `src/modules/insurance/presentation/dto/received-claims.dto.ts:224` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {accessDenied} |
| 409 | `CONFLICT` | ConflictException: La solicitud ya tiene dictamen y no se puede cambiar |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reclamo sólo puede representar un pedido; PreconditionFailedException: El pedido cambió; se requiere revisar el reclamo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.spec.ts:51` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsurerReceivedClaimsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 57. POST /patient-coverages

- **Origen:** CONTRATO
- **Nombre:** Registrar cobertura de paciente y dependientes
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CoverageController.enroll` — `src/modules/insurance/presentation/controllers/coverage.controller.ts:85`

### Qué es y para qué sirve (negocio)

Registrar cobertura de paciente y dependientes. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /patient-coverages` la atiende `CoverageController.enroll` (src/modules/insurance/presentation/controllers/coverage.controller.ts:85). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateCoverageDto` (9 campos, 3 obligatorios). Delega en `CoverageService.enrollCoverage`. Crea filas en insurance.broker_clients, insurance.coverage_dependents, insurance.patient_coverages. Lee insurance.insurance_plans, insurance.patient_coverages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/coverage.controller.ts:85` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.broker_clients` | ESCRIBE | CREA | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CoverageRepository.createBrokerClient | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:285` |
| `insurance.coverage_dependents` | ESCRIBE | CREA | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CoverageRepository.createDependent | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:267` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CatalogRepository.findPlan | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:120` |
| `insurance.patient_coverages` | ESCRIBE | CREA | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CoverageRepository.createCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:249` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | CoverageController.enroll → CoverageService.enrollCoverage → CoverageRepository.findByMemberAndPlan | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:74` |

### Cuerpo — DTO `CreateCoverageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insurancePlanId` | `string` | Sí | formato uuid | `@IsUUID()` | Plan de seguro afiliado | `src/modules/insurance/presentation/dto/coverage.dto.ts:42` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del paciente/afiliado | `src/modules/insurance/presentation/dto/coverage.dto.ts:49` |
| `memberIdentifier` | `string` | Sí | longitud mínima 1; longitud máxima 80 | `@IsString()` `@MinLength(1)` `@MaxLength(80)` | Identificador de afiliado (member id) | `src/modules/insurance/presentation/dto/coverage.dto.ts:61` |
| `policyIdentifier` | `string` | No | longitud máxima 80 | `@IsOptional()` `@IsString()` `@MaxLength(80)` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:70` |
| `coverageOrder` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Orden de coordinación (1=primaria) | `src/modules/insurance/presentation/dto/coverage.dto.ts:79` |
| `insuranceBrokerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Broker que intermedia (vincula broker_clients) | `src/modules/insurance/presentation/dto/coverage.dto.ts:90` |
| `dependents` | `array<CoverageDependentDto>` | No | máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => CoverageDependentDto)` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:101` |
| `dependents[].dependentPatientProfileId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:24` |
| `dependents[].relationship` | `string` | No | valores: SPOUSE, CHILD | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:32` |

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
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/presentation/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:36` |

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

## 58. GET /patient-coverages/by-patient/{patientProfileId}

- **Origen:** CONTRATO
- **Nombre:** Seguros de una persona, para quien cobra
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CoverageController.listForPatient` — `src/modules/insurance/presentation/controllers/coverage.controller.ts:70`

### Qué es y para qué sirve (negocio)

Seguros de una persona, para quien cobra. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /patient-coverages/by-patient/{patientProfileId}` la atiende `CoverageController.listForPatient` (src/modules/insurance/presentation/controllers/coverage.controller.ts:70). Exige sesión con alguno de los roles BILLING, FINANCE. Delega en `CoverageService.listForPatient`. Lee authz.care_relationships, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/coverage.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/insurance/presentation/controllers/coverage.controller.ts:70` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | CoverageController.listForPatient → CoverageService.listForPatient → ClaimCareRelationshipGate.assertCareRelationship → PatientCareRelationshipAdapter.hasCareRelationshipForPayment → CareRelationshipsRepository.hasActiveInTenantAt | `src/modules/authz/repositories/care-relationships.repository.ts:138` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | CoverageController.listForPatient → CoverageService.listForPatient → CoverageRepository.findOptionsByPatient | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:138` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | CoverageController.listForPatient → CoverageService.listForPatient → CoverageRepository.findOptionsByPatient | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:138` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | CoverageController.listForPatient → CoverageService.listForPatient → CoverageRepository.findOptionsByPatient | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:138` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | CoverageController.listForPatient → CoverageService.listForPatient → CoverageRepository.findOptionsByPatient | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:138` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CoverageController.listForPatient → CoverageService.listForPatient → CoverageRepository.findOptionsByPatient | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:138` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientCoverageOptionListDto>` · DTO `PatientCoverageOptionListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PatientCoverageOptionDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:270` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:241` |
| `items[].insuranceCarrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:245` |
| `items[].carrierName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:249` |
| `items[].planName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:253` |
| `items[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:259` |
| `items[].currencyCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/coverage.dto.ts:263` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:CoverageController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 59. GET /patient-coverages/me

- **Origen:** CONTRATO
- **Nombre:** Mi cobertura
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CoverageController.listMine` — `src/modules/insurance/presentation/controllers/coverage.controller.ts:56`

### Qué es y para qué sirve (negocio)

Mi cobertura. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /patient-coverages/me` la atiende `CoverageController.listMine` (src/modules/insurance/presentation/controllers/coverage.controller.ts:56). Exige sesión con alguno de los roles BILLING, FINANCE, PATIENT. Delega en `CoverageService.listMine`. Lee insurance.patient_coverages, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE, PATIENT | `src/modules/insurance/presentation/controllers/coverage.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | CoverageController.listMine → CoverageService.listMine → CoverageRepository.findByPatient | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:117` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | CoverageController.listMine → CoverageService.listMine → InsurancePatientAccountRepository.findPatientProfile | `src/modules/insurance/infrastructure/repositories/insurance-patient-account.repository.ts:34` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | CoverageController.listMine → CoverageService.listMine → InsurancePatientAccountRepository.findActiveAccountLink | `src/modules/insurance/infrastructure/repositories/insurance-patient-account.repository.ts:24` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyCoverageDto[]>` · DTO `MyCoverageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/insurance/presentation/dto/coverage.dto.ts:185` |
| `insurancePlanId` | `string` | Sí | formato uuid | — | Plan de la aseguradora. | `src/modules/insurance/presentation/dto/coverage.dto.ts:189` |
| `insuranceBrokerId` | `string` | No | formato uuid | — | Corredor que intermedió el alta, si hubo uno. | `src/modules/insurance/presentation/dto/coverage.dto.ts:193` |
| `memberIdentifier` | `string` | Sí | — | — | Identificador de afiliado ante la aseguradora. | `src/modules/insurance/presentation/dto/coverage.dto.ts:197` |
| `policyIdentifier` | `string` | No | — | — | Número de póliza, si se declaró. | `src/modules/insurance/presentation/dto/coverage.dto.ts:201` |
| `coverageOrder` | `number` | No | — | — | 1 = cobertura privada, 2 = pública. | `src/modules/insurance/presentation/dto/coverage.dto.ts:205` |
| `relationshipToSubscriberConceptId` | `string` | No | formato uuid | — | Vínculo con el titular de la póliza (a sí mismo, cónyuge, hijo). | `src/modules/insurance/presentation/dto/coverage.dto.ts:209` |
| `effectiveFrom` | `string` | No | formato date | — | Vigencia desde. | `src/modules/insurance/presentation/dto/coverage.dto.ts:213` |
| `effectiveTo` | `string` | No | formato date | — | Vigencia hasta, si venció. | `src/modules/insurance/presentation/dto/coverage.dto.ts:217` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | Estado de verificación de la elegibilidad. | `src/modules/insurance/presentation/dto/coverage.dto.ts:221` |
| `status` | `string` | Sí | formato uuid | — | Estado de la cobertura. | `src/modules/insurance/presentation/dto/coverage.dto.ts:225` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha de alta. | `src/modules/insurance/presentation/dto/coverage.dto.ts:229` |

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

- src / modules / insurance — etapa `ctrl:CoverageController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 60. GET /practitioner-settlement-batches

- **Origen:** CONTRATO
- **Nombre:** Listar los lotes de liquidación del alcance del actor
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSettlementBatchesController.list` — `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:79`

### Qué es y para qué sirve (negocio)

Listar los lotes de liquidación del alcance del actor. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /practitioner-settlement-batches` la atiende `PractitionerSettlementBatchesController.list` (src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:79). Exige sesión; el controlador no declara roles. Delega en `PractitionerSettlementBatchesService.list`. Lee diagnostic_units.diagnostic_units, insurance.claim_adjudication_versions, insurance.insurance_carriers, insurance.insurance_claims, insurance.insurance_reconciliation_batches, insurance.insurance_reconciliation_items, insurance.patient_explanations_of_benefit, pharmacy.pharmacies y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → PractitionerSettlementBatchesService.resolveListScope → PractitionerSettlementBatchesService.providerEntityIdsForTenant → SettlementRepository.findActiveDiagnosticUnitIds | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:26` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → PractitionerSettlementBatchesService.toDto | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:494` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → PractitionerSettlementBatchesService.resolveListScope → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → PractitionerSettlementBatchesService.toDto | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:497` |
| `insurance.insurance_reconciliation_batches` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → SettlementRepository.findSettlementBatches | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:198` |
| `insurance.insurance_reconciliation_items` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → SettlementRepository.findSettlementItemsByBatchIds | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:215` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → PractitionerSettlementBatchesService.toDto | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:505` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → PractitionerSettlementBatchesService.resolveListScope → PractitionerSettlementBatchesService.providerEntityIdsForTenant → SettlementRepository.findPharmacyIdsByTenant | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:37` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → PractitionerSettlementBatchesService.resolveListScope → PractitionerSettlementBatchesService.providerEntityIdsForTenant → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.list → PractitionerSettlementBatchesService.list → PractitionerSettlementBatchesService.toDto → PractitionerSettlementBatchesService.resolveCurrencyCode → SettlementRepository.findCurrencyCode | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `providerEntityId` | query | No | `string` | — |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerSettlementBatchListDto>` · DTO `PractitionerSettlementBatchListDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PractitionerSettlementBatchDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:206` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:154` |
| `items[].insuranceCarrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:157` |
| `items[].carrierName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:160` |
| `items[].providerEntityId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:163` |
| `items[].cadence` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SETTLEMENT_CADENCES)[number] | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:166` |
| `items[].periodStart` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:169` |
| `items[].periodEnd` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:172` |
| `items[].currencyCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:175` |
| `items[].status` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:178` |
| `items[].generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:181` |
| `items[].replayed` | `boolean` | Sí | — | — | true cuando la clave natural ya existía (idempotencia, contrato §9) | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:188` |
| `items[].totals` | `PractitionerSettlementBatchTotalsDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:191` |
| `items[].totals.totalBilledAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:136` |
| `items[].totals.totalApprovedAmount` | `string` | Sí | — | — | A transferir por la aseguradora | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:139` |
| `items[].totals.totalPatientAmount` | `string` | Sí | — | — | Copagos percibidos en consulta | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:142` |
| `items[].totals.totalDeniedAmount` | `string` | Sí | — | — | Exclusiones aplicadas | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:145` |
| `items[].totals.totalReversalAdjustmentAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:148` |
| `items[].claims` | `array<PractitionerSettlementBatchClaimDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:194` |
| `items[].claims[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:58` |
| `items[].claims[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:61` |
| `items[].claims[].adjudicationVersionId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:64` |
| `items[].claims[].adjudicationVersion` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:67` |
| `items[].claims[].eobPublishedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:70` |
| `items[].claims[].totalBilledAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:73` |
| `items[].claims[].totalApprovedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:76` |
| `items[].claims[].totalPatientAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:79` |
| `items[].claims[].totalDeniedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:82` |
| `items[].claims[].exclusionsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:85` |
| `items[].excludedClaims` | `array<PractitionerSettlementBatchExcludedClaimDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:197` |
| `items[].excludedClaims[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:100` |
| `items[].excludedClaims[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:103` |
| `items[].excludedClaims[].reason` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SETTLEMENT_EXCLUSION_REASONS)[number] | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:106` |
| `items[].reversalAdjustments` | `array<PractitionerSettlementBatchReversalAdjustmentDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:200` |
| `items[].reversalAdjustments[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:116` |
| `items[].reversalAdjustments[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:119` |
| `items[].reversalAdjustments[].previousBatchId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:122` |
| `items[].reversalAdjustments[].adjustmentAmount` | `string` | Sí | — | — | Negativo | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:125` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La organización activa no administra una aseguradora ni tiene prácticas, unidades diagnósticas o farmacias activas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:PractitionerSettlementBatchesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 61. POST /practitioner-settlement-batches

- **Origen:** CONTRATO
- **Nombre:** Generar (o repetir) el lote de liquidación del período
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSettlementBatchesController.generate` — `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:49`

### Qué es y para qué sirve (negocio)

Generar (o repetir) el lote de liquidación del período. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /practitioner-settlement-batches` la atiende `PractitionerSettlementBatchesController.generate` (src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:49). Exige sesión; el controlador no declara roles. Valida el cuerpo como `GeneratePractitionerSettlementBatchDto` (4 campos, 4 obligatorios). Delega en `PractitionerSettlementBatchesService.generate`. Crea filas en insurance.insurance_reconciliation_batches, insurance.insurance_reconciliation_items. Lee directory.tenant_memberships, insurance.claim_adjudication_versions, insurance.claim_line_adjudications, insurance.claim_reversals, insurance.insurance_carriers, insurance.insurance_claim_lines, insurance.insurance_claims, insurance.insurance_reconciliation_batches y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate → LinkedClaimAccessService.assertInsurer → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:132` |
| `insurance.claim_line_adjudications` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:165` |
| `insurance.claim_reversals` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:135` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate → CatalogRepository.findCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:36` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:129` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate → PractitionerSettlementBatchesService.toDto | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:497` |
| `insurance.insurance_reconciliation_batches` | ESCRIBE | CREA | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate → SettlementRepository.createBatch | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:76` |
| `insurance.insurance_reconciliation_batches` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate → SettlementRepository.findSettlementBatchByNaturalKey | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:159` |
| `insurance.insurance_reconciliation_items` | ESCRIBE | CREA | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate → SettlementRepository.createItem | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:93` |
| `insurance.insurance_reconciliation_items` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate → SettlementRepository.findSettlementItemsByBatchIds | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:215` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:170` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.generate → PractitionerSettlementBatchesService.generate → PractitionerSettlementBatchesService.resolveCurrencyCode → SettlementRepository.findCurrencyCode | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:44` |

### Cuerpo — DTO `GeneratePractitionerSettlementBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:16` |
| `providerEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | billing_provider_entity_id | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:20` |
| `cadence` | `string` | Sí | valores: WEEKLY, BIWEEKLY, MONTHLY | `@IsIn(SETTLEMENT_CADENCES)` | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:24` |
| `periodStart` | `string` | Sí | formato date | `@IsISO8601({ strict: true })` | Día 1 (MONTHLY), día 1 o 16 (BIWEEKLY), o cualquiera (WEEKLY) | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:34` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "cadence": "WEEKLY",
  "periodStart": "2026-09-01"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "providerEntityId": "00000000-0000-4000-8000-000000000001",
  "cadence": "WEEKLY",
  "periodStart": "2026-09-01"
}
```

</details>

### Respuesta — `Promise<PractitionerSettlementBatchDto>` · DTO `PractitionerSettlementBatchDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:154` |
| `insuranceCarrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:157` |
| `carrierName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:160` |
| `providerEntityId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:163` |
| `cadence` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SETTLEMENT_CADENCES)[number] | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:166` |
| `periodStart` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:169` |
| `periodEnd` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:172` |
| `currencyCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:175` |
| `status` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:178` |
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:181` |
| `replayed` | `boolean` | Sí | — | — | true cuando la clave natural ya existía (idempotencia, contrato §9) | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:188` |
| `totals` | `PractitionerSettlementBatchTotalsDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:191` |
| `totals.totalBilledAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:136` |
| `totals.totalApprovedAmount` | `string` | Sí | — | — | A transferir por la aseguradora | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:139` |
| `totals.totalPatientAmount` | `string` | Sí | — | — | Copagos percibidos en consulta | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:142` |
| `totals.totalDeniedAmount` | `string` | Sí | — | — | Exclusiones aplicadas | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:145` |
| `totals.totalReversalAdjustmentAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:148` |
| `claims` | `array<PractitionerSettlementBatchClaimDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:194` |
| `claims[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:58` |
| `claims[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:61` |
| `claims[].adjudicationVersionId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:64` |
| `claims[].adjudicationVersion` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:67` |
| `claims[].eobPublishedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:70` |
| `claims[].totalBilledAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:73` |
| `claims[].totalApprovedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:76` |
| `claims[].totalPatientAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:79` |
| `claims[].totalDeniedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:82` |
| `claims[].exclusionsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:85` |
| `excludedClaims` | `array<PractitionerSettlementBatchExcludedClaimDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:197` |
| `excludedClaims[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:100` |
| `excludedClaims[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:103` |
| `excludedClaims[].reason` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SETTLEMENT_EXCLUSION_REASONS)[number] | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:106` |
| `reversalAdjustments` | `array<PractitionerSettlementBatchReversalAdjustmentDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:200` |
| `reversalAdjustments[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:116` |
| `reversalAdjustments[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:119` |
| `reversalAdjustments[].previousBatchId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:122` |
| `reversalAdjustments[].adjustmentAmount` | `string` | Sí | — | — | Negativo | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:125` |

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

- src / modules / insurance — etapa `ctrl:PractitionerSettlementBatchesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 62. GET /practitioner-settlement-batches/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar un lote de liquidación
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSettlementBatchesController.getById` — `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:69`

### Qué es y para qué sirve (negocio)

Consultar un lote de liquidación. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /practitioner-settlement-batches/{id}` la atiende `PractitionerSettlementBatchesController.getById` (src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:69). Exige sesión; el controlador no declara roles. Delega en `PractitionerSettlementBatchesService.getById`. Lee diagnostic_units.diagnostic_units, directory.tenant_memberships, insurance.claim_adjudication_versions, insurance.insurance_carriers, insurance.insurance_claims, insurance.insurance_reconciliation_batches, insurance.insurance_reconciliation_items, insurance.patient_explanations_of_benefit y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:69` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.assertBatchAccess → PractitionerSettlementBatchesService.providerEntityIdsForTenant → SettlementRepository.findActiveDiagnosticUnitIds | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:26` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.assertBatchAccess → LinkedClaimAccessService.assertInsurer → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.toDto | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:494` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.toDto → CatalogRepository.findCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:36` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.toDto | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:497` |
| `insurance.insurance_reconciliation_batches` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → SettlementRepository.findBatch | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:63` |
| `insurance.insurance_reconciliation_items` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → SettlementRepository.findSettlementItemsByBatchIds | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:215` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.toDto | `src/modules/insurance/application/services/practitioner-settlement-batches.service.ts:505` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.assertBatchAccess → PractitionerSettlementBatchesService.providerEntityIdsForTenant → SettlementRepository.findPharmacyIdsByTenant | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:37` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.assertBatchAccess → PractitionerSettlementBatchesService.providerEntityIdsForTenant → PracticeTenantLookupAdapter.findActivePracticeIdsForTenant → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PractitionerSettlementBatchesController.getById → PractitionerSettlementBatchesService.getById → PractitionerSettlementBatchesService.toDto → PractitionerSettlementBatchesService.resolveCurrencyCode → SettlementRepository.findCurrencyCode | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerSettlementBatchDto>` · DTO `PractitionerSettlementBatchDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:154` |
| `insuranceCarrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:157` |
| `carrierName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:160` |
| `providerEntityId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:163` |
| `cadence` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SETTLEMENT_CADENCES)[number] | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:166` |
| `periodStart` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:169` |
| `periodEnd` | `string` | Sí | formato date | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:172` |
| `currencyCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:175` |
| `status` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:178` |
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:181` |
| `replayed` | `boolean` | Sí | — | — | true cuando la clave natural ya existía (idempotencia, contrato §9) | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:188` |
| `totals` | `PractitionerSettlementBatchTotalsDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:191` |
| `totals.totalBilledAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:136` |
| `totals.totalApprovedAmount` | `string` | Sí | — | — | A transferir por la aseguradora | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:139` |
| `totals.totalPatientAmount` | `string` | Sí | — | — | Copagos percibidos en consulta | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:142` |
| `totals.totalDeniedAmount` | `string` | Sí | — | — | Exclusiones aplicadas | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:145` |
| `totals.totalReversalAdjustmentAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:148` |
| `claims` | `array<PractitionerSettlementBatchClaimDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:194` |
| `claims[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:58` |
| `claims[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:61` |
| `claims[].adjudicationVersionId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:64` |
| `claims[].adjudicationVersion` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:67` |
| `claims[].eobPublishedAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:70` |
| `claims[].totalBilledAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:73` |
| `claims[].totalApprovedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:76` |
| `claims[].totalPatientAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:79` |
| `claims[].totalDeniedAmount` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:82` |
| `claims[].exclusionsCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:85` |
| `excludedClaims` | `array<PractitionerSettlementBatchExcludedClaimDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:197` |
| `excludedClaims[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:100` |
| `excludedClaims[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:103` |
| `excludedClaims[].reason` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SETTLEMENT_EXCLUSION_REASONS)[number] | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:106` |
| `reversalAdjustments` | `array<PractitionerSettlementBatchReversalAdjustmentDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:200` |
| `reversalAdjustments[].claimId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:116` |
| `reversalAdjustments[].claimIdentifier` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:119` |
| `reversalAdjustments[].previousBatchId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:122` |
| `reversalAdjustments[].adjustmentAmount` | `string` | Sí | — | — | Negativo | `src/modules/insurance/presentation/dto/practitioner-settlement-batch.dto.ts:125` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:PractitionerSettlementBatchesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 63. GET /practitioners/{profileId}/insurance-networks

- **Origen:** CONTRATO
- **Nombre:** Aseguradoras con las que trabaja el profesional
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerInsuranceNetworksController.list` — `src/modules/insurance/presentation/controllers/practitioner-insurance-networks.controller.ts:25`

### Qué es y para qué sirve (negocio)

Aseguradoras con las que trabaja el profesional. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /practitioners/{profileId}/insurance-networks` la atiende `PractitionerInsuranceNetworksController.list` (src/modules/insurance/presentation/controllers/practitioner-insurance-networks.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT. Delega en `PractitionerInsuranceNetworksService.listForPractitioner`. Lee insurance.insurance_carriers, insurance.network_provider_memberships, insurance.provider_networks, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT | `src/modules/insurance/presentation/controllers/practitioner-insurance-networks.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/insurance/presentation/controllers/practitioner-insurance-networks.controller.ts:25` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | PractitionerInsuranceNetworksController.list → PractitionerInsuranceNetworksService.listForPractitioner | `src/modules/insurance/application/services/practitioner-insurance-networks.service.ts:48` |
| `insurance.network_provider_memberships` | LEE | LEE | POR_SQL | PractitionerInsuranceNetworksController.list → PractitionerInsuranceNetworksService.listForPractitioner | `src/modules/insurance/application/services/practitioner-insurance-networks.service.ts:48` |
| `insurance.provider_networks` | LEE | LEE | POR_SQL | PractitionerInsuranceNetworksController.list → PractitionerInsuranceNetworksService.listForPractitioner | `src/modules/insurance/application/services/practitioner-insurance-networks.service.ts:48` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerInsuranceNetworksController.list → PractitionerInsuranceNetworksService.listForPractitioner | `src/modules/insurance/application/services/practitioner-insurance-networks.service.ts:48` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerInsuranceNetworkPageDto>` · DTO `PractitionerInsuranceNetworkPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PractitionerInsuranceNetworkDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-insurance-network.dto.ts:28` |
| `items[].membershipId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-insurance-network.dto.ts:6` |
| `items[].carrierId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/practitioner-insurance-network.dto.ts:9` |
| `items[].carrierName` | `string` | Sí | — | — | El nombre de la aseguradora (`insurance_carriers.legal_name`). | `src/modules/insurance/presentation/dto/practitioner-insurance-network.dto.ts:13` |
| `items[].networkName` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-insurance-network.dto.ts:16` |
| `items[].effectiveFrom` | `string` | Sí | formato date; admite null | — | — | `src/modules/insurance/presentation/dto/practitioner-insurance-network.dto.ts:19` |
| `items[].effectiveTo` | `string` | Sí | formato date; admite null | — | — | `src/modules/insurance/presentation/dto/practitioner-insurance-network.dto.ts:22` |
| `count` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/practitioner-insurance-network.dto.ts:31` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:PractitionerInsuranceNetworksController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 64. POST /prior-authorization-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar autorización previa con items
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PriorAuthController.submit` — `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:96`

### Qué es y para qué sirve (negocio)

Solicitar autorización previa con items. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /prior-authorization-requests` la atiende `PriorAuthController.submit` (src/modules/insurance/presentation/controllers/prior-auth.controller.ts:96). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreatePriorAuthRequestDto` (13 campos, 3 obligatorios). Delega en `PriorAuthService.submitRequest`. Crea filas en insurance.prior_authorization_items, insurance.prior_authorization_requests. Lee clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenant_memberships, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages, pharmacy_inventory.inventory_reservation_lines y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockServiceRequest | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:73` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findOfferings | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:132` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimAccessService.coverageForOrder → CatalogRepository.findPlan | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:120` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimAccessService.coverageForOrder → CatalogRepository.findProduct | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:80` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |
| `insurance.prior_authorization_items` | ESCRIBE | CREA | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → PriorAuthRepository.createItem | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:147` |
| `insurance.prior_authorization_requests` | ESCRIBE | CREA | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → PriorAuthRepository.createRequest | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:129` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → PriorAuthRepository.findReservationProducts | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:61` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockPharmacyOrder | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:65` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProposedSubstitutions | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:111` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findPharmacies | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:146` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PriorAuthController.submit → PriorAuthService.submitRequest → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProducts | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:153` |

### Cuerpo — DTO `CreatePriorAuthRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientCoverageId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:61` |
| `inventoryReservationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:66` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Receta del pedido vinculado | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:74` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:79` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:84` |
| `requestingProviderEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad prestadora solicitante | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:94` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:103` |
| `items` | `array<PriorAuthItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PriorAuthItemDto)` | 1..N ítems solicitados | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:116` |
| `items[].serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio solicitado | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:25` |
| `items[].pharmacyProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:30` |
| `items[].diagnosticStudyOfferingId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:35` |
| `items[].requestedQuantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Cantidad solicitada | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:43` |
| `items[].requestedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto solicitado | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:51` |

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
  "inventoryReservationId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "requestingProviderEntityId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "items": [
    {
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
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
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/presentation/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cobertura no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La receta requiere su pedido de farmacia vinculado; PreconditionFailedException: Un reclamo sólo puede representar un pedido; PreconditionFailedException: La autorización debe representar un pedido confirmado del prestador; PreconditionFailedException: La receta debe pertenecer al mismo pedido; PreconditionFailedException: La cobertura no corresponde a la aseguradora indicada; PreconditionFailedException: La moneda de la cobertura y del pedido debe coincidir; PreconditionFailedException: La cobertura debe estar activa y vigente para presentar el reclamo; PreconditionFailedException: La moneda no coincide con la cobertura; PreconditionFailedException: La autorización debe incluir todos los productos del pedido; PreconditionFailedException: Los productos e importes deben coincidir con el pedido; PreconditionFailedException: La autorización diagnóstica requiere una oferta, cantidad uno y moneda |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:PriorAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 65. GET /prior-authorization-requests/{id}

- **Origen:** CONTRATO
- **Nombre:** Detalle de una solicitud de aprobación (aseguradora)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PriorAuthController.getById` — `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:77`

### Qué es y para qué sirve (negocio)

Detalle de una solicitud de aprobación (aseguradora). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /prior-authorization-requests/{id}` la atiende `PriorAuthController.getById` (src/modules/insurance/presentation/controllers/prior-auth.controller.ts:77). Exige sesión con alguno de los roles BILLING, FINANCE. Delega en `PriorAuthReadService.getForInsurer`. Lee diagnostic_units.diagnostic_study_offerings, directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages, insurance.prior_authorization_determinations, insurance.prior_authorization_items y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:77` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.hydrate → PriorAuthRepository.findDiagnosticOfferings | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:93` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.insurerCarrierId → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.insurerCarrierId → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → CatalogRepository.findPlan | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:120` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → CatalogRepository.findProduct | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:80` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer | `src/modules/insurance/application/services/prior-auth-read.service.ts:105` |
| `insurance.prior_authorization_determinations` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.hydrate → PriorAuthRepository.findDeterminationsByRequestIds | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:219` |
| `insurance.prior_authorization_items` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.hydrate → PriorAuthRepository.findItemsByRequestIds | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:206` |
| `insurance.prior_authorization_requests` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthRepository.findRequest | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:115` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.hydrate → PriorAuthRepository.findPharmacyProducts | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:85` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.hydrate → PriorAuthRepository.findPatientRecords | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:77` |
| `profiles.persons` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.hydrate → PriorAuthRepository.findPeople | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:69` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PriorAuthController.getById → PriorAuthReadService.getForInsurer → PriorAuthReadService.hydrate → PriorAuthReadService.conceptMap → PriorAuthRepository.findConcepts | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PriorAuthDetailDto>` · DTO `PriorAuthDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:315` |
| `origin` | `string` | Sí | valores: PHARMACY, DIAGNOSTIC, GENERIC | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:319` |
| `status` | `string` | Sí | valores: SUBMITTED, IN_REVIEW, DETERMINED | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:323` |
| `decision` | `string` | Sí | valores: APPROVED, DENIED, PARTIAL; admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:327` |
| `patient` | `PriorAuthPatientDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:330` |
| `patient.id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:257` |
| `patient.displayName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:260` |
| `patient.patientCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:263` |
| `patient.memberIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:266` |
| `planName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:333` |
| `currencyCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:336` |
| `itemCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:339` |
| `totalRequestedAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:342` |
| `submittedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:345` |
| `items` | `array<PriorAuthItemViewDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:351` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:293` |
| `items[].sequence` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:296` |
| `items[].description` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:300` |
| `items[].requestedQuantity` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:303` |
| `items[].requestedAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:306` |
| `items[].decision` | `PriorAuthItemDecisionDto` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:309` |
| `items[].decision.decision` | `string` | Sí | valores: APPROVED, DENIED | — | — | sin fuente |
| `items[].decision.approvedQuantity` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].decision.approvedAmount` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].decision.policyClauseReference` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].decision.denialRationale` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].decision.decidedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `decidedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:354` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:PriorAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 66. POST /prior-authorization-requests/{id}/determinations

- **Origen:** CONTRATO
- **Nombre:** Emitir determinación de autorización previa
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PriorAuthController.determine` — `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:116`

### Qué es y para qué sirve (negocio)

Emitir determinación de autorización previa. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /prior-authorization-requests/{id}/determinations` la atiende `PriorAuthController.determine` (src/modules/insurance/presentation/controllers/prior-auth.controller.ts:116). Exige sesión con alguno de los roles BILLING, FINANCE. Valida el cuerpo como `CreateDeterminationDto` (13 campos, 0 obligatorios). Delega en `PriorAuthService.issueDetermination`. Crea filas en insurance.prior_authorization_determinations. Actualiza insurance.prior_authorization_requests. Lee clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:116` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:116` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockServiceRequest | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:73` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findOfferings | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:132` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimAccessService.assertInsurer → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimAccessService.assertInsurer → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → CatalogRepository.findPlan | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:120` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → CatalogRepository.findProduct | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:80` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → CoverageRepository.findCoverage | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:58` |
| `insurance.prior_authorization_determinations` | ESCRIBE | CREA | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → PriorAuthRepository.createDetermination | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:250` |
| `insurance.prior_authorization_determinations` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → PriorAuthRepository.maxDeterminationVersion | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:231` |
| `insurance.prior_authorization_items` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → PriorAuthService.resolveItemDecisions → PriorAuthRepository.findItemsByRequestIds | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:206` |
| `insurance.prior_authorization_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | PriorAuthController.determine → PriorAuthService.issueDetermination | `src/modules/insurance/application/services/prior-auth.service.ts:366` |
| `insurance.prior_authorization_requests` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination | `src/modules/insurance/application/services/prior-auth.service.ts:303` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findReservationLines | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:96` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimOrderService.lockAndResolve → LinkedOrderDataRepository.lockPharmacyOrder | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:65` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProposedSubstitutions | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:111` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findPharmacies | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:146` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PriorAuthController.determine → PriorAuthService.issueDetermination → LinkedClaimOrderService.lockAndResolve → LinkedClaimOrderService.loadSnapshot → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProducts | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDeterminationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | No | valores: APPROVED, DENIED, PARTIAL | `@ValidateIf( (o: CreateDeterminationDto) => o.items === undefined \|\| o.decision !== undefined, )` `@IsIn(['APPROVED', 'DENIED', 'PARTIAL'])` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:201` |
| `items` | `array<ItemDeterminationDto>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ItemDeterminationDto)` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:210` |
| `items[].priorAuthorizationItemId` | `string` | No | formato uuid | `@IsUUID()` | Ítem de la solicitud decidido | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:129` |
| `items[].decision` | `string` | No | valores: APPROVED, DENIED | `@IsIn(['APPROVED', 'DENIED'])` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:133` |
| `items[].denialReasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:142` |
| `items[].policyClauseReference` | `string` | No | longitud mínima 1; longitud máxima 255 | `@ValidateIf( (o: ItemDeterminationDto) => o.decision === 'DENIED' \|\| o.policyClauseReference !== undefined, )` `@IsNotEmpty({ message: 'La referencia de cláusula contractual es obligatoria al denegar un ítem', })` `@IsString()` `@MaxLength(255)` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:159` |
| `items[].denialRationale` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:166` |
| `items[].approvedQuantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:172` |
| `items[].approvedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:178` |
| `approvedQuantity` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Cantidad aprobada | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:218` |
| `approvedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto aprobado | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:226` |
| `validFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:234` |
| `validTo` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:242` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "items": [
    {
      "priorAuthorizationItemId": "00000000-0000-4000-8000-000000000001",
      "decision": "APPROVED",
      "denialReasonConceptId": "00000000-0000-4000-8000-000000000001",
      "policyClauseReference": "Cláusula 12.3: medicamento no cubierto en plan ambulatorio",
      "denialRationale": "valor-ejemplo",
      "approvedQuantity": "1",
      "approvedAmount": "80.00"
    }
  ],
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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reclamo sólo puede representar un pedido; PreconditionFailedException: La solicitud no admite determinación en su estado actual; PreconditionFailedException: El ítem decidido no pertenece a la solicitud; PreconditionFailedException: Cada ítem se decide una sola vez; PreconditionFailedException: La determinación debe decidir todos los ítems de la solicitud; PreconditionFailedException: Un ítem no aprobado no lleva cantidad ni monto aprobado; PreconditionFailedException: El monto aprobado no puede superar el solicitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:PriorAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 67. GET /prior-authorization-requests/inbox

- **Origen:** CONTRATO
- **Nombre:** Bandeja de solicitudes de aprobación (aseguradora)
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PriorAuthController.inbox` — `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:62`

### Qué es y para qué sirve (negocio)

Bandeja de solicitudes de aprobación (aseguradora). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /prior-authorization-requests/inbox` la atiende `PriorAuthController.inbox` (src/modules/insurance/presentation/controllers/prior-auth.controller.ts:62). Exige sesión con alguno de los roles BILLING, FINANCE. Delega en `PriorAuthReadService.listInbox`. Lee diagnostic_units.diagnostic_study_offerings, directory.tenant_memberships, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages, insurance.prior_authorization_determinations, insurance.prior_authorization_items y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: BILLING, FINANCE | `src/modules/insurance/presentation/controllers/prior-auth.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate → PriorAuthRepository.findDiagnosticOfferings | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:93` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.insurerCarrierId → LinkedClaimAccessService.assertAdministrator → DirectoryTenantAdministrationAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.insurerCarrierId → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate | `src/modules/insurance/application/services/prior-auth-read.service.ts:155` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthRepository.findIdsForCarrier | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:172` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate | `src/modules/insurance/application/services/prior-auth-read.service.ts:143` |
| `insurance.prior_authorization_determinations` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate → PriorAuthRepository.findDeterminationsByRequestIds | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:219` |
| `insurance.prior_authorization_items` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate → PriorAuthRepository.findItemsByRequestIds | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:206` |
| `insurance.prior_authorization_requests` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthRepository.findRequestsByIds | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:197` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate → PriorAuthRepository.findPharmacyProducts | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:85` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate → PriorAuthRepository.findPatientRecords | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:77` |
| `profiles.persons` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate → PriorAuthRepository.findPeople | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:69` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PriorAuthController.inbox → PriorAuthReadService.listInbox → PriorAuthReadService.hydrate → PriorAuthReadService.conceptMap → PriorAuthRepository.findConcepts | `src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PriorAuthListDto>` · DTO `PriorAuthListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PriorAuthListItemDto>` | Sí | — | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:360` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:315` |
| `items[].origin` | `string` | Sí | valores: PHARMACY, DIAGNOSTIC, GENERIC | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:319` |
| `items[].status` | `string` | Sí | valores: SUBMITTED, IN_REVIEW, DETERMINED | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:323` |
| `items[].decision` | `string` | Sí | valores: APPROVED, DENIED, PARTIAL; admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:327` |
| `items[].patient` | `PriorAuthPatientDto` | Sí | — | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:330` |
| `items[].patient.id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:257` |
| `items[].patient.displayName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:260` |
| `items[].patient.patientCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:263` |
| `items[].patient.memberIdentifier` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:266` |
| `items[].planName` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:333` |
| `items[].currencyCode` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:336` |
| `items[].itemCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:339` |
| `items[].totalRequestedAmount` | `string` | Sí | admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:342` |
| `items[].submittedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/insurance/presentation/dto/prior-auth.dto.ts:345` |

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

- src / modules / insurance — etapa `ctrl:PriorAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 68. POST /provider-networks

- **Origen:** CONTRATO
- **Nombre:** Alta de red de prestadores (soporte)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.createProviderNetwork` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:255`

### Qué es y para qué sirve (negocio)

Alta de red de prestadores (soporte). Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /provider-networks` la atiende `InsuranceBackboneController.createProviderNetwork` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:255). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateProviderNetworkDto` (5 campos, 3 obligatorios). Delega en `InsuranceBackboneService.createProviderNetwork`. Crea filas en insurance.provider_networks. Lee insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:255` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | InsuranceBackboneController.createProviderNetwork → InsuranceBackboneService.createProviderNetwork → CatalogRepository.findCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:36` |
| `insurance.provider_networks` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.createProviderNetwork → InsuranceBackboneService.createProviderNetwork → CatalogRepository.createProviderNetwork | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:210` |

### Cuerpo — DTO `CreateProviderNetworkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | Aseguradora dueña de la red | `src/modules/insurance/presentation/dto/backbone.dto.ts:458` |
| `networkCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:467` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:476` |
| `effectiveFrom` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:484` |
| `effectiveTo` | `string` | No | formato date | `@IsOptional()` `@IsString()` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:492` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

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

## 69. POST /provider-networks/{id}/memberships

- **Origen:** CONTRATO
- **Nombre:** Alta de membresía de prestador en la red
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsuranceBackboneController.addMembership` — `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:272`

### Qué es y para qué sirve (negocio)

Alta de membresía de prestador en la red. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /provider-networks/{id}/memberships` la atiende `InsuranceBackboneController.addMembership` (src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:272). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `InsuranceCreateMembershipDto` (3 campos, 1 obligatorio). Delega en `InsuranceBackboneService.addMembership`. Crea filas en insurance.network_provider_memberships. Lee insurance.provider_networks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:272` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:272` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.network_provider_memberships` | ESCRIBE | CREA | DIRECTA | InsuranceBackboneController.addMembership → InsuranceBackboneService.addMembership → CatalogRepository.createMembership | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:228` |
| `insurance.provider_networks` | LEE | LEE | DIRECTA | InsuranceBackboneController.addMembership → InsuranceBackboneService.addMembership → CatalogRepository.findProviderNetwork | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:197` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `InsuranceCreateMembershipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad prestadora (práctica/hospital/etc.) | `src/modules/insurance/presentation/dto/backbone.dto.ts:606` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Referencia a práctica si aplica | `src/modules/insurance/presentation/dto/backbone.dto.ts:617` |
| `contractReference` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/insurance/presentation/dto/backbone.dto.ts:626` |

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
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/presentation/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:36` |

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

## 70. GET /public/portability/verify/{manifestHash}

- **Origen:** CONTRATO
- **Nombre:** Verificar la autenticidad de un certificado de portabilidad por su sello
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InsurancePortabilityPublicController.verify` — `src/modules/insurance/presentation/controllers/insurance-portability-public.controller.ts:75`

### Qué es y para qué sirve (negocio)

Verificar la autenticidad de un certificado de portabilidad por su sello. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`GET /public/portability/verify/{manifestHash}` la atiende `InsurancePortabilityPublicController.verify` (src/modules/insurance/presentation/controllers/insurance-portability-public.controller.ts:75). Es una ruta pública: no exige token. Delega en `InsurancePortabilityService.verify`. Lee health_data.health_export_jobs, health_data.health_export_manifests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/insurance/presentation/controllers/insurance-portability-public.controller.ts:75` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/insurance/presentation/controllers/insurance-portability-public.controller.ts:75` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_export_jobs` | LEE | LEE | DIRECTA | InsurancePortabilityPublicController.verify → InsurancePortabilityService.verify → InsurancePortabilitySupportAdapter.findExportJobById → DataReleaseRepository.findExportJobById | `src/modules/health_data/repositories/data-release.repository.ts:401` |
| `health_data.health_export_manifests` | LEE | LEE | DIRECTA | InsurancePortabilityPublicController.verify → InsurancePortabilityService.verify → InsurancePortabilitySupportAdapter.findManifestByContentHash → DataReleaseRepository.findManifestByContentHash | `src/modules/health_data/repositories/data-release.repository.ts:389` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `manifestHash` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PortabilityVerificationResponseDto>` · DTO `PortabilityVerificationResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:464` |
| `certificateId` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:467` |
| `manifestHash` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:472` |
| `generatedAt` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:475` |
| `recordCount` | `number` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:478` |
| `algorithm` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:481` |
| `issuer` | `string` | Sí | — | — | — | `src/modules/insurance/presentation/dto/insurance-portability.dto.ts:484` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Certificado no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/insurance-portability.int-spec.ts:153` |
| CONTROLADOR | `src/modules/insurance/presentation/controllers/insurance-portability-public.controller.spec.ts:66` |

### Flujos

- src / modules / insurance — etapa `ctrl:InsurancePortabilityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 71. POST /reconciliation-batches

- **Origen:** CONTRATO
- **Nombre:** Abrir lote de conciliación
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReconciliationController.createBatch` — `src/modules/insurance/presentation/controllers/reconciliation.controller.ts:41`

### Qué es y para qué sirve (negocio)

Abrir lote de conciliación. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /reconciliation-batches` la atiende `ReconciliationController.createBatch` (src/modules/insurance/presentation/controllers/reconciliation.controller.ts:41). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateReconciliationBatchDto` (4 campos, 4 obligatorios). Delega en `ReconciliationService.createBatch`. Crea filas en insurance.insurance_reconciliation_batches. Lee insurance.insurance_carriers, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/reconciliation.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ReconciliationController.createBatch → ReconciliationService.createBatch → ReconciliationService.assertPartyOfRelation → CatalogRepository.findCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:36` |
| `insurance.insurance_reconciliation_batches` | ESCRIBE | CREA | DIRECTA | ReconciliationController.createBatch → ReconciliationService.createBatch → SettlementRepository.createBatch | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:76` |
| `practice.practices` | LEE | LEE | DIRECTA | ReconciliationController.createBatch → ReconciliationService.createBatch → ReconciliationService.assertPartyOfRelation → PracticeTenantLookupAdapter.findTenantOfPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Cuerpo — DTO `CreateReconciliationBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceCarrierId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/reconciliation.dto.ts:11` |
| `providerEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad prestadora conciliada | `src/modules/insurance/presentation/dto/reconciliation.dto.ts:18` |
| `periodStart` | `string` | Sí | formato date | `@IsString()` | — | `src/modules/insurance/presentation/dto/reconciliation.dto.ts:25` |
| `periodEnd` | `string` | Sí | formato date | `@IsString()` | — | `src/modules/insurance/presentation/dto/reconciliation.dto.ts:32` |

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
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del recurso | `src/modules/insurance/presentation/dto/common.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/insurance/presentation/dto/common.dto.ts:36` |

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

- src / modules / insurance — etapa `ctrl:ReconciliationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 72. POST /reconciliation-batches/{id}/items

- **Origen:** CONTRATO
- **Nombre:** Agregar ítem de conciliación al lote
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReconciliationController.addItem` — `src/modules/insurance/presentation/controllers/reconciliation.controller.ts:58`

### Qué es y para qué sirve (negocio)

Agregar ítem de conciliación al lote. Dentro del módulo (descripción del modelo, en inglés): «Reconciles insurer companies, brokers, patients, healthcare infrastructure, practitioners, diagnostic units and pharmacies without collapsing them into one generic actor.» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_26_insurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /reconciliation-batches/{id}/items` la atiende `ReconciliationController.addItem` (src/modules/insurance/presentation/controllers/reconciliation.controller.ts:58). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateReconciliationItemDto` (4 campos, 2 obligatorios). Delega en `ReconciliationService.addItem`. Crea filas en insurance.insurance_reconciliation_items. Lee insurance.claim_adjudication_versions, insurance.insurance_carriers, insurance.insurance_claims, insurance.insurance_reconciliation_batches, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/insurance/presentation/controllers/reconciliation.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/insurance/presentation/controllers/reconciliation.controller.ts:58` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → ClaimRepository.findVersion | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:128` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → ReconciliationService.assertPartyOfRelation → CatalogRepository.findCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:36` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → ClaimRepository.findClaim | `src/modules/insurance/infrastructure/repositories/claim.repository.ts:30` |
| `insurance.insurance_reconciliation_batches` | LEE | LEE | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → SettlementRepository.findBatch | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:63` |
| `insurance.insurance_reconciliation_items` | ESCRIBE | CREA | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → SettlementRepository.createItem | `src/modules/insurance/infrastructure/repositories/settlement.repository.ts:93` |
| `practice.practices` | LEE | LEE | DIRECTA | ReconciliationController.addItem → ReconciliationService.addItem → ReconciliationService.assertPartyOfRelation → PracticeTenantLookupAdapter.findTenantOfPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateReconciliationItemDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `insuranceClaimId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/insurance/presentation/dto/reconciliation.dto.ts:42` |
| `claimAdjudicationVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión exacta de adjudicación liquidada | `src/modules/insurance/presentation/dto/reconciliation.dto.ts:52` |
| `expectedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto esperado | `src/modules/insurance/presentation/dto/reconciliation.dto.ts:60` |
| `acceptedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Monto aceptado | `src/modules/insurance/presentation/dto/reconciliation.dto.ts:68` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/insurance/presentation/dto/common.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/insurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / insurance — etapa `ctrl:ReconciliationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

