import { describe, it, expect, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
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
      readGlossaryGraph: jest.fn(() =>
        Promise.resolve({ nodes: [], edges: [], count: 0, limit: 500 }),
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

    it.each([
      { raw: '', expected: true },
      { raw: '1', expected: true },
      { raw: 'false', expected: false },
    ])(
      'interpreta `includeValueSets=$raw` como $expected',
      async ({ raw, expected }) => {
        const { controller, service } = build();

        await controller.searchConcepts(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          raw,
        );

        expect(service.searchConcepts).toHaveBeenCalledWith(
          undefined,
          undefined,
          50,
          undefined,
          { includeValueSets: expected },
        );
      },
    );

    it.each([
      { limit: undefined, ids: ['c-1', 'c-2'], expected: 50 },
      {
        limit: 10,
        ids: Array.from({ length: 60 }, (_, index) => `c-${index}`),
        expected: 60,
      },
    ])(
      'amplía el límite a $expected cuando se resuelven ids',
      async ({ limit, ids, expected }) => {
        const { controller, service } = build();

        await controller.searchConcepts(undefined, undefined, limit, ids);

        expect(service.searchConcepts).toHaveBeenCalledWith(
          undefined,
          undefined,
          expected,
          ids,
          { includeValueSets: false },
        );
      },
    );

    it('rechaza un idioma desconocido antes de consultar el catálogo', () => {
      const { controller, service } = build();

      expect(() =>
        controller.searchConcepts(
          undefined,
          undefined,
          undefined,
          undefined,
          'pt',
        ),
      ).toThrow(BadRequestException);
      expect(service.searchConcepts).not.toHaveBeenCalled();
    });
  });

  describe('grafo del glosario', () => {
    it('delega el idioma normalizado y el límite explícito', async () => {
      const { controller, service } = build();
      const expected = {
        nodes: [],
        edges: [],
        count: 0,
        limit: 24,
        possiblyTruncated: false,
      };
      service.readGlossaryGraph.mockResolvedValue(expected);

      await expect(controller.readGlossaryGraph('en', 24)).resolves.toBe(
        expected,
      );
      expect(service.readGlossaryGraph).toHaveBeenCalledWith('EN', 24);
    });

    it('conserva idioma ausente y aplica el límite por defecto de 500', async () => {
      const { controller, service } = build();

      await controller.readGlossaryGraph();

      expect(service.readGlossaryGraph).toHaveBeenCalledWith(undefined, 500);
    });
  });
});
