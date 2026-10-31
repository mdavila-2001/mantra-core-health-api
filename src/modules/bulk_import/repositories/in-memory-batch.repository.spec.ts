import { describe, expect, it } from '@jest/globals';
import { BulkImportStatus } from '../bulk-import.constants';
import type { BatchRecord } from '../ports/bulk-import.ports';
import { InMemoryBatchRepository } from './in-memory-batch.repository';

/**
 * ⚠️ Contrato de `BulkImportBatchRepository` ejercitado contra el DOBLE EN
 * MEMORIA. No es evidencia de persistencia real: cuando exista el adaptador SQL
 * debe pasar esta misma batería.
 */
const record = (over: Partial<BatchRecord> = {}): BatchRecord => ({
  id: '00000000-0000-4000-8000-0000000000a1',
  tenantId: 'tenant-a',
  kind: 'usuario-paciente',
  kindVersion: '1',
  group: 'USERS',
  status: BulkImportStatus.VALIDATED,
  createdByUserId: 'u1',
  createdAt: '2026-10-31T10:00:00.000Z',
  updatedAt: '2026-10-31T10:00:00.000Z',
  declaration: { reason: 'prueba' },
  source: { format: 'csv', byteSize: 10 },
  counts: { total: 1, valid: 1, rejected: 0 },
  fileIssues: [],
  previewIssues: [],
  issuesTotal: 0,
  rejectedRows: [],
  rows: [],
  processedRows: 0,
  ...over,
});

describe('InMemoryBatchRepository (doble declarado)', () => {
  it('correcto: crea, lee y lista en orden descendente por fecha', async () => {
    const repo = new InMemoryBatchRepository();
    await repo.create(record());
    await repo.create(
      record({
        id: '00000000-0000-4000-8000-0000000000a2',
        createdAt: '2026-10-31T11:00:00.000Z',
      }),
    );
    expect(
      (await repo.findById('tenant-a', '00000000-0000-4000-8000-0000000000a1'))
        ?.kind,
    ).toBe('usuario-paciente');
    expect((await repo.list('tenant-a', 10)).map((b) => b.id)).toEqual([
      '00000000-0000-4000-8000-0000000000a2',
      '00000000-0000-4000-8000-0000000000a1',
    ]);
    expect(await repo.list('tenant-a', 1)).toHaveLength(1);
  });

  it('aislamiento: otro tenant no ve, no lista y no transiciona el lote', async () => {
    const repo = new InMemoryBatchRepository();
    await repo.create(record());
    expect(await repo.findById('tenant-b', record().id)).toBeNull();
    expect(await repo.list('tenant-b', 10)).toEqual([]);
    expect(
      await repo.transition(
        'tenant-b',
        record().id,
        [BulkImportStatus.VALIDATED],
        BulkImportStatus.QUEUED,
      ),
    ).toBeNull();
    expect((await repo.findById('tenant-a', record().id))?.status).toBe(
      BulkImportStatus.VALIDATED,
    );
  });

  it('transición: gana la primera; la segunda con el mismo "desde" pierde y no pisa nada', async () => {
    const repo = new InMemoryBatchRepository();
    await repo.create(record());
    const [first, second] = await Promise.all([
      repo.transition(
        'tenant-a',
        record().id,
        [BulkImportStatus.VALIDATED],
        BulkImportStatus.QUEUED,
        { confirmKey: 'k1' },
      ),
      repo.transition(
        'tenant-a',
        record().id,
        [BulkImportStatus.VALIDATED],
        BulkImportStatus.QUEUED,
        { confirmKey: 'k2' },
      ),
    ]);
    expect([first, second].filter(Boolean)).toHaveLength(1);
    expect((await repo.findById('tenant-a', record().id))?.confirmKey).toBe(
      'k1',
    );
  });

  it('transición inválida desde el estado actual devuelve null (precondición en la escritura)', async () => {
    const repo = new InMemoryBatchRepository();
    await repo.create(record({ status: BulkImportStatus.COMPLETED }));
    expect(
      await repo.transition(
        'tenant-a',
        record().id,
        [BulkImportStatus.QUEUED],
        BulkImportStatus.PROCESSING,
      ),
    ).toBeNull();
  });

  it('el patch no puede cambiar el id ni el tenant', async () => {
    const repo = new InMemoryBatchRepository();
    await repo.create(record());
    const next = await repo.transition(
      'tenant-a',
      record().id,
      [BulkImportStatus.VALIDATED],
      BulkImportStatus.QUEUED,
      {
        id: 'otro',
        tenantId: 'tenant-b',
      },
    );
    expect(next?.id).toBe(record().id);
    expect(next?.tenantId).toBe('tenant-a');
  });

  it('inválido: crear dos veces el mismo id falla; findByConfirmKey respeta el tenant', async () => {
    const repo = new InMemoryBatchRepository();
    await repo.create(record({ confirmKey: 'k' }));
    await expect(repo.create(record())).rejects.toThrow();
    expect((await repo.findByConfirmKey('tenant-a', 'k'))?.id).toBe(
      record().id,
    );
    expect(await repo.findByConfirmKey('tenant-b', 'k')).toBeNull();
  });
});
