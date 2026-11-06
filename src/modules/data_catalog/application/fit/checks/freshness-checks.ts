import { isRealMethod, routeKey, routesFingerprint } from '../fit-routes';
import { SCAN_STALE_AFTER_MS } from '../fit.constants';
import type { FitFinding, FitInputs } from '../fit.types';
import { defineCheck, noSource, sample } from './check-helpers';
import { knownOperations, realRoutes } from './route-checks';

export const scanFresh = defineCheck({
  id: 'FIT-FRE-001',
  dimension: 'FRESHNESS',
  title: 'El último escaneo de la base no está vencido',
  severity: 'ALTA',
  remediation:
    'Ver `GET /admin/catalog/scans`: si el último falló, leer su `errorCode`; si no hay escaneos, comprobar que el worker `data_catalog` esté vivo en «Instancias» y pedir uno (`POST /admin/catalog/scans`).',
  evaluate(i: FitInputs) {
    const { scan } = i;
    if (!scan.ok) return noSource('escaneos', scan);
    const { lastSucceededAt, lastStatus, lastFinishedAt } = scan.value;
    const evidence = {
      thresholdMs: SCAN_STALE_AFTER_MS,
      lastSucceededAt: lastSucceededAt?.toISOString() ?? null,
      lastFinishedAt: lastFinishedAt?.toISOString() ?? null,
      lastStatus,
      ageMs: lastSucceededAt
        ? Math.max(0, i.now.getTime() - lastSucceededAt.getTime())
        : null,
    };
    const findings: FitFinding[] = [];
    if (!lastSucceededAt)
      findings.push({
        subject: 'escaneo',
        detail:
          'Nunca hubo un escaneo exitoso: el catálogo vivo está vacío o sin observar',
      });
    else if (evidence.ageMs! > SCAN_STALE_AFTER_MS)
      findings.push({
        subject: 'escaneo',
        detail: `El último escaneo exitoso tiene ${Math.round(evidence.ageMs! / 60_000)} min; el umbral es ${Math.round(SCAN_STALE_AFTER_MS / 60_000)} min`,
      });
    else if (
      lastStatus === 'FAILED' &&
      lastFinishedAt &&
      lastFinishedAt > lastSucceededAt
    )
      findings.push({
        subject: 'escaneo',
        detail:
          'El escaneo más reciente falló: el catálogo vivo es el del anterior',
      });
    return {
      kind: 'measured',
      covered: findings.length === 0 ? 1 : 0,
      denominator: 1,
      findings,
      evidence,
      summary: `Umbral explícito: ${Math.round(SCAN_STALE_AFTER_MS / 60_000)} min (2 intervalos de la sonda de escaneo + un lease).`,
    };
  },
});

/** Compara dos conjuntos de rutas por huella; los hallazgos son la diferencia simétrica, acotada. */
function compareFingerprints(
  codigo: ReadonlySet<string>,
  otro: ReadonlySet<string>,
  etiqueta: string,
  commit: string,
) {
  const soloCodigo = [...codigo].filter((k) => !otro.has(k)).sort();
  const soloOtro = [...otro].filter((k) => !codigo.has(k)).sort();
  const huellaCodigo = routesFingerprint(codigo);
  const huellaOtro = routesFingerprint(otro);
  const findings: FitFinding[] =
    huellaCodigo === huellaOtro
      ? []
      : [
          {
            subject: 'huella',
            detail: `código ${huellaCodigo} ≠ ${etiqueta} ${huellaOtro} (${soloCodigo.length} solo en el código, ${soloOtro.length} solo en ${etiqueta})`,
          },
          ...soloCodigo.map((k) => ({
            subject: k,
            detail: `Solo en el código desplegado (no está en ${etiqueta})`,
          })),
          ...soloOtro.map((k) => ({
            subject: k,
            detail: `Solo en ${etiqueta} (no está en el código desplegado)`,
          })),
        ];
  return {
    kind: 'measured' as const,
    covered: findings.length === 0 ? 1 : 0,
    denominator: 1,
    findings,
    evidence: {
      codeFingerprint: huellaCodigo,
      comparedFingerprint: huellaOtro,
      onlyInCode: soloCodigo.length,
      onlyInCompared: soloOtro.length,
      sampleOnlyInCode: sample(soloCodigo, 3),
      deployedCommit: commit,
    },
  };
}

export const importMatchesCode = defineCheck({
  id: 'FIT-FRE-002',
  dimension: 'FRESHNESS',
  title:
    'La última importación del inventario corresponde al código desplegado (huella)',
  severity: 'ALTA',
  remediation:
    'Pedir la importación (`POST /internal/catalog/inventory/import`, la hace el worker tras cada escaneo exitoso) con un inventario regenerado desde este código; si el worker no importa, revisar su tick `scan-tick`.',
  evaluate(i: FitInputs) {
    const { routes, importedOperations } = i;
    if (!routes.ok) return noSource('rutas del código', routes);
    if (!importedOperations.ok)
      return noSource('operaciones importadas', importedOperations);
    const codigo = new Set(realRoutes(routes.value).keys());
    const importadas = new Set(
      importedOperations.value
        .filter((o) => isRealMethod(o.method))
        .map((o) => routeKey(o.method, o.route)),
    );
    return compareFingerprints(
      codigo,
      importadas,
      'lo importado',
      i.deployment.commit,
    );
  },
});

export const inventoryMatchesCode = defineCheck({
  id: 'FIT-FRE-003',
  dimension: 'FRESHNESS',
  title: 'El inventario generado corresponde al código desplegado (huella)',
  severity: 'ALTA',
  remediation:
    'Regenerar el inventario en la imagen (`yarn inventario:endpoints` y `yarn inventario:verificar`); un inventario viejo describe una API que ya no existe.',
  evaluate(i: FitInputs) {
    const { routes, operations } = i;
    if (!routes.ok) return noSource('rutas del código', routes);
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    const codigo = new Set(realRoutes(routes.value).keys());
    const inventario = new Set(knownOperations(operations.value).keys());
    return compareFingerprints(
      codigo,
      inventario,
      'el inventario',
      i.deployment.commit,
    );
  },
});

export const FRESHNESS_CHECKS = [
  scanFresh,
  importMatchesCode,
  inventoryMatchesCode,
];
