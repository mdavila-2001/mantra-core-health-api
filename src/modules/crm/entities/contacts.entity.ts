import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contacts`.
 */
@Entity({ schema: 'crm', tableName: 'contacts' })
export class Contacts {
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
   * Identificador asociado a crm account.
   */
  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  /**
   * Valor de first name mantenido por la instancia.
   */
  @Property({ fieldName: 'first_name', columnType: 'varchar' })
  firstName!: string;

  /**
   * Valor de last name mantenido por la instancia.
   */
  @Property({ fieldName: 'last_name', columnType: 'varchar', nullable: true })
  lastName?: string;

  /**
   * Identificador asociado a contact type concept.
   */
  @Property({ fieldName: 'contact_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contactTypeConceptId!: string;

  /**
   * Valor de job title mantenido por la instancia.
   */
  @Property({ fieldName: 'job_title', columnType: 'varchar', nullable: true })
  jobTitle?: string;

  /**
   * Identificador asociado a linked user.
   */
  @Property({ fieldName: 'linked_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  linkedUserId?: string;

  /**
   * Valor de linked profile ref type mantenido por la instancia.
   */
  @Property({
    fieldName: 'linked_profile_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  linkedProfileRefType?: string;

  /**
   * Identificador asociado a linked profile ref.
   */
  @Property({
    fieldName: 'linked_profile_ref_id',
    type: 'uuid',
    nullable: true,
  })
  linkedProfileRefId?: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Identificador asociado a lifecycle stage concept.
   */
  @Property({
    fieldName: 'lifecycle_stage_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lifecycleStageConceptId?: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  /**
   * Valor de do not contact mantenido por la instancia.
   */
  @Property({ fieldName: 'do_not_contact', type: 'boolean', nullable: true })
  doNotContact?: boolean;

  /**
   * Identificador asociado a marketing consent.
   */
  @Property({ fieldName: 'marketing_consent_id', type: 'uuid', nullable: true }) // FK → consent.consents
  marketingConsentId?: string;

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
