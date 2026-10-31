import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import { AUD } from '../../../audit/audit.concepts';
import { DataAccessLogRepository } from '../../../audit/repositories';
import { AuditTrailService } from '../../../audit/services/audit-trail.service';
import type {
  SupportAuditEntry,
  SupportAuditPort,
  SupportPatientAccessEntry,
} from '../../application/ports/support-audit.port';

/**
 * Adaptador del sello de auditoría del personal de apoyo a la cadena de
 * `audit`. Es el único que conoce al otro módulo.
 */
@Injectable()
export class AuditSupportAuditAdapter implements SupportAuditPort {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param audit - Cadena de auditoría.
   * @param accessLog - Registro de accesos a datos del paciente.
   */
  constructor(
    private readonly audit: AuditTrailService,
    private readonly accessLog: DataAccessLogRepository,
  ) {}

  record(
    tx: EntityManager,
    actor: AuthenticatedUser,
    entry: SupportAuditEntry,
  ): Promise<void> {
    return this.audit.record(tx, actor, entry);
  }

  recordPatientAccess(
    tx: EntityManager,
    actor: AuthenticatedUser,
    entry: SupportPatientAccessEntry,
  ): Promise<void> {
    this.accessLog.record(tx, {
      userId: actor.id,
      actionConceptId: AUD.ACTION_READ,
      patientProfileId: entry.patientProfileId,
      tenantId: entry.tenantId,
      purpose: 'OPERATIONS',
      resourceType: entry.resourceType,
      recordedByUserId: actor.id,
    });
    return Promise.resolve();
  }
}
