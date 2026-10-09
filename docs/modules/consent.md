<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/consent/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `consent`

**Fuente:** [`src/modules/consent/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/README.md)
· 11 controllers · 11 services · 9 repositories · 10 entidades · 16 DTO

---

# Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence)

Directivas de privacidad, bases legales de procesamiento y evidencia de
consentimiento. Implementa los 12 casos de uso UC-07-01..12 como endpoints REST,
siguiendo el stack de referencia (IAM): controladores finos, servicios dueños de
la transacción, repositorios stateless y conceptos de dominio versionados.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/consent -name '*.controller.ts' | wc -l
  find src/modules/consent -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/consent -name '*.entity.ts' | wc -l
  find src/modules/consent -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **11 controllers, 22 rutas HTTP, 10 entidades y 11 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`AuditModule`, `MessagingModule`, `ClinicalModule`).

Entidades (`tableName`, 10 de 10 archivos `*.entity.ts`): `consent_events`, `consent_evidence`, `consent_provisions`, `consents`, `hipaa_authorizations`, `patient_objections`, `privacy_restrictions`, `processing_legal_bases`, `processing_purposes`, `treatment_informed_consents`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /consent/consent-evidence` | SECURITY_ADMIN | `consent-evidence` |
| `GET /consent/me/consents` | PATIENT | `consent-me` |
| `GET /consent/me/hipaa-authorizations` | PATIENT | `consent-me` |
| `GET /consent/me/objections` | PATIENT | `consent-me` |
| `GET /consent/me/treatment-informed-consents` | PATIENT | `consent-me` |
| `POST /consent/me/consents/:id/withdraw` | PATIENT | `consent-me` |
| `POST /consent/internal/expiration-sweep` | SYSTEM, SECURITY_ADMIN | `consent-sweep` |
| `POST /consent/consents` | SECURITY_ADMIN | `consents` |
| `POST /consent/consents/:id/withdraw` | SECURITY_ADMIN | `consents` |
| `PATCH /consent/consents/:id/provisions` | SECURITY_ADMIN | `consents` |
| `POST /consent/encounters/:encounterId/informed-consent` | CLINICIAN, PRACTITIONER | `encounter-informed-consents` |
| `GET /consent/encounters/:encounterId/informed-consent` | CLINICIAN, PRACTITIONER | `encounter-informed-consents` |
| `POST /consent/hipaa-authorizations` | SECURITY_ADMIN | `hipaa-authorizations` |
| `POST /consent/hipaa-authorizations/:id/revoke` | SECURITY_ADMIN | `hipaa-authorizations` |
| `POST /consent/patient-objections` | SECURITY_ADMIN | `patient-objections` |
| `POST /consent/patient-objections/:id/resolve` | SECURITY_ADMIN | `patient-objections` |
| `POST /consent/practitioner-access-requests` | PRACTITIONER, CLINICIAN | `practitioner-access-requests` |
| `GET /consent/practitioner-access-requests/mine` | PATIENT | `practitioner-access-requests` |
| `POST /consent/practitioner-access-requests/:id/decision` | PATIENT | `practitioner-access-requests` |
| `POST /consent/privacy-restrictions` | SECURITY_ADMIN | `privacy-restrictions` |
| `POST /consent/processing-legal-bases` | SECURITY_ADMIN | `processing-legal-bases` |
| `POST /consent/treatment-informed-consents` | SECURITY_ADMIN | `treatment-informed-consents` |

## Endpoints (UC → ruta)

| UC | Método y ruta | Resumen |
|----|---------------|---------|
| UC-07-01 | `POST /consent/consents` | Capturar consentimiento de directiva de privacidad (+ provisiones + evento granted) |
| UC-07-02 | `POST /consent/consents/{id}/withdraw` | Retirar consentimiento y disparar re-evaluación de accesos |
| UC-07-03 | `POST /consent/patient-objections` | Registrar objeción y (opcional) materializar restricción (include UC-07-07) |
| UC-07-04 | `POST /consent/hipaa-authorizations` | Otorgar autorización HIPAA de divulgación |
| UC-07-05 | `POST /consent/hipaa-authorizations/{id}/revoke` | Revocar autorización HIPAA |
| UC-07-06 | `POST /consent/processing-legal-bases` | Establecer/versionar base legal (supersede la anterior) |
| UC-07-07 | `POST /consent/privacy-restrictions` | Aplicar restricción de privacidad que afecta RLS clínico |
| UC-07-08 | `POST /consent/treatment-informed-consents` | Capturar consentimiento informado de tratamiento |
| UC-07-09 | `PATCH /consent/consents/{id}/provisions` | Actualizar provisiones granulares (soft-close + insert) |
| UC-07-10 | `POST /consent/consent-evidence` | Registrar evidencia inmutable (append-only) |
| UC-07-11 | `POST /consent/internal/expiration-sweep` | Barrido de expiraciones (worker) |
| UC-07-12 | `POST /consent/patient-objections/{id}/resolve` | Resolver objeción (upheld/rejected) |

## Entidades

`consent.consents`, `consent.consent_provisions`, `consent.consent_events`
(append-only), `consent.consent_evidence` (IMMUTABLE append-only),
`consent.hipaa_authorizations`, `consent.patient_objections`,
`consent.privacy_restrictions`, `consent.processing_legal_bases` (versionada),
`consent.treatment_informed_consents`.

## Reglas de negocio

- **Unicidad**: rechazo (`409`) de un segundo consentimiento activo por
  (paciente, propósito) y de una segunda objeción abierta por (paciente, propósito).
- **Transiciones**: withdraw/revoke/resolve exigen el estado de origen correcto
  (`active`/`raised`), si no `409`; recurso inexistente → `404`.
- **Versionado** (UC-07-06): la versión vigente se cierra (`valid_to=now`, estado
  `superseded`) antes de insertar la nueva versión activa.
- **Include UC-07-10**: la evidencia es append-only, sin `row_version`.
- **Cada escritura** deja un evento append-only en `consent_events`
  (`previous_status`/`new_status` con `STATUS_NONE` cuando no hay estado previo).
- **Flush padre-antes-de-hijo**: las FK son columnas uuid planas; se hace
  `tx.flush()` tras el padre antes de crear provisiones/eventos/restricciones.

## Permisos

Guard JWT global. Todos los endpoints requieren rol `SECURITY_ADMIN` (perfil DPO /
admin de seguridad); el barrido interno también. `patient_profile_id`,
`processing_purpose_id`, `encounter_id` y demás FK cruzadas llegan por DTO desde el
cliente.

## Logs

Pino estructurado por operación (`operation: 'consent.*'`), sin PHI ni secretos:
inicio, éxito y rechazos de regla de negocio.

## Conceptos y smoke

- Conceptos de módulo: `consent.concepts.ts` → export `CONSENT_CONCEPT_SEEDS` y `CONS`.
- Smoke transversal: `test/smoke/modules/consent.smoke.ts` → export `CONSENT_SMOKE`.

## Tests

Specs unitarios junto a cada servicio (`*.service.spec.ts`, repos/em mockeados) y
un spec de delegación de controladores. Verificado con:

```bash
npx tsc --noEmit -p tsconfig.json | grep modules/consent   # vacío
NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/consent   # verde
```

## Revisión backend 2026-10-05

La [revisión estricta](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/consent.md)
registra pendientes de alcance para decisiones, retiro y revocación de
consentimiento, además del fallback al tenant seed. La corrida dirigida pasó
13 suites y 54 tests; faltan pruebas de dos tenants y de titularidad del paciente.
