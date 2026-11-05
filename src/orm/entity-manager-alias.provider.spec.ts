import { describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Configuration } from '@mikro-orm/core';
import { EntityManager, defineConfig } from '@mikro-orm/postgresql';
import { ENTITY_MANAGER_ALIAS } from './entity-manager-alias.provider';
import { TransactionInheritingEntityManager } from './transaction-inheriting-entity-manager';

// Importing `OrmModule` validates the database variables while loading; this
// spec only reads metadata and opens no connection.
const PLACEHOLDER_DB_ENV: Record<string, string> = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'alias_spec',
  DB_PASSWORD: 'alias_spec',
  DB_NAME: 'alias_spec',
};

describe('OrmModule entity manager alias', () => {
  it('provides and exports the @mikro-orm/postgresql token', async () => {
    for (const [key, value] of Object.entries(PLACEHOLDER_DB_ENV)) {
      process.env[key] ??= value;
    }
    // Variable path: a relative `import()` without extension does not resolve
    // under `moduleResolution: nodenext` (same as storage-delete-adapters.spec).
    const ormModulePath: string = './orm.module';
    const { OrmModule } = (await import(
      ormModulePath
    )) as typeof import('./orm.module');

    const providers: unknown[] = Reflect.getMetadata('providers', OrmModule);
    const exported: unknown[] = Reflect.getMetadata('exports', OrmModule);

    expect(providers).toContain(ENTITY_MANAGER_ALIAS);
    expect(exported).toContain(EntityManager);
  });

  it('resolves both tokens to the same instance', async () => {
    const em = new Configuration(
      defineConfig({
        dbName: 'alias_spec',
        entities: [],
        entityManager: TransactionInheritingEntityManager,
        discovery: { warnWhenNoEntities: false },
      }),
      false,
    )
      .getDriver()
      .createEntityManager();
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: TransactionInheritingEntityManager, useValue: em },
        ENTITY_MANAGER_ALIAS,
      ],
    }).compile();

    expect(moduleRef.get(EntityManager)).toBe(
      moduleRef.get(TransactionInheritingEntityManager),
    );
  });
});
