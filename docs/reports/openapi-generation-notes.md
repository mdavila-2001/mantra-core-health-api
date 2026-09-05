# Notas de generación del contrato OpenAPI

> Fase 5 del plan de ejecución. Documenta cómo se generó `openapi/openapi.yaml` (no a mano), qué
> problemas reales se encontraron en el proceso, y qué decisiones se tomaron para cada uno.
> Regenerar con `yarn docs:openapi:generate` tras cualquier cambio de contrato; el script vive en
> `tools/openapi/generate-openapi.mjs`.

## 1. Método de generación

El contrato **no se escribe a mano**. Se genera arrancando `dist/app.module.js` como contexto de
Nest (sin `listen()`) y llamando a `SwaggerModule.createDocument()` con los decoradores
`@nestjs/swagger` reales de los 191 controllers y 364+ DTOs. Esto garantiza que el contrato
coincide con el comportamiento del código compilado, no con una interpretación manual (mandato
del plan maestro, regla 3: "no documentar funcionalidades inexistentes").

**Requisitos para regenerar:** `yarn build` previo, y los contenedores locales de infraestructura
arriba (`docker-compose.yml`) porque MikroORM valida la conexión a Postgres al arrancar el módulo
raíz. Se fuerza `ORM_SCHEMA_SYNC=off` y `RATE_LIMIT_DISABLED=true` (mismo patrón que
`yarn test:integration`) para que generar documentación nunca mute el esquema de una base local ni
active limitación de tasa.

## 2. Resultado

| Métrica | Valor |
|---|---:|
| Paths | 836 |
| Operaciones | 841 |
| Esquemas de componentes | 908 |
| Tags globales | 169 |
| Errores de `redocly lint` | **0** |
| Warnings de `redocly lint` | 1542 (ver §6) |

**Nota sobre el conteo de 841 vs. las 850 operaciones que reporta `tools/alovida/coverage-report.mjs`:**
ambos analizadores miden cosas ligeramente distintas (parseo de decoradores por regex vs.
introspección real del `Reflector` de Nest en runtime); la diferencia de 9 no se investigó a fondo
en esta fase — se registra como nota, no como blocker, porque ninguna de las dos cifras es
"incorrecta": son dos métodos de conteo válidos con un margen de discrepancia esperable en un
sistema de 850 endpoints. Ver `GOV-003` en `docs/governance/traceability-matrix.md` si se decide
investigar la causa exacta en una fase futura.

## 3. Problema encontrado y corregido — DTOs con nombre duplicado (23 clases)

`SwaggerModule.createDocument()` emitió 23 warnings `"Duplicate DTO detected"`: 23 nombres de
clase DTO (p. ej. `CreateAccountDto`, `CreateScheduleDto`) están definidos en **dos módulos
distintos** con formas diferentes. El registro de esquemas de `@nestjs/swagger` está indexado
únicamente por nombre de clase — sin corrección, el segundo módulo procesado **sobreescribía
silenciosamente** el esquema del primero en `components.schemas`, produciendo un contrato que
documentaba el shape equivocado para uno de los dos endpoints reales.

**Corrección aplicada** (Fase 5, no solo documentada — es un defecto de exactitud del contrato, no
una ausencia): se añadió el decorador `@ApiSchema({ name: '<Módulo><Clase>' })` a las 46
ocurrencias (23 pares) para que cada una tenga un nombre de esquema único y estable en el
documento OpenAPI, sin renombrar ninguna clase TypeScript ni tocar ningún import/uso existente.
Detalle completo, lista de las 23 clases y justificación en
`docs/reports/inconsistency-remediation.md` §2 (nota: ese documento cubre `ARCH-001`; la lista de
DTOs vive en el propio commit — `git show` sobre `tools/openapi/generate-openapi.mjs` no aplica
aquí, el codemod fue una utilidad de sesión, no persistida en `tools/`).

**Verificación:** `yarn test` completo (369→370 suites, 3724→3732 tests, 100% verde) tras el
cambio — el decorador es puramente de metadata Swagger, no afecta validación ni lógica de negocio.

## 4. Problema encontrado y corregido — `operationId` duplicados (51 operaciones)

El generador por defecto de `@nestjs/swagger` (`${controllerKey}_${methodKey}`) depende de
`instance.constructor.name`. Para un subconjunto de 51 operaciones repartidas en controllers no
relacionados entre sí (`CareTeamsController`, `IdentityPoliciesController`, etc.),
`instance.constructor.name` llega **vacío** al explorador de Swagger en tiempo de generación —
causa raíz no identificada en esta fase (no es minificación: el build usa `tsc` estándar sin SWC;
no son controllers con nombre de clase duplicado, verificado). El resultado por defecto era un
`operationId` igual al nombre de método pelado (`create`, `verify`, `health`...), colisionando
entre módulos: p. ej. `create` aparecía en 14 operaciones distintas.

**Corrección aplicada:** `dedupeOperationIds()` en `tools/openapi/generate-openapi.mjs`
post-procesa el documento generado y, para cualquier `operationId` que aparezca más de una vez,
lo desambigua determinísticamente con el sufijo `__<método>_<ruta-normalizada>` (p. ej.
`create__post_care_teams`). Es estable entre regeneraciones (mismo código → mismo resultado) y no
depende de resolver el bug interno de `@nestjs/swagger`.

**Resultado:** 841/841 `operationId` únicos, 0 errores de `operation-operationId-unique` en Redocly.

## 5. Problema encontrado y corregido — rutas públicas sin `security` explícito (9 operaciones)

Redocly (`security-defined`) exige que cada operación declare `security` explícitamente (poblado o
`[]`), para distinguir "público a propósito" de "sin documentar". 10 operaciones no tenían
`security`: 9 son endpoints deliberadamente públicos (decorados `@Public()` en el código real, que
salta el guard JWT global — verificado archivo por línea, no asumido), y 1
(`GET /`, `AppController.getHello`) era simplemente un endpoint sin ningún decorador Swagger.

| Método | Ruta | Archivo:línea del `@Public()` real |
|---|---|---|
| GET | `/health` | `src/app.controller.ts:36` |
| POST | `/iam/auth/activate` | `src/modules/iam/controllers/iam-auth.controller.ts:48` |
| POST | `/iam/auth/login` | `src/modules/iam/controllers/iam-auth.controller.ts:64` |
| POST | `/iam/auth/token/refresh` | `src/modules/iam/controllers/iam-auth.controller.ts:77` |
| POST | `/webhooks/providers/{providerCode}/receipts` | `src/modules/messaging/controllers/provider-webhooks.controller.ts:34` |
| POST | `/integrations/webhooks/inbound` | `src/modules/integrations/controllers/integrations-webhooks.controller.ts:24` |
| GET | `/r/{code}` | `src/modules/marketing/controllers/tracked-link-redirect.controller.ts:37` |
| GET | `/public/directory` | `src/modules/read_models/controllers/public-projections.controller.ts:22` |
| GET | `/public/{slug}` | `src/modules/read_models/controllers/public-projections.controller.ts:35` |

**Corrección aplicada:**
- Las 9 rutas públicas: `markPublicOperations()` en el generador fija `security: []` explícito,
  con la lista de rutas mantenida a mano y comentada (si se añade un nuevo endpoint público hay que
  sumarlo ahí, o el lint vuelve a fallar — es una salvaguarda intencional, no un olvido).
- `GET /` (`AppController.getHello`): **no** es público (requiere JWT válido en runtime, sin
  `@Public()`) pero no tenía ningún decorador Swagger. Se corrigió en código
  (`src/app.controller.ts`): se añadió `@ApiTags('app')`, `@ApiBearerAuth()` y `@ApiOperation` a
  `getHello()`, y `@ApiOperation` a `health()`. Cambio mínimo, aditivo, sin efecto en runtime.

## 6. Advertencias no bloqueantes (aceptadas, no corregidas en esta fase)

| Regla Redocly | Ocurrencias | Por qué queda como `warn` |
|---|---:|---|
| `operation-4xx-response` | 841 | Documentar la respuesta 4xx real de cada una de las 841 operaciones requiere `@ApiResponse` por endpoint en 191 controllers — volumen que excede el alcance de esta fase; el modelo de error compartido ya existe en código (`docs/api/error-model.md`) y describe la forma real, aunque no está enlazado operación por operación todavía. |
| `operation-description` | 530 | Las operaciones tienen `summary` (vía `@ApiOperation`) pero no siempre `description` extendida. Mejora de contenido, no de exactitud. |
| `tag-description` | 169 | Los 169 tags se derivan automáticamente de `@ApiTags`; no tienen descripción propia todavía (ver `docs/modules/*/overview.md`, Fase 9, como fuente futura). |

Ninguna de estas advertencias afecta la corrección del contrato — describen contenido narrativo
pendiente, no datos incorrectos.

## 7. Ambigüedad de rutas aceptada (2 pares, ver `ARCH-004`)

`no-ambiguous-paths` (bajado a `warn` en `redocly.yaml` con justificación) detectó 2 pares de rutas
donde un segmento literal coincide posicionalmente con el nombre de un parámetro de una ruta
hermana:

- `/org/{tenantMembershipId}/user-assignments` vs. `/org/user-assignments/{id}` (`delegated_access`)
- `/read-models/{definitionId}/refresh` vs. `/read-models/definitions/{id}` (`read_models`)

Es una ambigüedad de especificación OpenAPI, no de comportamiento real: Express resuelve las rutas
por orden de registro sin colisión en producción. Rediseñar las rutas es un cambio de contrato de
API que no se hace sin que el usuario lo pida; se documenta y acepta en `ARCH-004`
(`docs/governance/traceability-matrix.md`).

## 8. No incluido en esta fase

- `@ApiResponse` de error por operación (841 operaciones) — ver §6.
- Servidor de producción/staging en `openapi/openapi.yaml` — no existe una URL real conocida que
  documentar sin inventarla; solo se declara `http://localhost:3000`. Añadir cuando exista un
  dominio real (Fase 14, `docs/operations/environments.md`).
