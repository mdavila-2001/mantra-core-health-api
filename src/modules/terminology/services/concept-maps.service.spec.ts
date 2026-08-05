import { describe, it, expect, jest } from '@jest/globals';
import { ConceptMapsService } from './concept-maps.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';

const actor: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: jest.fn(() => Promise.resolve()) };
  const em = {
    transactional: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as any;
  const conceptMapsRepo = {
    findEquivalent: jest.fn(),
    findByIdForUpdate: jest.fn(),
    findTranslations: jest.fn(() => Promise.resolve([])),
    create: jest.fn(),
  } as any;
  const conceptsRepo = { findById: jest.fn() } as any;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
  const service = new ConceptMapsService(
    em,
    conceptMapsRepo,
    conceptsRepo,
    logger,
  );
  return { service, tx, conceptMapsRepo, conceptsRepo, logger };
}

/** Concepto activo listo para participar en un mapeo. */
function activeConcept(id: string) {
  return { id, stateConceptId: CONCEPTS.TERM_ACTIVE };
}

describe('ConceptMapsService', () => {
  describe('curado (con targetConceptId)', () => {
    const dto = {
      sourceConceptId: 'c-1',
      targetConceptId: 'c-2',
      equivalence: 'EQUIVALENT' as const,
    };

    it('crea el mapeo mapeando la equivalencia a concepto', async () => {
      const { service, conceptsRepo, conceptMapsRepo } = build();
      conceptsRepo.findById
        .mockResolvedValueOnce(activeConcept('c-1'))
        .mockResolvedValueOnce(activeConcept('c-2'));
      conceptMapsRepo.findEquivalent.mockResolvedValue(null);
      conceptMapsRepo.create.mockReturnValue({ id: 'cm-1' });

      const result = await service.translate(dto, actor);

      expect(conceptMapsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          equivalenceConceptId: CONCEPTS.EQUIV_EQUIVALENT,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          curated: true,
          matched: true,
          sourceConceptId: 'c-1',
        }),
      );
    });

    it('actualiza el mapeo existente en vez de duplicarlo', async () => {
      const { service, conceptsRepo, conceptMapsRepo } = build();
      const locked = {
        id: 'cm-1',
        equivalenceConceptId: CONCEPTS.EQUIV_WIDER,
        updatedAt: new Date(0),
      };
      conceptsRepo.findById
        .mockResolvedValueOnce(activeConcept('c-1'))
        .mockResolvedValueOnce(activeConcept('c-2'));
      conceptMapsRepo.findEquivalent.mockResolvedValue({ id: 'cm-1' });
      conceptMapsRepo.findByIdForUpdate.mockResolvedValue(locked);

      const result = await service.translate(dto, actor);

      expect(conceptMapsRepo.create).not.toHaveBeenCalled();
      expect(locked.equivalenceConceptId).toBe(CONCEPTS.EQUIV_EQUIVALENT);
      expect(result.matches[0].conceptMapId).toBe('cm-1');
    });

    it('exige la equivalencia al curar (PreconditionFailed)', async () => {
      const { service } = build();

      await expect(
        service.translate(
          { sourceConceptId: 'c-1', targetConceptId: 'c-2' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza mapear un concepto a sí mismo (PreconditionFailed)', async () => {
      const { service } = build();

      await expect(
        service.translate({ ...dto, targetConceptId: 'c-1' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza mapear desde un concepto no activo (PreconditionFailed)', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById
        .mockResolvedValueOnce({
          id: 'c-1',
          stateConceptId: CONCEPTS.TERM_RETIRED,
        })
        .mockResolvedValueOnce(activeConcept('c-2'));

      await expect(service.translate(dto, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('lanza NotFound si el concepto destino no existe', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById
        .mockResolvedValueOnce(activeConcept('c-1'))
        .mockResolvedValueOnce(null);

      await expect(service.translate(dto, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('consulta (sin targetConceptId)', () => {
    it('devuelve todas las traducciones activas del concepto', async () => {
      const { service, conceptsRepo, conceptMapsRepo } = build();
      conceptsRepo.findById.mockResolvedValue(activeConcept('c-1'));
      conceptMapsRepo.findTranslations.mockResolvedValue([
        {
          id: 'cm-1',
          targetConceptId: 'c-2',
          equivalenceConceptId: CONCEPTS.EQUIV_WIDER,
          context: 'lab',
        },
        {
          id: 'cm-2',
          targetConceptId: 'c-3',
          equivalenceConceptId: CONCEPTS.EQUIV_NARROWER,
        },
      ]);

      const result = await service.translate({ sourceConceptId: 'c-1' }, actor);

      expect(result.curated).toBe(false);
      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(conceptMapsRepo.create).not.toHaveBeenCalled();
    });

    it('responde matched=false cuando no hay traducciones', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById.mockResolvedValue(activeConcept('c-1'));

      const result = await service.translate({ sourceConceptId: 'c-1' }, actor);

      expect(result.matched).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('lanza NotFound si el concepto origen no existe', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById.mockResolvedValue(null);

      await expect(
        service.translate({ sourceConceptId: 'c-x' }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
