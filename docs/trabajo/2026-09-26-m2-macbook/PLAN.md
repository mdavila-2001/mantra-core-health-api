# Plan — M2 · MacBook: roles, cuentas y directorio de médicos (preproducción 2026-09-26)

- Fecha: 2026-09-26 · Repos afectados: `mantra-core-health-redesa-api` (worktree `wt-m2-macbook`,
  rama `pablo/test-m2-macbook-roles-cuentas-directorio`, base `origin/test@016caaa1`) ·
  Predecesor: ninguno
- Fuente del encargo: `AlovidaPromptManager/repartos/2026-09-26/PromptMaquinas/M2-MacBook/Preproduccion.ApiConBaseViva/RolesCuentasYDirectorioDeMedicos.md`
- Resultado observable: cada rol que un `@Roles` menciona existe y se asigna; las 105 personas del
  padrón y los ~960 médicos de Alianza y Nacional entran con `12345678`; el directorio muestra
  médicos reales con sus varias sedes; el paciente puede bajar el PDF de su propio resultado.
- Kill-test: entrar con una cuenta del padrón y con una de un médico de Alianza. Si el login
  devuelve 401, o el directorio devuelve el mismo médico dos veces, no está hecho.

## Alcance
- IN: `src/modules/authz/**`, `role-mapping.ts`, todos los `@Roles(...)` del repo, los seeds
  nuevos de personas y de redes de aseguradoras, `src/modules/common/files/**`.
- OUT: `clinical`, `scheduling` (lógica de negocio), `pharmacy`, `billing`, `accounting` (lógica de
  negocio) — son de M3/M4. No se escribe DDL. No se corre `db:vendor` (M1 no cerró su H3 aún).
- Ambigüedades registradas:
  - AMB-01: dónde declarar el seed de rol `ACCOUNTING_APPROVER` sin tocar el módulo `accounting`
    (OUT). Supuesto tomado: se agrega a `authz.seed.ts` (`CLINICAL_ROLE_SEED`), que ya vive en
    `src/modules/authz/**` (IN), en vez de crear `accounting.roles.ts` dentro del módulo OUT.
    A confirmar con: el propietario / M4 (dueño de `accounting`).
  - Q-01/Q-02/Q-03 del encargo (mostrador del médico, agenda de médicos de red, especialidades sin
    mapear) — registradas, no se resuelven por conveniencia.

## H1 — Cada rol que un `@Roles` menciona existe y se asigna
**CA:** Dado un endpoint con `@Roles(X)`, cuando lo llama un actor con X, entonces responde 200; y
cuando lo llama uno sin X, responde 403.
**DoD:** Microtareas de H1 en `HECHO`, con prueba de integración por par 200/403 y su salida pegada.
**Estado:** TODO

### H1.S1 — Cerrar el `RoleCode` que descarta en silencio
**CA:** Dado `role-mapping.ts`, cuando llega un rol que el enum no declara, entonces no se descarta callado.
**DoD:** Las tres microtareas en `HECHO` con la prueba pegada.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Inventariar los roles que los `@Roles` usan y nadie siembra | la lista sale del código | `grep` pegado (ver evidencia) | HECHO |
| H1.S1.M2 | Sembrar `BILLING`, `FINANCE`, `ACCOUNTING_APPROVER` en `authz.roles` | cada uno existe tras el seed | consulta a la base pegada | HECHO |
| H1.S1.M3 | Un rol de negocio desconocido en `mergeRoleCodes`/`AuthzEffectiveRolesService` falla fuerte (log de advertencia) en vez de descartarse mudo | hay prueba que lo fija | salida del test pegada | HECHO |

**Hallazgo de M1 (corrige la hipótesis literal del encargo):** `role-mapping.ts`/`RoleCode` (cerrado a
`USER|SECURITY_ADMIN|SUPERADMIN|PATIENT|PRACTITIONER|CLINICIAN`) sólo gobierna los roles
**globales** de `iam.user_global_roles`. `BILLING`, `FINANCE`, `ACCOUNTING_APPROVER` (y
`MEDICAL_VISITOR`/`PHARMA_LAB_ADMIN`, que sí existen) son roles de **negocio**, sembrados en
`authz.roles` (ver `src/modules/pharma_lab/pharma_lab.roles.ts`, `scheduling.roles.ts`) y resueltos
en `iam-auth.service.ts::mergeRoleCodes` vía `AuthzEffectiveRolesService`, que los mezcla con los
globales en el claim `roles` del JWT (`src/modules/iam/services/iam-auth.service.ts:133-183`).
`RolesGuard` (`src/common/auth/roles.guard.ts`) trata `SUPERADMIN` como comodín — de ahí que hoy
esos endpoints sólo respondan a `SUPERADMIN`. La corrección de H1.S1.M2 es un archivo
`<módulo>.roles.ts` nuevo con `ClinicalRoleSeed[]`, registrado en
`authz-clinical-roles-seed.service.ts::SYSTEM_ROLE_SEED`, exactamente el patrón de
`PHARMA_LAB_ROLE_SEED`/`SCHEDULING_ROLE_SEED`. `ACCOUNTING_APPROVER` va a `authz.seed.ts`
(`CLINICAL_ROLE_SEED`, ya en `src/modules/authz/**`, IN) para no crear un archivo dentro del módulo
`accounting` (OUT) — ver AMB-01. `BILLING`/`FINANCE` van en un `insurance.roles.ts` nuevo
(`src/modules/insurance/`, que **no** está en OUT).

Comando y salida (recortada) que sostienen el hallazgo:

```
$ grep -rn "@Roles(" src --include="*.ts" | grep -v spec | grep -E "BILLING|FINANCE|ACCOUNTING_APPROVER"
src/modules/accounting/controllers/accounting-ledger.controller.ts:239:  @Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER')
src/modules/insurance/controllers/broker-commission.controller.ts:13:@Roles('BILLING', 'FINANCE')
src/modules/insurance/controllers/claims.controller.ts:36:@Roles('BILLING', 'FINANCE')
src/modules/insurance/controllers/appeals.controller.ts:21:@Roles('BILLING', 'FINANCE')
src/modules/insurance/controllers/prior-auth.controller.ts:26:@Roles('BILLING', 'FINANCE')
src/modules/insurance/controllers/coverage.controller.ts:19:@Roles('BILLING', 'FINANCE')
(+ otros usos de FINANCE/BILLING_* en ads, workflow, pharma_lab, no tocados: son roles ya
sembrados o fuera del alcance de H1.S1)
```

### H1.S2 — Que el médico autorregistrado deje de comerse 403
**CA:** Dado un médico recién registrado, cuando hace check-in, reserva de mostrador, abre la ficha
del paciente o administra su laboratorio, entonces no recibe 403 por falta de rol.
**DoD:** Las dos microtareas en `HECHO` con los cuatro caminos ejercitados.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Asignar los roles que el alta de médico debe dar | los cuatro caminos dan 200 o el 403 se explica con evidencia | salida de integración pegada | HECHO |
| H1.S2.M2 | Dejar el 403 donde corresponde | un actor sin el rol sigue recibiendo 403 | salida pegada | HECHO |

**Hallazgo de H1.S2 (corrige otra vez la hipótesis literal del encargo):** `MEDICAL_VISITOR` y
`PHARMA_LAB_ADMIN` **no** son roles del médico — son del visitador médico/administrador de
laboratorio farmacéutico (`pharma_lab.roles.ts`), un actor completamente distinto (personal de una
farmacéutica, no un profesional de salud). El auto-registro de médico
(`iam-practitioner-self-registration.service.ts:492-508`) ya concede `USER` + `PRACTITIONER`
(roles globales), y los tres controladores de los cuatro caminos nombrados ya declaran
`PRACTITIONER` en su `@Roles(...)`:
- `clinical-encounters.controller.ts:49` → `@Roles('CLINICIAN', 'PRACTITIONER')` (check-in)
- `scheduling.controller.ts:548` → `@Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')` (mostrador/`appointments/direct`)
- `clinical-orders.controller.ts:38` → `@Roles('CLINICIAN', 'PRACTITIONER')` (ficha/laboratorio — `service-requests`, `diagnostic-reports`)

Verificado en vivo (API real en `localhost:3000` contra Postgres/Redis del proyecto, no mockeado):
registré un médico nuevo por `POST /iam/auth/register-practitioner` (201, `verificationStatus:
PENDING`), inicié sesión, y until pegué los tres endpoints con body vacío — **ninguno devolvió
403**: los tres dieron 400 por validación de DTO (UUIDs faltantes), que es la prueba de que
`RolesGuard` los dejó pasar. Sin token: 401 (`UNAUTHENTICATED`), confirmando que el guard de
autenticación sigue exigiéndolo. `RolesGuard.spec.ts` (7/7 verde, preexistente) ya cubre el caso
"rol insuficiente → 403" a nivel unitario.

**No hizo falta ningún cambio de código para H1.S2**: el CA ya estaba satisfecho. Se registra así
en vez de fabricar una corrección — regla 00 §6.2 prohíbe decir "corregido" sin haber corregido
nada.

## H2 — Las 105 personas del padrón entran con su cuenta
**CA:** Dada cada persona sembrada, cuando hace `POST /iam/auth/login` con `12345678`, entonces
recibe 200 y un token con el rol correcto.
**DoD:** Microtareas de H2 en `HECHO`, login de una muestra por rol y conteo en `iam.users` pegados.
**Estado:** TODO

### H2.S1 — Un seed que corre solo, no un script a mano
**CA:** Dado el arranque de la API con la compuerta encendida, cuando termina, entonces las cuentas
existen; y al re-correrlo, inserta 0 filas nuevas.
**DoD:** Las cuatro microtareas en `HECHO` con la salida de las dos pasadas pegada.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Crear el seed con su compuerta `SEED_PEOPLE_ENABLED` | sin la variable no hace nada | salida de las dos pasadas pegada | HECHO |
| H2.S1.M2 | Inventar datos personales deterministas (uuid5) | dos corridas dan los mismos valores | diff de dos corridas pegado | HECHO |
| H2.S1.M3 | Marcar cada fila sintética con procedencia (`source_file`, `source_row`) | toda fila lleva procedencia | consulta pegada | BLOQUEADO (ver AMB-04) |
| H2.S1.M4 | Comprobar login de una muestra por rol | 200 con el rol correcto | respuesta pegada | HECHO |

## H2 — cómo se cerró

**Arquitectura:** `PeopleSeedService` (`src/common/seed/people-seed.service.ts`) reusa
`IamPractitionerSelfRegistrationService.registerPractitioner` /
`IamPatientSelfRegistrationService.registerPatient` **en proceso** (no HTTP) — la misma alta
transaccional (persona + perfil + licencia) que usa el autorregistro público, en vez de
reimplementarla a mano con `EntityManager` (regla 96.1). Estas dos services no estaban exportadas
de `IamModule`; se agregó una línea a su `exports` (justificado y mínimo, declarado acá porque
excede `src/modules/authz/**` — el resto de `iam-auth.service.ts` ya estaba tocado por H1.S1.M3).

Dos helpers nuevos, reutilizables por H3 (avisado al Mac Mini): `markdown-table.ts` (puerto de
`celdas`/`es_separador`/`filas_de_tabla`/`columna` de `tools/bolivia-datasets/load_people.py`, con
tests) y `synthetic-person.ts` (cédula/celular/nacimiento/correo deterministas por `deterministicId`,
con tests). El correo sigue el patrón congelado `<nombre>.<apellido>.<índice de fila>@alovida.test`
(el índice desambigua homónimos, necesario: hay nombres repetidos en el padrón).

**Filtro de candidatos** (medido, no supuesto): de 170 filas de médicos y 165 de pacientes, sólo 13
y 92 traen `NOMBRE` — el resto son filas en blanco del generador del markdown. De los 13 médicos con
nombre, sólo 9 traen además matrícula del Ministerio (`licenseNumber` es obligatorio); los otros 4
quedan en `skipped` con su motivo exacto — **no se inventa una matrícula**, es una credencial
profesional, no un dato de contacto.

**Bug real encontrado y corregido en el camino:** la primera corrida sembró bien (9 practitioners +
92 patients, ver Evidencia), pero verificar idempotencia reveló que el chequeo previo
(`existeCredencial`) comparaba siempre por `email` — correcto para médicos
(`externalSubject: dto.email`), **pero los pacientes entran con `nationalId`, no con correo**
(`externalSubject: dto.nationalId`, `iam-patient-self-registration.service.ts:235` — confirmado con
un login real). Con el chequeo mal apuntado, la segunda pasada reintentaba las 92 altas de paciente
y las resolvía por la excepción de duplicado del propio servicio — que además mi `catch` no
reconocía, porque importé `ConflictException` de `@nestjs/common` en vez de la clase propia del
repo (`src/common/errors/domain.exception.ts`, la que de verdad lanzan los dos servicios de
autorregistro). Corregido: `existeCredencial` recibe el `externalSubject` correcto por actor, y el
import de `ConflictException` es el del dominio. Sin este fix la idempotencia (regla 97.4.3) fallaba
en la práctica aunque no hubiera filas duplicadas — el síntoma era honestidad de reporte, no
corrupción de datos.

**Evidencia — primera corrida** (API real, Postgres real, `SEED_PEOPLE_ENABLED=true`,
`SEED_PEOPLE_PASSWORD=12345678`):
```
"padrón de personas","inserted":101,"tookMs":13808,
"detail":{"practitionersCreated":9,"practitionersExisting":0,"patientsCreated":92,"patientsExisting":0,
"skipped":["USUARIO_MEDICOS_1.md#8: sin matrícula...","...#9...","...#10...","...#19..."]}
```

**Evidencia — segunda corrida, tras el fix** (idempotencia real, regla 97.4.3):
```
"padrón de personas","inserted":0,"tookMs":96,
"detail":{"practitionersCreated":0,"practitionersExisting":9,"patientsCreated":0,"patientsExisting":92,
"skipped":["...los mismos 4 médicos sin matrícula, sin cambios..."]}
```

**Evidencia — login real de una muestra por rol** (H2.S1.M4), sin mocks, contra la API viva:
```
$ curl -X POST /iam/auth/login -d '{"nationalId":"2313877","password":"12345678"}'
→ 200 {"accessToken":"...","roles":["USER","PATIENT"],...,"name":"LICZY PAOLA NUÑEZ CALLEJAS"}
```
(médico ya verificado en H1.S2 con la misma vía, login por email + rol `PRACTITIONER`).

**Tests:** `markdown-table.spec.ts` (5), `synthetic-person.spec.ts` (7), `people-seed.service.spec.ts`
(8, incluida la regresión exacta del bug de arriba). `src/common/seed/`: 191/191 verde.

**AMB-04 (nueva, más seria de lo que pensé al escribirla la primera vez — corregido antes de
cerrar):** `source_file`/`source_row`/`synthetic`/`imported_at` (§5 del plan) no existen como
columnas en `profiles.patient_profiles`/`health_practitioner_profiles` (verificado contra el esquema
real, cero columnas con esos nombres en toda la base). Añadirlas es DDL, fuera de alcance.

**No hay ningún marcador de procedencia, ni siquiera el mecanismo indirecto que usan otros seeds.**
`registerPractitioner(dto, ip?)`/`registerPatient(dto, ip?)` son el mismo autorregistro público:
no reciben un actor, y `created_by_user_id` queda apuntando al **propio usuario recién creado**
(autorregistro real), exactamente igual que si la persona se hubiera registrado sola desde el
navegador. A diferencia de `provider-accounts-seed.service.ts` (que sí pasa
`{id: SEED_ACTOR_ID, roles:[...]}` a `IamUsersService.createUser`), estos dos servicios de
autorregistro no tienen ese parámetro — no se puede distinguir en la base, hoy, una fila sembrada
por este seed de una persona que se autorregistró de verdad con los mismos datos. Es un gap real, no
sólo de columnas: haría falta o (a) una migración del modelo con las columnas de procedencia, o (b)
extender `registerPractitioner`/`registerPatient` para aceptar un actor opcional — ambas exceden el
alcance de este carril (la (a) es DDL; la (b) toca `iam-practitioner-self-registration.service.ts`/
`iam-patient-self-registration.service.ts` más allá de lo mínimo). Se registra para el propietario:
decidir si esto bloquea el cierre de H2 o si el requisito funcional (login real, roles correctos)
alcanza para esta preproducción sin procedencia por fila.

## H3 — El directorio muestra médicos reales, con sus varias sedes
**CA:** Dado un médico que trabaja en dos lugares, cuando se lo busca en el directorio público,
entonces aparece una vez, con sus dos direcciones.
**DoD:** Microtareas de H3 en `HECHO`, respuesta del directorio y conteo de distintos pegados.
**Estado:** TODO

### H3.S1 — Deduplicar sin perder sedes
**CA:** Dadas las 672 y 747 filas, cuando se siembran, entonces quedan 455 y 508 personas distintas.
**DoD:** Las tres microtareas en `HECHO` con los conteos pegados.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Normalizar nombres y deduplicar (`normalize_padron.py`) | 455 + 508 distintos | conteos pegados | HECHO |
| H3.S1.M2 | Sembrar una sede por fila | un médico con 2 filas tiene 2 sedes | respuesta de la API pegada | HECHO |
| H3.S1.M3 | Alta de membresía en la red de cada aseguradora | usa el endpoint existente | respuesta pegada | HECHO |

### H3.S2 — Que se vean en la guía pública sin trampas
**CA:** Dado `GET /public/.../practitioners?specialty=…` sin `DEV_VERIFICATION_BYPASS`, devuelve
decenas con dirección real.
**DoD:** Las dos microtareas en `HECHO` con la respuesta pegada.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S2.M1 | Verificar con procedencia «red de aseguradora» en vez del bypass | la guía los muestra sin la variable | respuesta pegada | HECHO |
| H3.S2.M2 | Mapear especialidades contra `VS_MEDICAL_SPECIALTY`, dejar sin código lo que no mapea | ningún código inventado | lista de no mapeadas pegada | HECHO |

## H4 — El paciente puede bajar el PDF de su propio resultado
**CA:** Dado un paciente con un resultado liberado, cuando pide su PDF, lo recibe; otro actor recibe 403.
**DoD:** Microtareas de H4 en `HECHO`, dos caminos ejercitados y su salida pegada.
**Estado:** TODO

### H4.S1 — Descarga autenticada y cierre del IDOR
**CA:** Dado `GET /common/files/links`, cuando lo llama una sesión cualquiera, no lista adjuntos ajenos.
**DoD:** Las tres microtareas en `HECHO` con la respuesta 403 pegada.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Cerrar el IDOR de `files/links` (falta actor + `@Roles`/guard) | una sesión ajena recibe 403 | respuesta pegada | HECHO |
| H4.S1.M2 | Permitir al paciente leer lo suyo (`canActorReadOwnFile`) | recibe su propio PDF | respuesta pegada | BLOQUEADO (conflicto de alcance, ver abajo) |
| H4.S1.M3 | Resolver la descarga sin token en la URL (`window.open` sale sin token) | el token no viaja en la query | petición pegada | DESCARTADO (superado por TX-09, ver abajo) |

**H4.S1.M1 — cómo se cerró.** `FilesService.listLinkedFiles` no recibía actor ni comprobaba nada:
`GET /common/files/links?ownerType=X&ownerId=Y` con **cualquier** `ownerId` devolvía sus adjuntos a
cualquier sesión autenticada. Se agregó `actor: AuthenticatedUser` al método y al controlador
(`@CurrentUser()`), y se filtra cada adjunto por `canActorReadOwnFile` (mismo criterio que
`FileUploadService.download` y `FilesService.generateDownloadUrl`, que ya lo tenían). Si el owner
**tiene** adjuntos pero **ninguno** es visible para el actor, `ForbiddenException` (403) — una lista
vacía habría sido indistinguible de "este recurso no tiene adjuntos". Si el owner no tiene ningún
adjunto, sigue siendo 200 vacío. 4 tests nuevos + 9 preexistentes migrados a un actor con rol de
revisión (no probaban propiedad, así que se preserva su alcance exacto). Suite `common/`: 117/117.

**H4.S1.M3 — cómo se cerró.** `generateDownloadUrl` ya firmaba una URL (`versionId`, `expires`,
`signature` con HMAC-SHA256) pero apuntaba a `:id/content`, que **nunca leyó esos parámetros**:
exigía `@CurrentUser` igual que siempre. Un `window.open()` no puede mandar el header
`Authorization`, así que la única forma de que la descarga funcionara era pegar el token de sesión
real en la query — exactamente CL-40. Se agregó `GET /:id/signed-content` (`@Public()`), que verifica
la firma en `FilesService.verifySignedDownload` (comparación en tiempo constante, `timingSafeEqual`)
contra el archivo, la versión y el vencimiento, y sólo entonces sirve los bytes vía
`FileUploadService.downloadForAuthorizedContext` (ya existente, "contexto ya autorizado"). El token
de sesión no viaja: lo que viaja es una credencial de un solo archivo, vencida en 15 minutos.
`generateDownloadUrl` ahora apunta a `signed-content`, no a `content`. 5 tests nuevos para
`verifySignedDownload` (firma válida, vencida, forjada/de otra versión, archivo inexistente) + 3
tests preexistentes actualizados (la URL cambió de forma, no de contrato de seguridad).

**H4.S1.M2 — por qué queda `BLOQUEADO`, no `HECHO`.** `canActorReadOwnFile` autoriza por **quién
subió el archivo** (`createdByUserId`) o por rol de revisión. El paciente que pide el PDF de **su
propio** resultado no lo subió él — lo subió el laboratorio/médico —, así que sigue recibiendo 403
por esta vía; el fix real es una autorización **contextual** ("¿este archivo cuelga de un
`diagnostic_report` liberado de ESTE paciente?"), exactamente el patrón que ya existe para chat
(`CommunityMessagingReadService.getAttachmentContent`) y comentarios (`getCommentMedia`) — los dos
casos que el propio código de `file-access.ts` cita como los únicos llamadores legítimos de
`downloadForAuthorizedContext`. Escribir ese servicio vive necesariamente en `clinical` (dueño de
`diagnostic_reports`), que el encargo pone **explícitamente OUT** de este carril («no tocás
`clinical`... son de M3»). Rule 65 exige simular en vez de bloquearse — pero rule 65 §4.5 también
prohíbe usar esa regla para justificar tocar código fuera de alcance: aislar el problema no es
arreglarlo. Se deja el contrato exacto para quien tenga `clinical` en su carril:

```
// clinical: nuevo método, mismo patrón que community-messaging-read.service.ts
async getDiagnosticReportFileContent(
  diagnosticReportId: string,
  fileId: string,
  actorPatientProfileId: string,
  actor: AuthenticatedUser,
): Promise<FileContentDto> {
  // 1. el informe existe, pertenece a actorPatientProfileId, y está RELEASED
  // 2. fileId está vinculado a ese informe (file_links)
  // 3. si todo lo anterior, return this.uploadService.downloadForAuthorizedContext(fileId, 'clinical.diagnostic-report.download')
  // 404 (no 403) ante cualquier combinación ajena o inexistente, mismo criterio que chat/comentarios
}
```

Ningún cambio de `common/files` se necesita para esto — el bloqueo es puramente de dónde vive el
código, no de qué hace falta construir. Registrado para el propietario / M3.

**H4 — verificado en vivo (API real, Postgres real, sin mocks), no sólo con tests unitarios:**
registré dos médicos (dueño y extraño), subí un archivo real (`POST /common/files/upload`), lo
vinculé a un owner, y confirmé: (1) el dueño lista su adjunto (200), el extraño recibe 403 exacto
`"No tiene acceso a los adjuntos de este recurso"` sobre el mismo `ownerId` — no una lista vacía,
no los adjuntos de otro; (2) `POST /:id/download-url` + `GET /:id/signed-content` **sin ningún
header `Authorization`** devolvió 200 con los bytes reales subidos; (3) alterar `expires` en la
misma URL (forjar) devolvió 403 `"Firma de descarga inválida"`. Los tres, con `curl` puro contra
`localhost:3000`.

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| `db:vendor` borra 4 patches | rompe la API si se corre | no se corre hasta que M1 cierre su H3 |
| Volumen real: 105 personas + ~960 médicos por HTTP de login/API es lento | tiempo de verificación | verificar por muestra + conteo SQL directo, no 1065 logins HTTP |
| Datasets del padrón/redes (los doce markdown) puede que M6 aún no los haya publicado | bloquea H2/H3 si no hay fuente | aislar: usar los datasets ya presentes en el repo/tools si existen; si no, simular con generador determinista propio declarando el doble (regla 65) |


## Cierre tras integrar `test` (todo lo demás ya estaba mergeado)

Al integrar `origin/test` (101 commits) en esta rama aparecieron cuatro hechos que cambiaron el plan:

1. **H4.S1.M3 → DESCARTADO por TX-09 (ya mergeado).** `:id/content` ahora valida `versionId`/`expires`/
   `signature` (HMAC en tiempo constante, 410 si venció) **y sigue exigiendo sesión**, decisión del
   equipo para que «cada lectura quede con su actor». Mi endpoint público `signed-content` contradecía
   esa decisión y duplicaba la verificación: se eliminó. Queda **abierto como decisión**: `window.open()`
   no manda `Authorization`, así que el front debe bajar el archivo con `fetch` + blob (o TX-09 tendría
   que aceptar una firma sin sesión). Sigue en el IDOR de `/links`, que TX-09 no tocaba: se conserva
   aplicado sólo al listado genérico; `listLinkedFilesOf` (rutas clínicas de M3, que autorizan por el
   paciente de la fila) no filtra por autoría.
2. **CL-68 (pedido de M3 a M2) → HECHO.** `POST /forms/field-definitions`, `POST /forms/fields/:id/dependencies`
   y `PUT /forms/fields/:id/localizations/:lang` ahora llevan `@Roles('CLINICIAN','PRACTITIONER','SECURITY_ADMIN')`.
   Test: `forms-controllers.spec.ts` (3 casos, `PATIENT` excluido).
3. **B13 (pedido de M4 a M2)**: `ACCOUNTING_APPROVER` sembrado (H1.S1.M2). «Emitirlo» es asignarlo por
   `POST /authz/users/:id/role-assignments`; no se asigna a nadie por defecto.
4. **M6 entregó** `provider-networks.dataset.json` (ya normalizado, con `source_file`/`source_row` por sede)
   y `observed-specialties.dataset.json`: **AMB-02 y AMB-03 quedan resueltas** (existían en `test`, no en
   el checkout local viejo). Con eso H3 se hizo acá; el traspaso a la Mac Mini no dejó ninguna rama en
   el remoto, así que no había nada que integrar de esa máquina.

## H3 — cómo se cerró

`DirectoryNetworksSeedService` (`SEED_DIRECTORY_NETWORKS_ENABLED` + `SEED_PEOPLE_PASSWORD`), en la
cadena de seeds. Plegado por nombre normalizado: **763 personas distintas** (Alianza 454 + Nacional 507
menos 198 en las dos; el encargo decía 455/508, el dataset trae 454/507). Por persona: alta con el
autorregistro (cuenta `<nombre>.<apellido>.<hash>@alovida.test`, clave por variable), una **sede de
práctica por dirección** (`PractitionerSitesService.createOwnSite`, teléfonos en la dirección), una
**afiliación por dirección** (es lo que la guía publica como «dónde atiende») y una **membresía por red**
(`addMembership`, con `contractReference = red de aseguradora: archivo#fila`). Converge: sobre médicos ya
existentes completa lo que falte (la primera corrida murió a mitad en 335 fichas por falta de tenant en
`createOwnSite`; la segunda las completó sin duplicar).

Evidencia (Postgres real, sin mocks):
```
1ra corrida  practitionersCreated 763 · membershipsCreated 429 · failed 335 (X-Tenant-Id)   → bug real, corregido
2da corrida  practitionersExisting 763 · sitesCreated 519 · membershipsCreated 532 · failed 0
3ra corrida  todo en 0 (idempotente)
membresías   RED_BO_ASEG_ALIANZA_VIDA_S_A 454 · RED_BO_ASEG_NACIONAL_SEGUROS_VIDA_Y_SALUD_S_A 507
guía (DEV_VERIFICATION_BYPASS=false)  927 filas · 765 médicos de red con sedes · 337 con >=2 sedes · 0 nombres repetidos
ejemplo      «Jose Alberto Dalence Romero» aparece 1 vez, con 2 direcciones (Clínica de las Américas / Centro Médico Sirani)
filtro       por su especialidad devuelve 84 médicos, los 84 de red
login        alcoba.zuna.836969@alovida.test / 12345678 → 200, roles [USER, PRACTITIONER]
```

Decisiones (a confirmar por el propietario):
- **Quedan `PENDIENTE`, no «verificados».** El encargo pedía verificarlos «con procedencia red de aseguradora»,
  pero (a) `test` ya cambió la guía para **mostrar** a los pendientes con `verified:false` en vez de excluirlos
  (bloque «La verificación se MUESTRA, no excluye»), así que la CA («se ven sin el bypass») se cumple sin
  afirmar nada, y (b) `verifyCredential` exige declarar contra QUÉ se verificó: una lista de aseguradora no es
  una verificación de matrícula. Se prefirió no marcar `VERIFIED` algo que nadie verificó.
- **Matrícula `SINT-<7 dígitos>`**: la red no publica matrícula y el alta la exige; D-3 autoriza inventar lo
  obligatorio que falte salvo nombres. Es visiblemente sintética y el perfil sigue pendiente.
- **Especialidades**: mapeo por nombre en castellano contra `VS_MEDICAL_SPECIALTY`; **117 nombres del dataset
  no mapean y quedan sin código** (la lista sale en el detalle del paso). Ningún código inventado. No hubo
  decisión de negocio que tomar acá (Q-03).
