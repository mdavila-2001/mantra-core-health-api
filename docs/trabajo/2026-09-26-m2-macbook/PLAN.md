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
| H2.S1.M1 | Crear el seed con su compuerta `SEED_PEOPLE_ENABLED` | sin la variable no hace nada | salida de las dos pasadas pegada | TODO |
| H2.S1.M2 | Inventar datos personales deterministas (uuid5) | dos corridas dan los mismos valores | diff de dos corridas pegado | TODO |
| H2.S1.M3 | Marcar cada fila sintética con procedencia (`source_file`, `source_row`) | toda fila lleva procedencia | consulta pegada | TODO |
| H2.S1.M4 | Comprobar login de una muestra por rol | 200 con el rol correcto | respuesta pegada | TODO |

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
| H3.S1.M1 | Normalizar nombres y deduplicar (`normalize_padron.py`) | 455 + 508 distintos | conteos pegados | TODO |
| H3.S1.M2 | Sembrar una sede por fila | un médico con 2 filas tiene 2 sedes | respuesta de la API pegada | TODO |
| H3.S1.M3 | Alta de membresía en la red de cada aseguradora | usa el endpoint existente | respuesta pegada | TODO |

### H3.S2 — Que se vean en la guía pública sin trampas
**CA:** Dado `GET /public/.../practitioners?specialty=…` sin `DEV_VERIFICATION_BYPASS`, devuelve
decenas con dirección real.
**DoD:** Las dos microtareas en `HECHO` con la respuesta pegada.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S2.M1 | Verificar con procedencia «red de aseguradora» en vez del bypass | la guía los muestra sin la variable | respuesta pegada | TODO |
| H3.S2.M2 | Mapear especialidades contra `VS_MEDICAL_SPECIALTY`, dejar sin código lo que no mapea | ningún código inventado | lista de no mapeadas pegada | TODO |

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
| H4.S1.M3 | Resolver la descarga sin token en la URL (`window.open` sale sin token) | el token no viaja en la query | petición pegada | HECHO |

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

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| `db:vendor` borra 4 patches | rompe la API si se corre | no se corre hasta que M1 cierre su H3 |
| Volumen real: 105 personas + ~960 médicos por HTTP de login/API es lento | tiempo de verificación | verificar por muestra + conteo SQL directo, no 1065 logins HTTP |
| Datasets del padrón/redes (los doce markdown) puede que M6 aún no los haya publicado | bloquea H2/H3 si no hay fuente | aislar: usar los datasets ya presentes en el repo/tools si existen; si no, simular con generador determinista propio declarando el doble (regla 65) |
