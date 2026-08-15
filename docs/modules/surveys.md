<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/surveys/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `surveys`

**Fuente:** [`src/modules/surveys/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/surveys/README.md)
· 3 controllers · 3 services · 4 repositories · 7 entidades · 7 DTO

---

# Módulo Surveys — Cuestionarios y encuestas de satisfacción

Instrumento de satisfacción dirigido: plantilla con versiones inmutables y
vigencia, preguntas con tipo de respuesta y obligatoriedad, asociación a la cosa
evaluada, invitación contra una atención completada y respuestas **privadas**
del paciente con lectura para el profesional dueño.

Cubre el carril 10 y las nueve reglas `DOC-ENC-001` … `DOC-ENC-009` del actor
doctor, más `PAC-CAL-008` y `PAC-DIAG-014` del actor paciente, que el
diagnóstico REDESA marcaba **todas `AUSENTE`**.

## Por qué es un módulo nuevo y no `forms` ni `community.polls`

`redesa-gap-map` registra esto como decisión de arquitectura abierta; se resolvió
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
  hay forma de responder. Es la regla que REDESA fija explícitamente.
- **Emisión idempotente.** Único por `(reserva, versión)`, sostenido además por
  índice en la base: cerrar dos veces la misma cita no reclama dos veces el mismo
  cuestionario.
- **Ventana congelada al emitir.** `expires_at` se deriva de
  `response_window_days` en el momento de la emisión; cambiar el plazo después no
  mueve una ventana ya prometida.
- **Envío único y atómico.** Todas las obligatorias o ninguna; una invitación
  respondida no admite un segundo envío.
- **`value[x]` exclusivo**, igual que `forms.field_values`: una sola columna
  `value_*` poblada por fila, con `CHECK` en la base.
- **Desactivar ≠ borrar.** Corta las emisiones nuevas; lo ya emitido sigue siendo
  contestable y lo ya respondido, legible.

## Privacidad — el requisito central

REDESA lo fija en dos frases: las respuestas *«solo podrán ser consultadas por el
profesional o la organización autorizada»* y *«no deberán mostrarse
públicamente»*. La decisión **D-08** del proyecto lo confirma y agrega que la
calificación pública es una entidad distinta (`community.service_reviews`).

Cómo se sostiene acá:

1. **No existe la columna.** `survey_responses` no tiene ningún campo de
   visibilidad pública. No hay estado que alguien pueda fijar por error.
2. **El paciente no se identifica por parámetro.** Las rutas `/surveys/me/*` no
   aceptan `patientProfileId`: sale del claim `pid` de la sesión. Si se aceptara,
   cualquiera podría pedir los cuestionarios de otro.
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

- Unit: `services/*.service.spec.ts` — 42 casos sobre los tres servicios,
  incluidos los de privacidad (invitación ajena, plantilla ajena, sesión sin
  perfil) y los de validación de respuesta por tipo.

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

El modelo admite asignar por `CARE_TYPE` porque REDESA lo pide, pero ni
`scheduling.appointment_bookings` ni `scheduling.bookable_slots` llevan
referencia al tipo de atención (solo `service_concept_id`). Una asignación así
nunca emitiría nada, así que **se rechaza al crearla**, con el motivo explícito,
en vez de aceptarla y fallar en silencio. Se habilita en cuanto `scheduling`
incorpore el campo.

### 4. Indicadores agregados y exportación anonimizada — FUERA DE ALCANCE

REDESA los pide (`DOC-ENC-008`, `DOC-ENC-009`), pero la decisión **D-13**
—cuál es el umbral mínimo de participantes para publicar un agregado— está
**abierta**, y `redesa-blocked-decisions` dice literalmente que congela la parte
de agregación: *«se puede modelar la encuesta sin el umbral, pero no se puede
publicar ningún agregado sin él»*. El carril 10 ya lo acota a «si ya existe
soporte». Se implementa cuando D-13 se resuelva.

