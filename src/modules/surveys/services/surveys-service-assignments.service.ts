import { Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AssignmentsRepository, TemplatesRepository } from '../repositories';
import type {
  ImportServiceSurveyDto,
  ServiceSurveyAssignmentsDto,
  ServiceSurveyRowDto,
  StandardSurveyCatalogDto,
} from '../dto';
import { SURVEYS } from '../surveys.concepts';
import { SurveysErrorReason } from '../surveys.error-reasons';
import {
  STANDARD_SURVEY_CATALOG,
  findStandardSurvey,
} from '../surveys-standard.catalog';
import { serviceKindOf } from '../service-kind';
import { ServiceSurveyOwnership } from './service-survey-ownership';
import { StandardSurveyMaterializer } from './standard-survey-materializer';
import {
  consultationRow,
  toAssignmentDto,
  toCatalogItem,
} from './service-survey.mappers';

export { standardSurveyIds } from './standard-survey-materializer';

/**
 * Encuestas estandarizadas por servicio.
 *
 * El profesional ya no escribe encuestas: a cada uno de sus servicios le asocia
 * **una** plantilla del catálogo estándar (`surveys-standard.catalog.ts`). La
 * importación materializa una plantilla propia del profesional, publicada y
 * con versión inmutable (`StandardSurveyMaterializer`), y la asocia al servicio
 * (`SERVICE`, `billing.service_catalog.id`) reemplazando la anterior. La cita
 * médica sin servicio usa siempre la encuesta base de consulta del sistema: no
 * se reemplaza ni se quita.
 *
 * Al emitir la invitación de una reserva de ese servicio, la plantilla
 * importada **reemplaza** a la encuesta base de servicio (ver
 * `SurveysAssignmentsService.issue`): su núcleo copia literalmente el de la
 * base, y emitir las dos repetiría las preguntas.
 */
@Injectable()
export class SurveysServiceAssignmentsService {
  constructor(
    private readonly em: EntityManager,
    private readonly templatesRepo: TemplatesRepository,
    private readonly assignmentsRepo: AssignmentsRepository,
    private readonly ownership: ServiceSurveyOwnership,
    private readonly materializer: StandardSurveyMaterializer,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SurveysServiceAssignmentsService.name);
  }

  /** El catálogo estándar, tal como lo define el código. */
  getCatalog(): StandardSurveyCatalogDto {
    return { items: STANDARD_SURVEY_CATALOG.map(toCatalogItem) };
  }

  /**
   * La fila fija de la cita médica (con las preguntas de la base) y los
   * servicios activos del profesional en la organización, cada uno con su tipo
   * y su encuesta activa (o `null`: usa la base de servicio del sistema).
   */
  async listServiceAssignments(
    actor: AuthenticatedUser,
  ): Promise<ServiceSurveyAssignmentsDto> {
    const tenantId = requireTenantId();
    const practitionerProfileId = this.requirePractitioner(actor);
    const em = this.em.fork({ keepTransactionContext: true });

    const own = await this.ownership.listOwned(
      em,
      tenantId,
      practitionerProfileId,
    );
    const assigned = await this.ownership.currentByService(
      em,
      tenantId,
      practitionerProfileId,
      own.map((s) => s.id),
    );
    return {
      consultation: consultationRow(),
      services: own.map((service) => ({
        serviceId: service.id,
        serviceName: service.name,
        serviceKind: serviceKindOf(service.name),
        assignment: toAssignmentDto(assigned.get(service.id)),
      })),
    };
  }

  /**
   * Importa una plantilla del catálogo al servicio: materializa (idempotente)
   * la plantilla propia del profesional y, en una transacción, desactiva la
   * asociación activa anterior del servicio y crea la nueva.
   *
   * @throws DomainException 403 `SURVEY_SERVICE_NOT_OWNED` si el servicio no es
   *   una oferta activa del profesional en la organización.
   * @throws ResourceNotFoundException 404 `SURVEY_CATALOG_CODE_UNKNOWN`.
   */
  async importServiceSurvey(
    serviceId: string,
    dto: ImportServiceSurveyDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceSurveyRowDto> {
    const tenantId = requireTenantId();
    const practitionerProfileId = this.requirePractitioner(actor);

    // Autorización antes que el 404 del código, como en el resto del módulo.
    await this.ownership.assertOwned(
      this.em.fork({ keepTransactionContext: true }),
      tenantId,
      practitionerProfileId,
      serviceId,
    );
    const entry = findStandardSurvey(dto.catalogCode);
    if (!entry) {
      throw new ResourceNotFoundException(
        'Esa plantilla no está en el catálogo estándar',
        { catalogCode: dto.catalogCode },
        SurveysErrorReason.CATALOG_CODE_UNKNOWN,
      );
    }
    const imported = await this.materializer.materialize(
      tenantId,
      practitionerProfileId,
      entry,
      actor.id,
    );

    return this.em
      .transactional(async (tx) => {
        // Serializa dos reemplazos simultáneos del mismo servicio y repite la
        // comprobación de dueño con el candado tomado.
        const service = await this.ownership.assertOwned(
          tx,
          tenantId,
          practitionerProfileId,
          serviceId,
          true,
        );
        const row = (assignment: ServiceSurveyRowDto['assignment']) => ({
          serviceId,
          serviceName: service.name,
          serviceKind: serviceKindOf(service.name),
          assignment,
        });

        const template = await this.templatesRepo.findTemplateById(
          tx,
          imported.templateId,
        );
        // Importar de nuevo es querer esa encuesta: si el profesional la había
        // desactivado, vuelve a repartirse.
        if (template && template.statusConceptId !== SURVEYS.TEMPLATE_ACTIVE) {
          template.statusConceptId = SURVEYS.TEMPLATE_ACTIVE;
          touch(template, actor.id);
        }

        const previous = await this.ownership.listActive(
          tx,
          tenantId,
          practitionerProfileId,
          [serviceId],
        );
        const current = previous[0];
        if (current && current.version.id === imported.versionId) {
          await tx.flush();
          return row(toAssignmentDto(current));
        }

        for (const old of previous) {
          old.assignment.active = false;
          touch(old.assignment, actor.id);
        }
        // El índice único parcial no es diferible: la baja de la anterior tiene
        // que llegar a la base antes del alta de la nueva.
        await tx.flush();

        const assignment = this.assignmentsRepo.create(tx, {
          surveyVersionId: imported.versionId,
          tenantId,
          targetTypeConceptId: SURVEYS.TARGET_SERVICE,
          targetId: serviceId,
          ownerPractitionerId: practitionerProfileId,
          active: true,
          actorUserId: actor.id,
        });
        await tx.flush();

        this.logger.info(
          {
            operation: 'surveys.service_assignment.import',
            serviceId,
            catalogCode: entry.code,
            assignmentId: assignment.id,
            replaced: previous.length,
          },
          'Service survey imported',
        );
        return row({
          assignmentId: assignment.id,
          catalogCode: entry.code,
          title: template?.title ?? entry.title,
          templateId: imported.templateId,
          versionId: imported.versionId,
          assignedAt: assignment.createdAt.toISOString(),
        });
      })
      .catch((error: unknown) => {
        // `uq_survey_assignments_active_service_owner`: otra importación ganó.
        if (error instanceof UniqueConstraintViolationException) {
          throw new ConflictException(
            'El servicio ya tiene una encuesta activa: vuelva a intentarlo',
            { serviceId },
            SurveysErrorReason.ASSIGNMENT_ALREADY_ACTIVE,
          );
        }
        throw error;
      });
  }

  /**
   * Quita la encuesta del servicio: desactiva su asociación activa y el
   * servicio vuelve a la encuesta base de servicio del sistema. Idempotente.
   *
   * @throws DomainException 403 `SURVEY_SERVICE_NOT_OWNED`.
   */
  async removeServiceSurvey(
    serviceId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const tenantId = requireTenantId();
    const practitionerProfileId = this.requirePractitioner(actor);

    await this.em.transactional(async (tx) => {
      await this.ownership.assertOwned(
        tx,
        tenantId,
        practitionerProfileId,
        serviceId,
        true,
      );
      const previous = await this.ownership.listActive(
        tx,
        tenantId,
        practitionerProfileId,
        [serviceId],
      );
      for (const old of previous) {
        old.assignment.active = false;
        touch(old.assignment, actor.id);
      }
      await tx.flush();
      this.logger.info(
        {
          operation: 'surveys.service_assignment.remove',
          serviceId,
          removed: previous.length,
        },
        'Service survey removed',
      );
    });
  }

  /** El perfil profesional de la sesión, o 412 (mismo criterio que las plantillas). */
  private requirePractitioner(actor: AuthenticatedUser): string {
    if (!actor.practitionerProfileId) {
      throw new PreconditionFailedException(
        'La sesión no tiene perfil profesional asociado',
        { userId: actor.id },
      );
    }
    return actor.practitionerProfileId;
  }
}
