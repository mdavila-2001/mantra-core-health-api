import {
  PROBE_INTERVAL_MS,
  SCAN_LEASE_SECONDS,
} from '../../domain/catalog/catalog.constants';

/** Versión del modelo de la sonda: si cambian las reglas de puntaje o de veredicto, cambia este número. */
export const FIT_MODEL_VERSION = 'catalog-fit/v1';

/**
 * Un escaneo deja de ser fresco pasados dos intervalos de la sonda de escaneo más un lease: el
 * primero se perdió, el segundo está en vuelo y el lease es lo que tarda en cerrarse uno abandonado.
 * Propuesta a confirmar con el equipo de datos; viaja en cada resultado para que nadie la suponga.
 */
export const SCAN_STALE_AFTER_MS =
  2 * PROBE_INTERVAL_MS + SCAN_LEASE_SECONDS * 1000;

/** Cada cuánto corre la sonda de ajuste desde el worker. */
export const FIT_TICK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Un resultado más viejo que esto se declara atrasado (S7): el tick debió renovarlo tres veces.
 * No se esconde: se sirve igual, con `stale: true` y su antigüedad.
 */
export const FIT_STALE_AFTER_MS = 3 * FIT_TICK_INTERVAL_MS;

/**
 * Cuánto vale un resultado como «el último». Pasado esto `GET /admin/catalog/fit` dice que no hay
 * resultado vigente en vez de servir uno de ayer como si fuera de hoy, venga de la base
 * (`data_catalog.catalog_fit_runs`) o, si la base no responde, de la memoria del proceso.
 */
export const FIT_RESULT_TTL_MS = 24 * 60 * 60 * 1000;

/** Cuántos resultados resumidos devuelve el historial (a 5 min por tick, 4 horas). */
export const FIT_HISTORY_SIZE = 48;

/** Hallazgos que conserva cada comprobación; el total real viaja aparte en `findingsTotal`. */
export const FIT_FINDINGS_CAP = 50;

/** Cuánto recuerda la sonda una `Idempotency-Key` ya aceptada. */
export const FIT_IDEMPOTENCY_TTL_MS = 60 * 60 * 1000;

/** Largo de la huella (hex) de un conjunto de rutas. */
export const FINGERPRINT_LENGTH = 16;

/**
 * Cuánto se conservan las corridas en `data_catalog.catalog_fit_runs` antes de purgarlas
 * (clase de mutabilidad `APPEND_ONLY_PURGEABLE`). A un tick cada 5 min son ~8 600 filas.
 */
export const FIT_RUN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
