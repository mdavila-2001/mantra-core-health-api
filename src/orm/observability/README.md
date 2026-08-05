# src/orm/observability — Qué se ve de la capa de datos

Dos archivos con una responsabilidad clara cada uno.

| Archivo | Qué hace |
|---|---|
| `orm.logger.ts` | Enruta el logger interno de MikroORM al de NestJS y clasifica las consultas lentas |
| `query-metrics.ts` | Contadores acumulados por proceso: volumen, latencia, fallos |

## El problema de partida

Por defecto MikroORM escribe con `console.log` y colores ANSI. En un contenedor eso produce
líneas que el agregador de logs no sabe parsear: sin nivel, sin timestamp y sin correlación
con el resto de la aplicación. Enrutarlas por el `Logger` de NestJS hace que las consultas
compartan formato, nivel y transporte con todo lo demás.

Ese `Logger` de `@nestjs/common` es, en runtime, **pino**: `main.ts` lo sustituye con
`app.useLogger(app.get(Logger))` (ver `src/logging`). Por eso el puente sigue usando el
`Logger` de Nest y aun así las consultas del ORM salen como JSON estructurado de pino, junto
al resto de las capas. Los mensajes con datos (consulta lenta) se emiten como objeto con clave
`msg`, para que pino trate `tookMs`, `rows` y `query` como campos filtrables.

Aprovechando ese punto de paso se añaden dos cosas que no vienen de serie.

## Consultas lentas

Toda consulta que supere `ORM_SLOW_QUERY_MS` (200 ms por defecto) se registra como
**advertencia**, esté o no activado el modo debug:

```
WARN [MikroORM] { message: 'consulta lenta', tookMs: 289, thresholdMs: 200, rows: 15678, query: 'select ...' }
```

El razonamiento: una consulta lenta es una señal operativa, no una traza de depuración. Con
el esquema comportándose bien esas líneas no aparecen; cuando aparecen, señalan una
regresión concreta sin que nadie haya tenido que activar nada.

El umbral de 200 ms es un compromiso: por debajo, en un modelo con 1159 tablas el ruido
supera a la señal; por encima, se escapan regresiones reales.

`context.took` es la duración medida por el driver, es decir el tiempo real de ida y vuelta
contra PostgreSQL, no tiempo de CPU.

## Contadores

`QueryMetrics` acumula total de consultas, desglose por familia
(select/insert/update/delete/ddl), consultas lentas, consultas fallidas, tiempo acumulado y
la consulta más lenta observada. `snapshot()` devuelve una copia inmutable serializable a
JSON, apta para un endpoint de salud o un scrape de métricas.

Coste en el camino caliente: aritmética entera y, como mucho, un `slice(0, 16)` sobre el SQL
para clasificar el verbo. No formatea, no serializa y no reserva memoria por consulta.

Límite deliberado: es por proceso y se pierde al reiniciar. No sustituye a un backend de
métricas; lo alimenta.

## Nota sobre el ciclo de vida

`ormQueryMetrics` es una instancia única que vive **fuera** del contenedor de dependencias.
Tiene que ser así: el logger de MikroORM se construye al crear la configuración, antes de
que exista el contenedor de NestJS. `OrmModule` la vuelve a exponer como proveedor
(`{ provide: QueryMetrics, useValue: ormQueryMetrics }`) para que cualquier servicio la
inyecte con normalidad.

## Lo que falta y sería el siguiente paso

- Exponer `snapshot()` en un endpoint (`@nestjs/terminus` ya está en las dependencias).
- Etiquetar cada consulta con el identificador de traza de la petición para poder atribuir
  una consulta lenta a un endpoint concreto.
- Detección de N+1: `QueryMetrics` tiene ya el volumen por familia, y comparar consultas por
  petición contra una cota daría la señal.
