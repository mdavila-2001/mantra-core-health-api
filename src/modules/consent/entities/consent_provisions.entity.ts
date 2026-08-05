import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `consent_provisions`.
 */
@Entity({ schema: 'consent', tableName: 'consent_provisions' })
export class ConsentProvisions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a consent.
   */
  @Property({ fieldName: 'consent_id', type: 'uuid' }) // FK → consent.consents
  consentId!: string;

  /**
   * Identificador asociado a provision type concept.
   */
  @Property({ fieldName: 'provision_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  provisionTypeConceptId!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a data class concept.
   */
  @Property({
    fieldName: 'data_class_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataClassConceptId?: string;

  /**
   * Identificador asociado a actor tenant.
   */
  @Property({ fieldName: 'actor_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  actorTenantId?: string;

  /**
   * Identificador asociado a actor user.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actorUserId?: string;

  /**
   * Identificador asociado a actor role concept.
   */
  @Property({
    fieldName: 'actor_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  actorRoleConceptId?: string;

  /**
   * Identificador asociado a purpose of use concept.
   */
  @Property({
    fieldName: 'purpose_of_use_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId?: string;

  /**
   * Identificador asociado a security label concept.
   */
  @Property({
    fieldName: 'security_label_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  securityLabelConceptId?: string;

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
