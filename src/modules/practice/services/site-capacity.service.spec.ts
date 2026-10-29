import { PreconditionFailedException } from '../../../common';
import {
  CAPACITY_DERIVATIONS,
  FUNCTIONS,
  REGULATORY,
} from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import { SiteCapacityService } from './site-capacity.service';
import {
  TENANT_A,
  actor,
  makeSite,
  mockFn,
  ruleSet,
} from './infrastructure.testing';

const kind = (code: string) => REGULATORY.capacityKind.byInput(code)!.id;
const decl = (
  code: string,
  quantity: number,
  asOf: string,
  extra: Record<string, unknown> = {},
): any => ({
  capacityKindConceptId: kind(code),
  quantity,
  asOf: new Date(asOf),
  validTo: undefined,
  resolutionNumber: undefined,
  ...extra,
});

function build(
  declared: any[] = [],
  derivedCounts: Record<string, number> = {},
  site = makeSite(),
  activeFunctions: string[] = [],
) {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn(async (sql: string) => {
      if (sql.includes('count(*) filter')) {
        const row: Record<string, number> = {};
        Object.keys(CAPACITY_DERIVATIONS).forEach(
          (k, i) => (row[`k${i}`] = derivedCounts[k] ?? 0),
        );
        return [row];
      }
      return activeFunctions.map((fn) => ({ fn: FUNCTIONS.byInput(fn)!.id }));
    }),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const context = {
    site: mockFn().mockResolvedValue({
      site,
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
  };
  const declaredRepo = {
    findBySite: mockFn().mockResolvedValue(declared),
    create: mockFn((_tx: any, data: any) => ({ id: 'd-new', ...data })),
  };
  const rulesRepo = { loadRuleSet: mockFn().mockResolvedValue(ruleSet()) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const service = new SiteCapacityService(
    em as any,
    context as any,
    declaredRepo as any,
    rulesRepo as any,
    events as any,
  );
  return { service, tx, declaredRepo, events };
}

describe('SiteCapacityService.get', () => {
  it('INV-20: 40 camas derivadas y 50 declaradas dan la brecha {CAP_BEDS_CENSABLE, declared 50, derived 40}', async () => {
    const d = build(
      [
        decl('CAP_BEDS_CENSABLE', 50, '2026-09-01', {
          resolutionNumber: 'RES-1',
        }),
      ],
      { CAP_BEDS_CENSABLE: 40 },
    );
    const res = await d.service.get('s1', actor);
    expect(res.declared).toEqual([
      {
        kindCode: 'CAP_BEDS_CENSABLE',
        quantity: 50,
        asOf: '2026-09-01',
        resolutionNumber: 'RES-1',
      },
    ]);
    expect(res.derived.find((x) => x.kindCode === 'CAP_BEDS_CENSABLE')).toEqual(
      { kindCode: 'CAP_BEDS_CENSABLE', quantity: 40 },
    );
    expect(res.gaps).toEqual([
      { kindCode: 'CAP_BEDS_CENSABLE', declared: 50, derived: 40 },
    ]);
    expect(res.derived).toHaveLength(7);
  });

  it('una activación más sube la derivada a 41 sin tocar ningún contador', async () => {
    const d = build([decl('CAP_BEDS_CENSABLE', 50, '2026-09-01')], {
      CAP_BEDS_CENSABLE: 41,
    });
    const res = await d.service.get('s1', actor);
    expect(res.gaps[0]).toMatchObject({ derived: 41 });
  });

  it('sin brecha no se reporta; lo no declarado no es brecha; la declarada futura o vencida no vale', async () => {
    const igual = build([decl('CAP_BEDS_CENSABLE', 10, '2026-09-01')], {
      CAP_BEDS_CENSABLE: 10,
      CAP_OPERATING_ROOMS: 3,
    });
    expect((await igual.service.get('s1', actor)).gaps).toEqual([]);
    const futura = build([
      decl('CAP_BEDS_CENSABLE', 99, '2099-01-01'),
      decl('CAP_CONSULTING_ROOMS', 5, '2020-01-01', {
        validTo: new Date('2021-01-01'),
      }),
    ]);
    expect((await futura.service.get('s1', actor)).declared).toEqual([]);
  });

  it('de varias declaraciones del mismo tipo vale la más reciente (no se sobrescribe, se agrega)', async () => {
    // `findBySite` ya devuelve de la más reciente a la más vieja.
    const d = build(
      [
        decl('CAP_BEDS_CENSABLE', 2, '2026-10-01'),
        decl('CAP_BEDS_CENSABLE', 50, '2026-09-01'),
      ],
      { CAP_BEDS_CENSABLE: 2 },
    );
    const res = await d.service.get('s1', actor);
    expect(res.declared).toHaveLength(1);
    expect(res.declared[0].quantity).toBe(2);
    expect(res.gaps).toEqual([]);
  });

  it('la derivación sale de datos: una sola consulta con un FILTER por tipo y los ids como parámetros, no como texto', async () => {
    const d = build();
    await d.service.get('s1', actor);
    const [sql, params] = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('count(*) filter'),
    )!;
    expect(String(sql).match(/count\(\*\) filter/g)).toHaveLength(
      Object.keys(CAPACITY_DERIVATIONS).length,
    );
    expect(sql).toContain('censable is true');
    expect(sql).toContain('censable is not true');
    expect(sql).not.toContain(PRAC.SPACE_ACTIVE);
    expect(params.slice(-2)).toEqual(['s1', PRAC.SPACE_ACTIVE]);
  });

  it('TYPO_REQUIRED: un hospital sin box, internación ni quirófano activos lo advierte (no bloquea); con el box deja de advertir', async () => {
    const hospital = makeSite({
      facilityTypologyConceptId: REGULATORY.typology.byInput(
        'TYPOLOGY_HOSPITAL_L2',
      )!.id,
    });
    const sin = await build([], {}, hospital, []).service.get('s1', actor);
    expect(sin.warnings.map((w) => w.functionCode).sort()).toEqual([
      'SPACE_FN_EMERGENCY_BOX',
      'SPACE_FN_INPATIENT_ROOM',
      'SPACE_FN_OPERATING_ROOM',
    ]);
    expect(sin.warnings[0]).toMatchObject({
      kind: 'TYPOLOGY_REQUIRED_MISSING',
      typologyCode: 'TYPOLOGY_HOSPITAL_L2',
    });
    const con = await build([], {}, hospital, [
      'SPACE_FN_EMERGENCY_BOX',
    ]).service.get('s1', actor);
    expect(con.warnings.map((w) => w.functionCode)).not.toContain(
      'SPACE_FN_EMERGENCY_BOX',
    );
    expect((await build().service.get('s1', actor)).warnings).toEqual([]);
  });
});

describe('SiteCapacityService.declare', () => {
  it('agrega la declaración con tenant y fecha de corte, y publica', async () => {
    const d = build();
    const res = await d.service.declare(
      's1',
      {
        capacityKindCode: 'CAP_BEDS_CENSABLE',
        quantity: 50,
        asOf: '2026-09-01',
        resolutionNumber: ' RES-1 ',
      },
      actor,
      'req-1',
    );
    expect(d.declaredRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT_A,
        practiceSiteId: 's1',
        capacityKindConceptId: kind('CAP_BEDS_CENSABLE'),
        quantity: 50,
        resolutionNumber: 'RES-1',
      }),
    );
    expect(res).toMatchObject({
      kindCode: 'CAP_BEDS_CENSABLE',
      quantity: 50,
      asOf: '2026-09-01',
    });
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.site.declared_capacity_recorded',
        correlationId: 'req-1',
      }),
    );
  });

  it('un tipo inventado o una vigencia al revés son 422', async () => {
    const d = build();
    const error = await d.service
      .declare(
        's1',
        { capacityKindCode: 'CAP_NADA', quantity: 1, asOf: '2026-09-01' },
        actor,
      )
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect((error as any).reason).toBe(
      PracticeErrorReason.CATALOG_CODE_INVALID,
    );
    await expect(
      d.service.declare(
        's1',
        {
          capacityKindCode: 'CAP_BEDS_CENSABLE',
          quantity: 1,
          asOf: '2026-09-01',
          validTo: '2026-01-01',
        },
        actor,
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.VALIDITY_RANGE_INVALID,
    });
    expect(d.declaredRepo.create).not.toHaveBeenCalled();
  });
});
