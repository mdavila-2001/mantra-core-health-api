<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/insurance/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `insurance`

**Fuente:** [`src/modules/insurance/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/README.md)
· 14 controllers · 17 services · 11 repositories · 29 entidades · 15 DTO

---

# src / modules / insurance

Agrupa los componentes relacionados con **insurance** y mantiene cohesionada esta responsabilidad del sistema.

## Liquidación al profesional (H8)

Transparencia de exclusiones, desglose de liquidación y lotes periódicos de
liquidación entre aseguradora y prestador (Tarea 3, resolución del handoff H8
del plan médico, `MED-E13..E16`). El contrato canónico —actores, vocabulario
de importes, exclusiones formales, ciclo del reclamo e inmutabilidad,
elegibilidad y calendario del lote, idempotencia, reversión y contención
financiera— vive en
[`docs/contracts/insurer-practitioner-settlement-batches.md`](../../../docs/contracts/insurer-practitioner-settlement-batches.md).

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
propiedades de pago en los DTOs. La prueba de integración HTTP end-to-end
queda **bloqueada** por un defecto ajeno a este carril (MikroORM/`ts-morph`
no resuelve los metadatos de `terminology.catalog_concepts` en este entorno);
ver el contrato §12 y el `REPORTE.md` de
`docs/trabajo/2026-09-24-insurance-exclusions-settlement-contracts/`.

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

## Contenido

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `insurance.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `insurance.module.ts` | Composición de dependencias del módulo NestJS. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

