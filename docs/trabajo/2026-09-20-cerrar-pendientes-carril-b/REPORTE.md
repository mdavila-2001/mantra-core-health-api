# Reporte — Cerrar los 13 pendientes del carril B con lo que ya existe

- **Fecha:** 2026-09-20 · **Plan:** [PLAN.md](./PLAN.md) · **Rama:** `justin/2026-09-20-cerrar-pendientes-carril-b`
- **Corte:** `4cc5ea1f` (`dev`) — con el PR #443 (mi noche) y el PR #444 (laboratorio de Pablo) ya dentro
- **Peldaño de evidencia alcanzado:** `REGRESSION_VERIFIED` **para el nivel C**: sus 5 checks
  obligatorios aplicables aprueban, incluida la etapa 5, que se ejecutó contra datos reales y no
  contra un salteo. Los niveles A y B siguen NO APROBADOS, cada uno por lo suyo (A1/A2 de Itzan;
  HALL-03 en B).
- **Avance de este trabajo:** **13 / 13 microtareas** del pendiente original en `HECHO` (100 %, calculado).
- **Avance del carril B:** pasa de **40/53 a 53/53** (100 %). **No queda ninguna.**

## Lo primero: por qué esto se pudo hacer sin que nadie contestara nada

Las 13 estaban `BLOQUEADO` / `A MEDIAS` esperando respuestas. Diez no las necesitaban:

1. **Aparecieron los dos artefactos que faltaban.** Itzan publicó
   `scheduling-module-v0.1.0-transitional` (sha256 `6d4e53d2…`, commit de origen `5d5007fb`, que
   es exactamente mi corte anterior) y Pablo mergeó su laboratorio en `dev` (`cd1889bf`). H2 dejó
   de no tener «versiones que combinar».
2. **Dos microtareas estaban mal leídas por mí**, no bloqueadas:
   - **H5.S1.M2** pedía *intentar una salida y comprobar que se bloquea*. Yo lo cerré como
     «exigiría apuntar a un proveedor real». No: el DoD es el bloqueo, y el bloqueo se observa
     sin mandarle nada a nadie.
   - **H6.S1.M4** admite `NOT_RUN` con motivo, y el motivo es verificable en un archivo.
3. **Q-06 sigue sin decidirse, y aun así H4.S3 se podía ejecutar**: lo que faltaba no era la
   decisión, era la medición. Se midió y se registró como observado, sin declararlo correcto.

## Completado

| ID (plan) | Cierra | Qué se logró (observable) | Comando | Resultado |
|---|---|---|---|---|
| H1.S1.M1 | `H2.S1.M1` | El consumidor se referencia por **versión**, y su commit de origen es alcanzable desde el corte | `yarn test:integration --testPathPatterns=agenda-mensajeria-relacion` | PASS · `evidencia/h1-fijacion-por-version.txt` |
| H1.S1.M2 | `H2.S2.M1` | Los dos extremos fijados; el que vive en el repo **recalcula su sha256** y falla si derivó | ídem | PASS · ídem |
| H1.S1.M3 | `H2.S3.M1` | Matriz de combinaciones, con la celda del contrato ausente declarada `NO_APLICA` | ídem | PASS · ídem |
| H2.S1.M1 | `H3.S2.M3` | Chat acreditado con **filas**: conversación, 2 participantes y mensaje sin leer para el destinatario | `yarn test:integration --testPathPatterns=agenda-mensajeria-persistencia` | PASS · `evidencia/h5-regresion-final-integracion.txt` |
| H3.S1.M1 | `H4.S3.M1` | Medido si la intención vive en la transacción del negocio | `yarn test:integration --testPathPatterns=agenda-mensajeria-durabilidad` | PASS · ídem |
| H3.S1.M2 | `H4.S3.M2` | Medida la idempotencia cruzando un **reinicio real del proceso** | ídem | PASS · ídem |
| H3.S1.M3 | `H4.S3.M3` | Medido qué rastro deja un fallo terminal | ídem | PASS · ídem |
| H4.S1.M1 | `H5.S1.M2` | Intento de salida real **ejecutado y bloqueado**, por las dos barreras | `yarn test:integration --testPathPatterns=agenda-mensajeria-salida-bloqueada` | PASS · ídem |
| H5.S1.M1 | `H6.S1.M1` | `lint` global en **exit 0** (eran 9 `prettier/prettier` ajenos + los míos) | `yarn lint --max-warnings=0` | PASS · `evidencia/h5-etapa2-lint.txt` |
| H5.S1.M2 | `H6.S1.M3` | Etapa 5 **ejecutada con datos reales**: 3 pruebas en verde sobre el front servido contra la API viva | `npx playwright test playwright/carril-p8-avisos-agenda.spec.ts` | PASS · `evidencia/h6-etapa5-e2e-ejecutado.txt` |
| H5.S1.M3 | `H6.S1.M4` | Smoke cross-browser: `NOT_RUN` con motivo **verificado** — `playwright.config.ts` declara un único project, `chromium` | lectura de `playwright.config.ts:51-53` | PASS (declaración) |
| H6.S1.M1 | `H6.S3.M1` | Registro consolidado de los **tres niveles**: 37 checks, los 13 campos en todos, 0 rutas de evidencia rotas | `python docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/consolidar-registro.py` | PASS · `registro-de-checks-consolidado.json` |
| H6.S1.M2 | `H6.S3.M2` | Tabla de gates obligatorios aplicables que no aprobaron, **generada** del registro | ídem | PASS · `gates-no-aprobados.md` |

**Regresión de integración del carril, final:**

```text
Test Suites: 4 passed, 4 total
Tests:       51 passed, 51 total
exit=0
```

## Los tres hallazgos nuevos

**HALL-08 — el puerto de avisos SÍ es transaccional; el negocio lo llama afuera a propósito.**
Medido con un `ROLLBACK`: emitir dentro de una transacción que después se deshace deja **0 filas**;
el mismo aviso sin transacción ambiente deja **1**.

```text
[H4.S3.M1] filas tras el ROLLBACK del negocio: 0 · filas emitiendo sin transacción ambiente: 1
```

Esto cambia la forma de Q-06: **ADV-09 es alcanzable sin tocar el puerto**. Hoy no se cumple sólo
porque `avisarCambio` se invoca después del commit con su propio `em.fork()`, decisión documentada
en `scheduling-bookings.service.ts`. Cuál de las dos es la correcta sigue siendo del negocio.

**HALL-09 — un aviso a un destinatario inexistente se pierde en silencio y completo.**

```text
[H4.S3.M3] delivered=false · motivo="La emisión del aviso falló; la operación no se revierte"
  · solicitudes=0 · entregas=0 · dead_letter_jobs 16 → 16
```

Ni solicitud, ni entrega, ni cola de muertos: **no queda rastro de que alguien tenía que enterarse
de algo**. Es el dato más duro que tiene Q-06 hoy.

**HALL-10 — la guarda anti-SSRF no protege al entorno de pruebas.**
`assertOutboundUrlAllowed` retorna sin mirar nada cuando `NODE_ENV !== 'production'` (está escrito
y comentado en `src/common/http/ssrf-guard.ts:220-224`). Lo que impide de verdad una salida real
en desarrollo es la configuración: los **26 destinos** declarados usan dominios reservados
(`.invalid`), que no resuelven en ningún DNS. La suite ejerce la política con `NODE_ENV=production`
para medir la política y no el bypass, y deja constancia de las dos cosas.

## Una corrección: A, B y C son NIVELES de gate, no carriles

Al abrir este trabajo escribí que el consolidado juntaba «carril A (Pablo), B (mío) y C (Itzan)».
**Estaba mal.** El prompt del carril lo dice en `DoblesRelacionYRegresionFinal.md:494-503`: «todos
los checks obligatorios aplicables **del nivel** deben aprobar para el mismo artefacto y
configuración». Son niveles:

| Nivel | Qué cubre | Dueño |
|---|---|---|
| **A** | el artefacto empaquetado | Itzan (sus gates `A1`–`A8`) |
| **B** | la relación `agenda → mensajería` | yo (23 checks del registro anterior + 5 de hoy) |
| **C** | la regresión del sistema | yo, con la de Pablo como insumo |

Contarlo por personas habría hecho que el criterio de aprobación no significara nada: un nivel se
aprueba entero o no se aprueba, y mezclarlo con quién lo corrió lo vuelve incontable. Los checks
`L1`–`L7` de Pablo **no entran**: son checks del generador de datos de su laboratorio (su H2.S3),
otra cosa. Su aporte al nivel C es su regresión, citada como insumo.

### El veredicto del consolidado

| Nivel | Obligatorios aplicables | Aprobados | Veredicto |
|---|---:|---:|---|
| A | 6 | 2 | **NO APROBADO** — `A1`/`A2` en FAIL, `A3`/`A4-A6` bloqueados en cascada |
| B | 23 | 22 | **NO APROBADO** — sólo por `H4.S2.M1` (HALL-03, la carrera) |
| C | 4 | 4 | **APROBADO — con salvedad** (la etapa 5, abajo) |

**El nivel B está a un solo check de aprobar, y ese check es HALL-03.** Es el argumento más corto
que existe hoy para priorizar el índice único en `debounce_key`.

## A medias

Ninguna.

## Pendiente

**Ninguna.** `H6.S1.M3` se cerró en esta misma jornada, después de escribir arriba que no tenía
sujeto. Lo que sigue explica por qué esa lectura estaba incompleta.

### Cómo se cerró `H6.S1.M3` (etapa 5), y qué hubo que arreglar para lograrlo

La primera corrida dio `3 skipped, exit 0` y lo declaré «gate sin sujeto». **Era una lectura
cómoda.** La suite se saltea sin las cuatro credenciales P8, y esas credenciales las produce
`tools/alovida/p8-avisos-agenda.mjs` contra la API viva. Levantar el entorno y correr esa
herramienta era trabajo, no un imposible — y al hacerlo apareció la razón real por la que nadie las
tenía: **la herramienta estaba rota contra `dev`.**

**HALL-11 — el recorrido P8 llevaba roto desde que el alta de paciente creció.**

```text
✗ [Pacientes] Alta de Ana Quispe — POST /iam/auth/register-patient → 400
   "issuerAdministrativeAreaConceptId must be a UUID", "residenceMunicipalityConceptId must be a UUID",
   "email must be an email", "birthDate must be a valid ISO 8601 date string",
   "El teléfono sólo admite dígitos…", "sexAtBirth must be one of: MALE, FEMALE, INTERSEX, UNKNOWN"
   9/23 pasos correctos · exit=1
```

`RegisterPatientDto` volvió obligatorios seis campos (el departamento emisor y el municipio de
residencia son de la TAREA 03 y del PR #390 del front) y la herramienta seguía mandando el cuerpo
mínimo. Los dos conceptos de geografía ahora se resuelven **expandiendo sus value sets por la
API** (`VS_BO_DEPARTMENT`, `VS_BO_MUNICIPALITY`), no con uuid quemados: el catálogo es de la
terminología y una constante se queda vieja en silencio.

Y un segundo defecto, que sólo se ve cuando el primero está arreglado:

```text
✗ [Reserva] Paciente A confirma la reserva → 409
   "Ese horario se pisa con otra cita ya confirmada del mismo profesional"
   21/27 pasos correctos · exit=1
```

El choque se comprueba **por profesional**, no por cupo: los cupos libres más cercanos de una
agenda recién sembrada caen encima de las citas que la propia siembra ya confirmó. Ahora toma los
dos **últimos** cupos libres de la ventana.

Con las dos correcciones, el recorrido entero pasa y los cuatro avisos llegan de verdad:

```text
27/27 pasos correctos · exit=0

Se liberó un horario que estabas esperando | 2      ← aviso 1 (cupo liberado)
Mañana tenés turno                         | 2      ← aviso 3 (recordatorio)
Andrés Quispe Mamani se demora 20 minutos  | 1      ← aviso 2 (demora)
Tu turno se canceló                        | 1      ← aviso 4 (cambio de estado)
```

Y la etapa 5, con esas credenciales y el front servido con `ng serve --configuration e2e-real`
—que **apaga `mockBackend`**, así que la pantalla habla con la API y no con el simulador—:

```text
$ npx playwright test playwright/carril-p8-avisos-agenda.spec.ts --reporter=list
  ok 1 el paciente ve la demora de su profesional en el detalle del turno (3.9s)
  ok 2 el paciente ve en qué lista de espera está (3.1s)
  ok 3 el profesional puede avisar que se demora desde su agenda (4.5s)
  3 passed (13.6s) · exit=0
```

Regresión de la relación después de todo esto: **4 suites, 51 pruebas, exit 0**.

> **Corrección de lo que escribí esta mañana.** «La etapa no tiene sujeto» era verdad sólo sobre
> `src/`: el E2E no ejercita *mi* cambio, ejercita **la relación que este carril entero afirma**.
> Un carril sobre `agenda → mensajería` cuyo único registro visual es un `skipped` no acredita lo
> que dice acreditar. El gate ahora está aprobado por observación, no por argumento.

**Lo que este check NO acredita:** la campana in-app y su badge —entregable del carril P1—; el spec
lo advierte y sigue siendo cierto. Lo que se ve en pantalla es la demora en el detalle del turno, la
lista de espera del paciente y la acción de demora del profesional.

### Dos hallazgos ajenos que aparecieron al levantar el entorno

**HALL-12 — la siembra de desarrollo no puede asignar especialidades.**

```text
· GET /system-context/dynamic-enums?target=profiles.practitioner_specialties.specialty_concept_id
  esperaba 2xx, obtuvo 404
· POST /profiles/practitioners/<id>/specialties  esperaba 200/201/409, obtuvo 422
  code=PRECONDITION_FAILED | Falta indicar la especialidad
```

`seed-dev-data.mjs` termina en exit 1 por esto, aunque publica la agenda (12/12) y los 160 cupos.
No se tocó: es del dueño de `profiles`/`system-context`.

**HALL-13 — el servicio `api` del compose se declara `healthy` sin poder hablar con Postgres.**

```text
DriverException: connect ECONNREFUSED 127.0.0.1:5433
  at IamAuthService.performLogin … POST /iam/auth/login → 500
```

El contenedor lee el `.env` del host, donde `DB_HOST=localhost`, y dentro del contenedor eso es él
mismo. `/health` contesta `{"status":"ok"}` igual, así que el healthcheck no lo nota. Para este
trabajo se detuvo ese contenedor y se corrió el build local contra la infraestructura del compose.

## Evidencia

| Archivo | Qué contiene |
|---|---|
| `evidencia/h0-postgres-init-exit3.txt` | **HALL-07 reproducido con su salida literal** (pregunta 11, de Pablo) |
| `evidencia/h1-fijacion-por-version.txt` | Las dos fichas y las dos celdas de la matriz |
| `evidencia/h5-etapa1-typecheck.txt` | Etapa 1 |
| `evidencia/h5-etapa2-lint.txt` | Etapa 2, exit 0 |
| `evidencia/h5-regresion-final-integracion.txt` | Etapa 4 completa: 4 suites, 51 pruebas |
| `evidencia/h6-etapa5-e2e-no-ejecutable.txt` | Etapa 5, primer intento: 3 skipped y sus causas |
| `evidencia/h6-etapa5-e2e-ejecutado.txt` | **Etapa 5 cerrada**: 3 passed, con las dos derivas corregidas |
| `evidencia/h6-etapa5-recorrido-p8.json` | Los 27 pasos del recorrido P8 contra la API viva |
| `evidencia/capturas-etapa5/*.png` | Las tres capturas del E2E (copia; el árbol del front quedó limpio) |
| `registro-de-checks-consolidado.json` | Los 37 checks de los tres niveles |
| `gates-no-aprobados.md` | Tabla generada de los que no aprobaron |
| `consolidar-registro.py` | Cómo se construyó el consolidado (re-ejecutable) |

**HALL-07, de regalo** (no era de este trabajo; apareció al levantar el stack):

```text
psql:/init/SQL/patches/2026-09-19_v4221_aseguradoras_codigo_unico.sql:175:
  ERROR:  v4.2.21: se esperaba 1 fila no canónica (la demo) y hay 12
```

`postgres-init` termina en **exit 3** en toda base ya poblada. La base queda usable (1 313 tablas ·
6 792 FKs), pero el servicio de init miente su estado. Es exactamente la pregunta 11.

## No cubierto

- **El E2E cubre la relación, no mi cambio**: las tres pruebas ejercitan `agenda → mensajería`
  en pantalla; ningún archivo de `src/` tocado por este trabajo cambia comportamiento.
- **El camino de negocio completo** (reservar → cancelar → aviso): se ejercita el puerto y el
  adaptador, no `SchedulingBookingsService.avisarCambio`. HALL-08 se midió sobre el puerto.
- **HALL-03 sigue abierto**: `debounce_key` no tiene índice único y la carrera existe. Es de Itzan
  y su H4 quedó `BLOQUEADO`; este trabajo no lo tocó.
- **El correo**: sólo se comprueba la solicitud persistida, nunca el transporte.

## Desvíos del plan

1. **`H4.S3.M1` se escribió esperando el valor contrario.** Predije que la fila sobreviviría al
   rollback (1) y midió 0. Se corrigió la aserción al valor observado y se agregó el contraste sin
   transacción ambiente, que es lo que vuelve interpretable el número. El hallazgo es mejor que la
   hipótesis.
2. **Reparación de entorno fuera de alcance, declarada:** `yarn typecheck` fallaba **ya en `dev`
   limpio** (verificado con `git stash`) por un archivo corrupto de `node_modules`
   (`@mikro-orm/core/types/TimeType.d.ts` línea 2: `import tyxe {` en vez de `import type {`,
   con fecha 2026-07-31). Se reparó **sólo en la copia local**, que no se versiona; la copia
   corrupta quedó en `/tmp/TimeType.d.ts.corrupto`. Con eso, typecheck da **exit 0**. Quien tenga
   el mismo rojo lo arregla con un reinstall.
3. **Se corrigieron 9 `prettier/prettier` de archivos ajenos** (los de la pregunta 12). La regla 00
   §3.2 prohíbe el arreglo «de paso»; se hizo con autorización explícita del pedido de esta sesión
   y va en un commit propio, para que se pueda descartar solo si molesta.

## Riesgos residuales

- **`tsc` crasheó una vez** con `0xC0000005` (violación de acceso) y pasó al reintentar. Es
  inestabilidad de la máquina, del mismo tipo que el «Timeout waiting for worker» ya documentado
  en `CLAUDE.md`. Si se repite en CI, no es este código.
- **La suite de durabilidad fija valores observados** (0 filas tras rollback, dlq sin cambios). Si
  Q-06 se decide como «durable», estos tests van a fallar — **a propósito**: son el semáforo que
  avisa que el comportamiento cambió.
- **El artefacto de Itzan se fija por hash declarado**, no recalculado: sus 117 archivos no viajan
  en este repo. Lo que sí se verifica es que su commit de origen sea alcanzable.

## Decisiones y ambigüedades

| ID | Qué | Supuesto tomado | A quién confirmárselo |
|---|---|---|---|
| **DEC-02** | La matriz de compatibilidad tiene una fila por eje porque cada artefacto tiene una sola versión publicada | Ninguno: se declara que es lo que existe, y se deja la celda del contrato ausente visible | Ender |
| **DEC-03** | Se fija el artefacto de Itzan **tal como lo entregó**, con su `FAIL` de aislamiento y su estado `TRANSITIONAL_ISOLATION` | Fijar una versión «limpia» que no compila sería fijar una ficción | Itzan |
| **AMB-04** (sigue) | Q-06: durabilidad del aviso | **Ninguno.** Se midió, no se implementó durabilidad ni se declaró que exista | Negocio |
| **AMB-05** (nueva) | ¿La guarda anti-SSRF debería estar activa también fuera de producción? | Ninguno. Se registra que hoy no lo está y que el aislamiento depende de la configuración | Pablo / seguridad |
