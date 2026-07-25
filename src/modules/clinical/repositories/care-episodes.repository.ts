import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareEpisodes } from '../entities';
import { createdBy } from '../../../common';
import { CLIN } from '../clinical.concepts';

/** Datos para abrir un episodio de cuidado (UC-08-01). */
export interface CreateCareEpisodeData {
  patientProfileId: string;
  tenantId: string;
  responsiblePractitionerId?: string;
  typeConceptId?: string;
  statusConceptId: string;
  startAt?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.care_episodes` (repositorio stateless). */
@Injectable()
export class CareEpisodesRepository {
  findById(em: EntityManager, id: string): Promise<CareEpisodes | null> {
    return em.findOne(CareEpisodes, { id });
  }

  /** Episodio activo del paciente en el tenant (para evitar duplicados). */
  findActiveByPatient(
    em: EntityManager,
    tenantId: string,
    patientProfileId: string,
  ): Promise<CareEpisodes | null> {
    return em.findOne(CareEpisodes, {
      tenantId,
      patientProfileId,
      statusConceptId: CLIN.EPISODE_ACTIVE,
    });
  }

  create(em: EntityManager, data: CreateCareEpisodeData): CareEpisodes {
    return em.create(
      CareEpisodes,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        responsiblePractitionerId: data.responsiblePractitionerId,
        typeConceptId: data.typeConceptId,
        statusConceptId: data.statusConceptId,
        startAt: data.startAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
