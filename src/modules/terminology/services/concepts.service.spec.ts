import { describe, it, expect, jest } from '@jest/globals';
import { ConceptsService } from './concepts.service';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';

const actor: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

function build() {
  const tx = { flush: jest.fn(() => Promise.resolve()) };
  const em = { transactional: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)) } as any;
  const conceptsRepo = { findById: jest.fn() } as any;
  const designationsRepo = { createDesignation: jest.fn(), createProperty: jest.fn() } as any;
  const relationshipsRepo = { findEquivalent: jest.fn(), create: jest.fn() } as any;
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() } as any;
  const service = new ConceptsService(em, conceptsRepo, designationsRepo, relationshipsRepo, logger);
  return { service, tx, conceptsRepo, designationsRepo, relationshipsRepo, logger };
}

describe('ConceptsService', () => {
  describe('addDesignation', () => {
    it('crea la designación con idioma/tipo por defecto y sus propiedades', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'concept-1' });
      designationsRepo.createDesignation.mockReturnValue({ id: 'd-1', value: 'Diabetes', preferred: undefined });

      const result = await service.addDesignation(
        'concept-1',
        { value: 'Diabetes', properties: [{ propertyCode: 'p1', valueJson: { a: 1 } }] },
        actor,
      );

      expect(designationsRepo.createDesignation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          conceptId: 'concept-1',
          languageConceptId: CONCEPTS.LANG_ES,
          designationTypeConceptId: CONCEPTS.DESIG_SYNONYM,
        }),
      );
      expect(designationsRepo.createProperty).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ propertyCode: 'p1', dataType: 'string' }),
      );
      expect(result).toEqual(
        expect.objectContaining({ id: 'd-1', conceptId: 'concept-1', propertiesCount: 1 }),
      );
    });

    it('mapea idioma EN y tipo PREFERRED', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'concept-1' });
      designationsRepo.createDesignation.mockReturnValue({ id: 'd-1', value: 'Diabetes' });

      await service.addDesignation(
        'concept-1',
        { value: 'Diabetes', language: 'EN', designationType: 'PREFERRED' },
        actor,
      );

      expect(designationsRepo.createDesignation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          languageConceptId: CONCEPTS.LANG_EN,
          designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
        }),
      );
    });

    it('lanza NotFound si el concepto no existe', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById.mockResolvedValue(null);

      await expect(
        service.addDesignation('concept-x', { value: 'X' }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('addRelationship', () => {
    const dto = { targetConceptId: 'concept-2', relationshipType: 'IS_A' as const };

    it('crea la relación mapeando el tipo a concepto', async () => {
      const { service, conceptsRepo, relationshipsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'x' });
      relationshipsRepo.findEquivalent.mockResolvedValue(null);
      relationshipsRepo.create.mockReturnValue({ id: 'r-1', ordinal: undefined });

      const result = await service.addRelationship('concept-1', dto, actor);

      expect(relationshipsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ relationshipTypeConceptId: CONCEPTS.REL_IS_A }),
      );
      expect(result).toEqual(
        expect.objectContaining({ id: 'r-1', sourceConceptId: 'concept-1', targetConceptId: 'concept-2' }),
      );
    });

    it('rechaza una relación consigo mismo (Conflict)', async () => {
      const { service } = build();
      await expect(
        service.addRelationship('concept-1', { targetConceptId: 'concept-1', relationshipType: 'IS_A' }, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lanza NotFound si el concepto destino no existe', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById.mockResolvedValueOnce({ id: 'concept-1' }).mockResolvedValueOnce(null);

      await expect(service.addRelationship('concept-1', dto, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rechaza una relación duplicada (Conflict)', async () => {
      const { service, conceptsRepo, relationshipsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'x' });
      relationshipsRepo.findEquivalent.mockResolvedValue({ id: 'dup' });

      await expect(service.addRelationship('concept-1', dto, actor)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});