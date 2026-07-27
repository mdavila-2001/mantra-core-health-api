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
import {
  CareTeamsRepository,
  CareTeamMembersRepository,
} from '../repositories';
import {
  CreateCareTeamDto,
  CareTeamResponseDto,
  StatusResultDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';

/**
 * Coordinación de cuidado: alta de equipos con sus miembros (UC-18-01) y
 * transferencia del liderazgo entre miembros (UC-18-02).
 *
 * El servicio posee la unidad de trabajo: `em.transactional` y `flush` del padre
 * (care_team) antes de crear los hijos (care_team_members), porque las FK son
 * columnas uuid planas y MikroORM no ordena inserts entre entidades no
 * relacionadas.
 */
@Injectable()
export class CareTeamsService {
  constructor(
    private readonly em: EntityManager,
    private readonly teamsRepo: CareTeamsRepository,
    private readonly membersRepo: CareTeamMembersRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CareTeamsService.name);
  }

  /** UC-18-01: crea el equipo y sus miembros iniciales (a lo sumo uno responsable). */
  async create(
    dto: CreateCareTeamDto,
    actor: AuthenticatedUser,
  ): Promise<CareTeamResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.care_team.create', actorId: actor.id },
      'Creating care team',
    );

    const responsibleCount = dto.members.filter((m) => m.isResponsible).length;
    if (responsibleCount > 1) {
      throw new ConflictException(
        'A lo sumo un miembro puede ser responsable',
        {
          responsibleCount,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const team = this.teamsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId,
        episodeId: dto.episodeId,
        name: dto.name,
        categoryConceptId:
          dto.categoryConceptId ?? CEXT.CARE_TEAM_CATEGORY_LONGITUDINAL,
        statusConceptId: CEXT.CARE_TEAM_ACTIVE,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : new Date(),
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el padre antes de los hijos.
      await tx.flush();

      const members = dto.members.map((m) =>
        this.membersRepo.create(tx, {
          careTeamId: team.id,
          practitionerProfileId: m.practitionerProfileId,
          relatedPersonId: m.relatedPersonId,
          memberRoleConceptId: m.memberRoleConceptId,
          isResponsible: m.isResponsible ?? false,
          statusConceptId: CEXT.MEMBER_ACTIVE,
          periodStart: new Date(),
          actorUserId: actor.id,
        }),
      );
      await tx.flush();

      this.logger.info(
        {
          operation: 'clinical_ext.care_team.create',
          careTeamId: team.id,
          members: members.length,
        },
        'Care team created',
      );
      return {
        id: team.id,
        patientProfileId: team.patientProfileId,
        statusConceptId: team.statusConceptId,
        members: members.map((m) => ({
          id: m.id,
          memberRoleConceptId: m.memberRoleConceptId,
          isResponsible: m.isResponsible ?? false,
        })),
        createdAt: team.createdAt,
      };
    });
  }

  /** UC-18-02: transfiere el liderazgo del equipo al miembro destino. */
  async setResponsible(
    careTeamId: string,
    memberId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.care_team.set_responsible',
        careTeamId,
        memberId,
      },
      'Transferring care team leadership',
    );

    return this.em.transactional(async (tx) => {
      const team = await this.teamsRepo.findById(tx, careTeamId);
      if (!team)
        throw new ResourceNotFoundException('Equipo de cuidado no encontrado', {
          careTeamId,
        });
      if (team.statusConceptId !== CEXT.CARE_TEAM_ACTIVE) {
        throw new PreconditionFailedException('El equipo no está activo', {
          careTeamId,
        });
      }

      const target = await this.membersRepo.findById(tx, memberId);
      if (!target || target.careTeamId !== careTeamId) {
        throw new ResourceNotFoundException(
          'Miembro no encontrado en el equipo',
          {
            careTeamId,
            memberId,
          },
        );
      }
      if (target.statusConceptId !== CEXT.MEMBER_ACTIVE) {
        throw new PreconditionFailedException(
          'El miembro destino no está activo',
          { memberId },
        );
      }

      const current = await this.membersRepo.findResponsible(tx, careTeamId);
      if (current && current.id !== target.id) {
        current.isResponsible = false;
        touch(current, actor.id);
      }
      target.isResponsible = true;
      touch(target, actor.id);
      touch(team, actor.id);

      return { ok: true };
    });
  }
}
