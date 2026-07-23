import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_access_scopes' })
export class GraphAccessScopes {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'scope_code', columnType: 'varchar' })
  scopeCode!: string;

  @Property({ fieldName: 'allowed_node_types', type: 'array' })
  allowedNodeTypes!: string[];

  @Property({ fieldName: 'allowed_relationship_types', type: 'array' })
  allowedRelationshipTypes!: string[];

  @Property({ fieldName: 'purpose_of_use_codes', type: 'array' })
  purposeOfUseCodes!: string[];

  @Property({ fieldName: 'max_hops', columnType: 'smallint' })
  maxHops!: number;

  @Property({ fieldName: 'requires_patient_context', type: 'boolean' })
  requiresPatientContext!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;
}
