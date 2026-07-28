import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { AuditLogRepository, DataAccessLogRepository } from '../repositories';
import { AUD } from '../audit.concepts';
import {
  RecordDataAccessDto,
  DataAccessResultDto,
  RecordAuditEventDto,
  AuditEventResultDto,
  VerifyIntegrityDto,
  IntegrityReportDto,
  RetentionApplyDto,
  RetentionResultDto,
  AnomalyScanDto,
  AnomalyScanResultDto,
} from '../dto';

const PURPOSE_OF_USE: Record<string, string> = {
  TREATMENT: AUD.PURPOSE_TREATMENT,
  PAYMENT: AUD.PURPOSE_PAYMENT,
  OPERATIONS: AUD.PURPOSE_OPERATIONS,
  COVERAGE: AUD.PURPOSE_COVERAGE,
  VERIFICATION: AUD.PURPOSE_VERIFICATION,
};
const LEGAL_BASIS: Record<string, string> = {
  TREATMENT: AUD.LEGAL_BASIS_TREATMENT,
  CONSENT: AUD.LEGAL_BASIS_CONSENT,
  LEGAL_OBLIGATION: AUD.LEGAL_BASIS_LEGAL_OBLIGATION,
};
const outcomeConcept = (o: string): string =>
  o === 'FAILURE' ? CONCEPTS.OUTCOME_FAILURE : CONCEPTS.OUTCOME_SUCCESS;

/** Umbral simple de accesos por ventana para marcar un patrón como anómalo. */
const ANOMALY_THRESHOLD = 100;

/**
 * Casos de uso centrados en `audit.audit_log` y logs de acceso WORM:
 * registro de acceso clínico (UC-10-01), evento de provenance con sellado de
 * cadena (UC-10-04/03), verificación de integridad tamper-evidence (UC-10-06),
 * aplicación de retención (UC-10-09) y barrido de anomalías (UC-10-10).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`): el sellado de la
 * cadena hash ocurre en la misma transacción que el registro de negocio.
 */
@Injectable()
export class AuditEventsService {
  constructor(
    private readonly em: EntityManager,
    private readonly auditLogRepo: AuditLogRepository,
    private readonly dataAccessRepo: DataAccessLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuditEventsService.name);
  }

  /** UC-10-01: registra un acceso/lectura clínica (accounting WORM) + provenance. */
  async recordDataAccess(
    dto: RecordDataAccessDto,
    actor: AuthenticatedUser,
  ): Promise<DataAccessResultDto> {
    this.logger.info(
      {
        operation: 'audit.dataAccess.record',
        actorId: actor.id,
        resourceType: dto.resourceType,
      },
      'Recording clinical data access',
    );
    return this.em.transactional(async (tx) => {
      const access = this.dataAccessRepo.record(tx, {
        userId: actor.id,
        actionConceptId: AUD.ACTION_READ,
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId,
        purpose: dto.purpose,
        legalBasisConceptId: dto.legalBasis
          ? LEGAL_BASIS[dto.legalBasis]
          : undefined,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        recordedByUserId: actor.id,
      });

      let patientContentLogged = false;
      if (dto.patientProfileId && dto.resourceId) {
        this.dataAccessRepo.recordPatientContent(tx, {
          patientProfileId: dto.patientProfileId,
          resourceTypeConceptId: AUD.RESOURCE_TYPE_CLINICAL,
          resourceId: dto.resourceId,
          resourceVersionId: dto.resourceVersionId,
          actionConceptId: AUD.ACTION_READ,
          purposeOfUseConceptId:
            PURPOSE_OF_USE[dto.purposeOfUse ?? 'TREATMENT'],
          decisionConceptId: AUD.DECISION_PERMIT,
          policyVersion: dto.policyVersion,
          requestId: dto.requestId,
          recordedByUserId: actor.id,
        });
        patientContentLogged = true;
      }

      const audit = await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'DATA_ACCESS',
        entity: dto.resourceType ?? 'resource',
        entityId: dto.resourceId,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        tenantId: dto.tenantId,
        recordedByUserId: actor.id,
      });

      return {
        id: access.id,
        auditLogId: audit.id,
        patientContentLogged,
        recordedAt: access.recordedAt,
      };
    });
  }

  /** UC-10-04/03: registra un evento de provenance y lo sella en la cadena hash. */
  async recordEvent(
    dto: RecordAuditEventDto,
    actor: AuthenticatedUser,
  ): Promise<AuditEventResultDto> {
    this.logger.info(
      {
        operation: 'audit.event.record',
        actorId: actor.id,
        action: dto.action,
        entity: dto.entity,
      },
      'Sealing audit event into hash chain',
    );
    return this.em.transactional(async (tx) => {
      const row = await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        outcomeConceptId: outcomeConcept(dto.outcome),
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        ip: dto.ip,
        deviceId: dto.deviceId,
        recordedByUserId: actor.id,
      });
      return {
        id: row.id,
        previousHash: row.previousHash ?? null,
        recordHash: row.recordHash,
        recordedAt: row.recordedAt,
      };
    });
  }

  /** UC-10-06: recomputa la cadena y registra un evento de atestación. */
  async verifyIntegrity(
    dto: VerifyIntegrityDto,
    actor: AuthenticatedUser,
  ): Promise<IntegrityReportDto> {
    this.logger.info(
      {
        operation: 'audit.integrity.verify',
        actorId: actor.id,
        tenantId: dto.tenantId,
      },
      'Verifying hash-chain integrity',
    );
    return this.em.transactional(async (tx) => {
      const chain = await this.auditLogRepo.findChain(
        tx,
        dto.tenantId,
        dto.limit ?? 1000,
      );
      let prev: string | undefined;
      let brokenAt: string | null = null;
      let checkedCount = 0;
      for (const link of chain) {
        const expected = AuditLogRepository.hash(
          link.previousHash,
          AuditLogRepository.content(link),
          link.recordedAt,
        );
        const linkOk =
          (link.previousHash ?? undefined) === prev &&
          expected === link.recordHash;
        if (!linkOk) {
          brokenAt = link.id;
          break;
        }
        prev = link.recordHash;
        checkedCount += 1;
      }

      const verified = brokenAt === null;
      const attestation = await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'INTEGRITY_ATTESTATION',
        entity: 'audit_log',
        entityId: brokenAt ?? undefined,
        outcomeConceptId: verified
          ? CONCEPTS.OUTCOME_SUCCESS
          : CONCEPTS.OUTCOME_FAILURE,
        tenantId: dto.tenantId,
        recordedByUserId: actor.id,
      });

      if (!verified) {
        this.logger.warn(
          { operation: 'audit.integrity.verify', brokenAt },
          'Hash chain integrity broken',
        );
      }
      return {
        verified,
        checkedCount,
        brokenAt,
        attestationId: attestation.id,
      };
    });
  }

  /**
   * UC-10-09: aplica la política de retención sobre el log de accesos y sella el
   * evento de retención en la cadena de auditoría.
   *
   * Política y fail-closed:
   * - Sólo se purga el `data_access_log` (contabilidad de accesos, dato con
   *   ventana de retención). La cadena WORM `audit_log` es tamper-evidence: es
   *   inmutable y jamás se borra, así que un `scope` distinto de `data_access_log`
   *   no purga nada (0 filas) y sólo deja constancia.
   * - Sólo se borra con una ventana explícita (`olderThan`): sin fecha de corte no
   *   se elimina nada, para no borrar más de lo que la ventana indica.
   *
   * Reporta el conteo REAL de filas purgadas por la base.
   */
  async applyRetention(
    dto: RetentionApplyDto,
    actor: AuthenticatedUser,
  ): Promise<RetentionResultDto> {
    const scope = dto.scope ?? 'data_access_log';
    this.logger.info(
      {
        operation: 'audit.retention.apply',
        actorId: actor.id,
        scope,
        olderThan: dto.olderThan,
      },
      'Applying retention policy',
    );
    return this.em.transactional(async (tx) => {
      let purgedCount = 0;
      if (dto.olderThan && scope === 'data_access_log') {
        purgedCount = await this.dataAccessRepo.purgeOlderThan(
          tx,
          new Date(dto.olderThan),
          dto.tenantId,
        );
      }

      const row = await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'RETENTION_APPLIED',
        entity: scope,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        tenantId: dto.tenantId,
        recordedByUserId: actor.id,
      });
      return {
        auditLogId: row.id,
        applied: true,
        purgedCount,
        recordedAt: row.recordedAt,
      };
    });
  }

  /** UC-10-10: evalúa el volumen de accesos y registra un hallazgo de anomalía. */
  async scanAnomaly(
    dto: AnomalyScanDto,
    actor: AuthenticatedUser,
  ): Promise<AnomalyScanResultDto> {
    const targetUser = dto.userId ?? actor.id;
    const since = dto.since
      ? new Date(dto.since)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.logger.info(
      { operation: 'audit.anomaly.scan', actorId: actor.id, targetUser },
      'Scanning access baseline for anomalies',
    );
    return this.em.transactional(async (tx) => {
      const accessCount = await this.dataAccessRepo.countByUserSince(
        tx,
        targetUser,
        since,
      );
      const anomalous = accessCount > ANOMALY_THRESHOLD;
      const row = await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'ANOMALY_FINDING',
        entity: 'data_access_log',
        entityId: targetUser,
        outcomeConceptId: anomalous
          ? CONCEPTS.OUTCOME_FAILURE
          : CONCEPTS.OUTCOME_SUCCESS,
        tenantId: dto.tenantId,
        recordedByUserId: actor.id,
      });
      return { accessCount, anomalous, auditLogId: row.id };
    });
  }
}
