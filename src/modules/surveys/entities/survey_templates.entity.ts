import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `survey_templates`.
 *
 * La plantilla es el instrumento tal como lo piensa el profesional («Encuesta
 * de satisfacción post-consulta»). No contiene preguntas: éstas cuelgan de una
 * versión, porque ALOVIDA exige versionado y vigencia (CAN-VERSION-001) y una
 * pregunta editada después de que alguien respondió invalidaría su respuesta.
 */
@Entity({ schema: 'surveys', tableName: 'survey_templates' })
export class SurveyTemplates {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Profesional dueño del instrumento. Es quien puede editarlo y quien puede
   * leer las respuestas: la autorización de lectura sale de acá, no de un rol.
   * Nulo cuando el dueño es el par tipado (`ownerTypeConceptId` + `ownerId`),
   * como en la encuesta base del sistema.
   */
  @Property({
    fieldName: 'owner_practitioner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  ownerPractitionerId?: string;

  /**
   * Tipo del dueño alterno (CAN-SURVEY-001). Va junto con `ownerId` y sólo
   * cuando `ownerPractitionerId` es nulo. Para la encuesta base del sistema es
   * `SURVEYS.SYSTEM_BASE_CONSULTATION` o `SURVEYS.SYSTEM_BASE_SERVICE`.
   */
  @Property({
    fieldName: 'owner_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  ownerTypeConceptId?: string;

  /**
   * Identificador del dueño alterno, interpretado según `ownerTypeConceptId`.
   * Para la encuesta base del sistema es el tenant al que pertenece.
   */
  @Property({ fieldName: 'owner_id', type: 'uuid', nullable: true })
  ownerId?: string;

  /**
   * Título visible del instrumento.
   */
  @Property({ columnType: 'text' })
  title!: string;

  /**
   * Descripción o consigna que se muestra al paciente antes de responder.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
