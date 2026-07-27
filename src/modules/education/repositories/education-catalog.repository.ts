import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Courses,
  CourseModules,
  Lessons,
  CourseVersions,
  Instructors,
  CourseInstructors,
  CourseCohorts,
  Assessments,
  AssessmentQuestions,
  CourseReviews,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateCourseData {
  tenantId?: string;
  code: string;
  title: string;
  description?: string;
  courseTypeConceptId: string;
  specialtyConceptId?: string;
  levelConceptId?: string;
  languageConceptId?: string;
  isAccredited: boolean;
  cmeCreditHours?: string;
  accreditingBodyConceptId?: string;
  price?: string;
  currencyConceptId?: string;
  durationMinutes?: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateAssessmentData {
  courseId: string;
  courseModuleId?: string;
  title: string;
  assessmentTypeConceptId: string;
  passingScore?: string;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  isGraded: boolean;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso al catálogo formativo de `education.*`: cursos, módulos, lecciones,
 * versiones, instructores, cohortes, evaluaciones y reseñas.
 */
@Injectable()
export class EducationCatalogRepository {
  // --- Curso, módulos y lecciones (UC-47-01) ---

  createCourse(em: EntityManager, data: CreateCourseData): Courses {
    return em.create(
      Courses,
      {
        tenantId: data.tenantId,
        code: data.code,
        title: data.title,
        description: data.description,
        courseTypeConceptId: data.courseTypeConceptId,
        specialtyConceptId: data.specialtyConceptId,
        levelConceptId: data.levelConceptId,
        languageConceptId: data.languageConceptId,
        isAccredited: data.isAccredited,
        cmeCreditHours: data.cmeCreditHours,
        accreditingBodyConceptId: data.accreditingBodyConceptId,
        price: data.price,
        currencyConceptId: data.currencyConceptId,
        durationMinutes: data.durationMinutes,
        currentVersion: 1,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findCourseById(em: EntityManager, id: string): Promise<Courses | null> {
    return em.findOne(Courses, { id });
  }

  findCourseForUpdate(em: EntityManager, id: string): Promise<Courses | null> {
    return em.findOne(
      Courses,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findCourseByCode(em: EntityManager, code: string): Promise<Courses | null> {
    return em.findOne(Courses, { code });
  }

  createModule(
    em: EntityManager,
    data: {
      courseId: string;
      title: string;
      description?: string;
      ordinal: number;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): CourseModules {
    return em.create(
      CourseModules,
      {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        ordinal: data.ordinal,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createLesson(
    em: EntityManager,
    data: {
      courseModuleId: string;
      title: string;
      contentTypeConceptId: string;
      mediaFileId?: string;
      externalUrl?: string;
      durationMinutes?: number;
      ordinal: number;
      isPreview: boolean;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): Lessons {
    return em.create(
      Lessons,
      {
        courseModuleId: data.courseModuleId,
        title: data.title,
        contentTypeConceptId: data.contentTypeConceptId,
        mediaFileId: data.mediaFileId,
        externalUrl: data.externalUrl,
        durationMinutes: data.durationMinutes,
        ordinal: data.ordinal,
        isPreview: data.isPreview,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findModulesByCourse(
    em: EntityManager,
    courseId: string,
  ): Promise<CourseModules[]> {
    return em.find(
      CourseModules,
      { courseId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  findLessonById(em: EntityManager, id: string): Promise<Lessons | null> {
    return em.findOne(Lessons, { id });
  }

  /** Total de lecciones publicadas del curso: es el denominador del progreso. */
  countLessonsByModules(
    em: EntityManager,
    moduleIds: string[],
    publishedStatusConceptId: string,
  ): Promise<number> {
    if (moduleIds.length === 0) return Promise.resolve(0);
    return em.count(Lessons, {
      courseModuleId: { $in: moduleIds },
      statusConceptId: publishedStatusConceptId,
    });
  }

  // --- Versiones (UC-47-02) ---

  createVersion(
    em: EntityManager,
    data: {
      courseId: string;
      version: number;
      changelog?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): CourseVersions {
    return em.create(
      CourseVersions,
      {
        courseId: data.courseId,
        version: data.version,
        changelog: data.changelog,
        statusConceptId: data.statusConceptId,
        publishedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findVersion(
    em: EntityManager,
    courseId: string,
    version: number,
  ): Promise<CourseVersions | null> {
    return em.findOne(CourseVersions, { courseId, version });
  }

  // --- Instructores (UC-47-03) ---

  createInstructor(
    em: EntityManager,
    data: {
      tenantId?: string;
      practitionerProfileId?: string;
      userId?: string;
      displayName: string;
      bio?: string;
      credentialsText?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): Instructors {
    return em.create(
      Instructors,
      {
        tenantId: data.tenantId,
        practitionerProfileId: data.practitionerProfileId,
        userId: data.userId,
        displayName: data.displayName,
        bio: data.bio,
        credentialsText: data.credentialsText,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Instructor ya registrado para ese perfil profesional: el alta es un upsert. */
  findInstructorByProfile(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<Instructors | null> {
    return em.findOne(Instructors, { practitionerProfileId });
  }

  createCourseInstructor(
    em: EntityManager,
    data: {
      courseId: string;
      instructorId: string;
      roleConceptId: string;
      ordinal: number;
      actorUserId?: string;
    },
  ): CourseInstructors {
    return em.create(
      CourseInstructors,
      {
        courseId: data.courseId,
        instructorId: data.instructorId,
        roleConceptId: data.roleConceptId,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findCourseInstructors(
    em: EntityManager,
    courseId: string,
  ): Promise<CourseInstructors[]> {
    return em.find(CourseInstructors, { courseId });
  }

  // --- Cohortes (UC-47-04, UC-47-05) ---

  createCohort(
    em: EntityManager,
    data: {
      courseId: string;
      code: string;
      deliveryModeConceptId: string;
      startDate?: Date;
      endDate?: Date;
      capacity?: number;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): CourseCohorts {
    return em.create(
      CourseCohorts,
      {
        courseId: data.courseId,
        code: data.code,
        deliveryModeConceptId: data.deliveryModeConceptId,
        startDate: data.startDate,
        endDate: data.endDate,
        capacity: data.capacity,
        // El conteo de inscritos es derivado: nace en cero.
        enrolledCount: 0,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findCohortByCode(
    em: EntityManager,
    courseId: string,
    code: string,
  ): Promise<CourseCohorts | null> {
    return em.findOne(CourseCohorts, { courseId, code });
  }

  /** La capacidad se comprueba bajo bloqueo: dos inscripciones a la vez la desbordarían. */
  findCohortForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CourseCohorts | null> {
    return em.findOne(
      CourseCohorts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Evaluaciones (UC-47-07) ---

  createAssessment(em: EntityManager, data: CreateAssessmentData): Assessments {
    return em.create(
      Assessments,
      {
        courseId: data.courseId,
        courseModuleId: data.courseModuleId,
        title: data.title,
        assessmentTypeConceptId: data.assessmentTypeConceptId,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts,
        timeLimitMinutes: data.timeLimitMinutes,
        isGraded: data.isGraded,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findAssessmentById(
    em: EntityManager,
    id: string,
  ): Promise<Assessments | null> {
    return em.findOne(Assessments, { id });
  }

  /** Evaluaciones puntuables del curso: completarlo exige aprobarlas todas. */
  findGradedAssessments(
    em: EntityManager,
    courseId: string,
    publishedStatusConceptId: string,
  ): Promise<Assessments[]> {
    return em.find(Assessments, {
      courseId,
      isGraded: true,
      statusConceptId: publishedStatusConceptId,
    });
  }

  createQuestion(
    em: EntityManager,
    data: {
      assessmentId: string;
      questionTypeConceptId: string;
      promptText: string;
      optionsJson?: unknown;
      correctAnswerJson?: unknown;
      points: string;
      ordinal: number;
      actorUserId?: string;
    },
  ): AssessmentQuestions {
    return em.create(
      AssessmentQuestions,
      {
        assessmentId: data.assessmentId,
        questionTypeConceptId: data.questionTypeConceptId,
        promptText: data.promptText,
        optionsJson: data.optionsJson,
        correctAnswerJson: data.correctAnswerJson,
        points: data.points,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Preguntas con su respuesta correcta: sólo las lee la corrección, nunca el alumno. */
  findQuestionsByAssessment(
    em: EntityManager,
    assessmentId: string,
  ): Promise<AssessmentQuestions[]> {
    return em.find(
      AssessmentQuestions,
      { assessmentId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  // --- Reseñas (UC-47-13) ---

  createReview(
    em: EntityManager,
    data: {
      courseId: string;
      reviewerRefId: string;
      rating: number;
      reviewText?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): CourseReviews {
    return em.create(
      CourseReviews,
      {
        courseId: data.courseId,
        reviewerRefId: data.reviewerRefId,
        rating: data.rating,
        reviewText: data.reviewText,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Reseña previa del mismo autor: cada quien opina una vez por curso. */
  findReviewByReviewer(
    em: EntityManager,
    courseId: string,
    reviewerRefId: string,
  ): Promise<CourseReviews | null> {
    return em.findOne(CourseReviews, { courseId, reviewerRefId });
  }
}
