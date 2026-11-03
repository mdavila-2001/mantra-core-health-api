import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `placement_incidents`.
 */
@Entity({ schema: 'clinical', tableName: 'placement_incidents' })
export class PlacementIncidents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters (inferida)
  encounterId!: string;

  /**
   * Identificador asociado a encounter location.
   */
  @Property({
    fieldName: 'encounter_location_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.encounter_locations (inferida)
  encounterLocationId?: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles (inferida)
  patientProfileId!: string;

  /**
   * Valor de violations json mantenido por la instancia.
   */
  @Property({ fieldName: 'violations_json', type: 'json', columnType: 'jsonb' })
  violationsJson!: unknown;

  /**
   * Valor de justification text mantenido por la instancia.
   */
  @Property({ fieldName: 'justification_text', columnType: 'text' })
  justificationText!: string;

  /**
   * Identificador asociado a authorized by user.
   */
  @Property({ fieldName: 'authorized_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  authorizedByUserId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Identificador asociado a reviewed by user.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  reviewedByUserId?: string;

  /**
   * Valor de reviewed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

  /**
   * Valor de review note mantenido por la instancia.
   */
  @Property({ fieldName: 'review_note', columnType: 'text', nullable: true })
  reviewNote?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
