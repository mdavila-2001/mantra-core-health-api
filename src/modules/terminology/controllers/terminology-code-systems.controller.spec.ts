import { describe, it, expect, jest } from '@jest/globals';
import { TerminologyCodeSystemsController } from './terminology-code-systems.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyCodeSystemsController', () => {
  function build() {
    const service = { createCodeSystem: jest.fn(), createVersion: jest.fn() } as any;
    const controller = new TerminologyCodeSystemsController(service);
    return { controller, service };
  }

  it('createCodeSystem delega en el servicio', async () => {
    const { controller, service } = build();
    const dto = { internalCode: 'a', name: 'b', canonicalUrl: 'c', sourceCode: 'd', sourceName: 'e' };
    const expected = { id: 'cs-1', internalCode: 'a', sourceId: 's-1' };
    service.createCodeSystem.mockResolvedValue(expected);

    const result = await controller.createCodeSystem(dto, user);

    expect(service.createCodeSystem).toHaveBeenCalledWith(dto, user);
    expect(result).toBe(expected);
  });

  it('createVersion delega con el id de ruta', async () => {
    const { controller, service } = build();
    const dto = { version: '1.0.0' };
    const expected = { id: 'v-1', version: '1.0.0', state: 'TERM_DRAFT' };
    service.createVersion.mockResolvedValue(expected);

    const result = await controller.createVersion('cs-1', dto, user);

    expect(service.createVersion).toHaveBeenCalledWith('cs-1', dto, user);
    expect(result).toBe(expected);
  });
});