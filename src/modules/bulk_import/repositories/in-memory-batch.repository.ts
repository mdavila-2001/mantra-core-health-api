import { Injectable } from '@nestjs/common';
import type { BulkImportStatus } from '../bulk-import.constants';
import type {
  BatchRecord,
  BulkImportBatchRepository,
} from '../ports/bulk-import.ports';

/**
 * ⚠️ DOBLE DECLARADO — no es persistencia real.
 *
 * Guarda los lotes **en la memoria del proceso**: no sobrevive a un reinicio, no
 * se comparte entre réplicas y no tiene retención. Existe porque el modelo de
 * datos todavía no tiene la tabla del lote (ver `README.md`, «Bloqueado»), y la
 * regla de aislamiento obliga a terminar el motor contra un contrato en lugar de
 * esperar. Cumple el contrato de `BulkImportBatchRepository` —incluida la
 * transición atómica con precondición y el aislamiento por tenant— y se ejercita
 * en los tres niveles en `in-memory-batch.repository.spec.ts`.
 *
 * Cuando exista la tabla en `mantra-core-health-model`, se escribe el adaptador
 * SQL contra la misma interfaz y se cambia el `useClass` del módulo; el motor no
 * se toca. Hasta entonces el catálogo (`GET /admin/bulk-imports/templates`)
 * informa `persistence.durable = false`.
 */
@Injectable()
export class InMemoryBatchRepository implements BulkImportBatchRepository {
  private readonly batches = new Map<string, BatchRecord>();

  create(record: BatchRecord): Promise<void> {
    if (this.batches.has(record.id)) {
      return Promise.reject(new Error('Lote duplicado'));
    }
    this.batches.set(record.id, record);
    return Promise.resolve();
  }

  findById(tenantId: string, id: string): Promise<BatchRecord | null> {
    const found = this.batches.get(id);
    return Promise.resolve(found && found.tenantId === tenantId ? found : null);
  }

  findByConfirmKey(tenantId: string, key: string): Promise<BatchRecord | null> {
    for (const batch of this.batches.values()) {
      if (batch.tenantId === tenantId && batch.confirmKey === key) {
        return Promise.resolve(batch);
      }
    }
    return Promise.resolve(null);
  }

  list(tenantId: string, limit: number): Promise<readonly BatchRecord[]> {
    return Promise.resolve(
      [...this.batches.values()]
        .filter((b) => b.tenantId === tenantId)
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
        )
        .slice(0, limit),
    );
  }

  /**
   * Compara y escribe sin ceder el control entre la lectura y la escritura
   * (síncrono dentro de la promesa): es la atomicidad que en SQL da el
   * `UPDATE … WHERE status = ANY(from)`.
   */
  transition(
    tenantId: string,
    id: string,
    from: readonly BulkImportStatus[],
    to: BulkImportStatus,
    patch: Partial<BatchRecord> = {},
  ): Promise<BatchRecord | null> {
    const current = this.batches.get(id);
    if (
      !current ||
      current.tenantId !== tenantId ||
      !from.includes(current.status)
    ) {
      return Promise.resolve(null);
    }
    const next: BatchRecord = {
      ...current,
      ...patch,
      id: current.id,
      tenantId: current.tenantId,
      status: to,
      updatedAt: new Date().toISOString(),
    };
    this.batches.set(id, next);
    return Promise.resolve(next);
  }

  recordProgress(
    tenantId: string,
    id: string,
    processedRows: number,
  ): Promise<void> {
    const current = this.batches.get(id);
    if (current && current.tenantId === tenantId) {
      this.batches.set(id, { ...current, processedRows });
    }
    return Promise.resolve();
  }
}
