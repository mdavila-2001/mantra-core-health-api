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
| Jest `src/modules/consent` + `src/modules/clinical_ext` | 28 suites, 202 tests, verde | [evidencia/jest-consent-clinical_ext.txt](evidencia/jest-consent-clinical_ext.txt) |
| Jest completo | 10797 ok, 1 falla ajena (xlsx, ver archivo) | [evidencia/jest-full-resumen.txt](evidencia/jest-full-resumen.txt) |
| `yarn typecheck` | exit 0 | [evidencia/typecheck.txt](evidencia/typecheck.txt) |
| `yarn build` | exit 0 | [evidencia/build.txt](evidencia/build.txt) |
| ESLint de los dos módulos | exit 0 | [evidencia/lint.txt](evidencia/lint.txt) |
| `yarn lint` completo | no se ejecutó hasta el final: OOM en la sesión | idem |
| Patch SQL contra Postgres | no se ejecutó | — |
| OpenAPI regenerado | no se ejecutó (requiere app + infraestructura) | — |

## Pendientes y anotaciones (fuera de alcance)
- `GET /referrals` y `PATCH /referrals/:id/respond` siguen sin chequeo de historia/destino (comportamiento
  previo, no se cambió la política). `POST /referrals` tampoco exige escritura sobre la historia.
- `inventario/` y `schema-descriptions.generated.ts` ya estaban desactualizados antes del cambio; regenerar
  con la bóveda local quitaba módulos, así que no se tocaron.
- `tools/clinical-forms/*` aparece modificado en el árbol por otro trabajo de la sesión; no forma parte de
  este commit.
