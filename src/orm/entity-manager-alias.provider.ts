import type { Provider } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TransactionInheritingEntityManager } from './transaction-inheriting-entity-manager';

/**
 * With the `entityManager` option set, `MikroOrmCoreModule` registers only the
 * core token and the subclass. 576 files inject the `@mikro-orm/postgresql`
 * token, so it is aliased to the very same instance.
 */
export const ENTITY_MANAGER_ALIAS: Provider = {
  provide: EntityManager,
  useExisting: TransactionInheritingEntityManager,
};
