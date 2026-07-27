import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
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

/**
 * Telesalud (UC-18-12): alta de la sesión virtual (scheduled), unión (in-progress)
 * y cierre (completed). La sesión es 1:1 con el encuentro clínico, con transiciones
 * de estado validadas: scheduled -> in-progress -> completed.
 */
@Injectable()
export class VirtualEncountersService {
  constructor(
    private readonly em: EntityManager,
    private readonly encountersRepo: VirtualEncountersRepository,
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
}
