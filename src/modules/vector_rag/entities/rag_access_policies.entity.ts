import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'rag_access_policies' })
export class RagAccessPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'allowed_principal_types', type: 'array' })
  allowedPrincipalTypes!: string[];

  @Property({ fieldName: 'allowed_purpose_codes', type: 'array' })
  allowedPurposeCodes!: string[];

  @Property({ fieldName: 'allowed_security_labels', type: 'array' })
  allowedSecurityLabels!: string[];

  @Property({ fieldName: 'patient_scope_required', type: 'boolean' })
  patientScopeRequired!: boolean;

  @Property({ fieldName: 'consent_required', type: 'boolean' })
  consentRequired!: boolean;

  @Property({ fieldName: 'field_redaction_profile', columnType: 'varchar' })
  fieldRedactionProfile!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
