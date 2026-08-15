import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `survey_assignments`.
 *
 * Conecta una versión publicada con la cosa evaluada. REDESA lo pide como
 * «asociar encuestas a una consulta, servicio o tipo de atención», y por eso el
 * destino es un par `(tipo, id)` en vez de tres columnas nullable: los tres
 * casos son el mismo hecho —a qué se le pregunta— y separarlos obligaría a
 * repetir la lógica de emisión una vez por columna.
 */
@Entity({ schema: 'surveys', tableName: 'survey_assignments' })
export class SurveyAssignments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a survey version.
   */
  @Property({ fieldName: 'survey_version_id', type: 'uuid' }) // FK → surveys.survey_versions
  surveyVersionId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a target type concept.
   */
  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  /**
   * Identificador de la cosa evaluada, interpretado según `targetTypeConceptId`:
   * la reserva concreta, el servicio de salud o el tipo de atención.
   */
  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  /**
   * Si la asignación sigue vigente. Desactivarla frena las emisiones nuevas sin
   * borrar el histórico de lo ya emitido.
   */
  @Property({ fieldName: 'active', columnType: 'boolean' })
  active!: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
