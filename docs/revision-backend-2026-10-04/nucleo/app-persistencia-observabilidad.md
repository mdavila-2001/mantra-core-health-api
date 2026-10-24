# Revisión de `app-persistencia-observabilidad` — ALOVIDA

Fecha: 2026-10-05. Revisión documental; no se modificó runtime.

## 1. Alcance y cobertura real

Se revisaron `main.ts`, módulos raíz, readiness, persistencia, logging y observabilidad. Se ejecutaron sus specs dirigidos. No se hizo una petición HTTP con dependencias reales, exportador OTLP ni réplica PostgreSQL.

## 2. Resumen ejecutivo

| Severidad | Hallazgos | Lente |
|---|---:|---|
| Alta | 1 | Datos y contrato |
| Media | 1 | Observabilidad y migración |
| Crítica / baja | 0 / 0 | — |

## 3. Mapa verificado

| Superficie | Evidencia | Comportamiento |
|---|---|---|
| HTTP/DTO | `src/main.ts:186-197` | whitelist, rechazo de propiedades extra y transform. |
| Readiness pública | `src/app.controller.ts:62-68` | PostgreSQL, Mongo, Redis, OpenSearch y RLS. |
| Respuesta 503 | `src/app-readiness.service.ts:32-57` | Checks sanitizados, sin reason. |
| Sesiones | `src/persistence/session/session.provider.ts:15-65` | Rutas nuevas opt-in; default directa. |
| Trazas | `src/observability/tracing.service.ts:57-97` | Atributos de claves arbitrarias. |

## 4. Hallazgos confirmados

### APO-01 — Alta — `/readiness` falla fuera del contrato de reason estable

La ruta es pública (`src/app.controller.ts:62-68`). Si un probe cae, se lanza `ServiceUnavailableException` con `code` y `details`, pero sin `reason` (`src/app-readiness.service.ts:44-55`). Un consumidor no puede clasificar establemente PostgreSQL, RLS o timeout sin interpretar detalles.

**Veredicto adversarial:** confirmado. Los detalles públicos omiten el error crudo, control correcto que debe preservarse. Solapa `IC-06` de infraestructura, sin duplicar un defecto de secretos.

**Plan:** emitir `DomainException` o adaptador con `SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE`, conservar sólo nombre/estado/latencia pública y documentar OpenAPI con tests HTTP.

| Caso | Spec/proceso propuesto | Resultado esperado |
|---|---|---|
| Correcto | e2e, cinco probes up | `200`, `status=ok`. |
| Límite | probe tarda 2.999 ms | `200`, latencia presente. |
| Error | timeout PostgreSQL o RLS inseguro | `503`, sin detalle driver. |
| Falla catalogada | dependencia down | `503 / DEPENDENCY_UNAVAILABLE / SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE`. |

### APO-02 — Media — La normalización y métricas de persistencia sólo se activan para scheduling

`PERSISTENCE_PORTS_MODULES` está vacío por defecto y devuelve sesión directa (`src/persistence/session/session.provider.ts:15-37,49-65`). Ésta delega al `EntityManager` sin métricas ni normalización (`direct.session.ts:8-43`). El token se usa sólo en scheduling; la fábrica nueva sí normaliza SQLSTATE y mide (`persistence-session.factory.ts:219-254`).

**Veredicto adversarial:** confirmado como migración incompleta, no como falla concreta de scheduling. La vía directa es rollback deliberado y no se debe retirar sin migración por módulo.

**Plan:** inventariar `EntityManager`, migrar por dominio con telemetría comparativa y rechazar módulos desconocidos en la variable. Mantener rollback explícito y documentar garantías no cubiertas.

| Caso | Spec/proceso propuesto | Resultado esperado |
|---|---|---|
| Correcto | unit, módulo migrado y write válido | métrica `write/ok`, primaria. |
| Límite | lectura dentro de transacción | permanece en primaria transaccional. |
| Error | módulo desconocido en rollout | arranque rechaza configuración. |
| Falla catalogada | SQLSTATE `23505` migrado | `409 / CONFLICT / SYSTEM_UNIQUE_CONSTRAINT`. |

## 5. Pruebas por hallazgo

Las tablas de APO-01 y APO-02 contienen sus cuatro casos. Añadir e2e para readiness y contrato de configuración/adapter; los mocks actuales prueban piezas aisladas, no las cinco dependencias ni una réplica.

## 6. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| Bootstrap HTTP | CORS/DTO válidos | timeout exacto | propiedad extra | 400 catalogado |
| Readiness | cinco up | 2.999 ms | dependencia/RLS down | `503/DEPENDENCY_UNAVAILABLE/SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE` |
| Persistencia | ruta migrada | read transaccional | rollout desconocido | `409/CONFLICT/SYSTEM_UNIQUE_CONSTRAINT` |
| Logging | token redactado | request ID confiable | campo sensible sintético | ausencia de salida |
| Trazas | `APP_ATTR` | telemetría apagada | exportador caído | operación continúa sin payload clínico |

## 7. Catálogo de errores

Crear `SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE` para `503 / DEPENDENCY_UNAVAILABLE`. Coordinar `SYSTEM_UNIQUE_CONSTRAINT` con el catálogo transversal; nunca publicar host, usuario, SQL o mensaje de driver.

## 8. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo |
|---|---|---|
| 1 | APO-01: reason y contrato readiness | S |
| 2 | APO-02: inventario, gates y migración | L |

## 9. Trabajo pendiente de integrar y verificación

El plan externo señala cambios pendientes del filtro global en `fa74b78c`; contrastarlos antes de crear reasons. Evidencia ejecutada: `corepack yarn test --runInBand --silent src/persistence src/observability src/logging src/app.controller.spec.ts src/app-readiness.service.spec.ts`: **19 suites, 212 tests aprobados**.
