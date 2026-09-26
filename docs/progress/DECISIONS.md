# Decisiones y ambigüedades registradas

Registro de decisiones de producto y de modelo que **ningún carril resuelve solo**. Cada entrada dice
qué se propone, con qué evidencia, quién la confirma y qué se construyó mientras tanto contra la
propuesta. Una decisión propuesta **no es una decisión tomada**: hasta que el propietario la
confirme, el código que la asume se declara como supuesto en el reporte del carril.

Formato: `ID · fecha · estado (PROPUESTA | CONFIRMADA | RECHAZADA) · carril que la pidió`.

---

## D-B · 2026-09-26 · PROPUESTA · M3 (API clínica)

**Pregunta:** ¿dónde viven los «aspectos médicos» que declara el paciente (grupo sanguíneo,
alergias que conoce, enfermedades crónicas, medicación actual, cirugías, antecedentes familiares,
hábitos)? Hoy `GET|PUT /clinical/me/medical-aspects` no existe (`git grep medical-aspects -- src` = 0
sobre `origin/test` @ `016caaa1`) y el modelo no tiene dónde guardarlo (CL-04 / CV-01).

**Contrato que el front ya consume** (`mantra-core-health` `origin/test`,
`src/app/core/data-access/clinical/clinical.client.ts:144-162` y `clinical.types.ts:798-823`):
sin id de paciente en la ruta; campos `bloodType`, `allergiesText`, `chronicConditionsText`,
`currentMedicationsText`, `surgeriesText`, `familyHistoryText`, `habitsText`, `updatedAt` (sólo
lectura); `PUT` con «campo ausente = no tocar, `''` = borrar» y respuesta con el estado completo;
un titular sin declaración recibe `{}`.

| Opción | Qué hay en el modelo | Encaje |
|---|---|---|
| **A · tabla propia** `clinical.patient_reported_health_statements`, una fila por titular | nada; se crea por `.puml` | calca 1:1 el contrato; un `PUT` = una transacción; separa lo **declarado y no verificado** de lo que registra el médico; no depende de `forms` |
| B · tablas clínicas existentes (`social_history`, `family_member_history`, `allergy_intolerances`, `observations`, `procedures`) | entidades sin servicio ni ruta; todas exigen un `*_concept_id NOT NULL` | obligaría a inventar conceptos para texto libre (prohibido por regla 00 §1) |
| C · `forms` (`form_instances` + `field_values`) | `GET /forms/me/instances` es sólo lectura y exige ancla en un encuentro | posible, pero hereda CL-66/CL-68 y exige ruta de escritura del paciente, ancla `PATIENT` y un concepto de fuente «declarado por el paciente» |
| D · `health_context` (esquema 44) | contexto sanitario **por país** | no sirve: no es del paciente |

**Propuesta: A.** Columnas: `id`, `patient_profile_id` (FK `profiles.patient_profiles.profile_id`,
**UNIQUE**), `blood_type_text varchar(20)`, `allergies_text`, `chronic_conditions_text`,
`current_medications_text`, `surgeries_text`, `family_history_text`, `habits_text` (`text`
nullable, tope 2000 en el DTO), auditoría estándar (`created_at`, `updated_at`,
`created_by_user_id`, `updated_by_user_id`) y `row_version`. Comentario del `.puml`: «declarado por
el titular, no verificado». Sin `custodian_tenant_id` (ver N-09). Historial: `row_version` +
auditoría estándar; sin versiones append-only (el dato lo corrige su propio titular).

**Qué se construyó contra la propuesta (M3):** entidad, repositorio, DTO, servicio y controlador
`GET|PUT /clinical/me/medical-aspects` en `src/modules/clinical/`, con unitarias. **No** se escribió
DDL: la tabla la agrega M1 en `mantra-core-health-model` (`diagram_08_clinical.puml` →
`gen_ddl.py` → `SQL/08_clinical` + patch → `yarn db:vendor`). Hasta entonces la ruta responde 500
en runtime (tabla ausente), y el arranque con `ORM_SCHEMA_SYNC=dry-run` lo reporta como
`tabla-ausente`.

**Quién confirma:** el propietario (opción) y quien mantiene el modelo (nombre y tipos).

---

## N-09 · 2026-09-26 · PROPUESTA · M3 (API clínica)

**Pregunta:** las tablas clínicas llevan `custodian_tenant_id NOT NULL` y el patch
`2026-09-19_v4219_custodian_tenant_rls.sql` les aplica RLS fail-closed por ese GUC. Una declaración
del paciente **no es custodia de ningún tenant**: ¿la tabla nueva lleva la columna o no?

**Propuesta:** **no la lleva**, y se declara la excepción. Motivo: el dato lo escribe y lo lee el
titular desde su cuenta, sin tenant en el request (`getCurrentTenantId()` puede ser `undefined` en
una sesión de paciente); forzar un tenant custodio inventaría una relación que el negocio no
declaró. La lectura del médico (cuando se agregue al resumen) queda cubierta por la política de
lectura de la historia (`assertPuedeLeerHistoria`), no por RLS.

**Riesgo:** la tabla queda fuera de la política RLS por tenant. Mitigación: la única ruta de
escritura resuelve al titular por el vínculo de cuenta y nunca acepta un id de paciente.

**Quién confirma:** el propietario / M1 (verificar contra `test/integration/rls.int-spec.ts` cómo
resuelve hoy el GUC una sesión de paciente sin tenant, antes de fijar la política de la tabla).

---

## CL-33 · 2026-09-26 · PROPUESTA · M3 (API clínica)

**Pregunta:** ¿se prohíbe todo UPDATE en `chart.clinical_note_versions`, sabiendo que rompería
`signVersion`? Medido en `origin/test`: `database/SQL/15_chart/` no tiene `05_constraints.sql`; los
WORM sólo existen en `10_audit`, `25_pharmacy_inventory` y `26_insurance`. En el modelo,
`diagram_15_chart.puml` marca `clinical_note_versions <<IMMUTABLE>>`,
`clinical_note_signatures <<IMMUTABLE>>` y `note_release_events <<LOG>>`, pero `gen_integrity.py`
no lee esos estereotipos: lee la matriz de `diagram_33_integrity.puml`.
`ChartNotesService.signVersion` (`chart-notes.service.ts:222-226`) hace UPDATE de la fila DRAFT →
SIGNED (`statusConceptId`, `signedAt`, `contentHash`, `releaseEligibilityConceptId`), y
`cosignVersion` (`:299-300`) vuelve a actualizar `statusConceptId` y
`releaseEligibilityConceptId` de una versión **ya firmada**.

**Propuesta:**

1. `chart.clinical_note_signatures` y `chart.note_release_events`: `UPDATE_DELETE : forbidden` en
   `diagram_33_integrity.puml` (barrera total, como `audit`).
2. `chart.clinical_note_versions`: **DELETE prohibido** y **UPDATE permitido sólo si
   `OLD.status_concept_id` es DRAFT** (trigger condicional). Eso preserva `signVersion`
   (DRAFT → SIGNED) y bloquea toda escritura posterior sobre lo firmado. Es una capacidad nueva de
   `gen_integrity.py` (patrón v4.0.10); no se escribe el trigger a mano en `SQL/`.
3. Consecuencia de código (fuera de las 13 microtareas de M3, se registra como pendiente):
   `cosignVersion` debe **insertar** en `clinical_note_signatures` sin tocar la fila de la versión,
   y `releaseVersion` derivar «cofirmada» y la elegibilidad de las firmas, no del estado de la
   versión. Con la barrera 2 aplicada, la cofirma actual fallaría en la base.

**Alternativa descartada:** (b) dejar `clinical_note_versions` sin barrera y abrir tarjeta — deja
el `<<IMMUTABLE>>` del modelo sin garantía en la base.

**Quién confirma:** el propietario (regla de negocio) y M1 (capacidad del generador).

---

## D-D · 2026-09-26 · PROPUESTA · M3 (API clínica)

**Pregunta:** las opciones de un campo de elección del generador de formularios, ¿son value sets
por campo o una tabla/columna de opciones? Medido: `forms.dynamic_field_definitions` tiene
`value_set_id` (FK `terminology.value_sets`) y `forms.field_values.value_concept_id` (FK
`terminology.concepts`); **no** hay `options`, `allow_other`, `rows` ni `description`. El front
(`forms.types.ts:204-218`) manda `options[]`, `multiple`, `description`, `allowOther`, `rows`,
`requireEachRow`, `oneResponsePerColumn` — y `docs/pendientes-backend-formularios.md` dice que
«viajan y se ignoran». **Es falso:** con `whitelist + forbidNonWhitelisted` la API responde **400**
a cualquier clave que el DTO no declare.

| Opción | Pro | Contra |
|---|---|---|
| **(a) value set local por campo** — el generador crea un value set del tenant con las opciones que escribe el médico; la captura guarda `value_concept_id` | respeta el modelo (`*_concept_id`, FK a `terminology.concepts`), respuestas analizables, coherente con la regla 97.4.7 («los catálogos cerrados se modelan como conceptos codificados») | más piezas: alta de conceptos por campo, gobierno de value sets de tenant, más lento de construir |
| (b) tabla `dynamic_field_options` (`field_id`, `ordinal`, `label`, estado) | opciones referenciables por id, retirables sin borrar | el valor capturado deja de ser un concepto; hay que decidir si `field_values` referencia la opción |
| (c) columna `options jsonb` en `dynamic_field_definitions` | lo más rápido | texto libre contra la regla del modelo; renombrar una opción deja valores huérfanos; la definición es global, así que las opciones de un tenant serían visibles para todos |

**Propuesta: (a)**, porque es la única coherente con el patrón existente del modelo y con la
regla 97.4.7. `allowOther`, cuadrículas y `oneResponsePerColumn` **no tienen lugar** en el modelo:
si (a) se confirma, el front deja de ofrecerlos contra la API real hasta que se modelen aparte.

**Qué se construyó mientras tanto (M3):** nada del modelo. `PATCH /forms/field-definitions/:id`
acepta sólo `name` y `dataType` (lo que el modelo ya tiene); cualquier otra clave sigue dando 400,
que es el comportamiento real y documentado.

**Quién confirma:** el propietario (producto) y quien mantiene el modelo.
