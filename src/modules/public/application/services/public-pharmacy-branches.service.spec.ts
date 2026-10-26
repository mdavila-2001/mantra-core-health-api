import { jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../../common';
import { COMM } from '../../../community/community.concepts';
import { PublicPharmacyBranchesService } from './public-pharmacy-branches.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Todo sintético: tenant, sedes y productos no existen fuera de esta prueba. */
const TENANT = '0a0a0a0a-0000-4000-8000-000000000037';
const PHARMACY = {
  id: 'prof-far',
  tenantId: TENANT,
  targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
};

function site(id: string, siteName: string, lat: string | null) {
  return {
    siteId: id,
    siteName,
    pharmacyName: 'Farmacia Sintética',
    addressLines: null,
    city: 'Santa Cruz',
    latitude: lat,
    longitude: lat === null ? null : '-63.18',
    description: null,
    locationUrl: null,
  };
}

function build() {
  const em = { fork: mockFn(() => em) };
  const catalog = {
    findVisibleProfileBySlug: mockFn().mockResolvedValue(PHARMACY),
  };
  const repo = {
    findPublicSites: mockFn().mockResolvedValue([
      site('s-norte', 'Norte', '-17.70'),
      site('s-sur', 'Sur', '-17.85'),
    ]),
    findInStockMatches: mockFn().mockResolvedValue([]),
  };
  const service = new PublicPharmacyBranchesService(
    em as any,
    catalog as any,
    repo as any,
  );
  return { em, catalog, repo, service };
}

describe('PublicPharmacyBranchesService (P37)', () => {
  it('branches: las sedes del tenant de la ficha, con el slug de la ficha y sin isCurrent si son varias', async () => {
    const d = build();
    const page = await d.service.branches('farmacia-sintetica');

    expect(d.repo.findPublicSites).toHaveBeenCalledWith(d.em, TENANT, 200);
    expect(page.items.map((b) => [b.siteName, b.slug, b.isCurrent])).toEqual([
      ['Norte', 'farmacia-sintetica', false],
      ['Sur', 'farmacia-sintetica', false],
    ]);
    expect(page.nextCursor).toBeNull();
    expect(page.totalHint).toBe(2);
  });

  it('branches: una farmacia de una sola sede la marca como la de la ficha', async () => {
    const d = build();
    d.repo.findPublicSites.mockResolvedValue([site('s-1', 'Única', null)]);
    const page = await d.service.branches('farmacia-sintetica');
    expect(page.items).toHaveLength(1);
    expect(page.items[0].isCurrent).toBe(true);
  });

  it('un slug inexistente o de otro tipo es el mismo 404 y no consulta sedes', async () => {
    const d = build();
    d.catalog.findVisibleProfileBySlug.mockResolvedValueOnce(null);
    await expect(d.service.branches('no-existe')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    d.catalog.findVisibleProfileBySlug.mockResolvedValueOnce({
      ...PHARMACY,
      targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
    });
    await expect(
      d.service.availability('clinica', { items: ['x'] }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.repo.findPublicSites).not.toHaveBeenCalled();
  });

  it('availability: busca los renglones limpios en las sedes publicadas y ordena completas primero', async () => {
    const d = build();
    d.repo.findInStockMatches.mockResolvedValue([
      {
        siteId: 's-sur',
        productId: 'p-1',
        genericName: 'Paracetamol',
        brandName: null,
        strengthText: '500 mg',
        packageSizeText: null,
        searchText: 'Paracetamol 500 mg',
        price: '4.50',
        currency: 'BOB',
      },
    ]);

    const result = await d.service.availability('farmacia-sintetica', {
      items: ['Paracetamol', ' paracetamol ', ''],
      lat: -17.7,
      lng: -63.18,
    });

    expect(d.repo.findInStockMatches).toHaveBeenCalledWith(
      d.em,
      TENANT,
      ['s-norte', 's-sur'],
      ['Paracetamol'],
    );
    // Sur tiene todo aunque Norte esté más cerca: completa gana a cercana.
    expect(result.items.map((i) => [i.branch.siteName, i.complete])).toEqual([
      ['Sur', true],
      ['Norte', false],
    ]);
    expect(result.items[1].missing).toEqual(['Paracetamol']);
    expect(result.items[0].distanceKm).not.toBeNull();
    expect(result.count).toBe(2);
  });

  it('availability sin ubicación: sin distancias, la búsqueda sirve igual', async () => {
    const d = build();
    const result = await d.service.availability('farmacia-sintetica', {
      items: ['Ibuprofeno'],
    });
    expect(result.items.every((i) => i.distanceKm === null)).toBe(true);
    expect(result.items.every((i) => !i.complete)).toBe(true);
  });
});
