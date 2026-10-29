import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ClinicalErrorReason } from '../clinical.error-reasons';
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
  AttachFileToEncounterDto,
  CheckInEncounterDto,
  CloseEncounterDto,
  EncounterResponseDto,
} from '../dto';
import { Encounters } from '../entities';
import { CLIN } from '../clinical.concepts';
import { PRAC } from '../../practice/practice.concepts';
import { ClinicalNotificationsService } from './clinical-notifications.service';
import { EncounterSealService } from './encounter-seal.service';
import { ClinicalReadService } from './clinical-read.service';
import {
  AuthzCareRelationshipsService,
  type CareRelationshipRequestNotice,
} from '../../authz/services';
// P25 (BR-11): adjuntar un archivo ya subido al encuentro por su ruta clínica,
// calcado de `ProceduresService.attachFile`.
import { FilesService } from '../../common/services';
import {
  OwnerType,
  type FileLinkResponseDto,
  type LinkedFilePageDto,
} from '../../common/dto';

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
   * @param clinicalRead - Política de escritura sobre la historia (MCH-007).
   * @param filesService - Vincula archivos ya subidos al encuentro (P25).
   * @param careRelationships - Deja la relación asistencial que exige el cobro con seguro (REQ-16-035).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly encountersRepo: EncountersRepository,
    private readonly episodesRepo: CareEpisodesRepository,
    private readonly clinicalNotifications: ClinicalNotificationsService,
    private readonly seal: EncounterSealService,
    private readonly logger: PinoLogger,
    private readonly clinicalRead: ClinicalReadService,
    private readonly filesService: FilesService,
    private readonly careRelationships: AuthzCareRelationshipsService,
  ) {
    this.logger.setContext(EncountersService.name);
  }

  /**
   * P25 (BR-11): liga un archivo ya subido a este encuentro. 404 antes de
   * autorizar; el paciente sale de la fila, nunca del cuerpo (MCH-007). Si el
   * encuentro está cerrado y sellado, el vínculo no toca su contenido ni su
   * hash: vive en `common.file_links`. La regla del sello sobre adjuntos
   * posteriores es de BR-14 (CL-07) y no se decide acá.
   */
  async attachFile(
    encounterId: string,
    dto: AttachFileToEncounterDto,
    actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    const encounter = await this.encountersRepo.findById(this.em, encounterId);
    if (!encounter) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }
    await this.clinicalRead.assertCanWriteHistory(
      encounter.patientProfileId,
      actor,
    );
    this.logger.info(
      {
        operation: 'clinical.encounter.attach_file',
        encounterId,
        fileId: dto.fileId,
      },
      'Attaching file to encounter',
    );
    return this.filesService.createLink(
      dto.fileId,
      { ownerType: OwnerType.ENCOUNTER, ownerId: encounter.id },
      actor,
    );
  }

  /**
   * P25 (BR-11 §1.C): los adjuntos de un encuentro, por la ruta clínica. 404
   * antes de autorizar; listar es leer la historia (`assertPuedeLeerHistoria`).
   */
  async listAttachments(
    encounterId: string,
    actor: AuthenticatedUser,
  ): Promise<LinkedFilePageDto> {
    const encounter = await this.encountersRepo.findById(this.em, encounterId);
    if (!encounter) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }
    await this.clinicalRead.assertCanReadHistory(
      encounter.patientProfileId,
      actor,
    );
    return this.filesService.listLinkedFilesOf(
      OwnerType.ENCOUNTER,
      encounter.id,
    );
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
    const requests: CareRelationshipRequestNotice[] = [];
    const response = await this.em.transactional(async (tx) => {
      if (dto.episodeId) {
        const episode = await this.episodesRepo.findById(tx, dto.episodeId);
        if (!episode) {
          throw new ResourceNotFoundException(
            'Episodio de cuidado no encontrado',
            {
              episodeId: dto.episodeId,
            },
            ClinicalErrorReason.CARE_EPISODE_NOT_FOUND,
          );
        }
      }

      if (dto.appointmentId) {
        const appointmentEncounter = await this.resolverAppointmentEncounter(
          tx,
          dto.appointmentId,
        );
        if (appointmentEncounter) {
          return appointmentEncounter;
        }
      }

      if (dto.location?.careSpaceId) {
        await this.assertNotABed(tx, dto.location.careSpaceId, dto.tenantId);
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
          tenantId: dto.tenantId,
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

      // REQ-16-035: el cobro con seguro exige relación asistencial vigente y
      // ningún otro flujo de atención la crea. Nace con el encuentro.
      requests.push(
        ...(await this.careRelationships.recordEncounterCareRelationships(
          tx,
          {
            patientProfileId: dto.patientProfileId,
            tenantId: dto.tenantId,
            practitionerProfileIds: [
              ...(dto.primaryPractitionerId ? [dto.primaryPractitionerId] : []),
              ...(dto.participants ?? []).map((p) => p.practitionerProfileId),
            ],
          },
          actor,
        )),
      );

      this.logger.info(
        { operation: 'clinical.encounter.check-in', encounterId: encounter.id },
        'Encounter opened',
      );
      return this.toResponse(encounter, participantIds, locationIds);
    });
    // Con el encuentro ya confirmado: no se avisa de una solicitud que se deshizo.
    await this.careRelationships.notifyEncounterCareRelationshipRequests(
      requests,
      actor,
    );
    return response;
  }

  /**
   * Las camas sólo se ocupan por ADT (F3): un check-in no puede ubicar al
   * paciente en una cama. Un espacio que no existe o es de otro tenant sigue su
   * camino de siempre (la FK responde); no se confirma que exista.
   *
   * @param tx - Transacción del check-in.
   * @param careSpaceId - Espacio pedido en `location`.
   * @param tenantId - Tenant del check-in.
   * @throws PreconditionFailedException (422 `BED_ASSIGNMENT_REQUIRES_ADT`).
   */
  private async assertNotABed(
    tx: EntityManager,
    careSpaceId: string,
    tenantId: string,
  ): Promise<void> {
    const rows = await tx.execute<{ form: string | null }[]>(
      'select form_concept_id as form from practice.care_spaces where id = ? and tenant_id = ?',
      [careSpaceId, tenantId],
    );
    if (rows[0]?.form === PRAC.LOC_FORM_BED) {
      throw new PreconditionFailedException(
        'Una cama se ocupa con el ingreso o el traslado de internación, no con el check-in',
        { careSpaceId },
        ClinicalErrorReason.BED_ASSIGNMENT_REQUIRES_ADT,
      );
    }
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
  private async resolverAppointmentEncounter(
    tx: EntityManager,
    appointmentId: string,
  ): Promise<EncounterResponseDto | null> {
    // D-3: serializa los check-in concurrentes sobre la misma cita. Si la cita
    // no existe, se sigue igual: la FK plana produce el mismo 422 de hoy.
    await this.encountersRepo.findAppointmentForUpdate(tx, appointmentId);

    const previous = await this.encountersRepo.findByAppointmentId(
      tx,
      appointmentId,
    );
    const previousEncounter = previous[0];
    if (!previousEncounter) {
      return null;
    }

    if (previousEncounter.statusConceptId === CLIN.ENCOUNTER_IN_PROGRESS) {
      const [participants, locations] = await Promise.all([
        this.encountersRepo.findActiveParticipants(
          tx,
          previousEncounter.id,
          CLIN.PARTICIPANT_ACTIVE,
        ),
        this.encountersRepo.findActiveLocations(
          tx,
          previousEncounter.id,
          CLIN.LOCATION_ACTIVE,
        ),
      ]);
      this.logger.info(
        {
          operation: 'clinical.encounter.check-in',
          encounterId: previousEncounter.id,
          reused: true,
        },
        'Encounter reused',
      );
      return this.toResponse(
        previousEncounter,
        participants.map((p) => p.id),
        locations.map((l) => l.id),
      );
    }

    if (previousEncounter.statusConceptId === CLIN.ENCOUNTER_FINISHED) {
      throw new ConflictException(
        'La cita ya cuenta con un encuentro clínico finalizado.',
        {
          appointmentId,
          encounterId: previousEncounter.id,
          status: ENCOUNTER_FINISHED_STATUS_CODE,
          endAt: previousEncounter.endAt ?? null,
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
  private toResponse(
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
    const closed = await this.em.transactional(async (tx) => {
      const encounter = await this.encountersRepo.findById(tx, encounterId);
      if (!encounter) {
        throw new ResourceNotFoundException(
          'Encuentro no encontrado',
          {
            encounterId,
          },
          ClinicalErrorReason.ENCOUNTER_NOT_FOUND,
        );
      }
      // MCH-007: la ruta sólo trae el id; el paciente sale de la fila.
      await this.clinicalRead.assertCanWriteHistory(
        encounter.patientProfileId,
        actor,
      );
      if (encounter.statusConceptId !== CLIN.ENCOUNTER_IN_PROGRESS) {
        throw new PreconditionFailedException(
          'El encuentro no está en curso',
          {
            encounterId,
            status: encounter.statusConceptId,
          },
          ClinicalErrorReason.ENCOUNTER_NOT_IN_PROGRESS,
        );
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
          ClinicalErrorReason.ENCOUNTER_VERSION_MISMATCH,
        );
      }

      return this.finalize(tx, encounter, new Date(), actor);
    });

    // Carril P1: «tu consulta está disponible». Fuera de la transacción por lo
    // mismo que en la receta — el encuentro ya está cerrado y no puede
    // desandarse porque falle un aviso.
    await this.clinicalNotifications.encounterClosed(
      closed.id,
      closed.patientProfileId,
      actor.id,
    );
    return closed;
  }

  /**
   * Cierre del encuentro de internación por egreso (F3), **dentro de la
   * transacción del ADT**.
   *
   * Reutiliza el mismo cierre que {@link close} (estado, fin, participantes y
   * ubicaciones vigentes, sello SHA-256) pero no pide el acceso de escritura a la
   * historia: el egreso lo registran Enfermería y Admisión, y su permiso lo decide
   * la política de F3 antes de llegar acá. El `If-Match` y el alcance ya se
   * comprobaron sobre el encuentro bloqueado.
   *
   * @param tx - Transacción del egreso.
   * @param encounterId - Encuentro de internación en curso.
   * @param input - Fin real del encuentro y disposición.
   * @param actor - Quien registra el egreso.
   * @returns El encuentro cerrado.
   * @throws PreconditionFailedException (422 `ENCOUNTER_NOT_IN_PROGRESS`) si ya no está en curso.
   */
  async completeForDischarge(
    tx: EntityManager,
    encounterId: string,
    input: { endAt: Date; dischargeDispositionConceptId: string },
    actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    const encounter = await this.encountersRepo.findById(tx, encounterId);
    if (!encounter) {
      throw new ResourceNotFoundException(
        'Encuentro no encontrado',
        { encounterId },
        ClinicalErrorReason.ENCOUNTER_NOT_FOUND,
      );
    }
    if (encounter.statusConceptId !== CLIN.ENCOUNTER_IN_PROGRESS) {
      throw new PreconditionFailedException(
        'El encuentro no está en curso',
        { encounterId, status: encounter.statusConceptId },
        ClinicalErrorReason.ENCOUNTER_NOT_IN_PROGRESS,
      );
    }
    encounter.dischargeDispositionConceptId =
      input.dischargeDispositionConceptId;
    return this.finalize(tx, encounter, input.endAt, actor);
  }

  /**
   * Cierra el encuentro: estado, fin, participantes y ubicaciones vigentes y
   * sello. Es el cuerpo común de {@link close} y {@link completeForDischarge}.
   */
  private async finalize(
    tx: EntityManager,
    encounter: Encounters,
    endAt: Date,
    actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    encounter.statusConceptId = CLIN.ENCOUNTER_FINISHED;
    encounter.endAt = endAt;
    touch(encounter, actor.id);

    const participants = await this.encountersRepo.findActiveParticipants(
      tx,
      encounter.id,
      CLIN.PARTICIPANT_ACTIVE,
    );
    for (const p of participants) {
      p.periodEnd = endAt;
      p.statusConceptId = CLIN.PARTICIPANT_COMPLETED;
      touch(p, actor.id);
    }

    const locations = await this.encountersRepo.findActiveLocations(
      tx,
      encounter.id,
      CLIN.LOCATION_ACTIVE,
    );
    for (const l of locations) {
      l.periodEnd = endAt;
      l.locationStatusConceptId = CLIN.LOCATION_COMPLETED;
      touch(l, actor.id);
    }

    encounter.contentHash = await this.seal.computeHash(tx, encounter);
    encounter.sealedAt = endAt;

    await tx.flush();

    this.logger.info(
      { operation: 'clinical.encounter.close', encounterId: encounter.id },
      'Encounter closed',
    );
    return this.toResponse(
      encounter,
      participants.map((p) => p.id),
      locations.map((l) => l.id),
    );
  }
}
