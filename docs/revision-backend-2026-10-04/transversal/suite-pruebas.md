# Revisión transversal: suite de pruebas

- Fecha: 2026-10-05. Base: `origin/dev` `02af1e09`.
- Alcance leído: configuración Jest de `package.json` y `test/jest-*.json`; `test/integration/harness.ts` (arranque y reset), `test/smoke/smoke.int-spec.ts` (arranque y evaluador), `test/smoke/smoke-kit.ts`, `test/smoke/registry.ts`, `test/app.e2e-spec.ts`, `test/integration/practitioner-signature-registration.int-spec.ts`, README de pruebas y código relacionado con el registro profesional y el filtro HTTP.
- Cobertura no realizada: no se leyeron los 803 specs unitarios ni los 121 specs de integración completos; no se ejecutaron integración, smoke ni e2e porque dependen de almacenes externos y el smoke borra datos. Este documento **no** certifica la suite ni la cobertura funcional de los módulos.

## 1. Resumen ejecutivo

Hallazgos confirmados: **1 crítico**, **0 altos**, **2 medios**. Un riesgo de pérdida de datos está en el arnés del smoke; las otras dos brechas son de calidad de aserciones y alcance e2e. Se verificó cada observación contra el código vecino, sus README y las configuraciones Jest. `corepack yarn test --listTests --runInBand` enumera 803 archivos, `test:integration` 121, `smoke` 1 orquestador y `test:e2e` 1 archivo. Esos comandos sólo enumeran; no pasan las pruebas.

## 2. Mapa de la unidad

| Capa | Entrada | Selección y comportamiento comprobado |
|---|---|---|
| Unitaria | `corepack yarn test` | `package.json:250-295`: `src/**/*.spec.ts`, máximo 2 workers, umbral global de cobertura 74/69/59/75 si se usa `--coverage`. |
| Integración | `corepack yarn test:integration` | `test/jest-integration.json`: `test/integration/**/*.int-spec.ts`, 1 worker, timeout 180 s; `harness.ts` levanta `AppModule` y usa almacenes configurados. |
| Smoke | `corepack yarn smoke` | `test/jest-smoke.json`: un `smoke.int-spec.ts`; ejecuta batería base y `ALL_SMOKE` de `registry.ts` contra la app y DB reales. La opción `reset: true` borra tablas de negocio. |
| E2E | `corepack yarn test:e2e` | `test/jest-e2e.json`: sólo `test/app.e2e-spec.ts`, prueba el saludo raíz. |

El arnés integra PostgreSQL y, según el spec, otros almacenes; no se ejecutó contra ningún servidor. Los casos de integración opt-in documentados en `test/integration/README.md` conservan prerrequisitos explícitos, por lo que sus `describe.skip` condicionales no se clasifican aquí como fallos. La batería smoke tiene `expectedStatus` obligatorio y `expectedCode` opcional (`test/smoke/smoke-kit.ts:79-83`); no modela `reason` esperado. El contrato HTTP actual emite `code`, `message`, `correlationId`, `details`, `timestamp` y `path` (`src/common/filters/all-exceptions.filter.ts:164-171`); `reason` sólo podría viajar dentro de `details` si el lanzador lo aporta.

## 3. Hallazgos verificados y plan de corrección

### SP-01 — Crítico: el reset del smoke admite una base no descartable

- **Evidencia:** `test/smoke/smoke.int-spec.ts:104-114` llama a `bootstrapTestApp({ reset: true })`. `test/integration/harness.ts:180-183` invoca `resetBusinessData()` sin otra condición. `test/integration/harness.ts:54-84` toma `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` del entorno y ejecuta `TRUNCATE ${list} RESTART IDENTITY CASCADE` sobre **todas** las tablas de esquemas de negocio. No hay comprobación del nombre de base, host ni bandera de autorización para destrucción en ese tramo. `test/smoke/README.md:27-34` reconoce que la base queda vacía.
- **Impacto/escenario:** si un operador ejecuta `yarn smoke` con credenciales que apunten a una base compartida, se pierden los datos de sus esquemas de negocio. Es un riesgo demostrado por el camino de código; no hay evidencia de que ya haya sucedido.
- **Refutación intentada:** se revisaron la llamada, el cuerpo completo de `resetBusinessData`, `bootstrapTestApp` y el README. El comentario «sólo debe usarse contra la base de pruebas» es instrucción humana, no guard de ejecución. Los defaults locales tampoco prueban aislamiento. El CI configura una DB local, pero no protege la ejecución manual.
- **Corrección, en orden:** (1) añadir un preflight antes de `client.connect` que exija una bandera opt-in y una identidad de base descartable comprobada mediante consulta de identidad del servidor; (2) rechazar hosts/DB no permitidos sin enviar SQL; (3) usar una base temporal dedicada por corrida, con limpieza segura; (4) documentar que el smoke es destructivo y la condición verificable para correrlo. Afecta `test/integration/harness.ts`, `test/smoke/README.md` y scripts/CI que lo invocan. Sin DDL. Riesgo: bloquear entornos de CI actuales hasta darles una DB de prueba inequívoca. Esfuerzo M, **Ola 0**.

### SP-02 — Medio: los casos de error del smoke pueden aprobar sin `code` ni `reason`

- **Evidencia:** `test/smoke/smoke-kit.ts:81-83` define `expectedCode?` y no `expectedReason`. `test/smoke/smoke.int-spec.ts:158-161,217-218` calcula `pass` como status más código sólo si éste fue declarado. El caso sin autenticación de `POST /iam/users` en `test/smoke/smoke.int-spec.ts:289-299` pide únicamente 401; el caso de body inválido en `300-310` pide sólo 400. La búsqueda en la unidad no encontró `expectedReason` ni aserción de `details.reason`.
- **Impacto/escenario:** el filtro podría devolver una respuesta genérica o un reason equivocado, y el caso seguiría verde si el status coincide. Esto incumple el criterio de cuatro puntos del plan de revisión, sin demostrar por sí mismo que el endpoint falle hoy.
- **Refutación intentada:** la batería sí verifica el código de ciertos casos, por ejemplo conflicto duplicado en `321-323`; por eso el hallazgo se limita a los casos donde el campo opcional se omite y a la ausencia total de reason. `src/common/filters/all-exceptions.filter.ts:164-171` confirma la forma de respuesta actual.
- **Corrección, en orden:** (1) definir expectativa obligatoria de `code` y `details.reason` en todo `SmokeCase` negativo; (2) actualizar `runCase` y `runRegistryCase` para comparar ambos y registrar el resultado sin contenido clínico; (3) migrar los casos negativos, empezando por IAM; (4) hacer que el CI falle si un caso 4xx/5xx carece de catálogo y prueba. Para errores de validación genéricos, catalogar antes de escribir una razón esperada. Sin DDL. Riesgo: los casos antiguos pueden revelar fallas reales al endurecer la aserción. Esfuerzo L, **Ola 1**.

### SP-03 — Medio: el comando e2e actual sólo cubre el saludo raíz

- **Evidencia:** `test/jest-e2e.json:4` selecciona `*.e2e-spec.ts`; `corepack yarn test:e2e --listTests --runInBand` enumeró sólo `test/app.e2e-spec.ts`. Su único `it` (`19-24`) hace `GET /` y espera `Hello World!`. Ese endpoint existe (`src/app.controller.ts:30-35` y `src/app.service.ts:13`). No prueba acceso clínico, estado persistido ni un error catalogado.
- **Impacto/escenario:** anunciar `test:e2e` verde puede sugerir cobertura funcional inexistente. La integración y el smoke sí ejercitan más rutas, pero no llenan este gate e2e.
- **Refutación intentada:** se enumeraron además integración y smoke; se reconocen como pruebas reales de otras capas, así que el hallazgo es sobre el alcance del comando e2e, no sobre ausencia absoluta de pruebas HTTP.
- **Corrección, en orden:** (1) documentar el gate e2e actual como prueba de arranque; (2) elegir un recorrido crítico por actor y persistencia; (3) añadir casos permitido, límite, error y falla catalogada con aserción de status, code y reason; (4) añadirlo al CI con base descartable. Sin DDL. Esfuerzo L, **Ola 2**.

## 4. Plan de cuatro pruebas por hallazgo

| Hallazgo | Punto | Tipo y spec propuesto | Preparación, entrada exacta, esperado |
|---|---|---|---|
| SP-01 | Correcto | integración `test/integration/harness-reset.int-spec.ts` | DB temporal con marcador opt-in; `bootstrapTestApp({reset:true})`; termina y deja seeds de prueba. |
| SP-01 | Límite | integración mismo spec | DB temporal sin tablas de negocio; reset hace cero `TRUNCATE` y arranca. |
| SP-01 | Error | unit mismo spec | `DB_NAME` de base no autorizada; preflight rechaza **antes** de `client.connect` y no ejecuta SQL. |
| SP-01 | Falla catalogada | unit mismo spec | Sin marcador de aislamiento; rechazo estable con `reason=TEST_DB_NOT_ISOLATED` **propuesto**. No hay HttpStatus/ErrorCode HTTP porque el arnés no es endpoint; el error es de proceso y debe conservar causa estructurada sin tocar la DB. |
| SP-02 | Correcto | unit `test/smoke/smoke-contract.spec.ts` | Respuesta 201 con payload esperado; caso pasa. |
| SP-02 | Límite | unit mismo spec | Respuesta 400 con `code=VALIDATION_FAILED` y `details.reason` catalogado; caso negativo pasa sólo con ambos. |
| SP-02 | Error | unit mismo spec | Misma respuesta 400 con `code` incorrecto; caso falla. |
| SP-02 | Falla catalogada | unit mismo spec | Respuesta `HttpStatus.BAD_REQUEST`, `ErrorCode.VALIDATION_FAILED`, `details.reason=<razón de validación definida por catálogo>`; reason ausente o distinto falla. El valor concreto depende del catálogo que diseñe el transversal de errores; no se inventa aquí. |
| SP-03 | Correcto | e2e `test/patient-account.e2e-spec.ts` | Paciente sintético autenticado; lectura propia 200 y persistencia observada. |
| SP-03 | Límite | e2e mismo spec | ID ajeno en ruta permitida por contrato; respuesta sin datos ajenos, status definido por módulo. |
| SP-03 | Error | e2e mismo spec | Token ausente; 401 sin información clínica. |
| SP-03 | Falla catalogada | e2e mismo spec | Token ausente; `HttpStatus.UNAUTHORIZED`, `ErrorCode.UNAUTHENTICATED`; `details.reason` exacto a definir en catálogo IAM y luego afirmar. No se afirma un reason inexistente. |

## 5. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| Reset del arnés | DB aislada se reinicia | DB vacía | DB fuera de allowlist se rechaza | `TEST_DB_NOT_ISOLATED` propuesto, local al proceso |
| Evaluador smoke (`runCase`, `runRegistryCase`) | status 2xx + payload | 4xx esperado | status/code erróneo falla | 4xx/5xx requiere status+code+reason exactos |
| `GET /` e2e actual | 200 `Hello World!` | No cubierto | No cubierto | No cubierto |
| `POST /iam/users` smoke muestreado | 201 con admin | 400 body inválido | 401 sin token | 409 `CONFLICT` se comprueba por status/code, reason no cubierto |

No se construyó una matriz de los demás endpoints: requiere leer sus controladores y casos de prueba completos, trabajo de los informes de módulo.

## 6. Catálogo de errores

El arnés necesita el identificador de proceso propuesto `TEST_DB_NOT_ISOLATED`; no debe exponerse como error HTTP ni reutilizar `ErrorCode` de negocio. Para las rutas HTTP de smoke faltan expectativas de `details.reason`; no se propone una lista de razones sin revisar cada módulo. En la forma de respuesta inspeccionada, `reason` no es un campo superior del filtro; las pruebas deberán precisar su ubicación contractual antes de agregarse.

## 7. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo | Dependencia |
|---|---|---|---|
| 0 | SP-01 | M | DB descartable y preflight seguro antes de volver a ejecutar smoke |
| 1 | SP-02 | L | Catálogo de reasons y contrato HTTP estabilizados |
| 2 | SP-03 | L | Fixtures aislados y un recorrido crítico elegido |

## 8. Trabajo pendiente de integrar y límites

La tabla del plan de origen menciona commits locales de otro equipo (`fa74b78c`, `2372d42a`, `6a362e8e`, `b74203f3`, `55339f05`) que no se verificaron en esta rama. En particular, `fa74b78c` podría cambiar el contrato de `reason`; contrastar SP-02 cuando llegue a `dev`. No se realizó ninguna ejecución destructiva ni prueba de integración real.

## 9. Evidencia de verificación adversarial

```text
corepack yarn test --listTests --runInBand                 → exit 0, 803 archivos
corepack yarn test:integration --listTests --runInBand     → exit 0, 121 archivos
corepack yarn smoke --listTests --runInBand                → exit 0, 1 archivo
corepack yarn test:e2e --listTests --runInBand             → exit 0, 1 archivo
```

Las cuatro órdenes son sólo de enumeración. El reset destructivo está probado estáticamente por la cadena de llamadas citada; no se ejecutó para evitar pérdida de datos.
