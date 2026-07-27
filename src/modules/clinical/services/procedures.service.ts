import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ProceduresRepository,
  ServiceRequestsRepository,
} from '../repositories';
import { CreateProcedureDto, ProcedureResponseDto } from '../dto';
import { CLIN } from '../clinical.concepts';

/** UC-08-12: registro de procedimientos completados; cierra la orden si aplica. */
@Injectable()
export class ProceduresService {
  constructor(
    private readonly em: EntityManager,
    private readonly proceduresRepo: ProceduresRepository,
    private readonly serviceRequestsRepo: ServiceRequestsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProceduresService.name);
  }

  /** UC-08-12: registra un procedimiento (completado). */
  async create(
    dto: CreateProcedureDto,
    actor: AuthenticatedUser,
  ): Promise<ProcedureResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.procedure.create',
        patientProfileId: dto.patientProfileId,
      },
      'Recording procedure',
    );
    return this.em.transactional(async (tx) => {
      if (dto.serviceRequestId) {
        const sr = await this.serviceRequestsRepo.findById(
          tx,
          dto.serviceRequestId,
        );
        if (!sr) {
          throw new ResourceNotFoundException(
            'Orden de servicio no encontrada',
            {
              serviceRequestId: dto.serviceRequestId,
            },
          );
        }
        sr.statusConceptId = CLIN.SERVICE_REQUEST_COMPLETED;
        touch(sr, actor.id);
      }
      if (dto.parentProcedureId) {
        const parent = await this.proceduresRepo.findById(
          tx,
          dto.parentProcedureId,
        );
        if (!parent) {
          throw new ResourceNotFoundException(
            'Procedimiento padre no encontrado',
            {
              parentProcedureId: dto.parentProcedureId,
            },
          );
        }
      }

      const procedure = this.proceduresRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        codeConceptId: dto.codeConceptId,
        statusConceptId: CLIN.PROCEDURE_COMPLETED,
        performerProfileId: dto.performerProfileId,
        serviceRequestId: dto.serviceRequestId,
        parentProcedureId: dto.parentProcedureId,
        categoryConceptId: dto.categoryConceptId,
        outcomeConceptId: dto.outcomeConceptId,
        practiceSiteId: dto.practiceSiteId,
        careSpaceId: dto.careSpaceId,
        occurrenceStartAt: dto.occurrenceStartAt
          ? new Date(dto.occurrenceStartAt)
          : undefined,
        occurrenceEndAt: dto.occurrenceEndAt
          ? new Date(dto.occurrenceEndAt)
          : undefined,
        recordedAt: new Date(),
        followUpText: dto.followUpText,
        operativeReportFileId: dto.operativeReportFileId,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.procedure.create', procedureId: procedure.id },
        'Procedure recorded',
      );
      return {
        id: procedure.id,
        patientProfileId: procedure.patientProfileId,
        status: procedure.statusConceptId,
        serviceRequestId: procedure.serviceRequestId ?? null,
        createdAt: procedure.createdAt,
      };
    });
  }
}
