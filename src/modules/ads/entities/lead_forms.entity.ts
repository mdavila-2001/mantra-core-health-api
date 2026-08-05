import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lead_forms`.
 */
@Entity({ schema: 'ads', tableName: 'lead_forms' })
export class LeadForms {
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
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Identificador asociado a ad identity asset.
   */
  @Property({ fieldName: 'ad_identity_asset_id', type: 'uuid', nullable: true }) // FK → ads.ad_identity_assets
  adIdentityAssetId?: string;

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
   * Identificador asociado a external form.
   */
  @Property({
    fieldName: 'external_form_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalFormId?: string;

  /**
   * Identificador asociado a form type concept.
   */
  @Property({ fieldName: 'form_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  formTypeConceptId!: string;

  /**
   * Valor de privacy policy url mantenido por la instancia.
   */
  @Property({
    fieldName: 'privacy_policy_url',
    columnType: 'varchar',
    nullable: true,
  })
  privacyPolicyUrl?: string;

  /**
   * Valor de completion message mantenido por la instancia.
   */
  @Property({
    fieldName: 'completion_message',
    columnType: 'text',
    nullable: true,
  })
  completionMessage?: string;

  /**
   * Identificador asociado a destination crm pipeline.
   */
  @Property({
    fieldName: 'destination_crm_pipeline_id',
    type: 'uuid',
    nullable: true,
  }) // FK → crm.pipelines
  destinationCrmPipelineId?: string;

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
