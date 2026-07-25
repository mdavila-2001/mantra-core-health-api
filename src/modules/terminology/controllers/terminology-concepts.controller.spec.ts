import { describe, it, expect, jest } from '@jest/globals';
import { TerminologyConceptsController } from './terminology-concepts.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyConceptsController', () => {
  function build() {
    const service = { addDesignation: jest.fn(), addRelationship: jest.fn() } as any;
    const controller = new TerminologyConceptsController(service);
    return { controller, service };
  }

  it('addDesignation delega con el id de concepto', async () => {
    const { controller, service } = build();
    const dto = { value: 'Diabetes' };
    const expected = { id: 'd-1', conceptId: 'c-1', value: 'Diabetes', propertiesCount: 0 };
    service.addDesignation.mockResolvedValue(expected);

    const result = await controller.addDesignation('c-1', dto, user);

    expect(service.addDesignation).toHaveBeenCalledWith('c-1', dto, user);
    expect(result).toBe(expected);
  });

  it('addRelationship delega con el id de concepto', async () => {
    const { controller, service } = build();
    const dto = { targetConceptId: 'c-2', relationshipType: 'IS_A' as const };
    const expected = { id: 'r-1', sourceConceptId: 'c-1', targetConceptId: 'c-2', relationshipTypeConceptId: 'x' };
    service.addRelationship.mockResolvedValue(expected);

    const result = await controller.addRelationship('c-1', dto, user);

    expect(service.addRelationship).toHaveBeenCalledWith('c-1', dto, user);
    expect(result).toBe(expected);
  });
});