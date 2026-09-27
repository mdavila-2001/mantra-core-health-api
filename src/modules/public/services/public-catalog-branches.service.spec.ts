import { jest } from '@jest/globals';

// Fábrica de dobles laxa, igual que en el resto de los specs de servicio.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { BadRequestException } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { COMM } from '../../community/community.concepts';
import { PublicCatalogService } from './public-catalog.service';

/**
 * Sucursales de la cadena y la receta entre ellas (P37):
 * `GET /public/profiles/f/:slug/branches` y `/branch-availability`.
 *
 * Tres niveles: lo correcto (proyección, orden, casamiento), el límite
 * (sin cadena, sin renglones, sin coordenadas, sin precio) y lo inválido
 * (slug que no es farmacia, renglones de más, origen a medias).
 */
const TENANT = '0a0a0a0a-0000-4000-8000-000000000001';
const OTRO_TENANT = '0a0a0a0a-0000-4000-8000-000000000002';
const SEDE_CENTRO = '33333333-3333-4333-8333-000000000001';
const SEDE_NORTE = '33333333-3333-4333-8333-000000000002';
const SEDE_OTRA = '33333333-3333-4333-8333-000000000003';

const FARMACIA = {
  id: 'prof-far',
  tenantId: TENANT,
  targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
};

function sede(over: Record<string, unknown> = {}) {
  return {
    siteId: SEDE_CENTRO,
    siteName: 'Centro',
    pharmacyName: 'Farmacia Central',
    slug: 'farmacia-central',
    tenantId: TENANT,
    lines: 'Av. Siempre Viva 742',
    city: 'Santa Cruz',
    latitude: '-17.7833',
    longitude: '-63.1821',
    ...over,
  };
}

function stock(over: Record<string, unknown> = {}) {
  return {
    siteId: SEDE_CENTRO,
    productId: '44444444-4444-4444-8444-000000000001',
    genericName: 'Amoxicilina',
    brandName: 'Amoxil',
    strengthText: '500 mg',
    packageSizeText: 'caja x 21',
    price: '38.50',
    currency: 'BOB',
    ...over,
  };
}

function build() {
  const em = { fork: mockFn(() => em) };
  const repo = {
    findVisibleProfileBySlug: mockFn().mockResolvedValue(FARMACIA),
    findPharmacyBranches: mockFn().mockResolvedValue([]),
    findBranchStockMatches: mockFn().mockResolvedValue([]),
  };
  const service = new PublicCatalogService(em as any, repo as any);
  return { em, repo, service };
}

describe('PublicCatalogService · sucursales (P37)', () => {
  describe('pharmacyBranches — correcto', () => {
    it('proyecta campo por campo, con la farmacia mirada primero y la cadena después', async () => {
      const d = build();
      d.repo.findPharmacyBranches.mockResolvedValue([
        sede({
          siteId: SEDE_OTRA,
          siteName: 'Equipetrol',
          slug: 'farmacia-central-equipetrol',
          tenantId: OTRO_TENANT,
          city: 'Cochabamba',
        }),
        sede(),
      ]);

      const page = await d.service.pharmacyBranches('farmacia-central');

      expect(d.repo.findPharmacyBranches).toHaveBeenCalledWith(
        d.em,
        TENANT,
        200,
      );
      expect(page.items).toEqual([
        {
          id: SEDE_CENTRO,
          slug: 'farmacia-central',
          name: 'Farmacia Central · Centro',
          siteName: 'Centro',
          city: 'Santa Cruz',
          addressText: 'Av. Siempre Viva 742, Santa Cruz',
          phone: null,
          openingHours: null,
          location: { lat: -17.7833, lng: -63.1821 },
          locationAccuracy: null,
          isCurrent: true,
        },
        expect.objectContaining({
          id: SEDE_OTRA,
          slug: 'farmacia-central-equipetrol',
          isCurrent: false,
        }),
      ]);
      expect(page).toEqual(
        expect.objectContaining({ nextCursor: null, totalHint: 2 }),
      );
      // Nada interno sale: ni el tenant ni la farmacia.
      expect(Object.keys(page.items[0]!)).not.toContain('tenantId');
    });
  });

  describe('pharmacyBranches — límite', () => {
    it('una sede sin coordenadas ni dirección se lista igual, sin pin', async () => {
      const d = build();
      d.repo.findPharmacyBranches.mockResolvedValue([
        sede({ latitude: null, longitude: null, lines: null, city: null }),
      ]);
      const page = await d.service.pharmacyBranches('farmacia-central');
      expect(page.items[0]).toEqual(
        expect.objectContaining({
          location: null,
          addressText: null,
          city: null,
        }),
      );
    });

    it('una sede que se llama como la farmacia no se nombra dos veces', async () => {
      const d = build();
      d.repo.findPharmacyBranches.mockResolvedValue([
        sede({ siteName: 'farmacia central' }),
      ]);
      const page = await d.service.pharmacyBranches('farmacia-central');
      expect(page.items[0]!.name).toBe('Farmacia Central');
    });

    it('una farmacia sin sedes publicadas devuelve la página vacía, no un error', async () => {
      const d = build();
      const page = await d.service.pharmacyBranches('farmacia-central');
      expect(page.items).toEqual([]);
      expect(page.totalHint).toBe(0);
    });
  });

  describe('pharmacyBranches — inválido', () => {
    it('un slug de organización responde el mismo 404 que uno inexistente', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue({
        ...FARMACIA,
        targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
      });
      await expect(
        d.service.pharmacyBranches('clinica-norte'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.repo.findPharmacyBranches).not.toHaveBeenCalled();
    });
  });

  describe('branchAvailability — correcto', () => {
    it('casa todas las palabras sin tildes, elige el más barato y ordena completas y cercanas primero', async () => {
      const d = build();
      d.repo.findPharmacyBranches.mockResolvedValue([
        sede(),
        sede({
          siteId: SEDE_NORTE,
          siteName: 'Norte',
          latitude: '-17.70',
          longitude: '-63.16',
        }),
      ]);
      d.repo.findBranchStockMatches.mockResolvedValue([
        stock(),
        stock({
          productId: '44444444-4444-4444-8444-000000000002',
          brandName: null,
          price: '21.00',
        }),
        stock({
          productId: '44444444-4444-4444-8444-000000000003',
          genericName: 'Paracetamol',
          brandName: null,
          strengthText: '500 mg',
          packageSizeText: null,
          price: '4.50',
        }),
        stock({ siteId: SEDE_NORTE, price: '40.00' }),
      ]);

      const res = await d.service.branchAvailability('farmacia-central', {
        items: 'Amoxicilína 500|paracetamol',
        lat: -17.7,
        lng: -63.16,
      });

      // El filtro grueso va a la base con la palabra más larga de cada renglón.
      expect(d.repo.findBranchStockMatches).toHaveBeenCalledWith(
        d.em,
        [SEDE_CENTRO, SEDE_NORTE],
        ['amoxicilina', 'paracetamol'],
      );
      expect(res.count).toBe(2);
      const [primera, segunda] = res.items;
      expect(primera!.branch.id).toBe(SEDE_CENTRO);
      expect(primera!.complete).toBe(true);
      expect(primera!.matches).toEqual([
        {
          term: 'Amoxicilína 500',
          genericName: 'Amoxicilina',
          brandName: null,
          presentation: '500 mg · caja x 21',
          price: '21.00',
          currency: 'BOB',
        },
        expect.objectContaining({ term: 'paracetamol', price: '4.50' }),
      ]);
      expect(primera!.totalAmount).toBe('25.50');
      expect(segunda!.complete).toBe(false);
      expect(segunda!.missing).toEqual(['paracetamol']);
      expect(segunda!.distanceKm).toBe(0);
    });
  });

  describe('branchAvailability — límite', () => {
    it('sin renglones: cada sucursal aparece, nada completo y sin consultar stock', async () => {
      const d = build();
      d.repo.findPharmacyBranches.mockResolvedValue([sede()]);
      const res = await d.service.branchAvailability('farmacia-central', {});
      expect(d.repo.findBranchStockMatches).toHaveBeenCalledWith(
        d.em,
        [SEDE_CENTRO],
        [],
      );
      expect(res.items[0]).toEqual(
        expect.objectContaining({
          matches: [],
          missing: [],
          complete: false,
          totalAmount: null,
          distanceKm: null,
        }),
      );
    });

    it('un producto sin precio cuenta como tenido pero no suma; renglones repetidos se buscan una vez', async () => {
      const d = build();
      d.repo.findPharmacyBranches.mockResolvedValue([sede()]);
      d.repo.findBranchStockMatches.mockResolvedValue([
        stock({ price: null, currency: null }),
      ]);
      const res = await d.service.branchAvailability('farmacia-central', {
        items: 'amoxicilina| AMOXICILINA |',
      });
      expect(res.items[0]).toEqual(
        expect.objectContaining({
          complete: true,
          totalAmount: null,
          currency: null,
        }),
      );
      expect(res.items[0]!.matches).toHaveLength(1);
    });

    it('escapa los comodines de LIKE que alguien escriba', async () => {
      const d = build();
      d.repo.findPharmacyBranches.mockResolvedValue([sede()]);
      await d.service.branchAvailability('farmacia-central', {
        items: '100%_crema',
      });
      expect(d.repo.findBranchStockMatches.mock.calls[0][2]).toEqual([
        '100\\%\\_crema',
      ]);
    });

    it('acepta exactamente 20 renglones', async () => {
      const d = build();
      const veinte = Array.from({ length: 20 }, (_, i) => `droga${i}`);
      await expect(
        d.service.branchAvailability('farmacia-central', {
          items: veinte.join('|'),
        }),
      ).resolves.toEqual(expect.objectContaining({ count: 0 }));
    });
  });

  describe('branchAvailability — inválido', () => {
    it('21 renglones → 400', async () => {
      const d = build();
      const veintiuno = Array.from({ length: 21 }, (_, i) => `droga${i}`);
      await expect(
        d.service.branchAvailability('farmacia-central', {
          items: veintiuno.join('|'),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('un renglón de 101 caracteres o de menos de 3 letras → 400', async () => {
      const d = build();
      await expect(
        d.service.branchAvailability('farmacia-central', {
          items: 'a'.repeat(101),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        d.service.branchAvailability('farmacia-central', { items: 'b1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('el origen a medias → 400, antes de tocar la base', async () => {
      const d = build();
      await expect(
        d.service.branchAvailability('farmacia-central', {
          items: 'amoxicilina',
          lat: -17.7,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(d.repo.findVisibleProfileBySlug).not.toHaveBeenCalled();
    });

    it('un slug que no es de farmacia → 404', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(null);
      await expect(
        d.service.branchAvailability('no-existe', { items: 'amoxicilina' }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
