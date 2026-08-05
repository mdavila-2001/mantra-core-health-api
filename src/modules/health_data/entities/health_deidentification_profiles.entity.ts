import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_deidentification_profiles`.
 */
@Entity({
  schema: 'health_data',
  tableName: 'health_deidentification_profiles',
})
export class HealthDeidentificationProfiles {
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
   * Identificador asociado a methodology concept.
   */
  @Property({ fieldName: 'methodology_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  methodologyConceptId!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

  /**
   * Valor de direct identifier rules json mantenido por la instancia.
   */
  @Property({
    fieldName: 'direct_identifier_rules_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  directIdentifierRulesJson?: unknown;

  /**
   * Valor de quasi identifier rules json mantenido por la instancia.
   */
  @Property({
    fieldName: 'quasi_identifier_rules_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  quasiIdentifierRulesJson?: unknown;

  /**
   * Valor de date shift policy json mantenido por la instancia.
   */
  @Property({
    fieldName: 'date_shift_policy_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  dateShiftPolicyJson?: unknown;

  /**
   * Valor de free text policy json mantenido por la instancia.
   */
  @Property({
    fieldName: 'free_text_policy_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  freeTextPolicyJson?: unknown;

  /**
   * Identificador asociado a reidentification key secret.
   */
  @Property({
    fieldName: 'reidentification_key_secret_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.encryption_keys
  reidentificationKeySecretId?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
