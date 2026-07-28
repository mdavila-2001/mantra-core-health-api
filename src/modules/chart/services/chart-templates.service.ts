import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import { ChartTemplatesRepository } from '../repositories';
import { CHART } from '../chart.concepts';
import { AssignmentResponseDto, AssignTemplateDto } from '../dto';

/**
 * Caso de uso de asignación de plantilla de chart por especialidad (UC-15-12).
 *
 * Regla de negocio: dentro de un mismo scope (práctica + profesional) solo puede
 * haber una asignación `is_default`. Al marcar una nueva como default, la
 * transacción baja el flag de las anteriores del mismo scope antes de insertar.
 *
 * `template_id` no tiene destino canónico forzado a nivel de base (la plantilla
 * la gobierna otro flujo administrativo); se recibe por DTO como referencia y no
 * se materializa aquí.
 */
@Injectable()
export class ChartTemplatesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param templatesRepo - Valor de templates repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly templatesRepo: ChartTemplatesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChartTemplatesService.name);
  }

  /** UC-15-12: asigna una plantilla a una práctica/profesional respetando un-solo-default. */
  async assignTemplate(
    templateId: string,
    dto: AssignTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<AssignmentResponseDto> {
    this.logger.info(
      { operation: 'chart.template.assign', templateId, actorId: actor.id },
      'Assigning chart template',
    );
    return this.em.transactional(async (tx) => {
      const isDefault = dto.isDefault ?? false;

      if (isDefault) {
        const scope = {
          practiceId: dto.practiceId,
          practitionerProfileId: dto.practitionerProfileId,
        };
        const priorDefaults = await this.templatesRepo.findActiveDefaults(
          tx,
          CHART.ASSIGNMENT_ACTIVE,
          scope,
        );
        for (const prior of priorDefaults) {
          prior.isDefault = false;
          touch(prior, actor.id);
        }
      }

      const assignment = this.templatesRepo.createAssignment(tx, {
        templateId,
        practiceId: dto.practiceId,
        practitionerProfileId: dto.practitionerProfileId,
        isDefault,
        statusConceptId: CHART.ASSIGNMENT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'chart.template.assign', assignmentId: assignment.id },
        'Chart template assigned',
      );
      return {
        id: assignment.id,
        templateId: assignment.templateId,
        isDefault: assignment.isDefault,
        statusConceptId: assignment.statusConceptId,
      };
    });
  }
}
