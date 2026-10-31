import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import type {
  BulkImportAuditEvent,
  BulkImportAuditPort,
} from '../ports/bulk-import.ports';

/**
 * Auditoría de lo cargado y de quién lo leyó, en la cadena WORM transversal
 * (`audit.audit_log`) mediante `AuditTrailService`.
 *
 * Sólo identificadores: actor, organización, lote, fila y registro creado.
 * Nunca el contenido de la fila.
 */
@Injectable()
export class TrailAuditAdapter implements BulkImportAuditPort {
  constructor(
    private readonly em: EntityManager,
    private readonly trail: AuditTrailService,
  ) {}

  async record(event: BulkImportAuditEvent): Promise<void> {
    await this.em.fork().transactional(async (tx) => {
      await this.trail.record(
        tx,
        { id: event.actorId, roles: [] },
        {
          action: `BULK_IMPORT_${event.action}`,
          entity: 'bulk_import_batch',
          entityId: event.batchId,
          tenantId: event.tenantId,
        },
      );
    });
  }
}
