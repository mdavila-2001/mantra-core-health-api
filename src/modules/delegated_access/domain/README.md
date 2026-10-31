# src / modules / delegated access / domain

Reglas puras del personal de apoyo: sin base de datos ni Nest, solo datos de
entrada y un veredicto. Es lo que hace a `SupportAccessPolicy` testeable como
tabla de casos.

## Contenido

### Archivos

| Archivo                             | Responsabilidad                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `support-actions.ts`                | Los 15 códigos heredados (alias de átomos; también `SUPPORT_LEGACY_ACTIONS`), el paquete v1 de cada plantilla y sus ids de permiso.                                             |
| `support-targets.ts`                | Tipos de objetivo, qué dimensión acota cada uno, validación de referencias y forma de la foto congelada (`FIXED`).                                                              |
| `support-access.evaluation.ts`      | Fachada pública: reexporta tipos y `grantCovers`; `evaluateSupportAccess` (envoltorio `{allowed, reason, grantId}`), `canSearchPatients`, `canRegisterPatients` (sobre átomos). |
| `support-access.types.ts`           | `SupportAccessReason` (8 de siempre + 29 nuevos), `SupportAccessDecision` (efecto PERMIT/DENY/CHALLENGE), hechos de vínculos, permisos y pregunta.                              |
| `support-access.decide.ts`          | `evaluateSupportAccessV2`: el motor (§3.8). DENY gana, ALLOW suman, lo indeterminado cierra; devuelve decisión, traza, obligaciones y consumos.                                 |
| `support-access.candidates.ts`      | Piezas del motor: átomos de un permiso (alias `LEGACY` / átomo `ATOM`), condiciones ilegibles, obligaciones efectivas, desempate determinista.                                  |
| `support-access.coverage.ts`        | `grantCovers` y `withinWindow` (cobertura por doctor, servicio y ubicación, sin cambios).                                                                                       |
| `support-access.fields.ts`          | Campos visibles: el menos enmascarado entre permisos aplicables, nunca más que el piso de la organización.                                                                      |
| `support-access.trace.ts`           | Construcción de la traza (`PolicyTrace`) paso a paso.                                                                                                                           |
| `support-access.decide.testing.ts`  | Datos de prueba del hospital piloto (solo para `*.spec.ts`; no se exporta).                                                                                                     |
| `support-permission-catalog.ts`     | Los 73 átomos con metadatos e ids deterministas, los 15 alias (`LEGACY_BUNDLES`, `LEGACY_PRIMARY`), `atomMatchesPattern`.                                                       |
| `support-template-packages.ts`      | Paquetes por defecto v2 y techo máximo por plantilla (datos de plataforma).                                                                                                     |
| `support-access-context.ts`         | Tipos de `SupportAccessContext`, `SupportAccessFacts`, reglas de la organización y contadores.                                                                                  |
| `support-conditions.ts`             | Condiciones ABAC v1: tipos, aplicabilidad por átomo, `requiredFacets` y `evaluateConditions` (T/F/I).                                                                           |
| `support-conditions.validate.ts`    | `validateCondition`: los 12 códigos de §3.10 (más `CONDITION_VALUE_INVALID`) y las 9 combinaciones de §3.6.                                                                     |
| `support-condition.schema.ts`       | JSON Schema 2020-12 de la forma de `condition_json` v1 (publicado en `schemas/`).                                                                                               |
| `support-time.ts`                   | Ventanas horarias y periodos en la zona de la organización; falla cerrado.                                                                                                      |
| `support-guardrails.ts`             | Barandillas L0 (GP-1…GP-9), techos por plantilla y validación de concesiones.                                                                                                   |
| `support-field-mask.ts`             | `applyFieldMask` (PARTIAL/REDACT/NULLIFY/HASH) y orden de visibilidad.                                                                                                          |
| `support-describe.ts`               | Textos determinísticos en lenguaje simple (Anexo C).                                                                                                                            |
| `support-policy-trace.ts`           | Tipos de la traza de decisión (`PolicyTrace`).                                                                                                                                  |
| `support-explain.ts`                | Contratos de explicar y simular como tipos, `classifyChange` y `summarizeImpact`.                                                                                               |
| `support-canonical-json.ts`         | `canonicalJson` (claves ordenadas, fechas ISO UTC) y `sha256Hex`: base de los hashes de cuerpo de aprobación y de evidencia de campaña.                                         |
| `support-grant-targets.ts`          | A qué doctor, servicio y espacio apunta un permiso (`targetCells`), `grantsOverlap`, `targetWithin`, y los átomos efectivos de una persona (`effectiveAtoms`).                  |
| `support-sod.ts`                    | Segregación de funciones: las 11 reglas de plataforma, `evaluateSod`, excepciones con vencimiento, `checkSodTransaction` y la regla «la organización endurece, no afloja».      |
| `support-privilege-score.ts`        | Puntaje de privilegios, deriva contra el paquete de la plantilla y acumulación (`privilegeCreep`, D-20).                                                                        |
| `support-reviewer-resolver.ts`      | `resolveReviewer` y `escalationTargets`: quién revisa cada concesión sin ser la persona, quien otorgó ni quien aprobó (`SOD-GOV-02`).                                           |
| `support-lifecycle.ts`              | Ingreso (lista y compuerta), cambio (`planMove`), baja (`planHandover`, orden revoca-primero), suspensión, inactividad y elegibilidad del dueño.                                |
| `support-four-eyes.ts`              | Cuatro ojos: aprobadores elegibles, máquina de estados, TTL, consumo único, hash del cuerpo y no autoaprobación.                                                                |
| `support-anomaly-rules.ts`          | Las 7 reglas de anomalías como funciones sobre series ya agregadas, con evidencia sin PHI y ventanas idempotentes del barrido.                                                  |
| `support-access-review.ts`          | Campañas de certificación: alcance, selección de ítems, evidencia y su hash, resultados; reexporta las tres partes siguientes.                                                  |
| `support-access-review.shared.ts`   | Valores por defecto de campañas (`REVIEW_DEFAULTS`), sensibilidad y «sin uso».                                                                                                  |
| `support-access-review.decision.ts` | Decisiones de un ítem: quién decide, comentario exigido, ajuste que solo reduce y decisión en lote todo-o-nada.                                                                 |
| `support-access-review.schedule.ts` | Recordatorios, escalamiento, cierre con auto-revocación (D-09), recertificación mensual y cadencia (D-08).                                                                      |
| `support-team-admin.ts`             | Administración delegada con techo: techo efectivo, `checkDelegatedGrant`, alcance sobre toda la persona.                                                                        |
| `effective-access.expansion.ts`     | Expansión de un permiso a filas de `effective_support_access` (NULL = cualquiera).                                                                                              |
| `support-patient-rules.ts`          | Búsqueda exacta de pacientes y visibilidad clínica por defecto.                                                                                                                 |
| `index.ts`                          | Punto de exportación pública de la carpeta.                                                                                                                                     |

## Gobierno de usuarios (IGA)

Todo lo de gobierno es función pura sobre datos que entran por parámetro; los
servicios cargan los hechos, llaman estas funciones y escriben el resultado. Los
tipos de estado usan el nombre del concepto sin su prefijo (`'PENDING'` es
`delegated_access:REVIEW_ITEM_PENDING`, `'DOCTOR_OWNER'` es
`REVIEWER_KIND_DOCTOR_OWNER`, `'SECOND_APPROVER'` es `authz:APPROVAL_SECOND_APPROVER`);
los tipos de anomalía conservan el nombre completo (`ANOMALY_SEARCH_SPIKE`).

| Qué se decide                                     | Dónde                                                        | Reglas que fija                                                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conflicto de funciones al otorgar o en lo ya dado | `evaluateSod`, `summarizeSod`                                | Unión de permisos `ALLOW` vivos con alias expandidos (las `DENY` no restan). `BLOQUEAR` → 422 `SOD_CONFLICT_BLOCKED`; `EXIGIR APROBACIÓN` → 409 `SOD_EXCEPTION_REQUIRED`. |
| Excepción de SoD                                  | `validateSodExceptionRequest`, `expiredSodExceptions`        | Solo `EXIGIR APROBACIÓN` y no dura; justificación ≥ 30; `valid_to` obligatorio, futuro y ≤ min(ajuste 90, regla, 180).                                                    |
| Reglas que impone el servicio al ejecutar         | `checkSodTransaction`                                        | `SOD-GOV-01`, `SOD-GOV-02`, `SOD-BILL-05`: la misma persona no está en las dos puntas de un hecho.                                                                        |
| Reglas de la organización                         | `validateSodRuleDerivation`, `mergeSodRules`                 | Endurecen, nunca aflojan (acción, `is_hard`, conjuntos, alcance, días de excepción).                                                                                      |
| Puntaje y deriva                                  | `privilegeScore`, `privilegeCreep`                           | BAJA 1, MEDIA 2, ALTA 5, CRÍTICA 10; marca con deriva ≥ umbral (15) o ≥ 2 concesiones sin revisión desde la última certificación.                                         |
| Revisor de un ítem                                | `resolveReviewer`, `escalationTargets`                       | Doctor único → doctor; servicio o espacio → jefe cuyo alcance lo contiene; el resto → administrador; `MOVER` y `TARGETED` → dueño. Nunca sujeto, otorgante ni aprobador.  |
| Selección y evidencia de una campaña              | `selectCampaignItems`, `buildReviewEvidence`, `hashEvidence` | Un ítem por concesión (por vínculo en recertificación); evidencia solo con identificadores y números; hash SHA-256 del JSON canónico.                                     |
| Decisión sobre un ítem                            | `validateReviewDecision`, `evaluateBulkDecision`             | Comentario ≥ 10 para revocar, ajustar y certificar lo ALTA/CRÍTICA o sin uso; el ajuste solo reduce; el lote es todo-o-nada y solo `CERTIFY` de ≤ MEDIA con uso.          |
| Tiempos de una campaña                            | `reminderDue`, `escalationDue`, `planCampaignClosure`        | Recordatorios `−7/−3/−1` y a diario desde el vencimiento; escala a los 3 días; cierra a `due + gracia` y auto-revoca (D-09) salvo `MOVER` y los ítems de vínculo.         |
| Ingreso                                           | `evaluateJoinerChecklist`, `onboardingGate`                  | Siete ítems; la compuerta rige para vínculos posteriores a `onboardingRequiredSince`; plazo de 7 días.                                                                    |
| Cambio de rol                                     | `planMove`, `moveRequiresFourEyes`                           | Lo anterior vence en `effectiveAt`; cuatro ojos si el puntaje sube más de 10 o aparece un átomo ALTA nuevo; campaña `MOVER` de 14 días que solo escala.                   |
| Baja con traspaso                                 | `planHandover`, `verifyRevokeBeforeReassign`                 | Revoca y confirma primero, reasigna después; el nuevo dueño de las cuentas es obligatorio; la cita pendiente no cambia de dueño (D-21).                                   |
| Cuatro ojos                                       | `eligibleApprovers`, `decideFourEyes`, `consumeFourEyes`     | Aprobador ≠ solicitante ≠ beneficiario; CRÍTICA solo `SECURITY_ADMIN` con paso extra; TTL de 60 min y consumo único; el cuerpo se firma con SHA-256.                      |
| Anomalías                                         | `detect*`, `anomalyWindow`                                   | Siete reglas deterministas; la evidencia no lleva datos de pacientes.                                                                                                     |
| Administración delegada                           | `checkDelegatedGrant`, `checkWholePersonScope`               | Alcance (`targetWithin`), techo efectivo, `maxValidDays`; toda la persona debe caber en el alcance para suspender o dar de baja.                                          |

Fuera de este directorio: la lectura de datos, la escritura, las transacciones
y los avisos son de los servicios; el dominio no importa Nest ni el ORM.

## Criterios de mantenimiento

- Nada de I/O acá: lo que necesite datos entra por parámetro.
- Un cambio de regla se refleja en `support-access.evaluation.spec.ts` (la tabla del hospital piloto, que NO se edita: es el criterio de no regresión AC-1) o en las specs nuevas (`support-access.decide.spec.ts`, `support-access.properties.spec.ts`).
- El motor es determinista: nada de aleatoriedad ni de orden de base de datos; los empates se resuelven por reglas fijas (menos obligaciones, objetivo más estrecho, `grantId`).
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
