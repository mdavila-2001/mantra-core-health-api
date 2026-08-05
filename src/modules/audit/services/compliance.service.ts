import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  AnalyticsGovernanceLogRepository,
  AuditLogRepository,
  DsarRequestsRepository,
} from '../repositories';
import { AUD } from '../audit.concepts';
import {
  CreateAuditExportDto,
  AuditExportResultDto,
  CreateDsarDto,
  UpdateDsarDto,
  DsarResponseDto,
} from '../dto';

const DSAR_TYPE: Record<string, string> = {
  ACCESS: AUD.DSAR_TYPE_ACCESS,
  ERASURE: AUD.DSAR_TYPE_ERASURE,
  RECTIFICATION: AUD.DSAR_TYPE_RECTIFICATION,
  PORTABILITY: AUD.DSAR_TYPE_PORTABILITY,
  OBJECTION: AUD.DSAR_TYPE_OBJECTION,
};
const DSAR_STATUS: Record<string, string> = {
  IN_PROGRESS: AUD.DSAR_IN_PROGRESS,
  COMPLETED: AUD.DSAR_COMPLETED,
  REJECTED: AUD.DSAR_REJECTED,
};
const JURISDICTION: Record<string, string> = {
  PE: AUD.JURISDICTION_PE,
  EU: AUD.JURISDICTION_EU,
  US: AUD.JURISDICTION_US,
};
/** Estados terminales de la máquina DSAR: no admiten más transiciones. */
const TERMINAL = new Set<string>([AUD.DSAR_COMPLETED, AUD.DSAR_REJECTED]);

/**
 * Casos de uso de cumplimiento: exportación de evidencia de auditoría (UC-10-07) y
 * tramitación de DSAR del titular con máquina de estados (UC-10-08). Cada operación
 * registra gobernanza (`analytics_governance_log`) y provenance (`audit_log`).
 */
@Injectable()
export class ComplianceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param governanceRepo - Valor de governance repo requerido por la operación.
   * @param dsarRepo - Valor de dsar repo requerido por la operación.
   * @param auditLogRepo - Valor de audit log repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly governanceRepo: AnalyticsGovernanceLogRepository,
    private readonly dsarRepo: DsarRequestsRepository,
    private readonly auditLogRepo: AuditLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ComplianceService.name);
  }

  /** UC-10-07: exporta evidencia de auditoría para cumplimiento (idempotente por queryHash). */
  async exportEvidence(
    dto: CreateAuditExportDto,
    actor: AuthenticatedUser,
  ): Promise<AuditExportResultDto> {
    this.logger.info(
      {
        operation: 'audit.export.create',
        actorId: actor.id,
        entity: dto.entity,
      },
      'Exporting audit evidence',
    );
    return this.em.transactional(async (tx) => {
      const queryHash = dto.queryHash ?? randomUUID().replace(/-/g, '');
      if (dto.queryHash) {
        const dup = await this.governanceRepo.existsByQueryHash(tx, queryHash);
        if (dup > 0) {
          throw new ConflictException(
            'Ya existe una exportación con ese query_hash',
            { queryHash },
          );
        }
      }
      const exportReference =
        dto.exportReference ?? `export-${queryHash.slice(0, 16)}`;

      const gov = this.governanceRepo.record(tx, {
        actorUserId: actor.id,
        actionConceptId: AUD.GOVERNANCE_EXPORT,
        approvalStatusConceptId: AUD.APPROVAL_APPROVED,
        purposeDefinitionId: dto.purposeDefinitionId,
        exportReference,
        affectedSubjectCount: dto.affectedSubjectCount,
        queryHash,
      });

      const audit = await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'AUDIT_EXPORT',
        entity: dto.entity ?? 'audit_log',
        entityId: dto.entityId,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        recordedByUserId: actor.id,
      });

      return {
        id: gov.id,
        exportReference,
        auditLogId: audit.id,
        occurredAt: gov.occurredAt,
      };
    });
  }

  /** UC-10-08: da de alta una solicitud DSAR (estado inicial "recibida"). */
  async createDsar(
    dto: CreateDsarDto,
    actor: AuthenticatedUser,
  ): Promise<DsarResponseDto> {
    this.logger.info(
      { operation: 'audit.dsar.create', actorId: actor.id, type: dto.type },
      'Intake DSAR request',
    );
    return this.em.transactional(async (tx) => {
      const dsar = this.dsarRepo.create(tx, {
        userId: dto.userId ?? actor.id,
        typeConceptId: DSAR_TYPE[dto.type],
        statusConceptId: AUD.DSAR_RECEIVED,
        jurisdictionConceptId: dto.jurisdiction
          ? JURISDICTION[dto.jurisdiction]
          : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.governanceRepo.record(tx, {
        actorUserId: actor.id,
        actionConceptId: AUD.GOVERNANCE_DISCLOSURE,
        approvalStatusConceptId: AUD.APPROVAL_PENDING,
        exportReference: `dsar-${dsar.id}`,
      });
      await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'DSAR_INTAKE',
        entity: 'dsar_requests',
        entityId: dsar.id,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        recordedByUserId: actor.id,
      });

      return this.toResponse(dsar.id, dto.userId ?? actor.id, dsar);
    });
  }

  /** UC-10-08: avanza la máquina de estados de una solicitud DSAR. */
  async updateDsar(
    id: string,
    dto: UpdateDsarDto,
    actor: AuthenticatedUser,
  ): Promise<DsarResponseDto> {
    this.logger.info(
      {
        operation: 'audit.dsar.update',
        actorId: actor.id,
        id,
        status: dto.status,
      },
      'Transitioning DSAR request',
    );
    return this.em.transactional(async (tx) => {
      const dsar = await this.dsarRepo.findById(tx, id);
      if (!dsar)
        throw new ResourceNotFoundException('Solicitud DSAR no encontrada', {
          id,
        });
      if (TERMINAL.has(dsar.statusConceptId)) {
        throw new PreconditionFailedException(
          'La solicitud DSAR ya está en estado terminal',
          {
            id,
          },
        );
      }

      dsar.statusConceptId = DSAR_STATUS[dto.status];
      if (dto.status === 'COMPLETED') {
        dsar.completedAt = new Date();
        dsar.resultFileId = dto.resultFileId;
      }
      touch(dsar, actor.id);

      await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'DSAR_UPDATE',
        entity: 'dsar_requests',
        entityId: dsar.id,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        recordedByUserId: actor.id,
      });

      return this.toResponse(dsar.id, dsar.userId, dsar);
    });
  }

  /**
   * Transforma to response.
   *
   * @param id - Identificador de id.
   * @param userId - Identificador de user.
   * @param dsar - Valor de dsar requerido por la operación.
   * @returns Resultado de to response conforme al contrato `DsarResponseDto`.
   */
  private toResponse(
    id: string,
    userId: string,
    dsar: {
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a type concept.
       */
      typeConceptId: string;
      /**
       * Versión usada para controlar actualizaciones concurrentes.
       */
      rowVersion: number;
      /**
       * Valor de requested at mantenido por la instancia.
       */
      requestedAt: Date;
      /**
       * Valor de completed at mantenido por la instancia.
       */
      completedAt?: Date;
    },
  ): DsarResponseDto {
    return {
      id,
      userId,
      status: dsar.statusConceptId,
      type: dsar.typeConceptId,
      rowVersion: dsar.rowVersion,
      requestedAt: dsar.requestedAt,
      completedAt: dsar.completedAt ?? null,
    };
  }
}
