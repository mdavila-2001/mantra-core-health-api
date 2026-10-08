import { describe, it, expect, jest } from '@jest/globals';
import { ConceptsService, imageFromProperty } from './concepts.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  GLOSSARY_ALL_TERMS_CODE,
  GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
  GLOSSARY_IMAGE_PROPERTY_CODE,
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_SLUG_PROPERTY_CODE,
} from '../glossary.constants';

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
    findByIds: jest.fn(() => Promise.resolve(new Map())),
    search: jest.fn(() => Promise.resolve([])),
    searchGlossaryPage: jest.fn(() => Promise.resolve({ ids: [], total: 0 })),
  } as any;
  const designationsRepo = {
    createDesignation: jest.fn(),
    createProperty: jest.fn(),
    findByLanguageForUpdate: jest.fn(() => Promise.resolve([])),
    findByConcept: jest.fn(() => Promise.resolve([])),
    findProperty: jest.fn(),
    findPropertiesByConcept: jest.fn(() => Promise.resolve([])),
    findPreferredByLanguageForConcepts: jest.fn(() =>
      Promise.resolve(new Map()),
    ),
    findPropertyForConcepts: jest.fn(() => Promise.resolve([])),
  } as any;
  const relationshipsRepo = {
    findEquivalent: jest.fn(),
    create: jest.fn(),
    findByTypesForSources: jest.fn(() => Promise.resolve([])),
    findByTypesForTargets: jest.fn(() => Promise.resolve([])),
    countNeighborsByType: jest.fn(() => Promise.resolve([])),
  } as any;
  const valueSetsRepo = {
    findMembersByConceptForUpdate: jest.fn(() => Promise.resolve([])),
    findValueSetsByConceptIds: jest.fn(() => Promise.resolve(new Map())),
    findIncludedConceptIdsByValueSet: jest.fn(() => Promise.resolve([])),
    findById: jest.fn(() => Promise.resolve(null)),
    findByInternalCode: jest.fn(() => Promise.resolve(null)),
    findDefaultVersion: jest.fn(() => Promise.resolve({ id: 'vsv-1' })),
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

  /**
   * El idioma preferido y las etiquetas: las dos capacidades que el glosario
   * necesitaba y que esta lectura —que consume medio frontend— no tenía.
   *
   * La primera prueba del bloque es la que importa: **sin los parámetros
   * nuevos, nada cambia**. Está escrita contra el objeto entero y no con
   * `toMatchObject` a propósito: un campo de más, aunque sea opcional, es un
   * cambio de contrato para quien serializa la respuesta.
   */
  describe('searchConcepts · idioma y etiquetas', () => {
    const conceptoIngles = {
      id: 'concept-1',
      code: 'COND_SEV_MILD',
      display: 'Mild',
      definition: undefined,
      selectable: true,
      codeSystemVersionId: 'version-1',
    };

    it('sin `lang` ni `includeValueSets` devuelve exactamente lo de siempre', async () => {
      const { service, conceptsRepo, designationsRepo, valueSetsRepo } =
        build();
      conceptsRepo.search.mockResolvedValue([conceptoIngles]);

      const result = await service.searchConcepts(undefined, undefined, 50);

      expect(result.items).toEqual([
        {
          conceptId: 'concept-1',
          code: 'COND_SEV_MILD',
          display: 'Mild',
          definition: undefined,
          selectable: true,
          codeSystemVersionId: 'version-1',
        },
      ]);
      // Ni `translated` ni `valueSets` aparecen como claves.
      expect(Object.keys(result.items[0])).not.toContain('translated');
      expect(Object.keys(result.items[0])).not.toContain('valueSets');
      // Y no se paga ninguna consulta de más por existir la capacidad.
      expect(
        designationsRepo.findPreferredByLanguageForConcepts,
      ).not.toHaveBeenCalled();
      expect(valueSetsRepo.findValueSetsByConceptIds).not.toHaveBeenCalled();
    });

    it('con `lang` devuelve la designación de ese idioma y su definición', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.search.mockResolvedValue([conceptoIngles]);
      designationsRepo.findPreferredByLanguageForConcepts.mockResolvedValue(
        new Map([['concept-1', { value: 'Leve' }]]),
      );
      designationsRepo.findPropertyForConcepts.mockResolvedValue([
        {
          conceptId: 'concept-1',
          valueJson: 'Molesta pero no limita la vida diaria.',
        },
      ]);

      const result = await service.searchConcepts(
        undefined,
        undefined,
        50,
        undefined,
        {
          language: 'ES',
        },
      );

      expect(result.items[0]).toMatchObject({
        display: 'Leve',
        definition: 'Molesta pero no limita la vida diaria.',
        translated: true,
      });
      expect(
        designationsRepo.findPreferredByLanguageForConcepts,
      ).toHaveBeenCalledWith(
        expect.anything(),
        ['concept-1'],
        CONCEPTS.LANG_ES,
      );
    });

    it('sin traducción cargada devuelve el original y lo marca — no lo deja en blanco', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.search.mockResolvedValue([conceptoIngles]);

      const result = await service.searchConcepts(
        undefined,
        undefined,
        50,
        undefined,
        {
          language: 'ES',
        },
      );

      expect(result.items[0]).toMatchObject({
        display: 'Mild',
        translated: false,
      });
    });

    it('una definición que no sea texto se descarta en vez de pintarse cruda', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.search.mockResolvedValue([conceptoIngles]);
      designationsRepo.findPropertyForConcepts.mockResolvedValue([
        { conceptId: 'concept-1', valueJson: { texto: 'algo' } },
      ]);

      const result = await service.searchConcepts(
        undefined,
        undefined,
        50,
        undefined,
        {
          language: 'ES',
        },
      );

      expect(result.items[0].definition).toBeUndefined();
    });

    it('resuelve las etiquetas de toda la página en una sola consulta', async () => {
      const { service, conceptsRepo, valueSetsRepo } = build();
      conceptsRepo.search.mockResolvedValue([
        conceptoIngles,
        { ...conceptoIngles, id: 'concept-2', code: 'COND_SEV_SEVERE' },
      ]);
      valueSetsRepo.findValueSetsByConceptIds.mockResolvedValue(
        new Map([
          [
            'concept-1',
            [
              {
                id: 'vs-1',
                internalCode: 'condition-severity',
                name: 'Severidad',
              },
            ],
          ],
        ]),
      );

      const result = await service.searchConcepts(
        undefined,
        undefined,
        50,
        undefined,
        {
          includeValueSets: true,
        },
      );

      expect(valueSetsRepo.findValueSetsByConceptIds).toHaveBeenCalledTimes(1);
      expect(valueSetsRepo.findValueSetsByConceptIds).toHaveBeenCalledWith(
        expect.anything(),
        ['concept-1', 'concept-2'],
      );
      expect(result.items[0].valueSets).toEqual([
        { id: 'vs-1', internalCode: 'condition-severity', name: 'Severidad' },
      ]);
      // Un concepto que no está en ningún conjunto trae la lista vacía, no
      // `undefined`: la pantalla no tiene que ramificar por ausencia.
      expect(result.items[1].valueSets).toEqual([]);
    });

    it('con `lang` ordena por nombre — un glosario se lee alfabético', async () => {
      const { service, conceptsRepo, designationsRepo } = build();
      conceptsRepo.search.mockResolvedValue([
        { ...conceptoIngles, id: 'c-1', code: 'A_CODE' },
        { ...conceptoIngles, id: 'c-2', code: 'B_CODE' },
      ]);
      designationsRepo.findPreferredByLanguageForConcepts.mockResolvedValue(
        new Map([
          ['c-1', { value: 'Zurdo' }],
          ['c-2', { value: 'Ámbito' }],
        ]),
      );

      const result = await service.searchConcepts(
        undefined,
        undefined,
        50,
        undefined,
        { language: 'ES' },
      );

      // Y con las tildes en su sitio: «Ámbito» va antes que «Zurdo».
      expect(result.items.map((item: any) => item.display)).toEqual([
        'Ámbito',
        'Zurdo',
      ]);
    });

    it('sin `lang` conserva el orden del catálogo, que es por código', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.search.mockResolvedValue([
        { ...conceptoIngles, id: 'c-1', code: 'A_CODE', display: 'Zebra' },
        { ...conceptoIngles, id: 'c-2', code: 'B_CODE', display: 'Alfa' },
      ]);

      const result = await service.searchConcepts(undefined, undefined, 50);

      expect(result.items.map((item: any) => item.display)).toEqual([
        'Zebra',
        'Alfa',
      ]);
    });
  });

  describe('searchConcepts · filtro por categoría', () => {
    it('acota a los conceptos del conjunto de valores pedido', async () => {
      const { service, conceptsRepo, valueSetsRepo, em } = build();
      valueSetsRepo.findIncludedConceptIdsByValueSet.mockResolvedValue([
        'concept-1',
        'concept-2',
      ]);

      await service.searchConcepts(undefined, undefined, 50, undefined, {
        valueSetId: 'vs-1',
      });

      expect(conceptsRepo.search).toHaveBeenCalledWith(
        em,
        {
          query: undefined,
          codeSystemVersionId: undefined,
          ids: ['concept-1', 'concept-2'],
        },
        50,
      );
    });

    it('combinado con `ids` vale la intersección: cada filtro acota', async () => {
      const { service, conceptsRepo, valueSetsRepo } = build();
      valueSetsRepo.findIncludedConceptIdsByValueSet.mockResolvedValue([
        'concept-1',
        'concept-2',
      ]);

      await service.searchConcepts(
        undefined,
        undefined,
        50,
        ['concept-2', 'concept-9'],
        { valueSetId: 'vs-1' },
      );

      expect(conceptsRepo.search).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ ids: ['concept-2'] }),
        50,
      );
    });

    it('una categoría vacía devuelve cero términos, nunca el catálogo entero', async () => {
      const { service, conceptsRepo, valueSetsRepo } = build();
      valueSetsRepo.findIncludedConceptIdsByValueSet.mockResolvedValue([]);

      const result = await service.searchConcepts(
        undefined,
        undefined,
        50,
        undefined,
        { valueSetId: 'vs-vacio' },
      );

      expect(result.count).toBe(0);
      expect(conceptsRepo.search).not.toHaveBeenCalled();
    });

    it('una categoría inexistente es 404, no una lista vacía', async () => {
      const { service, valueSetsRepo } = build();
      valueSetsRepo.findIncludedConceptIdsByValueSet.mockResolvedValue(null);

      await expect(
        service.searchConcepts(undefined, undefined, 50, undefined, {
          valueSetId: 'fantasma',
        }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('readConcept', () => {
    const concepto = {
      id: 'concept-1',
      code: 'I10',
      display: 'Hipertensión esencial',
      definition: undefined,
      selectable: true,
      codeSystemVersionId: 'version-1',
    };

    it('arma la ficha con sus textos, sus etiquetas y sus sinónimos', async () => {
      const { service, conceptsRepo, designationsRepo, valueSetsRepo } =
        build();
      conceptsRepo.findById.mockResolvedValue(concepto);
      designationsRepo.findPreferredByLanguageForConcepts.mockResolvedValue(
        new Map([['concept-1', { value: 'Hipertensión esencial' }]]),
      );
      designationsRepo.findPropertyForConcepts.mockResolvedValue([
        { conceptId: 'concept-1', valueJson: 'Presión arterial alta.' },
      ]);
      designationsRepo.findByConcept.mockResolvedValue([
        {
          value: 'Hipertensión esencial',
          languageConceptId: CONCEPTS.LANG_ES,
          preferred: true,
        },
        {
          value: 'Hypertensive disorder',
          languageConceptId: CONCEPTS.LANG_EN,
          preferred: true,
        },
      ]);
      valueSetsRepo.findValueSetsByConceptIds.mockResolvedValue(
        new Map([
          [
            'concept-1',
            [
              {
                id: 'vs-1',
                internalCode: 'condition-code',
                name: 'Diagnóstico',
              },
            ],
          ],
        ]),
      );

      const ficha = await service.readConcept('concept-1', 'ES');

      expect(ficha).toMatchObject({
        conceptId: 'concept-1',
        code: 'I10',
        display: 'Hipertensión esencial',
        definition: 'Presión arterial alta.',
        translated: true,
      });
      expect(ficha.valueSets).toEqual([
        { id: 'vs-1', internalCode: 'condition-code', name: 'Diagnóstico' },
      ]);
      // El nombre que ya se muestra arriba no vuelve como sinónimo de sí mismo.
      expect(ficha.synonyms).toEqual([
        {
          value: 'Hypertensive disorder',
          language: 'EN',
          preferred: true,
        },
      ]);
    });

    it('un concepto inexistente es 404, no una ficha vacía', async () => {
      const { service, conceptsRepo } = build();
      conceptsRepo.findById.mockResolvedValue(null);

      await expect(service.readConcept('fantasma')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  /**
   * La extensión del glosario médico (Carril 03): categoría/etiquetas
   * separadas de `valueSets`, relaciones tipadas resueltas, respaldo a
   * castellano cuando falta el inglés, y exclusión de borradores.
   */
  describe('glosario médico', () => {
    const glossaryValueSets = [
      {
        id: 'vs-cat-1',
        internalCode: 'glossary-category-anatomy',
        name: 'Anatomía',
      },
      {
        id: 'vs-tag-1',
        internalCode: 'glossary-tag-cardiovascular',
        name: 'Cardiovascular',
      },
      {
        id: 'vs-umbrella',
        internalCode: GLOSSARY_ALL_TERMS_CODE,
        name: 'Glosario médico',
      },
    ];

    describe('búsqueda', () => {
      it('acotada a un value set del glosario trae slug/categoría/etiquetas/resumen/estado y filtra por activo', async () => {
        const { service, conceptsRepo, designationsRepo, valueSetsRepo, em } =
          build();
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: 'glossary-category-anatomy',
        });
        conceptsRepo.searchGlossaryPage.mockResolvedValue({
          ids: ['concept-1'],
          total: 1,
        });
        conceptsRepo.findByIds.mockResolvedValue(
          new Map([
            [
              'concept-1',
              {
                id: 'concept-1',
                code: 'GLOSSARY_CORAZON',
                display: 'Heart',
                definition: undefined,
                selectable: true,
                codeSystemVersionId: 'v1',
                stateConceptId: CONCEPTS.TERM_ACTIVE,
              },
            ],
          ]),
        );
        valueSetsRepo.findValueSetsByConceptIds.mockResolvedValue(
          new Map([['concept-1', glossaryValueSets]]),
        );
        designationsRepo.findPropertyForConcepts.mockImplementation(
          (_em: unknown, ids: string[], propertyCode: string) => {
            if (
              propertyCode === GLOSSARY_SLUG_PROPERTY_CODE &&
              ids.includes('concept-1')
            ) {
              return Promise.resolve([
                { conceptId: 'concept-1', valueJson: 'corazon' },
              ]);
            }
            if (
              propertyCode === GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE &&
              ids.includes('concept-1')
            ) {
              return Promise.resolve([
                { conceptId: 'concept-1', valueJson: { es: 'Resumen corto' } },
              ]);
            }
            return Promise.resolve([]);
          },
        );

        const result = await service.searchConcepts(
          undefined,
          undefined,
          50,
          undefined,
          { valueSetId: 'vs-1' },
        );

        expect(conceptsRepo.searchGlossaryPage).toHaveBeenCalledWith(
          em,
          expect.objectContaining({
            valueSetVersionId: 'vsv-1',
            stateConceptId: CONCEPTS.TERM_ACTIVE,
          }),
          50,
          0,
        );
        // Ya no se pasa por la lista de ids del conjunto: con cientos de miles
        // de términos, eso era un `IN` del tamaño del glosario.
        expect(
          valueSetsRepo.findIncludedConceptIdsByValueSet,
        ).not.toHaveBeenCalled();
        expect(conceptsRepo.search).not.toHaveBeenCalled();
        expect(result).toMatchObject({ count: 1, total: 1, offset: 0 });
        expect(result.items[0]).toMatchObject({
          slug: 'corazon',
          category: {
            internalCode: 'glossary-category-anatomy',
            name: 'Anatomía',
          },
          tags: ['Cardiovascular'],
          shortDefinition: 'Resumen corto',
          relationsCount: 0,
          status: 'active',
        });
      });

      /**
       * Reproduce el defecto real: `searchGlossary` (única consumidora de
       * `includeValueSets`) pide texto libre SIN categoría, así que nunca
       * manda `valueSetId`. Antes de este cambio, `searchConcepts` entraba
       * sin acotar y devolvía la forma pelada del catálogo — el front, que
       * asume `category`/`tags`/`relationsCount`, revienta al pintar la
       * primera fila.
       */
      it('con `includeValueSets` y SIN `valueSetId`, resuelve el paraguas del glosario y trae la forma completa', async () => {
        const { service, conceptsRepo, valueSetsRepo, em } = build();
        valueSetsRepo.findByInternalCode.mockResolvedValue({
          id: 'vs-umbrella',
          internalCode: GLOSSARY_ALL_TERMS_CODE,
        });
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: GLOSSARY_ALL_TERMS_CODE,
        });
        conceptsRepo.searchGlossaryPage.mockResolvedValue({
          ids: ['concept-1'],
          total: 1,
        });
        conceptsRepo.findByIds.mockResolvedValue(
          new Map([
            [
              'concept-1',
              {
                id: 'concept-1',
                code: 'GLOSSARY_PARACETAMOL',
                display: 'Paracetamol',
                definition: undefined,
                selectable: true,
                codeSystemVersionId: 'v1',
                stateConceptId: CONCEPTS.TERM_ACTIVE,
              },
            ],
          ]),
        );

        const result = await service.searchConcepts(
          'paracetamol',
          undefined,
          200,
          undefined,
          { language: 'ES', includeValueSets: true },
        );

        expect(valueSetsRepo.findByInternalCode).toHaveBeenCalledWith(
          em,
          GLOSSARY_ALL_TERMS_CODE,
        );
        expect(conceptsRepo.searchGlossaryPage).toHaveBeenCalledWith(
          em,
          expect.objectContaining({
            query: 'paracetamol',
            stateConceptId: CONCEPTS.TERM_ACTIVE,
          }),
          200,
          0,
        );
        expect(Object.keys(result.items[0])).toEqual(
          expect.arrayContaining([
            'category',
            'tags',
            'relationsCount',
            'status',
            'shortDefinition',
          ]),
        );
      });

      it('con `includeValueSets` y el paraguas sin sembrar, sigue de largo sin acotar (no lanza 404)', async () => {
        const { service, conceptsRepo, valueSetsRepo } = build();
        valueSetsRepo.findByInternalCode.mockResolvedValue(null);
        conceptsRepo.search.mockResolvedValue([
          {
            id: 'concept-1',
            code: 'N02BE01',
            display: 'Paracetamol',
            definition: undefined,
            selectable: true,
            codeSystemVersionId: 'v1',
          },
        ]);

        const result = await service.searchConcepts(
          'paracetamol',
          undefined,
          200,
          undefined,
          { language: 'ES', includeValueSets: true },
        );

        expect(
          valueSetsRepo.findIncludedConceptIdsByValueSet,
        ).not.toHaveBeenCalled();
        expect(result.items[0]).not.toHaveProperty('category');
        expect(result.items[0]).not.toHaveProperty('tags');
      });

      it('`includeValueSets` sin `valueSetId` NUNCA lanza 404: sólo un `valueSetId` explícito lo hace', async () => {
        const { service, valueSetsRepo } = build();
        valueSetsRepo.findByInternalCode.mockResolvedValue({
          id: 'vs-umbrella',
          internalCode: GLOSSARY_ALL_TERMS_CODE,
        });
        valueSetsRepo.findIncludedConceptIdsByValueSet.mockResolvedValue(null);

        await expect(
          service.searchConcepts(undefined, undefined, 50, undefined, {
            includeValueSets: true,
          }),
        ).resolves.toMatchObject({ count: 0 });
      });

      it('fuera del glosario (otro value set) no agrega ninguno de los campos nuevos ni filtra por estado', async () => {
        const { service, conceptsRepo, valueSetsRepo, em } = build();
        valueSetsRepo.findIncludedConceptIdsByValueSet.mockResolvedValue([
          'concept-1',
        ]);
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: 'administrative-gender',
        });
        conceptsRepo.search.mockResolvedValue([
          {
            id: 'concept-1',
            code: 'GENDER_FEMALE',
            display: 'Female',
            definition: undefined,
            selectable: true,
            codeSystemVersionId: 'v1',
          },
        ]);

        const result = await service.searchConcepts(
          undefined,
          undefined,
          50,
          undefined,
          { valueSetId: 'vs-1' },
        );

        expect(conceptsRepo.search).toHaveBeenCalledWith(
          em,
          {
            query: undefined,
            codeSystemVersionId: undefined,
            ids: ['concept-1'],
          },
          50,
        );
        expect(Object.keys(result.items[0])).not.toContain('slug');
        expect(Object.keys(result.items[0])).not.toContain('category');
        expect(Object.keys(result.items[0])).not.toContain('status');
      });
    });

    describe('búsqueda paginada (glosario de cientos de miles de términos)', () => {
      const corazon = {
        id: 'concept-1',
        code: 'GLOSSARY_CORAZON',
        display: 'Heart',
        definition: undefined,
        selectable: true,
        codeSystemVersionId: 'v1',
        stateConceptId: CONCEPTS.TERM_ACTIVE,
      };
      const aorta = { ...corazon, id: 'concept-2', code: 'GLOSSARY_AORTA' };

      it('pasa el desplazamiento y devuelve el total, no sólo lo de la página', async () => {
        const { service, conceptsRepo, valueSetsRepo } = build();
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: 'glossary-category-anatomy',
        });
        conceptsRepo.searchGlossaryPage.mockResolvedValue({
          ids: ['concept-2', 'concept-1'],
          total: 1234,
        });
        conceptsRepo.findByIds.mockResolvedValue(
          new Map([
            ['concept-1', corazon],
            ['concept-2', aorta],
          ]),
        );

        const result = await service.searchConcepts(
          'cora',
          undefined,
          24,
          undefined,
          { valueSetId: 'vs-cat', offset: 48, language: 'ES' },
        );

        expect(conceptsRepo.searchGlossaryPage).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ query: 'cora' }),
          24,
          48,
        );
        expect(result).toMatchObject({
          count: 2,
          total: 1234,
          offset: 48,
          limit: 24,
        });
      });

      it('conserva el orden de la base, sin reordenar la página en memoria', async () => {
        const { service, conceptsRepo, valueSetsRepo } = build();
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: 'glossary-category-anatomy',
        });
        // La base dijo «corazón» antes que «aorta» (por ejemplo, porque el
        // nombre en castellano ordena distinto que el `display` inglés).
        conceptsRepo.searchGlossaryPage.mockResolvedValue({
          ids: ['concept-1', 'concept-2'],
          total: 2,
        });
        conceptsRepo.findByIds.mockResolvedValue(
          new Map([
            ['concept-2', { ...aorta, display: 'Aorta' }],
            ['concept-1', { ...corazon, display: 'Zzz' }],
          ]),
        );

        const result = await service.searchConcepts(
          undefined,
          undefined,
          50,
          undefined,
          { valueSetId: 'vs-cat', language: 'ES' },
        );

        expect(result.items.map((item) => item.conceptId)).toEqual([
          'concept-1',
          'concept-2',
        ]);
      });

      it('una etiqueta se resuelve a su versión vigente y se intersecta en la base', async () => {
        const { service, conceptsRepo, valueSetsRepo } = build();
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: 'glossary-category-disease',
        });
        valueSetsRepo.findDefaultVersion.mockImplementation(
          (_em: unknown, id: string) =>
            Promise.resolve({ id: id === 'vs-tag' ? 'vsv-tag' : 'vsv-cat' }),
        );

        await service.searchConcepts(undefined, undefined, 50, undefined, {
          valueSetId: 'vs-cat',
          tagValueSetId: 'vs-tag',
        });

        expect(conceptsRepo.searchGlossaryPage).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            valueSetVersionId: 'vsv-cat',
            tagValueSetVersionId: 'vsv-tag',
          }),
          50,
          0,
        );
      });

      it('una etiqueta sin versión vigente es 404, no una lista sin filtrar', async () => {
        const { service, conceptsRepo, valueSetsRepo } = build();
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: 'glossary-category-disease',
        });
        valueSetsRepo.findDefaultVersion.mockImplementation(
          (_em: unknown, id: string) =>
            Promise.resolve(id === 'vs-tag' ? null : { id: 'vsv-cat' }),
        );

        await expect(
          service.searchConcepts(undefined, undefined, 50, undefined, {
            valueSetId: 'vs-cat',
            tagValueSetId: 'vs-tag',
          }),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(conceptsRepo.searchGlossaryPage).not.toHaveBeenCalled();
      });

      it('una categoría del glosario sin versión vigente, pedida explícitamente, es 404', async () => {
        const { service, valueSetsRepo } = build();
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: 'glossary-category-disease',
        });
        valueSetsRepo.findDefaultVersion.mockResolvedValue(null);

        await expect(
          service.searchConcepts(undefined, undefined, 50, undefined, {
            valueSetId: 'vs-cat',
          }),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
      });

      it('trae la miniatura de la imagen del término, si la tiene', async () => {
        const { service, conceptsRepo, designationsRepo, valueSetsRepo } =
          build();
        valueSetsRepo.findById.mockResolvedValue({
          internalCode: GLOSSARY_ALL_TERMS_CODE,
        });
        conceptsRepo.searchGlossaryPage.mockResolvedValue({
          ids: ['concept-1', 'concept-2'],
          total: 2,
        });
        conceptsRepo.findByIds.mockResolvedValue(
          new Map([
            ['concept-1', corazon],
            ['concept-2', aorta],
          ]),
        );
        designationsRepo.findPropertyForConcepts.mockImplementation(
          (_em: unknown, _ids: string[], propertyCode: string) =>
            Promise.resolve(
              propertyCode === GLOSSARY_IMAGE_PROPERTY_CODE
                ? [
                    {
                      conceptId: 'concept-1',
                      valueJson: {
                        url: 'https://upload.wikimedia.org/heart.jpg',
                        thumbUrl: 'https://upload.wikimedia.org/heart-320.jpg',
                        attribution: 'Autor X',
                        license: 'CC BY-SA 4.0',
                      },
                    },
                  ]
                : [],
            ),
        );

        const result = await service.searchConcepts(
          undefined,
          undefined,
          50,
          undefined,
          { includeValueSets: true, valueSetId: 'vs-umbrella' },
        );

        expect(result.items[0]).toMatchObject({
          imageThumbnailUrl: 'https://upload.wikimedia.org/heart-320.jpg',
        });
        expect(result.items[1]).not.toHaveProperty('imageThumbnailUrl');
      });
    });

    describe('vecindario', () => {
      const FOCUS = 'concept-fiebre';
      const CATEGORY = {
        id: 'vs-cat-sintomas',
        internalCode: 'glossary-category-symptoms',
        name: 'Síntomas',
      };
      const UMBRELLA = glossaryValueSets[2];

      interface FixtureTerm {
        id: string;
        display: string;
        slug?: string;
        state?: string;
      }

      const edge = (
        sourceConceptId: string,
        targetConceptId: string,
        relationshipTypeConceptId: string,
      ) => ({ sourceConceptId, targetConceptId, relationshipTypeConceptId });

      /**
       * Un glosario mínimo: el término central («Fiebre») más los vecinos que
       * cada prueba declare. Todos pertenecen al paraguas; `categorized` los
       * pone además en la categoría «Síntomas».
       */
      function setUpNeighborhood(
        neighbors: FixtureTerm[],
        {
          focusState = CONCEPTS.TERM_ACTIVE,
          focusInGlossary = true,
          focusSlug = 'fiebre',
        }: {
          focusState?: string;
          focusInGlossary?: boolean;
          focusSlug?: string | null;
        } = {},
      ) {
        const built = build();
        const {
          conceptsRepo,
          designationsRepo,
          valueSetsRepo,
          relationshipsRepo,
        } = built;
        const terms: FixtureTerm[] = [
          {
            id: FOCUS,
            display: 'Fiebre',
            slug: focusSlug ?? undefined,
            state: focusState,
          },
          ...neighbors,
        ];
        const concept = (term: FixtureTerm) => ({
          id: term.id,
          display: term.display,
          stateConceptId: term.state ?? CONCEPTS.TERM_ACTIVE,
        });
        conceptsRepo.findById.mockImplementation((_em: unknown, id: string) =>
          Promise.resolve(
            terms.filter((term) => term.id === id).map(concept)[0] ?? null,
          ),
        );
        conceptsRepo.findByIds.mockImplementation(
          (_em: unknown, ids: string[]) =>
            Promise.resolve(
              new Map(
                terms
                  .filter((term) => ids.includes(term.id))
                  .map((term) => [term.id, concept(term)]),
              ),
            ),
        );
        designationsRepo.findPropertyForConcepts.mockImplementation(
          (_em: unknown, ids: string[], code: string) =>
            Promise.resolve(
              code === GLOSSARY_SLUG_PROPERTY_CODE
                ? terms
                    .filter(
                      (term) =>
                        ids.includes(term.id) && term.slug !== undefined,
                    )
                    .map((term) => ({
                      conceptId: term.id,
                      valueJson: term.slug,
                    }))
                : [],
            ),
        );
        valueSetsRepo.findValueSetsByConceptIds.mockImplementation(
          (_em: unknown, ids: string[]) =>
            Promise.resolve(
              new Map(
                ids.map((id) => [
                  id,
                  id === FOCUS && !focusInGlossary
                    ? [CATEGORY]
                    : [UMBRELLA, CATEGORY],
                ]),
              ),
            ),
        );
        return built;
      }

      const diseases: FixtureTerm[] = [
        { id: 'c-neumonia', display: 'Neumonía', slug: 'neumonia' },
        { id: 'c-gripe', display: 'Gripe', slug: 'gripe' },
        { id: 'c-dengue', display: 'Dengue', slug: 'dengue' },
      ];

      it('lee los dos sentidos: el síntoma muestra las enfermedades que lo presentan (entrantes)', async () => {
        const { service, relationshipsRepo, em } = setUpNeighborhood(diseases);
        relationshipsRepo.countNeighborsByType.mockResolvedValue([
          {
            relationshipTypeConceptId: CONCEPTS.REL_SYMPTOM,
            direction: 'incoming',
            total: 3,
          },
        ]);
        // La relación se guarda en la enfermedad: enfermedad → síntoma.
        relationshipsRepo.findByTypesForTargets.mockResolvedValue(
          diseases.map((d) => edge(d.id, FOCUS, CONCEPTS.REL_SYMPTOM)),
        );

        const result = await service.readGlossaryNeighborhood(FOCUS, 'ES', {
          perGroup: 8,
        });

        expect(relationshipsRepo.findByTypesForTargets).toHaveBeenCalledWith(
          em,
          expect.arrayContaining([CONCEPTS.REL_SYMPTOM]),
          [FOCUS],
        );
        expect(result.focus).toEqual({
          conceptId: FOCUS,
          slug: 'fiebre',
          display: 'Fiebre',
          category: { internalCode: CATEGORY.internalCode, name: 'Síntomas' },
          shortDefinition: '',
        });
        expect(result.groups).toEqual([
          {
            type: 'SYMPTOM',
            direction: 'incoming',
            total: 3,
            // Alfabético en castellano, no el orden en que vinieron las aristas.
            items: [
              expect.objectContaining({
                conceptId: 'c-dengue',
                display: 'Dengue',
              }),
              expect.objectContaining({
                conceptId: 'c-gripe',
                display: 'Gripe',
              }),
              expect.objectContaining({
                conceptId: 'c-neumonia',
                slug: 'neumonia',
                category: {
                  internalCode: CATEGORY.internalCode,
                  name: 'Síntomas',
                },
              }),
            ],
          },
        ]);
      });

      it('lee las relaciones salientes con el término como origen', async () => {
        const treatments: FixtureTerm[] = [
          { id: 'c-paracetamol', display: 'Paracetamol', slug: 'paracetamol' },
        ];
        const { service, relationshipsRepo, em } =
          setUpNeighborhood(treatments);
        relationshipsRepo.countNeighborsByType.mockResolvedValue([
          {
            relationshipTypeConceptId: CONCEPTS.REL_TREATMENT,
            direction: 'outgoing',
            total: 1,
          },
        ]);
        relationshipsRepo.findByTypesForSources.mockResolvedValue([
          edge(FOCUS, 'c-paracetamol', CONCEPTS.REL_TREATMENT),
        ]);

        const result = await service.readGlossaryNeighborhood(FOCUS, 'ES', {
          perGroup: 8,
        });

        expect(relationshipsRepo.findByTypesForSources).toHaveBeenCalledWith(
          em,
          expect.any(Array),
          [FOCUS],
        );
        expect(result.groups).toEqual([
          expect.objectContaining({
            type: 'TREATMENT',
            direction: 'outgoing',
            total: 1,
            items: [
              expect.objectContaining({
                conceptId: 'c-paracetamol',
                slug: 'paracetamol',
              }),
            ],
          }),
        ]);
      });

      it('el total es el del grupo y no el de la muestra: perGroup recorta los ítems, no el total', async () => {
        const many: FixtureTerm[] = Array.from({ length: 12 }, (_, i) => ({
          id: `c-enf-${String(i).padStart(2, '0')}`,
          display: `Enfermedad ${String(i).padStart(2, '0')}`,
          slug: `enfermedad-${i}`,
        }));
        const { service, relationshipsRepo } = setUpNeighborhood(many);
        relationshipsRepo.countNeighborsByType.mockResolvedValue([
          {
            relationshipTypeConceptId: CONCEPTS.REL_SYMPTOM,
            direction: 'incoming',
            total: 12,
          },
        ]);
        relationshipsRepo.findByTypesForTargets.mockResolvedValue(
          many.map((d) => edge(d.id, FOCUS, CONCEPTS.REL_SYMPTOM)),
        );

        const result = await service.readGlossaryNeighborhood(FOCUS, 'ES', {
          perGroup: 5,
        });

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].total).toBe(12);
        expect(result.groups[0].items.map((i) => i.display)).toEqual([
          'Enfermedad 00',
          'Enfermedad 01',
          'Enfermedad 02',
          'Enfermedad 03',
          'Enfermedad 04',
        ]);
      });

      it('la página de un grupo pide sólo ese tipo y ese sentido, y respeta offset y limit', async () => {
        const many: FixtureTerm[] = Array.from({ length: 6 }, (_, i) => ({
          id: `c-enf-${i}`,
          display: `Enfermedad ${i}`,
          slug: `enfermedad-${i}`,
        }));
        const { service, relationshipsRepo, em } = setUpNeighborhood(many);
        relationshipsRepo.countNeighborsByType.mockResolvedValue([
          {
            relationshipTypeConceptId: CONCEPTS.REL_SYMPTOM,
            direction: 'incoming',
            total: 6,
          },
          // El otro sentido existe pero no se pidió: no puede colarse.
          {
            relationshipTypeConceptId: CONCEPTS.REL_SYMPTOM,
            direction: 'outgoing',
            total: 99,
          },
        ]);
        relationshipsRepo.findByTypesForTargets.mockResolvedValue(
          many.map((d) => edge(d.id, FOCUS, CONCEPTS.REL_SYMPTOM)),
        );

        const result = await service.readGlossaryNeighborhood(FOCUS, 'ES', {
          type: 'SYMPTOM',
          direction: 'incoming',
          offset: 2,
          limit: 3,
        });

        expect(relationshipsRepo.countNeighborsByType).toHaveBeenCalledWith(
          em,
          FOCUS,
          [CONCEPTS.REL_SYMPTOM],
          expect.any(Object),
        );
        expect(relationshipsRepo.findByTypesForSources).not.toHaveBeenCalled();
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0]).toMatchObject({
          type: 'SYMPTOM',
          direction: 'incoming',
          total: 6,
        });
        expect(result.groups[0].items.map((i) => i.display)).toEqual([
          'Enfermedad 2',
          'Enfermedad 3',
          'Enfermedad 4',
        ]);
      });

      it('omite vecinos sin slug, sin publicar, repetidos y el propio término', async () => {
        const mixed: FixtureTerm[] = [
          { id: 'c-ok', display: 'Gripe', slug: 'gripe' },
          { id: 'c-sin-slug', display: 'Sin slug', slug: undefined },
          {
            id: 'c-borrador',
            display: 'Borrador',
            slug: 'borrador',
            state: CONCEPTS.TERM_DRAFT,
          },
        ];
        const { service, relationshipsRepo } = setUpNeighborhood(mixed);
        relationshipsRepo.countNeighborsByType.mockResolvedValue([
          {
            relationshipTypeConceptId: CONCEPTS.REL_SYMPTOM,
            direction: 'incoming',
            total: 1,
          },
        ]);
        relationshipsRepo.findByTypesForTargets.mockResolvedValue([
          edge('c-ok', FOCUS, CONCEPTS.REL_SYMPTOM),
          edge('c-ok', FOCUS, CONCEPTS.REL_SYMPTOM),
          edge('c-sin-slug', FOCUS, CONCEPTS.REL_SYMPTOM),
          edge('c-borrador', FOCUS, CONCEPTS.REL_SYMPTOM),
          edge(FOCUS, FOCUS, CONCEPTS.REL_SYMPTOM),
          edge('c-inexistente', FOCUS, CONCEPTS.REL_SYMPTOM),
        ]);

        const result = await service.readGlossaryNeighborhood(FOCUS, 'ES', {
          perGroup: 8,
        });

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].items.map((i) => i.conceptId)).toEqual([
          'c-ok',
        ]);
      });

      it('un término sin vecinos devuelve el foco y ningún grupo', async () => {
        const { service, relationshipsRepo } = setUpNeighborhood([]);

        const result = await service.readGlossaryNeighborhood(FOCUS, 'ES', {
          perGroup: 8,
        });

        expect(result.focus.conceptId).toBe(FOCUS);
        expect(result.groups).toEqual([]);
        expect(relationshipsRepo.findByTypesForSources).not.toHaveBeenCalled();
        expect(relationshipsRepo.findByTypesForTargets).not.toHaveBeenCalled();
      });

      it('ordena los grupos por tipo y sentido de forma estable', async () => {
        const { service, relationshipsRepo } = setUpNeighborhood(diseases);
        relationshipsRepo.countNeighborsByType.mockResolvedValue([
          {
            relationshipTypeConceptId: CONCEPTS.REL_SYMPTOM,
            direction: 'incoming',
            total: 1,
          },
          {
            relationshipTypeConceptId: CONCEPTS.REL_DISEASE,
            direction: 'outgoing',
            total: 1,
          },
          {
            relationshipTypeConceptId: CONCEPTS.REL_SYMPTOM,
            direction: 'outgoing',
            total: 1,
          },
        ]);
        relationshipsRepo.findByTypesForSources.mockResolvedValue([
          edge(FOCUS, 'c-gripe', CONCEPTS.REL_DISEASE),
          edge(FOCUS, 'c-dengue', CONCEPTS.REL_SYMPTOM),
        ]);
        relationshipsRepo.findByTypesForTargets.mockResolvedValue([
          edge('c-neumonia', FOCUS, CONCEPTS.REL_SYMPTOM),
        ]);

        const result = await service.readGlossaryNeighborhood(FOCUS, 'ES', {
          perGroup: 8,
        });

        expect(
          result.groups.map((group) => `${group.type}|${group.direction}`),
        ).toEqual(['DISEASE|outgoing', 'SYMPTOM|outgoing', 'SYMPTOM|incoming']);
      });

      it.each([
        ['no existe', () => ({ found: false })],
        ['no es del glosario', () => ({ found: true, inGlossary: false })],
        ['es un borrador', () => ({ found: true, state: CONCEPTS.TERM_DRAFT })],
        ['no tiene slug', () => ({ found: true, slug: null })],
      ])('responde 404 si el concepto %s', async (_name, makeCase) => {
        const scenario = makeCase() as {
          found: boolean;
          inGlossary?: boolean;
          state?: string;
          slug?: string | undefined;
        };
        const { service, conceptsRepo } = setUpNeighborhood([], {
          focusInGlossary: scenario.inGlossary ?? true,
          focusState: scenario.state ?? CONCEPTS.TERM_ACTIVE,
          focusSlug: 'slug' in scenario ? scenario.slug : 'fiebre',
        });
        if (!scenario.found) conceptsRepo.findById.mockResolvedValue(null);

        await expect(
          service.readGlossaryNeighborhood(FOCUS, 'ES', { perGroup: 8 }),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
      });
    });

    describe('ficha', () => {
      /** Configura los mocks comunes a la ficha de un término del glosario. */
      function setUpGlossaryTermFicha({
        stateConceptId = CONCEPTS.TERM_ACTIVE,
      }: { stateConceptId?: string } = {}) {
        const built = build();
        const {
          conceptsRepo,
          designationsRepo,
          valueSetsRepo,
          relationshipsRepo,
        } = built;
        conceptsRepo.findById.mockResolvedValue({
          id: 'concept-1',
          code: 'GLOSSARY_CORAZON',
          display: 'Heart',
          definition: undefined,
          selectable: true,
          codeSystemVersionId: 'v1',
          stateConceptId,
        });
        valueSetsRepo.findValueSetsByConceptIds.mockResolvedValue(
          new Map([['concept-1', glossaryValueSets]]),
        );
        designationsRepo.findByConcept.mockResolvedValue([
          {
            value: 'Corazón',
            languageConceptId: CONCEPTS.LANG_ES,
            preferred: true,
          },
        ]);
        const slugByConcept: Record<string, string> = {
          'concept-1': 'corazon',
          'concept-2': 'insuficiencia-cardiaca',
        };
        const clinicalByConcept: Record<string, { es: string; en?: string }> = {
          'concept-1': { es: 'Definición clínica en castellano' },
        };
        const plainByConcept: Record<string, { es: string; en?: string }> = {
          'concept-1': {
            es: 'Resumen en castellano',
            en: 'Summary in English',
          },
        };
        designationsRepo.findPropertyForConcepts.mockImplementation(
          (_em: unknown, ids: string[], propertyCode: string) => {
            const source =
              propertyCode === GLOSSARY_SLUG_PROPERTY_CODE
                ? slugByConcept
                : propertyCode === GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE
                  ? clinicalByConcept
                  : propertyCode === GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE
                    ? plainByConcept
                    : {};
            return Promise.resolve(
              ids
                .filter((id) => id in source)
                .map((id) => ({
                  conceptId: id,
                  valueJson: (source as any)[id],
                })),
            );
          },
        );
        relationshipsRepo.findByTypesForSources.mockResolvedValue([
          {
            sourceConceptId: 'concept-1',
            targetConceptId: 'concept-2',
            relationshipTypeConceptId: CONCEPTS.REL_ANATOMY,
          },
        ]);
        conceptsRepo.findByIds.mockResolvedValue(
          new Map([
            ['concept-2', { id: 'concept-2', display: 'Heart failure' }],
          ]),
        );
        return built;
      }

      it('separa categoría y etiquetas de `valueSets`, y resuelve las relaciones tipadas', async () => {
        const { service } = setUpGlossaryTermFicha();

        const ficha = await service.readConcept('concept-1');

        expect(ficha.category).toEqual({
          valueSetId: 'vs-cat-1',
          internalCode: 'glossary-category-anatomy',
          name: 'Anatomía',
        });
        expect(ficha.tags).toEqual([
          {
            valueSetId: 'vs-tag-1',
            internalCode: 'glossary-tag-cardiovascular',
            name: 'Cardiovascular',
          },
        ]);
        // El value set paraguas no aparece ni como categoría ni como etiqueta.
        expect(ficha.category?.internalCode).not.toBe(GLOSSARY_ALL_TERMS_CODE);
        expect(
          ficha.tags.some(
            (tag) => tag.internalCode === GLOSSARY_ALL_TERMS_CODE,
          ),
        ).toBe(false);
        expect(ficha.relations).toEqual([
          {
            type: 'ANATOMY',
            conceptId: 'concept-2',
            slug: 'insuficiencia-cardiaca',
            display: 'Heart failure',
          },
        ]);
        expect(ficha.slug).toBe('corazon');
      });

      it('sin `lang`, cae a castellano y lo marca como traducido (es el idioma nativo del contenido)', async () => {
        const { service } = setUpGlossaryTermFicha();

        const ficha = await service.readConcept('concept-1');

        expect(ficha.clinicalDefinition).toEqual({
          text: 'Definición clínica en castellano',
          translated: true,
        });
        expect(ficha.plainSummary).toEqual({
          text: 'Resumen en castellano',
          translated: true,
        });
      });

      it('con `lang=EN`, la definición clínica sin traducir cae a ES y se marca `translated: false`', async () => {
        const { service } = setUpGlossaryTermFicha();

        const ficha = await service.readConcept('concept-1', 'EN');

        // No hay `clinicalDefinition.en` cargado para este término (ver fixture):
        // debe caer al texto en castellano, no dejarlo en blanco.
        expect(ficha.clinicalDefinition).toEqual({
          text: 'Definición clínica en castellano',
          translated: false,
        });
      });

      it('con `lang=EN`, el resumen llano que sí tiene traducción se marca `translated: true`', async () => {
        const { service } = setUpGlossaryTermFicha();

        const ficha = await service.readConcept('concept-1', 'EN');

        expect(ficha.plainSummary).toEqual({
          text: 'Summary in English',
          translated: true,
        });
      });

      it('un término del glosario en borrador es 404, no una ficha a medias', async () => {
        const { service } = setUpGlossaryTermFicha({
          stateConceptId: CONCEPTS.TERM_DRAFT,
        });

        await expect(service.readConcept('concept-1')).rejects.toBeInstanceOf(
          ResourceNotFoundException,
        );
      });

      it('un concepto que no es del glosario no se ve afectado por el filtro de borrador', async () => {
        const { service, conceptsRepo, valueSetsRepo } = build();
        conceptsRepo.findById.mockResolvedValue({
          id: 'concept-1',
          code: 'X',
          display: 'X',
          selectable: true,
          codeSystemVersionId: 'v1',
          stateConceptId: CONCEPTS.TERM_DRAFT,
        });
        // No pertenece a `glossary-all-terms`: el filtro de borrador no aplica.
        valueSetsRepo.findValueSetsByConceptIds.mockResolvedValue(
          new Map([
            [
              'concept-1',
              [
                {
                  id: 'vs-x',
                  internalCode: 'condition-severity',
                  name: 'Severidad',
                },
              ],
            ],
          ]),
        );

        const ficha = await service.readConcept('concept-1');

        expect(ficha.conceptId).toBe('concept-1');
        expect(ficha.category).toBeNull();
      });

      it('publica la imagen del término con su atribución y licencia, y deja `properties` intacto', async () => {
        const { service, designationsRepo } = setUpGlossaryTermFicha();
        const imagen = {
          url: 'https://upload.wikimedia.org/heart.jpg',
          thumbUrl: 'https://upload.wikimedia.org/heart-320.jpg',
          attribution: 'Patrick J. Lynch',
          license: 'CC BY 2.5',
          sourcePage: 'https://commons.wikimedia.org/wiki/File:Heart.jpg',
        };
        designationsRepo.findPropertiesByConcept.mockResolvedValue([
          { propertyCode: GLOSSARY_IMAGE_PROPERTY_CODE, valueJson: imagen },
          { propertyCode: 'source_url', valueJson: 'https://cima.aemps.es/' },
        ]);

        const ficha = await service.readConcept('concept-1', 'ES');

        expect(ficha.image).toEqual({
          source: imagen.url,
          thumbnailSource: imagen.thumbUrl,
          attribution: imagen.attribution,
          license: imagen.license,
          sourcePage: imagen.sourcePage,
          // Sin alt propio, se arma con el nombre que muestra la ficha.
          alt: 'Imagen ilustrativa: Heart',
          status: 'approved',
        });
        expect(ficha.properties).toMatchObject({
          [GLOSSARY_IMAGE_PROPERTY_CODE]: imagen,
          source_url: 'https://cima.aemps.es/',
        });
      });
    });
  });

  describe('imageFromProperty', () => {
    const completa = {
      url: 'https://x/y.jpg',
      attribution: 'Autor',
      license: 'CC0',
    };

    it('sin atribución o sin licencia no publica la imagen', () => {
      expect(
        imageFromProperty({ url: 'https://x/y.jpg', license: 'CC0' }),
      ).toBeUndefined();
      expect(
        imageFromProperty({ url: 'https://x/y.jpg', attribution: 'Autor' }),
      ).toBeUndefined();
      expect(
        imageFromProperty({ attribution: 'A', license: 'B' }),
      ).toBeUndefined();
    });

    it('acepta las grafías del importador (`imageUrl`, `imageThumbUrl`, …)', () => {
      expect(
        imageFromProperty({
          imageUrl: 'https://x/y.jpg',
          imageThumbUrl: 'https://x/y-t.jpg',
          imageAttribution: 'Autor',
          imageLicense: 'CC BY 4.0',
          imageSourcePage: 'https://x/pagina',
        }),
      ).toMatchObject({
        source: 'https://x/y.jpg',
        thumbnailSource: 'https://x/y-t.jpg',
        sourcePage: 'https://x/pagina',
      });
    });

    it('una imagen rechazada en revisión no se publica', () => {
      expect(
        imageFromProperty({ ...completa, status: 'rejected' }),
      ).toBeUndefined();
      expect(
        imageFromProperty({ ...completa, status: 'pending' }),
      ).toMatchObject({ status: 'pending' });
    });

    it('un valor que no es objeto es «sin imagen», no un error', () => {
      expect(imageFromProperty('https://x/y.jpg')).toBeUndefined();
      expect(imageFromProperty(null)).toBeUndefined();
      expect(imageFromProperty([completa])).toBeUndefined();
    });
  });
});
