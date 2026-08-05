import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AnalyticsSubjects } from '../entities';

/** Datos de provisión de un sujeto de analítica pseudónimo (UC-28-06). */
export interface CreateAnalyticsSubjectData {
  /**
   * Valor de pseudonymous subject key mantenido por la instancia.
   */
  pseudonymousSubjectKey: string;
  /**
   * Valor de key version mantenido por la instancia.
   */
  keyVersion?: number;
  /**
   * Identificador asociado a user.
   */
  userId?: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a created from consent.
   */
  createdFromConsentId?: string;
}

/** Acceso a `telemetry.analytics_subjects`. */
@Injectable()
export class AnalyticsSubjectsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<AnalyticsSubjects | null>`.
   */
  findById(em: EntityManager, id: string): Promise<AnalyticsSubjects | null> {
    return em.findOne(AnalyticsSubjects, { id });
  }

  /**
   * Obtiene find by key.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pseudonymousSubjectKey - Valor de pseudonymous subject key requerido por la operación.
   * @returns Resultado de find by key conforme al contrato `Promise<AnalyticsSubjects | null>`.
   */
  findByKey(
    em: EntityManager,
    pseudonymousSubjectKey: string,
  ): Promise<AnalyticsSubjects | null> {
    return em.findOne(AnalyticsSubjects, { pseudonymousSubjectKey });
  }

  /**
   * Obtiene find active by consent.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param createdFromConsentId - Identificador de created from consent.
   * @returns Resultado de find active by consent conforme al contrato `Promise<AnalyticsSubjects[]>`.
   */
  findActiveByConsent(
    em: EntityManager,
    createdFromConsentId: string,
  ): Promise<AnalyticsSubjects[]> {
    return em.find(AnalyticsSubjects, {
      createdFromConsentId,
      deactivatedAt: null,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `AnalyticsSubjects`.
   */
  create(
    em: EntityManager,
    data: CreateAnalyticsSubjectData,
  ): AnalyticsSubjects {
    return em.create(
      AnalyticsSubjects,
      {
        pseudonymousSubjectKey: data.pseudonymousSubjectKey,
        keyVersion: data.keyVersion,
        userId: data.userId,
        patientProfileId: data.patientProfileId,
        createdFromConsentId: data.createdFromConsentId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
