import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AnalyticsSubjects } from '../entities';

/** Datos de provisión de un sujeto de analítica pseudónimo (UC-28-06). */
export interface CreateAnalyticsSubjectData {
  pseudonymousSubjectKey: string;
  keyVersion?: number;
  userId?: string;
  patientProfileId?: string;
  createdFromConsentId?: string;
}

/** Acceso a `telemetry.analytics_subjects`. */
@Injectable()
export class AnalyticsSubjectsRepository {
  findById(em: EntityManager, id: string): Promise<AnalyticsSubjects | null> {
    return em.findOne(AnalyticsSubjects, { id });
  }

  findByKey(em: EntityManager, pseudonymousSubjectKey: string): Promise<AnalyticsSubjects | null> {
    return em.findOne(AnalyticsSubjects, { pseudonymousSubjectKey });
  }

  findActiveByConsent(em: EntityManager, createdFromConsentId: string): Promise<AnalyticsSubjects[]> {
    return em.find(AnalyticsSubjects, { createdFromConsentId, deactivatedAt: null });
  }

  create(em: EntityManager, data: CreateAnalyticsSubjectData): AnalyticsSubjects {
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
