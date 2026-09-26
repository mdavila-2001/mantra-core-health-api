import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { StickerPackSeedService } from './sticker-pack-seed.service';
import { STICKER_PACK } from '../constants/sticker-pack';
import { Files } from '../../modules/common/entities/files.entity';

/** Un `EntityManager` doblado, con lo mínimo que el seed toca. */
function build(existentes: Set<string> = new Set()) {
  const created: any[] = [];
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
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
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

  it('siembra sólo lo que falta cuando parte del pack ya existe', async () => {
    const d = build(new Set([STICKER_PACK[0]!.id]));

    const result = await d.service.run();

    expect(result.inserted).toBe(STICKER_PACK.length - 1);
  });
});
