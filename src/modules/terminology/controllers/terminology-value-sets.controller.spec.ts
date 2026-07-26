import { describe, it, expect, jest } from '@jest/globals';
import { TerminologyValueSetsController } from './terminology-value-sets.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyValueSetsController', () => {
  it('createValueSet delega en el servicio', async () => {
    const service = { createValueSet: jest.fn() } as any;
    const controller = new TerminologyValueSetsController(service);
    const dto = { internalCode: 'vs', name: 'n', canonicalUrl: 'c' };
    const expected = { id: 'vs-1', versionId: 'vsv-1', rulesCount: 0 };
    service.createValueSet.mockResolvedValue(expected);

    const result = await controller.createValueSet(dto, user);

    expect(service.createValueSet).toHaveBeenCalledWith(dto, user);
    expect(result).toBe(expected);
  });
});