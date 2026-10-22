import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartNotesReadService } from './chart-notes-read.service';
import { encodeKeysetCursor } from '../../../common';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const emFork = {};
  const em = { fork: mockFn(() => emFork) };
  const notesRepo = {
    findHeadersPageByAuthor: mockFn().mockResolvedValue([]),
    findVersionsByIds: mockFn().mockResolvedValue(new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ChartNotesReadService(
    em as any,
    notesRepo as any,
    logger as any,
  );
  return { service, em, emFork, notesRepo };
}

function header(overrides: Record<string, unknown> = {}) {
  return {
    id: 'n1',
    patientProfileId: 'pat-1',
    encounterId: undefined,
    noteTypeConceptId: 'nt-1',
    lifecycleStatusConceptId: 'lc-1',
    currentVersionId: 'v1',
    currentReleasedVersionId: undefined,
    createdAt: new Date('2026-03-01T12:00:00.000Z'),
    ...overrides,
  } as any;
}

function version(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    versionNumber: 1,
    authorProfileId: 'author-1',
    ...overrides,
  } as any;
}

describe('ChartNotesReadService', () => {
  describe('listNotes (P18)', () => {
    it('usa el perfil profesional del actor cuando no viene practitionerId', async () => {
      const d = build();
      const actor = {
        id: 'u1',
        roles: [],
        practitionerProfileId: 'author-1',
      } as any;
      await d.service.listNotes({} as any, actor);
      expect(d.notesRepo.findHeadersPageByAuthor).toHaveBeenCalledWith(
        d.emFork,
        expect.objectContaining({ authorProfileId: 'author-1' }),
      );
    });

    it('rechaza con 403 a un actor sin perfil profesional', async () => {
      const d = build();
      const actor = { id: 'u1', roles: [] } as any;
      await expect(d.service.listNotes({} as any, actor)).rejects.toThrow(
        /perfil profesional/,
      );
    });

    it('rechaza con 403 al pedir las notas de otro profesional sin SUPERADMIN', async () => {
      const d = build();
      const actor = {
        id: 'u1',
        roles: [],
        practitionerProfileId: 'author-1',
      } as any;
      await expect(
        d.service.listNotes({ practitionerId: 'author-2' } as any, actor),
      ).rejects.toThrow(/otro profesional/);
    });

    it('permite a SUPERADMIN pedir las notas de otro profesional', async () => {
      const d = build();
      const actor = { id: 'u1', roles: ['SUPERADMIN'] } as any;
      await d.service.listNotes({ practitionerId: 'author-2' } as any, actor);
      expect(d.notesRepo.findHeadersPageByAuthor).toHaveBeenCalledWith(
        d.emFork,
        expect.objectContaining({ authorProfileId: 'author-2' }),
      );
    });

    it('rechaza SUPERADMIN sin practitionerId (no tiene perfil propio)', async () => {
      const d = build();
      const actor = { id: 'u1', roles: ['SUPERADMIN'] } as any;
      await expect(d.service.listNotes({} as any, actor)).rejects.toThrow(
        /perfil profesional/,
      );
    });

    it('rechaza con 400 cuando from es posterior a to', async () => {
      const d = build();
      const actor = {
        id: 'u1',
        roles: [],
        practitionerProfileId: 'author-1',
      } as any;
      await expect(
        d.service.listNotes(
          {
            from: '2026-03-10T00:00:00.000Z',
            to: '2026-03-01T00:00:00.000Z',
          } as any,
          actor,
        ),
      ).rejects.toThrow(/from.*to/);
    });

    it('con limit+1 filas, la página trae limit y el cursor codifica la última devuelta', async () => {
      const d = build();
      const actor = {
        id: 'u1',
        roles: [],
        practitionerProfileId: 'author-1',
      } as any;
      const h1 = header({
        id: 'n1',
        createdAt: new Date('2026-03-03T00:00:00.000Z'),
      });
      const h2 = header({
        id: 'n2',
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
      });
      const h3 = header({
        id: 'n3',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
      });
      d.notesRepo.findHeadersPageByAuthor.mockResolvedValue([h1, h2, h3]);
      d.notesRepo.findVersionsByIds.mockResolvedValue(
        new Map([['v1', version({ id: 'v1' })]]),
      );

      const result = await d.service.listNotes({ limit: 2 } as any, actor);

      expect(result.count).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe(
        encodeKeysetCursor({
          createdAt: h2.createdAt.toISOString(),
          id: h2.id,
        }),
      );
    });

    it('sin filas, devuelve página vacía con nextCursor null', async () => {
      const d = build();
      const actor = {
        id: 'u1',
        roles: [],
        practitionerProfileId: 'author-1',
      } as any;
      d.notesRepo.findHeadersPageByAuthor.mockResolvedValue([]);

      const result = await d.service.listNotes({} as any, actor);

      expect(result).toEqual({
        items: [],
        count: 0,
        limit: 50,
        nextCursor: null,
      });
    });

    it('reenvía patientProfileId al repositorio como filtro', async () => {
      const d = build();
      const actor = {
        id: 'u1',
        roles: [],
        practitionerProfileId: 'author-1',
      } as any;
      await d.service.listNotes({ patientProfileId: 'pat-9' } as any, actor);
      expect(d.notesRepo.findHeadersPageByAuthor).toHaveBeenCalledWith(
        d.emFork,
        expect.objectContaining({ patientProfileId: 'pat-9' }),
      );
    });

    it('cada ítem lleva el patientProfileId de su cabecera', async () => {
      const d = build();
      const actor = {
        id: 'u1',
        roles: [],
        practitionerProfileId: 'author-1',
      } as any;
      const h1 = header({ id: 'n1', patientProfileId: 'pat-7' });
      d.notesRepo.findHeadersPageByAuthor.mockResolvedValue([h1]);
      d.notesRepo.findVersionsByIds.mockResolvedValue(
        new Map([['v1', version({ id: 'v1' })]]),
      );

      const result = await d.service.listNotes({} as any, actor);

      expect(result.items[0].patientProfileId).toBe('pat-7');
    });

    it('omite una cabecera cuya versión vigente no se pudo resolver', async () => {
      const d = build();
      const actor = {
        id: 'u1',
        roles: [],
        practitionerProfileId: 'author-1',
      } as any;
      const h1 = header({ id: 'n1', currentVersionId: 'v-missing' });
      d.notesRepo.findHeadersPageByAuthor.mockResolvedValue([h1]);
      d.notesRepo.findVersionsByIds.mockResolvedValue(new Map());

      const result = await d.service.listNotes({} as any, actor);

      expect(result.items).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });
});
