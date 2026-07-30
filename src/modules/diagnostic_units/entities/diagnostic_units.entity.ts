import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_units`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_units' })
export class DiagnosticUnits {
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
  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

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
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a diagnostic unit type concept.
   */
  @Property({ fieldName: 'diagnostic_unit_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  diagnosticUnitTypeConceptId!: string;

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
   * Identificador asociado a public profile.
   */
  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  publicProfileId?: string;

  /**
   * Valor de accepts external orders mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepts_external_orders',
    type: 'boolean',
    nullable: true,
  })
  acceptsExternalOrders?: boolean;

  /**
   * Valor de walk in available mantenido por la instancia.
   */
  @Property({ fieldName: 'walk_in_available', type: 'boolean', nullable: true })
  walkInAvailable?: boolean;

  /**
   * Valor de home collection available mantenido por la instancia.
   */
  @Property({
    fieldName: 'home_collection_available',
    type: 'boolean',
    nullable: true,
  })
  homeCollectionAvailable?: boolean;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
