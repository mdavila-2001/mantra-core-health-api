# Revisión de núcleo `orm-nucleo` — ALOVIDA

Fecha: 2026-10-05. Revisión documental; no se modificó runtime.

## 1. Alcance y cobertura real

Se revisaron bootstrap, config, fidelity, observabilidad, subscriber, módulo ORM y puente CLI. No se conectó PostgreSQL ni se materializaron las siete capas.

## 2. Resumen ejecutivo

| Severidad | Hallazgos | Lente |
|---|---:|---|
| Alta | 2 | Datos, seguridad |
| Media | 0 | — |
| Crítica / baja | 0 / 0 | — |

## 3. Mapa verificado

| Superficie | Evidencia | Comportamiento |
|---|---|---|
| DDL | `schema-bootstrap.service.ts:73-121` | Cerrojado y siete capas. |
| Lock | `advisory-lock.ts:65-103` | Advisory lock transaccional. |
| Índices/FKs | `05-indexes.layer.ts:86-106`, `06-foreign-keys.layer.ts:137-157` | Fallos acumulados. |
| Logger | `orm.logger.ts:60-93` | SQL completo para slow/debug. |
| Historial | `history-mirror.subscriber.ts:157-205` | Snapshot y relanzamiento. |

## 4. Hallazgos confirmados

### ORMN-01 — Alta — El bootstrap tolera FKs e índices críticos fallidos

La capa de índices captura lotes, suma `failures` y continúa (`src/orm/bootstrap/layers/05-indexes.layer.ts:86-106`); la de FKs también (`06-foreign-keys.layer.ts:137-157`). El orquestador sólo registra el agregado y no lanza (`schema-bootstrap.service.ts:169-177`). Una unicidad o FK no creada puede retirar un invariante declarado del modelo mientras el proceso inicia.

**Veredicto adversarial:** confirmado. La tolerancia es intencional, pero no hay gate de readiness ni clasificación de objetos críticos. No se encontró una restricción fallida concreta en esta rama.

**Plan:** etiquetar FKs y únicos de integridad como bloqueantes, persistir reporte de bootstrap y negar readiness hasta resolverlos. Sólo índices de rendimiento explícitamente aprobados pueden degradar.

| Caso | Spec/proceso propuesto | Resultado esperado |
|---|---|---|
| Correcto | integración, base vacía | DDL completo; readiness 200. |
| Límite | índice no único opcional no aplicable | proceso listo con alerta/métrica. |
| Error | datos que violan FK/UNIQUE crítico | no anuncia listo. |
| Falla catalogada | `/readiness` con invariante pendiente | `503 / DEPENDENCY_UNAVAILABLE / SYSTEM_SCHEMA_INTEGRITY_INCOMPLETE`. |

### ORMN-02 — Alta — El logger ORM puede enviar SQL y detalles crudos a logs

Una consulta lenta siempre emite `query: context.query` (`src/orm/observability/orm.logger.ts:73-83`), y debug hace lo mismo (`:86-93`). `warn`/`error` reenvían mensajes ORM sin redacción (`:112-134`). Las consultas ORM pueden contener identidad, clínica o importes. La redacción HTTP de pino no transforma esas cadenas. El subscriber además escribe el mensaje crudo con `console.error` (`history-mirror.subscriber.ts:199-203`).

**Veredicto adversarial:** confirmado por el flujo de log. No se afirma que un valor real ya haya sido exportado.

**Plan:** loguear sólo clase de sentencia, hash/operación y duración; no parámetros ni `DETAIL`. Permitir SQL local tras flag explícito, nunca producción; migrar el subscriber a logger estructurado sanitizado.

| Caso | Spec/proceso propuesto | Resultado esperado |
|---|---|---|
| Correcto | unit, SELECT lento sintético | métrica, operación y duración presentes. |
| Límite | umbral exacto de slow query | una clasificación. |
| Error | SQL/error con marcador sensible | marcador ausente de pino y stderr. |
| Falla catalogada | fallo de persistencia vía API | `500 / INTERNAL / SYSTEM_PERSISTENCE_FAILURE`, sin SQL. |

## 5. Pruebas por hallazgo

Las tablas de ORMN-01 y ORMN-02 contienen sus cuatro casos. Agregar conexión real para las capas y spies de pino/stderr para los logs; los specs actuales no ejercitan DDL ni salida de producción.

## 6. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| Advisory lock | una réplica | dos réplicas | conexión muere | siguiente adquiere lock |
| Bootstrap | base vacía | dry-run | FK/UNIQUE crítica inválida | `503/DEPENDENCY_UNAVAILABLE/SYSTEM_SCHEMA_INTEGRITY_INCOMPLETE` |
| Fidelity | entidades iguales | warning controlado | diferencia | no certifica despliegue |
| Logger/history | metadatos seguros | umbral exacto | detalle sensible | `500/INTERNAL/SYSTEM_PERSISTENCE_FAILURE` |

## 7. Catálogo de errores

Crear `SYSTEM_SCHEMA_INTEGRITY_INCOMPLETE` para `503 / DEPENDENCY_UNAVAILABLE` y `SYSTEM_PERSISTENCE_FAILURE` para `500 / INTERNAL`; nunca incluir SQL, parámetros, snapshots ni mensaje del driver.

## 8. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo |
|---|---|---|
| 0 | ORMN-02: cortar SQL/error crudo | M |
| 0 | ORMN-01: gates de integridad | L |

## 9. Trabajo pendiente de integrar y verificación

No se identificó trabajo pendiente específico. Evidencia ejecutada: `corepack yarn test --runInBand --silent src/orm`: **2 suites, 8 tests aprobados**. No prueba PostgreSQL, concurrencia ni logs de producción.
