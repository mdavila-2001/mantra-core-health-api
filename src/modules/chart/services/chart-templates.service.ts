import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ChartTemplatesRepository } from '../repositories';
import { CHART } from '../chart.concepts';
import { FORMS } from '../../forms/forms.concepts';
import {
  AssignmentResponseDto,
  AssignTemplateDto,
  CHART_TEMPLATE_PROVENANCE_FIELD_CODE,
  ChartTemplateFieldDto,
  ChartTemplateProvenanceDto,
  ChartTemplateResponseDto,
  CreateChartTemplateDto,
} from '../dto';

/** El esquema de una plantilla, ya separado de su ficha de catálogo. */
interface ResolvedSchema {
  /** Los campos que un médico completa, sin la clave reservada. */
  fields: ChartTemplateFieldDto[];
  /** De dónde salió la plantilla, si vino del catálogo sembrado. */
  provenance?: ChartTemplateProvenanceDto;
}

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
          // Recién creada por un administrador: propia si nació con tenant.
          own: assignment.tenantId != null,
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
      return this.toResponse(template, { fields });
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
        const schema = await this.resolveSchema(template.sectionId);
        return this.toResponse(template, schema);
      }),
    );
  }

  /**
   * El esquema completo de una plantilla, por id.
   *
   * Mismo aislamiento que el listado: se sirven las globales (sin tenant) y
   * las del tenant del actor. La de otra organización responde **404 y no
   * 403**: confirmar que ese uuid existe ya filtra información.
   *
   * @param id - Identificador de la plantilla.
   * @param tenantId - Tenant del actor, si el contexto lo fijó.
   */
  async getTemplate(
    id: string,
    tenantId?: string,
  ): Promise<ChartTemplateResponseDto> {
    const template = await this.templatesRepo.findTemplateById(this.em, id);
    if (!template || (template.tenantId && template.tenantId !== tenantId)) {
      throw new ResourceNotFoundException('Plantilla no encontrada', { id });
    }
    const schema = await this.resolveSchema(template.sectionId);
    return this.toResponse(template, schema);
  }

  /**
   * Compone los campos de una sección, en su orden de presentación, y separa la
   * ficha de catálogo de los campos que un médico completa.
   *
   * La separación es lo que permite que la procedencia de un formulario del
   * catálogo (carril R2-5) viaje dentro del esquema mientras
   * `specialty_chart_templates` no tenga columnas para ella, sin que ningún
   * consumidor la vea como un campo más. Una plantilla armada a mano no trae la
   * clave reservada y responde exactamente lo mismo que antes.
   */
  private async resolveSchema(
    sectionId: string | undefined,
  ): Promise<ResolvedSchema> {
    if (!sectionId) return { fields: [] };
    const assignments = await this.templatesRepo.findFieldAssignmentsBySection(
      this.em,
      sectionId,
      getCurrentTenantId(),
    );
    if (assignments.length === 0) return { fields: [] };

    const fieldDefinitions = await this.templatesRepo.findFieldDefinitionsByIds(
      this.em,
      assignments.map((a) => a.fieldId),
    );
    const fieldById = new Map(fieldDefinitions.map((f) => [f.id, f]));

    let provenance: ChartTemplateProvenanceDto | undefined;
    const fields: ChartTemplateFieldDto[] = [];

    for (const assignment of assignments) {
      const field = fieldById.get(assignment.fieldId);
      if (!field) continue;

      // El código viene prefijado con el de la plantilla porque
      // `dynamic_field_definitions` es una tabla global; se compara el sufijo.
      if (esClaveDeCatalogo(field.code)) {
        provenance = leerProcedencia(field.defaultValueJson);
        continue;
      }

      fields.push({
        assignmentId: assignment.id,
        fieldId: field.id,
        code: field.code,
        name: field.name,
        dataType: field.dataType as ChartTemplateFieldDto['dataType'],
        valueSetId: field.valueSetId,
        required: assignment.required,
        ordinal: assignment.ordinal,
        // Los del estándar son globales; los que agregó la organización llevan
        // su tenant. La consulta ya trajo sólo esos dos grupos.
        own: assignment.tenantId != null,
      });
    }

    return { fields, provenance };
  }

  /**
   * Ensambla la respuesta pública de una plantilla.
   *
   * @param template - Plantilla persistida.
   * @param schema - Campos y ficha de catálogo, ya resueltos.
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
      sectionId?: string;
    },
    schema: ResolvedSchema,
  ): ChartTemplateResponseDto {
    return {
      id: template.id,
      specialtyConceptId: template.specialtyConceptId,
      tenantId: template.tenantId,
      code: template.code,
      name: template.name,
      version: template.version,
      statusConceptId: template.statusConceptId,
      sectionId: template.sectionId,
      fieldTargetConceptId: CHART.TEMPLATE_FIELD_TARGET,
      fields: schema.fields,
      provenance: schema.provenance,
    };
  }
}

/**
 * Si un código de campo es el de la clave reservada de catálogo.
 *
 * Se compara el sufijo porque el seed prefija cada código con el de su
 * plantilla —`dynamic_field_definitions` es una tabla global y quince
 * formularios comparten nombres de campo—, pero se acepta también el código
 * pelado: una plantilla podría traer la clave sin prefijo.
 */
function esClaveDeCatalogo(code: string): boolean {
  return (
    code === CHART_TEMPLATE_PROVENANCE_FIELD_CODE ||
    code.endsWith(`.${CHART_TEMPLATE_PROVENANCE_FIELD_CODE}`)
  );
}

/**
 * Lee la ficha de catálogo del `default_value_json` de la clave reservada.
 *
 * Devuelve `undefined` si el contenido no tiene la forma esperada en vez de
 * lanzar: una plantilla con la clave mal escrita tiene que seguir siendo
 * legible y completable — se pierde el renglón de procedencia, no el
 * formulario.
 */
function leerProcedencia(
  value: unknown,
): ChartTemplateProvenanceDto | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const raw = value as Record<string, unknown>;
  const requeridos = [
    'sourceTitle',
    'organization',
    'url',
    'license',
    'retrievedAt',
  ] as const;
  if (requeridos.some((key) => typeof raw[key] !== 'string')) return undefined;

  return {
    sourceTitle: raw.sourceTitle as string,
    organization: raw.organization as string,
    url: raw.url as string,
    license: raw.license as string,
    sourceVersion:
      typeof raw.sourceVersion === 'string' ? raw.sourceVersion : undefined,
    retrievedAt: raw.retrievedAt as string,
    note: typeof raw.note === 'string' ? raw.note : undefined,
  };
}
