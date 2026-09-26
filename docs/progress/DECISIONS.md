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


---

## H2 · 2026-09-26 · PROPUESTA · M7 (BR-07 · BR-08 · BR-09)

Decisiones abiertas de los tres prompts. Ninguna detuvo el hito: cada una se resolvió por el criterio
**más seguro** (no cambia semántica para otros clientes, no toca el modelo, no inventa catálogos) y
queda escrita para que el propietario la confirme o la revierta. Los pedidos al modelo y a M1 están en
`docs/progress/evidence/lane-M7-h2/REPORT.md`.

| ID | Pregunta | Criterio elegido | Por qué |
|---|---|---|---|
| D-BR07-1 | Correo del médico sin institucional (ID-12) | **A**: el front manda `personalEmail === email`; la API, con `workEmail` ausente y `personalEmail` igual a `email`, no crea contacto WORK | no cambia lo que persiste el alta asistida ni el alta administrativa (opción B tocaba ambos flujos); un cliente que no manda `personalEmail` sigue igual (probado) |
| D-BR07-2 | `boardCertified` en la corrección de especialidad | **se acepta** en `PATCH me/specialties/:id` | el tipo del front ya lo declara y omitirlo daba 400; la columna existe; `isPrimary` sigue afuera (400) |
| D-BR07-3 | ¿La CI se corrige desde el perfil? (P28) | **A**: se corrigen sexo al nacer y departamento emisor; el número queda de solo lectura | no toca el modelo ni la cadena CI → matrícula verificada; el departamento se valida contra `VS_BO_DEPARTMENT` (422) |
| D-BR07-4 | Métricas de calidad (ID-14) | **A**: el front no las dibuja sin datos y dice que no hay; el simulador deja de fabricarlas | no se inventan fórmulas que el modelo no respalde; la opción B (calcular en la API) queda como TODO con cada fórmula por definir |
| D-BR07-5 | Borrar una matrícula con historial de auditoría | **no se borra: 422** (se mira la historia y los casos abiertos antes; nunca se captura un `23503`) | la FK `audit.jurisdiction_authorizations_history` no tiene `ON DELETE`; retirar con `valid_to` cambiaría lo que el resumen lista |
| D-BR08-1 | Ciudad del título | **pedido a M1** (`issuing_city_text` en `professional_credentials`, 4 capas); mientras tanto **C transitoria**: el campo sigue visible con el aviso «todavía no se guarda» que ya tenía la pantalla | quitarlo (B) reescribe 29 pruebas y contradice el pedido del dueño; el aviso ya existía. No se agregó `issuingCityText` a ningún DTO sin columna |
| D-BR08-2 | Empresa «Otra» (ID-11) | **A**: el front no manda el concepto con «Otra» | una línea, misma regla que la ocupación; evita chocar con el PR #454 |
| D-BR08-3 | País del título | **B**: no se expone `issuingCountryConceptId` | `VS_COUNTRY` no tiene miembros y no hay lista con fuente aprobada; sembrar una inventada está prohibido. Pedido a M1: sembrar `VS_COUNTRY` con fuente citada (ISO 3166) |
| D-BR08-4 | Universidad del título principal sin número | se une a la fila universitaria **con número** de «Tus títulos»; sin una fila que la lleve el alta se frena y lo dice | una credencial exige número (NOT NULL); mandar un número inventado o descartar la universidad en silencio están descartados |
| D-BR09-1 | Radioprotección (sin clave en el DTO) | **C**: sale del formulario del alta | ofrecer un PDF que se tira es peor que no pedirlo; necesita un rol de documento nuevo (modelo, M1) y se pide luego desde el panel |
| D-BR09-2 | Sucursales en el alta (CL-42) | **B**: el front avisa que se cargan tras la verificación y no viajan | `POST /diagnostic-units/:id/sites` es `SECURITY_ADMIN` (BR-06): crearlas en el alta daría algo que el dueño no puede administrar |
| D-BR09-3 | Alta del hospital (CV-03) | **camino decidido, pantalla diferida**: `register-organization` con `tenantType: HOSPITAL` (la API ya lo acepta); la materialización en `orgext` y la activación las hace la plataforma | `orgext` no tiene lecturas ni alta pública y `CreateHospitalDto` exige `practiceId`; queda como tarjeta |
| D-BR09-4 | Modalidad de laboratorio | se agrega `MODALITY_LABORATORY` a la lista cerrada de modalidades y se publican tres enumeraciones (`diagnostic-unit-type`, `diagnostic-modality`, `tenant-country`) | sin la modalidad la validación existente (422) rechazaba a todo laboratorio; sin enumeraciones públicas el front tendría que hardcodear uuid. Sin DDL: las materializa el seed |
| D-BR09-5 | Jurisdicción del alta | `JURISDICTION_NATIONAL` | es la única con alcance nacional del catálogo; SEDES existe sólo para Santa Cruz. Falta un value set de jurisdicciones por departamento |
| D-BR09-6 | Dueño y representante en una sola pantalla | `owner.displayName` (forma sin partes que la API acepta) y `legalRepresentative.fullName`; el formulario pide además el documento del representante | el formulario tiene un solo nombre completo: no se inventa dónde cortarlo |

**Quién confirma:** el propietario del producto (D-BR07-4, D-BR08-1, D-BR09-2/3), y quien mantiene el
modelo (D-BR08-1/3, D-BR09-1).
