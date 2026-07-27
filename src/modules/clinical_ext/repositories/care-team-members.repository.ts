import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareTeamMembers } from '../entities';
import { createdBy } from '../../../common';

/** Datos para incorporar un miembro a un equipo de cuidado. */
export interface CreateCareTeamMemberData {
  careTeamId: string;
  practitionerProfileId?: string;
  relatedPersonId?: string;
  memberRoleConceptId: string;
  isResponsible?: boolean;
  statusConceptId: string;
  periodStart?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.care_team_members`. */
@Injectable()
export class CareTeamMembersRepository {
  findById(em: EntityManager, id: string): Promise<CareTeamMembers | null> {
    return em.findOne(CareTeamMembers, { id });
  }

  /** Miembros de un equipo (para transferir liderazgo). */
  findByTeam(
    em: EntityManager,
    careTeamId: string,
  ): Promise<CareTeamMembers[]> {
    return em.find(CareTeamMembers, { careTeamId });
  }

  /** Miembro responsable vigente del equipo, si existe. */
  findResponsible(
    em: EntityManager,
    careTeamId: string,
  ): Promise<CareTeamMembers | null> {
    return em.findOne(CareTeamMembers, { careTeamId, isResponsible: true });
  }

  create(em: EntityManager, data: CreateCareTeamMemberData): CareTeamMembers {
    return em.create(
      CareTeamMembers,
      {
        careTeamId: data.careTeamId,
        practitionerProfileId: data.practitionerProfileId,
        relatedPersonId: data.relatedPersonId,
        memberRoleConceptId: data.memberRoleConceptId,
        isResponsible: data.isResponsible ?? false,
        statusConceptId: data.statusConceptId,
        periodStart: data.periodStart,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
