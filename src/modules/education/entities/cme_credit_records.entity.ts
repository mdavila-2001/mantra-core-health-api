import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cme_credit_records`.
 */
@Entity({ schema: 'education', tableName: 'cme_credit_records' })
export class CmeCreditRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practitioner profile.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * Identificador asociado a certificate.
   */
  @Property({ fieldName: 'certificate_id', type: 'uuid', nullable: true }) // FK → education.certificates
  certificateId?: string;

  /**
   * Valor de credit hours mantenido por la instancia.
   */
  @Property({ fieldName: 'credit_hours', columnType: 'numeric' })
  creditHours!: string;

  /**
   * Identificador asociado a accrediting body concept.
   */
  @Property({ fieldName: 'accrediting_body_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accreditingBodyConceptId!: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  /**
   * Valor de awarded on mantenido por la instancia.
   */
  @Property({ fieldName: 'awarded_on', columnType: 'date', nullable: true })
  awardedOn?: Date;

  /**
   * Valor de period year mantenido por la instancia.
   */
  @Property({ fieldName: 'period_year', columnType: 'int', nullable: true })
  periodYear?: number;

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
