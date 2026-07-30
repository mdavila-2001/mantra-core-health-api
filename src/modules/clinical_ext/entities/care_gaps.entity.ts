import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `care_gaps`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'care_gaps' })
export class CareGaps {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a gap type concept.
   */
  @Property({ fieldName: 'gap_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  gapTypeConceptId!: string;

  /**
   * Identificador asociado a measure concept.
   */
  @Property({ fieldName: 'measure_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  measureConceptId?: string;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de closed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

  /**
   * Valor de closed by resource type mantenido por la instancia.
   */
  @Property({
    fieldName: 'closed_by_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  closedByResourceType?: string;

  /**
   * Identificador asociado a closed by resource.
   */
  @Property({
    fieldName: 'closed_by_resource_id',
    type: 'uuid',
    nullable: true,
  })
  closedByResourceId?: string;

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
