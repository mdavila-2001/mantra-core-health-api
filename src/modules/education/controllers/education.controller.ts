import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { EducationCatalogService, EducationLearningService } from '../services';
import {
  PublishCourseDto,
  CourseResponseDto,
  PublishVersionDto,
  CourseVersionResponseDto,
  AssignInstructorDto,
  InstructorAssignmentResponseDto,
  OpenCohortDto,
  CohortResponseDto,
  EnrollLearnerDto,
  EnrollmentResponseDto,
  RecordProgressDto,
  ProgressResponseDto,
  CreateAssessmentDto,
  AssessmentResponseDto,
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
  CreateReviewDto,
  ReviewResponseDto,
} from '../dto';

/** Endpoints de formación: cursos, inscripciones, evaluaciones y certificados. */
@ApiTags('education')
@ApiBearerAuth()
@Controller('education')
export class EducationController {
  constructor(
    private readonly catalogService: EducationCatalogService,
    private readonly learningService: EducationLearningService,
  ) {}

  /** UC-47-01. */
  @Post('courses/publish')
  @Roles('EDUCATION_ADMIN', 'COURSE_AUTHOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar un curso con sus módulos y lecciones',
    description: 'La duración se deriva de la suma de las lecciones.',
  })
  publishCourse(
    @Body() dto: PublishCourseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CourseResponseDto> {
    return this.catalogService.publishCourse(dto, actor);
  }

  /** UC-47-02. */
  @Post('courses/:id/versions/publish')
  @Roles('EDUCATION_ADMIN', 'COURSE_AUTHOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar una versión nueva del curso',
    description: 'El curso pasa a apuntar a la versión publicada.',
  })
  publishVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CourseVersionResponseDto> {
    return this.catalogService.publishVersion(id, dto, actor);
  }

  /** UC-47-03. */
  @Post('courses/:id/instructors')
  @Roles('EDUCATION_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asignar un instructor al curso',
    description: 'La ficha se reutiliza si el perfil profesional ya la tiene.',
  })
  assignInstructor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignInstructorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InstructorAssignmentResponseDto> {
    return this.catalogService.assignInstructor(id, dto, actor);
  }

  /** UC-47-04. */
  @Post('courses/:id/cohorts')
  @Roles('EDUCATION_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir una cohorte del curso' })
  openCohort(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpenCohortDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CohortResponseDto> {
    return this.catalogService.openCohort(id, dto, actor);
  }

  /** UC-47-05. */
  @Post('enrollments')
  @Roles('EDUCATION_ADMIN', 'LEARNER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscribir a un aprendiz',
    description: 'La capacidad de la cohorte se comprueba bajo bloqueo.',
  })
  enrollLearner(
    @Body() dto: EnrollLearnerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EnrollmentResponseDto> {
    return this.learningService.enrollLearner(dto, actor);
  }

  /** UC-47-06. */
  @Post('enrollments/:id/lesson-progress')
  @Roles('LEARNER', 'EDUCATION_ADMIN', 'SYSTEM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el progreso de una lección',
    description: 'Log append-only; el progreso del curso se recalcula.',
  })
  recordProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordProgressDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProgressResponseDto> {
    return this.learningService.recordProgress(id, dto, actor);
  }

  /** UC-47-07. */
  @Post('courses/:id/assessments')
  @Roles('EDUCATION_ADMIN', 'COURSE_AUTHOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Diseñar una evaluación con sus preguntas',
    description: 'La respuesta correcta sólo la lee la corrección.',
  })
  createAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssessmentResponseDto> {
    return this.catalogService.createAssessment(id, dto, actor);
  }

  /** UC-47-08. */
  @Post('assessments/:id/attempts')
  @Roles('LEARNER', 'EDUCATION_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar un intento de evaluación',
    description:
      'Se rechaza si hay uno en curso o si se agotaron los permitidos.',
  })
  startAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartAttemptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AttemptResponseDto> {
    return this.learningService.startAttempt(id, dto, actor);
  }

  /** UC-47-09. */
  @Post('attempts/:id/submit')
  @Roles('LEARNER', 'EDUCATION_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar y calificar el intento',
    description:
      'La corrección se hace contra la respuesta correcta, que no sale de la transacción.',
  })
  submitAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GradedAttemptResponseDto> {
    return this.learningService.submitAttempt(id, dto, actor);
  }

  /** UC-47-10. */
  @Post('enrollments/:id/complete')
  @Roles('SYSTEM', 'EDUCATION_ADMIN', 'LEARNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar el curso',
    description:
      'Exige progreso al 100 y todas las evaluaciones puntuables aprobadas.',
  })
  completeEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CompleteEnrollmentResponseDto> {
    return this.learningService.completeEnrollment(id, actor);
  }

  /** UC-47-11. */
  @Post('enrollments/:id/certificate')
  @Roles('SYSTEM', 'EDUCATION_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir el certificado verificable',
    description: 'Idempotente por inscripción; las horas CME salen del curso.',
  })
  issueCertificate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IssueCertificateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CertificateResponseDto> {
    return this.learningService.issueCertificate(id, dto, actor);
  }

  /** UC-47-12. */
  @Post('certificates/:id/cme-credits')
  @Roles('SYSTEM', 'EDUCATION_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Acreditar las horas CME al profesional',
    description: 'Idempotente por certificado y profesional.',
  })
  recordCmeCredit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordCmeCreditDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CmeCreditResponseDto> {
    return this.learningService.recordCmeCredit(id, dto, actor);
  }

  /** UC-47-13. */
  @Post('courses/:id/reviews')
  @Roles('LEARNER', 'EDUCATION_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar una reseña del curso',
    description:
      'El autor es el usuario autenticado y opina una vez por curso.',
  })
  createReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewResponseDto> {
    return this.catalogService.createReview(id, dto, actor);
  }

  /** UC-47-14. */
  @Post('certificates/:id/revoke')
  @Roles('EDUCATION_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar el certificado y revertir sus créditos CME',
    description: 'Ambas cosas ocurren en la misma transacción.',
  })
  revokeCertificate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeCertificateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RevokeCertificateResponseDto> {
    return this.learningService.revokeCertificate(id, dto, actor);
  }
}
