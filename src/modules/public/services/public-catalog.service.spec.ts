import { jest } from '@jest/globals';

// Fábrica de dobles laxa, igual que en el resto de los specs de servicio.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { BadRequestException } from '@nestjs/common';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import { COMM } from '../../community/community.concepts';
import { PublicCatalogService } from './public-catalog.service';

const TENANT = '0a0a0a0a-0000-4000-8000-000000000001';
const ORG = {
  id: 'prof-org',
  tenantId: TENANT,
  targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
};
const FARMACIA = {
  id: 'prof-far',
  tenantId: TENANT,
  targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
};

function build() {
  const em = { fork: mockFn(() => em) };
  const repo = {
    findVisibleProfileBySlug: mockFn().mockResolvedValue(null),
    findOfferedServices: mockFn().mockResolvedValue([]),
    findPharmacyProducts: mockFn().mockResolvedValue([]),
  };
  const service = new PublicCatalogService(em as any, repo as any);
  return { em, repo, service };
}

/** Una fila tal como la devuelve la base, CON un campo interno que no debe salir. */
function servicio(over: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'CONS-GEN',
    name: 'Consulta general',
    descriptionText: 'Evaluación clínica completa',
    price: '150.00',
    currency: 'BOB',
    isActive: true,
    ...over,
  };
}

function producto(over: Record<string, unknown> = {}) {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    sortName: 'Amoxicilina',
    brandName: 'Amoxil',
    strengthText: '500 mg',
    packageSizeText: 'caja x 21',
    requiresPrescription: true,
    price: '38.50',
    currency: 'BOB',
    availableQuantity: '12',
    ...over,
  };
}

describe('PublicCatalogService (M4 · H2)', () => {
  describe('organizationServices — GET /public/profiles/o/:slug/services', () => {
    it('trae los servicios de la organización del slug, con el precio como texto exacto', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(ORG);
      d.repo.findOfferedServices.mockResolvedValue([servicio()]);

      const page = await d.service.organizationServices('clinica-norte', {});

      expect(d.repo.findOfferedServices).toHaveBeenCalledWith(
        d.em,
        TENANT,
        null,
        21,
      );
      expect(page.items).toEqual([
        {
          id: '11111111-1111-4111-8111-111111111111',
          code: 'CONS-GEN',
          name: 'Consulta general',
          description: 'Evaluación clínica completa',
          price: '150.00',
          currency: 'BOB',
          isActive: true,
        },
      ]);
      expect(page.nextCursor).toBeNull();
      expect(page.totalHint).toBeNull();
      expect(Number.isNaN(Date.parse(page.generatedAt))).toBe(false);
    });

    it('la proyección no deja salir nada interno, aunque la fila lo traiga', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(ORG);
      d.repo.findOfferedServices.mockResolvedValue([
        servicio({
          incomeAccountId: 'cta-4100',
          taxCodeId: 'iva',
          practiceId: 'pr-1',
          tenantId: TENANT,
        }),
      ]);

      const page = await d.service.organizationServices('clinica-norte', {});

      const json = JSON.stringify(page);
      expect(json).not.toMatch(
        /incomeAccount|taxCode|practiceId|tenantId|cta-4100/,
      );
      expect(json).not.toContain(TENANT);
    });

    it('un precio en cero es «sin precio definido»: viaja null, no gratis', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(ORG);
      d.repo.findOfferedServices.mockResolvedValue([
        servicio({ price: '0.00' }),
        servicio({ id: '33333333-3333-4333-8333-333333333333', price: '0' }),
      ]);

      const page = await d.service.organizationServices('clinica-norte', {});

      expect(page.items.map((s) => [s.price, s.currency])).toEqual([
        [null, null],
        [null, null],
      ]);
    });

    it('un servicio dado de baja se lista rotulado, no se esconde', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(ORG);
      d.repo.findOfferedServices.mockResolvedValue([
        servicio({ isActive: false }),
      ]);

      const page = await d.service.organizationServices('clinica-norte', {});

      expect(page.items[0].isActive).toBe(false);
    });

    it('un slug inexistente es 404', async () => {
      const d = build();

      await expect(
        d.service.organizationServices('no-existe', {}),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.repo.findOfferedServices).not.toHaveBeenCalled();
    });

    it('un slug de farmacia pedido como organización es el MISMO 404', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(FARMACIA);

      const errorOtroTipo = await d.service
        .organizationServices('farmacia-central', {})
        .catch((e: unknown) => e);
      d.repo.findVisibleProfileBySlug.mockResolvedValue(null);
      const errorInexistente = await d.service
        .organizationServices('farmacia-central', {})
        .catch((e: unknown) => e);

      expect(errorOtroTipo).toBeInstanceOf(ResourceNotFoundException);
      expect((errorOtroTipo as Error).message).toBe(
        (errorInexistente as Error).message,
      );
      expect(d.repo.findOfferedServices).not.toHaveBeenCalled();
    });

    it('pagina por keyset: pide una fila de más y, si llega, emite el cursor de la última de la página', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(ORG);
      d.repo.findOfferedServices.mockResolvedValue([
        servicio({ id: 'aaaaaaaa-0000-4000-8000-000000000001', code: 'A' }),
        servicio({ id: 'aaaaaaaa-0000-4000-8000-000000000002', code: 'B' }),
        servicio({ id: 'aaaaaaaa-0000-4000-8000-000000000003', code: 'C' }),
      ]);

      const page = await d.service.organizationServices('clinica-norte', {
        limit: 2,
      });

      expect(d.repo.findOfferedServices.mock.calls[0][3]).toBe(3);
      expect(page.items.map((s) => s.code)).toEqual(['A', 'B']);
      expect(decodeKeysetCursor(page.nextCursor as string)).toEqual({
        k: 'B',
        i: 'aaaaaaaa-0000-4000-8000-000000000002',
      });
    });

    it('con cursor, sigue desde esa posición', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(ORG);
      const cursor = encodeKeysetCursor({
        k: 'B',
        i: 'aaaaaaaa-0000-4000-8000-000000000002',
      });

      await d.service.organizationServices('clinica-norte', {
        cursor,
        limit: 5,
      });

      expect(d.repo.findOfferedServices).toHaveBeenCalledWith(
        d.em,
        TENANT,
        { sortKey: 'B', id: 'aaaaaaaa-0000-4000-8000-000000000002' },
        6,
      );
    });

    it('un cursor ajeno o corrupto es 400, no un 500 de la base', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(ORG);

      await expect(
        d.service.organizationServices('clinica-norte', {
          cursor: '%%%no-es-base64%%%',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        d.service.organizationServices('clinica-norte', {
          cursor: encodeKeysetCursor({ k: 'B', i: 'no-es-un-uuid' }),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(d.repo.findOfferedServices).not.toHaveBeenCalled();
    });
  });

  describe('pharmacyProducts — GET /public/profiles/f/:slug/products', () => {
    it('trae genérico, marca, presentación, precio como texto y stock', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(FARMACIA);
      d.repo.findPharmacyProducts.mockResolvedValue([producto()]);

      const page = await d.service.pharmacyProducts('farmacia-central', {});

      expect(d.repo.findPharmacyProducts).toHaveBeenCalledWith(
        d.em,
        TENANT,
        null,
        21,
      );
      expect(page.items).toEqual([
        {
          id: '22222222-2222-4222-8222-222222222222',
          genericName: 'Amoxicilina',
          brandName: 'Amoxil',
          presentation: '500 mg · caja x 21',
          therapeuticGroup: null,
          price: '38.50',
          currency: 'BOB',
          inStock: true,
          requiresPrescription: true,
        },
      ]);
    });

    it('un producto agotado se lista con inStock=false, no se omite', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(FARMACIA);
      d.repo.findPharmacyProducts.mockResolvedValue([
        producto({ availableQuantity: '0' }),
      ]);

      const page = await d.service.pharmacyProducts('farmacia-central', {});

      expect(page.items).toHaveLength(1);
      expect(page.items[0].inStock).toBe(false);
    });

    it('sin precio publicado viaja price=null y currency=null; sin presentación, null', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(FARMACIA);
      d.repo.findPharmacyProducts.mockResolvedValue([
        producto({
          price: null,
          currency: 'BOB',
          strengthText: null,
          packageSizeText: '  ',
          requiresPrescription: null,
        }),
      ]);

      const [item] = (await d.service.pharmacyProducts('farmacia-central', {}))
        .items;

      expect(item.price).toBeNull();
      expect(item.currency).toBeNull();
      expect(item.presentation).toBeNull();
      // Sin dato no se afirma que pida receta.
      expect(item.requiresPrescription).toBe(false);
    });

    it('un slug de organización pedido como farmacia es 404', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(ORG);

      await expect(
        d.service.pharmacyProducts('clinica-norte', {}),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.repo.findPharmacyProducts).not.toHaveBeenCalled();
    });

    it('pagina por el genérico y el id', async () => {
      const d = build();
      d.repo.findVisibleProfileBySlug.mockResolvedValue(FARMACIA);
      d.repo.findPharmacyProducts.mockResolvedValue([
        producto({
          id: 'bbbbbbbb-0000-4000-8000-000000000001',
          sortName: 'Ibuprofeno',
        }),
        producto({
          id: 'bbbbbbbb-0000-4000-8000-000000000002',
          sortName: 'Paracetamol',
        }),
      ]);

      const page = await d.service.pharmacyProducts('farmacia-central', {
        limit: 1,
      });

      expect(page.items.map((p) => p.genericName)).toEqual(['Ibuprofeno']);
      expect(decodeKeysetCursor(page.nextCursor as string)).toEqual({
        k: 'Ibuprofeno',
        i: 'bbbbbbbb-0000-4000-8000-000000000001',
      });
    });
  });
});
