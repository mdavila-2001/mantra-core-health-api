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
import {
  AttachFileToProcedureDto,
  CreateProcedureDto,
  ProcedureResponseDto,
} from '../dto';
import { CLIN } from '../clinical.concepts';
// ALV-033 (odontología): un archivo se liga a ESTE procedimiento —incluidos
// los odontológicos, que son procedimientos con categoría dental (ver
// `PeriopDentalService`)—, mismo criterio que `ConditionsService.attachFile`.
import { FilesService } from '../../common/services';
import { OwnerType, type FileLinkResponseDto } from '../../common/dto';
import { ClinicalReadService } from './clinical-read.service';

/** UC-08-12: registro de procedimientos completados; cierra la orden si aplica. */
@Injectable()
export class ProceduresService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param proceduresRepo - Valor de procedures repo requerido por la operación.
   * @param serviceRequestsRepo - Valor de service requests repo requerido por la operación.
   * @param filesService - Vincula archivos ya subidos a un procedimiento puntual.
   * @param logger - Valor de logger requerido por la operación.
   * @param clinicalRead - Política de escritura sobre la historia (MCH-007).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly proceduresRepo: ProceduresRepository,
    private readonly serviceRequestsRepo: ServiceRequestsRepository,
    private readonly filesService: FilesService,
    private readonly logger: PinoLogger,
    private readonly clinicalRead: ClinicalReadService,
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

  /**
   * Liga un archivo ya subido a un procedimiento puntual (ALV-033, odontología).
   *
   * Un tratamiento odontológico es un `clinical.procedures` con categoría
   * dental (`PeriopDentalService`): no hace falta un endpoint propio en ese
   * módulo, este mismo sirve a cualquier procedimiento por id, incluidos los
   * odontológicos.
   */
  async attachFile(
    procedureId: string,
    dto: AttachFileToProcedureDto,
    actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    const procedure = await this.proceduresRepo.findById(this.em, procedureId);
    if (!procedure) {
      throw new ResourceNotFoundException('Procedimiento no encontrado', {
        procedureId,
      });
    }
    // MCH-007: la ruta sólo trae el id; el paciente sale de la fila.
    await this.clinicalRead.assertPuedeEscribirHistoria(
      procedure.patientProfileId,
      actor,
    );
    this.logger.info(
      {
        operation: 'clinical.procedure.attach_file',
        procedureId,
        fileId: dto.fileId,
      },
      'Attaching file to procedure',
    );
    return this.filesService.createLink(
      dto.fileId,
      { ownerType: OwnerType.PROCEDURE, ownerId: procedure.id },
      actor,
    );
  }
}
