import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `hospital_service_lines`.
 */
@Entity({
  schema: 'organization_extensions',
  tableName: 'hospital_service_lines',
})
export class HospitalServiceLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a hospital.
   */
  @Property({ fieldName: 'hospital_id', type: 'uuid' }) // FK → organization_extensions.hospitals
  hospitalId!: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units
  clinicalUnitId?: string;

  /**
   * Identificador asociado a healthcare service.
   */
  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services
  healthcareServiceId?: string;

  /**
   * Identificador asociado a service line concept.
   */
  @Property({ fieldName: 'service_line_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  serviceLineConceptId!: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  /**
   * Identificador asociado a acuity level concept.
   */
  @Property({
    fieldName: 'acuity_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  acuityLevelConceptId?: string;

  /**
   * Valor de referral required mantenido por la instancia.
   */
  @Property({ fieldName: 'referral_required', type: 'boolean', nullable: true })
  referralRequired?: boolean;

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
