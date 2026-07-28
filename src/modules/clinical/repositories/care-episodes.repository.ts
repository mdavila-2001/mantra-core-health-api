import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareEpisodes } from '../entities';
import { createdBy } from '../../../common';
import { CLIN } from '../clinical.concepts';

/** Datos para abrir un episodio de cuidado (UC-08-01). */
export interface CreateCareEpisodeData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a responsible practitioner.
   */
  responsiblePractitionerId?: string;
  /**
   * Identificador asociado a type concept.
   */
  typeConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.care_episodes` (repositorio stateless). */
@Injectable()
export class CareEpisodesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CareEpisodes | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `CareEpisodes`.
   */
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
