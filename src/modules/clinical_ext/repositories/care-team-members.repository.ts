import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareTeamMembers } from '../entities';
import { createdBy } from '../../../common';

/** Datos para incorporar un miembro a un equipo de cuidado. */
export interface CreateCareTeamMemberData {
  /**
   * Identificador asociado a care team.
   */
  careTeamId: string;
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId?: string;
  /**
   * Identificador asociado a related person.
   */
  relatedPersonId?: string;
  /**
   * Identificador asociado a member role concept.
   */
  memberRoleConceptId: string;
  /**
   * Valor de is responsible mantenido por la instancia.
   */
  isResponsible?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de period start mantenido por la instancia.
   */
  periodStart?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.care_team_members`. */
@Injectable()
export class CareTeamMembersRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CareTeamMembers | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `CareTeamMembers`.
   */
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
