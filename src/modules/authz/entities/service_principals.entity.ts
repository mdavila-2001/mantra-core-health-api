import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'authz', tableName: 'service_principals' })
export class ServicePrincipals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();
}
