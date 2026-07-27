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
import { EducationCatalogRepository } from '../repositories';
import {
  PublishCourseDto,
  CourseResponseDto,
  PublishVersionDto,
  CourseVersionResponseDto,
  AssignInstructorDto,
  InstructorAssignmentResponseDto,
  OpenCohortDto,
  CohortResponseDto,
  CreateAssessmentDto,
  AssessmentResponseDto,
  CreateReviewDto,
  ReviewResponseDto,
  type CourseType,
  type CourseLevel,
  type LessonContentType,
  type InstructorRole,
  type DeliveryMode,
  type AssessmentType,
  type QuestionType,
} from '../dto';

const COURSE_TYPE_CONCEPT: Readonly<Record<CourseType, string>> = {
  SELF_PACED: CONCEPTS.COURSE_TYPE_SELF_PACED,
  INSTRUCTOR_LED: CONCEPTS.COURSE_TYPE_INSTRUCTOR_LED,
};

const COURSE_LEVEL_CONCEPT: Readonly<Record<CourseLevel, string>> = {
  BASIC: CONCEPTS.COURSE_LEVEL_BASIC,
  INTERMEDIATE: CONCEPTS.COURSE_LEVEL_INTERMEDIATE,
  ADVANCED: CONCEPTS.COURSE_LEVEL_ADVANCED,
};

const LESSON_CONTENT_CONCEPT: Readonly<Record<LessonContentType, string>> = {
  VIDEO: CONCEPTS.LESSON_VIDEO,
  ARTICLE: CONCEPTS.LESSON_ARTICLE,
  PDF: CONCEPTS.LESSON_PDF,
  SCORM: CONCEPTS.LESSON_SCORM,
  QUIZ: CONCEPTS.LESSON_QUIZ,
  LIVE_SESSION: CONCEPTS.LESSON_LIVE_SESSION,
};

const INSTRUCTOR_ROLE_CONCEPT: Readonly<Record<InstructorRole, string>> = {
  LEAD: CONCEPTS.INSTRUCTOR_LEAD,
  CO: CONCEPTS.INSTRUCTOR_CO,
  GUEST: CONCEPTS.INSTRUCTOR_GUEST,
  ASSISTANT: CONCEPTS.INSTRUCTOR_ASSISTANT,
};

const DELIVERY_MODE_CONCEPT: Readonly<Record<DeliveryMode, string>> = {
  ONLINE: CONCEPTS.DELIVERY_ONLINE,
  IN_PERSON: CONCEPTS.DELIVERY_IN_PERSON,
  HYBRID: CONCEPTS.DELIVERY_HYBRID,
};

const ASSESSMENT_TYPE_CONCEPT: Readonly<Record<AssessmentType, string>> = {
  QUIZ: CONCEPTS.ASSESSMENT_QUIZ,
  EXAM: CONCEPTS.ASSESSMENT_EXAM,
  SURVEY: CONCEPTS.ASSESSMENT_SURVEY,
};

export const QUESTION_TYPE_CONCEPT: Readonly<Record<QuestionType, string>> = {
  SINGLE_CHOICE: CONCEPTS.QUESTION_SINGLE_CHOICE,
  MULTIPLE_CHOICE: CONCEPTS.QUESTION_MULTI_CHOICE,
  TRUE_FALSE: CONCEPTS.QUESTION_TRUE_FALSE,
  SHORT_ANSWER: CONCEPTS.QUESTION_SHORT_ANSWER,
  MATCHING: CONCEPTS.QUESTION_MATCHING,
};

const DEFAULT_QUESTION_POINTS = '1';
const DEFAULT_MAX_ATTEMPTS = 1;

/**
 * Catálogo formativo: cursos, versiones, instructores, cohortes, evaluaciones y
 * reseñas (UC-47-01, 02, 03, 04, 07, 13).
 */
@Injectable()
export class EducationCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: EducationCatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EducationCatalogService.name);
  }

  /**
   * UC-47-01: publicar el curso con su árbol de módulos y lecciones en una sola
   * transacción. La duración es derivada: sale de sumar las lecciones.
   */
  async publishCourse(
    dto: PublishCourseDto,
    actor: AuthenticatedUser,
  ): Promise<CourseResponseDto> {
    this.logger.info(
      { operation: 'education.course.publish', code: dto.code },
      'Publishing course',
    );

    const duplicate = await this.catalogRepo.findCourseByCode(
      this.em,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un curso con ese código', {
        code: dto.code,
      });
    }
    // Sin horas declaradas, acreditar un curso no otorgaría nada al completarlo.
    if (dto.isAccredited && !dto.cmeCreditHours) {
      throw new PreconditionFailedException(
        'Un curso acreditado necesita declarar sus horas CME',
        { code: dto.code },
      );
    }

    const durationMinutes = dto.modules
      .flatMap((m) => m.lessons)
      .reduce((sum, lesson) => sum + (lesson.durationMinutes ?? 0), 0);

    return this.em.transactional(async (tx) => {
      const course = this.catalogRepo.createCourse(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        courseTypeConceptId: COURSE_TYPE_CONCEPT[dto.courseType],
        specialtyConceptId: dto.specialtyConceptId,
        levelConceptId: dto.level ? COURSE_LEVEL_CONCEPT[dto.level] : undefined,
        languageConceptId: dto.languageConceptId,
        isAccredited: dto.isAccredited ?? false,
        cmeCreditHours: dto.cmeCreditHours,
        accreditingBodyConceptId: dto.accreditingBodyConceptId,
        price: dto.price,
        currencyConceptId: dto.currencyConceptId,
        durationMinutes,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
        actorUserId: actor.id,
      });

      // La versión 1 se registra con el curso: publicar sin dejar rastro de qué
      // se publicó haría imposible saber qué vio quien se inscribió antes.
      this.catalogRepo.createVersion(tx, {
        courseId: course.id,
        version: 1,
        changelog: 'Publicación inicial',
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
        actorUserId: actor.id,
      });

      const moduleIds: string[] = [];
      let lessons = 0;

      dto.modules.forEach((module, moduleIndex) => {
        const created = this.catalogRepo.createModule(tx, {
          courseId: course.id,
          title: module.title,
          description: module.description,
          ordinal: moduleIndex + 1,
          statusConceptId: CONCEPTS.COURSE_PUBLISHED,
          actorUserId: actor.id,
        });
        moduleIds.push(created.id);

        module.lessons.forEach((lesson, lessonIndex) => {
          this.catalogRepo.createLesson(tx, {
            courseModuleId: created.id,
            title: lesson.title,
            contentTypeConceptId: LESSON_CONTENT_CONCEPT[lesson.contentType],
            mediaFileId: lesson.mediaFileId,
            externalUrl: lesson.externalUrl,
            durationMinutes: lesson.durationMinutes,
            ordinal: lessonIndex + 1,
            isPreview: lesson.isPreview ?? false,
            statusConceptId: CONCEPTS.COURSE_PUBLISHED,
            actorUserId: actor.id,
          });
          lessons += 1;
        });
      });

      return {
        id: course.id,
        code: dto.code,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
        currentVersion: 1,
        moduleIds,
        lessons,
        durationMinutes,
      };
    });
  }

  /** UC-47-02: publicar una versión nueva; el curso pasa a apuntar a ella. */
  async publishVersion(
    courseId: string,
    dto: PublishVersionDto,
    actor: AuthenticatedUser,
  ): Promise<CourseVersionResponseDto> {
    this.logger.info(
      { operation: 'education.course.version', courseId },
      'Publishing course version',
    );

    return this.em.transactional(async (tx) => {
      // Bloquear el curso es lo que serializa el versionado: dos publicaciones
      // simultáneas pedirían el mismo número.
      const course = await this.catalogRepo.findCourseForUpdate(tx, courseId);
      if (!course) {
        throw new ResourceNotFoundException('Curso no encontrado', {
          courseId,
        });
      }
      if (course.statusConceptId === CONCEPTS.COURSE_ARCHIVED) {
        throw new PreconditionFailedException(
          'Un curso archivado no admite versiones',
          {
            courseId,
          },
        );
      }

      const version = course.currentVersion + 1;
      const existing = await this.catalogRepo.findVersion(
        tx,
        courseId,
        version,
      );
      if (existing) {
        throw new ConflictException('Esa versión del curso ya existe', {
          courseId,
          version,
        });
      }

      const created = this.catalogRepo.createVersion(tx, {
        courseId,
        version,
        changelog: dto.changelog,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
        actorUserId: actor.id,
      });

      course.currentVersion = version;
      touch(course, actor.id);

      return { id: created.id, courseId, version };
    });
  }

  /**
   * UC-47-03: asignar un instructor. La ficha se reutiliza si el perfil
   * profesional ya la tiene: es la misma persona enseñando otro curso.
   */
  async assignInstructor(
    courseId: string,
    dto: AssignInstructorDto,
    actor: AuthenticatedUser,
  ): Promise<InstructorAssignmentResponseDto> {
    this.logger.info(
      { operation: 'education.instructor.assign', courseId },
      'Assigning course instructor',
    );

    return this.em.transactional(async (tx) => {
      const course = await this.catalogRepo.findCourseById(tx, courseId);
      if (!course) {
        throw new ResourceNotFoundException('Curso no encontrado', {
          courseId,
        });
      }

      let instructor = dto.practitionerProfileId
        ? await this.catalogRepo.findInstructorByProfile(
            tx,
            dto.practitionerProfileId,
          )
        : null;
      const instructorExisted = instructor !== null;
      if (!instructor) {
        instructor = this.catalogRepo.createInstructor(tx, {
          tenantId: course.tenantId,
          practitionerProfileId: dto.practitionerProfileId,
          userId: dto.userId,
          displayName: dto.displayName,
          bio: dto.bio,
          credentialsText: dto.credentialsText,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
      }

      const current = await this.catalogRepo.findCourseInstructors(
        tx,
        courseId,
      );
      if (current.some((ci) => ci.instructorId === instructor.id)) {
        throw new ConflictException('El instructor ya está asignado al curso', {
          courseId,
          instructorId: instructor.id,
        });
      }
      // Un curso con dos titulares no dice quién responde por él.
      if (
        dto.role === 'LEAD' &&
        current.some((ci) => ci.roleConceptId === CONCEPTS.INSTRUCTOR_LEAD)
      ) {
        throw new ConflictException('El curso ya tiene instructor titular', {
          courseId,
        });
      }

      const ordinal = current.length + 1;
      const assignment = this.catalogRepo.createCourseInstructor(tx, {
        courseId,
        instructorId: instructor.id,
        roleConceptId: INSTRUCTOR_ROLE_CONCEPT[dto.role],
        ordinal,
        actorUserId: actor.id,
      });

      return {
        instructorId: instructor.id,
        courseInstructorId: assignment.id,
        instructorExisted,
        ordinal,
      };
    });
  }

  /** UC-47-04: abrir una cohorte del curso con sus fechas y plazas. */
  async openCohort(
    courseId: string,
    dto: OpenCohortDto,
    actor: AuthenticatedUser,
  ): Promise<CohortResponseDto> {
    this.logger.info(
      { operation: 'education.cohort.open', courseId, code: dto.code },
      'Opening course cohort',
    );

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    if (startDate && endDate && endDate < startDate) {
      throw new PreconditionFailedException(
        'La cohorte debe terminar después de empezar',
        {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const course = await this.catalogRepo.findCourseById(tx, courseId);
      if (!course) {
        throw new ResourceNotFoundException('Curso no encontrado', {
          courseId,
        });
      }
      if (course.statusConceptId !== CONCEPTS.COURSE_PUBLISHED) {
        throw new PreconditionFailedException('El curso no está publicado', {
          courseId,
        });
      }

      const duplicate = await this.catalogRepo.findCohortByCode(
        tx,
        courseId,
        dto.code,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una cohorte con ese código en el curso',
          {
            courseId,
            code: dto.code,
          },
        );
      }

      const cohort = this.catalogRepo.createCohort(tx, {
        courseId,
        code: dto.code,
        deliveryModeConceptId: DELIVERY_MODE_CONCEPT[dto.deliveryMode],
        startDate,
        endDate,
        capacity: dto.capacity,
        statusConceptId: CONCEPTS.COHORT_OPEN,
        actorUserId: actor.id,
      });

      return {
        id: cohort.id,
        code: dto.code,
        statusConceptId: CONCEPTS.COHORT_OPEN,
      };
    });
  }

  /**
   * UC-47-07: diseñar la evaluación con sus preguntas. Una evaluación puntuable
   * exige respuesta correcta en cada pregunta: sin ella no habría cómo corregir.
   */
  async createAssessment(
    courseId: string,
    dto: CreateAssessmentDto,
    actor: AuthenticatedUser,
  ): Promise<AssessmentResponseDto> {
    this.logger.info(
      {
        operation: 'education.assessment.create',
        courseId,
        questions: dto.questions.length,
      },
      'Designing assessment',
    );

    const isGraded = dto.isGraded ?? true;
    if (isGraded) {
      const missing = dto.questions.filter((q) => !q.correctAnswerJson);
      if (missing.length > 0) {
        throw new PreconditionFailedException(
          'Una evaluación puntuable necesita respuesta correcta en cada pregunta',
          { courseId, missing: missing.length },
        );
      }
    }

    return this.em.transactional(async (tx) => {
      const course = await this.catalogRepo.findCourseById(tx, courseId);
      if (!course) {
        throw new ResourceNotFoundException('Curso no encontrado', {
          courseId,
        });
      }

      if (dto.courseModuleId) {
        const modules = await this.catalogRepo.findModulesByCourse(
          tx,
          courseId,
        );
        if (!modules.some((m) => m.id === dto.courseModuleId)) {
          throw new PreconditionFailedException(
            'El módulo no pertenece al curso',
            {
              courseId,
              courseModuleId: dto.courseModuleId,
            },
          );
        }
      }

      const assessment = this.catalogRepo.createAssessment(tx, {
        courseId,
        courseModuleId: dto.courseModuleId,
        title: dto.title,
        assessmentTypeConceptId: ASSESSMENT_TYPE_CONCEPT[dto.assessmentType],
        passingScore: dto.passingScore,
        maxAttempts: dto.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        timeLimitMinutes: dto.timeLimitMinutes,
        isGraded,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
        actorUserId: actor.id,
      });

      let totalPoints = 0;
      const questionIds = dto.questions.map((question, index) => {
        const points = question.points ?? DEFAULT_QUESTION_POINTS;
        totalPoints += Number(points);
        return this.catalogRepo.createQuestion(tx, {
          assessmentId: assessment.id,
          questionTypeConceptId: QUESTION_TYPE_CONCEPT[question.questionType],
          promptText: question.promptText,
          optionsJson: question.optionsJson,
          correctAnswerJson: question.correctAnswerJson,
          points,
          ordinal: index + 1,
          actorUserId: actor.id,
        }).id;
      });

      return {
        id: assessment.id,
        statusConceptId: CONCEPTS.COURSE_PUBLISHED,
        questionIds,
        totalPoints: totalPoints.toFixed(2),
      };
    });
  }

  /** UC-47-13: publicar una reseña. Cada autor opina una vez por curso. */
  async createReview(
    courseId: string,
    dto: CreateReviewDto,
    actor: AuthenticatedUser,
  ): Promise<ReviewResponseDto> {
    this.logger.info(
      { operation: 'education.review.create', courseId },
      'Publishing course review',
    );

    return this.em.transactional(async (tx) => {
      const course = await this.catalogRepo.findCourseById(tx, courseId);
      if (!course) {
        throw new ResourceNotFoundException('Curso no encontrado', {
          courseId,
        });
      }

      const previous = await this.catalogRepo.findReviewByReviewer(
        tx,
        courseId,
        actor.id,
      );
      if (previous) {
        throw new ConflictException('El usuario ya reseñó este curso', {
          courseId,
          reviewId: previous.id,
        });
      }

      const review = this.catalogRepo.createReview(tx, {
        courseId,
        reviewerRefId: actor.id,
        rating: dto.rating,
        reviewText: dto.reviewText,
        statusConceptId: CONCEPTS.REVIEW_PUBLISHED,
        actorUserId: actor.id,
      });

      return {
        id: review.id,
        courseId,
        rating: dto.rating,
        statusConceptId: CONCEPTS.REVIEW_PUBLISHED,
      };
    });
  }
}
