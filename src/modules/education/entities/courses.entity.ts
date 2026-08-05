import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `courses`.
 */
@Entity({ schema: 'education', tableName: 'courses' })
export class Courses {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a course type concept.
   */
  @Property({ fieldName: 'course_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  courseTypeConceptId!: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  /**
   * Identificador asociado a level concept.
   */
  @Property({ fieldName: 'level_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  levelConceptId?: string;

  /**
   * Identificador asociado a language concept.
   */
  @Property({ fieldName: 'language_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  languageConceptId?: string;

  /**
   * Identificador asociado a cover file.
   */
  @Property({ fieldName: 'cover_file_id', type: 'uuid', nullable: true }) // FK → common.files
  coverFileId?: string;

  /**
   * Valor de is accredited mantenido por la instancia.
   */
  @Property({ fieldName: 'is_accredited', type: 'boolean', nullable: true })
  isAccredited?: boolean;

  /**
   * Valor de cme credit hours mantenido por la instancia.
   */
  @Property({
    fieldName: 'cme_credit_hours',
    columnType: 'numeric',
    nullable: true,
  })
  cmeCreditHours?: string;

  /**
   * Identificador asociado a accrediting body concept.
   */
  @Property({
    fieldName: 'accrediting_body_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  accreditingBodyConceptId?: string;

  /**
   * Valor de price mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  price?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de duration minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  durationMinutes?: number;

  /**
   * Valor de current version mantenido por la instancia.
   */
  @Property({ fieldName: 'current_version', columnType: 'int' })
  currentVersion!: number;

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
