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

# Decisiones de producto y de diseño — H1 (BR-04, BR-05, BR-20)

Carril M7 · Lenovo Legion · 2026-09-26. Cada decisión abierta se resolvió con el criterio **más seguro**
y quedó registrada acá con su porqué. Ninguna detuvo el resto del hito.

## D-I — Cookie httpOnly del refresh (BR-04, TX-10, TX-28)

- **Elegido:** opción C (transición) con destino A. La API **honra** `AUTH_REFRESH_COOKIE_NAME`, `_PATH` y
  `_SAMESITE` (TX-28) y el front soporta los dos modos. El **default de la API sigue apagado**
  (`AUTH_REFRESH_COOKIE_ENABLED:-false` en `docker-compose.coolify.yml`).
- **Por qué:** encender la cookie sin el cambio del front pierde la sesión en cada recarga, y a la inversa. Se
  enciende **sólo junto** con el front: `AUTH_REFRESH_COOKIE_ENABLED=true` en la API **y**
  `PUBLIC_REFRESH_COOKIE=true` en el build del front, en el mismo despliegue. Queda a cargo de quien despliega
  (M1: contrato escrito en el REPORT).
- **Nombre de la cookie:** el default de `AUTH_REFRESH_COOKIE_NAME` pasa de `mch_refresh` a `redesa_refresh`
  (el nombre que la cookie ya tenía en el código): honrar la variable no cambia el nombre efectivo de nadie.
  Declarar `mch_refresh` lo cambia (verificado en vivo).
- **Mismo origen (TX-20):** no se abre CORS. Documentado en `src/common/auth/README.md`.

## TX-11 — `ownTenantId`

- **Elegido:** el front deja de esperarlo (recomendado por el prompt). La última organización elegida se recuerda
  **por persona** en el dispositivo (`<userId>|<tenantId>`), así el segundo login entra sin selector y otra persona
  en el mismo dispositivo no hereda el contexto. «Mi consultorio» como concepto del modelo queda fuera (es una
  decisión de modelo, va aparte).

## TX-29 — MFA

- **Elegido:** desafío `401 details.reason = MFA_REQUIRED` (o `MFA_INVALID`) **detrás de la bandera
  `AUTH_MFA_CHALLENGE_ENABLED`, apagada** (compose y `.env.example`). Aplica a cuentas con un factor **verificado**.
- **Por qué apagada:** encenderla exige que el cliente sepa pedir el código (el front ya lo hace, pero un cliente
  móvil o un despliegue viejo quedaría sin poder entrar). **No implementado:** exigir MFA a los roles
  administrativos (requiere un flujo de alta de factor con un token de alcance limitado; sin él, exigirlo dejaría
  afuera al admin que todavía no tiene factor). Queda como pendiente con dueño M2 (roles administrativos).

## ID-24 — cambio de contraseña y sesiones

- **Elegido:** entra en el lanzamiento: `POST /iam/auth/change-password`, `GET /iam/me/sessions`,
  `POST /iam/me/sessions/:id/revoke`. Un error de contraseña es **422** con `details.reason`, nunca 401 (el cliente
  cierra la sesión ante un 401 y acá la sesión es válida).

## URL firmada (BR-05, TX-09)

- **Elegido:** variante intermedia de la B del prompt. Los recursos clínicos se leen por la **ruta del contexto**
  con bearer (auditada con actor). Además, `GET /common/files/:id/content` **valida la firma cuando viene**
  (403 si es inválida, 410 si venció) y **sigue exigiendo sesión y titularidad**: la firma no habilita a nadie a
  leer lo que no subió. No se retiró `download-url` porque otros flujos la usan.

## Escaneo y almacenamiento (BR-05, TX-33, TX-34)

- **Escaneo:** apagado **explícito** en Coolify (`MALWARE_SCAN_ENABLED=false`, sin `worker-files` ni clamd). Las
  lecturas por contexto no lo exigen; la URL firmada responde 422 `SCAN_PENDING`. Encenderlo (recomendado para PHI)
  exige sumar `clamav` + `worker-files` al compose de Coolify: contrato para M1.
- **Almacenamiento:** el prefijo S3 por defecto pasa de `audio-assets` a `uploads`. El volumen `api_storage` no tiene
  respaldo declarado: pendiente de operaciones (M1). El endpoint interno de MinIO nunca se entrega al navegador.

## Consentimiento informado y acceso (BR-20)

- **Fuente de verdad (CL-77):** la opción (a): `consent.treatment_informed_consents`. Nueva ruta del médico
  `POST /consent/encounters/:encounterId/informed-consent` (paciente y tenant salen del encuentro; exige poder
  escribir la historia). **No se tocó el `@Roles('SECURITY_ADMIN')` de la ruta existente** (regla: los `@Roles` de
  endpoints existentes son de M2). Los consentimientos ya capturados como formulario no se reescriben.
- **Solicitud de acceso (CV-07):** la opción (a): `authz/care-relationships/request` es la canónica.
  `consent/practitioner-access-requests` queda sin uso desde el front (no se retiró; se documenta).
- **Break-the-glass:** sin cambios de `@Roles` (`CLINICAL_APPROVER`/`SECURITY_ADMIN`). **Contrato para M2/BR-06:**
  ningún médico autorregistrado recibe `CLINICAL_APPROVER`; hasta que se asigne, la acción de emergencia del front
  sólo aparece para quien ya tiene el rol.
- Maquetas de `features/alovida/accesos/` (front): quedan fuera del menú; las reemplazan las pantallas reales.

## D-BR16-01 · 2026-09-26 · BLOQUEADA (falta el repo del modelo) · M7 (H3, BR-16)

**Pregunta (CL-24 §5):** ¿dónde nacen los conceptos de los tres catálogos nuevos (intención del
plan, clase de actividad, categoría documental) — value sets del modelo (a) o conceptos de módulo
del lado de la API (b)?

**No se llegó a decidir entre (a) y (b): el carril no tiene con qué construir ninguna de las dos.**
(a) exige el repo `mch-legion-model` (nota de value set + `gen_seeds.py`), que **no está instalado
como worktree en esta máquina** — el encargo de M7 sólo trae `mch-legion-api` y `mch-legion-front`.
(b) exige agregar entradas a `dynamic-enum-catalog.ts` con un `defaultConceptId` real
(`CP_INTENT_PLAN`, `CPACT_GENERAL`, `DOC_CAT_GENERAL` ya existen como default silencioso en
`chart.concepts.ts`, pero publicarlos como catálogo navegable en `system_context.dynamic_enum_bindings`
sigue siendo una decisión de producto (a)/(b) que el prompt pide **tomar primero**, no una que este
carril pueda tomar por conveniencia (regla 00 §1: "prohibido resolver una ambigüedad por
conveniencia").

**Pedido a M1:** instalar el worktree de `mch-legion-model` para `M7-Legion` (o reasignar CL-25 a
una máquina que ya lo tenga), y confirmar la opción (a)/(b) antes de que alguien la implemente.

**Qué se construyó igual, sin depender de esta decisión (CL-26):** `CarePlanActivityItemDto.
activityConceptId` — la columna ya existe (`chart.care_plan_activities.activity_concept_id`, NOT
NULL, con default `CPACT_GENERAL`) y el alta ya la guarda; sólo la lectura no la exponía. Esto no
depende de qué catálogo se elija para poblar el *selector* de esa clase de actividad: el valor
guardado se relee igual, publicado el catálogo o no.

## D-BR16-02 · 2026-09-26 · CONFIRMADA (verificación de código, no requiere decisión) · M7 (H3, BR-16)

**CL-34 y CL-36 ya están cerrados del lado de la API**, contra lo que el informe de brechas
asumía: `chart-templates.repository.ts` filtra por `specialtyConceptId` cuando se lo pasan
(`findManyBySpecialty`, líneas 184-190), y `chart-documents.service.ts` ya acepta y persiste
`patientVisibilityConceptId`/`confidentialityConceptId` con sus defaults documentados. Los dos
defectos que el informe describe son del **mock/front** (`clinical.handlers.ts:699` no lee
`specialtyId` de la query; `document-block.ts` no manda los dos campos) — no hay nada que cambiar
en la API. Se deja constancia para que el hito de front no repita la investigación.

## Hallazgo del propio carril

- `AuthzCareRelationshipsService.revokeCareRelationship` marcaba **EXPIRED** (y no cerraba la vigencia) a una relación
  sin fin porque `valid_to` llega como `null` y `null <= now` es verdadero. Corregido (`!= null`) con spec de
  regresión. Encontrado reproduciendo contra la base viva.

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

---

## D-E — Un solo camino de liberación de diagnósticos (BR-17, CV-02, CL-46, Q-02)

- **Elegido:** la decisión ya venía tomada por el reparto (Q-02): la canónica es
  `POST /diagnostics/reports/:reportId/versions/:versionId/release`
  (`DiagnosticsReportsService.releaseVersion`) — es la que registra
  `diagnostics.diagnostic_release_events` con `patient_visibility_concept_id` en la
  misma transacción que la versión y el informe, y la única que
  `GET /diagnostic-results/me` puede ver. El camino clínico
  (`POST /clinical/diagnostic-reports/:id/release`,
  `DiagnosticReportsService.release`) **no** escribe ese evento: verificado
  leyendo el código (nunca llamaba a `recordReleaseEvent`) y confirmado en
  runtime (ver evidencia abajo).
- **Cómo se marcó obsoleto sin borrarlo:** el método y la ruta siguen existiendo
  (nadie que integró contra UC-08-07 ve un 404 de golpe), pero `release()` ya no
  cambia ningún estado: valida permiso sobre el paciente (MCH-007, sin
  regresión) y siempre devuelve `422 PRECONDITION_FAILED` con
  `details.canonicalEndpoint` apuntando a la ruta vigente. `@ApiOperation` quedó
  `deprecated: true` con la misma explicación. Se prefirió esto a **delegar**
  (opción a del prompt) porque delegar exige resolver "cuál es la versión
  actual del informe" desde el lado clínico — un dato que hoy no tiene, y que
  inventarlo (tomar la última versión sin más criterio) sería una decisión de
  negocio no pedida. Se prefirió a **mantener el 200 sin escribir nada** porque
  eso es exactamente el bug que hay que cerrar: un cliente que ve 200 y cree
  que liberó.
- **Impacto medido:** `diagnostic-reports.service.spec.ts` (clínico) tenía un
  test `'releases a report (partial -> final, held -> released)'` que probaba
  el bug como si fuera el comportamiento correcto; se reescribió para afirmar
  el nuevo contrato (422, sin tocar el estado). El smoke
  `test/smoke/modules/clinical.smoke.ts` (`UC-08-07: liberar resultados`)
  pasó de esperar `200` a esperar `422`.
- **Verificado en runtime** (API real en `:3400` + Postgres efímero
  `legion-h4-pg:5440`, esquema aplicado desde `database/SQL/apply_all.sql` +
  `apply_deferred.sql`, seed completo vía `seed-cli`): se creó un informe, se
  liberó VISIBLE por el camino canónico y apareció en `GET
  /diagnostic-results/me`; liberado HIDDEN no apareció; una segunda liberación
  de la misma versión dio `409` y `SELECT count(*) FROM
  diagnostics.diagnostic_release_events GROUP BY diagnostic_report_version_id`
  mostró exactamente 1 fila por versión (ninguna duplicada); el camino clínico
  sobre un informe recién creado dio `422` con el endpoint canónico en el
  mensaje. Detalle completo en
  `docs/progress/evidence/lane-M7-h4/REPORT.md`.

## CL-48/CL-50 — Compartir un resultado: por perfil, nunca por un id tipeado

- **Elegido (variante intermedia entre las dos del prompt):** `ShareDiagnosticResultDto`
  no pide `practitionerUserId` (una cuenta) sino `practitionerProfileId` (el
  mismo id que ya devuelve `GET /authz/me/access` — BR-20/H1 — en
  `practitionerProfileId`, con `practitionerName` resuelto). El servidor: (1)
  exige que exista una `authz.care_relationships` `ACTIVE` entre el paciente y
  ese perfil (`CareRelationshipsRepository.findActive`, ya existente, sin
  endpoint nuevo); (2) resuelve la cuenta con
  `PersonAccountLinksRepository.findActiveByPerson`; (3) crea el grant con esa
  cuenta, igual que antes. Así "nunca un buscador global de usuarios" se
  cumple del lado servidor y no sólo por convención del front: aunque el
  cliente mande un `practitionerProfileId` ajeno, sin relación vigente da
  `422`.
  - **Por qué no un endpoint nuevo:** `GET /authz/me/access` (BR-20) ya es
    exactamente "mis relaciones asistenciales reales, con nombre" — construir
    otro para lo mismo hubiera sido la duplicación que la regla de "buscar el
    equivalente antes de crear" prohíbe.
  - **`CareRelationshipsRepository`** se agregó a los `exports` de
    `AuthzModule` (antes sólo exportaba `ResourceScopeGrantsRepository`,
    `AuthzEffectiveRolesService` y `AuthzPdpService`): es el único cambio de
    superficie de módulo que este hallazgo necesitó.
- **`reason` se retiró del DTO (CL-50), no se inventó columna:** `authz.resource_scope_grants`
  no tiene una columna para el motivo (verificado contra `database/SQL/06_authz/02_tables.sql`
  y la entidad `ResourceScopeGrants`) y el servicio ya lo ignoraba en silencio —
  quien mandaba `reason` creía que había quedado registrado y no era cierto.
  Con `forbidNonWhitelisted` activo, mandarlo ahora da `400` (verificado en
  runtime), que es el comportamiento que el Gherkin del prompt acepta como
  alternativa explícita. **Pedido a M1:** si el producto necesita persistir el
  motivo de un compartido, `authz.resource_scope_grants` necesita una columna
  nueva (DDL fuera de este carril).

## CL-45/CL-51 — El buscador de centros: ciudades y moneda real

- **Elegido:** `DiagnosticUnitSearchItemDto` suma `cities: string[]` (ciudades
  de las sedes activas, vía `DiagnosticUnitSites.practiceSiteId → PracticeSites.addressId
  → Addresses.city`, deduplicadas y ordenadas) y `minAmountCurrency: string | null`
  (el `code` del concepto de moneda del `price_schedule` dueño del precio
  mínimo ya calculado). No se tocó el directorio (`DiagnosticUnitDirectoryItemDto`):
  el prompt y el archivo a modificar (`catalog.dto.ts` + servicio de búsqueda)
  son específicos del buscador (`/diagnostic-units/search`), que es lo que
  consume `laboratory-directory` del front.
  - `DiagnosticUnitsReadRepository.findPracticeSites` ya existía (lo usa
    `DiagnosticUnitsReadService.getById` y el admin-read); sólo faltaba
    `findAddresses` (mismo patrón que `PharmacyReadRepository.findAddresses`).
- **Verificado en runtime:** `GET /diagnostic-units/search` con `X-Tenant-Id`
  responde 200 y el DTO trae `cities`/`minAmountCurrency` en el esquema
  (`/docs-json`); sin centros sembrados en la corrida de prueba no se pudo
  observar un valor no vacío — queda **NO CUBIERTO** con datos reales (ver
  reporte).

## CL-47 — Lecturas del circuito del laboratorio

- **Elegido:** `GET /diagnostics/accessions/:id` y `GET /diagnostics/specimens/:id`,
  acotadas al tenant del contexto (`requireTenantId()`, mismo patrón que
  `GET /diagnostics/work-orders`) y **404 —no 403— para otro tenant**, tal como
  pide el prompt (no confirmar que el id existe). No hizo falta
  `GET /diagnostics/work-orders/:id` adicional: la cola ya alcanza para abrir
  el detalle de una orden vía la acesión.
- **Verificado en runtime:** acesionar un espécimen y leer
  `GET /diagnostics/accessions/:id` devuelve el espécimen con su contenedor y
  su custodia; un id inexistente da 404.

## CL-55 — `operativeSteps` en OpenAPI (procedures_perioperative)

- **Elegido:** se creó `OperativeStepItemDto` (clase con `@ApiProperty` en cada
  campo) y `CaseDetailDto.operativeSteps` pasó de un tipo TS inline a
  `type: () => [OperativeStepItemDto]`. Verificado con `typecheck`.
- **Hallazgo fuera de alcance, para BR-30/M6:** `GET /procedure-cases/:id`
  (`PeriopController.getCase`) no tiene `@ApiOkResponse({ type: CaseDetailDto })`
  y `nest-cli.json` no tiene el plugin de `@nestjs/swagger`, así que
  `CaseDetailDto` (con o sin este fix) **no aparece todavía** en
  `/docs-json` ni en `openapi/openapi.json`: el `200` de esa ruta no tiene
  ningún esquema. Es exactamente lo que "BR-30: OpenAPI regenerado" (H6) tiene
  que resolver; este fix deja el DTO correcto para cuando eso pase.

## CL-56 — Mock del front: sin `studyInstanceUid` inventado

- Ver `docs/progress/DECISIONS.md` del repo `mantra-core-health` (front): el
  cambio es enteramente de mock/handlers, este repo no lo toca.

---

# Decisiones de producto y de diseño — H5 (BR-22, BR-27, BR-26)

Carril M7 · Lenovo Legion · 2026-09-26. Notificaciones, comunidad y visitadores. Orden ejecutado:
BR-22, BR-27, BR-26 (BR-26 al final porque toca el modelo).

## D-Notif-1 — El enum del contrato vs. lo que la agenda emite (AG-06)

- **Elegido:** las fuentes se dejan igual (scheduling sigue emitiendo `scheduling.appointment_bookings`
  y `scheduling.bookable_slots` vía `RECURSO_CITA`/`RECURSO_CUPO`) y el enum de
  `messaging/notifications.contract.ts` **suma esos dos literales** como aditivos. `APPOINTMENT`
  se deja tal cual, documentado como aspiracional: hoy ningún módulo lo emite, y renombrarlo o
  retirarlo tocaría más superficie (cualquier fixture o integración que lo dé por sentado) que
  agregar los dos que sí son reales.
- **Por qué no la alternativa (alinear las fuentes al enum):** hubiera significado renombrar
  `RECURSO_CITA`/`RECURSO_CUPO` en `scheduling/notices/agenda-notices.ts` y todo lo que los
  consume — mayor diff, mismo resultado observable para el front.
- El front (`notification-routes.ts`, `notifications.types.ts`) ya mapea los dos literales reales
  a `/my-account/appointments`, y el mock (`scheduling.handlers.ts`, `horario-liberado.ts`) los usa
  en vez de `'APPOINTMENT'` inventado.

## D-Notif-2 — Transporte de la campana en tiempo real (AG-22)

- **Elegido:** opción A del prompt — `notification:new` por el socket existente. Se creó
  `NotificationsGateway` (namespace por defecto, el mismo que ya usa
  `CommunityMessagingGateway` para el chat): autentica con `WsJwtGuard`, une el socket a
  `user:{id}` y `NotificationsService.emitInApp` lo llama **después** de que la transacción
  confirma, nunca desde `writeInApp`. Se agregó `EmitInAppResult.availableAt` para no despertar la
  campana antes de que el silencio nocturno (P9) la libere.
- **Por qué namespace compartido y no un socket aparte:** el front ya abre uno para el chat
  (AG-29); sumar una segunda conexión es otro handshake, otro upgrade de nginx y otro token que
  vencer, sin necesidad — socket.io permite más de un gateway de Nest escuchando `connection` del
  mismo namespace.
- **Hallazgo, no cubierto:** los avisos de agenda (BR-21: confirmación, recordatorio, cancelación,
  cupo liberado) viajan por `NotificationsService.createRequest()` (`MessagingAgendaNoticeAdapter`),
  un camino **distinto** de `emitInApp()`. El push de este carril no llega todavía al escenario
  "aviso de horario liberado navegable" del prompt BR-22. Si cubre, en cambio, prescripción/
  encuentro (`clinical`), mensajes directos (`community`), pedidos de farmacia
  (`pharmacy_inventory`) y solicitudes de vínculo (`authz`), que sí usan `emitInApp()`. Pedido a
  quien tome BR-21/scheduling después: sumar el mismo push a `MessagingAgendaNoticeAdapter`, o
  migrar la agenda a `emitInApp()` si el debounce de `createRequest()` no hace falta ahí.

## D-Notif-3 — Regla de «horario liberado» (AG-07)

- **Elegido: no se tocó.** El mock sigue con la heurística de 10 minutos
  (`core/mock/horario-liberado.ts`, opción B del prompt); no se migró a la regla real de la API
  (sólo lista de espera, opción A) porque eso exige modelar lista de espera en el mock — más
  superficie de la que el tiempo de este carril alcanzaba.
- **Consecuencia:** el vocabulario del aviso ya es honesto (D-Notif-1: emite
  `scheduling.bookable_slots`, no `APPOINTMENT`), pero la **condición** que dispara el aviso en el
  mock sigue siendo distinta de la condición real (10 min sin iniciar vs. estar en lista de
  espera). Documentado como pendiente, no simulado como resuelto.

## D-Notif-4 — Stickers: allowlist vs. contrato nuevo (AG-17)

- **Elegido:** allowlist por id fijo (`STICKER_PACK_FILE_IDS`, los 24 uuids que el front ya tenía
  hardcodeados en `sticker-pack.generated.ts`), no un campo `bodyText` con convención. Es la
  opción que el prompt recomendaba y no cambia el contrato de `POST` de un mensaje.
- **Dueño del archivo:** `SEED.systemWorkerUserId` (mismo patrón que avisos automáticos y
  afiliaciones) — no hay una persona autora de un sticker del catálogo.
- **Seed sin bytes:** el front pinta el sticker desde su propio `public/stickers/*.svg`; la API
  nunca sirve esos bytes. `StickerPackSeedService` sólo materializa `common.files` +
  `common.file_versions` (metadata) para que `attachment_file_id` tenga a qué apuntar y
  `assertVersionUsable` tenga algo real que comprobar (`storage_uri` documental,
  `product-assets://...`, `size_bytes = 0`).
- **Hallazgo, no resuelto por conveniencia:** `assertAttachmentCanBeAssociated` (preexistente, no
  tocado en su forma) convierte cualquier `ForbiddenException` de `assertUsableBy` en
  `ResourceNotFoundException` (404) si el archivo no es un reenvío visible, «para no enumerar
  uuids ajenos». El Gherkin de BR-22 pide **403** para un fileId ajeno al pack. Se dejó el 404
  preexistente en vez de cambiar ese comportamiento de seguridad por conveniencia — cambiarlo
  afecta a **todo** adjunto ajeno del chat, no sólo a los stickers, y es una decisión más grande
  que este hallazgo. Queda para quien decida si 403 vs. 404 en adjuntos ajenos es un contrato a
  cambiar.

## D-Comunidad-1 — Alcance de AG-23/CV-26 para la demo (BR-27)

- **Elegido: mínimo, y sólo la mitad de lectura.** De las tres opciones del prompt (mínimo,
  comunidad completa, con grupos médicos), se avanzó **la corrección de seguridad de AG-18**
  (apelar exige ser el sancionado) y **la lectura `decisions/mine`** completas, con su cliente
  HTTP en el front. **No** se construyeron las pantallas «Mis sanciones», «Seguir» ni «Responder
  reseña» — quedaron sólo con su cliente de datos donde hacía falta uno nuevo.
- **Por qué:** con el tiempo disponible, corregir el hueco de autorización (cualquiera podía
  apelar una decisión ajena con su propio perfil) es más valioso que una pantalla nueva, y no
  tiene sentido a medias — una pantalla sin la lectura correcta detrás sería peor que ninguna
  pantalla. `CV-26` (grupos médicos) no se tocó: es un módulo entero (formulario, ciclo de vida,
  ventana de 7 días) que no entraba en el tiempo de este carril; queda abierto para quien lo tome
  después, con el mismo criterio de «confirmar primero si REDESA/grupos médicos está en el
  alcance de la demo» que ya pedía el prompt.
- Encuestas (crear/votar) y bloquear tampoco se tocaron: son parte de la opción «comunidad
  completa», fuera del mínimo elegido.

## D-PharmaLab-1 — Camino de los roles al token (AG-31, BR-26)

- **Elegido: A)** asignación en `authz.user_role_assignments` al vincular/desvincular/revincular,
  no B) rol derivado de la membresía al tenant del laboratorio en el login. Es lo que recomendaba
  el prompt («respeta scope tenant») y no exige tocar el servicio de login de `iam`.
- **Coordinación con BR-06:** si quien tome BR-06 ya resolvió esto por el camino B (rol derivado
  en el login), **no hacerlo dos veces** — este carril ya lo resolvió por A para `pharma_lab`.
  Verificar contra `docs/progress/DECISIONS.md` de BR-06 antes de tocar
  `medical-visitors.service.ts` de nuevo.
- **Implementación:** `AuthzModule` exporta `AuthzGrantsService`, `RolesRepository` y
  `UserRoleAssignmentsRepository` (aditivo al `exports: []`, no toca ningún `@Roles` ni
  `role-mapping.ts` — fuera de la tabla de M2 del encargo). `medical-visitors.service.ts` los
  inyecta y asigna/revoca `MEDICAL_VISITOR` en la misma transacción del alta/baja/revinculación.
- **No resuelto:** el `revoke()` nuevo de `UserRoleAssignmentsRepository` corta `valid_to`; no hay
  todavía un endpoint HTTP de revocación en `authz` (sólo se usa desde `pharma_lab`, server-side).
  Si otro módulo necesita revocar una asignación por API, falta ese contrato.

## D-PharmaLab-2 — AG-30 (500 en todo `pharma_lab`): pedido a M1

- **No se tocó.** `schemas.catalog.ts:51` sigue con `['pharma_lab', null, 'pharma_lab', 31]` y
  **sin DDL** (regla del encargo: nada de DDL en la API; el modelo empieza en
  `mantra-core-health-model`). Cualquier ruta de `pharma_lab` contra una base reconstruida sigue
  respondiendo 500 `relation "pharma_lab.…" does not exist`.
- **Pedido explícito a M1:** promover el módulo `pharma_lab` (31 entidades, diagrama **67** — el
  siguiente libre, que también disputa AG-44/`data_catalog` de BR-30/portal admin; acordar quién
  se lo queda antes de escribir) por las 4 capas (`.puml` → `gen_ddl.py` → `SQL/` del modelo →
  `yarn db:vendor` → `schemas.catalog.ts`), más las 4 historias de auditoría
  (`audit.pharma_lab_staff_history`, `pharma_products_history`, `regulatory_documents_history`,
  `visit_requests_history`, que ya existen como entidades en `src/modules/audit/entities/` sin
  tabla). Sin esto, AG-31 (ya resuelto en código) no se puede verificar contra una base
  reconstruida desde cero, y las 54/76 rutas de `pharma_lab` sin UI (AG-43/CV-17) no tienen sentido
  de construir del lado del front contra la API real — siguen contra el mock.
- **Lo que sí avanzó sin DDL:** la asignación/revocación de rol (D-PharmaLab-1), que usa tablas de
  `authz` que ya existen.

## Verificación contra Postgres efímero (`legion-h5-pg`, puerto 5450)

`database/SQL/apply_all.sql` + `apply_deferred.sql` se aplicaron limpios contra una base nueva
(`postgres:16-alpine`, sin TimescaleDB/pgvector — no se instalaron esas extensiones porque ningún
cambio de este hito toca `time_series` ni `vector_rag`). De los 51 patches de
`database/SQL/patches/`, 49 aplicaron limpios; 2 fallaron por depender de esas extensiones/datos
que este stack mínimo no tiene (`2026-07-25_v407_nullable_embedding_model_versions.sql` exige el
schema `vector_rag`; `2026-09-19_v4221_aseguradoras_codigo_unico.sql` exige 17 aseguradoras
sembradas que este stack no siembra) — ninguno de los dos toca `messaging`, `community`,
`pharma_lab` ni `authz`. Detalle de qué se pudo verificar contra la API viva (o por qué no) en
`docs/progress/evidence/lane-M7-h5/REPORT.md`.

---

## D-BR14-01 · 2026-09-26 · PROPUESTA (tomada por M7, pendiente de confirmación del propietario) · M7 (H3, BR-14)

**Pregunta (CL-07):** ¿qué pasa cuando algo escribe sobre un encuentro ya `FINISHED` y sellado
(`content_hash`/`sealed_at`)? El prompt ofrecía (a) 422 al rechazar, o (b) addendum append-only con
sello nuevo.

**Decisión: (a) rechazar con 422.** El addendum (b) exige una tabla nueva por `.puml` — prohibido
sin DDL en la API y sin decisión de modelo tomada — y una semántica de «versión enmendada» que
ningún endpoint expone todavía. (a) es reversible: nada impide migrar a (b) después sin romper el
contrato (un 422 de hoy puede pasar a 201 con addendum mañana; lo inverso no).

**Qué se construyó:** `EncounterSealGuardService` (nuevo, `src/modules/clinical/services/
encounter-seal-guard.service.ts`), cableado desde `conditions.service.ts`,
`observations.service.ts`, `chart-care-plans.service.ts` y `chart-documents.service.ts`.
**`medications.service.ts`, `allergy-intolerances.service.ts` y `chart-notes.service.ts` (dueño M3)
no se tocaron** — la guarda queda exportada por `ClinicalModule` para que M3 la invoque desde ahí;
hasta entonces, CL-07 sigue abierto en esos tres flujos (registrado también en el reporte de M7).

## D-BR14-02 · 2026-09-26 · CONFIRMADA (por lectura de código, no requiere decisión de producto) · M7 (H3, BR-14)

**Pregunta (CL-08):** ¿hace falta agregar `ClinicalRecordAccessGuard` a `POST /clinical/care-episodes`
y `POST /clinical/encounters/check-in`, y validar que el `tenantId` del cuerpo sea del actor?

**Hallazgo:** las dos piezas que el prompt BR-14 pedía ya estaban resueltas por trabajo posterior a
la fecha del informe de brechas (2026-09-24), documentado en el propio código:
- El guard de acceso por relación asistencial sobre esas dos rutas es un residual **abierto a
  propósito** (`BOOTSTRAP_ACCESS_RESIDUAL`, comentario de `ClinicalEncountersController` y
  `clinical-record-access.mounting.spec.ts`): exigir una relación previa para el acto que *funda*
  esa relación es un círculo. Reabrirlo sin la decisión de producto que el propio comentario pide
  («qué acto funda la relación asistencial») sería deshacer un análisis ya hecho, no cerrarlo.
- El tenant del cuerpo contra el tenant del actor **ya lo hace** `TenantContextInterceptor` +
  `resolveOrdinaryTenantId` (MCH-001) para **toda** ruta autenticada no pública: un tenant en el
  cuerpo (`tenantId`/`custodianTenantId`) que no coincide con el resuelto responde 403
  (`tenant-scope.ts`, `OWNERSHIP_FIELDS`), y el tenant resuelto tiene que ser membresía del actor.
  Confirmado leyendo `resolveOrdinaryTenantId` (lanza `ForbiddenException` si el header/único tenant
  no está en `user.tenantIds`).

**Decisión: no tocar CL-08 en check-in/care-episodes.** No se agrega el guard (reabriría
`BOOTSTRAP_ACCESS_RESIDUAL` sin la decisión que le falta) ni la validación de tenant (ya existe,
global). Nada que hacer distinto de lo que el código ya hace.

## D-BR14-03 · 2026-09-26 · PROPUESTA (tomada por M7, criterio más seguro) · M7 (H3, BR-14)

**Pregunta (CL-09):** `checkInteractions` (chequeo previo a prescribir) — ¿calcula y no persiste, o
persiste sólo al prescribir?

**Decisión: calcula y no persiste, nunca.** Es la opción que el propio Gherkin de BR-14 pide
literalmente («el chequeo previo no deja basura… no se crea ninguna fila») y la más simple: no hay
forma de distinguir, desde `check-interactions`, si la llamada es un chequeo exploratorio o el paso
previo inmediato a una prescripción real, así que no perseguir esa distinción evita adivinar. Si
más adelante se quiere una alerta persistida al prescribir de verdad, esa persistencia la dispara
`medications.service.ts` (M3) llamando a `evaluate()` (que sí persiste) con el contexto real de la
receta — no `check-interactions`.

**Qué se construyó:** `CdsController` con `@Roles('CLINICIAN','PRACTITIONER')` +
`@UseGuards(ClinicalRecordAccessGuard)` en `cds/evaluate` y `cds/check-interactions`;
`ClinicalExtModule` importa `ClinicalModule` (mismo patrón que `ChartModule`);
`CdsService.checkInteractions` ya no persiste (no hay `tx`, no hay `alertsRepo.create`, ids
efímeros con `randomUUID()`).

## D-BR14-04 · 2026-09-26 · PROPUESTA (tomada por M7, sin DDL disponible) · M7 (H3, BR-14)

**Pregunta (CL-10):** ¿dónde vive el motivo del cambio de estado clínico de una condición —
columna `status_reason_text` en `clinical.conditions` (opción a), o dentro del registro de
historia (opción b)?

**Decisión: (b), sin columna nueva.** Este carril **no tiene DDL disponible** (regla del reparto:
sin `yarn db:vendor`, sin tocar `database/SQL` a mano). El motivo se agrega como clave
`statusChangeReasonText` en el `data_snapshot` (jsonb de forma libre) que
`ConditionsService.changeClinicalStatus` ya escribe en `audit.conditions_history` en cada cambio de
estado — ninguna migración, ninguna tabla nueva. Contra: el prompt señala que esto "mezcla el
estado con la justificación"; se acepta el trade-off por no poder tocar el modelo desde este
carril. **Pedido a M1:** si se prefiere la opción (a) — columna simétrica con
`medication_requests.status_reason_text`, que ya es el precedente —, es una migración de una sola
columna nullable, aditiva, sin romper lo que este carril entrega hoy (el snapshot seguiría
existiendo; la lectura pasaría a preferir la columna si está presente).

**Qué se construyó:** `reasonText` con `@IsNotEmpty() @MaxLength(500)`
(`condition.dto.ts`); `changeClinicalStatus` deja de loguear `reason: dto.reasonText` y en cambio lo
agrega al `dataSnapshot` de la historia; `ClinicalReadService.getPatientSummary` lee la última
revisión de cada condición con `HistoryRepository.latestBySource` (existente, no se creó una
consulta nueva) y expone `lastStatusChangeReasonText` en `ConditionItemDto`.

## D-BR15-01 · 2026-09-26 · PROPUESTA (tomada por M7, pendiente de confirmación del propietario) · M7 (H3, BR-15)

**Pregunta (CV-06):** ¿qué es «descargar mi historia» — (a) documento emitido y verificable armado
en la API, (b) exportación FHIR/DSAR, o (c) PDF del cliente declarado como vista?

**Decisión: (a).** Es la única que cumple CV-06 y TX-32 de verdad: un documento con valor legal
necesita nacer en el servidor con un sello verificable, no en el navegador. (b) reutiliza roles de
privacidad que el paciente no tiene y expone FHIR crudo a alguien que no lo va a leer. (c) es lo que
hay hoy y es exactamente el defecto que TX-32 señala.

**Qué se construyó contra esta decisión:** el PDF **por atención** (`GET /charts/me/encounters/:id/
pdf`, CL-31) ya sale de la API, sellado, con sólo lo liberado/visible. **El PDF de la historia
completa NO se construyó** — es una pieza más grande (agregación de todo el historial, `content_hash`
propio) que no entró en el tiempo de este carril. Queda `A MEDIAS`, no `DESCARTADO`: la decisión de
producto está tomada, falta el endpoint. Pedido a quien retome BR-15: `GET /clinical/me/record/pdf`
(o el path que se prefiera), mismo patrón que `EncounterPdfService.componer()` pero agregando todas
las atenciones del paciente.

## D-BR15-02 · 2026-09-26 · CONFIRMADA (patrón ya establecido en el repo) · M7 (H3, BR-15)

**Pregunta:** ¿cómo resuelve `charts/me/*` de quién es la sesión — del claim `pid`
(`actor.patientProfileId`) o resolviendo contra la base como `ClinicalReadService.assertOwnRecord`?

**Decisión: del claim**, siguiendo el patrón que el propio prompt señala (`forms-me.controller.ts`)
y que `FormsReadService.requirePatientProfile` ya usa en producción. Es una inconsistencia
preexistente del repo (`ClinicalReadService` no confía en `pid` por escrito, explícitamente, en su
propio comentario; `forms/me` sí) — no la introduce este carril y no la resuelve: se documenta para
que quien la note después no la lea como un descuido nuevo.

## D-BR14-05 · 2026-09-26 · CONFIRMADA (lectura completa, sin ambigüedad de producto) · M7 (H3, BR-14)

**CL-11 / CL-16 (lecturas del resumen):** `encounterId` en `MedicationRequestItemDto`,
`lateralityConceptId` y `rowVersion` en `ConditionItemDto`/`EncounterItemDto` son columnas que ya
existían en el modelo y el DTO simplemente no las exponía — sin ambigüedad, se agregan. Las
reacciones de alergia (`AllergyItemDto.reactions[]`) necesitaban una lectura de
`clinical.allergy_reactions` que no existía: se creó `AllergyReactionsReadRepository` (archivo
nuevo, independiente del repositorio de M3) sólo para esta lectura.

---

## H6 (BR-28/BR-29/BR-30) — organización, clínica extendida y contrato de calidad

- **D-BR28-1 (dos caminos de afiliación):** Opción **A** — se mantienen los dos (afiliación por tenant y
  autoservicio de práctica). No se migró la pantalla existente ni se tocó ningún `@Roles`: es de M2/dueño del
  carril de organización según el encargo, y unificarlos es un cambio de producto, no un hallazgo de este hito.
- **D-BR28-2 (quién aprueba la asignación de práctica):** Opción **B** — se mantiene `SECURITY_ADMIN`, el mismo
  rol que ya exigían `role-assignments.controller.ts:approve/reject/suspend/end`. La lectura nueva
  (`GET /practices/:practiceId/role-assignments`) hereda ese rol para no abrir un camino de autorización nuevo
  (administrador de tenant vía membresía) sin que M2 lo revise; documentado como pedido a M2/BR-06 si se quiere
  D-BR28-2(A).
- **CV-13/ID-19 (hubs de administración):** cobertura parcial, elegida por presupuesto de la sesión: se cerraron
  `delegated-permission-sets` (listado acotado a tenant) y `profiles/credentials` (cola de verificación). **NO
  CUBIERTO** en este hito: `auth-providers` (listado sin secretos), `health-context`, `identity-authorities`/
  `identity-policies`, y el listado de `practitioner-delegates`/`org-user-assignments`/`access-requests`. Los
  patrones (repositorio con `findByTenantPage`/`findByStatePage` + cursor keyset por `id`, servicio, DTO,
  controlador) quedan replicables para quien continúe.
- **CV-20 (verificación):** se cerró la cola de credenciales (`GET /profiles/credentials?state=`), lectura de
  plataforma sin tenant (mismo criterio que la propia verificación, `SECURITY_ADMIN`). No se tocó el filtro por
  tipo de caso de `identity-cases.controller.ts` (fuera del presupuesto de la sesión).
- **BR-29 §5.1 (`/billing` en la demo):** Opción **(a)** — entra con lecturas (`GET /billing/invoices(/:id)`,
  `GET /billing/patient-statements`). Ninguna escritura de cobro se tocó ni se expuso.
- **BR-29 §5.2 (cobertura del paciente):** Opción **(b)** — sólo lectura por el paciente
  (`GET /patient-coverages/me`) en esta sesión. No se abrió `POST /patient-coverages` al titular: seguiría siendo
  `BILLING`/`FINANCE` como hoy, porque abrir esa escritura es un cambio de `@Roles` de un endpoint existente sin
  decisión de producto, y el encargo lo prohíbe sin ese contrato.
- **BR-29 (rol de facturación/aseguradora):** sin confirmar quién recibe `BILLING`/`FINANCE`/`BILLING_OPERATOR`
  (nadie los emite hoy, según BR-29 mismo). Las lecturas nuevas de `/billing` se dejaron en `SECURITY_ADMIN` por
  el mismo motivo que D-BR28-2: no inventar un camino de autorización nuevo. Contrato para M2/BR-06.
- **D-BR28-3 / CV-25 (geolocalización):** **NO CUBIERTO.** Se investigó ocultar `administration/geolocation` del
  menú de administración manteniendo la ruta activa detrás de un `canMatch`, y se encontró que
  `rutasDeSecciones()` (`app.routes.ts`) genera las rutas **desde el mismo array** de `navigation.map.ts`: sacar
  la sección de ese registro borra la ruta, no sólo el ítem de menú. `SECCIONES_FUERA_DEL_ARBOL`
  (`access-tree.ts`) no sirve para esto: oculta de un panel de "zonas" del dashboard, no del menú lateral real.
  Implementar el `canMatch` + una marca "fuera del menú de lanzamiento" que no toque las rutas ya generadas es un
  cambio de arquitectura de navegación que excede el presupuesto de esta sesión (riesgo real sobre
  `navigation.service.spec.ts`/`access-tree.spec.ts`, ~4985 pruebas del repo). Se documenta el hallazgo completo
  para quien lo retome; no se tocó nada de `navigation.map.ts` ni `app.routes.ts`.
- **TX-24 (CI efectivo):** **BLOQUEADO**, no simulado. El `CLAUDE.md` del propio repo dice "El CI propio está
  caído; los `check-*.mjs` se corren a mano" — no hay runner self-hosted disponible en este sandbox ni forma de
  levantar uno sin acceso de infraestructura (dueño M1). No se tocó `.github/workflows/*`.
- **TX-25 (suite real e2e con SSR + nginx + límite de tasa):** **BLOQUEADO** por presupuesto de RAM (regla 70,
  ~2 GB compartidos con H4/H5) y de tiempo: requiere un tercer stack completo (build `production-api`, nginx,
  Postgres con seeds completos) además del ya levantado para H6. No se ejecutó `run-recorrido-real.mjs`.
- **TX-27 (N+1):** **NO CUBIERTO** en esta sesión (se priorizó el backend de BR-28/BR-29 y el request-id). Ninguna
  lectura en lote nueva se agregó del lado de la API para las 5 pantallas señaladas.
- **Hallazgo de seguridad del propio carril (fuera de BR-28/BR-29, corregido en la misma sesión):** un aviso
  automático de revisión detectó que `InvoicesService.listByPractice`/`getDetail` y
  `PatientStatementsService.listByPractice` (agregados para CV-12) aceptaban el `practiceId` de la query sin
  verificar que perteneciera al tenant del actor — cualquier UUID de otra organización devolvía sus facturas o su
  estado de cuenta (IDOR). Corregido con el mismo patrón que
  `PracticeWorkforceService.listPracticeAssignments`/`PracticeOrganizationReadService.getConsole`:
  `PracticeTenantLookupService.findTenantOfPractice` (puerto de lectura ya exportado por `PracticeModule`) antes
  de cualquier consulta, 404 sin distinguir "no existe" de "es de otro tenant". Verificado con specs unitarios
  (aislamiento) y con `test/integration/admin-listados.int-spec.ts` contra Postgres real: dos tenants, un
  administrador cada uno, 404 cruzando de tenant en las tres lecturas nuevas de `practice`/`delegated_access`/
  `billing`.
