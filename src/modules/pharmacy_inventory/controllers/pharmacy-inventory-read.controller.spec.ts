import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { PharmacyInventoryReadController } from './pharmacy-inventory-read.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const readService = {
    getSiteStock: mockFn().mockResolvedValue({}),
    availability: mockFn().mockResolvedValue({}),
  };
  const controller = new PharmacyInventoryReadController(readService as any);
  return { controller, readService };
}

describe('PharmacyInventoryReadController', () => {
  describe('availability', () => {
    it('requires products: without a concrete order there is nothing to answer', () => {
      const d = build();
      expect(() => d.controller.availability(undefined)).toThrow(
        BadRequestException,
      );
      expect(d.readService.availability).not.toHaveBeenCalled();
    });

    it('rejects lat without lng, and lng without lat', () => {
      const d = build();
      expect(() =>
        d.controller.availability(['prod-1'], '-16.5', undefined),
      ).toThrow(BadRequestException);
      expect(() =>
        d.controller.availability(['prod-1'], undefined, '-68.15'),
      ).toThrow(BadRequestException);
      expect(d.readService.availability).not.toHaveBeenCalled();
    });

    it('rejects coordinates that are not real WGS84 numbers', () => {
      const d = build();
      // Un texto no puede entrar a un cálculo de distancia y salir como un
      // orden que parece correcto.
      expect(() =>
        d.controller.availability(['prod-1'], 'cerca', '-68.15'),
      ).toThrow(BadRequestException);
      expect(() => d.controller.availability(['prod-1'], '91', '0')).toThrow(
        BadRequestException,
      );
      expect(() => d.controller.availability(['prod-1'], '0', '181')).toThrow(
        BadRequestException,
      );
      expect(d.readService.availability).not.toHaveBeenCalled();
    });

    it('passes a valid parsed origin and the default limit to the service', async () => {
      const d = build();
      await d.controller.availability(['prod-1'], '-16.5', '-68.15');
      expect(d.readService.availability).toHaveBeenCalledWith(
        ['prod-1'],
        { lat: -16.5, lng: -68.15 },
        20,
      );
    });

    it('omits the origin when the query brings no coordinates', async () => {
      const d = build();
      await d.controller.availability(['prod-1']);
      expect(d.readService.availability).toHaveBeenCalledWith(
        ['prod-1'],
        undefined,
        20,
      );
    });
  });
});
