import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  COURSE_PAYMENT_SOURCE_REF,
  EducationLearningService,
} from './education-learning.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { EducationErrorReason } from '../education.error-reasons';
import { EducationScopeService } from './education-scope.service';
import { T1, T2, expectOutOfScope, inTenant } from './education.testing';

const actor = { id: 'user-1', roles: ['EDUCATION_ADMIN'] } as any;
const COURSE = '11111111-1111-1111-1111-111111111111';
const COHORT = '22222222-2222-2222-2222-222222222222';
const ENROLLMENT = '33333333-3333-3333-3333-333333333333';
const LEARNER = '44444444-4444-4444-4444-444444444444';
const LESSON = '55555555-5555-5555-5555-555555555555';
const ASSESSMENT = '66666666-6666-6666-6666-666666666666';
const ATTEMPT = '77777777-7777-7777-7777-777777777777';
const CERTIFICATE = '88888888-8888-8888-8888-888888888888';
const PROFILE = '99999999-9999-9999-9999-999999999999';
const INTENT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const learningRepo = {
    createEnrollment: mockFn(),
    findEnrollmentById: mockFn(),
    findEnrollmentForUpdate: mockFn(),
    findLiveEnrollment: mockFn(),
    findPaymentIntent: mockFn(),
    findPaymentIntentForUpdate: mockFn(),
    findEnrollmentByPaymentIntent: mockFn(),
    createLessonProgress: mockFn(),
    findProgressByEnrollment: mockFn(),
    createAttempt: mockFn(),
    findAttemptById: mockFn(),
    findAttemptForUpdate: mockFn(),
    findAttemptsForUpdate: mockFn(),
    findPassedAttempts: mockFn(),
    createCertificate: mockFn(),
    findCertificateById: mockFn(),
    findCertificateForUpdate: mockFn(),
    findCertificateByEnrollment: mockFn(),
    findCertificateByNumber: mockFn(),
    findCertificateByVerificationCode: mockFn(),
    createCmeRecord: mockFn(),
    findCmeRecord: mockFn(),
    findCmeRecordsForUpdate: mockFn(),
  };
  const catalogRepo = {
    findCourseById: mockFn(),
    findCohortById: mockFn(),
    findCohortForUpdate: mockFn(),
    findModulesByCourse: mockFn(),
    findLessonById: mockFn(),
    countLessonsByModules: mockFn(),
    findAssessmentById: mockFn(),
    findGradedAssessments: mockFn(),
    findQuestionsByAssessment: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // Por defecto el curso y la inscripción existen y son de T1: cada prueba
  // sustituye lo que necesite. Los resolvedores de alcance leen primero sin
  // bloqueo y recién después con bloqueo.
  catalogRepo.findCourseById.mockResolvedValue(publishedCourse());
  learningRepo.findEnrollmentById.mockResolvedValue(activeEnrollment());
  const scope = new EducationScopeService(
    catalogRepo as any,
    learningRepo as any,
  );
  const raw = new EducationLearningService(
    em as any,
    learningRepo,
    catalogRepo as any,
    scope,
    logger as any,
  );
  return { raw, service: inTenant(raw), tx, learningRepo, catalogRepo, logger };
}

/** Deja la inscripción disponible para la lectura sin bloqueo y para la bloqueada. */
function seedEnrollment(d: ReturnType<typeof build>, enrollment: any) {
  d.learningRepo.findEnrollmentById.mockResolvedValue(enrollment);
  d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(enrollment);
}

/** Deja el intento disponible para la lectura sin bloqueo y para la bloqueada. */
function seedAttempt(d: ReturnType<typeof build>, attempt: any) {
  d.learningRepo.findAttemptById.mockResolvedValue(attempt);
  d.learningRepo.findAttemptForUpdate.mockResolvedValue(attempt);
}

/** Deja el certificado (del curso de la prueba) disponible con y sin bloqueo. */
function seedCertificate(d: ReturnType<typeof build>, certificate: any) {
  if (certificate && certificate.courseId === undefined) {
    certificate.courseId = COURSE;
  }
  d.learningRepo.findCertificateById.mockResolvedValue(certificate);
  d.learningRepo.findCertificateForUpdate.mockResolvedValue(certificate);
}

/** Deja la cohorte disponible con y sin bloqueo. */
function seedCohort(d: ReturnType<typeof build>, cohort: any) {
  d.catalogRepo.findCohortById.mockResolvedValue(cohort);
  d.catalogRepo.findCohortForUpdate.mockResolvedValue(cohort);
}

/**
 * Ejecuta la operación published course.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de published course conforme al contrato `any`.
 */
function publishedCourse(overrides: Record<string, unknown> = {}): any {
  return {
    id: COURSE,
    tenantId: T1,
    statusConceptId: CONCEPTS.COURSE_PUBLISHED,
    code: 'CUR-01',
    ...overrides,
  };
}

/**
 * Ejecuta la operación active enrollment.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active enrollment conforme al contrato `any`.
 */
function activeEnrollment(overrides: Record<string, unknown> = {}): any {
  return {
    id: ENROLLMENT,
    courseId: COURSE,
    learnerRefId: LEARNER,
    statusConceptId: CONCEPTS.ENROLLMENT_STATE_ACTIVE,
    progressPercent: '0',
    ...overrides,
  };
}

/** Deja el intento de pago disponible para la lectura sin bloqueo y para la bloqueada. */
function seedIntent(d: ReturnType<typeof build>, intent: any) {
  d.learningRepo.findPaymentIntent.mockResolvedValue(intent);
  d.learningRepo.findPaymentIntentForUpdate.mockResolvedValue(intent);
}

/** Intento de pago confirmado del tenant T1. */
function paidIntent(overrides: Record<string, unknown> = {}): any {
  return {
    id: INTENT,
    tenantId: T1,
    statusConceptId: CONCEPTS.PI_SUCCEEDED,
    // Creado por el actor de las pruebas, sin referencia de origen.
    createdByUserId: 'user-1',
    amount: '100.00',
    currencyConceptId: 'cur-1',
    ...overrides,
  };
}

describe('EducationLearningService', () => {
  describe('enrollLearner (UC-47-05)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        courseId: COURSE,
        learnerType: 'PRACTITIONER' as const,
        learnerRefId: LEARNER,
        source: 'SELF' as const,
        ...overrides,
      };
    }

    it('enrolls the learner with zero progress', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse());
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });

      const res = await d.service.enrollLearner(dto(), actor);

      expect(res).toMatchObject({
        id: ENROLLMENT,
        statusConceptId: CONCEPTS.ENROLLMENT_STATE_ACTIVE,
        progressPercent: '0',
      });
    });

    it('takes a seat from the cohort and closes it when it fills up', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse());
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      const cohort: any = {
        id: COHORT,
        courseId: COURSE,
        statusConceptId: CONCEPTS.COHORT_OPEN,
        capacity: 2,
        enrolledCount: 1,
      };
      seedCohort(d, cohort);
      d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });

      const res = await d.service.enrollLearner(
        dto({ cohortId: COHORT }),
        actor,
      );

      expect(res.cohortEnrolledCount).toBe(2);
      expect(cohort.statusConceptId).toBe(CONCEPTS.COHORT_CLOSED);
    });

    it('refuses to enroll into a full cohort', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse());
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      seedCohort(d, {
        id: COHORT,
        courseId: COURSE,
        statusConceptId: CONCEPTS.COHORT_OPEN,
        capacity: 2,
        enrolledCount: 2,
      });

      await expect(
        d.service.enrollLearner(dto({ cohortId: COHORT }), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a second live enrollment of the same learner', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse());
      d.learningRepo.findLiveEnrollment.mockResolvedValue({ id: 'enr-prev' });

      await expect(
        d.service.enrollLearner(dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires a payment intent on a purchased enrollment', async () => {
      const d = build();

      await expect(
        d.service.enrollLearner(
          dto({ source: 'PURCHASED' as const }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts a purchased enrollment with its payment intent', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse());
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      seedIntent(d, paidIntent());
      d.learningRepo.findEnrollmentByPaymentIntent.mockResolvedValue(null);
      d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });

      const res = await d.service.enrollLearner(
        dto({ source: 'PURCHASED' as const, paymentIntentId: INTENT }),
        actor,
      );

      expect(res.id).toBe(ENROLLMENT);
    });

    describe('fuentes y cursos de pago para un aprendiz', () => {
      const learner = {
        id: 'user-7',
        roles: ['LEARNER'],
        practitionerProfileId: LEARNER,
      } as any;
      const own = (overrides: Record<string, unknown> = {}) =>
        dto({ learnerRefId: undefined, ...overrides });
      const paidCourse = () =>
        publishedCourse({ price: '120.00', currencyConceptId: 'cur-1' });

      it.each(['ASSIGNED', 'PARTNER'] as const)(
        'un aprendiz no puede inscribirse con la fuente administrativa %s',
        async (source) => {
          const d = build();
          d.learningRepo.findLiveEnrollment.mockResolvedValue(null);

          await expect(
            d.service.enrollLearner(own({ source }), learner),
          ).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_SOURCE_NOT_ALLOWED,
          });
          expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
        },
      );

      it('quien administra la formación sí puede usar ASSIGNED y PARTNER', async () => {
        const d = build();
        d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
        d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });

        for (const source of ['ASSIGNED', 'PARTNER'] as const) {
          await expect(
            d.service.enrollLearner(dto({ source }), actor),
          ).resolves.toMatchObject({ id: ENROLLMENT });
        }
      });

      it('un curso de pago no admite a un aprendiz con SELF', async () => {
        const d = build();
        d.catalogRepo.findCourseById.mockResolvedValue(paidCourse());
        d.learningRepo.findLiveEnrollment.mockResolvedValue(null);

        await expect(
          d.service.enrollLearner(own({ source: 'SELF' }), learner),
        ).rejects.toMatchObject({
          reason: EducationErrorReason.ENROLLMENT_PAYMENT_REQUIRED,
        });
        expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
      });

      it('un curso gratuito sí admite SELF; uno de pago, con compra confirmada', async () => {
        const free = build();
        free.learningRepo.findLiveEnrollment.mockResolvedValue(null);
        free.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });
        await expect(
          free.service.enrollLearner(own({ source: 'SELF' }), learner),
        ).resolves.toMatchObject({ id: ENROLLMENT });

        const paid = build();
        paid.catalogRepo.findCourseById.mockResolvedValue(paidCourse());
        paid.learningRepo.findLiveEnrollment.mockResolvedValue(null);
        seedIntent(
          paid,
          paidIntent({
            createdByUserId: 'user-7',
            amount: '120.00',
            sourceRefType: COURSE_PAYMENT_SOURCE_REF,
            sourceRefId: COURSE,
          }),
        );
        paid.learningRepo.findEnrollmentByPaymentIntent.mockResolvedValue(null);
        paid.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });
        await expect(
          paid.service.enrollLearner(
            own({ source: 'PURCHASED', paymentIntentId: INTENT }),
            learner,
          ),
        ).resolves.toMatchObject({ id: ENROLLMENT });
      });

      it('quien administra puede inscribir sin pago en un curso de pago (cortesía)', async () => {
        const d = build();
        d.catalogRepo.findCourseById.mockResolvedValue(paidCourse());
        d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
        d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });

        await expect(
          d.service.enrollLearner(dto({ source: 'ASSIGNED' }), actor),
        ).resolves.toMatchObject({ id: ENROLLMENT });
      });

      it.each(['SELF', 'ASSIGNED', 'PARTNER'] as const)(
        'un intento de pago con la fuente %s se rechaza',
        async (source) => {
          const d = build();

          await expect(
            d.service.enrollLearner(
              dto({ source, paymentIntentId: INTENT }),
              actor,
            ),
          ).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_PAYMENT_NOT_APPLICABLE,
          });
          expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
        },
      );
    });

    describe('verificación del pago de una inscripción comprada', () => {
      it('bloquea la fila del pago tras comprobar su tenant y antes de ver si ya se usó', async () => {
        const d = build();
        const order: string[] = [];
        d.learningRepo.findPaymentIntent.mockImplementation(async () => {
          order.push('lectura');
          return paidIntent();
        });
        d.learningRepo.findPaymentIntentForUpdate.mockImplementation(
          async () => {
            order.push('bloqueo');
            return paidIntent();
          },
        );
        d.learningRepo.findEnrollmentByPaymentIntent.mockImplementation(
          async () => {
            order.push('uso');
            return null;
          },
        );
        d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
        d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });

        await d.service.enrollLearner(purchased(), actor);

        expect(order).toEqual(['lectura', 'bloqueo', 'uso']);
      });

      describe('el pago corresponde a la compra', () => {
        const priced = () =>
          publishedCourse({ price: '120.00', currencyConceptId: 'cur-1' });

        function run(intent: any, course: any = priced(), who: any = actor) {
          const d = build();
          d.catalogRepo.findCourseById.mockResolvedValue(course);
          d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
          d.learningRepo.findEnrollmentByPaymentIntent.mockResolvedValue(null);
          d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });
          seedIntent(d, intent);
          return {
            d,
            result: d.service.enrollLearner(purchased(), who),
          };
        }
        const ok = (overrides: Record<string, unknown> = {}) =>
          paidIntent({ amount: '120.00', ...overrides });

        it('acepta un pago del actor, de monto suficiente y misma moneda', async () => {
          await expect(run(ok()).result).resolves.toMatchObject({
            id: ENROLLMENT,
          });
        });

        it('acepta un monto mayor al precio', async () => {
          await expect(
            run(ok({ amount: '500' })).result,
          ).resolves.toBeDefined();
        });

        it('rechaza un intento de monto menor al precio del curso', async () => {
          const { d, result } = run(ok({ amount: '119.99' }));
          await expect(result).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_PAYMENT_MISMATCH,
          });
          expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
        });

        it('rechaza un intento en otra moneda que la del curso', async () => {
          const { result } = run(ok({ currencyConceptId: 'cur-2' }));
          await expect(result).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_PAYMENT_MISMATCH,
          });
        });

        it('no exige moneda si el curso no la fija', async () => {
          const { result } = run(
            ok({ currencyConceptId: 'cur-2' }),
            publishedCourse({ price: '120.00' }),
          );
          await expect(result).resolves.toBeDefined();
        });

        it('rechaza un intento creado por otro pagador', async () => {
          const { d, result } = run(ok({ createdByUserId: 'user-ajeno' }));
          await expect(result).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_PAYMENT_MISMATCH,
          });
          expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
        });

        it('rechaza un intento sin pagador registrado', async () => {
          const { result } = run(ok({ createdByUserId: null }));
          await expect(result).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_PAYMENT_MISMATCH,
          });
        });

        it('acepta el pago del propio usuario aprendiz hecho por un administrador', async () => {
          const d = build();
          d.catalogRepo.findCourseById.mockResolvedValue(priced());
          d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
          d.learningRepo.findEnrollmentByPaymentIntent.mockResolvedValue(null);
          d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });
          seedIntent(d, ok({ createdByUserId: LEARNER }));

          await expect(
            d.service.enrollLearner(
              dto({
                source: 'PURCHASED',
                paymentIntentId: INTENT,
                learnerType: 'USER',
              }),
              actor,
            ),
          ).resolves.toBeDefined();
        });

        it('rechaza un intento que declara pagar otro curso', async () => {
          const { d, result } = run(
            ok({
              sourceRefType: COURSE_PAYMENT_SOURCE_REF,
              sourceRefId: 'otro-curso',
            }),
          );
          await expect(result).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_PAYMENT_MISMATCH,
          });
          expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
        });

        it('rechaza un intento que declara pagar otro tipo de recurso o una factura', async () => {
          await expect(
            run(ok({ sourceRefType: 'INVOICE', sourceRefId: COURSE })).result,
          ).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_PAYMENT_MISMATCH,
          });
          await expect(
            run(ok({ invoiceId: 'factura-1' })).result,
          ).rejects.toMatchObject({
            reason: EducationErrorReason.ENROLLMENT_PAYMENT_MISMATCH,
          });
        });

        it('acepta un intento que declara pagar este curso', async () => {
          await expect(
            run(
              ok({
                sourceRefType: COURSE_PAYMENT_SOURCE_REF,
                sourceRefId: COURSE,
              }),
            ).result,
          ).resolves.toBeDefined();
        });
      });

      it('un intento ajeno no llega a bloquearse', async () => {
        const d = build();
        d.learningRepo.findPaymentIntent.mockResolvedValue(
          paidIntent({ tenantId: T2 }),
        );

        await expectOutOfScope(d.service.enrollLearner(purchased(), actor));
        expect(
          d.learningRepo.findPaymentIntentForUpdate,
        ).not.toHaveBeenCalled();
      });

      const purchased = () =>
        dto({ source: 'PURCHASED' as const, paymentIntentId: INTENT });

      it('un intento de pago de otro tenant responde como inexistente y no inscribe', async () => {
        const d = build();
        seedIntent(d, paidIntent({ tenantId: T2 }));

        await expectOutOfScope(d.service.enrollLearner(purchased(), actor));
        expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
      });

      it('un intento de pago inexistente responde igual que uno ajeno', async () => {
        const d = build();
        seedIntent(d, null);

        await expectOutOfScope(d.service.enrollLearner(purchased(), actor));
        expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
      });

      it('un pago sin confirmar (pendiente, fallido) no habilita la inscripción', async () => {
        const d = build();
        seedIntent(d, paidIntent({ statusConceptId: CONCEPTS.PI_PENDING }));

        await expect(
          d.service.enrollLearner(purchased(), actor),
        ).rejects.toMatchObject({
          reason: EducationErrorReason.ENROLLMENT_PAYMENT_NOT_CONFIRMED,
        });
        expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
      });

      it('un pago que ya respalda otra inscripción no se reutiliza', async () => {
        const d = build();
        seedIntent(d, paidIntent());
        d.learningRepo.findEnrollmentByPaymentIntent.mockResolvedValue({
          id: 'enr-prev',
        });

        await expect(
          d.service.enrollLearner(purchased(), actor),
        ).rejects.toMatchObject({
          reason: EducationErrorReason.ENROLLMENT_PAYMENT_ALREADY_USED,
        });
        expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
      });
    });

    it('refuses a cohort that belongs to another course', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse());
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      seedCohort(d, {
        id: COHORT,
        courseId: 'other-course',
        statusConceptId: CONCEPTS.COHORT_OPEN,
      });

      await expect(
        d.service.enrollLearner(dto({ cohortId: COHORT }), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an unpublished course', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(
        publishedCourse({ statusConceptId: CONCEPTS.COURSE_DRAFT }),
      );

      await expect(
        d.service.enrollLearner(dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordProgress (UC-47-06)', () => {
    const dto = { lessonId: LESSON, status: 'COMPLETED' as const };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param log - Valor de log requerido por la operación.
     * @param totalLessons - Valor de total lessons requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      log: any[] = [],
      totalLessons = 4,
    ) {
      const enrollment = activeEnrollment();
      seedEnrollment(d, enrollment);
      d.catalogRepo.findLessonById.mockResolvedValue({
        id: LESSON,
        courseModuleId: 'mod-1',
      });
      d.learningRepo.createLessonProgress.mockReturnValue({ id: 'prog-1' });
      d.catalogRepo.findModulesByCourse.mockResolvedValue([{ id: 'mod-1' }]);
      d.catalogRepo.countLessonsByModules.mockResolvedValue(totalLessons);
      d.learningRepo.findProgressByEnrollment.mockResolvedValue(log);
      return enrollment;
    }

    it('recomputes the course progress from the log', async () => {
      const d = build();
      const enrollment = wire(d, [
        { lessonId: LESSON, statusConceptId: CONCEPTS.LESSON_COMPLETED },
        { lessonId: 'lesson-2', statusConceptId: CONCEPTS.LESSON_COMPLETED },
      ]);

      const res = await d.service.recordProgress(ENROLLMENT, dto, actor);

      expect(res).toMatchObject({
        completedLessons: 2,
        totalLessons: 4,
        progressPercent: '50.00',
      });
      expect(enrollment.progressPercent).toBe('50.00');
    });

    it('counts a lesson once even if it was annotated several times', async () => {
      const d = build();
      wire(d, [
        { lessonId: LESSON, statusConceptId: CONCEPTS.LESSON_COMPLETED },
        { lessonId: LESSON, statusConceptId: CONCEPTS.LESSON_IN_PROGRESS },
        { lessonId: LESSON, statusConceptId: CONCEPTS.LESSON_COMPLETED },
      ]);

      const res = await d.service.recordProgress(ENROLLMENT, dto, actor);

      expect(res.completedLessons).toBe(1);
    });

    it('uses the newest annotation as the current state of a lesson', async () => {
      const d = build();
      // El log llega del más nuevo al más viejo: la lección quedó en curso.
      wire(d, [
        { lessonId: LESSON, statusConceptId: CONCEPTS.LESSON_IN_PROGRESS },
        { lessonId: LESSON, statusConceptId: CONCEPTS.LESSON_COMPLETED },
      ]);

      const res = await d.service.recordProgress(ENROLLMENT, dto, actor);

      expect(res.completedLessons).toBe(0);
    });

    it('reports zero progress when the course has no published lessons', async () => {
      const d = build();
      wire(d, [], 0);

      const res = await d.service.recordProgress(ENROLLMENT, dto, actor);

      expect(res.progressPercent).toBe('0.00');
    });

    it('refuses to record progress on an expired enrollment', async () => {
      const d = build();
      seedEnrollment(
        d,
        activeEnrollment({ expiresAt: new Date('2020-01-01T00:00:00Z') }),
      );

      await expect(
        d.service.recordProgress(ENROLLMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a cancelled enrollment', async () => {
      const d = build();
      seedEnrollment(
        d,
        activeEnrollment({
          statusConceptId: CONCEPTS.ENROLLMENT_STATE_CANCELLED,
        }),
      );

      await expect(
        d.service.recordProgress(ENROLLMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the lesson does not exist', async () => {
      const d = build();
      seedEnrollment(d, activeEnrollment());
      d.catalogRepo.findLessonById.mockResolvedValue(null);

      await expect(
        d.service.recordProgress(ENROLLMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('startAttempt (UC-47-08)', () => {
    const dto = { enrollmentId: ENROLLMENT };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param assessment - Valor de assessment requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      assessment: Record<string, unknown> = {},
    ) {
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        courseId: COURSE,
        maxAttempts: 3,
        ...assessment,
      });
      d.learningRepo.findEnrollmentById.mockResolvedValue(activeEnrollment());
      d.learningRepo.createAttempt.mockReturnValue({ id: ATTEMPT });
    }

    it('numbers the attempt from the previous maximum', async () => {
      const d = build();
      wire(d);
      d.learningRepo.findAttemptsForUpdate.mockResolvedValue([
        {
          id: 'a-2',
          attemptNumber: 2,
          statusConceptId: CONCEPTS.ATTEMPT_GRADED,
        },
        {
          id: 'a-1',
          attemptNumber: 1,
          statusConceptId: CONCEPTS.ATTEMPT_GRADED,
        },
      ]);

      const res = await d.service.startAttempt(ASSESSMENT, dto, actor);

      expect(res).toMatchObject({ id: ATTEMPT, attemptNumber: 3 });
    });

    it('reports the deadline when the assessment is timed', async () => {
      const d = build();
      wire(d, { timeLimitMinutes: 30 });
      d.learningRepo.findAttemptsForUpdate.mockResolvedValue([]);

      const res = await d.service.startAttempt(ASSESSMENT, dto, actor);

      expect(res.dueAt).toEqual(expect.any(String));
    });

    it('rejects opening a second attempt while one is in progress', async () => {
      const d = build();
      wire(d);
      d.learningRepo.findAttemptsForUpdate.mockResolvedValue([
        {
          id: 'a-1',
          attemptNumber: 1,
          statusConceptId: CONCEPTS.ATTEMPT_IN_PROGRESS,
        },
      ]);

      await expect(
        d.service.startAttempt(ASSESSMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects once the allowed attempts are used up', async () => {
      const d = build();
      wire(d, { maxAttempts: 2 });
      d.learningRepo.findAttemptsForUpdate.mockResolvedValue([
        {
          id: 'a-2',
          attemptNumber: 2,
          statusConceptId: CONCEPTS.ATTEMPT_GRADED,
        },
        {
          id: 'a-1',
          attemptNumber: 1,
          statusConceptId: CONCEPTS.ATTEMPT_GRADED,
        },
      ]);

      await expect(
        d.service.startAttempt(ASSESSMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an enrollment of another course', async () => {
      const d = build();
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        courseId: COURSE,
      });
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        activeEnrollment({ courseId: 'other-course' }),
      );

      await expect(
        d.service.startAttempt(ASSESSMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('submitAttempt (UC-47-09)', () => {
    /**
     * Ejecuta la operación open attempt.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de open attempt conforme al contrato `any`.
     */
    function openAttempt(overrides: Record<string, unknown> = {}): any {
      return {
        id: ATTEMPT,
        assessmentId: ASSESSMENT,
        enrollmentId: ENROLLMENT,
        statusConceptId: CONCEPTS.ATTEMPT_IN_PROGRESS,
        startedAt: new Date(),
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación questions.
     * @returns Resultado de questions conforme al contrato `any[]`.
     */
    function questions(): any[] {
      return [
        { id: 'q-1', points: '1', correctAnswerJson: { value: 'b' } },
        { id: 'q-2', points: '1', correctAnswerJson: { value: true } },
      ];
    }

    it('grades against the stored answers and passes above the threshold', async () => {
      const d = build();
      const attempt = openAttempt();
      seedAttempt(d, attempt);
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        isGraded: true,
        passingScore: '50',
      });
      d.catalogRepo.findQuestionsByAssessment.mockResolvedValue(questions());

      const res = await d.service.submitAttempt(
        ATTEMPT,
        { responsesJson: { 'q-1': { value: 'b' }, 'q-2': { value: false } } },
        actor,
      );

      expect(res).toMatchObject({
        score: '50.00',
        passed: true,
        correctAnswers: 1,
      });
      expect(attempt.statusConceptId).toBe(CONCEPTS.ATTEMPT_GRADED);
    });

    it('fails the attempt below the passing score', async () => {
      const d = build();
      seedAttempt(d, openAttempt());
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        isGraded: true,
        passingScore: '70',
      });
      d.catalogRepo.findQuestionsByAssessment.mockResolvedValue(questions());

      const res = await d.service.submitAttempt(
        ATTEMPT,
        { responsesJson: { 'q-1': { value: 'b' } } },
        actor,
      );

      expect(res.passed).toBe(false);
    });

    it('weights the score by the points of each question', async () => {
      const d = build();
      seedAttempt(d, openAttempt());
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        isGraded: true,
        passingScore: '0',
      });
      d.catalogRepo.findQuestionsByAssessment.mockResolvedValue([
        { id: 'q-1', points: '3', correctAnswerJson: { value: 'a' } },
        { id: 'q-2', points: '1', correctAnswerJson: { value: 'b' } },
      ]);

      const res = await d.service.submitAttempt(
        ATTEMPT,
        { responsesJson: { 'q-1': { value: 'a' } } },
        actor,
      );

      expect(res.score).toBe('75.00');
    });

    it('compares multiple-choice answers as a set, ignoring order', async () => {
      const d = build();
      seedAttempt(d, openAttempt());
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        isGraded: true,
        passingScore: '100',
      });
      d.catalogRepo.findQuestionsByAssessment.mockResolvedValue([
        { id: 'q-1', points: '1', correctAnswerJson: ['a', 'b'] },
      ]);

      const res = await d.service.submitAttempt(
        ATTEMPT,
        { responsesJson: { 'q-1': ['b', 'a'] } },
        actor,
      );

      expect(res).toMatchObject({ score: '100.00', passed: true });
    });

    it('passes an ungraded survey regardless of the answers', async () => {
      const d = build();
      seedAttempt(d, openAttempt());
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        isGraded: false,
      });
      d.catalogRepo.findQuestionsByAssessment.mockResolvedValue([
        { id: 'q-1', points: '1' },
      ]);

      const res = await d.service.submitAttempt(
        ATTEMPT,
        { responsesJson: { 'q-1': 'lo que sea' } },
        actor,
      );

      expect(res.passed).toBe(true);
    });

    it('rejects submitting an attempt that was already graded', async () => {
      const d = build();
      seedAttempt(d, openAttempt({ statusConceptId: CONCEPTS.ATTEMPT_GRADED }));

      await expect(
        d.service.submitAttempt(ATTEMPT, { responsesJson: {} }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an attempt whose time ran out', async () => {
      const d = build();
      seedAttempt(
        d,
        openAttempt({ startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }),
      );
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        isGraded: true,
        timeLimitMinutes: 30,
      });

      await expect(
        d.service.submitAttempt(ATTEMPT, { responsesJson: {} }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('completeEnrollment (UC-47-10)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      overrides: Record<string, unknown> = {},
    ) {
      const enrollment = activeEnrollment(overrides);
      seedEnrollment(d, enrollment);
      d.catalogRepo.findModulesByCourse.mockResolvedValue([{ id: 'mod-1' }]);
      d.catalogRepo.countLessonsByModules.mockResolvedValue(1);
      d.learningRepo.findProgressByEnrollment.mockResolvedValue([
        { lessonId: LESSON, statusConceptId: CONCEPTS.LESSON_COMPLETED },
      ]);
      d.catalogRepo.findGradedAssessments.mockResolvedValue([]);
      d.learningRepo.findPassedAttempts.mockResolvedValue([]);
      return enrollment;
    }

    it('completes the enrollment at full progress', async () => {
      const d = build();
      const enrollment = wire(d);

      const res = await d.service.completeEnrollment(ENROLLMENT, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.ENROLLMENT_STATE_COMPLETED,
        progressPercent: '100.00',
        alreadyCompleted: false,
      });
      expect(enrollment.completedAt).toBeInstanceOf(Date);
    });

    it('is idempotent on an already completed enrollment', async () => {
      const d = build();
      seedEnrollment(
        d,
        activeEnrollment({
          statusConceptId: CONCEPTS.ENROLLMENT_STATE_COMPLETED,
          progressPercent: '100.00',
        }),
      );

      const res = await d.service.completeEnrollment(ENROLLMENT, actor);

      expect(res.alreadyCompleted).toBe(true);
    });

    it('refuses to complete a course still in progress', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.countLessonsByModules.mockResolvedValue(4);

      await expect(
        d.service.completeEnrollment(ENROLLMENT, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to complete with a graded assessment still unpassed', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findGradedAssessments.mockResolvedValue([
        { id: ASSESSMENT },
      ]);
      d.learningRepo.findPassedAttempts.mockResolvedValue([]);

      await expect(
        d.service.completeEnrollment(ENROLLMENT, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('completes when every graded assessment is passed', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findGradedAssessments.mockResolvedValue([
        { id: ASSESSMENT },
      ]);
      d.learningRepo.findPassedAttempts.mockResolvedValue([
        { assessmentId: ASSESSMENT },
      ]);

      const res = await d.service.completeEnrollment(ENROLLMENT, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.ENROLLMENT_STATE_COMPLETED);
    });
  });

  describe('issueCertificate (UC-47-11)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param course - Valor de course requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      course: Record<string, unknown> = {},
    ) {
      seedEnrollment(
        d,
        activeEnrollment({
          statusConceptId: CONCEPTS.ENROLLMENT_STATE_COMPLETED,
        }),
      );
      d.learningRepo.findCertificateByEnrollment.mockResolvedValue(null);
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse(course));
      d.learningRepo.findCertificateByNumber.mockResolvedValue(null);
      d.learningRepo.findCertificateByVerificationCode.mockResolvedValue(null);
      d.learningRepo.createCertificate.mockReturnValue({ id: CERTIFICATE });
    }

    it('issues the certificate with a number and a verification code', async () => {
      const d = build();
      wire(d);

      const res = await d.service.issueCertificate(ENROLLMENT, {}, actor);

      expect(res).toMatchObject({
        id: CERTIFICATE,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
        alreadyIssued: false,
      });
      expect(res.certificateNumber.startsWith('CUR-01-')).toBe(true);
      expect(res.verificationCode).toEqual(expect.any(String));
    });

    it('takes the CME hours from the course, not from the request', async () => {
      const d = build();
      wire(d, { isAccredited: true, cmeCreditHours: '8.00' });

      const res = await d.service.issueCertificate(ENROLLMENT, {}, actor);

      expect(res.cmeCreditsAwarded).toBe('8.00');
    });

    it('awards no CME hours for an unaccredited course', async () => {
      const d = build();
      wire(d, { isAccredited: false, cmeCreditHours: '8.00' });

      const res = await d.service.issueCertificate(ENROLLMENT, {}, actor);

      expect(res.cmeCreditsAwarded).toBeUndefined();
    });

    it('is idempotent: an existing certificate is returned', async () => {
      const d = build();
      wire(d);
      d.learningRepo.findCertificateByEnrollment.mockResolvedValue({
        id: 'cert-prev',
        certificateNumber: 'CUR-01-AAAA',
        verificationCode: 'CODE',
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
      });

      const res = await d.service.issueCertificate(ENROLLMENT, {}, actor);

      expect(res).toMatchObject({ id: 'cert-prev', alreadyIssued: true });
      expect(d.learningRepo.createCertificate).not.toHaveBeenCalled();
    });

    it('refuses to certify an enrollment that is not completed', async () => {
      const d = build();
      seedEnrollment(d, activeEnrollment());

      await expect(
        d.service.issueCertificate(ENROLLMENT, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordCmeCredit (UC-47-12)', () => {
    const dto = { practitionerProfileId: PROFILE };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param certificate - Valor de certificate requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      certificate: Record<string, unknown> = {},
    ) {
      d.learningRepo.findCertificateById.mockResolvedValue({
        id: CERTIFICATE,
        courseId: COURSE,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
        cmeCreditsAwarded: '8.00',
        ...certificate,
      });
      d.learningRepo.findCmeRecord.mockResolvedValue(null);
      d.catalogRepo.findCourseById.mockResolvedValue(
        publishedCourse({ accreditingBodyConceptId: 'body-1' }),
      );
      d.learningRepo.createCmeRecord.mockReturnValue({ id: 'cme-1' });
    }

    it('awards the credit hours declared by the certificate', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordCmeCredit(CERTIFICATE, dto, actor);

      expect(res).toMatchObject({
        id: 'cme-1',
        creditHours: '8.00',
        statusConceptId: CONCEPTS.CME_AWARDED,
        alreadyAwarded: false,
      });
    });

    it('is idempotent for the same certificate and practitioner', async () => {
      const d = build();
      wire(d);
      d.learningRepo.findCmeRecord.mockResolvedValue({
        id: 'cme-prev',
        creditHours: '8.00',
        periodYear: 2026,
        statusConceptId: CONCEPTS.CME_AWARDED,
      });

      const res = await d.service.recordCmeCredit(CERTIFICATE, dto, actor);

      expect(res).toMatchObject({ id: 'cme-prev', alreadyAwarded: true });
      expect(d.learningRepo.createCmeRecord).not.toHaveBeenCalled();
    });

    it('refuses a certificate that awards no credits', async () => {
      const d = build();
      wire(d, { cmeCreditsAwarded: undefined });

      await expect(
        d.service.recordCmeCredit(CERTIFICATE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a revoked certificate', async () => {
      const d = build();
      wire(d, { statusConceptId: CONCEPTS.CERTIFICATE_REVOKED });

      await expect(
        d.service.recordCmeCredit(CERTIFICATE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a course with no accrediting body', async () => {
      const d = build();
      wire(d);
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse());

      await expect(
        d.service.recordCmeCredit(CERTIFICATE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('revokeCertificate (UC-47-14)', () => {
    const dto = { reason: 'Contenido retirado' };

    it('revokes the certificate and reverses its CME records', async () => {
      const d = build();
      const certificate: any = {
        id: CERTIFICATE,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
      };
      seedCertificate(d, certificate);
      const record: any = {
        id: 'cme-1',
        statusConceptId: CONCEPTS.CME_AWARDED,
      };
      d.learningRepo.findCmeRecordsForUpdate.mockResolvedValue([record]);

      const res = await d.service.revokeCertificate(CERTIFICATE, dto, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.CERTIFICATE_REVOKED,
        cmeRecordsReversed: 1,
      });
      expect(certificate.statusConceptId).toBe(CONCEPTS.CERTIFICATE_REVOKED);
      expect(record.statusConceptId).toBe(CONCEPTS.CME_REVERSED);
    });

    it('does not re-reverse a record that was already reversed', async () => {
      const d = build();
      seedCertificate(d, {
        id: CERTIFICATE,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
      });
      d.learningRepo.findCmeRecordsForUpdate.mockResolvedValue([
        { id: 'cme-1', statusConceptId: CONCEPTS.CME_REVERSED },
      ]);

      const res = await d.service.revokeCertificate(CERTIFICATE, dto, actor);

      expect(res.cmeRecordsReversed).toBe(0);
    });

    it('rejects revoking twice', async () => {
      const d = build();
      seedCertificate(d, {
        id: CERTIFICATE,
        statusConceptId: CONCEPTS.CERTIFICATE_REVOKED,
      });

      await expect(
        d.service.revokeCertificate(CERTIFICATE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the certificate does not exist', async () => {
      const d = build();
      seedCertificate(d, null);

      await expect(
        d.service.revokeCertificate(CERTIFICATE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance de tenant (EDU-01)', () => {
    const COURSE_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    /** El curso `COURSE_B` es de T2; cualquier otro es de T1. */
    function foreignCourseB(d: ReturnType<typeof build>) {
      d.catalogRepo.findCourseById.mockImplementation(
        (_tx: unknown, id: string) =>
          Promise.resolve(
            publishedCourse({
              id,
              tenantId: id === COURSE_B ? T2 : T1,
            }),
          ),
      );
    }

    it('correcto: el admin de T1 inscribe en un curso de T1', async () => {
      const d = build();
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });
      const res = await d.service.enrollLearner(
        {
          courseId: COURSE,
          learnerType: 'PRACTITIONER',
          learnerRefId: LEARNER,
          source: 'SELF',
        } as any,
        actor,
      );
      expect(res.id).toBe(ENROLLMENT);
    });

    it('inscribir en un curso de T2 responde 404 uniforme y no crea la inscripción', async () => {
      const d = build();
      foreignCourseB(d);
      await expectOutOfScope(
        d.service.enrollLearner(
          {
            courseId: COURSE_B,
            learnerType: 'PRACTITIONER',
            learnerRefId: LEARNER,
            source: 'SELF',
          } as any,
          actor,
        ),
      );
      expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
    });

    it('una cohorte de T2 responde 404 uniforme (no 422) y no se bloquea', async () => {
      const d = build();
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      d.catalogRepo.findCourseById.mockImplementation(
        (_tx: unknown, id: string) =>
          Promise.resolve(
            publishedCourse({
              id,
              tenantId: id === COURSE_B ? T2 : T1,
            }),
          ),
      );
      d.catalogRepo.findCohortById.mockResolvedValue({
        id: COHORT,
        courseId: COURSE_B,
        statusConceptId: CONCEPTS.COHORT_OPEN,
        capacity: 5,
        enrolledCount: 0,
      });
      await expectOutOfScope(
        d.service.enrollLearner(
          {
            courseId: COURSE,
            cohortId: COHORT,
            learnerType: 'PRACTITIONER',
            learnerRefId: LEARNER,
            source: 'SELF',
          } as any,
          actor,
        ),
      );
      expect(d.catalogRepo.findCohortForUpdate).not.toHaveBeenCalled();
      expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
    });

    it('registrar progreso en una inscripción de T2 no escribe ni recalcula', async () => {
      const d = build();
      const enrollment = activeEnrollment({ courseId: COURSE_B });
      foreignCourseB(d);
      d.learningRepo.findEnrollmentById.mockResolvedValue(enrollment);
      await expectOutOfScope(
        d.service.recordProgress(
          ENROLLMENT,
          { lessonId: LESSON, status: 'COMPLETED' },
          actor,
        ),
      );
      expect(d.learningRepo.findEnrollmentForUpdate).not.toHaveBeenCalled();
      expect(d.learningRepo.createLessonProgress).not.toHaveBeenCalled();
      expect(enrollment.progressPercent).toBe('0');
    });

    it('una lección de otro curso no se registra en la inscripción', async () => {
      const d = build();
      seedEnrollment(d, activeEnrollment());
      d.catalogRepo.findLessonById.mockResolvedValue({
        id: LESSON,
        courseModuleId: 'modulo-de-otro-curso',
      });
      d.catalogRepo.findModulesByCourse.mockResolvedValue([{ id: 'mod-1' }]);
      await expectOutOfScope(
        d.service.recordProgress(
          ENROLLMENT,
          { lessonId: LESSON, status: 'COMPLETED' },
          actor,
        ),
      );
      expect(d.learningRepo.createLessonProgress).not.toHaveBeenCalled();
    });

    it('iniciar un intento sobre una evaluación de T2 no lo crea', async () => {
      const d = build();
      foreignCourseB(d);
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        courseId: COURSE_B,
      });
      await expectOutOfScope(
        d.service.startAttempt(ASSESSMENT, { enrollmentId: ENROLLMENT }, actor),
      );
      expect(d.learningRepo.createAttempt).not.toHaveBeenCalled();
    });

    it('iniciar un intento con una inscripción de T2 no lo crea', async () => {
      const d = build();
      foreignCourseB(d);
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        courseId: COURSE,
      });
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        activeEnrollment({ courseId: COURSE_B }),
      );
      await expectOutOfScope(
        d.service.startAttempt(ASSESSMENT, { enrollmentId: ENROLLMENT }, actor),
      );
      expect(d.learningRepo.createAttempt).not.toHaveBeenCalled();
    });

    it('enviar un intento de T2 no lo califica ni lo bloquea', async () => {
      const d = build();
      foreignCourseB(d);
      const attempt: any = {
        id: ATTEMPT,
        assessmentId: ASSESSMENT,
        enrollmentId: ENROLLMENT,
        statusConceptId: CONCEPTS.ATTEMPT_IN_PROGRESS,
        startedAt: new Date(),
      };
      d.learningRepo.findAttemptById.mockResolvedValue(attempt);
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        activeEnrollment({ courseId: COURSE_B }),
      );
      await expectOutOfScope(
        d.service.submitAttempt(ATTEMPT, { responsesJson: {} }, actor),
      );
      expect(d.learningRepo.findAttemptForUpdate).not.toHaveBeenCalled();
      expect(attempt.statusConceptId).toBe(CONCEPTS.ATTEMPT_IN_PROGRESS);
      expect(attempt.score).toBeUndefined();
    });

    it('completar una inscripción de T2 conserva su estado', async () => {
      const d = build();
      foreignCourseB(d);
      const enrollment = activeEnrollment({ courseId: COURSE_B });
      d.learningRepo.findEnrollmentById.mockResolvedValue(enrollment);
      await expectOutOfScope(d.service.completeEnrollment(ENROLLMENT, actor));
      expect(d.learningRepo.findEnrollmentForUpdate).not.toHaveBeenCalled();
      expect(enrollment.statusConceptId).toBe(CONCEPTS.ENROLLMENT_STATE_ACTIVE);
    });

    it('emitir el certificado de una inscripción de T2 no lo crea', async () => {
      const d = build();
      foreignCourseB(d);
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        activeEnrollment({
          courseId: COURSE_B,
          statusConceptId: CONCEPTS.ENROLLMENT_STATE_COMPLETED,
        }),
      );
      await expectOutOfScope(d.service.issueCertificate(ENROLLMENT, {}, actor));
      expect(d.learningRepo.createCertificate).not.toHaveBeenCalled();
    });

    it('acreditar CME de un certificado de T2 no crea el crédito', async () => {
      const d = build();
      foreignCourseB(d);
      d.learningRepo.findCertificateById.mockResolvedValue({
        id: CERTIFICATE,
        courseId: COURSE_B,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
        cmeCreditsAwarded: '8.00',
      });
      await expectOutOfScope(
        d.service.recordCmeCredit(
          CERTIFICATE,
          { practitionerProfileId: PROFILE },
          actor,
        ),
      );
      expect(d.learningRepo.createCmeRecord).not.toHaveBeenCalled();
    });

    it('revocar el certificado de T2 conserva su estado y sus créditos', async () => {
      const d = build();
      foreignCourseB(d);
      const certificate: any = {
        id: CERTIFICATE,
        courseId: COURSE_B,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
      };
      d.learningRepo.findCertificateById.mockResolvedValue(certificate);
      await expectOutOfScope(
        d.service.revokeCertificate(CERTIFICATE, { reason: 'x' }, actor),
      );
      expect(d.learningRepo.findCertificateForUpdate).not.toHaveBeenCalled();
      expect(d.learningRepo.findCmeRecordsForUpdate).not.toHaveBeenCalled();
      expect(certificate.statusConceptId).toBe(CONCEPTS.CERTIFICATE_ISSUED);
    });

    it('lo ajeno responde igual que lo inexistente', async () => {
      const ajeno = build();
      foreignCourseB(ajeno);
      ajeno.learningRepo.findCertificateById.mockResolvedValue({
        id: CERTIFICATE,
        courseId: COURSE_B,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
      });
      const inexistente = build();
      inexistente.learningRepo.findCertificateById.mockResolvedValue(null);
      const a = await expectOutOfScope(
        ajeno.service.revokeCertificate(CERTIFICATE, { reason: 'x' }, actor),
      );
      const b = await expectOutOfScope(
        inexistente.service.revokeCertificate(
          CERTIFICATE,
          { reason: 'x' },
          actor,
        ),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('el mismo recurso lo opera el admin de su propio tenant', async () => {
      const d = build();
      foreignCourseB(d);
      const certificate: any = {
        id: CERTIFICATE,
        courseId: COURSE_B,
        statusConceptId: CONCEPTS.CERTIFICATE_ISSUED,
      };
      seedCertificate(d, certificate);
      d.learningRepo.findCmeRecordsForUpdate.mockResolvedValue([]);
      await inTenant(d.raw, T2).revokeCertificate(
        CERTIFICATE,
        { reason: 'x' },
        actor,
      );
      expect(certificate.statusConceptId).toBe(CONCEPTS.CERTIFICATE_REVOKED);
    });

    it('sin tenant en el contexto no se lee nada', async () => {
      const d = build();
      await expect(
        d.raw.completeEnrollment(ENROLLMENT, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.learningRepo.findEnrollmentById).not.toHaveBeenCalled();
    });
  });

  describe('el LEARNER anclado a su identidad (EDU-02)', () => {
    const OTHER_LEARNER = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const learner = {
      id: 'user-learner',
      roles: ['LEARNER'],
      patientProfileId: LEARNER,
      practitionerProfileId: PROFILE,
    } as any;

    /** Inscripción de paciente del aprendiz `ref`. */
    function patientEnrollment(ref: string, overrides = {}) {
      return activeEnrollment({
        learnerTypeConceptId: CONCEPTS.LEARNER_PATIENT,
        learnerRefId: ref,
        ...overrides,
      });
    }

    it('correcto: el alumno inicia y entrega su propio intento', async () => {
      const d = build();
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        courseId: COURSE,
        maxAttempts: 3,
        isGraded: true,
        passingScore: '0',
      });
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        patientEnrollment(LEARNER),
      );
      d.learningRepo.findAttemptsForUpdate.mockResolvedValue([]);
      d.learningRepo.createAttempt.mockReturnValue({ id: ATTEMPT });
      const started = await d.service.startAttempt(
        ASSESSMENT,
        { enrollmentId: ENROLLMENT },
        learner,
      );
      expect(started.id).toBe(ATTEMPT);

      const attempt: any = {
        id: ATTEMPT,
        assessmentId: ASSESSMENT,
        enrollmentId: ENROLLMENT,
        statusConceptId: CONCEPTS.ATTEMPT_IN_PROGRESS,
        startedAt: new Date(),
      };
      seedAttempt(d, attempt);
      d.catalogRepo.findQuestionsByAssessment.mockResolvedValue([]);
      const graded = await d.service.submitAttempt(
        ATTEMPT,
        { responsesJson: {} },
        learner,
      );
      expect(graded.statusConceptId).toBe(CONCEPTS.ATTEMPT_GRADED);
    });

    it('límite: el alumno se inscribe sin declarar learnerRefId y se deriva su perfil', async () => {
      const d = build();
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });
      await d.service.enrollLearner(
        { courseId: COURSE, learnerType: 'PATIENT', source: 'SELF' } as any,
        learner,
      );
      expect(d.learningRepo.createEnrollment).toHaveBeenCalledTimes(1);
      expect(d.learningRepo.createEnrollment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ learnerRefId: LEARNER }),
      );
      expect(d.learningRepo.findLiveEnrollment).toHaveBeenCalledWith(
        d.tx,
        COURSE,
        CONCEPTS.LEARNER_PATIENT,
        LEARNER,
        expect.anything(),
      );
    });

    it('límite: un perfil profesional o el propio usuario también se derivan', async () => {
      const d = build();
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });
      await d.service.enrollLearner(
        {
          courseId: COURSE,
          learnerType: 'PRACTITIONER',
          source: 'SELF',
        } as any,
        learner,
      );
      await d.service.enrollLearner(
        { courseId: COURSE, learnerType: 'USER', source: 'SELF' } as any,
        learner,
      );
      const refs = d.learningRepo.createEnrollment.mock.calls.map(
        (c: any[]) => c[1].learnerRefId,
      );
      expect(refs).toEqual([PROFILE, learner.id]);
    });

    it('falla catalogada: el alumno A inscribe a B → 403 LEARNER_ENROLLMENT_OWNER_REQUIRED', async () => {
      const d = build();
      const error: any = await d.service
        .enrollLearner(
          {
            courseId: COURSE,
            learnerType: 'PATIENT',
            learnerRefId: OTHER_LEARNER,
            source: 'SELF',
          } as any,
          learner,
        )
        .catch((e: unknown) => e);
      expect(error.getStatus()).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.reason).toBe(
        EducationErrorReason.LEARNER_ENROLLMENT_OWNER_REQUIRED,
      );
      expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
    });

    it('un alumno sin el perfil que declara no puede inscribirse con ese tipo', async () => {
      const d = build();
      await expect(
        d.service.enrollLearner(
          { courseId: COURSE, learnerType: 'PATIENT', source: 'SELF' } as any,
          { id: 'u', roles: ['LEARNER'] } as any,
        ),
      ).rejects.toMatchObject({
        status: 403,
        reason: EducationErrorReason.LEARNER_ENROLLMENT_OWNER_REQUIRED,
      });
      expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
    });

    it('error: el alumno A usa la inscripción de B → 404 y no registra progreso', async () => {
      const d = build();
      const other = patientEnrollment(OTHER_LEARNER);
      d.learningRepo.findEnrollmentById.mockResolvedValue(other);
      await expectOutOfScope(
        d.service.recordProgress(
          ENROLLMENT,
          { lessonId: LESSON, status: 'COMPLETED' },
          learner,
        ),
      );
      expect(d.learningRepo.findEnrollmentForUpdate).not.toHaveBeenCalled();
      expect(d.learningRepo.createLessonProgress).not.toHaveBeenCalled();
      expect(other.progressPercent).toBe('0');
    });

    it('error: el alumno A no inicia un intento sobre la inscripción de B', async () => {
      const d = build();
      d.catalogRepo.findAssessmentById.mockResolvedValue({
        id: ASSESSMENT,
        courseId: COURSE,
      });
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        patientEnrollment(OTHER_LEARNER),
      );
      await expectOutOfScope(
        d.service.startAttempt(
          ASSESSMENT,
          { enrollmentId: ENROLLMENT },
          learner,
        ),
      );
      expect(d.learningRepo.createAttempt).not.toHaveBeenCalled();
    });

    it('error: el alumno A no entrega el intento de B ni cambia su calificación', async () => {
      const d = build();
      const attempt: any = {
        id: ATTEMPT,
        assessmentId: ASSESSMENT,
        enrollmentId: ENROLLMENT,
        statusConceptId: CONCEPTS.ATTEMPT_IN_PROGRESS,
        startedAt: new Date(),
      };
      d.learningRepo.findAttemptById.mockResolvedValue(attempt);
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        patientEnrollment(OTHER_LEARNER),
      );
      await expectOutOfScope(
        d.service.submitAttempt(ATTEMPT, { responsesJson: {} }, learner),
      );
      expect(attempt.statusConceptId).toBe(CONCEPTS.ATTEMPT_IN_PROGRESS);
      expect(attempt.score).toBeUndefined();
      expect(d.learningRepo.findAttemptForUpdate).not.toHaveBeenCalled();
    });

    it('error: el alumno A no completa la inscripción de B', async () => {
      const d = build();
      const other = patientEnrollment(OTHER_LEARNER);
      d.learningRepo.findEnrollmentById.mockResolvedValue(other);
      await expectOutOfScope(d.service.completeEnrollment(ENROLLMENT, learner));
      expect(other.statusConceptId).toBe(CONCEPTS.ENROLLMENT_STATE_ACTIVE);
    });

    it('la inscripción de otra persona responde igual que una inexistente', async () => {
      const ajena = build();
      ajena.learningRepo.findEnrollmentById.mockResolvedValue(
        patientEnrollment(OTHER_LEARNER),
      );
      const inexistente = build();
      inexistente.learningRepo.findEnrollmentById.mockResolvedValue(null);
      const a = await expectOutOfScope(
        ajena.service.completeEnrollment(ENROLLMENT, learner),
      );
      const b = await expectOutOfScope(
        inexistente.service.completeEnrollment(ENROLLMENT, learner),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('una inscripción de tipo USER solo la opera ese usuario', async () => {
      const d = build();
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        activeEnrollment({
          learnerTypeConceptId: CONCEPTS.LEARNER_USER,
          learnerRefId: 'otro-usuario',
        }),
      );
      await expectOutOfScope(d.service.completeEnrollment(ENROLLMENT, learner));
    });

    it('una inscripción de tipo desconocido nunca habilita a un alumno', async () => {
      const d = build();
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        activeEnrollment({ learnerTypeConceptId: 'concepto-desconocido' }),
      );
      await expectOutOfScope(d.service.completeEnrollment(ENROLLMENT, learner));
    });

    it('la vía administrativa se conserva: EDUCATION_ADMIN inscribe a un tercero explícito', async () => {
      const d = build();
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });
      await d.service.enrollLearner(
        {
          courseId: COURSE,
          learnerType: 'PATIENT',
          learnerRefId: OTHER_LEARNER,
          source: 'ASSIGNED',
        } as any,
        actor,
      );
      expect(d.learningRepo.createEnrollment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ learnerRefId: OTHER_LEARNER }),
      );
    });

    it('el administrador debe indicar a quién inscribe', async () => {
      const d = build();
      await expect(
        d.service.enrollLearner(
          {
            courseId: COURSE,
            learnerType: 'PATIENT',
            source: 'ASSIGNED',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.learningRepo.createEnrollment).not.toHaveBeenCalled();
    });

    it('un actor con LEARNER y EDUCATION_ADMIN conserva la vía administrativa', async () => {
      const d = build();
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        patientEnrollment(OTHER_LEARNER),
      );
      seedEnrollment(d, patientEnrollment(OTHER_LEARNER));
      d.catalogRepo.findModulesByCourse.mockResolvedValue([]);
      d.catalogRepo.countLessonsByModules.mockResolvedValue(0);
      d.learningRepo.findProgressByEnrollment.mockResolvedValue([]);
      await expect(
        d.service.completeEnrollment(ENROLLMENT, {
          id: 'u',
          roles: ['LEARNER', 'EDUCATION_ADMIN'],
        } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un worker SYSTEM completa la inscripción de cualquier alumno del tenant', async () => {
      const d = build();
      const enrollment = patientEnrollment(OTHER_LEARNER);
      seedEnrollment(d, enrollment);
      d.catalogRepo.findModulesByCourse.mockResolvedValue([{ id: 'mod-1' }]);
      d.catalogRepo.countLessonsByModules.mockResolvedValue(1);
      d.learningRepo.findProgressByEnrollment.mockResolvedValue([
        { lessonId: LESSON, statusConceptId: CONCEPTS.LESSON_COMPLETED },
      ]);
      d.catalogRepo.findGradedAssessments.mockResolvedValue([]);
      d.learningRepo.findPassedAttempts.mockResolvedValue([]);
      const res = await d.service.completeEnrollment(ENROLLMENT, {
        id: 'worker',
        roles: ['SYSTEM'],
      } as any);
      expect(res.statusConceptId).toBe(CONCEPTS.ENROLLMENT_STATE_COMPLETED);
    });

    it('un rol EDUCATION_ADMIN acotado a otro tenant no da la vía administrativa en este', async () => {
      const d = build();
      const adminElsewhere = {
        ...learner,
        roles: ['LEARNER', 'EDUCATION_ADMIN'],
        scopedRoles: { [T2]: ['EDUCATION_ADMIN'] },
      };
      d.learningRepo.findEnrollmentById.mockResolvedValue(
        patientEnrollment(OTHER_LEARNER),
      );
      await expectOutOfScope(
        d.service.completeEnrollment(ENROLLMENT, adminElsewhere),
      );
      expect(d.learningRepo.findEnrollmentForUpdate).not.toHaveBeenCalled();
    });
  });
});
