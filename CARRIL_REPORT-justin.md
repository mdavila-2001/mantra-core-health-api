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
