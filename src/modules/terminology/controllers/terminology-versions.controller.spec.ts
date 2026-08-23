import { describe, it, expect, jest } from '@jest/globals';
import { TerminologyVersionsController } from './terminology-versions.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyVersionsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const service = {
      importConcepts: jest.fn(),
      publishVersion: jest.fn(),
    } as any;
    const fileImport = { importFromFile: jest.fn() } as any;
    const controller = new TerminologyVersionsController(service, fileImport);
    return { controller, service, fileImport };
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
    const expected = {
      id: 'v-1',
      state: 'TERM_ACTIVE',
      publishedAt: new Date(),
    };
    service.publishVersion.mockResolvedValue(expected);

    const result = await controller.publishVersion('v-1', user);

    expect(service.publishVersion).toHaveBeenCalledWith('v-1', user);
    expect(result).toBe(expected);
  });

  it('importConceptsFile delega el archivo al importador', async () => {
    const { controller, fileImport } = build();
    const esperado = {
      batchId: 'b-1',
      totalRead: 3,
      inserted: 2,
      skipped: 1,
      errors: 0,
      errorSamples: [],
    };
    fileImport.importFromFile.mockResolvedValue(esperado);

    const result = await controller.importConceptsFile(
      'v-1',
      { buffer: Buffer.from('x'), originalname: 'c.ndjson' },
      user,
    );

    expect(fileImport.importFromFile).toHaveBeenCalledWith(
      'v-1',
      expect.any(Buffer),
      user,
    );
    expect(result).toBe(esperado);
  });
});
