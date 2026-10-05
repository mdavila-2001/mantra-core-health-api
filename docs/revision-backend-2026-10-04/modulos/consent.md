# Revisión del módulo `consent` — ALOVIDA

## 1. Alcance, método y límites

- Fecha: 2026-10-05. Unidad: `src/modules/consent`.
- Lectura: 66 archivos TypeScript no spec (6.761 líneas), 13 specs, controladores, DTO, servicios y repositorios de consentimiento, HIPAA, objeciones, restricciones, bases legales y acceso solicitado por profesional.
- Evidencia dinámica: `corepack yarn test src/modules/consent --runInBand --silent` → **13 suites y 54 tests pasan**. Son dobles sin tenant interceptor, RLS ni pacientes reales.
- No cubierto: conexión de mensajería, evaluación PDP/RLS en vivo, datos históricos y cada directiva de consentimiento.

## 2. Resumen ejecutivo

| Severidad | Total | Hallazgos |
|---|---:|---|
| Crítica | 1 | CON-01: writes de decisiones de privacidad aceptan paciente/tenant sin autorización de recurso. |
| Alta | 1 | CON-02: retiro, enmienda y revocación mutan documentos de consentimiento por UUID sin alcance. |
| Media | 1 | CON-03: omitir `tenantId` asigna decisiones sensibles al tenant seed. |

Las rutas `consent/me` y decisión de solicitud de profesional sí resuelven el perfil de la persona autenticada; no refutan los endpoints administrativos revisados.

## 3. Hallazgos confirmados

### CON-01 — Crítica — decisiones de privacidad no atan paciente y tenant al actor

**Evidencia.** Los endpoints de captura, restricción y autorización HIPAA requieren `SECURITY_ADMIN` ([consents.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/controllers/consents.controller.ts#L37-L49), [privacy-restrictions.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/controllers/privacy-restrictions.controller.ts#L24-L36), [hipaa-authorizations.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/controllers/hipaa-authorizations.controller.ts#L31-L41)). Sus servicios crean las filas con `dto.patientProfileId` y `dto.tenantId` sin consultar perfil, pertenencia ni tenant resuelto ([consents.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/consents.service.ts#L60-L129), [privacy-restrictions.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/privacy-restrictions.service.ts#L39-L91), [hipaa-authorizations.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/hipaa-authorizations.service.ts#L47-L113)).

**Impacto y plan.** Un actor con el rol que no esté autorizado para el paciente puede crear consentimiento, restricción o autorización de divulgación sobre otra persona y tenant. Resolver paciente y tenant desde una política común, comprobar persona/práctica/organización y validar que el propósito/base legal pertenece al mismo alcance antes de persistir; no admitir tenant suministrado si se puede derivar de sesión o perfil.

### CON-02 — Alta — mutaciones posteriores buscan documentos por ID sin alcance

**Evidencia.** Retiro y enmienda cargan `consentsRepo.findById(tx, id)` ([consents.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/consents.service.ts#L133-L190), [#L206-L230](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/consents.service.ts#L206-L230)); revocación HIPAA hace `authRepo.findById(tx, id)` ([hipaa-authorizations.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/hipaa-authorizations.service.ts#L116-L150)). Los repositorios implementan esas consultas como `{ id }` y los controladores no aportan política adicional.

**Plan.** Cargar por `(id, tenant autorizado)` y validar paciente/actor antes de cambiar estado. Devolver el mismo resultado para ID ajeno e inexistente, registrar la denegación y hacer la revocación de grants dentro de ese alcance.

### CON-03 — Media — el fallback a tenant seed contamina decisiones de producción

**Evidencia.** Captura, restricción y HIPAA hacen `dto.tenantId ?? SEED.tenantId` ([consents.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/consents.service.ts#L94-L107), [privacy-restrictions.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/privacy-restrictions.service.ts#L53-L65), [hipaa-authorizations.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/services/hipaa-authorizations.service.ts#L74-L90)). Los DTO hacen opcional el tenant.

**Plan.** Prohibir fallback seed fuera de fixtures; obtener tenant de contexto y rechazar ausencia/mismatch. Auditar filas ya creadas con el tenant seed antes de migrar.

## 4. Pruebas de cuatro puntos

| ID | Correcto | Límite | Error | Falla catalogada propuesta |
|---|---|---|---|---|
| CON-01 | Admin autorizado T1 captura decisión para paciente T1. | propósito/base legal T1 válido. | T1 usa paciente o tenant T2; cero writes. | `404/RESOURCE_NOT_FOUND/CONSENT_PATIENT_NOT_AVAILABLE`. |
| CON-02 | Actor autorizado retira/revoca propio documento. | retiro también cierra grants dependientes. | UUID T2 no cambia filas/grants. | `404/RESOURCE_NOT_FOUND/CONSENT_DOCUMENT_NOT_AVAILABLE`. |
| CON-03 | contexto T1 deriva tenant T1. | tenant explícito igual al contexto, si el contrato lo conserva. | tenant ausente o distinto. | `400/VALIDATION_FAILED/CONSENT_TENANT_SCOPE_INVALID`. |

## 5. Catálogo y olas

| Ola | Hallazgos | Acción |
|---|---|---|
| 0 | CON-01, CON-02 | Política de paciente/tenant en servicios, lookup con alcance y pruebas T1/T2. |
| 1 | CON-03 | Retirar fallback seed, migrar/auditar datos y añadir reason estable. |

Reasons propuestos: `CONSENT_PATIENT_NOT_AVAILABLE`, `CONSENT_DOCUMENT_NOT_AVAILABLE` y `CONSENT_TENANT_SCOPE_INVALID`. Los 54 tests verdes no cubren cruce de tenant o paciente.
