import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ChartTemplatesRepository } from '../repositories';
import { CHART } from '../chart.concepts';
import { FORMS } from '../../forms/forms.concepts';
import {
  AssignmentResponseDto,
  AssignTemplateDto,
  ChartTemplateFieldDto,
  ChartTemplateResponseDto,
  CreateChartTemplateDto,
} from '../dto';

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

  /**
   * Crea una plantilla de chart por especialidad con su esquema de campos.
   *
   * Cada campo declarado se materializa como un `forms.dynamic_field_definitions`
   * propio, asignado (`forms.field_assignments`) a una sección
   * (`forms.dynamic_field_sections`) creada para esta plantilla — el mismo motor
   * que gobierna el resto de la extensibilidad dinámica, sin pasar por el flujo
   * de sets/versiones publicados (pensado para esquemas compartidos y
   * migrables), que esta plantilla de especialidad no necesita.
   */
  async createTemplate(
    dto: CreateChartTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<ChartTemplateResponseDto> {
    this.logger.info(
      { operation: 'chart.template.create', code: dto.code },
      'Creating chart template',
    );
    return this.em.transactional(async (tx) => {
      const template = this.templatesRepo.createTemplate(tx, {
        specialtyConceptId: dto.specialtyConceptId,
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        statusConceptId: CHART.TEMPLATE_ACTIVE,
        actorUserId: actor.id,
      });
      const section = this.templatesRepo.createTemplateSection(tx, {
        code: `CHART_TPL-${dto.code}`,
        name: dto.name,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      // FK planas: persistir plantilla y sección antes de referenciarlas.
      await tx.flush();
      template.sectionId = section.id;

      const fields: ChartTemplateFieldDto[] = [];
      for (const [i, input] of dto.fields.entries()) {
        const field = this.templatesRepo.createTemplateField(tx, {
          code: input.code,
          name: input.name,
          dataType: input.dataType,
          valueSetId: input.valueSetId,
          stateConceptId: FORMS.FIELD_ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();

        const assignment = this.templatesRepo.createTemplateFieldAssignment(
          tx,
          {
            fieldId: field.id,
            targetResourceConceptId: CHART.TEMPLATE_FIELD_TARGET,
            sectionId: section.id,
            tenantId: dto.tenantId,
            required: input.required ?? false,
            ordinal: input.ordinal ?? i,
            stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
            actorUserId: actor.id,
          },
        );

        fields.push({
          assignmentId: assignment.id,
          fieldId: field.id,
          code: field.code,
          name: field.name,
          dataType: input.dataType,
          valueSetId: field.valueSetId,
          required: assignment.required,
          ordinal: assignment.ordinal,
        });
      }

      this.logger.info(
        {
          operation: 'chart.template.create',
          templateId: template.id,
          fields: fields.length,
        },
        'Chart template created',
      );
      return this.toResponse(template, fields);
    });
  }

  /** Plantillas por especialidad, con su esquema de campos ya resuelto. */
  async listTemplates(
    specialtyConceptId?: string,
    tenantId?: string,
  ): Promise<ChartTemplateResponseDto[]> {
    const templates = await this.templatesRepo.findTemplates(
      this.em,
      specialtyConceptId,
      tenantId,
    );
    return Promise.all(
      templates.map(async (template) => {
        const fields = await this.resolveFields(template.sectionId);
        return this.toResponse(template, fields);
      }),
    );
  }

  /** El esquema completo de una plantilla, por id. */
  async getTemplate(id: string): Promise<ChartTemplateResponseDto> {
    const template = await this.templatesRepo.findTemplateById(this.em, id);
    if (!template) {
      throw new ResourceNotFoundException('Plantilla no encontrada', { id });
    }
    const fields = await this.resolveFields(template.sectionId);
    return this.toResponse(template, fields);
  }

  /** Compone los campos de una sección, en su orden de presentación. */
  private async resolveFields(
    sectionId: string | undefined,
  ): Promise<ChartTemplateFieldDto[]> {
    if (!sectionId) return [];
    const assignments = await this.templatesRepo.findFieldAssignmentsBySection(
      this.em,
      sectionId,
    );
    if (assignments.length === 0) return [];

    const fieldDefinitions = await this.templatesRepo.findFieldDefinitionsByIds(
      this.em,
      assignments.map((a) => a.fieldId),
    );
    const fieldById = new Map(fieldDefinitions.map((f) => [f.id, f]));

    return assignments
      .map((assignment): ChartTemplateFieldDto | null => {
        const field = fieldById.get(assignment.fieldId);
        if (!field) return null;
        return {
          assignmentId: assignment.id,
          fieldId: field.id,
          code: field.code,
          name: field.name,
          dataType: field.dataType as ChartTemplateFieldDto['dataType'],
          valueSetId: field.valueSetId,
          required: assignment.required,
          ordinal: assignment.ordinal,
        };
      })
      .filter((f): f is ChartTemplateFieldDto => f !== null);
  }

  /**
   * Ensambla la respuesta pública de una plantilla.
   *
   * @param template - Plantilla persistida.
   * @param fields - Campos de su esquema, ya resueltos.
   */
  private toResponse(
    template: {
      id: string;
      specialtyConceptId: string;
      tenantId?: string;
      code: string;
      name: string;
      version: number;
      statusConceptId: string;
    },
    fields: ChartTemplateFieldDto[],
  ): ChartTemplateResponseDto {
    return {
      id: template.id,
      specialtyConceptId: template.specialtyConceptId,
      tenantId: template.tenantId,
      code: template.code,
      name: template.name,
      version: template.version,
      statusConceptId: template.statusConceptId,
      fields,
    };
  }
}
