import { DUNIT } from '../diagnostic_units.concepts';
import {
  DiagnosticServiceCategories,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
} from '../entities';
import { T1, T2, actor, build, draft, inT } from './lab-portal.testing';

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

  it('files a row under its category and rejects a category of another lab', async () => {
    const { em, categories, importer } = build();
    const lab = await inT(T1, () => categories.create('Hematología', actor));
    em.create(DiagnosticServiceCategories as any, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      diagnosticUnitId: 'unit-of-lab-2',
      name: 'Ajena',
    });
    const result = await inT(T1, () =>
      importer.import(
        {
          mode: 'CREATE_OR_UPDATE',
          rows: [
            { line: 1, service: draft('OK', { categoryId: lab.id }) },
            {
              line: 2,
              service: draft('FOREIGN', {
                categoryId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              }),
            },
            { line: 3, service: draft('OFF', { available: false }) },
          ],
        } as any,
        actor,
      ),
    );
    expect(result.rows.map((r) => r.outcome)).toEqual([
      'CREATED',
      'REJECTED',
      'CREATED',
    ]);
    expect(result.rows[1].reason).toMatch(/categoría no existe/);
    const [ok, off] = em.rows(DiagnosticStudyOfferings);
    expect(ok.serviceCategoryId).toBe(lab.id);
    expect(off.available).toBe(false);
  });
});
