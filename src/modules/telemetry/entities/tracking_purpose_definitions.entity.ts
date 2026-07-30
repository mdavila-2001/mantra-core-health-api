import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tracking_purpose_definitions`.
 */
@Entity({ schema: 'telemetry', tableName: 'tracking_purpose_definitions' })
export class TrackingPurposeDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de purpose code mantenido por la instancia.
   */
  @Property({ fieldName: 'purpose_code', columnType: 'varchar' })
  purposeCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a purpose category concept.
   */
  @Property({ fieldName: 'purpose_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeCategoryConceptId!: string;

  /**
   * Identificador asociado a legal basis concept.
   */
  @Property({
    fieldName: 'legal_basis_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  legalBasisConceptId?: string;

  /**
   * Valor de requires consent mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_consent', type: 'boolean', nullable: true })
  requiresConsent?: boolean;

  /**
   * Valor de permits marketing use mantenido por la instancia.
   */
  @Property({
    fieldName: 'permits_marketing_use',
    type: 'boolean',
    nullable: true,
  })
  permitsMarketingUse?: boolean;

  /**
   * Valor de permits cross tenant aggregation mantenido por la instancia.
   */
  @Property({
    fieldName: 'permits_cross_tenant_aggregation',
    type: 'boolean',
    nullable: true,
  })
  permitsCrossTenantAggregation?: boolean;

  /**
   * Valor de default retention days mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_retention_days',
    columnType: 'int',
    nullable: true,
  })
  defaultRetentionDays?: number;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
