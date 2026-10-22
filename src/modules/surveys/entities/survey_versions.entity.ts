import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `survey_versions`.
 *
 * Una versión publicada es **inmutable**: sus preguntas ya no se tocan. Es lo
 * que permite que una respuesta de hace seis meses siga significando lo mismo
 * que el día que se dio. Corregir el instrumento significa publicar una versión
 * nueva, no editar la vigente.
 *
 * La vigencia (`effectiveFrom` / `effectiveTo`) es el requisito «configurar la
 * vigencia de la encuesta» de ALOVIDA: fuera de esa ventana no se emiten
 * invitaciones nuevas, pero las ya emitidas siguen siendo contestables hasta
 * que expire su propia ventana.
 */
@Entity({ schema: 'surveys', tableName: 'survey_versions' })
export class SurveyVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a survey template.
   */
  @Property({ fieldName: 'survey_template_id', type: 'uuid' }) // FK → surveys.survey_templates
  surveyTemplateId!: string;

  /**
   * Número de versión, correlativo dentro de la plantilla y arrancando en 1.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a publication status concept.
   */
  @Property({ fieldName: 'publication_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  publicationStatusConceptId!: string;

  /**
   * Inicio de vigencia. Nulo mientras la versión sigue en borrador.
   */
  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

  /**
   * Fin de vigencia. Nulo significa vigencia abierta.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Plazo, en días, que tiene el paciente para responder desde que se le emite
   * la invitación. Es distinto de la vigencia de la versión: la vigencia dice
   * hasta cuándo se reparte el instrumento; esto, cuánto dura cada reparto.
   */
  @Property({ fieldName: 'response_window_days', columnType: 'int' })
  responseWindowDays!: number;

  /**
   * Momento de publicación. Nulo mientras es borrador.
   */
  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

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
