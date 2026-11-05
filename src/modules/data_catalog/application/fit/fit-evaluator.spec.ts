import { DEFAULT_FIT_CHECKS } from './checks';
import {
  evaluateFit,
  scoreDimension,
  toResult,
  verdictOf,
} from './fit-evaluator';
import { FIT_FINDINGS_CAP } from './fit.constants';
import { NOW, baseInputs, liveObject, operation, route } from './fit.fixtures';
import {
  available,
  unavailable,
  type FitCheck,
  type FitCheckResult,
} from './fit.types';

const fake = (over: Partial<FitCheck>): FitCheck => ({
  id: 'FIT-TST-001',
  dimension: 'ROUTES',
  title: 'Comprobación de prueba',
  severity: 'ALTA',
  remediation: 'Corregirlo de prueba',
  evaluate: () => ({
    kind: 'measured',
    covered: 1,
    denominator: 1,
    findings: [],
  }),
  ...over,
});

const result = (over: Partial<FitCheckResult>): FitCheckResult => ({
  id: 'FIT-TST-001',
  dimension: 'ROUTES',
  title: 't',
  severity: 'ALTA',
  status: 'OK',
  covered: 1,
  denominator: 1,
  summary: '',
  reason: null,
  remediation: '',
  evidence: {},
  findings: [],
  findingsTotal: 0,
  findingsTruncated: false,
  ...over,
});

describe('toResult', () => {
  it('una comprobación que lanza queda SIN_DATO, nunca OK y nunca tumba la sonda', () => {
    const r = toResult(
      fake({
        evaluate: () => {
          throw new TypeError('boom con datos');
        },
      }),
      baseInputs(),
    );
    expect(r.status).toBe('SIN_DATO');
    expect(r.covered).toBeNull();
    expect(r.reason).toContain('TypeError');
    expect(r.reason).not.toContain('boom');
  });

  it('un universo vacío es NO_APLICA, sin 0 % ni 100 %', () => {
    const r = toResult(
      fake({
        evaluate: () => ({
          kind: 'measured',
          covered: 0,
          denominator: 0,
          findings: [],
        }),
      }),
      baseInputs(),
    );
    expect(r.status).toBe('NO_APLICA');
    expect(r.covered).toBeNull();
    expect(r.denominator).toBeNull();
  });

  it('recorta los hallazgos pero conserva el total real', () => {
    const findings = Array.from({ length: FIT_FINDINGS_CAP + 7 }, (_, i) => ({
      subject: `s${i}`,
      detail: 'd',
    }));
    const r = toResult(
      fake({
        evaluate: () => ({
          kind: 'measured',
          covered: 0,
          denominator: findings.length,
          findings,
        }),
      }),
      baseInputs(),
    );
    expect(r.findings).toHaveLength(FIT_FINDINGS_CAP);
    expect(r.findingsTotal).toBe(FIT_FINDINGS_CAP + 7);
    expect(r.findingsTruncated).toBe(true);
    expect(r.status).toBe('FALLA');
  });

  it('copia severidad, remediación e id estable de la definición', () => {
    const r = toResult(
      fake({ id: 'FIT-RUT-099', severity: 'BAJA' }),
      baseInputs(),
    );
    expect([r.id, r.severity, r.remediation]).toEqual([
      'FIT-RUT-099',
      'BAJA',
      'Corregirlo de prueba',
    ]);
  });
});

describe('scoreDimension', () => {
  it('suma ítems de las comprobaciones medidas, con numerador y denominador', () => {
    const d = scoreDimension('ROUTES', [
      result({ covered: 8, denominator: 10, status: 'FALLA' }),
      result({ id: 'FIT-TST-002', covered: 5, denominator: 5 }),
      result({
        id: 'FIT-TST-003',
        dimension: 'MODEL',
        covered: 0,
        denominator: 9,
        status: 'FALLA',
      }),
    ]);
    expect([d.covered, d.denominator, d.ratio]).toEqual([13, 15, 0.8667]);
    expect([d.checksMeasured, d.checksFailed, d.checksUnmeasured]).toEqual([
      2, 1, 0,
    ]);
    expect(d.status).toBe('MEDIDA');
  });

  it('null no es cero: sin nada medido no hay porcentaje', () => {
    const sinDato = scoreDimension('ROUTES', [
      result({ status: 'SIN_DATO', covered: null, denominator: null }),
    ]);
    expect(sinDato).toMatchObject({
      status: 'SIN_DATO',
      covered: null,
      denominator: null,
      ratio: null,
      checksUnmeasured: 1,
    });
    const noDeclarado = scoreDimension('ROUTES', [
      result({ status: 'NO_DECLARADO', covered: null, denominator: null }),
    ]);
    expect(noDeclarado).toMatchObject({ status: 'NO_DECLARADO', ratio: null });
    const vacia = scoreDimension('FRESHNESS', [
      result({ dimension: 'ROUTES' }),
    ]);
    expect(vacia).toMatchObject({
      status: 'NO_APLICA',
      ratio: null,
      covered: null,
    });
  });

  it('una dimensión medida a medias lo dice: lo no medido no baja ni sube el ratio', () => {
    const d = scoreDimension('ROUTES', [
      result({ covered: 3, denominator: 3 }),
      result({
        id: 'FIT-TST-002',
        status: 'SIN_DATO',
        covered: null,
        denominator: null,
      }),
    ]);
    expect([d.ratio, d.checksUnmeasured]).toEqual([1, 1]);
  });

  it('el ratio redondea a 4 decimales como la cobertura del catálogo', () => {
    expect(
      scoreDimension('ROUTES', [
        result({ covered: 1, denominator: 3, status: 'FALLA' }),
      ]).ratio,
    ).toBe(0.3333);
  });
});

describe('verdictOf', () => {
  it('AJUSTADA sólo si todo lo medido cumple y no queda un punto ciego ALTO', () => {
    expect(verdictOf([result({})])).toBe('AJUSTADA');
    expect(
      verdictOf([
        result({}),
        result({
          id: 'FIT-TST-002',
          status: 'NO_DECLARADO',
          severity: 'MEDIA',
          covered: null,
          denominator: null,
        }),
      ]),
    ).toBe('AJUSTADA');
  });

  it('una falla ALTA desajusta aunque lo demás sea perfecto (no promedia)', () => {
    const muchas = Array.from({ length: 20 }, (_, i) =>
      result({ id: `FIT-TST-${100 + i}` }),
    );
    expect(
      verdictOf([
        ...muchas,
        result({ id: 'FIT-TST-999', status: 'FALLA', covered: 0 }),
      ]),
    ).toBe('DESAJUSTADA');
  });

  it('una falla MEDIA o BAJA sólo avisa; una INFO no cambia el veredicto', () => {
    expect(
      verdictOf([
        result({}),
        result({ id: 'a', status: 'FALLA', severity: 'MEDIA', covered: 0 }),
      ]),
    ).toBe('CON_AVISOS');
    expect(
      verdictOf([
        result({}),
        result({ id: 'b', status: 'FALLA', severity: 'BAJA', covered: 0 }),
      ]),
    ).toBe('CON_AVISOS');
    expect(
      verdictOf([
        result({}),
        result({ id: 'c', status: 'FALLA', severity: 'INFO', covered: 0 }),
      ]),
    ).toBe('AJUSTADA');
  });

  it('no saber una comprobación ALTA impide declarar ajustado: no saber no es estar bien', () => {
    expect(
      verdictOf([
        result({}),
        result({
          id: 'a',
          status: 'SIN_DATO',
          covered: null,
          denominator: null,
        }),
      ]),
    ).toBe('CON_AVISOS');
  });

  it('SIN_DATOS si nada se pudo medir', () => {
    expect(
      verdictOf([
        result({ status: 'SIN_DATO', covered: null, denominator: null }),
      ]),
    ).toBe('SIN_DATOS');
    expect(verdictOf([])).toBe('SIN_DATOS');
  });
});

describe('evaluateFit', () => {
  it('con entradas coherentes: AJUSTADA salvo la mutabilidad, que se informa NO_DECLARADO sin fallar', () => {
    const r = evaluateFit(baseInputs(), DEFAULT_FIT_CHECKS);
    expect(r.verdict).toBe('AJUSTADA');
    expect(r.blindSpots).toEqual(['FIT-MUT-001']);
    const mut = r.dimensions.find((d) => d.dimension === 'MUTABILITY');
    expect(mut).toMatchObject({
      status: 'NO_DECLARADO',
      covered: null,
      denominator: null,
      ratio: null,
    });
    expect(r.dimensions.map((d) => d.dimension)).toEqual([
      'ROUTES',
      'MODEL',
      'COMPLETENESS',
      'FRESHNESS',
      'MUTABILITY',
      'SENSITIVITY',
    ]);
    expect(r.evaluatedAt).toBe(NOW.toISOString());
    expect(r.fingerprints.routesInCode).toBe(r.fingerprints.routesInInventory);
    expect(r.fingerprints.routesInCode).toBe(r.fingerprints.routesImported);
  });

  it('un desajuste real desajusta el catálogo y se ve en su dimensión', () => {
    const r = evaluateFit(
      baseInputs({
        routes: available([
          route('GET', '/things'),
          route('POST', '/things/:id/do'),
          route('GET', '/new'),
        ]),
        liveObjects: available([liveObject('app', 'things')]),
      }),
      DEFAULT_FIT_CHECKS,
    );
    expect(r.verdict).toBe('DESAJUSTADA');
    const rutas = r.dimensions.find((d) => d.dimension === 'ROUTES')!;
    expect(rutas.checksFailed).toBeGreaterThan(0);
    expect(rutas.ratio).toBeLessThan(1);
    expect(r.fingerprints.routesInCode).not.toBe(
      r.fingerprints.routesInInventory,
    );
  });

  it('todas las fuentes caídas: SIN_DATOS, todas las dimensiones sin puntaje y ningún cero inventado', () => {
    const caida = unavailable<never>('falló la lectura (Error)');
    const r = evaluateFit(
      baseInputs({
        routes: caida,
        operations: caida,
        staticTables: caida,
        ormDrift: caida,
        deployedDbDrift: caida,
        liveObjects: caida,
        scan: caida,
        importedOperations: caida,
        mutability: caida,
      }),
      DEFAULT_FIT_CHECKS,
    );
    expect(r.verdict).toBe('SIN_DATOS');
    for (const d of r.dimensions)
      expect([d.covered, d.denominator, d.ratio]).toEqual([null, null, null]);
    expect(r.blindSpots).toHaveLength(DEFAULT_FIT_CHECKS.length);
    expect(r.fingerprints).toEqual({
      routesInCode: null,
      routesInInventory: null,
      routesImported: null,
    });
  });

  it('un par de operaciones vacías no es «sin desajuste»: el inventario vacío contra rutas reales falla', () => {
    const r = evaluateFit(
      baseInputs({ operations: available([]) }),
      DEFAULT_FIT_CHECKS,
    );
    expect(r.verdict).toBe('DESAJUSTADA');
    expect(r.checks.find((c) => c.id === 'FIT-COM-001')?.status).toBe(
      'NO_APLICA',
    );
    expect(operation('GET', '/x').id).toBeTruthy();
  });
});
