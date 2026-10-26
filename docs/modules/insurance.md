<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/insurance/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver README.md de la raíz, tabla "Arquitectura y mapa").
-->

# Módulo `insurance`

**Fuente:** [`src/modules/insurance/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/insurance/README.md)
· 19 controllers · 27 services · 14 repositories · 31 entidades · 23 DTO

---

# src / modules / insurance

Seguros y cobertura (schema `insurance`): aseguradoras, productos, planes y beneficios, redes de proveedores, coberturas del paciente y dependientes, elegibilidad, autorizaciones previas, reclamos (líneas, adjudicación, apelaciones, disputas, reversas), conciliación, corredores y comisiones, campañas, liquidación al profesional y liquidación al paciente.

Entidades (31, `find src/modules/insurance -name '*.entity.ts' | wc -l`): `insurance_carriers`, `insurance_products`, `insurance_plans`, `insurance_plan_benefits`, `provider_networks`, `network_provider_memberships`, `patient_coverages`, `coverage_dependents`, `coordination_of_benefits`, `employer_groups`, `coverage_eligibility_requests`, `coverage_eligibility_responses`, `prior_authorization_requests`, `prior_authorization_items`, `prior_authorization_determinations`, `insurance_claims`, `insurance_claim_lines`, `claim_line_adjudications`, `claim_adjudication_versions`, `claim_appeal_decisions`, `claim_disputes`, `claim_reversals`, `patient_explanations_of_benefit`, `insurance_reconciliation_batches`, `insurance_reconciliation_items`, `insurance_brokers`, `broker_clients`, `broker_carrier_agreements`, `broker_commission_statements`, `insurance_campaigns`, `insurance_campaign_partners`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-24 sobre la rama del carril 16 (base origin/dev ab5fb64c). Repetir con:
  find src/modules/insurance -name '*.controller.ts' | wc -l
  find src/modules/insurance -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/insurance -name '*.entity.ts' | wc -l
  find src/modules/insurance -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **19 controllers, 63 rutas HTTP, 31 entidad y 27 servicios** (incluye los ya documentados más abajo). La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (leído de los `.module.ts`): `PracticeModule`, `DirectoryAuthorizationModule`, `TerminologyModule`, `CommonModule`, `AuditModule`, `MessagingModule`, `CommunityModule` (`insurance.module.ts`; además provee directo `InvoicesRepository` de `billing`, que sólo toca el adaptador `billing-patient-invoice.adapter.ts`, carril 16); `insurance-patient-settlement.module.ts` es un módulo aparte sin imports.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /claim-disputes/:id/appeal-decisions` | BILLING, FINANCE | `appeals` |
| `POST /broker-commission-statements` | BILLING, FINANCE | `broker-commission` |
| `GET /insurance-claims` | BILLING_OPERATOR, SECURITY_ADMIN | `claims-read` |
| `GET /insurance-claims/:id` | BILLING_OPERATOR, SECURITY_ADMIN | `claims-read` |
| `POST /insurance-claims` |  | `claims` |
| `POST /insurance-claims/quote` |  | `claims` |
| `POST /insurance-claims/:id/patient-invoice` |  | `claims` |
| `POST /insurance-claims/:id/adjudications` |  | `claims` |
| `POST /insurance-claims/:id/eob` |  | `claims` |
| `POST /insurance-claims/:id/reversals` |  | `claims` |
| `POST /insurance-claims/:id/disputes` | BILLING_OPERATOR, SECURITY_ADMIN, PATIENT | `claims` |
| `GET /patient-coverages/me` | PATIENT | `coverage` |
| `POST /patient-coverages` | BILLING, FINANCE | `coverage` |
| `POST /coverage-eligibility-requests` | BILLING, FINANCE | `coverage` |
| `POST /coordination-of-benefits` | BILLING, FINANCE | `coverage` |
| `GET /insurance/analytics/loss-ratio` | sesión | `insurance-analytics` |
| `POST /insurance-carriers` | SECURITY_ADMIN | `insurance-backbone` |
| `PUT /insurance-carriers/:id/contact-channels` | sesión | `insurance-backbone` |
| `POST /insurance-carriers/:id/products` | SECURITY_ADMIN | `insurance-backbone` |
| `POST /insurance-products/:productId/plans` | sesión | `insurance-backbone` |
| `POST /insurance-plans/:planId/benefits` | sesión | `insurance-backbone` |
| `PUT /insurance-plans/:planId/benefits/:benefitId` | sesión | `insurance-backbone` |
| `PUT /insurance-plans/:planId/benefits/:benefitId/rules` | sesión | `insurance-backbone` |
| `PUT /insurance-plans/:planId/premium` | sesión | `insurance-backbone` |
| `POST /provider-networks` | SECURITY_ADMIN | `insurance-backbone` |
| `POST /provider-networks/:id/memberships` | SECURITY_ADMIN | `insurance-backbone` |
| `POST /insurance-brokers` | SECURITY_ADMIN | `insurance-backbone` |
| `POST /insurance-brokers/:id/agreements` | SECURITY_ADMIN | `insurance-backbone` |
| `POST /employer-groups` | SECURITY_ADMIN | `insurance-backbone` |
| `POST ` |  | `insurance-campaigns` |
| `GET ` |  | `insurance-campaigns` |
| `GET /active` | pública | `insurance-campaigns` |
| `GET /my-benefits` |  | `insurance-campaigns` |
| `GET /patient/:patientProfileId` |  | `insurance-campaigns` |
| `GET /:id` |  | `insurance-campaigns` |
| `PATCH /:id/status` |  | `insurance-campaigns` |
| `PATCH /:id` |  | `insurance-campaigns` |
| `GET /insurance-carrier-catalog` | pública | `insurance-catalog` |
| `GET /public/portability/verify/:manifestHash` | pública | `insurance-portability-public` |
| `POST /insurance/portability/export` | sesión | `insurance-portability` |
| `GET /insurance/portability/certificates/:certificateId/pdf` | sesión | `insurance-portability` |
| `GET /insurance/portability/certificates/:certificateId/json` | sesión | `insurance-portability` |
| `GET /insurance-carriers` | sesión | `insurance-read` |
| `GET /insurance-carriers/:id` | sesión | `insurance-read` |
| `GET /insurance-brokers` | sesión | `insurance-read` |
| `GET /insurance-brokers/:id` | sesión | `insurance-read` |
| `GET /insurance-brokers/:id/clients` | sesión | `insurance-read` |
| `POST /insurance/patients/search` | sesión | `insurer-patients` |
| `GET /insurance/patients/options` | sesión | `insurer-patients` |
| `POST /insurance/patients/conversation` | sesión | `insurer-patients` |
| `GET /insurance/received-claims` | sesión | `insurer-received-claims` |
| `POST /insurance/received-claims/:id/decision` | sesión | `insurer-received-claims` |
| `GET /insurance/my-claims` | sesión | `my-claims` |
| `GET /practitioners/:profileId/insurance-networks` | SECURITY_ADMIN,
    SCHEDULING_ADMIN,
    SCHEDULING_AGENT,
    PRACTITIONER,
    CLINICIAN,
    PATIENT, | `practitioner-insurance-networks` |
| `POST /practitioner-settlement-batches` |  | `practitioner-settlement-batches` |
| `GET /practitioner-settlement-batches/:id` |  | `practitioner-settlement-batches` |
| `GET /practitioner-settlement-batches` |  | `practitioner-settlement-batches` |
| `GET /prior-authorization-requests/inbox` |  | `prior-auth` |
| `GET /prior-authorization-requests/:id` |  | `prior-auth` |
| `POST /prior-authorization-requests` |  | `prior-auth` |
| `POST /prior-authorization-requests/:id/determinations` |  | `prior-auth` |
| `POST /reconciliation-batches` | SECURITY_ADMIN | `reconciliation` |
| `POST /reconciliation-batches/:id/items` | SECURITY_ADMIN | `reconciliation` |

## Liquidación al profesional (H8)

Transparencia de exclusiones, desglose de liquidación y lotes periódicos de
liquidación entre aseguradora y prestador (Tarea 3, resolución del handoff H8
del plan médico, `MED-E13..E16`). El contrato canónico —actores, vocabulario
de importes, exclusiones formales, ciclo del reclamo e inmutabilidad,
elegibilidad y calendario del lote, idempotencia, reversión y contención
financiera— vive en
[`docs/contracts/insurer-practitioner-settlement-batches.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/contracts/insurer-practitioner-settlement-batches.md).

`GET /insurance-claims/:id` expone el desglose conciliado
(`ClaimDetailDto.settlement`, `ClaimSettlementBreakdownDto`) construido por
`services/claim-settlement-breakdown.ts`: `totalBilledAmount =
totalApprovedAmount + totalPatientAmount + totalDeniedAmount`, con
`reconciled: boolean` y las exclusiones formales
(`ClaimExclusionDto.policyClauseReference`/`.denialRationale`). Una exclusión
sin cláusula, una línea sin adjudicar o un descuadre degradan `availability` a
`UNDER_REVIEW` en vez de publicarse como liquidación firme.

El lote periódico de liquidación al profesional (CA-3.2 del contrato,
v1.1) tiene tres rutas, sin `@Roles` de clase (la autorización la resuelve el
servicio por pertenencia):

- `POST /practitioner-settlement-batches` — genera el lote de un período
  (`insuranceCarrierId`, `providerEntityId`, `cadence`, `periodStart`); sólo
  la administración activa de la aseguradora. `201` si es nuevo, `200` con
  `replayed: true` si la clave natural (aseguradora, prestador, período) ya
  se había generado (idempotencia, §9 del contrato). Nunca escribe un importe
  pagado: `PractitionerSettlementBatchesService` (`services/practitioner-settlement-batches.service.ts`)
  y el dominio puro `services/practitioner-settlement-batch.ts` (elegibilidad,
  calendario, ajustes por reversión).
- `GET /practitioner-settlement-batches/:id` — la administración de la
  aseguradora dueña, o el tenant del prestador (prácticas activas, unidades
  diagnósticas activas o farmacias del tenant).
- `GET /practitioner-settlement-batches?providerEntityId&from&to` — listado
  acotado al mismo alcance.

Evidencia: `services/practitioner-settlement-batch.spec.ts` (dominio puro,
18 pruebas correcto/límite/inválido), `services/practitioner-settlement-batches.service.spec.ts`
(servicio con dobles de `EntityManager`, 8 pruebas) y las aserciones de
`controllers/insurance-controllers.spec.ts` sobre roles y ausencia de
propiedades de pago en los DTOs. No hay prueba de integración HTTP de punta a
punta de los lotes.

## Administración de planes y coberturas

Las lecturas `GET /insurance-carriers` y `GET /insurance-carriers/:carrierId`
están acotadas al carrier del tenant activo. Ambas calculan `canAdminister` en
el servidor; cada beneficio devuelve `approvalRules` normalizadas con
`requiredDocuments: []` y `exclusionNotes: null` cuando no hay reglas válidas.

Las siguientes mutaciones exigen un tenant activo y una membresía `OWNER` o
`ADMIN`. Los roles de plataforma `SECURITY_ADMIN` y `SUPERADMIN` conservan el
acceso excepcional, pero `OWNER`/`ADMIN` nunca se interpretan como roles del
JWT:

| Método y ruta | Cuerpo administrado | Respuesta |
| --- | --- | --- |
| `POST /insurance-products/:productId/plans` | Código, nombre, vigencia, moneda opcional y prima de lista mensual opcional | `{ id }` |
| `POST /insurance-plans/:planId/benefits` | Categoría, servicio opcional, vigencia e importes | `{ id }` |
| `PUT /insurance-plans/:planId/benefits/:benefitId` | Porcentaje, copago, deducible y tope anual; `null` borra | `{ ok: true }` |
| `PUT /insurance-plans/:planId/benefits/:benefitId/rules` | Autorización previa, documentos y exclusión | `{ ok: true }` |
| `PUT /insurance-plans/:planId/premium` | Prima de lista mensual del plan; `null` la quita | `{ id, monthlyPremiumAmount }` |

Todos los identificadores se resuelven por la cadena
tenant → carrier → producto → plan → beneficio. Un recurso inexistente, ajeno
o una combinación plan/beneficio inválida responde `404`; un miembro activo
sin capacidad administrativa responde `403`. Las escrituras actualizan la
auditoría dentro de la misma transacción.

Los documentos admitidos son `FIRMA_MEDICO`, `SELLO_MEDICO`, `ORDEN_MEDICA` e
`INFORME_CLINICO`. Las reglas se guardan con las claves canónicas
`requiredDocuments` y `exclusionNotes`, preservando claves desconocidas del
JSON de elegibilidad.

## Portabilidad del titular

Portabilidad de póliza e historial de siniestralidad a 1 clic (subtarea 3.3):
el titular exporta su propio historial de coberturas, atenciones, siniestros
y diagnósticos como un certificado sellado con SHA-256, verificable
públicamente por cualquier tercero (una nueva aseguradora, un auditor) sin
sesión ni exposición de datos clínicos.

| Método y ruta | Quién puede | Respuesta |
| --- | --- | --- |
| `POST /insurance/portability/export` | El titular del `patientProfileId` del cuerpo, o plataforma | `201` con `PortabilityExportResultDto` (`certificateId`, `manifestHash`, URLs de descarga y verificación, resumen actuarial) |
| `GET /insurance/portability/certificates/:certificateId/pdf` | El titular del certificado, o plataforma | `200` PDF con QR y sello |
| `GET /insurance/portability/certificates/:certificateId/json` | El titular del certificado, o plataforma | `200` JSON, exactamente como se selló |
| `GET /public/portability/verify/:manifestHash` | Sin sesión (`@Public`) | `200` `PortabilityVerificationResponseDto` sin PHI, o `404` |

**Autorización**: sin `@Roles` — `InsurancePortabilityService` resuelve la
titularidad con `ProfileOwnershipService.assertOwnsPatientProfile` (el actor
del JWT o un rol de plataforma). Un rechazo por perfil ajeno responde `403`
y deja un asiento `INSURANCE_PORTABILITY_DENIED` en `audit.audit_log`
(AC-03-03-D); un intento de descargar el certificado de otro responde `403`
antes de leer el archivo.

**Persistencia**: el certificado NO tiene tabla propia — reusa
`health_data.health_export_jobs`/`health_export_manifests` (el
`content_hash` del manifiesto ES el sello impreso), más `common.files`
(PHI), `audit.dsar_requests` (`DSAR_TYPE_PORTABILITY`) y
`audit.data_access_log`, todo en una transacción. El `generatedAt` que
devuelve el `verify` público es el mismo instante sellado en el JSON y el
PDF (`health_export_jobs.requested_at` se fija explícitamente, no un
`new Date()` posterior).

**Contenido del certificado** (`schemaVersion: 'alovida.insurance-portability/2'`):
pólizas/coberturas, atenciones (`clinical.encounters`, sin motivo de
consulta — minimización de PHI ante un tercero), reclamos con su dictamen
vigente, diagnósticos codificados y un resumen actuarial (totales,
siniestralidad estimada contra la prima de lista del plan). El QR y
`verificationUrl` apuntan a `${WEB_APP_BASE_URL}/verify/portability/:hash`
del frontend (`scheduling/notices/agenda-notices.env.ts`); el hash público
se acepta en mayúsculas o minúsculas y se normaliza antes de consultar.

## Canales de contacto de la aseguradora

`PUT /insurance-carriers/:id/contact-channels` administra el WhatsApp, call
center y correo con los que la aseguradora atiende reclamos (Tarea 2,
CA-2.1..2.5). Autorización: sin `@Roles` (los roles del prompt original,
`ADMINISTRATOR`/`OWNER`, no existen en `role-mapping.ts`) — se resuelve como
`createPlan`, con `administrableCarrier()`, y un `:id` ajeno al carrier del
tenant activo responde `404` explícito.

`whatsappNumber` exige formato E.164 con el signo `+` y **mínimo 8 dígitos**
después de él (código de país incluido): un `@Transform` quita espacios,
paréntesis, puntos y guiones antes de validar, así que `+591 715-48278` y
`+591 (71) 548.278` se normalizan igual a `+59171548278`. `callCenterPhone`
no exige E.164 (las líneas gratuitas bolivianas del tipo `800-10-xxxx` no lo
son). `supportEmail` valida formato de correo. Los tres campos aceptan
`null` para borrar el canal ya cargado.

Lectura: `carrierWhatsappNumber`/`carrierCallCenterPhone` viajan en la
cabecera de cada solicitud de seguro (`GET /insurance-claims`, `GET
/insurance-claims/:id`) y en las coberturas propias del paciente (`GET
/profiles/patients/me`), `null`/ausentes cuando la aseguradora no los cargó.

## Campañas preventivas de la aseguradora

Proceso 4 del cliente, «MODULO DE PROMOCIONES» (Tarea 4 · M-06): la aseguradora
publica campañas de prevención junto a importadoras, fabricantes y laboratorios,
y el afiliado las ve en su portal. El contrato —actores, decisión D4, estados,
errores, qué ve el afiliado y los desvíos— vive en
[`docs/contracts/insurer-preventive-campaigns.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/contracts/insurer-preventive-campaigns.md).

Cinco rutas bajo `/insurance-campaigns`, todas con `@Roles()` vacío: la
autorización la resuelve `InsuranceCampaignsService` por membresía en el tenant
activo (aseguradora) o por titularidad del perfil (afiliado).

- `POST /` y `PATCH /:id/status` — sólo OWNER/ADMIN de la aseguradora o
  plataforma. Estados `DRAFT → ACTIVE ⇄ PAUSED → EXPIRED`; `EXPIRED` es terminal.
- `GET /` y `GET /:id` — cualquier miembro activo de la aseguradora.
- `GET /patient/:patientProfileId` — sólo el titular del perfil (403 y auditoría
  `INSURANCE_CAMPAIGN_ACCESS_DENIED` si no). Devuelve campañas `ACTIVE` dentro de
  su vigencia, de la aseguradora de una cobertura vigente propia, sin ningún
  identificador interno. La patología CIE-10 describe la campaña y nunca filtra
  afiliados (D4).

Tablas: `insurance.insurance_campaigns` e `insurance.insurance_campaign_partners`
(parche `v4223` del modelo). Acceso a datos en
`repositories/insurance-campaigns.repository.ts`.

## Solicitudes recibidas por la aseguradora (Hito 4 §A)

La cara de **quien paga** del mismo `insurance_claims` que el prestador ve en
`GET /insurance-claims`: aquélla acota por el prestador que envió, ésta por la
aseguradora que recibe. Contrato del front:
`mantra-core-health/docs/contracts/insurer-received-claims.md`.

| Método y ruta | Quién puede | Respuesta |
| --- | --- | --- |
| `GET /insurance/received-claims` | OWNER/ADMIN de la aseguradora activa, o `INSURANCE_OPERATOR` vigente **en ese tenant**, o plataforma | `200 { items, truncated }`: hasta 500, de la más reciente a la más vieja, importes como cadena decimal. `403` si la organización activa no es una aseguradora o la sesión no tiene permiso (mismo texto en los dos casos) |
| `POST /insurance/received-claims/:id/decision` | Los mismos | `200` con la solicitud completa. `404` si no existe o es de otra aseguradora; `409 { details.reason: 'ALREADY_DECIDED' }` si ya tiene dictamen; `422` si el monto o el motivo no son los que pide el resultado, o el pedido de origen cambió |

Reglas que no se deducen del código:

- **La aseguradora sale del tenant activo**, nunca de un parámetro. La autoridad
  es la membresía OWNER/ADMIN o un rol de aseguradora vigente en ese tenant
  (`roleAuthorizesInTenant`): un rol concedido en otra organización no vale.
- **El dictamen es definitivo.** Sólo se decide una solicitud `CLAIM_SUBMITTED`
  sin ninguna versión de adjudicación; la fila se bloquea (`FOR UPDATE`) antes de
  mirar, así que dos dictámenes concurrentes no crean dos versiones 1. No hay
  ruta que lo revierta. `POST /insurance-claims/:id/adjudications` sigue siendo
  otro camino, con su propia política (permite versionar).
- **Resultados.** `APPROVED` aprueba lo solicitado; `PARTIAL` exige
  `approvedAmount` mayor que cero y menor que lo solicitado; `REJECTED` aprueba
  cero. `PARTIAL` y `REJECTED` exigen `reason` de al menos 5 caracteres, y
  `approvedAmount` fuera de `PARTIAL` es 422. `PARTIAL` es el concepto nuevo
  `ADJUDICATION_PARTIAL`; el resumen de portabilidad lo cuenta como aprobado.
- **El monto se reparte entre renglones** en centavos exactos y en proporción a lo
  facturado (`services/received-claim-settlement.ts`): la suma es el monto
  aprobado y `aprobado + denegado = facturado` en cada renglón. Exige que los
  renglones sumen el total solicitado (422 si no).
- **Estado visible derivado.** El estado de la solicitud sólo distingue enviada,
  adjudicada, pagada y revertida; el resultado del dictamen decide si la
  adjudicada se ve `APPROVED`, `PARTIAL` o `REJECTED`. No existe `IN_REVIEW`.
- **Cláusula opcional.** `policyClauseReference` es una extensión aditiva del
  contrato: sin ella el dictamen se escribe igual, pero la liquidación del
  prestador queda «en revisión» (la transparencia de exclusiones exige cláusula
  en toda línea no aprobada).
- **Solicitud enlazada a un pedido.** Se vuelve a comprobar que el pedido no
  cambió desde que se presentó (mismo orden de locks que `ClaimsService`).
- **Facturación.** Un dictamen favorable publica `InsuranceClaimDecided` por el
  outbox, en la misma transacción (ids e importes, sin datos del paciente). **No
  están** `POST …/:id/invoice` ni `POST …/:id/invoice/annulment`, y `invoice`
  viaja siempre `null`: el modelo no declara dónde vive la factura del prestador
  a la aseguradora (`billing.invoices` exige práctica y paciente y no tiene
  anulación).

## Protección al paciente en el cobro con seguro (carril 16, REQ-16-026, 028 a 034)

Cuatro piezas, cada una con su responsabilidad. Todas parten del mismo cálculo del servidor,
`splitCoveredAmount` (`domain/coverage-split.ts`): paciente = copago + (monto − copago) × (100 − % de
cobertura) / 100, truncado a centavos a favor del paciente; aseguradora = monto − paciente.

| Pieza | Ruta | Qué garantiza |
| --- | --- | --- |
| `ClaimQuoteService` | `POST /insurance-claims/quote` | Cotiza sin efectos: no abre transacción, no bloquea ninguna fila y no guarda nada. Mismas reglas que el cobro real (`ClaimCoveragePolicy.quoteLine`) y misma puerta que el envío directo. |
| `ClaimPatientInvoiceService` | `POST /insurance-claims/:id/patient-invoice` | El servidor arma la factura al paciente con su parte calculada y la vincula a la línea del reclamo; el cliente no manda el monto. Un solo `FOR UPDATE` sobre el reclamo, tomado primero, serializa los pedidos; el índice único de la base es la red de seguridad y su violación sale como 422, no como 409. |
| `PatientConsentValidator` | (dentro de la factura) | El cobro particular de un servicio sin cobertura exige una aceptación previa del paciente, por el mismo importe. **La persistencia está bloqueada**: no existe la tabla en el modelo, así que el adaptador enlazado falla cerrado. |
| `PatientChargeObjectionService` | `POST /insurance-claims/:id/disputes` (rol `PATIENT`) | El paciente titular de la cobertura objeta el cobro con un motivo cerrado. Es una disputa del mecanismo existente (`claim_disputes`), idempotente. Mientras esté abierta, `POST /billing/payments-received:apply` rechaza el cobro de las facturas vinculadas (la pausa se deriva de la disputa y la apelación existente la levanta). |

La ruta de disputas sirve a dos actores y despacha por **quién es el actor**, no por el cuerpo
(`domain/actor-kind.ts`). `@PlatformTenantOptional('PATIENT')` evita exigirle una organización al
paciente; el personal sin rol de paciente conserva la resolución de tenant de siempre.

**Relación asistencial con quien cobra (REQ-16-035).** El modelo no guarda el tenant del paciente, y aseguradora
y prestador son organizaciones distintas, así que el cobro directo (`POST /insurance-claims` sin pedido vinculado)
y la cotización exigen que el paciente de la cobertura tenga una relación asistencial vigente con la organización
activa (`ClaimCareRelationshipGate`, que consulta `authz.care_relationships` por `PatientCareRelationshipPort`).
Vigente es: estado `ACTIVE`, `valid_from` no posterior al momento del cobro, `valid_to` nulo o posterior, `tenant_id`
de la propia fila igual al tenant activo y, si la relación está acotada a un propósito, que sea `PAYMENT` o `TREATMENT`
(una relación sin acotar también vale; una acotada a operaciones o emergencia no). Cuenta cualquier profesional de la
organización. La relación nace en el check-in (`POST /clinical/encounters/check-in`, con profesional principal) cuando
el paciente tiene huella propia en la organización (reservó por su cuenta o se autorregistró), quien registra es el propio
profesional o un `CLINICIAN`, y el paciente no revocó ni tiene pendiente una relación con ese profesional. Nace acotada a
`PAYMENT`: habilita el cobro y no abre la historia clínica. Con un paciente sin esa huella el check-in no la crea y el cobro
se rechaza hasta que el profesional la pide (`POST /authz/care-relationships/request`) y el paciente la acepta. El
paciente sale de la cobertura, nunca del cuerpo. Sin relación vigente la respuesta es el mismo 404 «Cobertura no
encontrada» de una cobertura inexistente, antes de comparar aseguradora o plan, para que el cobro no sirva para
descubrir coberturas ajenas. Los reclamos vinculados a un pedido de farmacia o diagnóstico y la factura al paciente
de un reclamo ya presentado no pasan por esta puerta.

**Capas.** La regla pura vive en `domain/patient-billing-enforcer.ts` (sin imports). Billing se alcanza
sólo por `PatientBillingPort`, cuyo adaptador `billing-patient-invoice.adapter.ts` es el único archivo del
módulo que importa `billing`. El aviso al paciente sale por `PatientNoticePort` después de confirmar la
transacción y nunca lanza.

**Trazabilidad.** Cada ruta nueva lleva `@Audited` (o `@NotAudited` con su motivo, la cotización). Como
`audit_log` no guarda motivo ni importes, estos viajan en eventos del outbox con payload de ids e importes,
nunca texto libre: `InsuranceClaimPatientInvoiceIssued`, `InsuranceClaimPatientInvoiceRejected`,
`InsuranceClaimPatientChargeObjected` e `InsuranceClaimPatientObjectionRejected` (ver
[catálogo de eventos](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/events/event-catalog.md)).

**Pendiente, declarado.** Persistencia de la aceptación del paciente (REQ-16-030, requiere el cambio de
modelo); desglose en el portal del paciente (REQ-16-031); aviso a personal de la práctica y a la
aseguradora y correo (REQ-16-032); rechazo de servicios ya reclamados que se facturan como particulares por
`issueFromEncounter` sin declarar el reclamo (REQ-16-029, segundo punto), porque los reclamos no guardan el
encuentro y una coincidencia por concepto de servicio bloquearía facturas legítimas.

## Contenido

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/insurance/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/insurance/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/insurance/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/insurance/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/insurance/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `insurance.concepts.ts` | Conceptos de terminología del módulo. |
| `insurance.module.ts` | Composición de dependencias del módulo NestJS. |
| `insurance-patient-settlement.module.ts` | Módulo aparte: puerto de lectura de la liquidación al paciente, sin dependencias circulares con los módulos operativos (lo consume `pharmacy_inventory`). |
| `insurance-currency.ts` | Mapa concepto de moneda → código (`BOB`, `USD`). |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Revisión backend 2026-10-05

El camino legacy de reclamos, la conciliación, los roles de lectura, el cálculo
de varianza y los límites de lotes tienen alcance incompleto.
