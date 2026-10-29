import { jest } from '@jest/globals';
import { SEED } from '../../../common/constants/concepts';
import type {
  AnnotationRow,
  CatalogRepository,
  ClassifiableColumnRow,
} from '../repositories/catalog.repository';
import {
  CatalogClassificationService,
  CLASSIFY_PAGE_SIZE,
} from './catalog-classification.service';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const columna = (
  id: string,
  column_name: string,
  native_type = 'text',
  object_name = 'catalog_items',
): ClassifiableColumnRow => ({
  id,
  object_id: `obj-${id}`,
  column_name,
  native_type,
  schema_name: 'public',
  object_name,
});

const ficha = (extra: Partial<AnnotationRow> = {}): AnnotationRow =>
  ({
    id: 'ficha-1',
    target_kind: 'COLUMN',
    review_status: 'AUTO_DETECTED',
    origin: 'AUTO_CLASSIFIER',
    current_revision_no: 1,
    row_version: 1,
    content: { sensitivity: 'PERSONAL' },
    ...extra,
  }) as unknown as AnnotationRow;

function armar(
  columnas: ClassifiableColumnRow[],
  fichas: AnnotationRow[] = [],
) {
  const repo: Record<string, any> = {
    columnsToClassify: mockFn(async () => columnas),
    annotationsOfColumns: mockFn(
      async () => new Map(fichas.map((f, i) => [columnas[i].id, f])),
    ),
    insertAnnotation: mockFn(async () => ({ id: 'nueva' })),
    updateAnnotation: mockFn(async () => true),
    insertRevision: mockFn(async () => undefined),
  };
  const em: Record<string, unknown> = {};
  em.fork = () => em;
  em.transactional = async (cb: (tx: unknown) => unknown) => cb(em);
  const service = new CatalogClassificationService(
    em as never,
    repo as unknown as CatalogRepository,
  );
  return { service, repo };
}

describe('CatalogClassificationService', () => {
  it('crea la ficha de la columna en AUTO_DETECTED con certeza, con la cuenta del worker como autora', async () => {
    const { service, repo } = armar([columna('c1', 'password_hash')]);
    const r = await service.run();
    expect(r).toMatchObject({ examined: 1, created: 1, sentToReview: 0 });
    const alta = repo.insertAnnotation.mock.calls[0][1];
    expect(alta).toMatchObject({
      objectId: 'obj-c1',
      columnId: 'c1',
      reviewStatus: 'AUTO_DETECTED',
      origin: 'AUTO_CLASSIFIER',
      userId: SEED.systemWorkerUserId,
    });
    expect(alta.content.sensitivity).toBe('CREDENTIAL');
    const rev = repo.insertRevision.mock.calls[0][1];
    expect(rev).toMatchObject({
      revisionNo: 1,
      origin: 'AUTO_CLASSIFIER',
      authorId: SEED.systemWorkerUserId,
      submittedStatus: 'AUTO_DETECTED',
    });
    expect(rev.classification).toMatchObject({
      ruleId: 'CREDENTIAL_SECRET',
      confidence: expect.any(Number),
      classifiedBy: expect.stringContaining('AUTO_CLASSIFIER'),
    });
  });

  it('ante duda crea la ficha en NEEDS_REVIEW, al nivel más alto', async () => {
    const { service, repo } = armar([columna('c1', 'display_name')]);
    const r = await service.run();
    expect(r).toMatchObject({ created: 1, sentToReview: 1 });
    expect(repo.insertAnnotation.mock.calls[0][1]).toMatchObject({
      reviewStatus: 'NEEDS_REVIEW',
    });
  });

  it('una columna que ninguna regla reconoce no recibe ficha', async () => {
    const { service, repo } = armar([columna('c1', 'row_version', 'integer')]);
    const r = await service.run();
    expect(r).toMatchObject({ examined: 1, unclassified: 1, created: 0 });
    expect(repo.insertAnnotation).not.toHaveBeenCalled();
  });

  it('nunca pisa lo que escribió una persona', async () => {
    const { service, repo } = armar(
      [columna('c1', 'password_hash')],
      [ficha({ origin: 'MANUAL', review_status: 'DRAFT' })],
    );
    const r = await service.run();
    expect(r.skippedManual).toBe(1);
    expect(repo.updateAnnotation).not.toHaveBeenCalled();
    expect(repo.insertAnnotation).not.toHaveBeenCalled();
  });

  it.each(['NEEDS_REVIEW', 'APPROVED', 'REJECTED'] as const)(
    'no toca una ficha en %s aunque la haya creado la máquina',
    async (estado) => {
      const { service, repo } = armar(
        [columna('c1', 'password_hash')],
        [ficha({ review_status: estado })],
      );
      const r = await service.run();
      expect(r.skippedReviewed).toBe(1);
      expect(repo.updateAnnotation).not.toHaveBeenCalled();
    },
  );

  it('sube el nivel de una ficha de la máquina y conserva el contenido', async () => {
    const { service, repo } = armar(
      [columna('c1', 'password_hash')],
      [ficha({ content: { sensitivity: 'PERSONAL', unit: 'x' } as never })],
    );
    const r = await service.run();
    expect(r.raised).toBe(1);
    const [, id, version, cambio] = repo.updateAnnotation.mock.calls[0];
    expect(id).toBe('ficha-1');
    expect(version).toBe(1);
    expect(cambio).toMatchObject({
      reviewStatus: 'AUTO_DETECTED',
      revisionNo: 2,
      origin: 'AUTO_CLASSIFIER',
    });
    expect(cambio.content).toMatchObject({
      sensitivity: 'CREDENTIAL',
      unit: 'x',
    });
    expect(repo.insertRevision.mock.calls[0][1].revisionNo).toBe(2);
  });

  it('nunca baja un nivel', async () => {
    const { service, repo } = armar(
      [columna('c1', 'email')],
      [ficha({ content: { sensitivity: 'CREDENTIAL' } as never })],
    );
    const r = await service.run();
    expect(r.skippedNotHigher).toBe(1);
    expect(repo.updateAnnotation).not.toHaveBeenCalled();
  });

  it('si otra petición cambió la ficha antes, cuenta un conflicto y sigue', async () => {
    const { service, repo } = armar(
      [columna('c1', 'password_hash'), columna('c2', 'password_hash')],
      [ficha(), ficha({ id: 'ficha-2' })],
    );
    repo.updateAnnotation.mockResolvedValueOnce(false);
    const r = await service.run();
    expect(r).toMatchObject({ conflicts: 1, raised: 1 });
  });

  it('una violación de unicidad al crear cuenta un conflicto sin abortar la corrida', async () => {
    const { service, repo } = armar([
      columna('c1', 'password_hash'),
      columna('c2', 'password_hash'),
    ]);
    repo.insertAnnotation.mockRejectedValueOnce(
      Object.assign(new Error('duplicate key value'), { code: '23505' }),
    );
    const r = await service.run();
    expect(r).toMatchObject({ conflicts: 1, created: 1 });
  });

  it('un error que no es de unicidad se propaga', async () => {
    const { service, repo } = armar([columna('c1', 'password_hash')]);
    repo.insertAnnotation.mockRejectedValueOnce(new Error('FK violada'));
    await expect(service.run()).rejects.toThrow('FK violada');
  });

  it('pagina por id hasta agotar las columnas', async () => {
    const llena = Array.from({ length: CLASSIFY_PAGE_SIZE }, (_, i) =>
      columna(`id-${i}`, 'row_version', 'integer'),
    );
    const { service, repo } = armar(llena);
    repo.columnsToClassify
      .mockResolvedValueOnce(llena)
      .mockResolvedValueOnce([columna('id-ultimo', 'row_version', 'integer')]);
    const r = await service.run();
    expect(r.examined).toBe(CLASSIFY_PAGE_SIZE + 1);
    expect(repo.columnsToClassify.mock.calls[1][1].afterId).toBe(
      `id-${CLASSIFY_PAGE_SIZE - 1}`,
    );
  });

  it('classifyScan pide sólo las columnas de ese escaneo', async () => {
    const { service, repo } = armar([]);
    await service.classifyScan('scan-9');
    expect(repo.columnsToClassify.mock.calls[0][1]).toMatchObject({
      scanId: 'scan-9',
    });
  });
});
