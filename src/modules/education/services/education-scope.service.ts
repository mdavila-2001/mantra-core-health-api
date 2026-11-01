import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  requireTenantId,
  roleAuthorizesInTenant,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { EducationErrorReason } from '../education.error-reasons';
import {
  EducationCatalogRepository,
  EducationLearningRepository,
} from '../repositories';
import type {
  Assessments,
  AssessmentAttempts,
  Certificates,
  CourseCohorts,
  Courses,
  Enrollments,
} from '../entities';
import type { LearnerType } from '../dto';

const REASON = EducationErrorReason.EDUCATION_RESOURCE_OUT_OF_SCOPE;

/** Concepto de tipo de aprendiz → su código, para mapearlo con el actor. */
const LEARNER_TYPE_BY_CONCEPT: Readonly<Record<string, LearnerType>> = {
  [CONCEPTS.LEARNER_PRACTITIONER]: 'PRACTITIONER',
  [CONCEPTS.LEARNER_STAFF]: 'STAFF',
  [CONCEPTS.LEARNER_PATIENT]: 'PATIENT',
  [CONCEPTS.LEARNER_USER]: 'USER',
};

/** Opciones de los resolvedores que pueden bloquear la fila. */
export interface ScopeLockOptions {
  /** Releer la fila con bloqueo pesimista **después** de comprobar su alcance. */
  readonly lock?: boolean;
}

/**
 * Resuelve por UUID los recursos de formación acotados al tenant activo y a la
 * identidad del aprendiz.
 *
 * Solo `courses` guarda `tenant_id`; cohortes, evaluaciones, inscripciones,
 * intentos y certificados lo heredan del curso. Cada resolvedor comprueba el
 * alcance **antes** de bloquear o escribir: una fila ajena no se bloquea ni se
 * lee más allá de saber a qué curso pertenece. Lo ajeno responde exactamente
 * igual que lo inexistente (`404`, mismo mensaje y `reason`, sin `details`).
 *
 * Sobre el aprendiz: un actor `LEARNER` sin rol administrativo solo ve y opera
 * sus propias inscripciones. El vínculo entre el sujeto autenticado y el
 * `learnerRefId` se resuelve en el servidor a partir de su identidad, nunca del
 * cuerpo: perfil de paciente (`pid`), perfil profesional (`hpid`) o el propio
 * usuario.
 */
@Injectable()
export class EducationScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param catalogRepo - Cursos, cohortes y evaluaciones.
   * @param learningRepo - Inscripciones, intentos y certificados.
   */
  constructor(
    private readonly catalogRepo: EducationCatalogRepository,
    private readonly learningRepo: EducationLearningRepository,
  ) {}

  /**
   * Tenant propietario de un curso nuevo: el del contexto.
   *
   * @param bodyTenantId - Tenant declarado por el cliente, si lo hubo.
   * @returns El tenant activo, única fuente de verdad.
   * @throws ResourceNotFoundException si el cuerpo declara otro tenant.
   */
  activeTenantFor(bodyTenantId?: string): string {
    const tenantId = requireTenantId();
    if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
      this.notFound('Curso no encontrado');
    }
    return tenantId;
  }

  /**
   * Carga un curso del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del curso.
   * @param options - `lock` relee el curso con bloqueo tras comprobar el alcance.
   * @returns El curso, ya acotado al tenant.
   */
  async course(
    tx: EntityManager,
    id: string,
    options: ScopeLockOptions = {},
  ): Promise<Courses> {
    const tenantId = requireTenantId();
    const course = await this.catalogRepo.findCourseById(tx, id);
    assertResourceInTenant(course, course?.tenantId, tenantId, {
      message: 'Curso no encontrado',
      reason: REASON,
    });
    if (!options.lock) return course as Courses;
    const locked = await this.catalogRepo.findCourseForUpdate(tx, id);
    return assertResourceInTenant(locked, locked?.tenantId, tenantId, {
      message: 'Curso no encontrado',
      reason: REASON,
    });
  }

  /**
   * Carga una cohorte cuyo curso es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la cohorte.
   * @param options - `lock` relee la cohorte con bloqueo tras comprobar el alcance.
   * @returns La cohorte, ya acotada al tenant.
   */
  async cohort(
    tx: EntityManager,
    id: string,
    options: ScopeLockOptions = {},
  ): Promise<CourseCohorts> {
    requireTenantId();
    const cohort = await this.catalogRepo.findCohortById(tx, id);
    await this.assertCourseInScope(
      tx,
      cohort,
      cohort?.courseId,
      'Cohorte no encontrada',
    );
    if (!options.lock) return cohort as CourseCohorts;
    const locked = await this.catalogRepo.findCohortForUpdate(tx, id);
    return this.orGone(locked, 'Cohorte no encontrada');
  }

  /**
   * Carga una evaluación cuyo curso es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la evaluación.
   * @returns La evaluación, ya acotada al tenant.
   */
  async assessment(tx: EntityManager, id: string): Promise<Assessments> {
    requireTenantId();
    const assessment = await this.catalogRepo.findAssessmentById(tx, id);
    await this.assertCourseInScope(
      tx,
      assessment,
      assessment?.courseId,
      'Evaluación no encontrada',
    );
    return assessment as Assessments;
  }

  /**
   * Carga una inscripción cuyo curso es del tenant activo y que el actor puede
   * operar: un aprendiz solo accede a las suyas.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la inscripción.
   * @param actor - Quien opera.
   * @param options - `lock` relee la inscripción con bloqueo tras comprobar el alcance.
   * @returns La inscripción, ya acotada.
   */
  async enrollment(
    tx: EntityManager,
    id: string,
    actor: AuthenticatedUser,
    options: ScopeLockOptions = {},
  ): Promise<Enrollments> {
    requireTenantId();
    const enrollment = await this.learningRepo.findEnrollmentById(tx, id);
    await this.assertCourseInScope(
      tx,
      enrollment,
      enrollment?.courseId,
      'Inscripción no encontrada',
    );
    this.assertOwnsEnrollment(enrollment as Enrollments, actor);
    if (!options.lock) return enrollment as Enrollments;
    const locked = await this.learningRepo.findEnrollmentForUpdate(tx, id);
    return this.orGone(locked, 'Inscripción no encontrada');
  }

  /**
   * Carga un intento cuya inscripción es del tenant activo y que el actor puede
   * operar: un aprendiz solo accede a los suyos.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del intento.
   * @param actor - Quien opera.
   * @returns El intento, bloqueado, ya acotado.
   */
  async attemptForUpdate(
    tx: EntityManager,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<AssessmentAttempts> {
    requireTenantId();
    const attempt = await this.learningRepo.findAttemptById(tx, id);
    if (!attempt) this.notFound('Intento no encontrado');
    await this.enrollment(tx, attempt.enrollmentId, actor).catch(() =>
      this.notFound('Intento no encontrado'),
    );
    const locked = await this.learningRepo.findAttemptForUpdate(tx, id);
    return this.orGone(locked, 'Intento no encontrado');
  }

  /**
   * Carga un certificado cuyo curso es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del certificado.
   * @param options - `lock` relee el certificado con bloqueo tras comprobar el alcance.
   * @returns El certificado, ya acotado al tenant.
   */
  async certificate(
    tx: EntityManager,
    id: string,
    options: ScopeLockOptions = {},
  ): Promise<Certificates> {
    requireTenantId();
    const certificate = await this.learningRepo.findCertificateById(tx, id);
    await this.assertCourseInScope(
      tx,
      certificate,
      certificate?.courseId,
      'Certificado no encontrado',
    );
    if (!options.lock) return certificate as Certificates;
    const locked = await this.learningRepo.findCertificateForUpdate(tx, id);
    return this.orGone(locked, 'Certificado no encontrado');
  }

  /**
   * ¿Debe el actor limitarse a sus propias inscripciones?
   *
   * `EDUCATION_ADMIN` y `SYSTEM` (autorizados en el tenant activo) y
   * `SUPERADMIN` conservan la vía administrativa y de worker; cualquier otro
   * sujeto —un `LEARNER` o un rol administrativo acotado a otro tenant— queda
   * anclado a su propia identidad. Se deniega por defecto: la ausencia de un
   * rol administrativo vigente en este tenant basta para anclar al actor.
   *
   * @param actor - Quien opera.
   * @returns `true` si debe limitarse a sus propias inscripciones.
   */
  isLearnerOnly(actor: AuthenticatedUser): boolean {
    const tenantId = requireTenantId();
    // `SUPERADMIN` global vale en cualquiera; acotado en `scopedRoles`, sólo
    // en el suyo (#1241).
    return !(
      roleAuthorizesInTenant(actor, 'SUPERADMIN', tenantId) ||
      roleAuthorizesInTenant(actor, 'EDUCATION_ADMIN', tenantId) ||
      roleAuthorizesInTenant(actor, 'SYSTEM', tenantId)
    );
  }

  /**
   * Identificador de aprendiz que corresponde al actor para un tipo dado.
   *
   * @param actor - Sujeto autenticado.
   * @param learnerType - Tipo de aprendiz de la inscripción.
   * @returns Su perfil de paciente, perfil profesional o usuario; `undefined`
   *          si la cuenta no tiene ese perfil.
   */
  learnerRefOf(
    actor: AuthenticatedUser,
    learnerType: LearnerType,
  ): string | undefined {
    switch (learnerType) {
      case 'PATIENT':
        return actor.patientProfileId;
      case 'PRACTITIONER':
        return actor.practitionerProfileId;
      case 'STAFF':
      case 'USER':
        return actor.id;
    }
  }

  /**
   * Resuelve el aprendiz de una inscripción nueva.
   *
   * Un `LEARNER` se inscribe solo a sí mismo: el identificador sale del
   * servidor y uno distinto en el cuerpo se rechaza con `403`. Un
   * administrador debe indicar a quién inscribe.
   *
   * @param actor - Quien inscribe.
   * @param learnerType - Tipo de aprendiz declarado.
   * @param declaredRefId - `learnerRefId` del cuerpo, si lo hubo.
   * @returns El identificador del aprendiz, o `undefined` si un administrador
   *          no lo indicó.
   * @throws InsufficientRoleException `LEARNER_ENROLLMENT_OWNER_REQUIRED`.
   */
  resolveLearnerRef(
    actor: AuthenticatedUser,
    learnerType: LearnerType,
    declaredRefId?: string,
  ): string | undefined {
    if (!this.isLearnerOnly(actor)) return declaredRefId;
    const own = this.learnerRefOf(actor, learnerType);
    if (!own || (declaredRefId !== undefined && declaredRefId !== own)) {
      throw this.ownerRequired();
    }
    return own;
  }

  /**
   * Exige que la inscripción sea del actor cuando opera solo como aprendiz.
   *
   * @param enrollment - Inscripción ya acotada al tenant.
   * @param actor - Quien opera.
   * @throws ResourceNotFoundException (`404` uniforme) si es de otra persona.
   */
  private assertOwnsEnrollment(
    enrollment: Enrollments,
    actor: AuthenticatedUser,
  ): void {
    if (!this.isLearnerOnly(actor)) return;
    const type = LEARNER_TYPE_BY_CONCEPT[enrollment.learnerTypeConceptId];
    const own = type ? this.learnerRefOf(actor, type) : undefined;
    if (!own || own !== enrollment.learnerRefId) {
      this.notFound('Inscripción no encontrada');
    }
  }

  /** Comprueba que el curso de un recurso hijo es del tenant activo. */
  private async assertCourseInScope(
    tx: EntityManager,
    child: unknown,
    courseId: string | undefined,
    message: string,
  ): Promise<void> {
    const course = courseId
      ? await this.catalogRepo.findCourseById(tx, courseId)
      : null;
    assertResourceInTenant(child, course?.tenantId, requireTenantId(), {
      message,
      reason: REASON,
    });
  }

  /** La fila se borró entre la comprobación y el bloqueo: mismo 404. */
  private orGone<T>(row: T | null, message: string): T {
    if (!row) this.notFound(message);
    return row;
  }

  /** El 403 de quien intenta inscribir a otra persona. */
  private ownerRequired(): InsufficientRoleException {
    return new InsufficientRoleException(
      'Un aprendiz solo puede inscribirse a sí mismo',
      undefined,
      EducationErrorReason.LEARNER_ENROLLMENT_OWNER_REQUIRED,
    );
  }

  /** Lanza el 404 uniforme del módulo. */
  private notFound(message: string): never {
    throw new ResourceNotFoundException(message, undefined, REASON);
  }
}
