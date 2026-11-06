import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { VirtualEncountersRepository } from '../repositories';
import {
  CreateVirtualEncounterDto,
  EndVirtualEncounterDto,
  VirtualEncounterResponseDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';
import { EncountersRepository } from '../../clinical/repositories';
import type { Encounters } from '../../clinical/entities';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import { lockLogicalKey } from './clinical-ext-access';
import { CLIN } from '../../clinical/clinical.concepts';
import {
  ENCOUNTER_CLOSED_PORT,
  type EncounterClosedPort,
} from '../../clinical/ports/encounter-closed.port';

/**
 * Telesalud (UC-18-12): alta de la sesión virtual (scheduled), unión (in-progress)
 * y cierre (completed). La sesión es 1:1 con el encuentro clínico, con transiciones
 * de estado validadas: scheduled -> in-progress -> completed.
 */
@Injectable()
export class VirtualEncountersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encountersRepo - Valor de encounters repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly encountersRepo: VirtualEncountersRepository,
    private readonly clinicalEncountersRepo: EncountersRepository,
    private readonly logger: PinoLogger,
    // El fin de la teleconsulta completa el turno de la agenda (y emite la
    // encuesta), por el mismo puerto que el cierre del encuentro. No lanza.
    @Inject(ENCOUNTER_CLOSED_PORT)
    private readonly encounterClosed: EncounterClosedPort,
  ) {
    this.logger.setContext(VirtualEncountersService.name);
  }

  /** UC-18-12: abre la sesión virtual (estado agendado). */
  async create(
    dto: CreateVirtualEncounterDto,
    actor: AuthenticatedUser,
  ): Promise<VirtualEncounterResponseDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.virtual_encounter.create',
        encounterId: dto.encounterId,
      },
      'Creating virtual encounter',
    );
    return this.em.transactional(async (tx) => {
      await this.requireEncounterParticipant(tx, dto.encounterId, actor, false);

      // El DDL no impide dos sesiones del mismo encuentro: se serializa a
      // quien la crea para que el segundo vea la sesión del primero.
      await lockLogicalKey(
        tx,
        `clinical_ext.virtual_encounter:${dto.encounterId}`,
      );
      const existing = await this.encountersRepo.findByEncounter(
        tx,
        dto.encounterId,
      );
      if (existing) {
        throw new ConflictException(
          'El encuentro ya tiene una sesión virtual',
          {
            encounterId: dto.encounterId,
          },
          ClinicalExtErrorReason.VIRTUAL_ENCOUNTER_ALREADY_EXISTS,
        );
      }

      const due = this.encountersRepo.create(tx, {
        encounterId: dto.encounterId,
        platformConceptId: dto.platformConceptId,
        meetingUrl: dto.meetingUrl,
        meetingId: dto.meetingId,
        statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: due.id,
        encounterId: due.encounterId,
        statusConceptId: due.statusConceptId,
      };
    });
  }

  /** UC-18-12: el participante se une (scheduled -> in-progress). */
  async join(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<VirtualEncounterResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.virtual_encounter.join', id },
      'Joining virtual encounter',
    );
    return this.em.transactional(async (tx) => {
      const due = await this.encountersRepo.findById(tx, id);
      if (!due)
        throw new ResourceNotFoundException('Sesión virtual no encontrada', {
          id,
        });
      await this.requireEncounterParticipant(tx, due.encounterId, actor, true);
      if (due.statusConceptId !== CEXT.VIRTUAL_ENCOUNTER_SCHEDULED) {
        throw new PreconditionFailedException('La sesión no está agendada', {
          id,
        });
      }

      due.statusConceptId = CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS;
      due.joinedAt = new Date();
      touch(due, actor.id);

      return {
        id: due.id,
        encounterId: due.encounterId,
        statusConceptId: due.statusConceptId,
      };
    });
  }

  /** UC-18-12: finaliza la sesión (in-progress -> completed). */
  async end(
    id: string,
    dto: EndVirtualEncounterDto,
    actor: AuthenticatedUser,
  ): Promise<VirtualEncounterResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.virtual_encounter.end', id },
      'Ending virtual encounter',
    );
    // La cita clínica del encuentro, sólo si el encuentro ya está cerrado.
    let appointmentId: string | undefined;
    const ended = await this.em.transactional(async (tx) => {
      const due = await this.encountersRepo.findById(tx, id);
      if (!due)
        throw new ResourceNotFoundException('Sesión virtual no encontrada', {
          id,
        });
      const encounter = await this.requireEncounterParticipant(
        tx,
        due.encounterId,
        actor,
        false,
      );
      if (due.statusConceptId !== CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS) {
        throw new PreconditionFailedException('La sesión no está en progreso', {
          id,
        });
      }

      due.statusConceptId = CEXT.VIRTUAL_ENCOUNTER_COMPLETED;
      due.endedAt = new Date();
      due.recordingFileId = dto.recordingFileId;
      touch(due, actor.id);
      // El turno se completa cuando se CIERRA el encuentro clínico, no al
      // cortar la videollamada: completarlo antes le quitaría al profesional la
      // base para seguir escribiendo la consulta y mandaría la encuesta antes
      // del cierre. Si el encuentro ya está cerrado, el fin de la sesión sólo
      // repite el aviso (idempotente: el turno ya está completado).
      if (encounter.statusConceptId === CLIN.ENCOUNTER_FINISHED) {
        appointmentId = encounter.appointmentId;
      }

      return {
        id: due.id,
        encounterId: due.encounterId,
        statusConceptId: due.statusConceptId,
      };
    });

    // Terminada la transacción del fin de la sesión. Un fallo de la agenda no
    // lo deshace (el puerto no lanza y trabaja en un savepoint).
    await this.encounterClosed.onEncounterClosed(
      { encounterId: ended.encounterId, appointmentId },
      actor,
    );
    return ended;
  }

  /**
   * Autoriza una transición contra el encuentro clínico que es su fuente de
   * verdad. El rol abre la ruta; la relación concreta decide sobre esta sesión.
   */
  private async requireEncounterParticipant(
    tx: EntityManager,
    encounterId: string,
    actor: AuthenticatedUser,
    allowPatient: boolean,
  ): Promise<Encounters> {
    const encounter = await this.clinicalEncountersRepo.findById(
      tx,
      encounterId,
    );
    if (!encounter) {
      throw new ResourceNotFoundException('Encuentro clínico no encontrado', {
        encounterId,
      });
    }

    const activeTenantId = getCurrentTenantId();
    const belongsToTenant = activeTenantId
      ? activeTenantId === encounter.tenantId
      : actor.tenantIds?.includes(encounter.tenantId) === true;
    if (!belongsToTenant) {
      throw new ForbiddenException(
        'La sesión virtual pertenece a otra organización.',
      );
    }

    if (
      allowPatient &&
      actor.patientProfileId !== undefined &&
      actor.patientProfileId === encounter.patientProfileId
    ) {
      return encounter;
    }

    const practitionerProfileId = actor.practitionerProfileId;
    if (!practitionerProfileId) {
      throw new ForbiddenException('No participa de este encuentro clínico.');
    }
    if (encounter.primaryPractitionerId === practitionerProfileId) {
      return encounter;
    }

    const participants =
      await this.clinicalEncountersRepo.findActiveParticipants(
        tx,
        encounter.id,
        CLIN.PARTICIPANT_ACTIVE,
      );
    if (
      participants.some(
        (participant) =>
          participant.practitionerProfileId === practitionerProfileId,
      )
    ) {
      return encounter;
    }

    throw new ForbiddenException('No participa de este encuentro clínico.');
  }
}
