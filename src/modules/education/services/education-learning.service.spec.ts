import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { EducationLearningService } from './education-learning.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['EDUCATION_ADMIN'] };
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

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const learningRepo = {
    createEnrollment: mockFn(),
    findEnrollmentById: mockFn(),
    findEnrollmentForUpdate: mockFn(),
    findLiveEnrollment: mockFn(),
    createLessonProgress: mockFn(),
    findProgressByEnrollment: mockFn(),
    createAttempt: mockFn(),
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
    findCohortForUpdate: mockFn(),
    findModulesByCourse: mockFn(),
    findLessonById: mockFn(),
    countLessonsByModules: mockFn(),
    findAssessmentById: mockFn(),
    findGradedAssessments: mockFn(),
    findQuestionsByAssessment: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new EducationLearningService(
    em as any,
    learningRepo,
    catalogRepo as any,
    logger as any,
  );
  return { service, tx, learningRepo, catalogRepo, logger };
}

function publishedCourse(overrides: Record<string, unknown> = {}): any {
  return {
    id: COURSE,
    statusConceptId: CONCEPTS.COURSE_PUBLISHED,
    code: 'CUR-01',
    ...overrides,
  };
}

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

describe('EducationLearningService', () => {
  describe('enrollLearner (UC-47-05)', () => {
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
      d.catalogRepo.findCohortForUpdate.mockResolvedValue(cohort);
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
      d.catalogRepo.findCohortForUpdate.mockResolvedValue({
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
      d.learningRepo.createEnrollment.mockReturnValue({ id: ENROLLMENT });

      const res = await d.service.enrollLearner(
        dto({ source: 'PURCHASED' as const, paymentIntentId: INTENT }),
        actor,
      );

      expect(res.id).toBe(ENROLLMENT);
    });

    it('refuses a cohort that belongs to another course', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(publishedCourse());
      d.learningRepo.findLiveEnrollment.mockResolvedValue(null);
      d.catalogRepo.findCohortForUpdate.mockResolvedValue({
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

    function wire(
      d: ReturnType<typeof build>,
      log: any[] = [],
      totalLessons = 4,
    ) {
      const enrollment = activeEnrollment();
      d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(enrollment);
      d.catalogRepo.findLessonById.mockResolvedValue({ id: LESSON });
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
      d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(
        activeEnrollment({ expiresAt: new Date('2020-01-01T00:00:00Z') }),
      );

      await expect(
        d.service.recordProgress(ENROLLMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a cancelled enrollment', async () => {
      const d = build();
      d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(
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
      d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(
        activeEnrollment(),
      );
      d.catalogRepo.findLessonById.mockResolvedValue(null);

      await expect(
        d.service.recordProgress(ENROLLMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('startAttempt (UC-47-08)', () => {
    const dto = { enrollmentId: ENROLLMENT };

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

    function questions(): any[] {
      return [
        { id: 'q-1', points: '1', correctAnswerJson: { value: 'b' } },
        { id: 'q-2', points: '1', correctAnswerJson: { value: true } },
      ];
    }

    it('grades against the stored answers and passes above the threshold', async () => {
      const d = build();
      const attempt = openAttempt();
      d.learningRepo.findAttemptForUpdate.mockResolvedValue(attempt);
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
      d.learningRepo.findAttemptForUpdate.mockResolvedValue(openAttempt());
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
      d.learningRepo.findAttemptForUpdate.mockResolvedValue(openAttempt());
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
      d.learningRepo.findAttemptForUpdate.mockResolvedValue(openAttempt());
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
      d.learningRepo.findAttemptForUpdate.mockResolvedValue(openAttempt());
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
      d.learningRepo.findAttemptForUpdate.mockResolvedValue(
        openAttempt({ statusConceptId: CONCEPTS.ATTEMPT_GRADED }),
      );

      await expect(
        d.service.submitAttempt(ATTEMPT, { responsesJson: {} }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an attempt whose time ran out', async () => {
      const d = build();
      d.learningRepo.findAttemptForUpdate.mockResolvedValue(
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
    function wire(
      d: ReturnType<typeof build>,
      overrides: Record<string, unknown> = {},
    ) {
      const enrollment = activeEnrollment(overrides);
      d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(enrollment);
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
      d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(
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
    function wire(
      d: ReturnType<typeof build>,
      course: Record<string, unknown> = {},
    ) {
      d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(
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
      d.learningRepo.findEnrollmentForUpdate.mockResolvedValue(
        activeEnrollment(),
      );

      await expect(
        d.service.issueCertificate(ENROLLMENT, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordCmeCredit (UC-47-12)', () => {
    const dto = { practitionerProfileId: PROFILE };

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
      d.learningRepo.findCertificateForUpdate.mockResolvedValue(certificate);
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
      d.learningRepo.findCertificateForUpdate.mockResolvedValue({
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
      d.learningRepo.findCertificateForUpdate.mockResolvedValue({
        id: CERTIFICATE,
        statusConceptId: CONCEPTS.CERTIFICATE_REVOKED,
      });

      await expect(
        d.service.revokeCertificate(CERTIFICATE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the certificate does not exist', async () => {
      const d = build();
      d.learningRepo.findCertificateForUpdate.mockResolvedValue(null);

      await expect(
        d.service.revokeCertificate(CERTIFICATE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
