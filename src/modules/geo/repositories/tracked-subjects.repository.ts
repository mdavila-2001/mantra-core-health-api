import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackedSubjects } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un sujeto rastreado. */
export interface CreateTrackedSubjectData {
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a subject.
   */
  subjectId: string;
  /**
   * Identificador asociado a device.
   */
  deviceId?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `geo.tracked_subjects`.
 *
 * Métodos stateless que reciben el `EntityManager` activo: el servicio controla
 * la transacción. Sin reglas de negocio; solo consultas y materialización.
 */
@Injectable()
export class TrackedSubjectsRepository {
  /** Busca un sujeto rastreado por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<TrackedSubjects | null> {
    return em.findOne(TrackedSubjects, { id });
  }

  /**
   * Busca un sujeto rastreado activo por su discriminador polimórfico
   * (tenant + tipo + subject_id). Sustenta la unicidad lógica del alta.
   */
  findActiveBySubject(
    em: EntityManager,
    subjectTypeConceptId: string,
    subjectId: string,
    stateConceptId: string,
    tenantId?: string,
  ): Promise<TrackedSubjects | null> {
    return em.findOne(TrackedSubjects, {
      subjectTypeConceptId,
      subjectId,
      stateConceptId,
      ...(tenantId ? { tenantId } : {}),
    });
  }

  /** Crea la entidad de sujeto rastreado en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateTrackedSubjectData): TrackedSubjects {
    return em.create(
      TrackedSubjects,
      {
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectId: data.subjectId,
        deviceId: data.deviceId,
        tenantId: data.tenantId,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
