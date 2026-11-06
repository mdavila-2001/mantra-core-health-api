import { defineModuleConcepts } from '../../../common/seed/concept-seed';

/**
 * Conceptos del registro de piezas ejecutables (prefijo `platform_ops_runtime:`).
 *
 * `tool_registry.tool_type_concept_id` es FK a `terminology.catalog_concepts`:
 * cada tipo de pieza necesita su concepto. El estado de la fila reutiliza los
 * `PLATFORM_OPS.TOOL_STATE_*` que ya existen (no se crean estados paralelos).
 *
 * `RUNTIME_PIECES_CONCEPT_SEEDS` lo consume el agregador `module-concepts.ts`
 * (una línea que añade el orquestador); `RUNTIME_PIECE_KIND` es el mapa
 * `tipo -> UUID` determinista que usan el servicio y el seeder.
 */
export const { seeds: RUNTIME_PIECES_CONCEPT_SEEDS, ids: RUNTIME_PIECE_KIND } =
  defineModuleConcepts('platform_ops_runtime', {
    PROCESO: { code: 'OPS_RTP_PROCESS', display: 'Runtime piece: process' },
    JOB_PROGRAMADO: {
      code: 'OPS_RTP_SCHEDULED_JOB',
      display: 'Runtime piece: scheduled job',
    },
    TEMPORIZADOR: {
      code: 'OPS_RTP_TIMER',
      display: 'Runtime piece: in-process timer',
    },
    CONSUMIDOR_COLA: {
      code: 'OPS_RTP_QUEUE_CONSUMER',
      display: 'Runtime piece: queue consumer',
    },
    JOB_NOMBRADO: {
      code: 'OPS_RTP_NAMED_JOB',
      display: 'Runtime piece: named job',
    },
    ENDPOINT_INTERNO: {
      code: 'OPS_RTP_INTERNAL_ENDPOINT',
      display: 'Runtime piece: internal endpoint',
    },
    SALUD: {
      code: 'OPS_RTP_HEALTH_CHECK',
      display: 'Runtime piece: health check',
    },
    CONECTOR: {
      code: 'OPS_RTP_CONNECTOR',
      display: 'Runtime piece: external connector',
    },
  });
