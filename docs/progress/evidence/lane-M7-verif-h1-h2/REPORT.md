# Verificación real de H1 y H2 de M7 en una segunda máquina — 2026-09-26

Lo que los reportes de H1 (API #474 / front #712) y H2 (API #475 / front #713) dejaron
**NO CUBIERTO**, corrido contra el artefacto real: `node dist/src/main.js` de `test` sobre un
Postgres efímero levantado desde cero con el DDL del repo, y el front de `test` servido con
`ng serve --configuration real-api` y recorrido con Playwright (Chromium). Nada se probó contra el
simulador.

| Pieza | Versión |
|---|---|
| API `mdavila-2001/mantra-core-health-api` @ `test` | `abe90074` (incluye #474 y #475) |
| Front `mdavila-2001/mantra-core-health` @ `test` | `5717bdb6` (incluye #712 y #713) |
| Postgres | `timescale/timescaledb-ha:pg18` `sha256:131bfdf8…`, contenedor `verif-pg`, DDL por `docker/db-init/init-postgres.sh` desde `database/SQL` + `database/NoSQL` |
| Node / Playwright | `v24.18.1` / `@playwright/test 1.62.1` |
| Stores compartidos | Redis 6380, Mongo 27018 (base propia), OpenSearch 9201, MinIO 9002 |
| Banderas de la API | `AUTH_REFRESH_COOKIE_ENABLED=true`, `AUTH_REFRESH_COOKIE_SECURE=false`, `AUTH_MFA_CHALLENGE_ENABLED=true`, `ORM_SCHEMA_SYNC=off` |

Guiones, logs y capturas: `scripts/`, `logs/`, `capturas/` junto a este archivo. Cada línea
`PASS`/`FAIL` de los logs trae el estado HTTP real y, cuando aplica, el `SELECT` sobre la base.

## Resumen

| Bloque | Resultado |
|---|---|
| H1 · API con roles reales (`h1-api-preparacion.mjs`) | **25 PASS / 2 FAIL** antes de los arreglos → **27 / 0** con ellos |
| H1 · `test/integration/patient-access-revocation.int-spec.ts` en Node 24 | **4 / 4** (`Tests: 4 passed`) |
| H1 · navegador: cookie, F5, Seguridad, Mi privacidad, Quién ve mi historia, MFA (`h1-navegador.mjs`) | **17 PASS / 1 FAIL** (el FAIL es la observación O1) |
| H1 · navegador: emergencia con CLINICAL_APPROVER real (`h1-navegador-emergencia.mjs`) | **11 / 11** (con el arreglo D1) |
| H2 · navegador: alta de laboratorio e imagenología (`h2-altas-instituciones.mjs`) | **0 / 6** sin el catálogo de afiliación (D6) → **6 / 6** con el fixture de H2 |
| H2 · runtime por API: hospital y aseguradora (`h2-api-hospital-aseguradora.mjs`) | **6 / 6** |
| H2 · navegador: alta del médico, 14 páginas (`h2-alta-medico-navegador.mjs`) | **6 / 6** |
| H2 · navegador: editor del perfil (`h2-editor-perfil-navegador.mjs`) | **13 PASS / 1 FAIL** (aserción del guion; D3 arreglado, D7 arreglado, D4 abierto — §H2.4) |

**Defectos reales encontrados:** cuatro arreglados con PR aparte (D1, D2 y D7 en la API, PR #481;
D3 en el front, PR #719) y tres sin arreglar que necesitan una decisión (D4 en la API; D5 y D6 son
del arranque en frío del artefacto y caen en M1).

## Defectos

### D1 · El acceso de emergencia no abría la historia (API, **arreglado**, PR de la API)

Con una médica `PRACTITIONER` + `CLINICAL_APPROVER` (asignado con
`POST /authz/users/:id/role-assignments {roleCode: CLINICAL_APPROVER, tenantId: seed}`), **no**
SUPERADMIN:

```
PASS emergencia con justificación por la médica CLINICAL_APPROVER -> 201 :: status=201 {"id":"d34bdd20-…","status":"ACTIVE"}
FAIL con el acceso de emergencia la médica vuelve a leer -> 200 :: status=403 {"code":"FORBIDDEN","message":"Sólo podés consultar tu propia historia clínica." …}
PASS A ve el acceso como emergencia (isEmergency) en /authz/me/access :: {… "isEmergency":true …}
     SELECT break_glass_sessions -> 1
```

Causa: `ClinicalReadService.tieneAccesoAutorizado` sólo pregunta al PDP por
`purposeOfUse: 'TREATMENT'`; el PDP exige que el propósito del grant coincida (CAN-AUTH-001) y el
grant de `break-the-glass` lleva EMERGENCY/ELEVATED. H1 lo había probado con SUPERADMIN, que pasa
antes de llegar al PDP. En el front, tras el 201 la pantalla releía y seguía en 403.

Arreglo: lectura y escritura preguntan también por `EMERGENCY` (el nivel lo sigue decidiendo el
PDP). Spec `clinical-read.service.spec.ts` 46/46. Verificado en vivo tras rebuild:
`PASS con el acceso de emergencia la médica vuelve a leer -> 200` y en navegador
`h1-emergencia-03-expediente-abierto.png` (403 → botón «Acceso de emergencia» → diálogo con
justificación → `POST …/break-the-glass 201` → `GET /charts/patients/:pid/chart 200`).

### D2 · Cualquier sesión enrolaba un factor MFA en la cuenta de otro (API, **arreglado**, PR de la API)

```
FAIL A NO puede enrolar un factor MFA sobre la cuenta de B (esperado 403/404) :: status=201 {"id":"9db16e93-…","userId":"c771262d-…","state":"…","secret":"SFR2W5GG…","otpauthUri":…}
     !!! DEFECTO: factor ajeno creado id=9db16e93-…; SELECT iam.mfa_factors -> c771262d-… (user_id de B)
```

`POST /iam/users/:id/mfa-factors` no lleva `@Roles` y `IamMfaService.enrollOrVerify` no miraba al
actor. Arreglo: 403 «No tiene acceso a los factores MFA de esta cuenta» salvo titular o
SECURITY_ADMIN/SUPERADMIN; spec `iam-mfa.service.spec.ts` 10/10. En vivo tras rebuild:
`PASS … status=403 {"code":"FORBIDDEN",…}`. **Ojo:** `POST /iam/users/:id/devices` está en la
misma situación (sin `@Roles`); no se tocó, queda señalado.

### D3 · La matrícula pendiente mostraba el sello de verificada y sin Editar/Retirar (front, **arreglado**, PR del front)

Contra la API real, «Credenciales» del editor (`/my-account/edit?pestana=5`) listaba las dos
matrículas del alta con estado «Habilitación pendiente» y en la columna de acciones el sello
`sello-verificado` en vez de Editar/Retirar (`capturas/h2-editor-01-credenciales.png`, corrida
previa al arreglo). La API publica el código del concepto como `profiles:AUTH_PENDING`
(`SELECT cc.code … -> profiles:AUTH_PENDING`) y `matriculaPendiente()` lo comparaba entero contra
`AUTH_PENDING`/`ST-PENDING` (el del simulador). Arreglo: se compara sin el prefijo del módulo; spec
de la lógica 24/24. Con el arreglo servido por `ng serve`, la misma pantalla ofrece las acciones y
`PATCH /profiles/practitioners/me/jurisdiction-authorizations/:id` desde la pantalla responde 204
(§H2.4).

### D7 · La matrícula que el propio profesional agrega desde su editor nacía vigente (API, **arreglado**, PR de la API)

Desde «Credenciales» → «Agregar matrícula» (número, autoridad, PDF): `POST /common/files/upload 201`
→ `POST /profiles/practitioners/:id/jurisdiction-authorizations 201`, el toast dice «Se agregó la
matrícula. Queda pendiente de verificación» y la fila nueva aparece **«Habilitación vigente»** con
el sello y «Descargar» (`capturas/h2-editor-05-matricula-nueva.png`):

```
select license_number, cc.code … -> MP-NUEVA-c529a8 | profiles:AUTH_ACTIVE
GET /profiles/practitioners/me/summary -> licenses[]: MP-NUEVA-c529a8 | stateConceptId=60036f43-… (AUTH_ACTIVE) | fileId=dc2e1b24-…
```

La ruta no lleva `@Roles` (el titular administra lo suyo) y `addJurisdictionAuthorization` creaba
siempre `PROF.AUTH_ACTIVE`: un profesional autorregistrado se autoverificaba una matrícula. Arreglo:
nace `AUTH_PENDING` salvo SECURITY_ADMIN/SUPERADMIN (alta administrativa, que sigue igual); spec
`profiles-practitioners.service.spec.ts` 164/164. El `licenses[].fileId` (ID-09) sí llega y se
relee bien.

### D4 · «Retirar» una matrícula propia nunca puede terminar bien (API, **sin arreglar**, decisión)

`removeOwnLicense` responde 422 si hay **cualquier** fila en
`audit.jurisdiction_authorizations_history` (D-BR07-5). Pero toda matrícula nace con una revisión:

```
select … from audit.jurisdiction_authorizations_history …
9a4943e8|1|audit:OPERATION_INSERT||2026-09-26 11:35:19   ← «T.I. 538/14», nunca editada
c8c4ec21|1|audit:OPERATION_INSERT||2026-09-26 11:35:19   ← «MP-…»
c8c4ec21|2|audit:OPERATION_UPDATE||…                     ← PATCH de la propia médica
```

Desde la pantalla, «Retirar» sobre la matrícula nunca editada:

```
DELETE 422 /profiles/practitioners/me/jurisdiction-authorizations/9a4943e8-… res={"code":"PRECONDITION_FAILED","message":"Esa matrícula ya tiene historial de auditoría; no se puede borrar"}
```

Es decir, el botón que el front ofrece (y que H2 dejó como `DELETE … = 204` en su runtime) termina
siempre en 422 en un entorno con la auditoría activa; y una corrección propia (PATCH) también la
vuelve imborrable. Como la FK de la historia no tiene `ON DELETE` y la auditoría es append-only, el
DELETE físico no tiene salida. **Propuesta para quien decide (H2 / propietario):** que «retirar» una
matrícula pendiente sea un retiro lógico (cerrar `valid_to` / estado retirado) y no un DELETE, o que
el front no ofrezca «Retirar» cuando el estado de la fila lo va a rechazar. No se tocó código.

### D5 · Una base nueva no termina de inicializarse: el patch v4.2.21 aborta (arranque en frío, M1)

`init-postgres.sh` sobre un Postgres vacío (`database/SQL` de `test` @ `abe90074`, que ya trae el
«patch v4.2.21 corregido»):

```
psql:/init/SQL/patches/2026-09-19_v4221_aseguradoras_codigo_unico.sql:183: ERROR:  v4.2.21: se esperaban 17 aseguradoras canónicas y hay 0
CONTEXT:  PL/pgSQL function inline_code_block line 15 at RAISE
exit=3
```

Las 17 aseguradoras las siembra la API **después** de `postgres-init`, así que en una base nueva el
patch no tiene sujeto y tira todo el init (y `2026-09-25_v4223…` queda sin aplicar). Es la misma
clase de problema que el script ya trata para los `*backfill*`; este archivo no se llama así.
Salida usada acá: aplicar `v4223` a mano, arrancar la API (seed on boot: 21 pasos, 0 fallos) y
recién entonces `v4221` → `NOTICE: v4.2.21 OK · aseguradoras: 25 (canónicas 17, resto 8)`.
Evidencia: `logs/verif-pg-init.log` (copia en `logs/`).

### D6 · Sin `VS_AFFILIATION_DOCUMENT_TYPE` el alta de organizaciones responde 422 (arranque en frío, M1/H2)

El recorrido de navegador del alta de laboratorio e imagenología llegó al final de sus 10/11
páginas (PDF subidos por `/iam/auth/upload-registration-document` 201 ×4 y ×6) y el envío falló:

```
POST 422 /iam/auth/register-organization {"code":"PRECONDITION_FAILED","message":"El catálogo de documentos de afiliación no está disponible","details":{"valueSet":"VS_AFFILIATION_DOCUMENT_TYPE"}}
```

El value set no lo siembra la API: sale de los seeds del modelo (`gen_seeds.py`), como ya lo dice el
propio fixture de H2 (`docs/progress/evidence/lane-M7-h2/fixture-catalogos-afiliacion.sql`). Un
despliegue que sólo corra el DDL vendorizado más la API queda con la pantalla entera y el alta
rota al final. Con el fixture aplicado, las dos altas pasan (§H2.1). Evidencia sin fixture en
`logs/h2-altas-instituciones.SIN-FIXTURE.*` y `capturas/sin-fixture/`.

## Observaciones (no son defectos, pero conviene saberlas)

- **O1 · `logout-all` no borra la cookie.** «Cerrar sesión en todos lados» → `POST /iam/auth/logout-all 200 {"revokedSessions":2}`, el front vacía `localStorage`, y el siguiente refresh da `401 "Reuso de refresh token detectado"` (la sesión murió, bien). Pero la cookie `redesa_refresh` sigue en el navegador hasta vencer; `POST /iam/auth/logout` sí la limpia. Higiene, no seguridad.
- **O2 · El paciente entra con su CI, no con el correo.** `POST /iam/auth/login {email}` de un paciente recién registrado → 401 «Credenciales inválidas»; con `{nationalId}` → 200. El sujeto de la credencial del paciente es la CI (`iam-patient-self-registration.service.ts`), el del médico es el correo. El placeholder del login («correo@ejemplo.com o 1234567») no lo distingue.
- **O3 · El front de `test` arranca en modo simulado.** `environment.development.ts` tiene `mockBackend: true`; contra la API real hay que servir `--configuration real-api` (y el login vive en `/auth`, no en `/login`).
- **O5 · «Guardar cambios» del editor manda `acceptsNewPatients: true` sin que nadie lo toque** (el front lo agrega si el perfil lo tenía en `false`; se ve en el `PATCH /profiles/practitioners/me` de §H2.4). Es un efecto colateral del front que conviene revisar.
- **O4 · Login por correo del médico en modo cookie:** el cuerpo del login trae `refreshToken: ""` y la cookie llega `HttpOnly; Path=/iam/auth/token/refresh; SameSite=Strict` (sin `Secure` porque `AUTH_REFRESH_COOKIE_SECURE=false` en http local).

## H1 · detalle

### H1.1 · API con roles reales (`logs/h1-api-preparacion.txt`, 27/27 tras los arreglos)

Pacientes A y B (`register-patient` 201), médica (`register-practitioner` 201, roles
`["USER","PRACTITIONER"]`, tenant seed), `CLINICAL_APPROVER` asignado por el admin (201) y visible
en el token nuevo (`scopedRoles: {"<seed>": ["CLINICAL_APPROVER"]}`). Luego:

- sin vínculo → `GET /clinical/patients/A/summary` **403**; el admin crea la relación asistencial (201) → **200**;
- A ve el vínculo en `/authz/me/access` con nombre y estado; B intenta revocarlo → **404**; A lo revoca → **200** (`SELECT authz.care_relationships -> status_concept_id=8d56de1d…|cerrada=t`);
- **403 real de la médica revocada:** `{"code":"FORBIDDEN","message":"Sólo podés consultar tu propia historia clínica."}`;
- emergencia sin justificación → **400**; con justificación por la médica → **201**; relectura **200** (D1); A la ve como emergencia; B no puede revocarla (404), A sí (200); la médica vuelve al 403;
- MFA: enrolamiento TOTP (201, `secret` base32), verificación con código generado (201), login sin código → 401 `MFA_REQUIRED`, código malo → 401 `MFA_INVALID`, código vigente → 200; enrolamiento cruzado → 403 (D2).

### H1.2 · `patient-access-revocation.int-spec.ts` en Node 24 (`logs/int-patient-access-revocation.log`)

```
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

Contra la misma base (`ORM_SCHEMA_SYNC=off RATE_LIMIT_DISABLED=true`, runner ESM del repo).

### H1.3 · Navegador (`logs/h1-navegador.txt`, 17/18; capturas `h1-*.png`)

- **Login en modo cookie desde el navegador** (A, por CI): 200, `refreshToken=""`, cookie
  `{"name":"redesa_refresh","path":"/iam/auth/token/refresh","httpOnly":true,"sameSite":"Strict"}`,
  `localStorage` sin refresh token (`claves=mantra.session,mantra-core-health.nav-collapsed`).
- **F5:** `POST /iam/auth/token/refresh 200` con cuerpo `{}` y la cookie rotada; «Seguridad» se dibuja.
- **Seguridad:** sesiones abiertas listadas (2), contraseña actual incorrecta → 422 mostrado sin cerrar la sesión.
- **Mi privacidad:** retirar → `POST /consent/me/consents/:id/withdraw 200`; la fila releída dice «Retirado el 26/09/2026 · Retirado».
- **Cerrar sesión en todos lados:** 200, `localStorage` limpio, refresh 401 (O1 sobre la cookie).
- **Quién ve mi historia** (B): el vínculo con la médica «Con acceso» → Revocar → `POST /authz/me/care-relationships/:id/revoke 200` → «Hasta el 26/09/2026 · Revocado»; la médica → 403 por API.
- **MFA en el navegador:** login de la médica sin código → 401 `MFA_REQUIRED` y aparece «Código de verificación» (`h1-mfa-01-pide-codigo.png`); con el TOTP → 200 (`h1-mfa-02-adentro.png`).
- **Capturas por viewport/tema** de Seguridad, Mi privacidad y Quién ve mi historia: escritorio 1366×900 y móvil 390×844, claro y oscuro (12 PNG `h1-{seguridad,privacidad,quien-ve-mi-historia}-{escritorio,movil}-{claro,oscuro}.png`).

### H1.4 · Emergencia en el navegador (`logs/h1-navegador-emergencia.txt`, 11/11)

Médica (TOTP) → `/medical-records/B` → `GET /charts/patients/B/chart 403` → alerta «Acceso de
emergencia» con botón (rol CLINICAL_APPROVER) → diálogo con justificación → `POST …/break-the-glass 201`
→ relectura `200` y la alerta desaparece → B ve «Emergencia · Con acceso» con el aviso «Hay 1
acceso(s) de emergencia…» → Revocar → 200 → «Emergencia · Revocado» → la médica vuelve al 403.
Capturas `h1-emergencia-0{1..5}-*.png`.

## H2 · detalle

### H2.1 · Alta de laboratorio (UNIPERSONAL) e imagenología (S.R.L.) en el navegador (`logs/h2-altas-instituciones.txt`, 6/6 con el fixture)

Diez/once páginas del `app-paginated-form` recorridas de verdad (empresa → papeles → constitución
→ central → sucursales → representante → tres gerencias → acceso), PDF reales por
`/iam/auth/upload-registration-document` (201 ×4 y ×6), `POST /iam/auth/register-organization 201`,
pantalla de éxito, y en la base: `LABORATORIO_UNIPERSONAL_…|docs=4|reps=1`,
`IMAGENOLOGIA_SRL_…|docs=6|reps=1`. Los dos dueños inician sesión (200, tenant propio en el token).
Capturas `h2-lab-0{1..4}-*.png`, `h2-imagen-0{1..4}-*.png`. La unipersonal pasó «Constitución y
poder» sin adjuntar nada (CL-43).

### H2.2 · Hospital y aseguradora en runtime por API (`logs/h2-api-hospital-aseguradora.txt`, 6/6)

- Hospital: no hay pantalla (D-BR09-3, «pantalla diferida»); `register-organization` con
  `tenantType: HOSPITAL` + país y jurisdicción de las enumeraciones públicas → **201**, 6 documentos y
  1 representante en la base, el dueño entra. SRL sin constitución → **422** «Falta la escritura de
  constitución: sólo una empresa unipersonal puede omitirla» y no queda tenant.
- Aseguradora: mismo cuerpo que arma `register-organization.ts` del front (`tenantType: PAYER`,
  bloque `payer`) → **201**; `insurance.insurance_carriers -> ASEG_…|AV…`; la dueña entra.
- Al pasar: la API rechaza reutilizar un `fileId` ya vinculado a otra organización (422 «ya está
  vinculado a una organización»), correcto.

### H2.3 · Alta del médico en el navegador (`logs/h2-alta-medico-navegador.txt`, 6/6)

Las 14 páginas del wizard (nombre, CI + departamento, sexo + fecha, contacto, trabajo, domicilio,
lugar de trabajo, consultorio, título por combobox, habilitación, respaldos, títulos, especialidades,
contraseña), con un título universitario con número y PDF y una especialidad. El PDF sube por
`/iam/auth/upload-registration-document` (201) y `POST /iam/auth/register-practitioner` → **201**;
`registro-exito`; por API `GET /profiles/practitioners/me/summary 200` con 2 matrículas y 1
especialidad, y en la base `profiles.professional_credentials -> 1|1` (una credencial, con
`file_id`). Capturas `h2-medico-0{1..4}-*.png`.

### H2.4 · Editor del perfil en el navegador (`logs/h2-editor-perfil-navegador.txt`)

Con la médica del punto anterior y el arreglo D3 servido por `ng serve` (13 PASS / 1 FAIL; el FAIL
es una aserción del guion que miraba `licenses[0]` en vez de la matrícula nueva, comprobada aparte
contra la base):

- **Credenciales:** las dos matrículas pendientes ofrecen Editar/Retirar (antes del arreglo: sello,
  `h2-editor-01-credenciales.png`). Editar → diálogo «Editar …» → «Guardar cambios» → confirmación →
  `PATCH /profiles/practitioners/me/jurisdiction-authorizations/:id 204` con
  `{"licenseNumber":"MP-EDIT-…","regulatoryAuthority":"Colegio Médico de Bolivia"}`; la tabla
  releída muestra el número nuevo y el toast «Se guardaron los cambios.».
- **Retirar:** 422 sobre la corregida y 422 sobre la nunca editada (`DELETE … 422 "Esa matrícula ya
  tiene historial de auditoría; no se puede borrar"`) → D4; el front dice «No se pudo retirar. Probá
  de nuevo.».
- **Agregar matrícula con PDF:** `POST /common/files/upload 201` → `POST /profiles/practitioners/:id/
  jurisdiction-authorizations 201` con `fileId`; la fila nueva pliega tres acciones (Editar, Retirar,
  Descargar). En la base, antes y después del arreglo D7:

  ```
  MP-NUEVA-c529a8 | profiles:AUTH_ACTIVE  | file=dc2e1b24 | 11:48:23   ← antes del arreglo (D7)
  MP-NUEVA-c529a8 | profiles:AUTH_PENDING | file=c8424411 | 12:00:38   ← con el arreglo
  ```

- **Especialidad pendiente:** Editar → select nativo (Cardiología → Pediatría) → `PATCH
  /profiles/practitioners/me/specialties/:id 204 {"specialtyConceptId":"2b675a4d-…"}`; Retirar →
  `DELETE … 204` y la fila desaparece; por API `specialties=0`.
- **Sexo al nacer y departamento emisor (ID-13):** «Guardar cambios» general → `PATCH
  /profiles/practitioners/me 200` con `{"sexAtBirth":"MALE","issuerAdministrativeAreaConceptId":"e783b585-…","acceptsNewPatients":true}`;
  por API `sexAtBirth=MALE`.

El log de esta corrida quedó local en `Alovida/verif-h1-h2/logs/h2-editor-perfil-navegador.*`
(no se incluye en el PR); las capturas `h2-editor-0{1..5}*.png` sí.

## Lo que sigue sin cubrir

- Escaneo real con clamd y respaldo del volumen (H1): fuera del alcance de una máquina de verificación.
- MFA obligatorio para roles administrativos: decisión de M2.
- Lint global del front (errores heredados).
- Alta de hospital **en navegador**: no existe pantalla (D-BR09-3); se cubrió en runtime por API.
- Alta de aseguradora **en navegador**: se cubrió en runtime con el cuerpo exacto del front; la
  pantalla `register-organization` no se recorrió con Playwright.
- `POST /iam/users/:id/devices` (misma familia que D2), no verificado.

## Cómo reproducir

1. `docker network create verif-net && docker run -d --name verif-pg --network verif-net --network-alias postgres -p 5555:5432 -e POSTGRES_DB=verif -e POSTGRES_USER=verif -e POSTGRES_PASSWORD=verif timescale/timescaledb-ha:pg18`
2. Init con `docker/db-init/init-postgres.sh` montando `database/SQL`, `database/NoSQL` y `docker/db-init` (falla en v4.2.21: D5; aplicar `v4223` a mano, arrancar la API y luego `v4221`).
3. `.env` de la API con las banderas de la tabla de arriba; `yarn build && node dist/src/main.js`.
4. Fixture `fixture-catalogos-afiliacion.sql` de H2 (D6).
5. Front: `.env` con `PUBLIC_REFRESH_COOKIE=true`; `ng serve --configuration real-api --port 4231`.
6. `node scripts/h1-api-preparacion.mjs` (deja `logs/cuentas.json`), luego desde el front `corepack yarn node ../…/scripts/<guion>.mjs`.

## PR

- API, arreglos D1 + D2 + D7: **#481** (`justin/test-fix-h1-emergencia-mfa-2026-09-26` → `test`).
- Front, arreglo D3: **#719** (`justin/test-fix-h2-matricula-pendiente-2026-09-26` → `test`).
- API, este reporte y la evidencia: `justin/test-verif-m7-h1-h2-2026-09-26` → `test`
  (`docs/progress/evidence/lane-M7-verif-h1-h2/`).
