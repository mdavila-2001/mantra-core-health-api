import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PrescriptionFavoritesService } from './prescription-favorites.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { MAX_FAVORITES_PER_PRACTITIONER } from '../repositories';

const actor = { id: 'user-1', roles: [] } as any;

/**
 * Arma el servicio con sus dependencias dobladas.
 *
 * @returns El servicio y los dobles, para aseverar sobre ellos.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    remove: mockFn(),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const favoritesRepo = {
    findByPractitioner: mockFn().mockResolvedValue([]),
    findById: mockFn().mockResolvedValue(null),
    countByPractitioner: mockFn().mockResolvedValue(0),
    create: mockFn((_em: any, data: any) => ({ id: 'fav-1', ...data })),
  };
  // El dueño sale SIEMPRE de la sesión: este doble es el que fija de quién es.
  const ownership = {
    requireOwnPractitionerProfileId:
      mockFn().mockResolvedValue('practitioner-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PrescriptionFavoritesService(
    em as any,
    favoritesRepo as any,
    ownership as any,
    logger as any,
  );
  return { service, favoritesRepo, ownership, tx };
}

const nuevoFavorito = {
  name: 'ATB post extracción',
  medicationConceptId: 'med-1',
  doseText: '500 mg',
  frequencyText: 'cada 8 horas',
};

describe('PrescriptionFavoritesService', () => {
  describe('listOwn', () => {
    it('lists only the favorites of the practitioner in session', async () => {
      const d = build();
      d.favoritesRepo.findByPractitioner.mockResolvedValue([
        { id: 'fav-1', name: 'A', medicationConceptId: 'med-1' },
      ]);
      const res = await d.service.listOwn(actor);
      expect(res).toHaveLength(1);
      // El id del profesional NO viene del cliente: sale de la sesión.
      expect(d.favoritesRepo.findByPractitioner.mock.calls[0][1]).toBe(
        'practitioner-1',
      );
    });
  });

  describe('create', () => {
    it('saves the favorite for the practitioner in session', async () => {
      const d = build();
      const res = await d.service.create(nuevoFavorito as any, actor);
      expect(res.name).toBe('ATB post extracción');
      expect(
        d.favoritesRepo.create.mock.calls[0][1].practitionerProfileId,
      ).toBe('practitioner-1');
    });

    it('converts the quantity to string for the numeric column', async () => {
      const d = build();
      await d.service.create(
        { ...nuevoFavorito, quantityDecimal: 21 } as any,
        actor,
      );
      expect(d.favoritesRepo.create.mock.calls[0][1].quantityDecimal).toBe(
        '21',
      );
    });

    it('rejects a duplicated name instead of overwriting the previous one', async () => {
      const d = build();
      d.favoritesRepo.findByPractitioner.mockResolvedValue([
        { id: 'fav-0', name: 'ATB post extracción' },
      ]);
      await expect(
        d.service.create(nuevoFavorito as any, actor),
      ).rejects.toThrow(ConflictException);
      expect(d.favoritesRepo.create).not.toHaveBeenCalled();
    });

    it('rejects when the personal list reached its cap', async () => {
      const d = build();
      d.favoritesRepo.countByPractitioner.mockResolvedValue(
        MAX_FAVORITES_PER_PRACTITIONER,
      );
      await expect(
        d.service.create(nuevoFavorito as any, actor),
      ).rejects.toThrow(PreconditionFailedException);
      expect(d.favoritesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes an own favorite', async () => {
      const d = build();
      const favorite = {
        id: 'fav-1',
        practitionerProfileId: 'practitioner-1',
      };
      d.favoritesRepo.findById.mockResolvedValue(favorite);
      await d.service.remove('fav-1', actor);
      expect(d.tx.remove).toHaveBeenCalledWith(favorite);
    });

    it("does not remove — nor acknowledge — another practitioner's favorite", async () => {
      const d = build();
      d.favoritesRepo.findById.mockResolvedValue({
        id: 'fav-9',
        practitionerProfileId: 'OTRO-PROFESIONAL',
      });
      await expect(d.service.remove('fav-9', actor)).rejects.toThrow(
        ResourceNotFoundException,
      );
      expect(d.tx.remove).not.toHaveBeenCalled();
    });

    it('answers 404 when the favorite does not exist', async () => {
      const d = build();
      d.favoritesRepo.findById.mockResolvedValue(null);
      await expect(d.service.remove('no-existe', actor)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });
});
