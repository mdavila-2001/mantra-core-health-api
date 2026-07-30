import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  EducationCatalogRepository,
  EducationLearningRepository,
} from '../repositories';
import { AssessmentQuestions } from '../entities';
import {
  EnrollLearnerDto,
  EnrollmentResponseDto,
  RecordProgressDto,
  ProgressResponseDto,
  StartAttemptDto,
  AttemptResponseDto,
  SubmitAttemptDto,
  GradedAttemptResponseDto,
  CompleteEnrollmentResponseDto,
  IssueCertificateDto,
  CertificateResponseDto,
  RevokeCertificateDto,
  RevokeCertificateResponseDto,
  RecordCmeCreditDto,
  CmeCreditResponseDto,
  type LearnerType,
  type EnrollmentSource,
  type LessonProgressStatus,
} from '../dto';

const LEARNER_TYPE_CONCEPT: Readonly<Record<LearnerType, string>> = {
  PRACTITIONER: CONCEPTS.LEARNER_PRACTITIONER,
  STAFF: CONCEPTS.LEARNER_STAFF,
  PATIENT: CONCEPTS.LEARNER_PATIENT,
  USER: CONCEPTS.LEARNER_USER,
};

const ENROLLMENT_SOURCE_CONCEPT: Readonly<Record<EnrollmentSource, string>> = {
  SELF: CONCEPTS.ENROLL_SOURCE_SELF,
  ASSIGNED: CONCEPTS.ENROLL_SOURCE_ASSIGNED,
  PURCHASED: CONCEPTS.ENROLL_SOURCE_PURCHASED,
  PARTNER: CONCEPTS.ENROLL_SOURCE_PARTNER,
};

const PROGRESS_STATUS_CONCEPT: Readonly<Record<LessonProgressStatus, string>> =
  {
    IN_PROGRESS: CONCEPTS.LESSON_IN_PROGRESS,
    COMPLETED: CONCEPTS.LESSON_COMPLETED,
  };

/** Estados en los que la inscripción cuenta como vigente. */
const LIVE_ENROLLMENT_STATES: readonly string[] = [
  CONCEPTS.ENROLLMENT_STATE_ACTIVE,
  CONCEPTS.ENROLLMENT_STATE_COMPLETED,
];

const FULL_PROGRESS = '100.00';
const VERIFICATION_CODE_BYTES = 8;

/**
 * Recorrido del aprendiz: inscripción, progreso, evaluaciones, finalización,
 * certificado y créditos CME (UC-47-05, 06, 08, 09, 10, 11, 12, 14).
 */
@Injectable()
export class EducationLearningService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param learningRepo - Valor de learning repo requerido por la operación.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly learningRepo: EducationLearningRepository,
    private readonly catalogRepo: EducationCatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EducationLearningService.name);
  }

  /**
   * UC-47-05: inscribir al aprendiz. La capacidad de la cohorte se comprueba
   * bajo bloqueo, que es lo único que impide desbordarla con dos peticiones
   * simultáneas.
   */
  async enrollLearner(
    dto: EnrollLearnerDto,
    actor: AuthenticatedUser,
  ): Promise<EnrollmentResponseDto> {
    this.logger.info(
      {
        operation: 'education.enrollment.create',
        courseId: dto.courseId,
        source: dto.source,
      },
      'Enrolling learner',
    );

    // Comprar sin intento de pago dejaría una inscripción sin contrapartida.
    if (dto.source === 'PURCHASED' && !dto.paymentIntentId) {
      throw new PreconditionFailedException(
        'Una inscripción comprada necesita su intento de pago',
        { courseId: dto.courseId },
      );
    }

    return this.em.transactional(async (tx) => {
      const course = await this.catalogRepo.findCourseById(tx, dto.courseId);
      if (!course) {
        throw new ResourceNotFoundException('Curso no encontrado', {
          courseId: dto.courseId,
        });
      }
      if (course.statusConceptId !== CONCEPTS.COURSE_PUBLISHED) {
        throw new PreconditionFailedException('El curso no está publicado', {
          courseId: dto.courseId,
        });
      }

      const learnerTypeConceptId = LEARNER_TYPE_CONCEPT[dto.learnerType];
      const live = await this.learningRepo.findLiveEnrollment(
        tx,
        dto.courseId,
        learnerTypeConceptId,
        dto.learnerRefId,
        [...LIVE_ENROLLMENT_STATES],
      );
      if (live) {
        throw new ConflictException(
          'El aprendiz ya está inscrito en el curso',
          {
            courseId: dto.courseId,
            enrollmentId: live.id,
          },
        );
      }

      let cohortEnrolledCount: number | undefined;
      if (dto.cohortId) {
        const cohort = await this.catalogRepo.findCohortForUpdate(
          tx,
          dto.cohortId,
        );
        if (!cohort) {
          throw new ResourceNotFoundException('Cohorte no encontrada', {
            cohortId: dto.cohortId,
          });
        }
        if (cohort.courseId !== dto.courseId) {
          throw new PreconditionFailedException(
            'La cohorte pertenece a otro curso',
            {
              cohortId: dto.cohortId,
            },
          );
        }
        if (cohort.statusConceptId !== CONCEPTS.COHORT_OPEN) {
          throw new PreconditionFailedException('La cohorte no está abierta', {
            cohortId: dto.cohortId,
          });
        }
        const enrolled = cohort.enrolledCount ?? 0;
        if (cohort.capacity && enrolled >= cohort.capacity) {
          throw new ConflictException(
            'La cohorte no tiene plazas disponibles',
            {
              cohortId: dto.cohortId,
              capacity: cohort.capacity,
            },
          );
        }
        cohortEnrolledCount = enrolled + 1;
        cohort.enrolledCount = cohortEnrolledCount;
        // Llenar la última plaza cierra la cohorte: no hay más que ofrecer.
        if (cohort.capacity && cohortEnrolledCount >= cohort.capacity) {
          cohort.statusConceptId = CONCEPTS.COHORT_CLOSED;
        }
        touch(cohort, actor.id);
      }

      const enrollment = this.learningRepo.createEnrollment(tx, {
        courseId: dto.courseId,
        cohortId: dto.cohortId,
        learnerTypeConceptId,
        learnerRefId: dto.learnerRefId,
        enrollmentSourceConceptId: ENROLLMENT_SOURCE_CONCEPT[dto.source],
        paymentIntentId: dto.paymentIntentId,
        statusConceptId: CONCEPTS.ENROLLMENT_STATE_ACTIVE,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        actorUserId: actor.id,
      });

      return {
        id: enrollment.id,
        statusConceptId: CONCEPTS.ENROLLMENT_STATE_ACTIVE,
        progressPercent: '0',
        cohortEnrolledCount,
      };
    });
  }

  /**
   * UC-47-06: anotar el progreso de una lección. El log es append-only y el
   * porcentaje de la inscripción se **recalcula** contando lecciones distintas
   * completadas: reanotar la misma lección no la cuenta dos veces.
   */
  async recordProgress(
    enrollmentId: string,
    dto: RecordProgressDto,
    actor: AuthenticatedUser,
  ): Promise<ProgressResponseDto> {
    this.logger.info(
      {
        operation: 'education.progress.record',
        enrollmentId,
        lessonId: dto.lessonId,
      },
      'Recording lesson progress',
    );

    return this.em.transactional(async (tx) => {
      const enrollment = await this.learningRepo.findEnrollmentForUpdate(
        tx,
        enrollmentId,
      );
      if (!enrollment) {
        throw new ResourceNotFoundException('Inscripción no encontrada', {
          enrollmentId,
        });
      }
      if (enrollment.statusConceptId === CONCEPTS.ENROLLMENT_STATE_CANCELLED) {
        throw new PreconditionFailedException('La inscripción está cancelada', {
          enrollmentId,
        });
      }
      if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
        throw new PreconditionFailedException(
          'El acceso a la inscripción ha caducado',
          {
            enrollmentId,
            expiresAt: enrollment.expiresAt.toISOString(),
          },
        );
      }

      const lesson = await this.catalogRepo.findLessonById(tx, dto.lessonId);
      if (!lesson) {
        throw new ResourceNotFoundException('Lección no encontrada', {
          lessonId: dto.lessonId,
        });
      }

      const completed = dto.status === 'COMPLETED';
      const progress = this.learningRepo.createLessonProgress(tx, {
        enrollmentId,
        lessonId: dto.lessonId,
        statusConceptId: PROGRESS_STATUS_CONCEPT[dto.status],
        secondsWatched: dto.secondsWatched,
        completionPercent:
          dto.completionPercent ?? (completed ? FULL_PROGRESS : undefined),
        completedAt: completed ? new Date() : undefined,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        recordedByUserId: actor.id,
      });

      const { completedLessons, totalLessons, progressPercent } =
        await this.recomputeProgress(tx, enrollmentId, enrollment.courseId);
      enrollment.progressPercent = progressPercent;
      touch(enrollment, actor.id);

      return {
        id: progress.id,
        enrollmentId,
        progressPercent,
        completedLessons,
        totalLessons,
      };
    });
  }

  /**
   * UC-47-08: abrir un intento. El número sale del máximo previo, y el tope de
   * intentos se comprueba con las filas ya bloqueadas.
   */
  async startAttempt(
    assessmentId: string,
    dto: StartAttemptDto,
    actor: AuthenticatedUser,
  ): Promise<AttemptResponseDto> {
    this.logger.info(
      {
        operation: 'education.attempt.start',
        assessmentId,
        enrollmentId: dto.enrollmentId,
      },
      'Starting assessment attempt',
    );

    return this.em.transactional(async (tx) => {
      const assessment = await this.catalogRepo.findAssessmentById(
        tx,
        assessmentId,
      );
      if (!assessment) {
        throw new ResourceNotFoundException('Evaluación no encontrada', {
          assessmentId,
        });
      }

      const enrollment = await this.learningRepo.findEnrollmentById(
        tx,
        dto.enrollmentId,
      );
      if (!enrollment) {
        throw new ResourceNotFoundException('Inscripción no encontrada', {
          enrollmentId: dto.enrollmentId,
        });
      }
      if (enrollment.courseId !== assessment.courseId) {
        throw new PreconditionFailedException(
          'La inscripción es de otro curso',
          {
            enrollmentId: dto.enrollmentId,
            assessmentId,
          },
        );
      }
      if (enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_ACTIVE) {
        throw new PreconditionFailedException('La inscripción no está activa', {
          enrollmentId: dto.enrollmentId,
        });
      }

      const previous = await this.learningRepo.findAttemptsForUpdate(
        tx,
        assessmentId,
        dto.enrollmentId,
      );
      const open = previous.find(
        (a) => a.statusConceptId === CONCEPTS.ATTEMPT_IN_PROGRESS,
      );
      if (open) {
        throw new ConflictException('Ya hay un intento en curso', {
          assessmentId,
          attemptId: open.id,
        });
      }
      if (assessment.maxAttempts && previous.length >= assessment.maxAttempts) {
        throw new PreconditionFailedException(
          'Se agotaron los intentos permitidos',
          {
            assessmentId,
            maxAttempts: assessment.maxAttempts,
          },
        );
      }

      const attemptNumber = (previous[0]?.attemptNumber ?? 0) + 1;
      const attempt = this.learningRepo.createAttempt(tx, {
        assessmentId,
        enrollmentId: dto.enrollmentId,
        attemptNumber,
        statusConceptId: CONCEPTS.ATTEMPT_IN_PROGRESS,
        actorUserId: actor.id,
      });

      const dueAt = assessment.timeLimitMinutes
        ? new Date(
            Date.now() + assessment.timeLimitMinutes * 60_000,
          ).toISOString()
        : undefined;

      return {
        id: attempt.id,
        attemptNumber,
        statusConceptId: CONCEPTS.ATTEMPT_IN_PROGRESS,
        dueAt,
      };
    });
  }

  /**
   * UC-47-09: enviar y corregir el intento. La corrección se hace contra
   * `correct_answer_json`, que nunca sale de esta transacción.
   */
  async submitAttempt(
    attemptId: string,
    dto: SubmitAttemptDto,
    actor: AuthenticatedUser,
  ): Promise<GradedAttemptResponseDto> {
    this.logger.info(
      { operation: 'education.attempt.submit', attemptId },
      'Submitting assessment attempt',
    );

    return this.em.transactional(async (tx) => {
      const attempt = await this.learningRepo.findAttemptForUpdate(
        tx,
        attemptId,
      );
      if (!attempt) {
        throw new ResourceNotFoundException('Intento no encontrado', {
          attemptId,
        });
      }
      if (attempt.statusConceptId !== CONCEPTS.ATTEMPT_IN_PROGRESS) {
        throw new ConflictException('El intento ya fue corregido', {
          attemptId,
          statusConceptId: attempt.statusConceptId,
        });
      }

      const assessment = await this.catalogRepo.findAssessmentById(
        tx,
        attempt.assessmentId,
      );
      if (!assessment) {
        throw new ResourceNotFoundException('Evaluación no encontrada', {
          assessmentId: attempt.assessmentId,
        });
      }
      if (assessment.timeLimitMinutes && attempt.startedAt) {
        const dueAt = new Date(
          attempt.startedAt.getTime() + assessment.timeLimitMinutes * 60_000,
        );
        if (dueAt < new Date()) {
          throw new PreconditionFailedException(
            'El tiempo del intento venció',
            {
              attemptId,
              dueAt: dueAt.toISOString(),
            },
          );
        }
      }

      const questions = await this.catalogRepo.findQuestionsByAssessment(
        tx,
        attempt.assessmentId,
      );
      const { score, correctAnswers } = this.grade(
        questions,
        dto.responsesJson,
      );
      const passed = assessment.isGraded
        ? Number(score) >= Number(assessment.passingScore ?? '0')
        : true;

      attempt.responsesJson = dto.responsesJson;
      attempt.score = score;
      attempt.passed = passed;
      attempt.submittedAt = new Date();
      attempt.gradedByUserId = actor.id;
      attempt.statusConceptId = CONCEPTS.ATTEMPT_GRADED;
      touch(attempt, actor.id);

      return {
        id: attemptId,
        score,
        passed,
        statusConceptId: CONCEPTS.ATTEMPT_GRADED,
        correctAnswers,
        totalQuestions: questions.length,
      };
    });
  }

  /**
   * UC-47-10: completar el curso. Exige que el progreso esté al 100 y que las
   * evaluaciones puntuables estén aprobadas. Es idempotente.
   */
  async completeEnrollment(
    enrollmentId: string,
    actor: AuthenticatedUser,
  ): Promise<CompleteEnrollmentResponseDto> {
    this.logger.info(
      { operation: 'education.enrollment.complete', enrollmentId },
      'Completing enrollment',
    );

    return this.em.transactional(async (tx) => {
      const enrollment = await this.learningRepo.findEnrollmentForUpdate(
        tx,
        enrollmentId,
      );
      if (!enrollment) {
        throw new ResourceNotFoundException('Inscripción no encontrada', {
          enrollmentId,
        });
      }
      if (enrollment.statusConceptId === CONCEPTS.ENROLLMENT_STATE_COMPLETED) {
        return {
          id: enrollmentId,
          statusConceptId: CONCEPTS.ENROLLMENT_STATE_COMPLETED,
          progressPercent: enrollment.progressPercent ?? FULL_PROGRESS,
          alreadyCompleted: true,
        };
      }
      if (enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_ACTIVE) {
        throw new PreconditionFailedException('La inscripción no está activa', {
          enrollmentId,
        });
      }

      const { progressPercent } = await this.recomputeProgress(
        tx,
        enrollmentId,
        enrollment.courseId,
      );
      if (Number(progressPercent) < 100) {
        throw new PreconditionFailedException('El curso no está completo', {
          enrollmentId,
          progressPercent,
        });
      }

      // Dar por completado un curso con una evaluación sin aprobar convertiría
      // el certificado en un papel sin respaldo.
      const graded = await this.catalogRepo.findGradedAssessments(
        tx,
        enrollment.courseId,
        CONCEPTS.COURSE_PUBLISHED,
      );
      const passed = await this.learningRepo.findPassedAttempts(
        tx,
        enrollmentId,
      );
      const passedIds = new Set(passed.map((a) => a.assessmentId));
      const pending = graded.filter((a) => !passedIds.has(a.id));
      if (pending.length > 0) {
        throw new PreconditionFailedException(
          'Quedan evaluaciones sin aprobar',
          {
            enrollmentId,
            pending: pending.map((a) => a.id),
          },
        );
      }

      enrollment.statusConceptId = CONCEPTS.ENROLLMENT_STATE_COMPLETED;
      enrollment.progressPercent = FULL_PROGRESS;
      enrollment.completedAt = new Date();
      touch(enrollment, actor.id);

      return {
        id: enrollmentId,
        statusConceptId: CONCEPTS.ENROLLMENT_STATE_COMPLETED,
        progressPercent: FULL_PROGRESS,
        alreadyCompleted: false,
      };
    });
  }

  /**
   * UC-47-11: emitir el certificado. Es idempotente por inscripción: repetir la
   * llamada devuelve el que ya existe en vez de emitir un segundo número.
   */
  async issueCertificate(
    enrollmentId: string,
    dto: IssueCertificateDto,
    actor: AuthenticatedUser,
  ): Promise<CertificateResponseDto> {
    this.logger.info(
      { operation: 'education.certificate.issue', enrollmentId },
      'Issuing certificate',
    );

    return this.em.transactional(async (tx) => {
      const enrollment = await this.learningRepo.findEnrollmentForUpdate(
        tx,
        enrollmentId,
      );
      if (!enrollment) {
        throw new ResourceNotFoundException('Inscripción no encontrada', {
          enrollmentId,
        });
      }
      if (enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_COMPLETED) {
        throw new PreconditionFailedException(
          'La inscripción no está completada',
          {
            enrollmentId,
          },
        );
      }

      const existing = await this.learningRepo.findCertificateByEnrollment(
        tx,
        enrollmentId,
      );
      if (existing) {
        return {
          id: existing.id,
          certificateNumber: existing.certificateNumber,
          verificationCode: existing.verificationCode ?? '',
          cmeCreditsAwarded: existing.cmeCreditsAwarded,
          statusConceptId: existing.statusConceptId,
          alreadyIssued: true,
        };
      }

      const course = await this.catalogRepo.findCourseById(
        tx,
        enrollment.courseId,
      );
      if (!course) {
        throw new ResourceNotFoundException('Curso no encontrado', {
          courseId: enrollment.courseId,
        });
      }

      const certificateNumber = await this.generateCertificateNumber(
        tx,
        course.code,
      );
      const verificationCode = await this.generateVerificationCode(tx);
      // Las horas salen del curso, no del cuerpo: acreditar más de lo que el
      // curso declara sería inventar formación.
      const cmeCreditsAwarded = course.isAccredited
        ? course.cmeCreditHours
        : undefined;
      const expiresAt = dto.validityMonths
        ? new Date(
            new Date().setMonth(new Date().getMonth() + dto.validityMonths),
          )
        : undefined;

      const certificate = this.learningRepo.createCertificate(tx, {
        enrollmentId,
        courseId: enrollment.courseId,
        certificateNumber,
        learnerRefId: enrollment.learnerRefId,
        cmeCreditsAwarded,
        expiresAt,
        verificationCode,
        fileId: dto.fileId,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
        actorUserId: actor.id,
      });

      return {
        id: certificate.id,
        certificateNumber,
        verificationCode,
        cmeCreditsAwarded,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
        alreadyIssued: false,
      };
    });
  }

  /** UC-47-12: acreditar las horas CME del certificado al profesional. */
  async recordCmeCredit(
    certificateId: string,
    dto: RecordCmeCreditDto,
    actor: AuthenticatedUser,
  ): Promise<CmeCreditResponseDto> {
    this.logger.info(
      { operation: 'education.cme.record', certificateId },
      'Recording CME credit',
    );

    return this.em.transactional(async (tx) => {
      const certificate = await this.learningRepo.findCertificateById(
        tx,
        certificateId,
      );
      if (!certificate) {
        throw new ResourceNotFoundException('Certificado no encontrado', {
          certificateId,
        });
      }
      if (certificate.statusConceptId !== CONCEPTS.CERTIFICATE_ISSUED) {
        throw new PreconditionFailedException(
          'El certificado no está vigente',
          {
            certificateId,
            statusConceptId: certificate.statusConceptId,
          },
        );
      }
      if (
        !certificate.cmeCreditsAwarded ||
        Number(certificate.cmeCreditsAwarded) <= 0
      ) {
        throw new PreconditionFailedException(
          'El certificado no otorga créditos CME',
          {
            certificateId,
          },
        );
      }

      const existing = await this.learningRepo.findCmeRecord(
        tx,
        certificateId,
        dto.practitionerProfileId,
      );
      if (existing) {
        return {
          id: existing.id,
          creditHours: existing.creditHours,
          periodYear: existing.periodYear ?? new Date().getFullYear(),
          statusConceptId: existing.statusConceptId,
          alreadyAwarded: true,
        };
      }

      const course = await this.catalogRepo.findCourseById(
        tx,
        certificate.courseId,
      );
      if (!course?.accreditingBodyConceptId) {
        throw new PreconditionFailedException(
          'El curso no declara organismo acreditador',
          {
            courseId: certificate.courseId,
          },
        );
      }

      const periodYear = dto.periodYear ?? new Date().getFullYear();
      const record = this.learningRepo.createCmeRecord(tx, {
        practitionerProfileId: dto.practitionerProfileId,
        certificateId,
        creditHours: certificate.cmeCreditsAwarded,
        accreditingBodyConceptId: course.accreditingBodyConceptId,
        specialtyConceptId: dto.specialtyConceptId ?? course.specialtyConceptId,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        periodYear,
        statusConceptId: CONCEPTS.CME_AWARDED,
        actorUserId: actor.id,
      });

      return {
        id: record.id,
        creditHours: certificate.cmeCreditsAwarded,
        periodYear,
        statusConceptId: CONCEPTS.CME_AWARDED,
        alreadyAwarded: false,
      };
    });
  }

  /**
   * UC-47-14: revocar el certificado y revertir los créditos que otorgó. Van
   * juntos en la misma transacción: un certificado revocado cuyos créditos
   * siguieran contando dejaría acreditación sin respaldo.
   */
  async revokeCertificate(
    certificateId: string,
    dto: RevokeCertificateDto,
    actor: AuthenticatedUser,
  ): Promise<RevokeCertificateResponseDto> {
    this.logger.warn(
      { operation: 'education.certificate.revoke', certificateId },
      'Revoking certificate',
    );

    return this.em.transactional(async (tx) => {
      const certificate = await this.learningRepo.findCertificateForUpdate(
        tx,
        certificateId,
      );
      if (!certificate) {
        throw new ResourceNotFoundException('Certificado no encontrado', {
          certificateId,
        });
      }
      if (certificate.statusConceptId === CONCEPTS.CERTIFICATE_REVOKED) {
        throw new ConflictException('El certificado ya está revocado', {
          certificateId,
        });
      }

      const records = await this.learningRepo.findCmeRecordsForUpdate(
        tx,
        certificateId,
      );
      let cmeRecordsReversed = 0;
      for (const record of records) {
        if (record.statusConceptId === CONCEPTS.CME_REVERSED) continue;
        record.statusConceptId = CONCEPTS.CME_REVERSED;
        touch(record, actor.id);
        cmeRecordsReversed += 1;
      }

      certificate.statusConceptId = CONCEPTS.CERTIFICATE_REVOKED;
      touch(certificate, actor.id);

      this.logger.warn(
        {
          operation: 'education.certificate.revoke',
          certificateId,
          reason: dto.reason,
        },
        'Certificate revoked and CME credits reversed',
      );

      return {
        id: certificateId,
        statusConceptId: CONCEPTS.CERTIFICATE_REVOKED,
        cmeRecordsReversed,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Recalcula el progreso contando **lecciones distintas** cuyo estado vigente
   * (la anotación más reciente) sea completada.
   */
  private async recomputeProgress(
    tx: EntityManager,
    enrollmentId: string,
    courseId: string,
  ): Promise<{
    /**
     * Valor de completed lessons mantenido por la instancia.
     */
    completedLessons: number;
    /**
     * Valor de total lessons mantenido por la instancia.
     */
    totalLessons: number;
    /**
     * Valor de progress percent mantenido por la instancia.
     */
    progressPercent: string;
  }> {
    const modules = await this.catalogRepo.findModulesByCourse(tx, courseId);
    const totalLessons = await this.catalogRepo.countLessonsByModules(
      tx,
      modules.map((m) => m.id),
      CONCEPTS.COURSE_PUBLISHED,
    );

    const log = await this.learningRepo.findProgressByEnrollment(
      tx,
      enrollmentId,
    );
    const latestByLesson = new Map<string, string>();
    // El log llega del más nuevo al más viejo: la primera anotación de cada
    // lección es su estado vigente.
    for (const entry of log) {
      if (!latestByLesson.has(entry.lessonId)) {
        latestByLesson.set(entry.lessonId, entry.statusConceptId);
      }
    }
    const completedLessons = [...latestByLesson.values()].filter(
      (status) => status === CONCEPTS.LESSON_COMPLETED,
    ).length;

    const progressPercent =
      totalLessons === 0
        ? '0.00'
        : ((completedLessons / totalLessons) * 100).toFixed(2);

    return { completedLessons, totalLessons, progressPercent };
  }

  /**
   * Corrige el intento comparando cada respuesta con la correcta. La
   * puntuación es el porcentaje de puntos obtenidos sobre el total posible.
   */
  private grade(
    questions: AssessmentQuestions[],
    responses: Record<string, unknown>,
  ): {
    /**
     * Valor de score mantenido por la instancia.
     */
    score: string; /**
     * Valor de correct answers mantenido por la instancia.
     */
    correctAnswers: number;
  } {
    if (questions.length === 0) return { score: '0.00', correctAnswers: 0 };

    let earned = 0;
    let possible = 0;
    let correctAnswers = 0;

    for (const question of questions) {
      const points = Number(question.points ?? '1');
      possible += points;
      if (
        question.correctAnswerJson === undefined ||
        question.correctAnswerJson === null
      )
        continue;

      const given = responses[question.id];
      if (this.answersMatch(question.correctAnswerJson, given)) {
        earned += points;
        correctAnswers += 1;
      }
    }

    const score =
      possible === 0 ? '0.00' : ((earned / possible) * 100).toFixed(2);
    return { score, correctAnswers };
  }

  /**
   * Compara respuesta dada y esperada. Las de opción múltiple se comparan como
   * conjunto: el orden en que el aprendiz marca las opciones no es la respuesta.
   */
  private answersMatch(expected: unknown, given: unknown): boolean {
    if (given === undefined || given === null) return false;
    if (Array.isArray(expected) && Array.isArray(given)) {
      if (expected.length !== given.length) return false;
      const sortedExpected = [...expected].map(String).sort();
      const sortedGiven = [...given].map(String).sort();
      return sortedExpected.every(
        (value, index) => value === sortedGiven[index],
      );
    }
    return JSON.stringify(expected) === JSON.stringify(given);
  }

  /** Número legible del certificado, único; se reintenta si colisiona. */
  private async generateCertificateNumber(
    tx: EntityManager,
    courseCode: string,
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomBytes(4).toString('hex').toUpperCase();
      const number = `${courseCode}-${suffix}`;
      if (!(await this.learningRepo.findCertificateByNumber(tx, number)))
        return number;
    }
    throw new ConflictException(
      'No se pudo generar un número de certificado libre',
      {
        courseCode,
      },
    );
  }

  /** Código de verificación, único global: es lo que un tercero teclea. */
  private async generateVerificationCode(tx: EntityManager): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomBytes(VERIFICATION_CODE_BYTES)
        .toString('base64url')
        .toUpperCase();
      if (
        !(await this.learningRepo.findCertificateByVerificationCode(tx, code))
      )
        return code;
    }
    throw new ConflictException(
      'No se pudo generar un código de verificación libre',
      {},
    );
  }
}
