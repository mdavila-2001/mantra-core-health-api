# Revisión de núcleo `orm-catalogo` — ALOVIDA

Fecha: 2026-10-05. Revisión documental; no se modificó runtime.

## 1. Alcance y cobertura real

Se leyeron `src/orm/catalog`, catálogos de schemas, extensiones, tipos, índices,
FKs y físico, además de sus capas consumidoras. Se revisó el único spec del
área. No se generó catálogo ni se aplicó DDL contra PostgreSQL.

## 2. Resumen ejecutivo

| Severidad | Hallazgos | Lente |
|---|---:|---|
| Alta | 0 | — |
| Media | 1 | Dominio y datos |
| Crítica / baja | 0 / 0 | — |

## 3. Mapa verificado

| Activo | Evidencia | Consumidor |
|---|---|---|
| Schemas, índices y FKs | `src/orm/catalog/index.ts:5-12` | capas 02, 05 y 06 |
| Enum técnico | `types.catalog.ts:55-77` | capa 03 |
| Físico | `physical.catalog.ts:1-17` | capa 07 |
| Tuplas | `catalog.types.ts:1-15` | generador y DDL |

## 4. Hallazgos confirmados

### ORMCAT-01 — Media — El único enum nativo tiene un dominio provisional

`terminology.technical_data_type` se declara `provisional: true` porque el
modelo no fija sus valores (`src/orm/catalog/types.catalog.ts:37-53`). La capa
agrega valores sin remover los existentes
(`src/orm/bootstrap/layers/03-types.layer.ts:67-108`). Seis tablas dependen de
él (`types.catalog.ts:43-47`).

**Veredicto adversarial:** confirmado como deuda de gobernanza. La capa sí crea
el enum antes de tablas y reporta el provisional; no hay evidencia de que un
valor actual sea erróneo en producción.

**Plan:** fijar el vocabulario en el modelo, declarar compatibilidad de labels
heredados, crear migración sólo aditiva y validar los consumidores. No eliminar
labels sin una migración de datos.

| Caso | Spec/proceso propuesto | Resultado esperado |
|---|---|---|
| Correcto | integración PostgreSQL, `string` canónico | inserción y lectura correctas. |
| Límite | base con label heredado soportado | compatibilidad explícita y alerta. |
| Error | tipo ajeno en DTO/dominio | no persiste. |
| Falla catalogada | API recibe tipo no permitido | `422 / PRECONDITION_FAILED / TERMINOLOGY_TECHNICAL_DATA_TYPE_INVALID`. |

## 5. Pruebas por hallazgo

La tabla de ORMCAT-01 es su matriz de cuatro puntos. Añadir
`types.layer.int-spec.ts` con PostgreSQL efímero para creación, ampliación y
reporte de deuda; el spec actual de profiles sólo cubre una delta específica.

## 6. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| Generación | schemas/FKs esperados | ID de 63 bytes | bóveda ausente | comando falla sin salida parcial |
| Índices/FKs | tupla válida | índice parcial | columna inexistente | bootstrap informa objeto no aplicable |
| Enum | label canónico | label heredado | label no declarado | `422/PRECONDITION_FAILED/TERMINOLOGY_TECHNICAL_DATA_TYPE_INVALID` |
| Físico | hypertable/vector apto | extensión opcional | dimensión indefinida | capacidad degradada informada |

## 7. Catálogo de errores

Proponer `TERMINOLOGY_TECHNICAL_DATA_TYPE_INVALID` (`422 /
PRECONDITION_FAILED`) en límites HTTP que acepten ese valor. El bootstrap debe
seguir usando diagnóstico sanitizado, nunca exponer el catálogo físico.

## 8. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo |
|---|---|---|
| 1 | ORMCAT-01: fijar dominio y compatibilidad | M |
| 2 | Integración DDL y validadores | M |

## 9. Trabajo pendiente de integrar y verificación

No se identificó un commit pendiente específico. Evidencia ejecutada:
`corepack yarn test --runInBand --silent src/orm`: **2 suites, 8 tests
aprobados**. No ejecuta DDL real, que permanece pendiente.
