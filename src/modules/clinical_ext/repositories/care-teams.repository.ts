import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareTeams } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un equipo de cuidado. */
export interface CreateCareTeamData {
  patientProfileId: string;
  tenantId: string;
  episodeId?: string;
  name?: string;
  categoryConceptId?: string;
  statusConceptId: string;
  periodStart?: Date;
  actorUserId?: string;
}

/**
 * Acceso a datos de `clinical_ext.care_teams`. Stateless: recibe el
 * `EntityManager` activo para que el servicio controle la transacción.
 */
@Injectable()
export class CareTeamsRepository {
  findById(em: EntityManager, id: string): Promise<CareTeams | null> {
    return em.findOne(CareTeams, { id });
  }

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
