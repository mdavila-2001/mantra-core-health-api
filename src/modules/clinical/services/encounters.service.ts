import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { CareEpisodesRepository, EncountersRepository } from '../repositories';
import {
  CheckInEncounterDto,
  CloseEncounterDto,
  EncounterResponseDto,
} from '../dto';
import { CLIN } from '../clinical.concepts';

/**
 * UC-08-02 (check-in) y UC-08-14 (cierre) de encuentros. El check-in abre el
 * encuentro y, opcionalmente, sus participantes y ubicación; el cierre finaliza
 * el encuentro y cierra los periodos de participantes/ubicaciones activos.
 */
@Injectable()
export class EncountersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encountersRepo - Valor de encounters repo requerido por la operación.
   * @param episodesRepo - Valor de episodes repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly encountersRepo: EncountersRepository,
    private readonly episodesRepo: CareEpisodesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EncountersService.name);
  }

  /** UC-08-02: abre (check-in) un encuentro con participantes y ubicación. */
  async checkIn(
    dto: CheckInEncounterDto,
    actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.encounter.check-in',
        patientProfileId: dto.patientProfileId,
      },
      'Opening encounter',
    );
    return this.em.transactional(async (tx) => {
      if (dto.episodeId) {
        const episode = await this.episodesRepo.findById(tx, dto.episodeId);
        if (!episode) {
          throw new ResourceNotFoundException(
            'Episodio de cuidado no encontrado',
            {
              episodeId: dto.episodeId,
            },
          );
        }
      }

      const now = new Date();
      const encounter = this.encountersRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId,
        episodeId: dto.episodeId,
        branchId: dto.branchId,
        primaryPractitionerId: dto.primaryPractitionerId,
        classConceptId: dto.classConceptId ?? CLIN.ENCOUNTER_CLASS_AMBULATORY,
        typeConceptId: dto.typeConceptId,
        statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
        reasonText: dto.reasonText,
        appointmentId: dto.appointmentId,
        startAt: now,
        actorUserId: actor.id,
      });
      // FK planas: persistir el encuentro antes de participantes/ubicaciones.
      await tx.flush();

      const participantIds: string[] = [];
      for (const p of dto.participants ?? []) {
        const participant = this.encountersRepo.createParticipant(tx, {
          encounterId: encounter.id,
          practitionerProfileId: p.practitionerProfileId,
          participantRoleConceptId:
            p.roleConceptId ?? CLIN.PARTICIPANT_ROLE_ATTENDER,
          statusConceptId: CLIN.PARTICIPANT_ACTIVE,
          isResponsible: p.isResponsible ?? false,
          periodStart: now,
          actorUserId: actor.id,
        });
        participantIds.push(participant.id);
      }

      const locationIds: string[] = [];
      if (dto.location) {
        const location = this.encountersRepo.createLocation(tx, {
          encounterId: encounter.id,
          practiceSiteId: dto.location.practiceSiteId,
          clinicalUnitId: dto.location.clinicalUnitId,
          careSpaceId: dto.location.careSpaceId,
          locationStatusConceptId: CLIN.LOCATION_ACTIVE,
          periodStart: now,
          actorUserId: actor.id,
        });
        locationIds.push(location.id);
      }
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.encounter.check-in', encounterId: encounter.id },
        'Encounter opened',
      );
      return {
        id: encounter.id,
        patientProfileId: encounter.patientProfileId,
        episodeId: encounter.episodeId ?? null,
        status: encounter.statusConceptId,
        participantIds,
        locationIds,
        startAt: encounter.startAt ?? null,
        endAt: encounter.endAt ?? null,
        createdAt: encounter.createdAt,
      };
    });
  }

  /** UC-08-14: cierra un encuentro en curso y sus periodos activos. */
  async close(
    encounterId: string,
    dto: CloseEncounterDto,
    actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    this.logger.info(
      { operation: 'clinical.encounter.close', encounterId },
      'Closing encounter',
    );
    return this.em.transactional(async (tx) => {
      const encounter = await this.encountersRepo.findById(tx, encounterId);
      if (!encounter) {
        throw new ResourceNotFoundException('Encuentro no encontrado', {
          encounterId,
        });
      }
      if (encounter.statusConceptId !== CLIN.ENCOUNTER_IN_PROGRESS) {
        throw new PreconditionFailedException('El encuentro no está en curso', {
          encounterId,
          status: encounter.statusConceptId,
        });
      }
      if (
        dto.expectedRowVersion !== undefined &&
        dto.expectedRowVersion !== encounter.rowVersion
      ) {
        throw new ConcurrencyConflictException(
          'Versión del encuentro desactualizada',
          {
            expected: dto.expectedRowVersion,
            actual: encounter.rowVersion,
          },
        );
      }

      const now = new Date();
      encounter.statusConceptId = CLIN.ENCOUNTER_FINISHED;
      encounter.endAt = now;
      touch(encounter, actor.id);

      const participants = await this.encountersRepo.findActiveParticipants(
        tx,
        encounterId,
        CLIN.PARTICIPANT_ACTIVE,
      );
      for (const p of participants) {
        p.periodEnd = now;
        p.statusConceptId = CLIN.PARTICIPANT_COMPLETED;
        touch(p, actor.id);
      }

      const locations = await this.encountersRepo.findActiveLocations(
        tx,
        encounterId,
        CLIN.LOCATION_ACTIVE,
      );
      for (const l of locations) {
        l.periodEnd = now;
        l.locationStatusConceptId = CLIN.LOCATION_COMPLETED;
        touch(l, actor.id);
      }

      await tx.flush();

      this.logger.info(
        { operation: 'clinical.encounter.close', encounterId },
        'Encounter closed',
      );
      return {
        id: encounter.id,
        patientProfileId: encounter.patientProfileId,
        episodeId: encounter.episodeId ?? null,
        status: encounter.statusConceptId,
        participantIds: participants.map((p) => p.id),
        locationIds: locations.map((l) => l.id),
        startAt: encounter.startAt ?? null,
        endAt: encounter.endAt ?? null,
        createdAt: encounter.createdAt,
      };
    });
  }
}
