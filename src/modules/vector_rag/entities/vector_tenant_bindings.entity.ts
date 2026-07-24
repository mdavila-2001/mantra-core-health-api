import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'vector_tenant_bindings' })
export class VectorTenantBindings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'vector_collection_id', type: 'uuid' })
  vectorCollectionId!: string;

  @Property({ columnType: 'varchar' })
  namespace!: string;

  @Property({ fieldName: 'encryption_profile_code', columnType: 'varchar' })
  encryptionProfileCode!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
