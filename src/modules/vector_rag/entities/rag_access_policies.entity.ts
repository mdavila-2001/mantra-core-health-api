import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `rag_access_policies`.
 */
@Entity({ schema: 'vector_rag', tableName: 'rag_access_policies' })
export class RagAccessPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de allowed principal types mantenido por la instancia.
   */
  @Property({ fieldName: 'allowed_principal_types', type: 'array' })
  allowedPrincipalTypes!: string[];

  /**
   * Valor de allowed purpose codes mantenido por la instancia.
   */
  @Property({ fieldName: 'allowed_purpose_codes', type: 'array' })
  allowedPurposeCodes!: string[];

  /**
   * Valor de allowed security labels mantenido por la instancia.
   */
  @Property({ fieldName: 'allowed_security_labels', type: 'array' })
  allowedSecurityLabels!: string[];

  /**
   * Valor de patient scope required mantenido por la instancia.
   */
  @Property({ fieldName: 'patient_scope_required', type: 'boolean' })
  patientScopeRequired!: boolean;

  /**
   * Valor de consent required mantenido por la instancia.
   */
  @Property({ fieldName: 'consent_required', type: 'boolean' })
  consentRequired!: boolean;

  /**
   * Valor de field redaction profile mantenido por la instancia.
   */
  @Property({ fieldName: 'field_redaction_profile', columnType: 'varchar' })
  fieldRedactionProfile!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
