import { describe, it, expect, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { TerminologyConceptsController } from './terminology-concepts.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyConceptsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const service = {
      addDesignation: jest.fn(),
      addRelationship: jest.fn(),
      upsertProperties: jest.fn(),
      deprecateConcept: jest.fn(),
      readGlossaryNeighborhood: jest.fn(() =>
        Promise.resolve({ focus: {}, groups: [] }),
      ),
      searchConcepts: jest.fn(() =>
        Promise.resolve({ items: [], count: 0, limit: 50 }),
      ),
    } as any;
    const controller = new TerminologyConceptsController(service);
    return { controller, service };
  }

  it('addDesignation delega con el id de concepto', async () => {
    const { controller, service } = build();
    const dto = { value: 'Diabetes' };
    const expected = {
      id: 'd-1',
      conceptId: 'c-1',
      value: 'Diabetes',
      propertiesCount: 0,
    };
    service.addDesignation.mockResolvedValue(expected);

    const result = await controller.addDesignation('c-1', dto, user);

    expect(service.addDesignation).toHaveBeenCalledWith('c-1', dto, user);
    expect(result).toBe(expected);
  });

  it('addRelationship delega con el id de concepto', async () => {
    const { controller, service } = build();
    const dto = { targetConceptId: 'c-2', relationshipType: 'IS_A' as const };
    const expected = {
      id: 'r-1',
      sourceConceptId: 'c-1',
      targetConceptId: 'c-2',
      relationshipTypeConceptId: 'x',
    };
    service.addRelationship.mockResolvedValue(expected);

    const result = await controller.addRelationship('c-1', dto, user);

    expect(service.addRelationship).toHaveBeenCalledWith('c-1', dto, user);
    expect(result).toBe(expected);
  });

  it('upsertProperties delega con el id de concepto', async () => {
    const { controller, service } = build();
    const dto = { properties: [{ propertyCode: 'p1', valueJson: 1 }] };
    const expected = { conceptId: 'c-1', created: 1, updated: 0 };
    service.upsertProperties.mockResolvedValue(expected);

    const result = await controller.upsertProperties('c-1', dto, user);

    expect(service.upsertProperties).toHaveBeenCalledWith('c-1', dto, user);
    expect(result).toBe(expected);
  });

  it('deprecateConcept delega con el id de concepto', async () => {
    const { controller, service } = build();
    const dto = { replacedByConceptId: 'c-2' };
    const expected = {
      id: 'c-1',
      stateConceptId: 'x',
      excludedMembers: 0,
      alreadyRetired: false,
    };
    service.deprecateConcept.mockResolvedValue(expected);

    const result = await controller.deprecateConcept('c-1', dto, user);

    expect(service.deprecateConcept).toHaveBeenCalledWith('c-1', dto, user);
    expect(result).toBe(expected);
  });

  describe('vecindario del glosario', () => {
    const conceptId = '3f2b6c14-0000-4000-8000-000000000001';

    it('la ruta está declarada antes que `:conceptId`, que si no la capturaría', () => {
      const proto = TerminologyConceptsController.prototype;
      const declared = Object.getOwnPropertyNames(proto);

      const handler = Object.getOwnPropertyDescriptor(
        proto,
        'readGlossaryNeighborhood',
      )?.value as object;

      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
        ':conceptId/glossary-neighborhood',
      );
      expect(declared.indexOf('readGlossaryNeighborhood')).toBeLessThan(
        declared.indexOf('readConcept'),
      );
    });

    it('sin tipo ni sentido pide la muestra, con 8 por grupo por omisión', async () => {
      const { controller, service } = build();

      await controller.readGlossaryNeighborhood(conceptId, {});

      expect(service.readGlossaryNeighborhood).toHaveBeenCalledWith(
        conceptId,
        undefined,
        { perGroup: 8 },
      );
    });

    it('pasa perGroup y el idioma tal como llegan', async () => {
      const { controller, service } = build();

      await controller.readGlossaryNeighborhood(conceptId, {
        lang: 'EN',
        perGroup: 20,
      });

      expect(service.readGlossaryNeighborhood).toHaveBeenCalledWith(
        conceptId,
        'EN',
        { perGroup: 20 },
      );
    });

    it('con tipo y sentido pide un grupo, con offset 0 y límite 50 por omisión', async () => {
      const { controller, service } = build();

      await controller.readGlossaryNeighborhood(conceptId, {
        type: 'SYMPTOM',
        direction: 'incoming',
      });

      expect(service.readGlossaryNeighborhood).toHaveBeenCalledWith(
        conceptId,
        undefined,
        { type: 'SYMPTOM', direction: 'incoming', offset: 0, limit: 50 },
      );
    });

    it('con tipo y sentido ignora perGroup: la página manda', async () => {
      const { controller, service } = build();

      await controller.readGlossaryNeighborhood(conceptId, {
        type: 'TREATMENT',
        direction: 'outgoing',
        offset: 50,
        limit: 25,
        perGroup: 3,
      });

      expect(service.readGlossaryNeighborhood).toHaveBeenCalledWith(
        conceptId,
        undefined,
        { type: 'TREATMENT', direction: 'outgoing', offset: 50, limit: 25 },
      );
    });
  });

  describe('búsqueda paginada del glosario', () => {
    it('pasa `offset` y `tagValueSetId` al servicio', async () => {
      const { controller, service } = build();

      await controller.searchConcepts(
        'cora',
        undefined,
        24,
        undefined,
        'ES',
        'true',
        'vs-cat',
        'vs-tag',
        '48',
      );

      expect(service.searchConcepts).toHaveBeenCalledWith(
        'cora',
        undefined,
        24,
        undefined,
        {
          language: 'ES',
          valueSetId: 'vs-cat',
          tagValueSetId: 'vs-tag',
          offset: 48,
          includeValueSets: true,
        },
      );
    });

    it('sin `offset` no lo agrega: el resto de las búsquedas sigue igual', async () => {
      const { controller, service } = build();

      await controller.searchConcepts('x');

      expect(service.searchConcepts).toHaveBeenCalledWith(
        'x',
        undefined,
        50,
        undefined,
        { includeValueSets: false },
      );
    });

    it.each(['-1', '1.5', 'abc', '1000001'])(
      'rechaza `offset=%s` con 400',
      (offset) => {
        const { controller } = build();
        expect(() =>
          controller.searchConcepts(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            offset,
          ),
        ).toThrow(BadRequestException);
      },
    );

    it('acepta `offset=0`, que es la primera página', async () => {
      const { controller, service } = build();

      await controller.searchConcepts(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '0',
      );

      expect(service.searchConcepts).toHaveBeenCalledWith(
        undefined,
        undefined,
        50,
        undefined,
        { offset: 0, includeValueSets: false },
      );
    });
  });
});
