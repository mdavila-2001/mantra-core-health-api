import type { IncomingMessage } from 'node:http';
import type { Instrumentation } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { EXCLUDED_HTTP_PATHS } from './telemetry.constants';

/**
 * Selección y configuración de las instrumentaciones automáticas.
 *
 * Se instalan **una por una** en vez de usar `auto-instrumentations-node`: el
 * meta-paquete arrastra unas cuarenta instrumentaciones (Kafka, gRPC, MySQL,
 * Cassandra, GraphQL, AWS Lambda…) de las que este backend usa siete, y cada
 * una parchea módulos en tiempo de carga. Ver la decisión D2 en
 * `docs/observability/01-architecture-design.md`.
 *
 * Deliberadamente **fuera**: `fs`, `dns` y `net` (ruido masivo sin valor
 * diagnóstico: una sola petición genera cientos de spans de lectura de disco) y
 * `pino` (colisiona con el `mixin` propio de `src/logging/pino-options.ts`).
 */

/**
 * Decide si una petición entrante queda fuera de la traza.
 *
 * Se compara contra la ruta sin query string: `/health?x=1` es la misma sonda
 * que `/health`. El prefijo cubre las subrutas de Swagger (`/docs-json`,
 * `/docs/…`) sin tener que enumerarlas.
 */
export function isExcludedPath(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0];
  return EXCLUDED_HTTP_PATHS.some(
    (excluded) => path === excluded || path.startsWith(`${excluded}/`),
  );
}

/**
 * Serializa un comando de Redis para el atributo `db.statement`.
 *
 * Emite **solo el nombre del comando**, nunca los argumentos: las claves de
 * este backend llevan identificadores de paciente y de tenant, y los valores
 * pueden ser PHI cacheada. El comando por sí solo ya responde la pregunta
 * operativa ("¿qué operación de Redis tardó?") sin convertir Jaeger en un
 * repositorio de datos clínicos.
 */
export function redisStatementSerializer(cmdName: string): string {
  return cmdName;
}

/** Construye la lista de instrumentaciones activas. */
export function buildInstrumentations(): Instrumentation[] {
  return [
    new HttpInstrumentation({
      // Excluye sondas y documentación. `ignoreIncomingRequestHook` evita
      // incluso crear el span, así que no consume presupuesto de muestreo.
      ignoreIncomingRequestHook: (request: IncomingMessage) =>
        isExcludedPath(request.url),
      // Sin `headersToSpanAttributes`: por defecto no se captura ninguna
      // cabecera. Capturarlas metería `authorization` (un Bearer válido) y las
      // cookies de sesión en el almacén de trazas.
      requireParentforOutgoingSpans: false,
      requireParentforIncomingSpans: false,
    }),

    new ExpressInstrumentation({
      // Se descartan TODOS los spans de middleware. En este backend el
      // middleware es fijo y trivial (helmet, json, urlencoded, cors,
      // expressInit): se ejecuta en cada una de las peticiones, no explica
      // nunca la latencia y multiplica por seis el número de spans de una
      // traza. Los spans de router y de request handler -los que sí dicen qué
      // ruta atendió la petición- se conservan.
      ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
    }),

    // Aporta el controller y el handler concretos que atendieron la petición,
    // que es justo lo que Express por sí solo no sabe.
    new NestInstrumentation(),

    new PgInstrumentation({
      // `false` es el valor por defecto y se declara explícitamente porque aquí
      // no es una preferencia sino un control de privacidad: activarlo
      // adjuntaría los parámetros de cada consulta (documentos de identidad,
      // diagnósticos, importes) al span.
      enhancedDatabaseReporting: false,
      // Sin span padre no se emite span de consulta. Descarta el ruido del
      // arranque (materialización de DDL, verificación de fidelidad, seed) y
      // los `SELECT 1` del pool, que no pertenecen a ninguna operación de
      // negocio y llegarían a Jaeger como trazas huérfanas de un solo span.
      requireParentSpan: true,
      // `pg.connect`/`pg-pool.connect` describen la gestión del pool, no la
      // consulta: en una petición que reutiliza conexión no aportan nada y en
      // una que la abre solo repiten lo que ya dice la latencia de la query.
      ignoreConnectSpans: true,
    }),

    new IORedisInstrumentation({
      dbStatementSerializer: redisStatementSerializer,
      requireParentSpan: true,
    }),

    new MongoDBInstrumentation({
      enhancedDatabaseReporting: false,
      requireParentSpan: true,
    }),

    // `fetch` nativo de Node (usado por el healthcheck del contenedor y por
    // cualquier cliente futuro que no pase por axios).
    new UndiciInstrumentation({
      ignoreRequestHook: (request) => isExcludedPath(request.path),
    }),
  ];
}
