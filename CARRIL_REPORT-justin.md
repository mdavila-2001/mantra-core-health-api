# Carril C-A · Justin — reporte

**Rama (API):** `justin/h01-verificacion-habilita-acceso`
**Semana:** 17–21/08/2026 · **Base:** `dev` al día (API `59bf51e6`, front `234227b`)
**Entorno:** stack `mantra-redesa` (Postgres 5433), API local `node dist/src/main.js` en :3000

---

## Resumen

| Fase | Estado |
|---|---|
| Prerequisitos | Hecho — con 4 hallazgos de entorno que bloqueaban a todo el equipo |
| Fase 2 · **H-01** | **CERRADO y verificado contra la API viva (403 → 200)** |
| Fase 1 · recorrida de la vertical | **Hecha** — 3 defectos encontrados: 2 cerrados, 1 necesita decisión |
| Fase 3 · última milla de UI | **El hueco grande cerrado** (el doctor ya puede publicar su agenda) |
| Fase 4 · E2E integrado | **Guion listo y corriendo: 26/27 PASS.** El viernes se le suman los tramos de los demás |

H-01 se resolvió primero porque es el bloqueo de entrada de la propia vertical.

**Ramas:** `justin/h01-verificacion-habilita-acceso` (API, 3 commits) ·
`justin/vertical-p0` (front, 3 commits).

### Lo entregado, en una línea cada uno

1. **H-01 — cerrado.** El veredicto de la autoridad no cerraba el intento, así
   que la verificación de un paciente **nunca** terminaba. 403 → 200. *(API)*
2. **El doctor no podía publicar su agenda desde la UI — cerrado.** El backend
   abrió el autoservicio el 16/08 y el front siguió diciéndole «No tenés
   permiso», justo en el CTA que lo invita a publicarla. *(front)*
3. **El contrato OpenAPI mentía sobre la publicación de agenda — cerrado.**
   Colisión de nombres de DTO: publicaba la forma de los cuestionarios. *(API)*
4. **Un paciente no puede leer su propia historia clínica — ABIERTO, D-3.**
   403 permanente por una traducción de identificadores equivocada. Es el último
   paso de la vertical y necesita una decisión de Marcelo (`profiles`).
5. **El E2E de la vertical existe y corre**: 26/27 pasos en PASS contra la API
   viva, con doctor y paciente nuevos. El único rojo es el punto 4.

> **Para el reviewer, en un minuto:** los tres arreglos están verificados
> ejecutando, no leyendo. El pendiente (D-3) está con causa raíz, evidencia SQL y
> parche propuesto; no lo apliqué porque cae en `profiles`, que esta semana es de
> Marcelo (regla 4).

---

## Fase 2 · H-01 — la verificación de identidad no habilitaba el acceso

### El diagnóstico: eran DOS defectos, no uno

El informe original (12/08) describía el síntoma del **camino del revisor**: aprobar
una revisión manual dejaba el caso en `CASE_VERIFIED` con su check abierto y sin
aserción. **Ese ya estaba arreglado** en `dev` por `b5e81486` (12/08 16:15), que
introdujo `settleManualApproval`.

Lo que seguía roto —y es lo que sufre un paciente real, porque en producción no
interviene ningún administrador— es el **camino automático**:

1. El paciente abre su caso (`POST /identity/me/identity-verification`). Queda en
   `CASE_IN_VERIFICATION` con un check `CHECK_PENDING`.
2. `DispatchIdentityChecksJob` lo despacha y asienta un intento con
   `outcome: 'PENDING'` — la autoridad encoló la solicitud pero todavía no
   resolvió—. En `recordAttempt`, un intento PENDIENTE se crea con
   `completedAt: undefined`.
3. En el siguiente tick el worker recoge el veredicto y llama a
   `POST /internal/identity/checks/{id}/results`.
4. **Ahí moría**: `recordResult` exige `existsCompletedForCase`, que cuenta
   intentos con `completed_at IS NOT NULL`. Nadie cerraba nunca el intento del
   paso 2, así que la precondición no se cumplía **jamás**.

Resultado: 422 en cada tick, para siempre. El check se quedaba en
`CHECK_IN_PROGRESS`, el caso nunca emitía aserción, y `VerifiedIdentityGuard`
—que consulta `identity_assertions` en cada petición— seguía devolviendo 403.
La pantalla prometía «Se habilita tu acceso» y no pasaba nada.

### El arreglo

`identity-checks.service.ts` — `completeInFlightAttempt`, llamado al principio de
`recordResult`: **el veredicto es lo que cierra la conversación con la autoridad**,
así que el intento que lo estaba esperando se completa ahí.

Tres decisiones, con su razón:

- **El intento es mutable, y esto es lo que sus columnas esperan.** El modelo
  (`diagram_27_identity_assurance.puml`) marca `identity_check_results` e
  `identity_assertions` como `<<IMMUTABLE>>`, y `identity_verification_attempts`
  **no**: tiene `started_at`/`completed_at` justamente para esto. No lleva
  `row_version` ni `updated_at`, así que no se le aplica `touch()`.
- **El desenlace es `ATTEMPT_SUCCESS` incluso con veredicto negativo.** El intento
  mide si la autoridad contestó, no qué contestó; `FAILED` está reservado al fallo
  técnico de despacho (es lo que manda el worker cuando la autoridad rechaza
  encolar). Que la identidad no coincida lo dice el resultado, que es el único que
  porta el veredicto.
- **La precondición se mantiene intacta.** Sólo se cierra un intento que esté
  `ATTEMPT_PENDING` y sin `completedAt`. Un veredicto sin ningún intento previo
  sigue dando 422 (verificado abajo).

### Verificación — contra la API viva

Criterio de cierre del carril, ejercitado de punta a punta con un paciente
**nuevo**, sin ningún atajo de base de datos:

```
=== PASO 1 · alta publica del paciente (CI-H01-cc9e4753) ===
  POST /iam/auth/register-patient -> 201
=== PASO 2 · inicia sesion con su documento ===
  POST /iam/auth/login -> 200
=== PASO 3 · su resumen ANTES de verificar (se espera 403) ===
  GET /profiles/patients/me/summary -> 403
=== PASO 4 · sube la foto con el carnet y abre su caso ===
  POST /common/files -> 201
  POST /identity/me/identity-verification -> 201
  caseId=8ea68e05-4531-4163-9c61-76647df89046 checkId=2d3f722d-3a56-49fa-a857-2f93634cf35f
=== PASO 5 · token administrativo (hace de worker SYSTEM) ===
  POST /iam/auth/login (admin) -> 200
=== PASO 6 · el worker descubre el check a despachar ===
  GET /internal/identity/checks/dispatchable -> 200
  encontrado: checkTypeCode=IDENTITY_CARD awaitingVerdict=False
=== PASO 7 · despacha: la autoridad ENCOLA (intento PENDIENTE) ===
  POST /internal/identity/checks/{id}/attempts -> 201
=== PASO 8 · segundo tick: el worker ve que espera veredicto ===
  awaitingVerdict=True (debe ser True)
=== PASO 9 · la autoridad responde MATCH  <-- AQUI ESTABA H-01 ===
  POST /internal/identity/checks/{id}/results -> 201
=== PASO 10 · el titular consulta su propio caso ===
  GET /identity/me/verification-cases -> 200
=== PASO 11 · su resumen DESPUES de verificar (se espera 200) ===
  GET /profiles/patients/me/summary -> 200

================ VEREDICTO ================
  antes  : 403
  despues: 200
  H-01: PASS  (403 -> 200)
```

Estado resultante en la base, con los conceptos resueltos a su código:

```
         intento_desenlace          | attempt_number | cerrado
------------------------------------+----------------+---------
 identity_assurance:ATTEMPT_SUCCESS |              1 | t

            check_estado            |           caso_estado
------------------------------------+----------------------------------
 identity_assurance:CHECK_COMPLETED | identity_assurance:CASE_ASSERTED

 aserciones_vigentes
---------------------
                   1
```

Comprobación negativa — que el arreglo no debilitó la precondición:

```
POST results SIN intento previo -> 422
  PASS: la precondicion sigue protegiendo
```

### Pruebas

```
corepack yarn typecheck                        -> EXIT=0
corepack yarn build                            -> EXIT=0
corepack yarn test src/modules/identity_assurance/
  Test Suites: 10 passed, 10 total
  Tests:       68 passed, 68 total              -> EXIT=0
```

Se sumaron **4 unitarias** que fijan el ciclo (`identity-checks.service.spec.ts`):
cierra el intento en vuelo y el veredicto deja de rechazarse (H-01); lo cierra como
exitoso aunque el veredicto sea negativo; no reescribe la fecha de un intento ya
completado; no resucita un intento que falló al despacharse.

Y **2 int-specs**:

- `identity-verification-self-service.int-spec.ts` (**nuevo**) — el camino del
  titular de punta a punta, incluido el 403 → 200.
- `identity-verification-cycle.int-spec.ts` — corregido su **rojo preexistente**:
  esperaba `CASE_VERIFIED` donde el flujo termina en `CASE_ASSERTED` (la aserción se
  emite en la misma transacción, y `VERIFIED` es un estado de paso dentro de ella).
  Se le sumó la comprobación de que la aprobación deja una aserción vigente.

> Los int-specs **no se pudieron correr en verde** por un bloqueo de entorno ajeno
> a este cambio (hallazgo E-3 abajo): el harness aborta el arranque cuando un seed
> falla, y el seed de mensajería no es idempotente contra una base ya poblada. Por
> eso la verificación de H-01 se hizo contra la API viva, que es además el criterio
> de cierre que pide el carril.

---

---

## Fase 1 y 3 · la vertical, y los dos defectos que aparecieron

La recorrida se hizo **contra el contrato vivo** (`/docs-json` de la API en
marcha) y contra el código del front, no por la pantalla: el hallazgo E-1 dejó el
entorno de pruebas inservible hasta reconstruirlo, y con el tiempo que quedaba
rendía más recorrer los 6 tramos de la escalera endpoint por endpoint. La
recorrida por UI queda para el miércoles, ya con el camino desbloqueado.

### D-1 · el doctor no podía publicar su agenda desde la UI (CERRADO)

**El agujero que dejaron los merges del 16/08.** El backend abrió el autoservicio
—las cinco escrituras del catálogo de scheduling declaran
`@Roles('SCHEDULING_ADMIN', 'PRACTITIONER')` y el servicio le acota el recurso al
suyo (`assertPuedeCrearRecurso`)—. El front no acompañó:

- `agenda.html` le dice al doctor «Todavía no publicaste tu agenda … Los
  pacientes todavía no pueden pedirte turno», con un botón **«Publicar mi
  agenda»** que lleva a `/schedule/new`;
- `/schedule/new` le respondía **«No tenés permiso para crear agenda»**, porque
  su lista de roles seguía siendo la de antes del autoservicio
  (`agenda-create.ts`, `ROLES_QUE_CREAN`);
- y el botón «Crear agenda» de la cabecera tampoco se le mostraba
  (`agenda.ts`, `ROLES_QUE_CREAN_AGENDA`, con un comentario que decía «ni el
  agente de mostrador ni el profesional arman la grilla» — cierto hasta el 16/08).

Callejón sin salida **en el único camino que vuelve reservable a un doctor
nuevo**: es literalmente el paso 1 de la recorrida de este carril.

Abrir el rol no alcanzaba. La fase 1 del asistente pide teclear `resourceType`,
`resourceRefType` y `resourceRefId` — y esos tres son justo los que el backend
exige que sean los del propio actor. El tercero es un uuid: un doctor no lo sabe,
y habría chocado con un 403 después de completar el formulario. Ahora la pantalla
los **aporta y los deshabilita** (se ven —es su agenda, conviene que lo vea— y
`getRawValue()` los sigue enviando). Si la sesión no declara
`practitionerProfileId`, se avisa antes de empezar las cinco fases en vez de
dejarlo chocar al final.

Quien administra el catálogo no cambia: sigue armando la agenda de cualquiera,
sin nada fijado ni deshabilitado (hay prueba que lo fija).

**Verificación:** `agenda-create` 11 → **16 pruebas**; `agenda` **42/42** intacto;
`corepack yarn build` EXIT=0; `npx tsc -p tsconfig.spec.json --noEmit` EXIT=0.

### D-2 · el contrato OpenAPI describía mal la publicación de agenda (CERRADO)

`POST /scheduling/resources/{id}/templates` publicaba **el cuerpo de los
cuestionarios**:

```
campos publicados: title, description, ownerPractitionerId, responseWindowDays
campos reales:     name, rules[], slotMinutes, bookingPolicyId, validFrom, validTo
```

Causa: `scheduling` y `surveys` declaran **cada uno una clase
`CreateTemplateDto`**, y sin `@ApiSchema({ name })` ambas colapsan en un único
`#/components/schemas/CreateTemplateDto` — gana la última en registrarse. Es
válido como OpenAPI, así que ni Redocly ni el `git diff --exit-code` de CI lo
detectan; simplemente **describe otra cosa**. Cualquier cliente generado del
contrato —la colección de Postman que CI genera incluida— mandaba un cuerpo que
el endpoint rechaza.

Arreglado con el mismo remedio que ya usa el repo en 22 pares de DTOs
(`PharmacyCreateSiteDto` y compañía): `@ApiSchema({ name:
'SchedulingCreateTemplateDto' })`. Contrato regenerado con
`corepack yarn docs:openapi:generate` (EXIT=0); `surveys` conserva el nombre
genérico, así que su contrato no se mueve.

**Verificado sobre el `openapi.json` regenerado:**

```
ref ahora: #/components/schemas/SchedulingCreateTemplateDto
campos: name, rules, slotMinutes, bookingPolicyId, validFrom, validTo
requeridos: name, rules
ref surveys: #/components/schemas/CreateTemplateDto
```

### D-2b · las otras dos colisiones (NO tocadas — son de otros carriles)

Un barrido de los 63 módulos encontró **82 nombres de DTO repetidos, 60 sin
`@ApiSchema`**. La mayoría son DTOs de respuesta y el daño es menor, pero hay
**otros dos cuerpos de request igual de rotos** que `CreateTemplateDto`:

| Esquema | Rutas que lo comparten | Forma que se publica |
|---|---|---|
| `CreateAffiliationDto` | `POST /profiles/practitioners/me/affiliations` · `POST /orgext/affiliations` | la de `organization_extensions` |
| `CreateAssignmentDto` | `POST /forms/assignments` · `POST /surveys/assignments` | la de `surveys` (`surveyVersionId`) |

`CreateAffiliationDto` toca la trayectoria del profesional (**B-6, carril de
Marcelo**) y `CreateAssignmentDto` toca `forms` (**carril de Ender**), así que no
los toqué. El arreglo es de una línea por DTO, igual que el de arriba.

El generador ya lo avisa por consola —`WARN Duplicate DTO detected:
"CreateAssignmentDto" is defined multiple times with different schemas`— pero es
un aviso, no un fallo: **nada en CI lo convierte en rojo**. Propuesta para
Marcelo: que `docs:openapi:generate` falle ante un duplicado.

### D-3 · un paciente NO puede leer su propia historia clínica (abierto — decide Marcelo)

**El defecto más serio que encontró la recorrida, y el último paso de la
vertical.** `GET /clinical/patients/{id}/summary` responde **403 al titular**,
siempre. No es un caso borde: **ningún paciente puede ver su propia historia**.

Causa raíz, verificada contra la base:

```sql
select pat.profile_id, pp.id as person_profile_id, pp.person_id,
       (pat.profile_id = pp.id) as pat_es_person_profile,
       (pat.profile_id = pp.person_id) as pat_es_persona
  from profiles.patient_profiles pat
  left join profiles.person_profiles pp on pp.person_id = pat.profile_id;
```
```
          patient_profile_id          |          person_profile_id           | pat_es_person_profile | pat_es_persona
--------------------------------------+--------------------------------------+-----------------------+----------------
 bbc6e86d-8c32-5d7f-a4b7-d4957a886360 | a1b2ba28-ef61-5497-8d68-01239a749e0f | f                     | t
 850e04d6-94dd-4075-94e1-05ffa55f9e44 | 73a83782-c007-4d42-a082-c1339abacfa8 | f                     | t
 b5b0912b-6fd3-45a9-aac1-b16cd66b1476 | d0093717-89e4-46dc-8017-a60af028554c | f                     | t
```

`patient_profiles.profile_id` **es el id de la persona**, no el de
`person_profiles`. Pero `ClinicalReadService.assertOwnRecord` hace:

```ts
const perfil = await this.personProfilesRepo.findById(em, patientProfileId);
if (!link || !perfil || perfil.personId !== link.personId) throw new ForbiddenException(...)
```

es decir, busca `person_profiles` **por su `id`** usando un valor que es un id de
**persona**. No encuentra fila, `perfil` es `null`, y el 403 sale siempre.

**Por qué las pruebas no lo veían:** las cinco unitarias de `assertOwnRecord`
mockean `personProfilesRepo.findById` para que devuelva `{ personId: 'persona-1' }`.
El mock da por buena justamente la traducción de identificadores que está mal. Es
el punto ciego que el propio CLAUDE.md advierte de las unitarias con el
`EntityManager` mockeado — y la razón por la que este carril se corrió contra la
API viva.

**Arreglo propuesto** (no aplicado): la comprobación quiere dos cosas —que el
perfil exista y que sea del actor—. Con la semántica real de los identificadores
son `patientProfileId === link.personId` más la existencia del perfil de paciente
de esa persona (`findByPersonAndType(em, link.personId, PROFILE_TYPE_PATIENT)`,
que ya existe en el repositorio). Un uuid inventado sigue sin abrir nada, porque
no va a coincidir con `link.personId`.

**Por qué no lo toqué:** el arreglo depende de cuál es la semántica *pretendida*
de `patient_profiles.profile_id`, y `profiles` es carril de Marcelo (regla 4 de
la semana). Si la intención del modelo es que apunte a `person_profiles.id`,
entonces el defecto está en los datos y no en esta comprobación, y eso se corrige
en el pipeline, no acá. **Necesita su decisión; el parche de arriba es de tres
líneas una vez decidido.**

---

## Fase 4 (adelantada) · el E2E de la vertical, contra la API viva

Guion HTTP de la escalera completa con un doctor y un paciente **nuevos**, sin
tocar la base a mano. **26 de 27 pasos en PASS**; el único FAIL es D-3.

```
 1 registro publico del profesional                      201 PASS
 2 el profesional inicia sesion                          200 PASS
 3 publica su recurso de agenda (autoservicio)           201 PASS
 4 publica su plantilla con franjas                      201 PASS
 5 materializa los cupos                                 201 PASS   (280 cupos)
 6 alta publica del paciente                             201 PASS
 7 el paciente inicia sesion con su documento            200 PASS
 8 el paciente ve la lista de agendas                    200 PASS   (el doctor nuevo APARECE con su nombre)
 9 lista los cupos libres del doctor                     200 PASS
10 retiene el cupo (hold)                                201 PASS
11 solicita la cita desde el portal                      201 PASS
12 el doctor acepta la cita                              200 PASS
13 inicia la atencion                                    200 PASS
14 abre el encuentro clinico                             201 PASS
15 lee el vademecum del binding dinamico                 200 PASS   (Paracetamol N02BE01)
16 prescribe (queda en borrador)                         201 PASS
17 D-05: emitir SIN firmar se rechaza                    422 PASS
18 firma la receta                                       200 PASS
19 emite la receta                                       200 PASS
20 cierra el encuentro                                   200 PASS
21 completa la cita                                      200 PASS
22 el DOCTOR ve el archivo del paciente                  200 PASS   (1 receta, 1 encuentro)
23 el PACIENTE ve su propio archivo                      403 FAIL   <-- D-3
24 rechaza una cita con motivo                           200 PASS
25 reprograma la cita a otro cupo                        200 PASS
26 cancela la cita con motivo                            200 PASS
27 limite: rechazo con motivo de relleno se rechaza      422 PASS
```

Lo que esto deja probado, y que hasta ahora nadie había recorrido junto:

- **El médico invisible está realmente cerrado en el backend**: un profesional
  recién registrado publica su agenda con su propio token y aparece con su nombre
  en la lista que ve un paciente. (Lo que faltaba era la UI — D-1.)
- **D-05 se cumple de verdad**: emitir sin firmar da 422, firmar y emitir da 200.
- **Los motivos obligatorios funcionan**, incluida la detección de relleno.
  Ojo al escribir pruebas: con menos de 5 caracteres contesta **400** (`@MinLength`)
  y no llega a la regla de relleno, que es la que responde 422.

El guion queda en el scratchpad de la sesión (`vertical-p0.ps1`); el viernes se
le suman los tramos nuevos de Pablo, Ender y Marcelo, que es lo que pide la fase 4.

### Lo que la recorrida confirmó que SÍ está bien

- El ciclo completo de la cita existe y pide motivo donde corresponde: `reject`,
  `cancel` y `reschedule` exigen `reasonText`, con mínimo de 5 caracteres y un
  rechazo explícito de relleno («na», «prueba», «…») que responde 422
  `REASON_REQUIRED` / `REASON_PLACEHOLDER`.
- **Falsa alarma que descarté:** el botón de check-in de la agenda del doctor.
  El endpoint no admite `PRACTITIONER`, pero el front **ya** lo gatea con su
  propia lista (`ROLES_QUE_OPERAN_CITAS`) y documenta la razón —registrar la
  llegada es trabajo del mostrador—. No hay defecto; lo verifiqué antes de
  anotarlo.

---

## MAC-1 · Los cupos vencidos dejan de ofrecerse y de reservarse (A-02 / A-03)

**Rama:** `justin/mac1-cupos-vencidos` · **Doc:** §13.3 · **Origen:** auditoría TJ-4.

### El defecto

Dos fichas de la auditoría, con la misma raíz. `GET /scheduling/slots?onlyAvailable=true`
devolvía **100 de 100 huecos ya vencidos** (A-03), y `POST /scheduling/slots/:id/holds` sobre
uno de ayer respondía **201 con `holdToken`** (A-02). El código lo tenía documentado sin
saberlo: el JSDoc de la consulta decía «`onlyAvailable` filtra por capacidad restante y no por
estado». Faltaba mirar el reloj.

### Qué cambió

**El filtro, en la consulta y no en memoria** (regla del #156). `inicioDeLoReservable(desde,
ahora)` vive en `scheduling-time.ts` —el módulo del arreglo de H-02— y adelanta el borde
inferior de la ventana hasta ahora cuando se piden sólo disponibles. Lo usan las **dos**
consultas que ofrecían vencidos: la de `GET /scheduling/slots` y la de
`GET /scheduling/resources/:id/slots`, que es la que van a consumir MAC-5 y MAC-6.

**Sin convertir husos, a propósito.** La tarea pedía comparar «en el huso de la sede». No hace
falta y habría sido un error: `start_at` es `timestamptz`, o sea un instante absoluto, y
comparar dos instantes da el mismo resultado en cualquier zona. La zona importa al **generar**
cupos —eso es H-02/#110, otro problema—, no al preguntar si uno ya pasó. Hay un test que lo
fija escribiendo el mismo instante con dos husos distintos.

**El instante lo aporta el servicio**, no un `new Date()` escondido en el repositorio: la
consulta queda pura y el `where` es asertable.

**La retención rechaza el pasado** con **422** y no 404 —el cupo existe; lo que no existe es la
posibilidad—. Y como `booking_policies` ya declaraba `min_notice_minutes` y nadie lo miraba, se
respeta: un turno que empieza en diez minutos es futuro, pero con una política de treinta
tampoco se puede pedir. **Dos motivos, dos frases**: «Ese horario ya pasó» contra «hay que
pedirlo con al menos N minutos de anticipación». La primera versión decía lo segundo para un
turno de hacía seis días, lo que se vio recién al probarlo contra la API.

**Segundo cinturón en `materializarReserva`**, que cubre confirmar y solicitar a la vez: un
hold tomado hace rato puede llegar con el horario recién pasado.

### Verificación contra la API viva

```
--- A-03 · «sólo disponibles» desde hace 7 días ---
  devueltos 100 · vencidos 0        (la auditoría midió 100 de 100 vencidos)

--- el cupo del pasado sigue siendo consultable (onlyAvailable=false) ---
  visible: 2026-08-14T09:03:00.000Z

--- A-02 · retener ese cupo vencido ---
  HTTP 422 · Ese horario ya pasó.

--- el camino bueno: un cupo futuro ---
  cupo futuro: 2026-08-20T16:30:00.000Z
  HTTP 201 · holdToken: sí
```

Consultar el pasado **sigue funcionando** con `onlyAvailable=false`: es lo que necesita la
vista del día de MAC-6 para mostrar lo ya atendido. Lo que se cerró es ofrecerlo como
reservable.

### Pruebas

`yarn test src/modules/scheduling/` → **14 suites · 233 pruebas**. Once son nuevas: cuatro del
helper, tres de A-02 en el servicio y **cuatro del primer spec de repositorio del módulo**
(`scheduling-agenda.repository.spec.ts`), que aserta el `where` que sale hacia la base — no las
filas que vuelven, porque filtrar en memoria habría dado el mismo verde y seguido trayendo cien
filas muertas de Postgres.

### Un arreglo colateral que no es cosmético

El doble del cupo en el spec de bookings fijaba `2026-06-01`, una fecha del calendario ya
pasada. Al volverse 422 reservar el pasado, **catorce pruebas ajenas al cambio se pusieron
rojas**. Ahora el cupo es relativo a `Date.now()` y tiene un gemelo `cupoVencido()`. Una fecha
fija en un fixture se pudre sola y el día que el reloj la pasa, rompe cosas que nadie tocó.

### La auditoría, en verde

`yarn e2e:auditoria` con `E2E_API_URL=http://localhost:3000` (por defecto apunta al 3005 y
saltea las 20 en silencio — vale anotarlo, porque una corrida «sin fallos» puede ser una
corrida que no midió nada):

```
✓  2 [P10] un cupo del pasado no se puede retener          ← A-02
✓  4 [P09] la disponibilidad no ofrece huecos del pasado   ← A-03
   11 passed · 2 failed · 7 skipped
```

Los dos rojos restantes **no son de esta noche**: `[P04] quien se registra con un correo puede
entrar con ese correo` es A-05 (explícitamente fuera del reparto) y `[P00.4] el motivo de
consulta` es A-01 — ver el hallazgo de abajo. **Ningún verde se cayó.**

> **Ojo con el limitador.** `/iam/auth/login` corta a 10 por minuto y por IP, y la suite se
> saltea **entera** cuando lo encuentra caliente. Si volvés de una tanda de pruebas manuales,
> esperá un minuto o vas a leer «20 skipped» como si estuviera todo bien.

### Lo que NO se tocó

`generate-slots` (regenerar y limpiar es el horizonte rodante, carril propio) · el modelo · los
DTO · el filtro propio de la pantalla del paciente, si lo tiene: doble cinturón.
## MAC-2 · Publicar la agenda: una pantalla, dos decisiones

**Rama:** `justin/mac2-publicar-una-pantalla` · **PR:** front #183 · **Doc:** §6 completo.

Cinco pasos y veinticinco campos pasan a una pantalla. Se pregunta *qué días atendés y en qué
horario* y *cuánto dura una consulta*.

**El contrato no cambió**: los mismos cuatro POST, en el mismo orden, con los mismos campos. Hay
specs que lo fijan payload por payload, incluido que la identidad que el backend comprueba
—`resourceType`, `resourceRefType`, `resourceRefId`— viaja igual **aunque no se pregunte**.

| Antes | Ahora |
|---|---|
| 4 campos técnicos | Los sabe el sistema. **No se muestran deshabilitados: no se muestran** |
| «Nombre de la plantilla», obligatorio | Derivado — no existía `GET` de plantillas, era una etiqueta a ciegas |
| Política con `code`/`name` obligatorios | **La UI era más estricta que el contrato** (`@IsOptional()`). Opt-in real |
| Duración y capacidad, dos veces | Una. Preguntarlo dos veces sólo servía para que no coincidieran |
| Ventana de `generate-slots` | Calculada: hoy → `min(hoy+3 meses, fin)` |
| Fase 5: inventar una excepción | Se fue. Bloquear un día es MAC-5 |

**Verificado en el navegador y contra la base.** Dos clics —martes, publicar—:

```
 name                   | cupos | primero    | ultimo     | dias
 Agenda de Lucia Ortiz  |  104  | 2026-08-25 | 2026-11-17 | Tue
```

Y con una médica que ya tenía agenda, el 422 de solape se lee **«Ya tenés una agenda publicada
que se superpone con esa franja»**, no como JSON.

**Lunar preexistente que ahora se ve más:** si el POST de la plantilla falla, el recurso ya
quedó creado y sin horario. No lo introduce este cambio —el asistente por fases hacía lo
mismo—, pero publicar es un clic y se llega más rápido.

## MAC-3 · La vista previa: los turnos se ven antes de publicar

**Rama:** `justin/mac3-vista-previa` · **PR:** front #184 · **Doc:** §6.1–6.2, §14.

Las **dos verificaciones que la tarea exige antes de escribir código**, hechas contra la API
viva:

**1 · H-02 está muerto.** Plantilla 9:00–12:00 en zona `America/La_Paz`:

```
 utc               | la_paz | hasta_local
 2026-08-21 13:00  | 09:00  | 10:00
 2026-08-21 14:00  | 10:00  | 11:00
 2026-08-21 15:00  | 11:00  | 12:00
```

**2 · El backend TRUNCA.** Franja 9:00–16:00 con turnos de 90 minutos (420/90 = 4,67):

```
 09:00 → 10:30 · 10:30 → 12:00 · 12:00 → 13:30 · 13:30 → 15:00
 VEREDICTO: 4 cupos → TRUNCA
```

Cuatro, no cinco. Como trunca, el resto se muestra como **información y no como pregunta**: no
hay nada que decidir.

`calcularTurnos` es TypeScript puro con 9 casos de prueba. La pantalla dice «Lunes: 4 turnos
09:00 · 10:30 · 12:00 · 13:30» y «Te queda libre de 15:00 a 16:00 (60 min)» — idéntico a los
cupos que la API generó, verificado lado a lado.

## MAC-4 · El GET de plantillas + «Mi agenda»

**Ramas:** `justin/mac4-plantillas-patron` (API) · `justin/mac4-mi-agenda` (front) ·
**PRs:** API #174, front #185 · **Doc:** §7, §13.1.

**El hueco, confirmado:** en todo `scheduling` los únicos endpoints de plantilla eran los dos
POST. El médico publicaba un horario y no podía volver a verlo nunca más.

`GET /scheduling/resources/:id/templates` con la misma autorización que su POST hermano.
Verificado en vivo: devuelve la plantilla que el asistente nuevo publicó en el navegador
—«Horario de Agenda de Lucia Ortiz», martes 09:00–13:00, cada 30 min— y otra profesional
pidiéndola recibe **403**.

La pantalla «Mi agenda» la lee y la dice en palabras: «Martes de 09:00 a 13:00 · consultas de
30 min», «Tenés turnos abiertos hasta el 17/11/2026» — la misma fecha que devuelve la base.
Trae el **aviso de agotamiento** con su botón: es el parche manual del horizonte rodante,
porque sin él una agenda se vacía en silencio.

**Dos defectos encontrados ejecutando, no leyendo:**

1. **MikroORM devuelve `null`, no `undefined`**, para columnas anulables sin completar. Mis
   guardas `=== undefined` las dejaban pasar y `validTo: null` llegaba a `.toISOString()`: **el
   endpoint entero daba 500**. Mismo defecto que el paso de la foto del alta (#165), encontrado
   de la misma forma.
2. **`GET /scheduling/slots` rechaza ventanas de más de 92 días** con 422. Yo pedía un año. Y
   como el fallo de esa lectura se traga a propósito, la tarjeta funcionaba perfecta y el aviso
   **no aparecía nunca**. Se vio en la pestaña de red, no en las pruebas.

**Lo que quedó afuera, con motivo:** «Editar» precargando el alta. La tarea manda frenar si el
contrato no permite cerrar la plantilla vieja, y **no hay un solo `PATCH` en todo
`scheduling`**. Cerrar la anterior necesita una decisión de modelo que no corresponde
improvisar.

## MAC-5 · El mes de ocupación, y las excepciones en su casa

**Ramas:** `justin/mac5-excepciones-lectura` (API) · `justin/mac5-mi-agenda-mes` (front) ·
**PRs:** API #175, front #186 · **Doc:** §8.

**El hueco que la tarea preveía, confirmado:** se podían **crear** excepciones y no leerlas —el
mismo hueco de las plantillas—. Sin esa lectura el calendario no puede distinguir un día
**bloqueado** de un día **sin agenda**: los dos aparecen sin cupos, y el motivo es toda la
diferencia.

La solapa «Cómo viene el mes» muestra **ocupación** («6/8»), jamás los turnos. Cinco estados,
con las distinciones que importan: un día sin cupos dice «no atendés» y no «libre»; un día
bloqueado muestra su motivo; el bloqueo gana sobre la ocupación.

**No reusa el calendario del paciente como componente** porque pinta otra cosa. Lo que sí
comparten —la aritmética de la grilla— salió a `shared/date/calendario-mes` con 9 pruebas. La
tarea sugería un «modo conteo»: es la forma equivocada, sería una bandera que cambia el
comportamiento.

**Bloquear un día se hace desde el mes**, con motivo obligatorio. Es la fase 5 del alta vieja en
su lugar natural. Verificado de punta a punta:

```
martes, 25 de agosto: bloqueado — Vacaciones
los cupos de ese día, como los ve un paciente → 0
y en total, incluidos los bloqueados          → 8
```

Los ocho siguen existiendo; ninguno se ofrece.

## MAC-6 · El día, con huecos, nombres y acciones

**Ramas:** `justin/mac6-nombre-del-paciente` (API) · `justin/mac6-mi-agenda-dia` (front) ·
**PRs:** API #176, front #187 · **Doc:** §9.

**El costo 2 que la tarea anticipaba era peor de lo previsto:** el DTO no traía el nombre **y un
médico no puede leer perfiles de paciente** —todas las rutas de `profiles/patients` exigen
`SECURITY_ADMIN`—. La vista del día era una lista de identificadores. Es el pedido explícito del
registro del cliente: «nombre completo del paciente».

El nombre viaja con la **misma regla que el motivo** (`puedeVerElMotivo`, de TJ-2), resuelto en
lote. Verificado:

```
la DUEÑA de la agenda   → Ana Lucía Flores · Control de presión
una profesional AJENA   → ni el nombre ni el motivo
```

La pantalla es **una línea de tiempo con huecos**, no una lista de reservas:

```
09:00–09:30   Ana Lucía Flores · Control de presión   [Avisar demora] [Cancelar]
09:30–10:00   — libre —
```

**Dos hallazgos que sólo aparecen ejecutando:**

1. **`patient_profiles.profile_id` apunta directo a `persons.id`**, sin tabla puente. La cadena
   que parecía natural devuelve **cero filas**.
2. **`POST /bookings/:id/check-in` no admite `PRACTITIONER`.** El botón devolvía «Rol
   insuficiente». **No abrí el rol**: el servicio no comprueba que la cita sea del actor, así
   que sumarlo dejaría a cualquier profesional marcar la llegada de cualquiera — y la tarea
   dice no tocar esos endpoints. Se esconde el botón; **un médico solo, sin mostrador, hoy no
   puede registrar una llegada**. Tarjeta para el equipo.

## Hallazgos de entorno (bloqueaban a todo el equipo, no sólo a este carril)

### E-1 · `dist/` estaba obsoleto y le faltaba el módulo `surveys`

`dist/` era del **15/08** y tenía **62** módulos; el código fuente tiene **63**.
Faltaba `surveys` entero — es el residuo del `git reset` ajeno que se comió ese
módulo (el mismo incidente que motivó la regla del worktree por persona).

Importa porque **MikroORM descubre entidades desde `dist/` en las pruebas**
(`entities: ['dist/src/modules/**/entities/*.entity.js']`), no desde los `.ts`. Con
el `dist` viejo, **todo `test:integration` moría al arrancar** con
`MetadataError: Metadata for entity SurveyAnswers not found` — incluidos specs que
nadie había tocado (comprobado con `common.int-spec.ts`).

**Cómo salir:** `corepack yarn build`. Vale la pena que lo corra todo el equipo
antes de tocar int-specs.

### E-2 · caché de metadata del ORM rancia

`node_modules/.cache/mikro-orm` tenía 1 230 entradas y **ninguna** `Survey*`.
Se borra sin consecuencias (se reconstruye sola). No era la causa de E-1, pero
convenía descartarla.

### E-3 · el harness de integración no arranca contra una base poblada

`test/integration/harness.ts` lanza si algún seed falla (`La siembra dejo N
seed(s) omitido(s)`), y el seed de **mensajería** no es idempotente:

```
UniqueConstraintViolationException: duplicate key value violates unique constraint
"uq_message_channels_code" - detail: Key (code)=(EMAIL) already exists.
```

Los canales ya vienen sembrados por el paquete (`load_seeds.py`), así que el seed
de arranque los reinserta y choca. **Consecuencia: ningún int-spec puede correr
contra una base cargada.** La app en cambio sí arranca (registra
`Seeds: 9/10 ok · 1 omitidos` y sigue): sólo el harness es estricto.

Pasó inadvertido porque **CI sólo corre `postgres-privileges`** de la suite de
integración; cualquier otro int-spec en rojo es invisible.

No lo toqué: `messaging` es el carril de Pablo y el arreglo (hacer idempotente el
seed por `code`) le corresponde a él o a Marcelo. **Queda como bloqueador
compartido.**

---

### E-4 · una prueba del front caía por tiempo, no por su contenido (CERRADO)

Al sumar 5 pruebas al asistente de agenda, la suite completa del front empezó a
dar 1 rojo en `definitions.spec.ts` («cada objetivo de cada paso existe en alguna
plantilla»). **No era una aserción**: `Error: Test timed out in 5000ms`. Esa
prueba recorre `src/app` con `readdirSync`/`readFileSync` —unos 1 700 archivos
leídos de forma síncrona— y con la suite entera compitiendo por CPU se pasa del
timeout por defecto de vitest.

Medido: **3,26 s aislada · 5 040 ms dentro de la suite**. Línea base en `dev`
(mismo árbol, misma máquina): **271/271 suites · 2 598 pruebas · EXIT 0**, así
que el rojo aparecía sólo con la carga extra.

Se le dio timeout propio (30 s) con la explicación al lado, en vez de adelgazar
la comprobación: leer el árbol es justamente lo que hace que la prueba valga.
**Suite completa en la rama: 271/271 · 2 603/2 603 · EXIT 0.**

---

## Hallazgos de producto (no tocados, para decidir juntos)

### P-1 · un despacho fallido deja el check en un callejón sin salida

Si la autoridad rechaza encolar (con el adapter por defecto,
`PROVIDER_NOT_CONFIGURED`), `recordAttempt` deja el check en `CHECK_FAILED`. Pero
`findDispatchable` sólo lista `CHECK_PENDING` y `CHECK_IN_PROGRESS`: **el check
desaparece de la cola del worker para siempre** y el caso se queda colgado hasta
expirar, aunque el intento se haya marcado `retryEligible: true` — nadie consume
ese campo.

No es H-01 (aparece sólo cuando el proveedor falla), pero es el mismo tipo de
callejón. Propuesta: que `findDispatchable` incluya `CHECK_FAILED` con
`retry_eligible = true`, o un barrido de reintento. Requiere decisión, no es
mecánico.

---

## Cómo reproducir

```powershell
# 1. Infra (ya levantada con Docker Desktop)
docker ps   # mantra-redesa-postgres-1 healthy en :5433

# 2. Construir y arrancar la API con el fix
cd mantra-core-health-redesa-api
corepack yarn build
node dist/src/main.js          # :3000

# 3. Ciclo de H-01 de punta a punta
#    (script en el scratchpad de la sesión: h01-verify.ps1)
```
