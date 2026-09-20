# Reporte — Cerrar los 13 pendientes del carril B con lo que ya existe

- **Fecha:** 2026-09-20 · **Plan:** [PLAN.md](./PLAN.md) · **Rama:** `justin/2026-09-20-cerrar-pendientes-carril-b`
- **Corte:** `4cc5ea1f` (`dev`) — con el PR #443 (mi noche) y el PR #444 (laboratorio de Pablo) ya dentro
- **Peldaño de evidencia alcanzado:** `VERIFIED` para las cuatro suites del carril (camino real
  contra Postgres, salida pegada). **No** `REGRESSION_VERIFIED`: el E2E del front no se ejecutó.
- **Avance de este trabajo:** **10 / 13 microtareas** del pendiente original en `HECHO` (77 %, calculado).
- **Avance del carril B:** pasa de **40/53 a 50/53** (94 %).

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
| H5.S1.M3 | `H6.S1.M4` | Smoke cross-browser: `NOT_RUN` con motivo **verificado** — `playwright.config.ts` declara un único project, `chromium` | lectura de `playwright.config.ts:51-53` | PASS (declaración) |

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

## A medias

### H6.S3.M1 / H6.S3.M2 — consolidado de los checks A, B y C
- **Qué anda:** los tres registros de origen ya existen y están localizados: **A** (Pablo,
  `AlovidaPromptManager@origin/main`, 40/53 + `CORTE-2026-09-19.md` y su carpeta `evidencia/`),
  **B** (el mío, `registro-de-checks.json` del trabajo anterior) y **C** (Itzan,
  `origin/itzan/daily-noche-2026-09-19`, 26/52 + `MANIFEST-artefacto-h3.md` y 13 archivos).
- **Qué no anda:** no existe el archivo consolidado con los 13 campos por check.
- **Qué falta exactamente:** leer los tres registros y fundirlos en un
  `registro-de-checks-consolidado.json`, declarando a **Ender ausente** (su daily está en 0/50).
  Es trabajo de datos, no de investigación: las tres fuentes están identificadas arriba.
- **Dónde quedó:** sin empezar. No bloquea nada del producto.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| `H6.S1.M3` (E2E dirigido) | `NOT_RUN` | El spec existe y es el correcto (`playwright/carril-p8-avisos-agenda.spec.ts`, repo del front), pero **el árbol del front tiene 352 archivos con cambios en el índice sin commitear**, incluidos borrados de specs. Correr E2E ahí mediría un árbol que nadie revisó. Destraba: que se resuelva ese estado, o correrlo sobre un checkout limpio. |
| `H6.S3.M1` · `H6.S3.M2` | `A MEDIAS` | Ver arriba: sólo falta fundir tres archivos que ya existen. |

## Evidencia

| Archivo | Qué contiene |
|---|---|
| `evidencia/h0-postgres-init-exit3.txt` | **HALL-07 reproducido con su salida literal** (pregunta 11, de Pablo) |
| `evidencia/h1-fijacion-por-version.txt` | Las dos fichas y las dos celdas de la matriz |
| `evidencia/h5-etapa1-typecheck.txt` | Etapa 1 |
| `evidencia/h5-etapa2-lint.txt` | Etapa 2, exit 0 |
| `evidencia/h5-regresion-final-integracion.txt` | Etapa 4 completa: 4 suites, 51 pruebas |

**HALL-07, de regalo** (no era de este trabajo; apareció al levantar el stack):

```text
psql:/init/SQL/patches/2026-09-19_v4221_aseguradoras_codigo_unico.sql:175:
  ERROR:  v4.2.21: se esperaba 1 fila no canónica (la demo) y hay 12
```

`postgres-init` termina en **exit 3** en toda base ya poblada. La base queda usable (1 313 tablas ·
6 792 FKs), pero el servicio de init miente su estado. Es exactamente la pregunta 11.

## No cubierto

- **El E2E y la prueba visual del front**: nada de este trabajo se ejercitó desde la interfaz.
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
