import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `vector_tenant_bindings`.
 */
@Entity({ schema: 'vector_rag', tableName: 'vector_tenant_bindings' })
export class VectorTenantBindings {
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
   * Identificador asociado a vector collection.
   */
  @Property({ fieldName: 'vector_collection_id', type: 'uuid' })
  vectorCollectionId!: string;

  /**
   * Valor de namespace mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  namespace!: string;

  /**
   * Valor de encryption profile code mantenido por la instancia.
   */
  @Property({ fieldName: 'encryption_profile_code', columnType: 'varchar' })
  encryptionProfileCode!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
