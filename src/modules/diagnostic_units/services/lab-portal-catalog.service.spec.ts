import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import {
  DiagnosticPriceSchedules,
  DiagnosticServiceCategories,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnits,
} from '../entities';
import {
  T1,
  T2,
  T3,
  actor,
  build,
  draft,
  inT,
  type Row,
} from './lab-portal.testing';

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

  it('lists a registration modality placeholder as MODALITY with no price, and refuses to price it', async () => {
    const { em, catalog } = build();
    const unit = em.rows(DiagnosticUnits).find((u) => u.tenantId === T1)!;
    const placeholder = em.create(DiagnosticStudyOfferings as any, {
      id: 'placeholder-xray',
      diagnosticUnitId: unit.id,
      studyCode: 'MODALITY_XRAY',
      studyConceptId: DUNIT.STUDY_GENERIC,
      modalityConceptId: DUNIT.MODALITY_XRAY,
      displayName: 'Rayos X',
      statusConceptId: DUNIT.OFFERING_ACTIVE,
      updatedAt: new Date(),
    });
    await inT(T1, () => catalog.create(draft('RX-TORAX'), actor));

    const page = await inT(T1, () => catalog.list({}));
    expect(page.items.map((s) => [s.code, s.kind, s.price])).toEqual([
      ['RX-TORAX', 'SERVICE', '45.00'],
      ['MODALITY_XRAY', 'MODALITY', null],
    ]);

    await expect(
      inT(T1, () =>
        catalog.update(String(placeholder.id), { price: '120' } as any, actor),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    // Text fields of the placeholder still change (description, status).
    const renamed = await inT(T1, () =>
      catalog.update(
        String(placeholder.id),
        { description: 'Equipo digital' } as any,
        actor,
      ),
    );
    expect(renamed).toMatchObject({
      description: 'Equipo digital',
      price: null,
    });
    expect(em.rows(DiagnosticStudyPrices)).toHaveLength(1);
  });

  it('rejects a repeated code (case-insensitive) and a category of another lab', async () => {
    const { em, catalog } = build();
    em.create(DiagnosticServiceCategories as any, {
      id: T3,
      diagnosticUnitId: 'unit-of-lab-2',
      name: 'Ajena',
    });
    await inT(T1, () => catalog.create(draft('HEMO'), actor));
    await expect(
      inT(T1, () => catalog.create(draft('hemo'), actor)),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      inT(T1, () => catalog.create(draft('X', { categoryId: T3 }), actor)),
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
    expect((await list({ available: true })).count).toBe(1);
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

  it('stores the category, the free-text sample type and "available today"', async () => {
    const { em, catalog, categories } = build();
    const lab = await inT(T1, () => categories.create('Hematología', actor));
    const created = await inT(T1, () =>
      catalog.create(
        draft('HEMO', {
          categoryId: lab.id,
          sampleType: '  Sangre venosa (tubo lila) ',
          available: false,
        }),
        actor,
      ),
    );
    expect(created).toMatchObject({
      categoryId: lab.id,
      categoryName: 'Hematología',
      sampleType: 'Sangre venosa (tubo lila)',
      available: false,
    });
    expect(em.rows(DiagnosticStudyOfferings)[0]).toMatchObject({
      serviceCategoryId: lab.id,
      specimenDescription: 'Sangre venosa (tubo lila)',
      available: false,
    });
  });

  it('reads the sample type from the text, then from the specimen concept', async () => {
    const SPECIMEN = 'specimen-concept-1';
    const { em, catalog } = build([{ id: SPECIMEN, display: 'Venous blood' }]);
    const s = await inT(T1, () => catalog.create(draft('HEMO'), actor));
    em.rows(DiagnosticStudyOfferings)[0].specimenTypeConceptId = SPECIMEN;
    const fallback = await inT(T1, () => catalog.list({}));
    expect(fallback.items[0].sampleType).toBe('Venous blood');
    const written = await inT(T1, () =>
      catalog.update(s.id, { sampleType: 'Orina de 24 h' } as any, actor),
    );
    expect(written.sampleType).toBe('Orina de 24 h');
    const cleared = await inT(T1, () =>
      catalog.update(s.id, { sampleType: ' ' } as any, actor),
    );
    expect(cleared.sampleType).toBe('Venous blood');
  });

  it('moves a service between categories, clears it, and toggles "available today"', async () => {
    const { em, catalog, categories } = build();
    const a = await inT(T1, () => categories.create('Hematología', actor));
    const b = await inT(T1, () => categories.create('Química', actor));
    const s = await inT(T1, () =>
      catalog.create(draft('GLU', { categoryId: a.id }), actor),
    );
    const moved = await inT(T1, () =>
      catalog.update(
        s.id,
        { categoryId: b.id, available: false } as any,
        actor,
      ),
    );
    expect(moved).toMatchObject({ categoryName: 'Química', available: false });
    const cleared = await inT(T1, () =>
      catalog.update(s.id, { categoryId: null, available: true } as any, actor),
    );
    expect(cleared).toMatchObject({
      categoryId: null,
      categoryName: null,
      available: true,
    });
    expect(
      em.rows(DiagnosticStudyOfferings)[0].serviceCategoryId,
    ).toBeUndefined();
    await expect(
      inT(T1, () => catalog.update(s.id, { categoryId: T2 } as any, actor)),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('filters the list by category and by availability', async () => {
    const { catalog, categories } = build();
    const lab = await inT(T1, () => categories.create('Hematología', actor));
    await inT(T1, () =>
      catalog.create(draft('A', { categoryId: lab.id }), actor),
    );
    await inT(T1, () =>
      catalog.create(draft('B', { available: false }), actor),
    );
    const list = (q: Record<string, unknown>) =>
      inT(T1, () => catalog.list(q)).then((r) => r.items.map((i) => i.code));
    expect(await list({ categoryId: lab.id })).toEqual(['A']);
    expect(await list({ available: false })).toEqual(['B']);
    expect(await list({ available: true })).toEqual(['A']);
  });
});
