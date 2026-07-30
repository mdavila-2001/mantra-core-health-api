import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareGaps } from '../entities';
import { createdBy } from '../../../common';

/** Datos para abrir una brecha de cuidado. */
export interface CreateCareGapData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a gap type concept.
   */
  gapTypeConceptId: string;
  /**
   * Identificador asociado a measure concept.
   */
  measureConceptId?: string;
  /**
   * Valor de due date mantenido por la instancia.
   */
  dueDate?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.care_gaps`. */
@Injectable()
export class CareGapsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CareGaps | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `CareGaps`.
   */
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
