import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareGaps } from '../entities';
import { createdBy } from '../../../common';

/** Datos para abrir una brecha de cuidado. */
export interface CreateCareGapData {
  patientProfileId: string;
  gapTypeConceptId: string;
  measureConceptId?: string;
  dueDate?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.care_gaps`. */
@Injectable()
export class CareGapsRepository {
  findById(em: EntityManager, id: string): Promise<CareGaps | null> {
    return em.findOne(CareGaps, { id });
  }

  /** Brecha abierta para la clave lógica (evita duplicados en el upsert). */
  findOpen(
    em: EntityManager,
    patientProfileId: string,
    gapTypeConceptId: string,
    measureConceptId: string | undefined,
    openStatusConceptId: string,
  ): Promise<CareGaps | null> {
    return em.findOne(CareGaps, {
      patientProfileId,
      gapTypeConceptId,
      measureConceptId: measureConceptId ?? null,
      statusConceptId: openStatusConceptId,
    });
  }

  create(em: EntityManager, data: CreateCareGapData): CareGaps {
    return em.create(
      CareGaps,
      {
        patientProfileId: data.patientProfileId,
        gapTypeConceptId: data.gapTypeConceptId,
        measureConceptId: data.measureConceptId,
        dueDate: data.dueDate,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
