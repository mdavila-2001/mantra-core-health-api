/**
 * MCH-023 · Evaluación trivalente de una prueba de restauración (UC-11-10).
 *
 * El defecto que corrige este módulo: `objectiveBreached` era un booleano
 * calculado con comparaciones condicionadas a que las mediciones existieran.
 * Si llegaban ausentes daba `false` — «no incumple» — y cualquier consumidor lo
 * lee como «cumple». Una restauración de la que no se midió nada quedaba
 * indistinguible de una que se midió y salió bien.
 *
 * La regla es al revés: **aprobado hay que demostrarlo**. Sin medición el
 * resultado es desconocido, y desconocido no es aprobado.
 */

/** Resultado de contrastar una restauración contra los objetivos de su política. */
export enum RestoreObjectiveStatus {
  /** Se midió todo lo que la política exige y quedó dentro del objetivo. */
  PASSED = 'PASSED',
  /** Se incumplió un objetivo, la integridad o el resultado informado. */
  FAILED = 'FAILED',
  /** Falta evidencia para afirmar nada. **No** equivale a cumplir. */
  NOT_MEASURED = 'NOT_MEASURED',
}

/** Los tres estados, para validar DTO y persistencia contra el mismo contrato. */
export const RESTORE_OBJECTIVE_STATUSES = Object.values(
  RestoreObjectiveStatus,
) as RestoreObjectiveStatus[];

/** Objetivos que fija la política contra los que se contrasta la corrida. */
export interface PolicyTargets {
  /** RPO objetivo en segundos; `undefined` si la política no lo fija. */
  rpoSeconds?: number;
  /** RTO objetivo en segundos; `undefined` si la política no lo fija. */
  rtoSeconds?: number;
}

/** Lo que aporta quien registra la corrida. */
export interface RunMeasurements {
  /** RPO medido en segundos. */
  measuredRpoSeconds?: number;
  /** RTO medido en segundos. */
  measuredRtoSeconds?: number;
  /** Verificación de integridad posterior a la restauración. */
  integrityCheckPassed?: boolean;
  /** `true` si quien registra informó la restauración como fallida. */
  reportedFailure: boolean;
}

/** Evaluación con el motivo, para el log y para el cuerpo de la respuesta. */
export interface RestoreEvaluation {
  /** Estado trivalente resultante. */
  status: RestoreObjectiveStatus;
  /** Por qué quedó en ese estado, en castellano. */
  motivo: string;
}

/**
 * Evalúa una prueba de restauración contra los objetivos de su política.
 *
 * El orden importa: primero lo que descarta el éxito (fallo informado,
 * integridad no verificada, objetivo superado), después la falta de evidencia y
 * recién al final la aprobación. Así una restauración fallida no se convierte en
 * exitosa por omitir métricas.
 *
 * @param policy - Objetivos declarados en la política de backup.
 * @param run - Mediciones y resultado aportados al registrar la prueba.
 * @returns El estado trivalente y el motivo que lo justifica.
 */
export function evaluateRestore(
  policy: PolicyTargets,
  run: RunMeasurements,
): RestoreEvaluation {
  // 1. Un fallo informado manda: ninguna omisión posterior lo revierte.
  if (run.reportedFailure) {
    return {
      status: RestoreObjectiveStatus.FAILED,
      motivo: 'La restauración se registró con resultado fallido',
    };
  }

  // 2. Integridad verificada y negativa: los datos volvieron mal.
  if (run.integrityCheckPassed === false) {
    return {
      status: RestoreObjectiveStatus.FAILED,
      motivo: 'La verificación de integridad no pasó',
    };
  }

  // 3. Objetivo superado por una medición presente: incumplimiento demostrado.
  const exceeded = exceededTargets(policy, run);
  if (exceeded.length > 0) {
    return {
      status: RestoreObjectiveStatus.FAILED,
      motivo: `Objetivo superado: ${exceeded.join(', ')}`,
    };
  }

  // 4. Falta evidencia. Cada objetivo que la política fija tiene que venir
  //    medido, y la integridad tiene que haberse verificado explícitamente.
  const missing = missingEvidence(policy, run);
  if (missing.length > 0) {
    return {
      status: RestoreObjectiveStatus.NOT_MEASURED,
      motivo: `Sin evidencia suficiente para aprobar: falta ${missing.join(', ')}`,
    };
  }

  // 5. Recién acá se puede afirmar que cumplió.
  return {
    status: RestoreObjectiveStatus.PASSED,
    motivo: 'Objetivos medidos dentro del umbral e integridad verificada',
  };
}

/**
 * Objetivos que la corrida superó, contando sólo los que tienen medición.
 *
 * @param policy - Objetivos declarados en la política.
 * @param run - Mediciones aportadas.
 * @returns Etiquetas de los objetivos superados.
 */
function exceededTargets(
  policy: PolicyTargets,
  run: RunMeasurements,
): string[] {
  const exceeded: string[] = [];
  if (
    run.measuredRpoSeconds !== undefined &&
    policy.rpoSeconds !== undefined &&
    run.measuredRpoSeconds > policy.rpoSeconds
  ) {
    exceeded.push(
      `RPO medido ${run.measuredRpoSeconds}s sobre ${policy.rpoSeconds}s`,
    );
  }
  if (
    run.measuredRtoSeconds !== undefined &&
    policy.rtoSeconds !== undefined &&
    run.measuredRtoSeconds > policy.rtoSeconds
  ) {
    exceeded.push(
      `RTO medido ${run.measuredRtoSeconds}s sobre ${policy.rtoSeconds}s`,
    );
  }
  return exceeded;
}

/**
 * Evidencia que la política exige y la corrida no aportó.
 *
 * Si la política no fija un objetivo, no se reclama su medición: no hay umbral
 * contra el cual contrastarla.
 *
 * @param policy - Objetivos declarados en la política.
 * @param run - Mediciones aportadas.
 * @returns Descripción de lo que falta.
 */
function missingEvidence(
  policy: PolicyTargets,
  run: RunMeasurements,
): string[] {
  const missing: string[] = [];
  if (policy.rpoSeconds !== undefined && run.measuredRpoSeconds === undefined) {
    missing.push('el RPO medido');
  }
  if (policy.rtoSeconds !== undefined && run.measuredRtoSeconds === undefined) {
    missing.push('el RTO medido');
  }
  if (run.integrityCheckPassed !== true) {
    missing.push('la verificación de integridad');
  }
  return missing;
}
