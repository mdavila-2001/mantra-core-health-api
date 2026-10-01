import { jest } from '@jest/globals';
import { MedicineCatalogRepository } from './medicine-catalog.repository';
import { MEDICINE_PROPERTY } from '../pharmacy-catalog.properties';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const prop = (conceptId: string, propertyCode: string, valueJson: unknown) => ({
  conceptId,
  propertyCode,
  valueJson,
});

/** EM controlado: `execute` devuelve los ids, `find` devuelve conceptos y propiedades según la entidad. */
function build(
  executeRows: { id: string }[] = [],
  concepts: any[] = [],
  properties: any[] = [],
) {
  const em = {
    execute: mockFn().mockResolvedValue(executeRows),
    find: mockFn((entity: { name: string }) =>
      Promise.resolve(
        entity.name === 'CatalogConcepts' ? concepts : properties,
      ),
    ),
  };
  return { em, repo: new MedicineCatalogRepository() };
}

const CONCEPT = {
  id: 'c1',
  code: '60885',
  display: 'DALSYDOL 400 MG COMPRIMIDOS',
};

const FULL_PROPS = [
  prop('c1', MEDICINE_PROPERTY.SOURCE, 'cima'),
  prop('c1', MEDICINE_PROPERTY.SOURCE_NAME, 'CIMA — AEMPS'),
  prop('c1', MEDICINE_PROPERTY.HOLDER, 'Laboratorio Stada S.L.'),
  prop('c1', MEDICINE_PROPERTY.STRENGTH, '400 mg'),
  prop('c1', MEDICINE_PROPERTY.DOSAGE_FORM, 'COMPRIMIDO'),
  prop('c1', MEDICINE_PROPERTY.REQUIRES_PRESCRIPTION, true),
  prop('c1', MEDICINE_PROPERTY.INGREDIENTS, [
    { name: 'IBUPROFENO', amount: '400', unit: 'mg' },
  ]),
  prop('c1', MEDICINE_PROPERTY.ATC, ['M01AE01']),
  prop('c1', MEDICINE_PROPERTY.PRESENTATIONS, [
    { code: '700001', name: 'x', gtin: null, active: true },
  ]),
  prop('c1', MEDICINE_PROPERTY.REGULATORY_STATUS, 'ACTIVE'),
  prop('c1', MEDICINE_PROPERTY.SELECTABLE, true),
  prop('c1', MEDICINE_PROPERTY.PHOTOS, [
    { url: 'u', thumbUrl: 't', attribution: 'AEMPS' },
  ]),
];

describe('MedicineCatalogRepository', () => {
  describe('findProductById', () => {
    it('returns null for an id that is not in a medicines code system', async () => {
      const d = build([]);
      await expect(
        d.repo.findProductById(d.em as any, 'nope'),
      ).resolves.toBeNull();
      expect(d.em.find).not.toHaveBeenCalled();
    });

    it('rebuilds the product from the concept and its properties', async () => {
      const d = build([{ id: 'c1' }], [CONCEPT], FULL_PROPS);
      const product = await d.repo.findProductById(d.em as any, 'c1');
      expect(product).toMatchObject({
        id: 'c1',
        source: 'cima',
        code: '60885',
        display: 'DALSYDOL 400 MG COMPRIMIDOS',
        holder: 'Laboratorio Stada S.L.',
        strengthText: '400 mg',
        requiresPrescription: true,
        atc: ['M01AE01'],
        regulatoryStatus: 'ACTIVE',
        selectable: true,
        photo: { url: 'u', thumbUrl: 't', attribution: 'AEMPS' },
      });
      expect(product?.activeIngredients).toEqual([
        { name: 'IBUPROFENO', amount: '400', unit: 'mg' },
      ]);
    });

    it('does not assume a product is selectable when the property is missing', async () => {
      const d = build(
        [{ id: 'c1' }],
        [CONCEPT],
        [prop('c1', MEDICINE_PROPERTY.SOURCE, 'cima')],
      );
      const product = await d.repo.findProductById(d.em as any, 'c1');
      expect(product?.selectable).toBe(false);
      expect(product?.regulatoryStatus).toBe('INACTIVE');
      expect(product?.requiresPrescription).toBeNull();
      expect(product?.activeIngredients).toEqual([]);
    });
  });

  describe('search', () => {
    it('asks for one more row than the limit and reports truncation', async () => {
      const d = build(
        [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }],
        [CONCEPT],
        FULL_PROPS,
      );
      const page = await d.repo.search(d.em as any, { text: 'ibu', limit: 2 });
      const params = d.em.execute.mock.calls[0][1];
      expect(params.at(-1)).toBe(3);
      expect(page.truncated).toBe(true);
      expect(d.em.find).toHaveBeenCalledTimes(2);
    });

    it('is not truncated when the rows fit', async () => {
      const d = build([{ id: 'c1' }], [CONCEPT], FULL_PROPS);
      const page = await d.repo.search(d.em as any, { text: 'ibu', limit: 5 });
      expect(page.truncated).toBe(false);
      expect(page.items).toHaveLength(1);
    });

    it('treats % and _ typed by the user as letters, not wildcards', async () => {
      const d = build([]);
      await d.repo.search(d.em as any, { text: '50%_x', limit: 5 });
      const params = d.em.execute.mock.calls[0][1];
      expect(params).toContain('%50\\%\\_x%');
    });

    it('restricts the code systems to the requested source', async () => {
      const d = build([]);
      await d.repo.search(d.em as any, {
        text: 'ibu',
        source: 'invima',
        limit: 5,
      });
      expect(d.em.execute.mock.calls[0][1][0]).toEqual(['invima-medicamentos']);
    });

    it('does not hit the properties table when there is nothing to hydrate', async () => {
      const d = build([]);
      const page = await d.repo.search(d.em as any, { text: 'zzz', limit: 5 });
      expect(page).toEqual({ items: [], truncated: false });
      expect(d.em.find).not.toHaveBeenCalled();
    });
  });

  describe('findVademecumConceptIdByAtc', () => {
    it('returns null without querying when there is no ATC', async () => {
      const d = build();
      await expect(
        d.repo.findVademecumConceptIdByAtc(d.em as any, []),
      ).resolves.toBeNull();
      expect(d.em.execute).not.toHaveBeenCalled();
    });

    it('matches the ATC by exact code against the vademecum code system', async () => {
      const d = build([{ id: 'vad-1' }]);
      await expect(
        d.repo.findVademecumConceptIdByAtc(d.em as any, ['M01AE01']),
      ).resolves.toBe('vad-1');
      expect(d.em.execute.mock.calls[0][1]).toEqual(['vademecum', ['M01AE01']]);
    });

    it('returns null when no vademecum concept has that ATC', async () => {
      const d = build([]);
      await expect(
        d.repo.findVademecumConceptIdByAtc(d.em as any, ['X99XX99']),
      ).resolves.toBeNull();
    });
  });
});
