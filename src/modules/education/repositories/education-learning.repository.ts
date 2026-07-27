import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Enrollments,
  LessonProgress,
  AssessmentAttempts,
  Certificates,
  CmeCreditRecords,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateEnrollmentData {
  courseId: string;
  cohortId?: string;
  learnerTypeConceptId: string;
  learnerRefId: string;
  enrollmentSourceConceptId: string;
  paymentIntentId?: string;
  statusConceptId: string;
  expiresAt?: Date;
  actorUserId?: string;
}

export interface CreateCertificateData {
  enrollmentId: string;
  courseId: string;
  certificateNumber: string;
  learnerRefId?: string;
  cmeCreditsAwarded?: string;
  expiresAt?: Date;
  verificationCode: string;
  fileId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso al recorrido del aprendiz en `education.*`: inscripciones, progreso de
 * lección, intentos de evaluación, certificados y créditos CME.
 */
@Injectable()
export class EducationLearningRepository {
  // --- Inscripciones (UC-47-05, UC-47-10) ---

  createEnrollment(em: EntityManager, data: CreateEnrollmentData): Enrollments {
    return em.create(
      Enrollments,
      {
        courseId: data.courseId,
        cohortId: data.cohortId,
        learnerTypeConceptId: data.learnerTypeConceptId,
        learnerRefId: data.learnerRefId,
        enrollmentSourceConceptId: data.enrollmentSourceConceptId,
        paymentIntentId: data.paymentIntentId,
        statusConceptId: data.statusConceptId,
        progressPercent: '0',
        enrolledAt: new Date(),
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findEnrollmentById(
    em: EntityManager,
    id: string,
  ): Promise<Enrollments | null> {
    return em.findOne(Enrollments, { id });
  }

  findEnrollmentForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Enrollments | null> {
    return em.findOne(
      Enrollments,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Inscripción vigente del aprendiz en el curso. Refleja la UNIQUE parcial
   * `WHERE status IN (active, completed)`: quien ya lo hizo no se reinscribe.
   */
  findLiveEnrollment(
    em: EntityManager,
    courseId: string,
    learnerTypeConceptId: string,
    learnerRefId: string,
    liveStatusConceptIds: string[],
  ): Promise<Enrollments | null> {
    return em.findOne(Enrollments, {
      courseId,
      learnerTypeConceptId,
      learnerRefId,
      statusConceptId: { $in: liveStatusConceptIds },
    });
  }

  // --- Progreso de lección (UC-47-06) ---

  /** Log append-only: el progreso se anota, nunca se corrige. */
  createLessonProgress(
    em: EntityManager,
    data: {
      enrollmentId: string;
      lessonId: string;
      statusConceptId: string;
      secondsWatched?: number;
      completionPercent?: string;
      completedAt?: Date;
      occurredAt?: Date;
      recordedByUserId?: string;
    },
  ): LessonProgress {
    return em.create(
      LessonProgress,
      {
        enrollmentId: data.enrollmentId,
        lessonId: data.lessonId,
        statusConceptId: data.statusConceptId,
        secondsWatched: data.secondsWatched,
        completionPercent: data.completionPercent,
        completedAt: data.completedAt,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Todo el progreso de la inscripción, del más reciente al más antiguo: el
   * estado vigente de cada lección es su anotación más nueva.
   */
  findProgressByEnrollment(
    em: EntityManager,
    enrollmentId: string,
  ): Promise<LessonProgress[]> {
    return em.find(
      LessonProgress,
      { enrollmentId },
      { orderBy: { recordedAt: 'DESC' } },
    );
  }

  // --- Intentos de evaluación (UC-47-08, UC-47-09) ---

  createAttempt(
    em: EntityManager,
    data: {
      assessmentId: string;
      enrollmentId: string;
      attemptNumber: number;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): AssessmentAttempts {
    return em.create(
      AssessmentAttempts,
      {
        assessmentId: data.assessmentId,
        enrollmentId: data.enrollmentId,
        attemptNumber: data.attemptNumber,
        startedAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findAttemptForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AssessmentAttempts | null> {
    return em.findOne(
      AssessmentAttempts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Intentos previos del aprendiz en la evaluación, bloqueados: de aquí sale el
   * número del siguiente y la comprobación del máximo permitido.
   */
  findAttemptsForUpdate(
    em: EntityManager,
    assessmentId: string,
    enrollmentId: string,
  ): Promise<AssessmentAttempts[]> {
    return em.find(
      AssessmentAttempts,
      { assessmentId, enrollmentId },
      {
        orderBy: { attemptNumber: 'DESC' },
        lockMode: LockMode.PESSIMISTIC_WRITE,
      },
    );
  }

  /** Intentos aprobados de la inscripción: completar el curso los exige. */
  findPassedAttempts(
    em: EntityManager,
    enrollmentId: string,
  ): Promise<AssessmentAttempts[]> {
    return em.find(AssessmentAttempts, { enrollmentId, passed: true });
  }

  // --- Certificados (UC-47-11, UC-47-14) ---

  createCertificate(
    em: EntityManager,
    data: CreateCertificateData,
  ): Certificates {
    return em.create(
      Certificates,
      {
        enrollmentId: data.enrollmentId,
        courseId: data.courseId,
        certificateNumber: data.certificateNumber,
        learnerRefId: data.learnerRefId,
        cmeCreditsAwarded: data.cmeCreditsAwarded,
        issuedAt: new Date(),
        expiresAt: data.expiresAt,
        verificationCode: data.verificationCode,
        fileId: data.fileId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findCertificateById(
    em: EntityManager,
    id: string,
  ): Promise<Certificates | null> {
    return em.findOne(Certificates, { id });
  }

  findCertificateForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Certificates | null> {
    return em.findOne(
      Certificates,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Certificado ya emitido para la inscripción: emitir es idempotente. */
  findCertificateByEnrollment(
    em: EntityManager,
    enrollmentId: string,
  ): Promise<Certificates | null> {
    return em.findOne(Certificates, { enrollmentId });
  }

  findCertificateByNumber(
    em: EntityManager,
    certificateNumber: string,
  ): Promise<Certificates | null> {
    return em.findOne(Certificates, { certificateNumber });
  }

  findCertificateByVerificationCode(
    em: EntityManager,
    verificationCode: string,
  ): Promise<Certificates | null> {
    return em.findOne(Certificates, { verificationCode });
  }

  // --- Créditos CME (UC-47-12, UC-47-14) ---

  createCmeRecord(
    em: EntityManager,
    data: {
      practitionerProfileId: string;
      certificateId: string;
      creditHours: string;
      accreditingBodyConceptId: string;
      specialtyConceptId?: string;
      jurisdictionConceptId?: string;
      periodYear: number;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): CmeCreditRecords {
    return em.create(
      CmeCreditRecords,
      {
        practitionerProfileId: data.practitionerProfileId,
        certificateId: data.certificateId,
        creditHours: data.creditHours,
        accreditingBodyConceptId: data.accreditingBodyConceptId,
        specialtyConceptId: data.specialtyConceptId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        awardedOn: new Date(),
        periodYear: data.periodYear,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crédito ya acreditado al mismo profesional por el mismo certificado. */
  findCmeRecord(
    em: EntityManager,
    certificateId: string,
    practitionerProfileId: string,
  ): Promise<CmeCreditRecords | null> {
    return em.findOne(CmeCreditRecords, {
      certificateId,
      practitionerProfileId,
    });
  }

  /** Créditos del certificado, bloqueados: revocarlo los revierte todos. */
  findCmeRecordsForUpdate(
    em: EntityManager,
    certificateId: string,
  ): Promise<CmeCreditRecords[]> {
    return em.find(
      CmeCreditRecords,
      { certificateId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
