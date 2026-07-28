import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `guardrail_policies`.
 */
@Entity({ schema: 'automation', tableName: 'guardrail_policies' })
export class GuardrailPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

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
   * Identificador asociado a policy type concept.
   */
  @Property({ fieldName: 'policy_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  policyTypeConceptId!: string;

  /**
   * Valor de rule json mantenido por la instancia.
   */
  @Property({
    fieldName: 'rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  ruleJson?: unknown;

  /**
   * Identificador asociado a pii phi handling concept.
   */
  @Property({
    fieldName: 'pii_phi_handling_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  piiPhiHandlingConceptId?: string;

  /**
   * Valor de max cost amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'max_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  maxCostAmount?: string;

  /**
   * Identificador asociado a enforcement concept.
   */
  @Property({ fieldName: 'enforcement_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  enforcementConceptId!: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
