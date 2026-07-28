import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareTeams } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un equipo de cuidado. */
export interface CreateCareTeamData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a episode.
   */
  episodeId?: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name?: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
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

/**
 * Acceso a datos de `clinical_ext.care_teams`. Stateless: recibe el
 * `EntityManager` activo para que el servicio controle la transacción.
 */
@Injectable()
export class CareTeamsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CareTeams | null>`.
   */
  findById(em: EntityManager, id: string): Promise<CareTeams | null> {
    return em.findOne(CareTeams, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `CareTeams`.
   */
  create(em: EntityManager, data: CreateCareTeamData): CareTeams {
    return em.create(
      CareTeams,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        episodeId: data.episodeId,
        name: data.name,
        categoryConceptId: data.categoryConceptId,
        statusConceptId: data.statusConceptId,
        periodStart: data.periodStart,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
