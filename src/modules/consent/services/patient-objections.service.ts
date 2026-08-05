import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  SEED,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PatientObjectionsRepository,
  PrivacyRestrictionsRepository,
  ConsentEventsRepository,
} from '../repositories';
import { CONS } from '../consent.concepts';
import {
  CreatePatientObjectionDto,
  PatientObjectionResponseDto,
  ResolvePatientObjectionDto,
  StatusResultDto,
} from '../dto';

/**
 * Casos de uso sobre `consent.patient_objections`: registrar una objeción y
 * (opcionalmente, include UC-07-07) materializar una restricción de privacidad de
 * bloqueo inmediato (UC-07-03); y resolver la objeción (UC-07-12), revocando la
 * restricción asociada cuando la objeción se rechaza.
 */
@Injectable()
export class PatientObjectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param objectionsRepo - Valor de objections repo requerido por la operación.
   * @param restrictionsRepo - Valor de restrictions repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly objectionsRepo: PatientObjectionsRepository,
    private readonly restrictionsRepo: PrivacyRestrictionsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PatientObjectionsService.name);
  }

  /** UC-07-03: registra la objeción y, si se pide, aplica una restricción inmediata. */
  async raise(
    dto: CreatePatientObjectionDto,
    actor: AuthenticatedUser,
  ): Promise<PatientObjectionResponseDto> {
    this.logger.info(
      {
        operation: 'consent.objection.raise',
        patientProfileId: dto.patientProfileId,
      },
      'Raising patient objection',
    );
    return this.em.transactional(async (tx) => {
      const open = await this.objectionsRepo.findOpenByPurpose(
        tx,
        dto.patientProfileId,
        dto.processingPurposeId,
        CONS.OBJECTION_STATUS_RAISED,
      );
      if (open) {
        throw new ConflictException(
          'Ya existe una objeción abierta para este propósito',
          {
            patientProfileId: dto.patientProfileId,
            processingPurposeId: dto.processingPurposeId,
          },
        );
      }

      const now = new Date();
      const tenantId = dto.tenantId ?? SEED.tenantId;
      const objection = this.objectionsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId,
        processingPurposeId: dto.processingPurposeId,
        objectionTypeConceptId:
          dto.objectionTypeConceptId ?? CONS.OBJECTION_TYPE_PROCESSING,
        reasonText: dto.reasonText,
        statusConceptId: CONS.OBJECTION_STATUS_RAISED,
        raisedAt: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      let restrictionId: string | null = null;
      if (dto.applyRestriction) {
        const restriction = this.restrictionsRepo.create(tx, {
          patientProfileId: dto.patientProfileId,
          tenantId,
          restrictionTypeConceptId: CONS.RESTRICTION_TYPE_BLOCK,
          dataClassConceptId:
            dto.restrictionDataClassConceptId ?? CONS.DATA_CLASS_ALL,
          reasonText: dto.reasonText,
          statusConceptId: CONS.RESTRICTION_ACTIVE,
          validFrom: now,
          actorUserId: actor.id,
        });
        await tx.flush();
        restrictionId = restriction.id;

        this.eventsRepo.record(tx, {
          subjectTypeConceptId: CONS.SUBJECT_RESTRICTION,
          subjectId: restriction.id,
          eventTypeConceptId: CONS.EVENT_RESTRICTION_APPLIED,
          previousStatusConceptId: CONS.STATUS_NONE,
          newStatusConceptId: CONS.RESTRICTION_ACTIVE,
          recordedByUserId: actor.id,
        });
      }

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_OBJECTION,
        subjectId: objection.id,
        eventTypeConceptId: CONS.EVENT_OBJECTION_RAISED,
        previousStatusConceptId: CONS.STATUS_NONE,
        newStatusConceptId: CONS.OBJECTION_STATUS_RAISED,
        recordedByUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'consent.objection.raise',
          objectionId: objection.id,
          restrictionId,
        },
        'Patient objection raised',
      );
      return {
        id: objection.id,
        patientProfileId: objection.patientProfileId,
        status: objection.statusConceptId,
        restrictionId,
        createdAt: objection.createdAt,
      };
    });
  }

  /** UC-07-12: resuelve la objeción; si se rechaza, revoca las restricciones activas del paciente. */
  async resolve(
    id: string,
    dto: ResolvePatientObjectionDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'consent.objection.resolve',
        objectionId: id,
        resolution: dto.resolution,
      },
      'Resolving patient objection',
    );
    return this.em.transactional(async (tx) => {
      const objection = await this.objectionsRepo.findById(tx, id);
      if (!objection)
        throw new ResourceNotFoundException('Objeción no encontrada', { id });
      if (objection.statusConceptId !== CONS.OBJECTION_STATUS_RAISED) {
        throw new ConflictException('La objeción no está abierta', {
          id,
          status: objection.statusConceptId,
        });
      }

      const now = new Date();
      objection.statusConceptId = CONS.OBJECTION_STATUS_RESOLVED;
      objection.resolvedAt = now;
      objection.resolutionConceptId =
        dto.resolution === 'UPHELD'
          ? CONS.RESOLUTION_UPHELD
          : CONS.RESOLUTION_REJECTED;
      touch(objection, actor.id);

      // Si la objeción se rechaza, se levantan las restricciones activas asociadas.
      if (dto.resolution === 'REJECTED') {
        const active = await this.restrictionsRepo.findActiveByPatient(
          tx,
          objection.patientProfileId,
          CONS.RESTRICTION_ACTIVE,
        );
        for (const restriction of active) {
          restriction.statusConceptId = CONS.RESTRICTION_REVOKED;
          restriction.validTo = now;
          touch(restriction, actor.id);
        }
      }

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_OBJECTION,
        subjectId: objection.id,
        eventTypeConceptId: CONS.EVENT_OBJECTION_RESOLVED,
        previousStatusConceptId: CONS.OBJECTION_STATUS_RAISED,
        newStatusConceptId: CONS.OBJECTION_STATUS_RESOLVED,
        reasonConceptId: dto.reasonConceptId,
        recordedByUserId: actor.id,
      });

      return { ok: true };
    });
  }
}
