import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { StickerPackSeedService } from './sticker-pack-seed.service';
import { STICKER_PACK } from '../constants/sticker-pack';
import { Files } from '../../modules/common/entities/files.entity';
import { FileVersions } from '../../modules/common/entities/file_versions.entity';

/**
 * Un `EntityManager` doblado que simula la FK real
 * `fk_file_versions_file_id` — sin `@ManyToOne` en la entidad, MikroORM no
 * conoce la dependencia y puede mandar el insert de `FileVersions` antes que
 * el de `Files` en el mismo batch. Reproducido contra Postgres real
 * (legion-h5-pg) antes de que `run()` flusheara `Files` primero; este doble
 * es lo que deja ese defecto capturado en un unitario y no sólo en la corrida
 * viva.
 */
function build(existentes: Set<string> = new Set()) {
  const created: any[] = [];
  const pendientes = new Set<string>();
  const flusheados = new Set<string>(existentes);
  const em: any = {
    findOne: mockFn((entity: any, where: { id: string }) =>
      Promise.resolve(
        entity === Files && existentes.has(where.id) ? { id: where.id } : null,
      ),
    ),
    findOneOrFail: mockFn((_entity: any, where: { id: string }) =>
      Promise.resolve({ id: where.id, currentVersionId: undefined }),
    ),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity, data });
      if (entity === Files) pendientes.add(data.id);
      if (entity === FileVersions && !flusheados.has(data.fileId)) {
        throw new Error(
          `fk_file_versions_file_id: "${data.fileId}" no está en "files" todavía (faltó flushear Files antes)`,
        );
      }
      return data;
    }),
    flush: mockFn(() => {
      for (const id of pendientes) flusheados.add(id);
      pendientes.clear();
      return Promise.resolve();
    }),
  };
  const orm: any = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new StickerPackSeedService(orm, logger as any);
  return { service, em, created, logger };
}

describe('StickerPackSeedService (AG-17)', () => {
  it('siembra las 24 filas de Files/FileVersions cuando la base está vacía', async () => {
    const d = build();

    const result = await d.service.run();

    expect(result.inserted).toBe(STICKER_PACK.length);
    const filesCreados = d.created.filter((c) => c.entity === Files);
    expect(filesCreados).toHaveLength(STICKER_PACK.length);
    expect(filesCreados.map((c) => c.data.id).sort()).toEqual(
      [...STICKER_PACK.map((s) => s.id)].sort(),
    );
  });

  it('es idempotente: si ya existen todas, no inserta nada', async () => {
    const d = build(new Set(STICKER_PACK.map((s) => s.id)));

    const result = await d.service.run();

    expect(result.inserted).toBe(0);
    expect(d.created).toHaveLength(0);
    expect(d.logger.info).not.toHaveBeenCalled();
  });

  it('regresión: flushea Files antes de crear FileVersions (fk_file_versions_file_id)', async () => {
    // Con el doble de arriba, esto revienta si `run()` vuelve a crear
    // Files+FileVersions en el mismo batch sin el flush intermedio — que es
    // exactamente lo que pasó contra Postgres real antes de este fix.
    const d = build();

    await expect(d.service.run()).resolves.toMatchObject({
      inserted: STICKER_PACK.length,
    });
  });

  it('siembra sólo lo que falta cuando parte del pack ya existe', async () => {
    const d = build(new Set([STICKER_PACK[0]!.id]));

    const result = await d.service.run();

    expect(result.inserted).toBe(STICKER_PACK.length - 1);
  });
});
