import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'data_products' })
export class DataProducts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'owner_team_id', type: 'uuid' })
  ownerTeamId!: string;

  @Property({ fieldName: 'business_purpose', columnType: 'text' })
  businessPurpose!: string;

  @Property({ fieldName: 'classification_code', columnType: 'varchar' })
  classificationCode!: string;

  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
