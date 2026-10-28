import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { EducationCatalogService } from './education-catalog.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { EducationScopeService } from './education-scope.service';
import { T1, T2, expectOutOfScope, inTenant } from './education.testing';

const actor = { id: 'user-1', roles: ['EDUCATION_ADMIN'] };
const COURSE = '11111111-1111-1111-1111-111111111111';
const MODULE = '22222222-2222-2222-2222-222222222222';
const PROFILE = '33333333-3333-3333-3333-333333333333';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const catalogRepo = {
    createCourse: mockFn(),
    findCourseById: mockFn(),
    findCourseForUpdate: mockFn(),
    findCourseByCode: mockFn(),
    createModule: mockFn(),
    createLesson: mockFn(),
    findModulesByCourse: mockFn(),
    findLessonById: mockFn(),
    countLessonsByModules: mockFn(),
    createVersion: mockFn(),
    findVersion: mockFn(),
    createInstructor: mockFn(),
    findInstructorByProfile: mockFn(),
    createCourseInstructor: mockFn(),
    findCourseInstructors: mockFn(),
    createCohort: mockFn(),
    findCohortByCode: mockFn(),
    findCohortById: mockFn(),
    findCohortForUpdate: mockFn(),
    createAssessment: mockFn(),
    findAssessmentById: mockFn(),
    findGradedAssessments: mockFn(),
    createQuestion: mockFn(),
    findQuestionsByAssessment: mockFn(),
    createReview: mockFn(),
    findReviewByReviewer: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = new EducationScopeService(catalogRepo as any, {} as any);
  const raw = new EducationCatalogService(
    em as any,
    catalogRepo,
    scope,
    logger as any,
  );
  return { raw, service: inTenant(raw), tx, catalogRepo };
}

/**
 * Ejecuta la operación course dto.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de course dto conforme al contrato `any`.
 */
function courseDto(overrides: Record<string, unknown> = {}): any {
  return {
    code: 'CUR-01',
    title: 'Reanimación básica',
    courseType: 'SELF_PACED' as const,
    modules: [
      {
        title: 'Módulo 1',
        lessons: [
          {
            title: 'Intro',
            contentType: 'VIDEO' as const,
            durationMinutes: 10,
          },
          {
            title: 'Práctica',
            contentType: 'ARTICLE' as const,
            durationMinutes: 20,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('EducationCatalogService', () => {
  describe('publishCourse (UC-47-01)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.catalogRepo.findCourseByCode.mockResolvedValue(null);
      d.catalogRepo.createCourse.mockReturnValue({ id: COURSE });
      d.catalogRepo.createModule.mockReturnValue({ id: MODULE });
    }

    it('creates the course published with its module tree', async () => {
      const d = build();
      wire(d);

      const res = await d.service.publishCourse(courseDto(), actor);

      expect(res).toMatchObject({
        id: COURSE,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
        currentVersion: 1,
        moduleIds: [MODULE],
        lessons: 2,
      });
    });

    it('derives the duration from the lessons', async () => {
      const d = build();
      wire(d);

      const res = await d.service.publishCourse(courseDto(), actor);

      expect(res.durationMinutes).toBe(30);
    });

    it('records version 1 alongside the course', async () => {
      const d = build();
      wire(d);

      await d.service.publishCourse(courseDto(), actor);

      expect(d.catalogRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ version: 1 }),
      );
    });

    it('numbers modules and lessons in the order received', async () => {
      const d = build();
      wire(d);

      await d.service.publishCourse(courseDto(), actor);

      expect(d.catalogRepo.createModule.mock.calls[0][1].ordinal).toBe(1);
      expect(d.catalogRepo.createLesson.mock.calls[0][1].ordinal).toBe(1);
      expect(d.catalogRepo.createLesson.mock.calls[1][1].ordinal).toBe(2);
    });

    it('rejects a duplicate course code', async () => {
      const d = build();
      d.catalogRepo.findCourseByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.publishCourse(courseDto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to accredit a course without declaring its CME hours', async () => {
      const d = build();
      d.catalogRepo.findCourseByCode.mockResolvedValue(null);

      await expect(
        d.service.publishCourse(
          courseDto({ isAccredited: true }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('publishVersion (UC-47-02)', () => {
    it('derives the version from the current one and repoints the course', async () => {
      const d = build();
      const course: any = {
        id: COURSE,
        tenantId: T1,
        currentVersion: 3,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
      };
      d.catalogRepo.findCourseById.mockResolvedValue(course);
      d.catalogRepo.findCourseForUpdate.mockResolvedValue(course);
      d.catalogRepo.findVersion.mockResolvedValue(null);
      d.catalogRepo.createVersion.mockReturnValue({ id: 'ver-4' });

      const res = await d.service.publishVersion(COURSE, {}, actor);

      expect(res).toMatchObject({ id: 'ver-4', version: 4 });
      expect(course.currentVersion).toBe(4);
    });

    it('rejects a version number that already exists', async () => {
      const d = build();
      const course = {
        id: COURSE,
        tenantId: T1,
        currentVersion: 1,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
      };
      d.catalogRepo.findCourseById.mockResolvedValue(course);
      d.catalogRepo.findCourseForUpdate.mockResolvedValue(course);
      d.catalogRepo.findVersion.mockResolvedValue({ id: 'ver-2' });

      await expect(
        d.service.publishVersion(COURSE, {}, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to version an archived course', async () => {
      const d = build();
      const course = {
        id: COURSE,
        tenantId: T1,
        currentVersion: 1,
        statusConceptId: CONCEPTS.COURSE_ARCHIVED,
      };
      d.catalogRepo.findCourseById.mockResolvedValue(course);
      d.catalogRepo.findCourseForUpdate.mockResolvedValue(course);

      await expect(
        d.service.publishVersion(COURSE, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the course does not exist', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(null);

      await expect(
        d.service.publishVersion(COURSE, {}, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('assignInstructor (UC-47-03)', () => {
    const dto = {
      practitionerProfileId: PROFILE,
      displayName: 'Dra. Pérez',
      role: 'LEAD' as const,
    };

    it('creates the instructor record and assigns it', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.findInstructorByProfile.mockResolvedValue(null);
      d.catalogRepo.createInstructor.mockReturnValue({ id: 'inst-1' });
      d.catalogRepo.findCourseInstructors.mockResolvedValue([]);
      d.catalogRepo.createCourseInstructor.mockReturnValue({ id: 'ci-1' });

      const res = await d.service.assignInstructor(COURSE, dto, actor);

      expect(res).toEqual({
        instructorId: 'inst-1',
        courseInstructorId: 'ci-1',
        instructorExisted: false,
        ordinal: 1,
      });
    });

    it('reuses the instructor record of a profile that already teaches', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.findInstructorByProfile.mockResolvedValue({
        id: 'inst-existing',
      });
      d.catalogRepo.findCourseInstructors.mockResolvedValue([]);
      d.catalogRepo.createCourseInstructor.mockReturnValue({ id: 'ci-1' });

      const res = await d.service.assignInstructor(COURSE, dto, actor);

      expect(res.instructorExisted).toBe(true);
      expect(d.catalogRepo.createInstructor).not.toHaveBeenCalled();
    });

    it('rejects assigning the same instructor twice', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.findInstructorByProfile.mockResolvedValue({ id: 'inst-1' });
      d.catalogRepo.findCourseInstructors.mockResolvedValue([
        { instructorId: 'inst-1' },
      ]);

      await expect(
        d.service.assignInstructor(COURSE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a second lead instructor', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.findInstructorByProfile.mockResolvedValue(null);
      d.catalogRepo.createInstructor.mockReturnValue({ id: 'inst-2' });
      d.catalogRepo.findCourseInstructors.mockResolvedValue([
        { instructorId: 'inst-1', roleConceptId: CONCEPTS.INSTRUCTOR_LEAD },
      ]);

      await expect(
        d.service.assignInstructor(COURSE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('accepts a co-instructor alongside the lead', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.findInstructorByProfile.mockResolvedValue(null);
      d.catalogRepo.createInstructor.mockReturnValue({ id: 'inst-2' });
      d.catalogRepo.findCourseInstructors.mockResolvedValue([
        { instructorId: 'inst-1', roleConceptId: CONCEPTS.INSTRUCTOR_LEAD },
      ]);
      d.catalogRepo.createCourseInstructor.mockReturnValue({ id: 'ci-2' });

      const res = await d.service.assignInstructor(
        COURSE,
        { ...dto, role: 'CO' as const },
        actor,
      );

      expect(res.ordinal).toBe(2);
    });
  });

  describe('openCohort (UC-47-04)', () => {
    const dto = {
      code: 'C-2026-1',
      deliveryMode: 'ONLINE' as const,
      capacity: 30,
    };

    it('opens the cohort with its enrolled counter at zero', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
      });
      d.catalogRepo.findCohortByCode.mockResolvedValue(null);
      d.catalogRepo.createCohort.mockReturnValue({ id: 'cohort-1' });

      const res = await d.service.openCohort(COURSE, dto, actor);

      expect(res).toEqual({
        id: 'cohort-1',
        code: 'C-2026-1',
        statusConceptId: CONCEPTS.COHORT_OPEN,
      });
    });

    it('rejects a duplicate cohort code in the course', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
      });
      d.catalogRepo.findCohortByCode.mockResolvedValue({
        id: 'cohort-existing',
      });

      await expect(
        d.service.openCohort(COURSE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to open a cohort on an unpublished course', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
        statusConceptId: CONCEPTS.COURSE_DRAFT,
      });

      await expect(
        d.service.openCohort(COURSE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an inverted date range', async () => {
      const d = build();

      await expect(
        d.service.openCohort(
          COURSE,
          { ...dto, startDate: '2026-09-01', endDate: '2026-08-01' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createAssessment (UC-47-07)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        title: 'Examen final',
        assessmentType: 'EXAM' as const,
        passingScore: '70',
        questions: [
          {
            questionType: 'SINGLE_CHOICE' as const,
            promptText: '¿Cuál es la frecuencia?',
            correctAnswerJson: { value: 'b' },
            points: '2',
          },
          {
            questionType: 'TRUE_FALSE' as const,
            promptText: '¿Es cierto?',
            correctAnswerJson: { value: true },
          },
        ],
        ...overrides,
      };
    }

    it('creates the assessment and sums the question points', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.createAssessment.mockReturnValue({ id: 'assess-1' });
      let n = 0;
      d.catalogRepo.createQuestion.mockImplementation(() => ({
        id: `q-${++n}`,
      }));

      const res = await d.service.createAssessment(COURSE, dto(), actor);

      expect(res).toMatchObject({
        id: 'assess-1',
        questionIds: ['q-1', 'q-2'],
        totalPoints: '3.00',
      });
    });

    it('refuses a graded assessment with a question lacking its answer', async () => {
      const d = build();

      await expect(
        d.service.createAssessment(
          COURSE,
          dto({
            questions: [
              {
                questionType: 'SHORT_ANSWER' as const,
                promptText: '¿Por qué?',
              },
            ],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts an ungraded survey with no correct answers', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.createAssessment.mockReturnValue({ id: 'assess-1' });
      d.catalogRepo.createQuestion.mockReturnValue({ id: 'q-1' });

      const res = await d.service.createAssessment(
        COURSE,
        dto({
          assessmentType: 'SURVEY' as const,
          isGraded: false,
          questions: [
            {
              questionType: 'SHORT_ANSWER' as const,
              promptText: '¿Qué opinas?',
            },
          ],
        }),
        actor,
      );

      expect(res.questionIds).toEqual(['q-1']);
    });

    it('refuses a module that belongs to another course', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.findModulesByCourse.mockResolvedValue([
        { id: 'other-module' },
      ]);

      await expect(
        d.service.createAssessment(
          COURSE,
          dto({ courseModuleId: MODULE }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createReview (UC-47-13)', () => {
    const dto = { rating: 5, reviewText: 'Muy claro' };

    it('publishes the review attributed to the authenticated user', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.findReviewByReviewer.mockResolvedValue(null);
      d.catalogRepo.createReview.mockReturnValue({ id: 'review-1' });

      const res = await d.service.createReview(COURSE, dto, actor);

      expect(res).toMatchObject({ id: 'review-1', rating: 5 });
      expect(d.catalogRepo.createReview).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ reviewerRefId: actor.id }),
      );
    });

    it('rejects a second review from the same author', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        id: COURSE,
        tenantId: T1,
      });
      d.catalogRepo.findReviewByReviewer.mockResolvedValue({
        id: 'review-prev',
      });

      await expect(
        d.service.createReview(COURSE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the course does not exist', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue(null);

      await expect(
        d.service.createReview(COURSE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance de tenant (EDU-01)', () => {
    const foreignCourse = {
      id: COURSE,
      tenantId: T2,
      currentVersion: 1,
      statusConceptId: CONCEPTS.COURSE_PUBLISHED,
    };

    it('correcto: el admin de T1 publica el curso en T1 aunque el cuerpo omita el tenant', async () => {
      const d = build();
      d.catalogRepo.findCourseByCode.mockResolvedValue(null);
      d.catalogRepo.createCourse.mockReturnValue({ id: COURSE });
      d.catalogRepo.createModule.mockReturnValue({ id: MODULE });
      await d.service.publishCourse(courseDto(), actor);
      expect(d.catalogRepo.createCourse).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: T1 }),
      );
    });

    it('rechaza un tenantId del cuerpo distinto del activo y no crea nada', async () => {
      const d = build();
      await expectOutOfScope(
        d.service.publishCourse(courseDto({ tenantId: T2 }), actor),
      );
      expect(d.catalogRepo.createCourse).not.toHaveBeenCalled();
    });

    it('publicar una versión de un curso de T2 responde 404 y no lo bloquea ni lo cambia', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({ ...foreignCourse });
      await expectOutOfScope(d.service.publishVersion(COURSE, {}, actor));
      expect(d.catalogRepo.findCourseForUpdate).not.toHaveBeenCalled();
      expect(d.catalogRepo.createVersion).not.toHaveBeenCalled();
    });

    it('un curso ajeno responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.catalogRepo.findCourseById.mockResolvedValue({ ...foreignCourse });
      const inexistente = build();
      inexistente.catalogRepo.findCourseById.mockResolvedValue(null);
      const a = await expectOutOfScope(
        ajeno.service.publishVersion(COURSE, {}, actor),
      );
      const b = await expectOutOfScope(
        inexistente.service.publishVersion(COURSE, {}, actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('un curso sin tenant tampoco se muta desde un tenant', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        ...foreignCourse,
        tenantId: undefined,
      });
      await expectOutOfScope(d.service.publishVersion(COURSE, {}, actor));
      expect(d.catalogRepo.createVersion).not.toHaveBeenCalled();
    });

    it('asignar instructor a un curso de T2 no crea ficha ni asignación', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({ ...foreignCourse });
      await expectOutOfScope(
        d.service.assignInstructor(
          COURSE,
          { practitionerProfileId: PROFILE, role: 'LEAD' } as any,
          actor,
        ),
      );
      expect(d.catalogRepo.createInstructor).not.toHaveBeenCalled();
      expect(d.catalogRepo.createCourseInstructor).not.toHaveBeenCalled();
    });

    it('la ficha de instructor se busca dentro del tenant del curso', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({
        ...foreignCourse,
        tenantId: T1,
      });
      d.catalogRepo.findInstructorByProfile.mockResolvedValue(null);
      d.catalogRepo.createInstructor.mockReturnValue({ id: 'inst-1' });
      d.catalogRepo.findCourseInstructors.mockResolvedValue([]);
      d.catalogRepo.createCourseInstructor.mockReturnValue({ id: 'ci-1' });
      await d.service.assignInstructor(
        COURSE,
        { practitionerProfileId: PROFILE, role: 'LEAD' } as any,
        actor,
      );
      expect(d.catalogRepo.findInstructorByProfile).toHaveBeenCalledWith(
        d.tx,
        PROFILE,
        T1,
      );
    });

    it('abrir una cohorte en un curso de T2 no escribe', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({ ...foreignCourse });
      await expectOutOfScope(
        d.service.openCohort(
          COURSE,
          { code: 'C', deliveryMode: 'ONLINE', capacity: 5 } as any,
          actor,
        ),
      );
      expect(d.catalogRepo.createCohort).not.toHaveBeenCalled();
    });

    it('crear una evaluación en un curso de T2 no crea preguntas', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({ ...foreignCourse });
      await expectOutOfScope(
        d.service.createAssessment(
          COURSE,
          {
            title: 'Examen',
            assessmentType: 'EXAM',
            passingScore: '70',
            questions: [
              {
                questionType: 'TRUE_FALSE',
                promptText: '¿?',
                correctAnswerJson: { value: true },
              },
            ],
          } as any,
          actor,
        ),
      );
      expect(d.catalogRepo.createAssessment).not.toHaveBeenCalled();
      expect(d.catalogRepo.createQuestion).not.toHaveBeenCalled();
    });

    it('reseñar un curso de T2 no crea la reseña', async () => {
      const d = build();
      d.catalogRepo.findCourseById.mockResolvedValue({ ...foreignCourse });
      await expectOutOfScope(
        d.service.createReview(COURSE, { rating: 5 } as any, actor),
      );
      expect(d.catalogRepo.createReview).not.toHaveBeenCalled();
    });

    it('el admin de T2 sí opera su propio curso', async () => {
      const d = build();
      const course = { ...foreignCourse };
      d.catalogRepo.findCourseById.mockResolvedValue(course);
      d.catalogRepo.findCourseForUpdate.mockResolvedValue(course);
      d.catalogRepo.findVersion.mockResolvedValue(null);
      d.catalogRepo.createVersion.mockReturnValue({ id: 'ver-2' });
      const res = await inTenant(d.raw, T2).publishVersion(COURSE, {}, actor);
      expect(res.version).toBe(2);
    });

    it('sin tenant en el contexto no se lee ni se escribe nada', async () => {
      const d = build();
      await expect(
        d.raw.publishVersion(COURSE, {}, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.catalogRepo.findCourseById).not.toHaveBeenCalled();
    });
  });
});
