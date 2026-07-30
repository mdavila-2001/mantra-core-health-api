import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `service_principals`.
 */
@Entity({ schema: 'authz', tableName: 'service_principals' })
export class ServicePrincipals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();
}
