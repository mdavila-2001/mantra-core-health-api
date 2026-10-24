import { jest } from '@jest/globals';
import { MedicineCatalogSearchService } from './medicine-catalog-search.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const fork = { fork: true };
  const em = { fork: mockFn().mockReturnValue(fork) };
  const catalogRepo = {
    search: mockFn().mockResolvedValue({
      items: [{ id: 'a' }],
      truncated: true,
    }),
  };
  const service = new MedicineCatalogSearchService(
    em as any,
    catalogRepo as any,
  );
  return { service, em, fork, catalogRepo };
}

describe('MedicineCatalogSearchService', () => {
  it('searches over a fork and returns the page with the effective limit', async () => {
    const d = build();
    const page = await d.service.search({
      search: 'ibuprofeno',
      atc: 'M01AE01',
      limit: 5,
    } as any);
    expect(d.em.fork).toHaveBeenCalledTimes(1);
    expect(d.catalogRepo.search).toHaveBeenCalledWith(d.fork, {
      text: 'ibuprofeno',
      source: undefined,
      atc: 'M01AE01',
      limit: 5,
    });
    expect(page).toEqual({ items: [{ id: 'a' }], limit: 5, truncated: true });
  });

  it('uses the default limit when none is given', async () => {
    const d = build();
    const page = await d.service.search({} as any);
    expect(page.limit).toBe(20);
  });
});
