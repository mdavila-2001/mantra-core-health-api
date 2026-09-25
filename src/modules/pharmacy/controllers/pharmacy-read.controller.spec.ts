import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { PharmacyReadController } from './pharmacy-read.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const readService = {
    listPharmacies: mockFn().mockResolvedValue({}),
    getPharmacy: mockFn().mockResolvedValue({}),
    listSites: mockFn().mockResolvedValue({}),
    searchProducts: mockFn().mockResolvedValue({}),
    getSitePrices: mockFn().mockResolvedValue({}),
  };
  const controller = new PharmacyReadController(readService as any);
  return { controller, readService };
}

describe('PharmacyReadController', () => {
  describe('listSites (carril A, H4)', () => {
    it('rejects lat without lng, and lng without lat', () => {
      const d = build();
      expect(() =>
        d.controller.listSites(undefined, '-16.5', undefined, undefined),
      ).toThrow(BadRequestException);
      expect(() =>
        d.controller.listSites(undefined, undefined, '-68.15', undefined),
      ).toThrow(BadRequestException);
      expect(d.readService.listSites).not.toHaveBeenCalled();
    });

    it('rejects coordinates that are not real WGS84 numbers', () => {
      const d = build();
      expect(() =>
        d.controller.listSites(undefined, 'cerca', '-68.15', undefined),
      ).toThrow(BadRequestException);
      expect(() =>
        d.controller.listSites(undefined, '91', '0', undefined),
      ).toThrow(BadRequestException);
      expect(() =>
        d.controller.listSites(undefined, '0', '181', undefined),
      ).toThrow(BadRequestException);
      expect(d.readService.listSites).not.toHaveBeenCalled();
    });

    it('passes a valid parsed origin and the default limit to the service', async () => {
      const d = build();
      await d.controller.listSites(undefined, '-16.5', '-68.15', undefined);
      expect(d.readService.listSites).toHaveBeenCalledWith({
        search: undefined,
        origin: { lat: -16.5, lng: -68.15 },
        limit: 50,
      });
    });

    it('omits the origin when the query brings no coordinates', async () => {
      const d = build();
      await d.controller.listSites(undefined, undefined, undefined, undefined);
      expect(d.readService.listSites).toHaveBeenCalledWith({
        search: undefined,
        origin: undefined,
        limit: 50,
      });
    });

    it('passes search and a given limit through unchanged', async () => {
      const d = build();
      await d.controller.listSites('central', undefined, undefined, 10);
      expect(d.readService.listSites).toHaveBeenCalledWith({
        search: 'central',
        origin: undefined,
        limit: 10,
      });
    });
  });

  describe('searchProducts (carril A, H5)', () => {
    it('forwards pharmacyId to the service', async () => {
      const d = build();
      await d.controller.searchProducts(
        undefined,
        undefined,
        'ph-1',
        undefined,
      );
      expect(d.readService.searchProducts).toHaveBeenCalledWith(
        { search: undefined, conceptId: undefined, pharmacyId: 'ph-1' },
        50,
      );
    });

    it('works without pharmacyId, same as before', async () => {
      const d = build();
      await d.controller.searchProducts(
        'amox',
        undefined,
        undefined,
        undefined,
      );
      expect(d.readService.searchProducts).toHaveBeenCalledWith(
        { search: 'amox', conceptId: undefined, pharmacyId: undefined },
        50,
      );
    });
  });
});
