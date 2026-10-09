# Módulo Surveys — Cuestionarios y encuestas de satisfacción

Instrumento de satisfacción dirigido: plantilla con versiones inmutables y
vigencia, preguntas con tipo de respuesta y obligatoriedad, asociación a la cosa
evaluada, invitación contra una atención completada y respuestas **privadas**
del paciente con lectura para el profesional dueño.

Cubre el carril 10 y las nueve reglas `DOC-ENC-001` … `DOC-ENC-009` del actor
doctor, más `PAC-CAL-008` y `PAC-DIAG-014` del actor paciente, que el
diagnóstico ALOVIDA marcaba **todas `AUSENTE`**.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/surveys -name '*.controller.ts' | wc -l
  find src/modules/surveys -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/surveys -name '*.entity.ts' | wc -l
  find src/modules/surveys -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **3 controllers, 17 rutas HTTP, 7 entidades y 3 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 7 de 7 archivos `*.entity.ts`): `survey_answers`, `survey_assignments`, `survey_invitations`, `survey_questions`, `survey_responses`, `survey_templates`, `survey_versions`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /surveys/assignments` | PRACTITIONER, CLINICIAN | `surveys-assignments` |
| `POST /surveys/invitations` | PRACTITIONER, CLINICIAN | `surveys-assignments` |
| `GET /surveys/me/invitations` | sesión | `surveys-patient` |
| `GET /surveys/me/invitations/:id` | sesión | `surveys-patient` |
| `POST /surveys/me/invitations/:id/responses` | sesión | `surveys-patient` |
| `POST /surveys/templates` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `GET /surveys/templates` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `GET /surveys/templates/:id` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `PATCH /surveys/templates/:id` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `POST /surveys/templates/:id/questions` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `PUT /surveys/templates/:id/questions/order` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `PATCH /surveys/templates/:id/questions/:questionId` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `DELETE /surveys/templates/:id/questions/:questionId` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `POST /surveys/templates/:id/versions` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `POST /surveys/templates/:id/versions/:versionNumber/publish` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `POST /surveys/templates/:id/deactivate` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `GET /surveys/templates/:id/responses` | PRACTITIONER, CLINICIAN | `surveys-templates` |

## Por qué es un módulo nuevo y no `forms` ni `community.polls`

`alovida-gap-map` registra esto como decisión de arquitectura abierta; se resolvió
por dominio propio.

- `community.polls` / `poll_options` / `poll_votes` son **encuestas sociales de
  una publicación**: sin destinatario, sin atención que las habilite y con votos
  públicos por diseño. Lo contrario de lo que se pide acá.
- `forms.*` es un **motor EAV de campos dinámicos versionado**, pensado para
  extender entidades existentes con campos a medida
  (`extension_target_policies`, `field_assignments`, `field_value_access_rules`).
  Reutilizarlo obligaba igual a agregar destinatario, asignación, ventana de
  respuesta y privacidad — es decir, la mayor parte del dominio — sobre un motor
  cuyos endpoints de gobernanza exigen `SECURITY_ADMIN`, que no es quien crea una
  encuesta de satisfacción.

## Endpoints

| Método y ruta | Permiso | Descripción |
|---|---|---|
| `POST /surveys/templates` | `PRACTITIONER` `CLINICIAN` | Crea la encuesta y su versión 1 en borrador |
| `GET /surveys/templates` | `PRACTITIONER` `CLINICIAN` | Lista las encuestas propias |
| `GET /surveys/templates/:id` | `PRACTITIONER` `CLINICIAN` | Encuesta con el cuestionario de su última versión |
| `POST /surveys/templates/:id/questions` | `PRACTITIONER` `CLINICIAN` | Agrega pregunta (tipo, obligatoriedad, opciones, escala) |
| `POST /surveys/templates/:id/versions/:n/publish` | `PRACTITIONER` `CLINICIAN` | Publica y fija vigencia |
| `POST /surveys/templates/:id/deactivate` | `PRACTITIONER` `CLINICIAN` | Desactiva la encuesta |
| `GET /surveys/templates/:id/responses` | `PRACTITIONER` `CLINICIAN` | Revisa las respuestas recibidas |
| `POST /surveys/assignments` | `PRACTITIONER` `CLINICIAN` | Asocia una versión publicada a consulta o servicio |
| `POST /surveys/invitations` | `PRACTITIONER` `CLINICIAN` | Emite los cuestionarios de una atención completada |
| `GET /surveys/me/invitations` | autenticado con perfil de paciente | Mis cuestionarios |
| `GET /surveys/me/invitations/:id` | autenticado con perfil de paciente | Abre el cuestionario a responder |
| `POST /surveys/me/invitations/:id/responses` | autenticado con perfil de paciente | Responde |

## Entidades (schema `surveys`)

`survey_templates`, `survey_versions`, `survey_questions`, `survey_assignments`,
`survey_invitations`, `survey_responses`, `survey_answers`.

## Reglas de negocio destacadas

- **Publicar congela.** Las preguntas solo se agregan a la versión en borrador.
  Corregir el instrumento es publicar la versión siguiente, no editar la vigente:
  sin eso, una respuesta de hace meses no se podría interpretar.
- **No se publica un cuestionario sin preguntas.** Produciría invitaciones
  incontestables.
- **Solo responde quien tuvo atención completada.** La invitación se emite contra
  una `scheduling.appointment_bookings` en `BOOKING_COMPLETED`; sin invitación no
  hay forma de responder. Es la regla que ALOVIDA fija explícitamente.
- **Emisión secuencialmente idempotente.** El servicio detecta una invitación ya
  emitida por `(reserva, versión)`, pero el DDL aún no impone la unicidad: dos
  solicitudes concurrentes pueden duplicarla. Ver la revisión
  [`SURV-02`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/surveys.md#surv-02--alta--idempotencia-y-unicidad-dependen-de-comprobaciones-en-memoria-sin-respaldo-del-ddl).
- **Ventana congelada al emitir.** `expires_at` se deriva de
  `response_window_days` en el momento de la emisión; cambiar el plazo después no
  mueve una ventana ya prometida.
- **Envío único y atómico.** Todas las obligatorias o ninguna; una invitación
  respondida no admite un segundo envío.
- **`value[x]` exclusivo en servicio**, igual que `forms.field_values`: el
  servicio normaliza una única columna `value_*` por fila. Falta el `CHECK` de
  respaldo en la base; ver
  [`SURV-02`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/surveys.md#surv-02--alta--idempotencia-y-unicidad-dependen-de-comprobaciones-en-memoria-sin-respaldo-del-ddl).
- **Desactivar ≠ borrar.** Corta las emisiones nuevas; lo ya emitido sigue siendo
  contestable y lo ya respondido, legible.

## Privacidad — el requisito central

ALOVIDA lo fija en dos frases: las respuestas *«solo podrán ser consultadas por el
profesional o la organización autorizada»* y *«no deberán mostrarse
públicamente»*. La decisión **D-08** del proyecto lo confirma y agrega que la
calificación pública es una entidad distinta (`community.service_reviews`).

Cómo se sostiene acá:

1. **No existe la columna.** `survey_responses` no tiene ningún campo de
   visibilidad pública. No hay estado que alguien pueda fijar por error.
2. **El paciente no se identifica por parámetro.** Las rutas `/surveys/me/*` no
   aceptan `patientProfileId`: sale del claim `pid` de la sesión. Este filtro no
   incorpora todavía el tenant de la sesión, por lo que no aísla a un paciente
   que atiende en más de una organización; ver
   [`SURV-01`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/surveys.md#surv-01--crítica--el-autoservicio-de-paciente-no-limita-invitaciones-al-tenant-activo).
3. **La autorización de lectura es por dueño, no por rol.** Dos profesionales de
   la misma organización comparten roles y no comparten instrumentos; las
   respuestas se leen colgando de `GET /surveys/templates/:id/responses`, que
   comprueba dueño antes que nada.
4. **404 en vez de 403** ante un recurso ajeno: confirmar que existe pero es de
   otro ya filtra que esa persona tuvo una atención.

## Permisos

Guard JWT global. La autoría y la lectura de respuestas exigen `PRACTITIONER` o
`CLINICIAN`; el autoservicio del paciente no exige rol —todas las cuentas de
paciente comparten el mismo— sino perfil de paciente en la sesión, igual que las
vistas de paciente de M41 scheduling.

## Tests

- Unit: `corepack yarn test src/modules/surveys --runInBand --silent` — 3 suites
  y 65 pruebas aprobadas el 2026-10-05. Cubre propiedad de plantilla,
  invitación ajena, sesión sin perfil y validación por tipo; no cubre aislamiento
  de tenant en autoservicio ni carreras de persistencia. Ver la
  [revisión backend](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/surveys.md).

## Notas de integración

### 1. Emisión automática al cerrar la cita — PENDIENTE, coordinar con C07/C08

Hoy la emisión es un comando explícito (`POST /surveys/invitations`). Lo natural
es encadenarla al cierre de la cita, pero ese cierre vive en `scheduling`, que es
dominio de otro carril, y el protocolo prohíbe invadirlo a ciegas.

Cuando se coordine: `SurveysAssignmentsService.issueForBooking` es idempotente y
seguro de llamar desde el cierre; no hace falta ninguna guarda extra del lado de
`scheduling`.

### 2. Claim `pid` expuesto en `AuthenticatedUser` — cambio en contrato compartido

`JwtPayload.pid` ya se firmaba pero `JwtStrategy` no lo reconstruía, así que
ningún servicio podía saber de qué paciente era la sesión. Se agregó
`AuthenticatedUser.patientProfileId` de forma **aditiva**: nada que dependa del
contrato anterior cambia de comportamiento.

### 3. Tipo de atención sin resolver desde la reserva — DEUDA

El modelo admite asignar por `CARE_TYPE` porque ALOVIDA lo pide, pero ni
`scheduling.appointment_bookings` ni `scheduling.bookable_slots` llevan
referencia al tipo de atención (solo `service_concept_id`). Una asignación así
nunca emitiría nada, así que **se rechaza al crearla**, con el motivo explícito,
en vez de aceptarla y fallar en silencio. Se habilita en cuanto `scheduling`
incorpore el campo.

### 4. Indicadores agregados y exportación anonimizada — FUERA DE ALCANCE

ALOVIDA los pide (`DOC-ENC-008`, `DOC-ENC-009`), pero la decisión **D-13**
—cuál es el umbral mínimo de participantes para publicar un agregado— está
**abierta**, y `alovida-blocked-decisions` dice literalmente que congela la parte
de agregación: *«se puede modelar la encuesta sin el umbral, pero no se puede
publicar ningún agregado sin él»*. El carril 10 ya lo acota a «si ya existe
soporte». Se implementa cuando D-13 se resuelva.
