import { Injectable } from '@nestjs/common';
import { AUD } from '../../../audit/audit.concepts';
import { DataAccessLogRepository } from '../../../audit/repositories/data-access-log.repository';
import type {
  PrescriptionShareAccessLogPort,
  PrescriptionShareAccessRecord,
} from '../../application/ports/prescription-share-access-log.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Tipo de recurso del asiento: el mismo que declara `@AccessLogged` en la ruta. */
export const PRESCRIPTION_SHARE_RESOURCE_TYPE = 'PRESCRIPTION_SHARE';

/**
 * Propósito del asiento: el que `AuditTrailInterceptor` usa para una lectura
 * de PHI de un tercero (la farmacia dispensa: atención del paciente).
 */
const PHARMACY_READ_PURPOSE = 'TREATMENT';

/**
 * Adaptador al registro de accesos del contexto audit
 * (`DataAccessLogRepository`, el mismo camino que `ClinicalReadService` y el
 * directorio de pacientes de `insurance`). Escribe identificadores, nunca
 * contenido clínico.
 */
@Injectable()
export class AuditPrescriptionShareAccessLogAdapter implements PrescriptionShareAccessLogPort {
  constructor(private readonly dataAccess: DataAccessLogRepository) {}

  async recordPharmacyRead(
    uow: UnitOfWork,
    record: PrescriptionShareAccessRecord,
  ): Promise<void> {
    const em = uow.fork();
    this.dataAccess.record(em, {
      userId: record.userId,
      actionConceptId: AUD.ACTION_READ,
      patientProfileId: record.patientProfileId,
      tenantId: record.tenantId,
      purpose: PHARMACY_READ_PURPOSE,
      resourceType: PRESCRIPTION_SHARE_RESOURCE_TYPE,
      resourceId: record.shareId,
      recordedByUserId: record.userId,
    });
    await em.flush();
  }
}
