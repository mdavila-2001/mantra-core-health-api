import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `hospitals`.
 */
@Entity({ schema: 'organization_extensions', tableName: 'hospitals' })
export class Hospitals {
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
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a primary practice site.
   */
  @Property({
    fieldName: 'primary_practice_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practice_sites
  primaryPracticeSiteId?: string;

  /**
   * Identificador asociado a public profile.
   */
  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  publicProfileId?: string;

  /**
   * Identificador asociado a hospital type concept.
   */
  @Property({ fieldName: 'hospital_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  hospitalTypeConceptId!: string;

  /**
   * Identificador asociado a care level concept.
   */
  @Property({
    fieldName: 'care_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  careLevelConceptId?: string;

  /**
   * Identificador asociado a ownership type concept.
   */
  @Property({
    fieldName: 'ownership_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  ownershipTypeConceptId?: string;

  /**
   * Identificador asociado a teaching status concept.
   */
  @Property({
    fieldName: 'teaching_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  teachingStatusConceptId?: string;

  /**
   * Identificador asociado a emergency capability concept.
   */
  @Property({
    fieldName: 'emergency_capability_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  emergencyCapabilityConceptId?: string;

  /**
   * Valor de licensed bed capacity mantenido por la instancia.
   */
  @Property({
    fieldName: 'licensed_bed_capacity',
    columnType: 'int',
    nullable: true,
  })
  licensedBedCapacity?: number;

  /**
   * Valor de operational bed capacity mantenido por la instancia.
   */
  @Property({
    fieldName: 'operational_bed_capacity',
    columnType: 'int',
    nullable: true,
  })
  operationalBedCapacity?: number;

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
