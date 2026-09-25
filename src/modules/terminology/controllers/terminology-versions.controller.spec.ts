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

  describe('importConceptsFile', () => {
    /** El archivo tal como lo deja el interceptor de multipart. */
    const archivo = { buffer: Buffer.from('x'), originalname: 'c.ndjson' };

    /** Un informe de importación, con lo que cada caso necesita cambiar. */
    const informe = (cambios: Record<string, unknown> = {}) => ({
      batchId: 'b-1',
      format: 'ndjson',
      profile: 'conceptos',
      dryRun: false,
      aborted: false,
      totalRead: 3,
      inserted: 2,
      skipped: 1,
      errors: 0,
      errorSamples: [],
      ...cambios,
    });

    /** La respuesta HTTP, para ver si alguien le cambia el estado. */
    const respuesta = () => ({ status: jest.fn() });

    it('delega el archivo y lo que lo acompaña', async () => {
      const { controller, fileImport } = build();
      const esperado = informe();
      fileImport.importFromFile.mockResolvedValue(esperado);
      const res = respuesta();

      const result = await controller.importConceptsFile(
        'v-1',
        archivo,
        { dryRun: false, profile: 'conceptos' },
        user,
        res as never,
      );

      expect(fileImport.importFromFile).toHaveBeenCalledWith(
        'v-1',
        expect.any(Buffer),
        user,
        { dryRun: false, profile: 'conceptos' },
      );
      expect(result).toBe(esperado);
    });

    it('una importación que escribió conserva el 201', async () => {
      const { controller, fileImport } = build();
      fileImport.importFromFile.mockResolvedValue(informe());
      const res = respuesta();

      await controller.importConceptsFile(
        'v-1',
        archivo,
        {},
        user,
        res as never,
      );

      expect(res.status).not.toHaveBeenCalled();
    });

    it('validar sin escribir responde 200, porque no creó nada', async () => {
      const { controller, fileImport } = build();
      fileImport.importFromFile.mockResolvedValue(
        informe({ dryRun: true, batchId: null, inserted: 0 }),
      );
      const res = respuesta();

      await controller.importConceptsFile(
        'v-1',
        archivo,
        { dryRun: true },
        user,
        res as never,
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('un archivo rechazado por errores también responde 200', async () => {
      // La petición se atendió y su respuesta es el informe de qué corregir;
      // un 201 diría que se creó algo, y no se creó nada.
      const { controller, fileImport } = build();
      fileImport.importFromFile.mockResolvedValue(
        informe({ aborted: true, batchId: null, inserted: 0, errors: 4 }),
      );
      const res = respuesta();

      await controller.importConceptsFile(
        'v-1',
        archivo,
        {},
        user,
        res as never,
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('sin archivo no se llama al importador', async () => {
      const { controller, fileImport } = build();
      const res = respuesta();

      await expect(
        controller.importConceptsFile('v-1', undefined, {}, user, res as never),
      ).rejects.toThrow();
      expect(fileImport.importFromFile).not.toHaveBeenCalled();
    });
  });
});
