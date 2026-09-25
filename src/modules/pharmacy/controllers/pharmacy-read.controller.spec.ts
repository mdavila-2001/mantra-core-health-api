import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { PharmacyReadController } from './pharmacy-read.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const readService = {
    listPharmacies: mockFn().mockResolvedValue({}),
    getPharmacy: mockFn().mockResolvedValue({}),
    searchProducts: mockFn().mockResolvedValue({}),
    listSites: mockFn().mockResolvedValue({}),
    getSitePrices: mockFn().mockResolvedValue({}),
  };
  const controller = new PharmacyReadController(readService as any);
  return { controller, readService };
}

/**
 * H4 (carril Marcelo, 2026-09-25): `GET /pharmacy/sites`. Misma regla de
 * `lat`/`lng` que `PharmacyInventoryReadController.availability`, sin
 * `@Roles` — el filtro real es la publicación, no el rol.
 */
describe('PharmacyReadController', () => {
  describe('searchProducts', () => {
    it('forwards pharmacyId to the service (H5, carril Marcelo)', async () => {
      const d = build();
      await d.controller.searchProducts(undefined, undefined, 'ph-1');
      expect(d.readService.searchProducts).toHaveBeenCalledWith(
        { search: undefined, conceptId: undefined, pharmacyId: 'ph-1' },
        50,
      );
    });
  });

  describe('listSites', () => {
    it('passes a valid parsed origin and the default limit to the service', async () => {
      const d = build();
      await d.controller.listSites(undefined, '-17.7833', '-63.1821');
      expect(d.readService.listSites).toHaveBeenCalledWith(
        { search: undefined, origin: { lat: -17.7833, lng: -63.1821 } },
        50,
      );
    });

    it('lists without an origin: distance stays null for the service to decide', async () => {
      const d = build();
      await d.controller.listSites();
      expect(d.readService.listSites).toHaveBeenCalledWith(
        { search: undefined, origin: undefined },
        50,
      );
    });

    it('rejects lat without lng', () => {
      const d = build();
      expect(() =>
        d.controller.listSites(undefined, '-17.78', undefined),
      ).toThrow(BadRequestException);
      expect(d.readService.listSites).not.toHaveBeenCalled();
    });

    it('rejects coordinates that are not real WGS84 numbers', () => {
      const d = build();
      expect(() => d.controller.listSites(undefined, '91', '0')).toThrow(
        BadRequestException,
      );
      expect(d.readService.listSites).not.toHaveBeenCalled();
    });

    it('forwards the search filter', async () => {
      const d = build();
      await d.controller.listSites('central');
      expect(d.readService.listSites).toHaveBeenCalledWith(
        { search: 'central', origin: undefined },
        50,
      );
    });

    it('forwards a custom limit instead of the default', async () => {
      const d = build();
      await d.controller.listSites(undefined, undefined, undefined, 10);
      expect(d.readService.listSites).toHaveBeenCalledWith(
        { search: undefined, origin: undefined },
        10,
      );
    });
  });
});
