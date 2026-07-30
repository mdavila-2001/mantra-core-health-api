import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_access_scopes`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_access_scopes' })
export class GraphAccessScopes {
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
   * Valor de scope code mantenido por la instancia.
   */
  @Property({ fieldName: 'scope_code', columnType: 'varchar' })
  scopeCode!: string;

  /**
   * Valor de allowed node types mantenido por la instancia.
   */
  @Property({ fieldName: 'allowed_node_types', type: 'array' })
  allowedNodeTypes!: string[];

  /**
   * Valor de allowed relationship types mantenido por la instancia.
   */
  @Property({ fieldName: 'allowed_relationship_types', type: 'array' })
  allowedRelationshipTypes!: string[];

  /**
   * Valor de purpose of use codes mantenido por la instancia.
   */
  @Property({ fieldName: 'purpose_of_use_codes', type: 'array' })
  purposeOfUseCodes!: string[];

  /**
   * Valor de max hops mantenido por la instancia.
   */
  @Property({ fieldName: 'max_hops', columnType: 'smallint' })
  maxHops!: number;

  /**
   * Valor de requires patient context mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_patient_context', type: 'boolean' })
  requiresPatientContext!: boolean;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
