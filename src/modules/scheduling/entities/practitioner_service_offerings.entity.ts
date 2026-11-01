import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_service_offerings`.
 */
@Entity({ schema: 'scheduling', tableName: 'practitioner_service_offerings' })
export class PractitionerServiceOfferings {
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
   * Identificador asociado a service catalog.
   */
  @Property({ fieldName: 'service_catalog_id', type: 'uuid' }) // FK → billing.service_catalog (inferida)
  serviceCatalogId!: string;

  /**
   * Valor de min duration minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'min_duration_minutes', columnType: 'int' })
  minDurationMinutes!: number;

  /**
   * Valor de max duration minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'max_duration_minutes', columnType: 'int' })
  maxDurationMinutes!: number;

  /**
   * Valor de prep minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'prep_minutes', columnType: 'int', nullable: true })
  prepMinutes?: number;

  /**
   * Valor de cleanup minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'cleanup_minutes', columnType: 'int', nullable: true })
  cleanupMinutes?: number;

  /**
   * Valor de is patient bookable mantenido por la instancia.
   */
  @Property({ fieldName: 'is_patient_bookable', type: 'boolean' })
  isPatientBookable!: boolean;

  /**
   * Valor de requires approval mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_approval', type: 'boolean' })
  requiresApproval!: boolean;

  /**
   * Identificador asociado a channel concept.
   */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  channelConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
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

  /**
   * Valor de pre visit instructions mantenido por la instancia.
   */
  @Property({
    fieldName: 'pre_visit_instructions',
    columnType: 'text',
    nullable: true,
  })
  preVisitInstructions?: string;
}
