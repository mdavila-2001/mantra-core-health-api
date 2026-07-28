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

/**
 * Describe el contrato estructural de create course data.
 */
export interface CreateCourseData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a course type concept.
   */
  courseTypeConceptId: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Identificador asociado a level concept.
   */
  levelConceptId?: string;
  /**
   * Identificador asociado a language concept.
   */
  languageConceptId?: string;
  /**
   * Valor de is accredited mantenido por la instancia.
   */
  isAccredited: boolean;
  /**
   * Valor de cme credit hours mantenido por la instancia.
   */
  cmeCreditHours?: string;
  /**
   * Identificador asociado a accrediting body concept.
   */
  accreditingBodyConceptId?: string;
  /**
   * Valor de price mantenido por la instancia.
   */
  price?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de duration minutes mantenido por la instancia.
   */
  durationMinutes?: number;
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
 * Describe el contrato estructural de create assessment data.
 */
export interface CreateAssessmentData {
  /**
   * Identificador asociado a course.
   */
  courseId: string;
  /**
   * Identificador asociado a course module.
   */
  courseModuleId?: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Identificador asociado a assessment type concept.
   */
  assessmentTypeConceptId: string;
  /**
   * Valor de passing score mantenido por la instancia.
   */
  passingScore?: string;
  /**
   * Valor de max attempts mantenido por la instancia.
   */
  maxAttempts?: number;
  /**
   * Valor de time limit minutes mantenido por la instancia.
   */
  timeLimitMinutes?: number;
  /**
   * Valor de is graded mantenido por la instancia.
   */
  isGraded: boolean;
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
 * Acceso al catálogo formativo de `education.*`: cursos, módulos, lecciones,
 * versiones, instructores, cohortes, evaluaciones y reseñas.
 */
@Injectable()
export class EducationCatalogRepository {
  // --- Curso, módulos y lecciones (UC-47-01) ---

  /**
   * Crea create course.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create course conforme al contrato `Courses`.
   */
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

  /**
   * Obtiene find course by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find course by id conforme al contrato `Promise<Courses | null>`.
   */
  findCourseById(em: EntityManager, id: string): Promise<Courses | null> {
    return em.findOne(Courses, { id });
  }

  /**
   * Obtiene find course for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find course for update conforme al contrato `Promise<Courses | null>`.
   */
  findCourseForUpdate(em: EntityManager, id: string): Promise<Courses | null> {
    return em.findOne(
      Courses,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find course by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find course by code conforme al contrato `Promise<Courses | null>`.
   */
  findCourseByCode(em: EntityManager, code: string): Promise<Courses | null> {
    return em.findOne(Courses, { code });
  }

  /**
   * Crea create module.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create module conforme al contrato `CourseModules`.
   */
  createModule(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a course.
       */
      courseId: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create lesson.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create lesson conforme al contrato `Lessons`.
   */
  createLesson(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a course module.
       */
      courseModuleId: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Identificador asociado a content type concept.
       */
      contentTypeConceptId: string;
      /**
       * Identificador asociado a media file.
       */
      mediaFileId?: string;
      /**
       * Valor de external url mantenido por la instancia.
       */
      externalUrl?: string;
      /**
       * Valor de duration minutes mantenido por la instancia.
       */
      durationMinutes?: number;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Valor de is preview mantenido por la instancia.
       */
      isPreview: boolean;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find modules by course.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param courseId - Identificador de course.
   * @returns Resultado de find modules by course conforme al contrato `Promise<CourseModules[]>`.
   */
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

  /**
   * Obtiene find lesson by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find lesson by id conforme al contrato `Promise<Lessons | null>`.
   */
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

  /**
   * Crea create version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create version conforme al contrato `CourseVersions`.
   */
  createVersion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a course.
       */
      courseId: string;
      /**
       * Valor de version mantenido por la instancia.
       */
      version: number;
      /**
       * Valor de changelog mantenido por la instancia.
       */
      changelog?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param courseId - Identificador de course.
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de find version conforme al contrato `Promise<CourseVersions | null>`.
   */
  findVersion(
    em: EntityManager,
    courseId: string,
    version: number,
  ): Promise<CourseVersions | null> {
    return em.findOne(CourseVersions, { courseId, version });
  }

  // --- Instructores (UC-47-03) ---

  /**
   * Crea create instructor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create instructor conforme al contrato `Instructors`.
   */
  createInstructor(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a practitioner profile.
       */
      practitionerProfileId?: string;
      /**
       * Identificador asociado a user.
       */
      userId?: string;
      /**
       * Valor de display name mantenido por la instancia.
       */
      displayName: string;
      /**
       * Valor de bio mantenido por la instancia.
       */
      bio?: string;
      /**
       * Valor de credentials text mantenido por la instancia.
       */
      credentialsText?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create course instructor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create course instructor conforme al contrato `CourseInstructors`.
   */
  createCourseInstructor(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a course.
       */
      courseId: string;
      /**
       * Identificador asociado a instructor.
       */
      instructorId: string;
      /**
       * Identificador asociado a role concept.
       */
      roleConceptId: string;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find course instructors.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param courseId - Identificador de course.
   * @returns Resultado de find course instructors conforme al contrato `Promise<CourseInstructors[]>`.
   */
  findCourseInstructors(
    em: EntityManager,
    courseId: string,
  ): Promise<CourseInstructors[]> {
    return em.find(CourseInstructors, { courseId });
  }

  // --- Cohortes (UC-47-04, UC-47-05) ---

  /**
   * Crea create cohort.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cohort conforme al contrato `CourseCohorts`.
   */
  createCohort(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a course.
       */
      courseId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Identificador asociado a delivery mode concept.
       */
      deliveryModeConceptId: string;
      /**
       * Valor de start date mantenido por la instancia.
       */
      startDate?: Date;
      /**
       * Valor de end date mantenido por la instancia.
       */
      endDate?: Date;
      /**
       * Valor de capacity mantenido por la instancia.
       */
      capacity?: number;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find cohort by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param courseId - Identificador de course.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find cohort by code conforme al contrato `Promise<CourseCohorts | null>`.
   */
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

  /**
   * Crea create assessment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assessment conforme al contrato `Assessments`.
   */
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

  /**
   * Obtiene find assessment by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find assessment by id conforme al contrato `Promise<Assessments | null>`.
   */
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

  /**
   * Crea create question.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create question conforme al contrato `AssessmentQuestions`.
   */
  createQuestion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a assessment.
       */
      assessmentId: string;
      /**
       * Identificador asociado a question type concept.
       */
      questionTypeConceptId: string;
      /**
       * Valor de prompt text mantenido por la instancia.
       */
      promptText: string;
      /**
       * Valor de options json mantenido por la instancia.
       */
      optionsJson?: unknown;
      /**
       * Valor de correct answer json mantenido por la instancia.
       */
      correctAnswerJson?: unknown;
      /**
       * Valor de points mantenido por la instancia.
       */
      points: string;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create review.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create review conforme al contrato `CourseReviews`.
   */
  createReview(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a course.
       */
      courseId: string;
      /**
       * Identificador asociado a reviewer ref.
       */
      reviewerRefId: string;
      /**
       * Valor de rating mantenido por la instancia.
       */
      rating: number;
      /**
       * Valor de review text mantenido por la instancia.
       */
      reviewText?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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
