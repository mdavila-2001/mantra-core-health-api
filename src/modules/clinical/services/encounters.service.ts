import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  ConflictException,
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
import { Encounters } from '../entities';
import { CLIN } from '../clinical.concepts';
import { ClinicalNotificationsService } from './clinical-notifications.service';
import { EncounterSealService } from './encounter-seal.service';

/**
 * Código del estado `ENCOUNTER_FINISHED` (`CLIN.ENCOUNTER_FINISHED` sólo
 * expone el uuid derivado; el 409 de la subtarea 4.2 necesita el código
 * legible del concepto, no su identificador).
 */
const ENCOUNTER_FINISHED_STATUS_CODE = 'ENC_FINISHED';

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
   * @param clinicalNotifications - Emisión in-app del carril P1.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly encountersRepo: EncountersRepository,
    private readonly episodesRepo: CareEpisodesRepository,
    private readonly clinicalNotifications: ClinicalNotificationsService,
    private readonly seal: EncounterSealService,
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

      if (dto.appointmentId) {
        const encuentroDeLaCita = await this.resolverEncuentroDeLaCita(
          tx,
          dto.appointmentId,
        );
        if (encuentroDeLaCita) {
          return encuentroDeLaCita;
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
      return this.aRespuesta(encounter, participantIds, locationIds);
    });
  }

  /**
   * Idempotencia del check-in por cita (subtarea 4.2): si la cita ya tiene un
   * encuentro en curso, lo devuelve sin escribir nada; si ya tiene uno
   * finalizado, rechaza con 409. Sin encuentro previo (o en cualquier otro
   * estado), devuelve `null` para que `checkIn` cree uno nuevo.
   *
   * @param tx - Transacción activa del check-in.
   * @param appointmentId - Cita clínica referenciada por el check-in.
   * @returns La respuesta del encuentro reutilizado, o `null` si hay que crear uno.
   */
  private async resolverEncuentroDeLaCita(
    tx: EntityManager,
    appointmentId: string,
  ): Promise<EncounterResponseDto | null> {
    // D-3: serializa los check-in concurrentes sobre la misma cita. Si la cita
    // no existe, se sigue igual: la FK plana produce el mismo 422 de hoy.
    await this.encountersRepo.findAppointmentForUpdate(tx, appointmentId);

    const previos = await this.encountersRepo.findByAppointmentId(
      tx,
      appointmentId,
    );
    const previo = previos[0];
    if (!previo) {
      return null;
    }

    if (previo.statusConceptId === CLIN.ENCOUNTER_IN_PROGRESS) {
      const [participants, locations] = await Promise.all([
        this.encountersRepo.findActiveParticipants(
          tx,
          previo.id,
          CLIN.PARTICIPANT_ACTIVE,
        ),
        this.encountersRepo.findActiveLocations(
          tx,
          previo.id,
          CLIN.LOCATION_ACTIVE,
        ),
      ]);
      this.logger.info(
        {
          operation: 'clinical.encounter.check-in',
          encounterId: previo.id,
          reused: true,
        },
        'Encounter reused',
      );
      return this.aRespuesta(
        previo,
        participants.map((p) => p.id),
        locations.map((l) => l.id),
      );
    }

    if (previo.statusConceptId === CLIN.ENCOUNTER_FINISHED) {
      throw new ConflictException(
        'La cita ya cuenta con un encuentro clínico finalizado.',
        {
          appointmentId,
          encounterId: previo.id,
          status: ENCOUNTER_FINISHED_STATUS_CODE,
          endAt: previo.endAt ?? null,
        },
      );
    }

    return null;
  }

  /**
   * Arma el `EncounterResponseDto` a partir del encuentro y sus participantes
   * y ubicaciones (creados o reutilizados). Extraído para que el check-in y el
   * cierre emitan exactamente la misma forma de respuesta.
   *
   * @param encounter - Encuentro persistido.
   * @param participantIds - Identificadores de sus participantes activos.
   * @param locationIds - Identificadores de sus ubicaciones activas.
   * @returns El DTO de respuesta del módulo.
   */
  private aRespuesta(
    encounter: Encounters,
    participantIds: string[],
    locationIds: string[],
  ): EncounterResponseDto {
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
      contentHash: encounter.contentHash ?? null,
      sealedAt: encounter.sealedAt ?? null,
    };
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
    const cerrado = await this.em.transactional(async (tx) => {
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

      encounter.contentHash = await this.seal.computeHash(tx, encounter);
      encounter.sealedAt = now;

      await tx.flush();

      this.logger.info(
        { operation: 'clinical.encounter.close', encounterId },
        'Encounter closed',
      );
      return this.aRespuesta(
        encounter,
        participants.map((p) => p.id),
        locations.map((l) => l.id),
      );
    });

    // Carril P1: «tu consulta está disponible». Fuera de la transacción por lo
    // mismo que en la receta — el encuentro ya está cerrado y no puede
    // desandarse porque falle un aviso.
    await this.clinicalNotifications.encounterClosed(
      cerrado.id,
      cerrado.patientProfileId,
      actor.id,
    );
    return cerrado;
  }
}
