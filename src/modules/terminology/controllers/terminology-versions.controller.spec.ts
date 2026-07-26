import { describe, it, expect, jest } from '@jest/globals';
import { TerminologyVersionsController } from './terminology-versions.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyVersionsController', () => {
  function build() {
    const service = { importConcepts: jest.fn(), publishVersion: jest.fn() } as any;
    const controller = new TerminologyVersionsController(service);
    return { controller, service };
  }

  it('importConcepts delega con el id de versión', async () => {
    const { controller, service } = build();
    const dto = { concepts: [{ code: 'A', display: 'A' }] };
    const expected = { inserted: 1, skipped: 0, total: 1 };
    service.importConcepts.mockResolvedValue(expected);

    const result = await controller.importConcepts('v-1', dto, user);

    expect(service.importConcepts).toHaveBeenCalledWith('v-1', dto, user);
    expect(result).toBe(expected);
  });

  it('publishVersion delega con el id de versión', async () => {
    const { controller, service } = build();
    const expected = { id: 'v-1', state: 'TERM_ACTIVE', publishedAt: new Date() };
    service.publishVersion.mockResolvedValue(expected);

    const result = await controller.publishVersion('v-1', user);

    expect(service.publishVersion).toHaveBeenCalledWith('v-1', user);
    expect(result).toBe(expected);
  });
});