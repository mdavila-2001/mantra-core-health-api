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

/**
 * Describe el contrato estructural de create enrollment data.
 */
export interface CreateEnrollmentData {
  /**
   * Identificador asociado a course.
   */
  courseId: string;
  /**
   * Identificador asociado a cohort.
   */
  cohortId?: string;
  /**
   * Identificador asociado a learner type concept.
   */
  learnerTypeConceptId: string;
  /**
   * Identificador asociado a learner ref.
   */
  learnerRefId: string;
  /**
   * Identificador asociado a enrollment source concept.
   */
  enrollmentSourceConceptId: string;
  /**
   * Identificador asociado a payment intent.
   */
  paymentIntentId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create certificate data.
 */
export interface CreateCertificateData {
  /**
   * Identificador asociado a enrollment.
   */
  enrollmentId: string;
  /**
   * Identificador asociado a course.
   */
  courseId: string;
  /**
   * Valor de certificate number mantenido por la instancia.
   */
  certificateNumber: string;
  /**
   * Identificador asociado a learner ref.
   */
  learnerRefId: string;
  /**
   * Valor de cme credits awarded mantenido por la instancia.
   */
  cmeCreditsAwarded?: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Valor de verification code mantenido por la instancia.
   */
  verificationCode: string;
  /**
   * Identificador asociado a file.
   */
  fileId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso al recorrido del aprendiz en `education.*`: inscripciones, progreso de
 * lección, intentos de evaluación, certificados y créditos CME.
 */
@Injectable()
export class EducationLearningRepository {
  // --- Inscripciones (UC-47-05, UC-47-10) ---

  /**
   * Crea create enrollment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create enrollment conforme al contrato `Enrollments`.
   */
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

  /**
   * Obtiene find enrollment by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find enrollment by id conforme al contrato `Promise<Enrollments | null>`.
   */
  findEnrollmentById(
    em: EntityManager,
    id: string,
  ): Promise<Enrollments | null> {
    return em.findOne(Enrollments, { id });
  }

  /**
   * Obtiene find enrollment for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find enrollment for update conforme al contrato `Promise<Enrollments | null>`.
   */
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
      /**
       * Identificador asociado a enrollment.
       */
      enrollmentId: string;
      /**
       * Identificador asociado a lesson.
       */
      lessonId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de seconds watched mantenido por la instancia.
       */
      secondsWatched?: number;
      /**
       * Valor de completion percent mantenido por la instancia.
       */
      completionPercent?: string;
      /**
       * Valor de completed at mantenido por la instancia.
       */
      completedAt?: Date;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt?: Date;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Crea create attempt.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create attempt conforme al contrato `AssessmentAttempts`.
   */
  createAttempt(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a assessment.
       */
      assessmentId: string;
      /**
       * Identificador asociado a enrollment.
       */
      enrollmentId: string;
      /**
       * Valor de attempt number mantenido por la instancia.
       */
      attemptNumber: number;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find attempt for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find attempt for update conforme al contrato `Promise<AssessmentAttempts | null>`.
   */
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

  /**
   * Crea create certificate.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create certificate conforme al contrato `Certificates`.
   */
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

  /**
   * Obtiene find certificate by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find certificate by id conforme al contrato `Promise<Certificates | null>`.
   */
  findCertificateById(
    em: EntityManager,
    id: string,
  ): Promise<Certificates | null> {
    return em.findOne(Certificates, { id });
  }

  /**
   * Obtiene find certificate for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find certificate for update conforme al contrato `Promise<Certificates | null>`.
   */
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

  /**
   * Obtiene find certificate by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param certificateNumber - Valor de certificate number requerido por la operación.
   * @returns Resultado de find certificate by number conforme al contrato `Promise<Certificates | null>`.
   */
  findCertificateByNumber(
    em: EntityManager,
    certificateNumber: string,
  ): Promise<Certificates | null> {
    return em.findOne(Certificates, { certificateNumber });
  }

  /**
   * Obtiene find certificate by verification code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param verificationCode - Valor de verification code requerido por la operación.
   * @returns Resultado de find certificate by verification code conforme al contrato `Promise<Certificates | null>`.
   */
  findCertificateByVerificationCode(
    em: EntityManager,
    verificationCode: string,
  ): Promise<Certificates | null> {
    return em.findOne(Certificates, { verificationCode });
  }

  // --- Créditos CME (UC-47-12, UC-47-14) ---

  /**
   * Crea create cme record.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cme record conforme al contrato `CmeCreditRecords`.
   */
  createCmeRecord(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a practitioner profile.
       */
      practitionerProfileId: string;
      /**
       * Identificador asociado a certificate.
       */
      certificateId: string;
      /**
       * Valor de credit hours mantenido por la instancia.
       */
      creditHours: string;
      /**
       * Identificador asociado a accrediting body concept.
       */
      accreditingBodyConceptId: string;
      /**
       * Identificador asociado a specialty concept.
       */
      specialtyConceptId?: string;
      /**
       * Identificador asociado a jurisdiction concept.
       */
      jurisdictionConceptId?: string;
      /**
       * Valor de period year mantenido por la instancia.
       */
      periodYear: number;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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
