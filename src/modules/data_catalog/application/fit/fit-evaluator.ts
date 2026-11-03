import { knownOperations, realRoutes } from './checks/route-checks';
import { isRealMethod, routeKey, routesFingerprint } from './fit-routes';
import {
  FIT_FINDINGS_CAP,
  FIT_MODEL_VERSION,
  SCAN_STALE_AFTER_MS,
} from './fit.constants';
import {
  FIT_DIMENSIONS,
  type DimensionStatus,
  type FitCheck,
  type FitCheckOutcome,
  type FitCheckResult,
  type FitDimension,
  type FitDimensionScore,
  type FitInputs,
  type FitReport,
  type FitVerdict,
} from './fit.types';

const ratio = (covered: number, denominator: number): number =>
  Math.round((covered / denominator) * 10_000) / 10_000;

/** Traduce lo que devolvió una comprobación a su resultado publicado. Nunca lanza. */
export function toResult(check: FitCheck, inputs: FitInputs): FitCheckResult {
  const base = {
    id: check.id,
    dimension: check.dimension,
    title: check.title,
    severity: check.severity,
    remediation: check.remediation,
    covered: null,
    denominator: null,
    summary: '',
    reason: null,
    evidence: {},
    findings: [],
    findingsTotal: 0,
    findingsTruncated: false,
  } satisfies Omit<FitCheckResult, 'status'>;

  let outcome: FitCheckOutcome;
  try {
    outcome = check.evaluate(inputs);
  } catch (error) {
    // una comprobación rota no tumba la sonda ni se lee como «todo en regla»: queda sin dato
    return {
      ...base,
      status: 'SIN_DATO',
      reason: `La comprobación falló al ejecutarse: ${error instanceof Error ? error.name : 'error desconocido'}`,
      summary: 'No se pudo comprobar.',
    };
  }

  if (outcome.kind === 'unavailable')
    return {
      ...base,
      status: 'SIN_DATO',
      reason: outcome.reason,
      summary: 'No se pudo comprobar: falta una fuente.',
      evidence: outcome.evidence ?? {},
    };
  if (outcome.kind === 'undeclared')
    return {
      ...base,
      status: 'NO_DECLARADO',
      reason: outcome.reason,
      summary: 'Aún no hay dónde declarar lo que esta comprobación mide.',
      evidence: outcome.evidence ?? {},
    };

  if (outcome.denominator === 0)
    return {
      ...base,
      status: 'NO_APLICA',
      reason: 'No hay nada que comprobar: el universo está vacío',
      summary: 'Universo vacío.',
      evidence: outcome.evidence ?? {},
    };

  const fallo = outcome.covered < outcome.denominator;
  return {
    ...base,
    status: fallo ? 'FALLA' : 'OK',
    covered: outcome.covered,
    denominator: outcome.denominator,
    summary:
      outcome.summary ??
      `${outcome.covered} de ${outcome.denominator} cumplen.`,
    evidence: outcome.evidence ?? {},
    findings: outcome.findings.slice(0, FIT_FINDINGS_CAP),
    findingsTotal: outcome.findings.length,
    findingsTruncated: outcome.findings.length > FIT_FINDINGS_CAP,
  };
}

/** Puntaje de una dimensión: Σ de ítems de las comprobaciones medidas, con su base. */
export function scoreDimension(
  dimension: FitDimension,
  results: readonly FitCheckResult[],
): FitDimensionScore {
  const propias = results.filter((r) => r.dimension === dimension);
  const medidas = propias.filter(
    (r) => r.status === 'OK' || r.status === 'FALLA',
  );
  const sinMedir = propias.filter(
    (r) => r.status === 'SIN_DATO' || r.status === 'NO_DECLARADO',
  );
  const covered = medidas.reduce((a, r) => a + (r.covered ?? 0), 0);
  const denominator = medidas.reduce((a, r) => a + (r.denominator ?? 0), 0);
  let status: DimensionStatus;
  if (medidas.length > 0) status = 'MEDIDA';
  else if (propias.some((r) => r.status === 'NO_DECLARADO'))
    status = 'NO_DECLARADO';
  else if (propias.some((r) => r.status === 'SIN_DATO')) status = 'SIN_DATO';
  else status = 'NO_APLICA';
  return {
    dimension,
    status,
    covered: status === 'MEDIDA' ? covered : null,
    denominator: status === 'MEDIDA' ? denominator : null,
    ratio:
      status === 'MEDIDA' && denominator > 0
        ? ratio(covered, denominator)
        : null,
    checksMeasured: medidas.length,
    checksUnmeasured: sinMedir.length,
    checksFailed: medidas.filter((r) => r.status === 'FALLA').length,
  };
}

/**
 * Veredicto global. No promedia: una comprobación de severidad ALTA que falla desajusta el
 * catálogo aunque lo demás esté perfecto, y no saber (`SIN_DATO`) una comprobación ALTA impide
 * declararlo ajustado.
 */
export function verdictOf(results: readonly FitCheckResult[]): FitVerdict {
  const medidas = results.filter(
    (r) => r.status === 'OK' || r.status === 'FALLA',
  );
  if (medidas.length === 0) return 'SIN_DATOS';
  const fallas = medidas.filter((r) => r.status === 'FALLA');
  if (fallas.some((r) => r.severity === 'ALTA')) return 'DESAJUSTADA';
  if (
    fallas.some((r) => r.severity === 'MEDIA' || r.severity === 'BAJA') ||
    results.some((r) => r.status === 'SIN_DATO' && r.severity === 'ALTA')
  )
    return 'CON_AVISOS';
  return 'AJUSTADA';
}

/** Huellas de los tres conjuntos de rutas que la sonda compara; `null` si la fuente no estaba. */
function fingerprintsOf(inputs: FitInputs): FitReport['fingerprints'] {
  return {
    routesInCode: inputs.routes.ok
      ? routesFingerprint(realRoutes(inputs.routes.value).keys())
      : null,
    routesInInventory: inputs.operations.ok
      ? routesFingerprint(knownOperations(inputs.operations.value).keys())
      : null,
    routesImported: inputs.importedOperations.ok
      ? routesFingerprint(
          inputs.importedOperations.value
            .filter((o) => isRealMethod(o.method))
            .map((o) => routeKey(o.method, o.route)),
        )
      : null,
  };
}

/** Evalúa todas las comprobaciones sobre las mismas entradas. Pura: sin base, sin reloj propio. */
export function evaluateFit(
  inputs: FitInputs,
  checks: readonly FitCheck[],
): FitReport {
  const checkResults = checks.map((c) => toResult(c, inputs));
  return {
    modelVersion: FIT_MODEL_VERSION,
    evaluatedAt: inputs.now.toISOString(),
    verdict: verdictOf(checkResults),
    dimensions: FIT_DIMENSIONS.map((d) => scoreDimension(d, checkResults)),
    checks: checkResults,
    blindSpots: checkResults
      .filter((r) => r.status === 'SIN_DATO' || r.status === 'NO_DECLARADO')
      .map((r) => r.id),
    fingerprints: fingerprintsOf(inputs),
    deployment: inputs.deployment,
    thresholds: { scanStaleAfterMs: SCAN_STALE_AFTER_MS },
  };
}
