/**
 * Lo que el portal «Sistema» declara **no medido** (`null ≠ 0`): cada entrada
 * lleva `metric` y la `reason` por la que no hay dato. Una cifra ausente nunca
 * se rellena con 0.
 */
export interface NotMeasured {
  readonly metric: string;
  readonly reason: string;
}

export const NOT_MEASURED = {
  rejectedBeforeApi: {
    metric: 'rejectedBeforeApi',
    reason:
      'Lo que Traefik contesta antes de llegar a la API (404/502 del proxy) sólo existe en el Prometheus del VPS; la API no lo puede leer',
  },
  healthchecksExcluded: {
    metric: 'healthchecksExcluded',
    reason:
      '/health, /readiness, /metrics y la documentación no entran en la medición',
  },
  percentilesEstimated: {
    metric: 'percentilesEstimated',
    reason:
      'p50/p95/p99 se estiman por interpolación del histograma de 11 cortes (5 ms a 10 s); no son percentiles exactos',
  },
  errorSampling: {
    metric: 'errorSampling',
    reason:
      'Se guardan hasta 500 eventos de error por minuto y por instancia; lo que excede sólo suma al total del grupo. UNAUTHENTICATED y RATE_LIMITED se cuentan sin evento individual',
  },
  sqlOnlyOrm: {
    metric: 'sqlOnlyOrm',
    reason:
      'Sólo se mide el SQL que pasa por MikroORM; el SQL ejecutado con el driver pg directo no se ve',
  },
  workers: {
    metric: 'workers',
    reason:
      'WORKERS_NOT_REPORTING: los latidos de workers aún no se recogen (H5)',
  },
  dependencies: {
    metric: 'dependencies',
    reason:
      'DEPENDENCIES_NOT_PROBED: las sondas de dependencias aún no corren (H5)',
  },
  slo: {
    metric: 'slo',
    reason:
      'SLO_NOT_COMPUTED: el cálculo de SLO y presupuesto aún no corre (H6)',
  },
  affectedActors: {
    metric: 'affectedActors',
    reason:
      'Sin OBSERVABILITY_ACTOR_HASH_SECRET propio no se guarda actor_hash: «usuarios afectados» no se mide',
  },
} as const satisfies Record<string, NotMeasured>;
