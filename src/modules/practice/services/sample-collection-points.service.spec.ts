import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FUNCTIONS } from '../infrastructure-catalog';
import { CollectionPointErrorReason as R } from '../practice-collection.error-reasons';
import { SampleCollectionPointsService } from './sample-collection-points.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const SITE = 'site-1';
const fn = (code: string) => FUNCTIONS.byInput(code)!.id;

const row = (id: string, code: string, fnCode = 'SPACE_FN_SAMPLE_COLLECTION') =>
  ({
    id,
    code,
    name: `Box ${code}`,
    spaceTypeConceptId: fn(fnCode),
    clinicalUnitId: null,
  }) as any;

const cell = (
  id: string,
  over: { avail?: string; hyg?: string; life?: string } = {},
) => ({
  id,
  code: id,
  name: `Box ${id}`,
  path: [],
  lifecycle: { code: over.life ?? 'SPACE_ACTIVE' },
  availability: { code: over.avail ?? 'SPACE_OP_AVAILABLE' },
  hygiene: { code: over.hyg ?? 'HYG_CLEAN' },
});

function build(spaces: any[], cells: any[], sites: any[] = [{ id: SITE }]) {
  const ops = {
    loadSiteSpaces: mockFn(async () => spaces),
    cells: mockFn(async (_tx: unknown, _s: string, rows: any[]) =>
      cells.filter((c) => rows.some((r) => r.id === c.id)),
    ),
  };
  const execute = mockFn(async (sql: string) => {
    if (sql.includes('from practice.practice_sites where id = ? and tenant_id'))
      return sites;
    if (sql.includes('select tenant_id from practice.practice_sites')) {
      return sites.length ? [{ tenant_id: TENANT }] : [];
    }
    return [];
  });
  return {
    service: new SampleCollectionPointsService(ops as any),
    ops,
    tx: { execute } as any,
  };
}

describe('SampleCollectionPointsService', () => {
  it('lista solo los puntos de toma que se ofrecen: activos, disponibles y listos', async () => {
    const d = build(
      [
        row('ok', 'B1'),
        row('blocked', 'B2'),
        row('dirty', 'B3'),
        row('closed', 'B4'),
        row('room', 'C1', 'SPACE_FN_CONSULTING_ROOM'),
      ],
      [
        cell('ok'),
        cell('blocked', { avail: 'SPACE_OP_BLOCKED_ADMIN' }),
        cell('dirty', { hyg: 'HYG_DIRTY' }),
        cell('closed', { life: 'SPACE_SUSPENDED' }),
        cell('room'),
      ],
    );
    const points = await d.service.list(d.tx, TENANT, SITE);
    expect(points.map((p) => p.careSpace.id)).toEqual(['ok']);
    // el estado de F2 no lleva paciente ni texto clínico: se pide sin visibilidad
    const options = d.ops.cells.mock.calls[0][3];
    expect(options.patientVisible('x')).toBe(false);
    expect(options.clinicalVisible('x')).toBe(false);
  });

  it('una sede que no es del tenant es 404', async () => {
    const d = build([], [], []);
    await expect(d.service.list(d.tx, TENANT, SITE)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('sugerir: un punto que se ofrece pasa; bloqueado, de otra función o inexistente da la misma 422', async () => {
    const d = build(
      [
        row('ok', 'B1'),
        row('blocked', 'B2'),
        row('room', 'C1', 'SPACE_FN_CONSULTING_ROOM'),
      ],
      [
        cell('ok'),
        cell('blocked', { avail: 'SPACE_OP_MAINTENANCE' }),
        cell('room'),
      ],
    );
    await expect(
      d.service.assertSuggestable(d.tx, SITE, 'ok'),
    ).resolves.toBeUndefined();
    for (const id of ['blocked', 'room', 'no-existe']) {
      const failure = await d.service
        .assertSuggestable(d.tx, SITE, id)
        .catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(PreconditionFailedException);
      expect((failure as any).response.reason).toBe(R.COLLECTION_POINT_INVALID);
      expect((failure as any).response.details).toBeUndefined();
    }
  });

  it('sugerir en una sede inexistente es la misma 422 (sin revelar nada)', async () => {
    const d = build([], [], []);
    await expect(
      d.service.assertSuggestable(d.tx, SITE, 'x'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ reason: R.COLLECTION_POINT_INVALID }),
    });
  });

  it('el primero que se ofrece es por código; sin puntos, null', async () => {
    const d = build([row('b', 'B2'), row('a', 'B1')], [cell('a'), cell('b')]);
    expect(await d.service.firstOffered(d.tx, SITE)).toBe('a');
    const empty = build([], []);
    expect(await empty.service.firstOffered(empty.tx, SITE)).toBeNull();
  });

  it('toma: el punto debe ser SAMPLE_COLLECTION de la sede del tenant; no pide disponibilidad', async () => {
    const d = build(
      [row('blocked', 'B2'), row('room', 'C1', 'SPACE_FN_CONSULTING_ROOM')],
      [],
    );
    await expect(
      d.service.assertCollectable(d.tx, TENANT, SITE, 'blocked'),
    ).resolves.toBeUndefined();
    for (const id of ['room', 'ajeno']) {
      await expect(
        d.service.assertCollectable(d.tx, TENANT, SITE, id),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          reason: R.COLLECTION_POINT_INVALID,
        }),
      });
    }
    expect(d.ops.loadSiteSpaces).toHaveBeenCalledWith(d.tx, TENANT, SITE);
  });

  it('los nombres se piden acotados al tenant', async () => {
    const d = build([], []);
    d.tx.execute.mockResolvedValue([{ id: 'p1', name: 'Box 1' }]);
    const names = await d.service.namesIn(d.tx, TENANT, ['p1', null, 'p1']);
    expect(names.get('p1')).toBe('Box 1');
    expect(d.tx.execute.mock.calls[0][1]).toEqual([TENANT, 'p1']);
    expect(d.tx.execute.mock.calls[0][0]).toContain('tenant_id = ?');
  });
});
