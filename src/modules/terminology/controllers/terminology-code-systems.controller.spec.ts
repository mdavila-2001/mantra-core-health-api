import { describe, it, expect, jest } from '@jest/globals';
import { TerminologyCodeSystemsController } from './terminology-code-systems.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyCodeSystemsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const service = {
      createCodeSystem: jest.fn(),
      createVersion: jest.fn(),
    } as any;
    const readService = {
      listCodeSystems: jest.fn(),
      listVersions: jest.fn(),
    } as any;
    const controller = new TerminologyCodeSystemsController(
      service,
      readService,
    );
    return { controller, service, readService };
  }

  it('createCodeSystem delega en el servicio', async () => {
    const { controller, service } = build();
    const dto = {
      internalCode: 'a',
      name: 'b',
      canonicalUrl: 'c',
      sourceCode: 'd',
      sourceName: 'e',
    };
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

  it('lista los sistemas de códigos', async () => {
    const { controller, readService } = build();
    const items = [{ id: 'cs-1', internalCode: 'icd10cm' }];
    readService.listCodeSystems.mockResolvedValue(items);

    await expect(controller.listCodeSystems()).resolves.toEqual({ items });
  });

  it('lista las versiones de un sistema, diciendo cuáles admiten conceptos', async () => {
    const { controller, readService } = build();
    const items = [
      { id: 'v-1', version: '2026', state: 'DRAFT', acceptsConcepts: true },
      { id: 'v-0', version: '2025', state: 'ACTIVE', acceptsConcepts: false },
    ];
    readService.listVersions.mockResolvedValue(items);

    await expect(controller.listVersions('cs-1')).resolves.toEqual({ items });
    expect(readService.listVersions).toHaveBeenCalledWith('cs-1');
  });
});
