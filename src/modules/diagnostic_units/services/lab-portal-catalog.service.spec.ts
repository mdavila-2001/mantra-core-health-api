import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import {
  DiagnosticPriceSchedules,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnits,
} from '../entities';
import {
  DiagnosticPriceSchedulesRepository,
  DiagnosticStudyComponentsRepository,
  DiagnosticStudyOfferingsRepository,
  DiagnosticStudyPricesRepository,
  DiagnosticUnitsRepository,
} from '../repositories';
import { DiagnosticStudiesService } from './diagnostic-studies.service';
import { DiagnosticUnitScopeService } from './diagnostic-unit-scope.service';
import { LabPortalCatalogService } from './lab-portal-catalog.service';
import { LabPortalContextService } from './lab-portal-context.service';
import { LabPortalImportService } from './lab-portal-import.service';
import { LabPortalPricingService } from './lab-portal-pricing.service';
import { LabPortalWriterService } from './lab-portal-writer.service';

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';
const T3 = '33333333-3333-4333-8333-333333333333';
const actor = { id: 'user-1', roles: ['USER'] } as any;

type Row = Record<string, any>;

/** In-memory EntityManager: equality / `$in` / null filters, enough for these services. */
class FakeEm {
  readonly store = new Map<unknown, Row[]>();
  flush = jest.fn(async () => undefined);
  rows(entity: unknown): Row[] {
    if (!this.store.has(entity)) this.store.set(entity, []);
    return this.store.get(entity)!;
  }
  private matches(row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && '$in' in value)
        return (value.$in as unknown[]).includes(row[key]);
      if (value === null) return row[key] == null;
      return row[key] === value;
    });
  }
  findOne = async (entity: unknown, where: Row) =>
    this.rows(entity).find((r) => this.matches(r, where)) ?? null;
  find = async (entity: unknown, where: Row, opts?: Row) => {
    const found = this.rows(entity).filter((r) => this.matches(r, where));
    if (opts?.orderBy?.versionNumber === 'DESC')
      found.sort((a, b) => b.versionNumber - a.versionNumber);
    return opts?.limit ? found.slice(0, opts.limit) : found;
  };
  create = (entity: new () => Row, data: Row) => {
    const row = Object.assign(new entity(), data);
    this.rows(entity).push(row);
    return row;
  };
  fork = () => this;
  transactional = async (cb: (tx: FakeEm) => unknown) => cb(this);
}

function build() {
  const em = new FakeEm();
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const readRepo = {
    findCurrentPublicSchedules: async (_: unknown, unitId: string) =>
      em
        .rows(DiagnosticPriceSchedules)
        .filter(
          (s) =>
            s.diagnosticUnitId === unitId &&
            s.publicVisibility &&
            s.statusConceptId === DUNIT.SCHEDULE_ACTIVE,
        ),
    findCurrentPrices: async (
      _: unknown,
      scheduleIds: string[],
      offeringIds: string[],
    ) =>
      em
        .rows(DiagnosticStudyPrices)
        .filter(
          (p) =>
            scheduleIds.includes(p.priceScheduleId) &&
            offeringIds.includes(p.diagnosticStudyOfferingId) &&
            p.statusConceptId === DUNIT.PRICE_ACTIVE,
        ),
    findConcepts: async () => [],
  };
  const offeringsRepo = new DiagnosticStudyOfferingsRepository();
  const scope = new DiagnosticUnitScopeService(
    new DiagnosticUnitsRepository(),
    {} as any,
    {} as any,
    {} as any,
    offeringsRepo,
    {} as any,
    {} as any,
  );
  const studies = new DiagnosticStudiesService(
    em as any,
    scope,
    offeringsRepo,
    new DiagnosticStudyComponentsRepository(),
    logger as any,
  );
  const context = new LabPortalContextService(readRepo as any);
  const pricing = new LabPortalPricingService(
    new DiagnosticPriceSchedulesRepository(),
    new DiagnosticStudyPricesRepository(),
  );
  const writer = new LabPortalWriterService(context, offeringsRepo, pricing);
  const catalog = new LabPortalCatalogService(
    em as any,
    context,
    writer,
    studies,
    logger as any,
  );
  const importer = new LabPortalImportService(
    em as any,
    context,
    writer,
    logger as any,
  );
  for (const [tenantId, code] of [
    [T1, 'LAB1'],
    [T2, 'LAB2'],
  ]) {
    em.create(DiagnosticUnits as any, {
      tenantId,
      code,
      statusConceptId: DUNIT.UNIT_ACTIVE,
      createdAt: new Date(),
    });
  }
  return { em, catalog, importer };
}

const inT = <T>(tenantId: string, fn: () => Promise<T>) =>
  runWithTenant(tenantId, fn);
const draft = (code: string, extra: Row = {}) =>
  ({ code, name: `Estudio ${code}`, price: '45', ...extra }) as any;

describe('LabPortalCatalogService', () => {
  it('creates a published offering with its first price on a public BOB list', async () => {
    const { em, catalog } = build();
    const created = await inT(T1, () =>
      catalog.create(
        draft('HEMO', { alovidaDiscountPercent: 10, turnaroundHours: 4 }),
        actor,
      ),
    );
    expect(created).toMatchObject({
      code: 'HEMO',
      price: '45.00',
      alovidaDiscountPercent: 10,
      alovidaPrice: '40.50',
      status: 'PUBLISHED',
      turnaroundHours: 4,
      categoryId: null,
      available: true,
    });
    const offering = em.rows(DiagnosticStudyOfferings)[0];
    expect(offering.statusConceptId).toBe(DUNIT.OFFERING_ACTIVE);
    expect(offering.studyConceptId).toBe(DUNIT.STUDY_GENERIC);
    expect(offering.expectedTurnaroundMinutes).toBe(240);
    const [schedule] = em.rows(DiagnosticPriceSchedules);
    expect(schedule).toMatchObject({
      code: 'TARIFARIO_LAB1',
      publicVisibility: true,
      statusConceptId: DUNIT.SCHEDULE_ACTIVE,
    });
    expect(em.rows(DiagnosticStudyPrices)[0]).toMatchObject({
      versionNumber: 1,
      baseAmount: '45.00',
      discountFactor: '0.1000',
      statusConceptId: DUNIT.PRICE_ACTIVE,
    });
  });

  it('numbers price versions per schedule, not per offering (unique index)', async () => {
    const { em, catalog } = build();
    await inT(T1, () => catalog.create(draft('A'), actor));
    await inT(T1, () => catalog.create(draft('B', { status: 'DRAFT' }), actor));
    expect(em.rows(DiagnosticPriceSchedules)).toHaveLength(1);
    expect(em.rows(DiagnosticStudyPrices).map((p) => p.versionNumber)).toEqual([
      1, 2,
    ]);
  });

  it('rejects a repeated code (case-insensitive), a category and unavailability', async () => {
    const { catalog } = build();
    await inT(T1, () => catalog.create(draft('HEMO'), actor));
    await expect(
      inT(T1, () => catalog.create(draft('hemo'), actor)),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      inT(T1, () => catalog.create(draft('X', { categoryId: T3 }), actor)),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    await expect(
      inT(T1, () => catalog.create(draft('Y', { available: false }), actor)),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('lists without withdrawn by default and filters by text and status', async () => {
    const { catalog } = build();
    const a = await inT(T1, () =>
      catalog.create({ ...draft('GLU'), name: 'Glucosa en ayunas' }, actor),
    );
    await inT(T1, () =>
      catalog.create(
        { ...draft('HEMO'), name: 'Hemograma', status: 'DRAFT' },
        actor,
      ),
    );
    await inT(T1, () => catalog.withdraw(a.id, actor));
    const list = (q: Row) => inT(T1, () => catalog.list(q));
    expect((await list({})).items.map((i) => i.code)).toEqual(['HEMO']);
    expect(
      (await list({ status: 'WITHDRAWN' })).items.map((i) => i.code),
    ).toEqual(['GLU']);
    expect((await list({ q: 'hemogr' })).count).toBe(1);
    expect((await list({ categoryId: T3 })).count).toBe(0);
    expect((await list({ available: false })).count).toBe(0);
  });

  it('versions the price on change and leaves it alone when only text changes', async () => {
    const { em, catalog } = build();
    const s = await inT(T1, () => catalog.create(draft('HEMO'), actor));
    const renamed = await inT(T1, () =>
      catalog.update(s.id, { name: 'Hemograma completo' } as any, actor),
    );
    expect(renamed.name).toBe('Hemograma completo');
    expect(em.rows(DiagnosticStudyPrices)).toHaveLength(1);
    const repriced = await inT(T1, () =>
      catalog.update(
        s.id,
        { price: '50', alovidaDiscountPercent: 20 } as any,
        actor,
      ),
    );
    expect(repriced).toMatchObject({ price: '50.00', alovidaPrice: '40.00' });
    const [old, current] = em.rows(DiagnosticStudyPrices);
    expect(old).toMatchObject({
      statusConceptId: DUNIT.PRICE_SUPERSEDED,
      baseAmount: '45.00',
    });
    expect(old.effectiveTo).toBeInstanceOf(Date);
    expect(current).toMatchObject({
      statusConceptId: DUNIT.PRICE_ACTIVE,
      versionNumber: 2,
    });
  });

  it('withdraws without deleting', async () => {
    const { em, catalog } = build();
    const s = await inT(T1, () => catalog.create(draft('HEMO'), actor));
    const withdrawn = await inT(T1, () => catalog.withdraw(s.id, actor));
    expect(withdrawn.status).toBe('WITHDRAWN');
    expect(em.rows(DiagnosticStudyOfferings)[0].statusConceptId).toBe(
      DUNIT.OFFERING_RETIRED,
    );
  });

  it('isolates tenants: another lab’s service is a 404 and is never listed', async () => {
    const { catalog } = build();
    const foreign = await inT(T2, () => catalog.create(draft('HEMO'), actor));
    expect((await inT(T1, () => catalog.list({}))).count).toBe(0);
    await expect(
      inT(T1, () => catalog.update(foreign.id, { name: 'x' } as any, actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(
      inT(T1, () => catalog.withdraw(foreign.id, actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    // Same code in another lab is not a clash.
    await expect(
      inT(T1, () => catalog.create(draft('HEMO'), actor)),
    ).resolves.toBeDefined();
    await expect(inT(T3, () => catalog.list({}))).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('answers categories honestly: none exist and none can be stored', async () => {
    const { catalog } = build();
    expect(await inT(T1, () => catalog.listCategories())).toEqual({
      items: [],
      count: 0,
    });
    await expect(
      inT(T1, () => catalog.createCategory()),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    await expect(
      inT(T1, () => catalog.categoryNotFound()),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('LabPortalImportService', () => {
  it('creates, updates, keeps and rejects row by row (CREATE_OR_UPDATE)', async () => {
    const { em, catalog, importer } = build();
    await inT(T1, () => catalog.create(draft('HEMO'), actor));
    await inT(T1, () => catalog.create(draft('GLU'), actor));
    const result = await inT(T1, () =>
      importer.import(
        {
          mode: 'CREATE_OR_UPDATE',
          rows: [
            { line: 2, service: draft('NEW', { turnaroundHours: 24 }) },
            { line: 3, service: draft('hemo', { price: '60' }) },
            { line: 4, service: draft('GLU') },
            { line: 5, service: draft('NEW') },
            { line: 6, service: draft('BAD', { price: '-1' }) },
            { line: 7, service: draft('ODD', { color: 'red' }) },
          ],
        } as any,
        actor,
      ),
    );
    expect(result).toMatchObject({
      created: 1,
      updated: 1,
      unchanged: 1,
      rejected: 3,
    });
    expect(result.rows.map((r) => [r.line, r.outcome])).toEqual([
      [2, 'CREATED'],
      [3, 'UPDATED'],
      [4, 'UNCHANGED'],
      [5, 'REJECTED'],
      [6, 'REJECTED'],
      [7, 'REJECTED'],
    ]);
    expect(result.rows[3].reason).toMatch(/repite/);
    expect(result.rows[4].reason).toMatch(/precio/);
    expect(result.rows[5].reason).toMatch(/color/);
    expect(em.rows(DiagnosticStudyOfferings)).toHaveLength(3);
    expect(
      new Set(em.rows(DiagnosticStudyPrices).map((p) => p.versionNumber)).size,
    ).toBe(4);
  });

  it('UPDATE_ONLY rejects unknown codes and revives a withdrawn one as published', async () => {
    const { em, catalog, importer } = build();
    const s = await inT(T1, () => catalog.create(draft('HEMO'), actor));
    await inT(T1, () => catalog.withdraw(s.id, actor));
    const result = await inT(T1, () =>
      importer.import(
        {
          mode: 'UPDATE_ONLY',
          rows: [
            { line: 1, service: draft('HEMO') },
            { line: 2, service: draft('NOPE') },
          ],
        } as any,
        actor,
      ),
    );
    expect(result.rows.map((r) => r.outcome)).toEqual(['UPDATED', 'REJECTED']);
    expect(result.rows[1].reason).toMatch(/sólo actualizar/);
    expect(em.rows(DiagnosticStudyOfferings)[0].statusConceptId).toBe(
      DUNIT.OFFERING_ACTIVE,
    );
  });

  it('matches codes only inside the active tenant', async () => {
    const { em, catalog, importer } = build();
    await inT(T2, () => catalog.create(draft('HEMO'), actor));
    const result = await inT(T1, () =>
      importer.import(
        {
          mode: 'UPDATE_ONLY',
          rows: [{ line: 1, service: draft('HEMO', { price: '1' }) }],
        } as any,
        actor,
      ),
    );
    expect(result.rejected).toBe(1);
    expect(em.rows(DiagnosticStudyPrices)[0].baseAmount).toBe('45.00');
  });
});
