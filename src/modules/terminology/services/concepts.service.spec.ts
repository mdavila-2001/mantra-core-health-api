import { describe, it, expect, jest } from '@jest/globals';
import { ConceptsService } from './concepts.service';
import {
  CONCEPTS,
  ConflictException,
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
  const conceptsRepo = {
    findById: jest.fn(),
    findByIdForUpdate: jest.fn(),
    findByVersionAndCode: jest.fn(),
    search: jest.fn(() => Promise.resolve([])),
  } as any;
  const designationsRepo = {
    createDesignation: jest.fn(),
    createProperty: jest.fn(),
    findByLanguageForUpdate: jest.fn(() => Promise.resolve([])),
    findByConcept: jest.fn(() => Promise.resolve([])),
    findProperty: jest.fn(),
    findPropertiesByConcept: jest.fn(() => Promise.resolve([])),
  } as any;
  const relationshipsRepo = {
    findEquivalent: jest.fn(),
    create: jest.fn(),
  } as any;
  const valueSetsRepo = {
    findMembersByConceptForUpdate: jest.fn(() => Promise.resolve([])),
  } as any;
  const codeSystemsRepo = { findByCanonicalUrl: jest.fn() } as any;
  const versionsRepo = { findDefaultActiveVersion: jest.fn() } as any;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
  const service = new ConceptsService(
    em,
    conceptsRepo,
    designationsRepo,
    relationshipsRepo,
    valueSetsRepo,
    codeSystemsRepo,
    versionsRepo,
    logger,
  );
  return {
    service,
    tx,
    em,
    conceptsRepo,
    designationsRepo,
    relationshipsRepo,
    valueSetsRepo,
    codeSystemsRepo,
    versionsRepo,
    logger,
  };
}

describe('ConceptsService', () => {
  describe('addDesignation', () => {
    it('crea la designación con idioma/tipo por defecto y sus propiedades', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'concept-1' });
      designationsRepo.createDesignation.mockReturnValue({
        id: 'd-1',
        value: 'Diabetes',
        preferred: undefined,
      });

      const result = await service.addDesignation(
        'concept-1',
        {
          value: 'Diabetes',
          properties: [{ propertyCode: 'p1', valueJson: { a: 1 } }],
        },
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
        expect.objectContaining({
          id: 'd-1',
          conceptId: 'concept-1',
          propertiesCount: 1,
        }),
      );
    });

    it('mapea idioma EN y tipo PREFERRED', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'concept-1' });
      designationsRepo.createDesignation.mockReturnValue({
        id: 'd-1',
        value: 'Diabetes',
      });

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

    it('degrada la designación preferida anterior del mismo idioma', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      const previous = { id: 'd-0', preferred: true, updatedAt: new Date(0) };
      conceptsRepo.findById.mockResolvedValue({ id: 'concept-1' });
      designationsRepo.findByLanguageForUpdate.mockResolvedValue([previous]);
      designationsRepo.createDesignation.mockReturnValue({
        id: 'd-1',
        value: 'Diabetes',
        preferred: true,
      });

      await service.addDesignation(
        'concept-1',
        { value: 'Diabetes', preferred: true },
        actor,
      );

      expect(designationsRepo.findByLanguageForUpdate).toHaveBeenCalledWith(
        expect.anything(),
        'concept-1',
        CONCEPTS.LANG_ES,
      );
      expect(previous.preferred).toBe(false);
    });

    it('no bloquea designaciones si la nueva no es preferida', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'concept-1' });
      designationsRepo.createDesignation.mockReturnValue({
        id: 'd-1',
        value: 'Diabetes',
      });

      await service.addDesignation('concept-1', { value: 'Diabetes' }, actor);

      expect(designationsRepo.findByLanguageForUpdate).not.toHaveBeenCalled();
    });
  });

  describe('addRelationship', () => {
    const dto = {
      targetConceptId: 'concept-2',
      relationshipType: 'IS_A' as const,
    };

    it('crea la relación mapeando el tipo a concepto', async () => {
      const { service, conceptsRepo, relationshipsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'x' });
      relationshipsRepo.findEquivalent.mockResolvedValue(null);
      relationshipsRepo.create.mockReturnValue({
        id: 'r-1',
        ordinal: undefined,
      });

      const result = await service.addRelationship('concept-1', dto, actor);

      expect(relationshipsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          relationshipTypeConceptId: CONCEPTS.REL_IS_A,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'r-1',
          sourceConceptId: 'concept-1',
          targetConceptId: 'concept-2',
        }),
      );
    });

    it('rechaza una relación consigo mismo (Conflict)', async () => {
      const { service } = build();
      await expect(
        service.addRelationship(
          'concept-1',
          { targetConceptId: 'concept-1', relationshipType: 'IS_A' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lanza NotFound si el concepto destino no existe', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById
        .mockResolvedValueOnce({ id: 'concept-1' })
        .mockResolvedValueOnce(null);

      await expect(
        service.addRelationship('concept-1', dto, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza una relación duplicada (Conflict)', async () => {
      const { service, conceptsRepo, relationshipsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'x' });
      relationshipsRepo.findEquivalent.mockResolvedValue({ id: 'dup' });

      await expect(
        service.addRelationship('concept-1', dto, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('upsertProperties', () => {
    it('crea la propiedad que no existía', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.findById.mockResolvedValue({ id: 'concept-1' });
      designationsRepo.findProperty.mockResolvedValue(null);

      const result = await service.upsertProperties(
        'concept-1',
        { properties: [{ propertyCode: 'p1', valueJson: { a: 1 } }] },
        actor,
      );

      expect(designationsRepo.createProperty).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ propertyCode: 'p1', dataType: 'string' }),
      );
      expect(result).toEqual({
        conceptId: 'concept-1',
        created: 1,
        updated: 0,
      });
    });

    it('actualiza la propiedad existente en vez de duplicarla', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      const existing = {
        propertyCode: 'p1',
        valueJson: { a: 1 },
        dataType: 'string',
        updatedAt: new Date(0),
      };
      conceptsRepo.findById.mockResolvedValue({ id: 'concept-1' });
      designationsRepo.findProperty.mockResolvedValue(existing);

      const result = await service.upsertProperties(
        'concept-1',
        { properties: [{ propertyCode: 'p1', valueJson: { a: 2 } }] },
        actor,
      );

      expect(designationsRepo.createProperty).not.toHaveBeenCalled();
      expect(existing.valueJson).toEqual({ a: 2 });
      expect(result).toEqual({
        conceptId: 'concept-1',
        created: 0,
        updated: 1,
      });
    });

    it('lanza NotFound si el concepto no existe', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById.mockResolvedValue(null);

      await expect(
        service.upsertProperties(
          'concept-x',
          { properties: [{ propertyCode: 'p1', valueJson: 1 }] },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('deprecateConcept', () => {
    it('retira el concepto y excluye sus miembros de expansión', async () => {
      const { service, conceptsRepo, valueSetsRepo } = build();
      const concept = {
        id: 'concept-1',
        stateConceptId: CONCEPTS.TERM_ACTIVE,
        updatedAt: new Date(0),
      } as any;
      const member = { included: true, updatedAt: new Date(0) };
      conceptsRepo.findByIdForUpdate.mockResolvedValue(concept);
      valueSetsRepo.findMembersByConceptForUpdate.mockResolvedValue([member]);

      const result = await service.deprecateConcept('concept-1', {}, actor);

      expect(concept.stateConceptId).toBe(CONCEPTS.TERM_RETIRED);
      expect(concept.validTo).toBeInstanceOf(Date);
      expect(member.included).toBe(false);
      expect(result).toEqual(
        expect.objectContaining({
          id: 'concept-1',
          excludedMembers: 1,
          alreadyRetired: false,
        }),
      );
    });

    it('es idempotente si el concepto ya estaba retirado', async () => {
      const { service, conceptsRepo, valueSetsRepo } = build();
      conceptsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'concept-1',
        stateConceptId: CONCEPTS.TERM_RETIRED,
      });

      const result = await service.deprecateConcept('concept-1', {}, actor);

      expect(result.alreadyRetired).toBe(true);
      expect(
        valueSetsRepo.findMembersByConceptForUpdate,
      ).not.toHaveBeenCalled();
    });

    it('rechaza reemplazar el concepto por sí mismo (Conflict)', async () => {
      const { service } = build();

      await expect(
        service.deprecateConcept(
          'concept-1',
          { replacedByConceptId: 'concept-1' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza un reemplazo retirado (PreconditionFailed)', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'concept-1',
        stateConceptId: CONCEPTS.TERM_ACTIVE,
        updatedAt: new Date(0),
      });
      conceptsRepo.findById.mockResolvedValue({
        id: 'concept-2',
        stateConceptId: CONCEPTS.TERM_RETIRED,
      });

      await expect(
        service.deprecateConcept(
          'concept-1',
          { replacedByConceptId: 'concept-2' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('lanza NotFound si el concepto no existe', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findByIdForUpdate.mockResolvedValue(null);

      await expect(
        service.deprecateConcept('concept-x', {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('lookupConcept', () => {
    it('resuelve el concepto con designaciones y propiedades', async () => {
      const {
        service,
        codeSystemsRepo,
        versionsRepo,
        conceptsRepo,
        designationsRepo,
      } = build();
      codeSystemsRepo.findByCanonicalUrl.mockResolvedValue({ id: 'cs-1' });
      versionsRepo.findDefaultActiveVersion.mockResolvedValue({ id: 'v-1' });
      conceptsRepo.findByVersionAndCode.mockResolvedValue({
        id: 'concept-1',
        code: 'E11',
        display: 'Diabetes tipo 2',
        stateConceptId: CONCEPTS.TERM_ACTIVE,
      });
      designationsRepo.findByConcept.mockResolvedValue([
        {
          value: 'Diabetes',
          languageConceptId: CONCEPTS.LANG_ES,
          preferred: true,
        },
      ]);
      designationsRepo.findPropertiesByConcept.mockResolvedValue([
        { propertyCode: 'chapter', dataType: 'string', valueJson: 'IV' },
      ]);

      const result = await service.lookupConcept('http://hl7.org/cs', 'E11');

      expect(result.conceptId).toBe('concept-1');
      expect(result.designations).toHaveLength(1);
      expect(result.properties[0]).toEqual(
        expect.objectContaining({ propertyCode: 'chapter', valueJson: 'IV' }),
      );
    });

    it('lanza NotFound si el sistema de códigos no existe', async () => {
      const { service, codeSystemsRepo } = build();
      codeSystemsRepo.findByCanonicalUrl.mockResolvedValue(null);

      await expect(
        service.lookupConcept('http://x', 'E11'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('lanza NotFound si el sistema no tiene versión vigente', async () => {
      const { service, codeSystemsRepo, versionsRepo } = build();
      codeSystemsRepo.findByCanonicalUrl.mockResolvedValue({ id: 'cs-1' });
      versionsRepo.findDefaultActiveVersion.mockResolvedValue(null);

      await expect(
        service.lookupConcept('http://x', 'E11'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('lanza NotFound si el código no está en la versión vigente', async () => {
      const { service, codeSystemsRepo, versionsRepo, conceptsRepo } = build();
      codeSystemsRepo.findByCanonicalUrl.mockResolvedValue({ id: 'cs-1' });
      versionsRepo.findDefaultActiveVersion.mockResolvedValue({ id: 'v-1' });
      conceptsRepo.findByVersionAndCode.mockResolvedValue(null);

      await expect(
        service.lookupConcept('http://x', 'ZZZ'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('searchConcepts', () => {
    it('devuelve los conceptos con el id que espera el resto del contrato', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.search.mockResolvedValue([
        {
          id: 'concept-1',
          code: 'GENDER_FEMALE',
          display: 'Administrative gender female',
          definition: undefined,
          selectable: true,
          codeSystemVersionId: 'version-1',
        },
      ]);

      const result = await service.searchConcepts('GENDER', undefined, 50);

      // `conceptId` es justo el valor que hay que mandar en los campos
      // `*ConceptId`: sin esta búsqueda no hay forma de averiguarlo.
      expect(result.items[0]).toMatchObject({
        conceptId: 'concept-1',
        code: 'GENDER_FEMALE',
      });
      expect(result.count).toBe(1);
      expect(result.limit).toBe(50);
    });

    it('propaga el filtro de versión y el tope al repositorio', async () => {
      const { service, conceptsRepo, em } = build();

      await service.searchConcepts('phone', 'version-9', 10);

      expect(conceptsRepo.search).toHaveBeenCalledWith(
        em,
        { query: 'phone', codeSystemVersionId: 'version-9' },
        10,
      );
    });

    it('sin texto devuelve el catálogo acotado por el tope, no un error', async () => {
      const { service, conceptsRepo } = build();

      const result = await service.searchConcepts(undefined, undefined, 5);

      expect(conceptsRepo.search).toHaveBeenCalledWith(
        expect.anything(),
        { query: undefined, codeSystemVersionId: undefined },
        5,
      );
      expect(result.count).toBe(0);
    });
  });
});
