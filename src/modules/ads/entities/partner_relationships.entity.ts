import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `partner_relationships`.
 */
@Entity({ schema: 'ads', tableName: 'partner_relationships' })
export class PartnerRelationships {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a business manager.
   */
  @Property({ fieldName: 'business_manager_id', type: 'uuid' }) // FK → ads.business_managers
  businessManagerId!: string;

  /**
   * Identificador asociado a partner.
   */
  @Property({ fieldName: 'partner_id', type: 'uuid' }) // FK → ads.ad_partners
  partnerId!: string;

  /**
   * Identificador asociado a relationship type concept.
   */
  @Property({ fieldName: 'relationship_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipTypeConceptId!: string;

  /**
   * Valor de permissions json mantenido por la instancia.
   */
  @Property({
    fieldName: 'permissions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  permissionsJson?: unknown;

  /**
   * Valor de shared asset scope json mantenido por la instancia.
   */
  @Property({
    fieldName: 'shared_asset_scope_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sharedAssetScopeJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
