# Plan — Cerrar los 13 pendientes del carril B con lo que ya existe

- **Fecha:** 2026-09-20 · **Persona:** Justin · **Línea:** B
- **Corte:** `4cc5ea1f` (`dev`) — incluye el PR #443 (mi noche) y el PR #444 (laboratorio de Pablo)
- **Origen:** los 13 pendientes de `docs/trabajo/2026-09-19-relacion-agenda-mensajeria/REPORTE.md`
- **Por qué ahora:** dos insumos que no existían al corte anterior (`5d5007fb`) ya están disponibles:
  1. **Artefacto versionado de Itzan** — `scheduling-module-v0.1.0-transitional`, sha256
     `6d4e53d2d0bf12f7dc166b079929e833f1233556fe2eef7ae0f325e2a47f05c8`, commit de origen
     `5d5007fb`. Manifiesto en `AlovidaPromptManager@origin/itzan/daily-noche-2026-09-19`.
  2. **Laboratorio de Pablo** — `test/lab/agenda-notice-capability.lab.ts`, ya en `dev` (`cd1889bf`).

> **Lo que este plan NO hace:** no decide Q-06 (durabilidad), no corrige HALL-03 (índice único en
> `debounce_key`, es de Itzan) y no inventa el contrato de Ender (su daily está en 0/50). Donde
> haga falta un oráculo de negocio se **mide y se registra lo observado**, sin declararlo correcto.

## H1 — Fijar por versión los dos extremos de la relación

**CA:** la relación queda anclada a versiones identificables, no a ramas.
**DoD:** `yarn test:integration --testPathPatterns=agenda-mensajeria` en verde con las fichas pegadas.

| ID | Cierra | Microtarea | CA | DoD (comando) |
|---|---|---|---|---|
| H1.S1.M1 | `H2.S1.M1` | Declarar el artefacto de Itzan como constante fijada (versión + sha256 + commit) | Referencia la versión, no la rama | `yarn test:integration --testPathPatterns=agenda-mensajeria-relacion` |
| H1.S1.M2 | `H2.S2.M1` | Ficha del doble del consumidor y del proveedor, ambas por versión | Las dos fijadas, ninguna por rama | ídem |
| H1.S1.M3 | `H2.S3.M1` | Matriz de combinaciones de versión: cada celda pasa o falla con su motivo | Cada combinación declarada | ídem |

## H2 — Acreditar el efecto en chat de verdad

**CA:** el efecto en chat deja de acreditarse con un booleano.
**DoD:** consulta a `community.conversations` y `community.conversation_participants` pegada.

| ID | Cierra | Microtarea | CA | DoD (comando) |
|---|---|---|---|---|
| H2.S1.M1 | `H3.S2.M3` | Acreditar conversación, membresía y visibilidad con filas reales | Los tres, o `NOT_RUN` con motivo | `yarn test:integration --testPathPatterns=agenda-mensajeria-persistencia` |

## H3 — Medir durabilidad, reintento y visibilidad del fallo

**CA:** se mide el comportamiento real; no se declara correcto sin Q-06.
**DoD:** salida de cada medición pegada.

| ID | Cierra | Microtarea | CA | DoD (comando) |
|---|---|---|---|---|
| H3.S1.M1 | `H4.S3.M1` | Medir si la intención queda en la MISMA transacción del negocio | Consulta pegada, resultado observado | `yarn test:integration --testPathPatterns=agenda-mensajeria-durabilidad` |
| H3.S1.M2 | `H4.S3.M2` | Reiniciar el procesamiento y medir idempotencia del reintento | Salida pegada | ídem |
| H3.S1.M3 | `H4.S3.M3` | Medir si el fallo terminal se hace visible a alguien | Evidencia; no se elimina evidencia de un efecto perdido | ídem |

## H4 — Probar que la salida real está bloqueada

**CA:** el intento de salir a un destinatario real o a red no permitida **se bloquea**.
**DoD:** salida pegada del intento bloqueado.

| ID | Cierra | Microtarea | CA | DoD (comando) |
|---|---|---|---|---|
| H4.S1.M1 | `H5.S1.M2` | Intentar una salida real y comprobar que se bloquea | Se bloquea | `yarn test:integration --testPathPatterns=agenda-mensajeria-salida-bloqueada` |

## H5 — Cerrar las etapas de regresión que faltaban

**CA:** cada etapa de la pirámide queda ejecutada o `NOT_RUN` con motivo verificado.
**DoD:** exit code por etapa.

| ID | Cierra | Microtarea | CA | DoD (comando) |
|---|---|---|---|---|
| H5.S1.M1 | `H6.S1.M1` | Dejar `lint` global en exit 0 (9 `prettier/prettier` ajenos, reformateo automático) | exit 0 | `yarn lint --max-warnings=0` |
| H5.S1.M2 | `H6.S1.M3` | E2E dirigido del piloto de avisos de agenda | Resultado pegado | `npx playwright test playwright/carril-p8-avisos-agenda.spec.ts` |
| H5.S1.M3 | `H6.S1.M4` | Smoke cross-browser: ejecutado o `NOT_RUN` con motivo | Registro | lectura de `playwright.config.ts` (un solo project) |

## H6 — Consolidar el registro de checks A + B + C

**CA:** el consolidado existe con los tres carriles, y el ausente queda declarado ausente.
**DoD:** `registro-de-checks-consolidado.json` válido + tabla de gates no aprobados.

| ID | Cierra | Microtarea | CA | DoD (comando) |
|---|---|---|---|---|
| H6.S1.M1 | `H6.S3.M1` | Registro consolidado de A (Pablo), B (mío) y C (Itzan); D (Ender) declarado ausente | Cada check con sus campos y ruta de evidencia existente | `node -e` de validación del JSON |
| H6.S1.M2 | `H6.S3.M2` | Declarar qué gates obligatorios aplicables NO aprobaron | Tabla | lectura de los tres registros |

## Estado final (2026-09-20, cierre)

**13 / 13 microtareas del pendiente original en `HECHO`.** Se calcula, no se estima.
Ver [REPORTE.md](./REPORTE.md).

| ID | Cierra | Estado | Evidencia |
|---|---|---|---|
| H1.S1.M1 | `H2.S1.M1` | `HECHO` | `evidencia/h1-fijacion-por-version.txt` |
| H1.S1.M2 | `H2.S2.M1` | `HECHO` | idem |
| H1.S1.M3 | `H2.S3.M1` | `HECHO` | idem |
| H2.S1.M1 | `H3.S2.M3` | `HECHO` | `evidencia/h5-regresion-final-integracion.txt` |
| H3.S1.M1 | `H4.S3.M1` | `HECHO` | idem (HALL-08) |
| H3.S1.M2 | `H4.S3.M2` | `HECHO` | idem |
| H3.S1.M3 | `H4.S3.M3` | `HECHO` | idem (HALL-09) |
| H4.S1.M1 | `H5.S1.M2` | `HECHO` | idem (HALL-10) |
| H5.S1.M1 | `H6.S1.M1` | `HECHO` | `evidencia/h5-etapa2-lint.txt`, exit 0 |
| H5.S1.M2 | `H6.S1.M3` | `HECHO` | `evidencia/h6-etapa5-e2e-ejecutado.txt` — 3 passed, exit 0, con datos reales |
| H5.S1.M3 | `H6.S1.M4` | `HECHO` | declaracion con motivo verificado: un solo project en `playwright.config.ts` |
| H6.S1.M1 | `H6.S3.M1` | `HECHO` | `registro-de-checks-consolidado.json` — 37 checks, 13 campos, 0 rutas rotas |
| H6.S1.M2 | `H6.S3.M2` | `HECHO` | `gates-no-aprobados.md`, generado del registro |

**Efecto en el carril B: 40/53 -> 53/53.** No queda ninguna.

> `H6.S1.M3` se cerró en una segunda vuelta de la misma jornada: la etapa 5 no necesitaba un
> cambio en `src/`, necesitaba entorno y credenciales. Para conseguirlas hubo que corregir dos
> derivas de `tools/alovida/p8-avisos-agenda.mjs` (HALL-11). Detalle en el REPORTE.

