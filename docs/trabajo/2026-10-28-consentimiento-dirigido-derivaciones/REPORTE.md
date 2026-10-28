# Reporte — Consentimiento informado dirigido y derivaciones a servicios específicos (API)

- Fecha: 2026-10-28 · Plan: [PLAN.md](PLAN.md) · Modelo: `mantra-core-health-model` d6d0bbc (v4.2.63)
- Peldaño alcanzado: **TESTED** (unitarios dirigidos en verde, typecheck y build con salida 0).
  **No VERIFIED**: no hubo Postgres ni infraestructura en la sesión; el patch y los endpoints no se
  ejercitaron contra una base real.

## Qué cambió
- `database/SQL/patches/2026-10-28_v4263_*.sql`: copia idéntica del patch del modelo.
- `database/SQL/07_consent/*` y `database/SQL/18_clinical_ext/*`: espejo de esos dos módulos desde el
  modelo (incluye `05_constraints.sql` nuevos y, por ser espejo de archivo completo, el desfase previo de
  18: `cds_rule_versions`, `uq_virtual_encounters_encounter_id`, `uq_care_gaps_open_logical_key`,
  `uq_referrals_source_encounter_target_specialty`). `apply_all.sql` incluye ambos `05_constraints.sql`.
  El resto del desfase `database/` ↔ modelo (38 faltantes / 103 distintos) **no** se vendorizó.
- `consent`: entidad con 28 columnas nuevas (§1.1 + enmienda 1), DTO ampliado, `GET` lista/uno,
  `PATCH withdraw`, `PATCH post-emergency-information`, `POST :id/evidence` (reutiliza
  `ConsentEvidenceService`), respuesta con `status`/`decision` legibles, `evidence[]` y `signatureStatus`.
  `POST` abierto a `CLINICIAN`/`PRACTITIONER` con paciente/tenant del encuentro y `assertCanWriteHistory`.
- `clinical_ext`: entidad con 13 columnas nuevas, `POST` tipado con reglas (sólo cuando viene
  `referralType`), consentimiento verificado, `GET :id`, `respond` con `rejectReason`,
  `PATCH counter-referral`, `PATCH cancel`, respuesta con estado legible y nombres de sede/tenant.

## Evidencia
| Gate | Resultado | Archivo |
|---|---|---|
| Jest `src/modules/consent` + `src/modules/clinical_ext` (tras la corrección) | 28 suites, 211 tests, verde | [evidencia/jest-consent-clinical_ext.txt](evidencia/jest-consent-clinical_ext.txt) |
| Jest completo (corrida previa a la corrección) | 10797 ok, 1 falla ajena (xlsx, ver archivo) | [evidencia/jest-full-resumen.txt](evidencia/jest-full-resumen.txt) |
| `yarn typecheck` | exit 0 | [evidencia/typecheck.txt](evidencia/typecheck.txt) |
| `yarn build` | exit 0 | [evidencia/build.txt](evidencia/build.txt) |
| ESLint de los dos módulos | exit 0 | [evidencia/lint.txt](evidencia/lint.txt) |
| `yarn lint` completo | no se ejecutó hasta el final: OOM en la sesión | idem |
| Patch SQL contra Postgres | no se ejecutó | — |
| OpenAPI regenerado | no se ejecutó (requiere app + infraestructura) | — |

## Corrección de seguridad (revisión automática sobre b19cc52d)
La respuesta de derivaciones ahora lleva datos clínicos, así que la política previa no alcanzaba:
- `PATCH /referrals/:id/respond` exige ser destino (profesional, tenant o tenant de la sede):
  403 `REFERRAL_RESPOND_FORBIDDEN`. Una derivación sólo externa no se responde en la plataforma.
- `GET /referrals?patientProfileId=` exige `assertCanReadHistory`; `POST /referrals` exige
  `assertCanWriteHistory`. `GET /referrals/me` ya resolvía el paciente desde la cuenta.
- Vínculo consentimiento ↔ derivación: `POST /referrals` rechaza `informedConsentId`
  (400 `REFERRAL_CONSENT_LINK_NOT_ALLOWED`), porque un consentimiento que apunte a esa derivación no
  puede existir antes de crearla. El vínculo lo escribe `POST /consent/treatment-informed-consents` con
  `targetType=REFERRAL` y decisión ACCEPTED, en la misma transacción, si el vínculo estaba vacío o
  apuntaba a un consentimiento revocado o no aceptado. Revocar desvincula (`informed_consent_id = NULL`)
  todas las derivaciones que lo usaban: se eligió desvincular porque deja la derivación sin
  consentimiento visible en vez de depender de que cada cliente interprete una marca.
- Smoke `test/smoke/modules/clinical_ext.smoke.ts`: el caso REJECT de 404 ahora envía `rejectReason`
  (sin él el contrato devuelve 400). Los smoke no se corrieron (requieren la API levantada).

## Pendientes y anotaciones (fuera de alcance)
- `inventario/` y `schema-descriptions.generated.ts` ya estaban desactualizados antes del cambio; regenerar
  con la bóveda local quitaba módulos, así que no se tocaron.
- `tools/clinical-forms/*` aparece modificado en el árbol por otro trabajo de la sesión; no forma parte de
  este commit.
