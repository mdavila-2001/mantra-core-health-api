import { ForbiddenException, Injectable } from '@nestjs/common';
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
import { CLIN } from '../../clinical/clinical.concepts';

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
        );
      }

      const venc = this.encountersRepo.create(tx, {
        encounterId: dto.encounterId,
        platformConceptId: dto.platformConceptId,
        meetingUrl: dto.meetingUrl,
        meetingId: dto.meetingId,
        statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: venc.id,
        encounterId: venc.encounterId,
        statusConceptId: venc.statusConceptId,
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
      const venc = await this.encountersRepo.findById(tx, id);
      if (!venc)
        throw new ResourceNotFoundException('Sesión virtual no encontrada', {
          id,
        });
      await this.requireEncounterParticipant(tx, venc.encounterId, actor, true);
      if (venc.statusConceptId !== CEXT.VIRTUAL_ENCOUNTER_SCHEDULED) {
        throw new PreconditionFailedException('La sesión no está agendada', {
          id,
        });
      }

      venc.statusConceptId = CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS;
      venc.joinedAt = new Date();
      touch(venc, actor.id);

      return {
        id: venc.id,
        encounterId: venc.encounterId,
        statusConceptId: venc.statusConceptId,
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
    return this.em.transactional(async (tx) => {
      const venc = await this.encountersRepo.findById(tx, id);
      if (!venc)
        throw new ResourceNotFoundException('Sesión virtual no encontrada', {
          id,
        });
      await this.requireEncounterParticipant(
        tx,
        venc.encounterId,
        actor,
        false,
      );
      if (venc.statusConceptId !== CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS) {
        throw new PreconditionFailedException('La sesión no está en progreso', {
          id,
        });
      }

      venc.statusConceptId = CEXT.VIRTUAL_ENCOUNTER_COMPLETED;
      venc.endedAt = new Date();
      venc.recordingFileId = dto.recordingFileId;
      touch(venc, actor.id);

      return {
        id: venc.id,
        encounterId: venc.encounterId,
        statusConceptId: venc.statusConceptId,
      };
    });
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
