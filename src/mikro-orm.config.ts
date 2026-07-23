import 'dotenv/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { loadDatabaseEnv } from './config/database.env';

/**
 * Configuración de runtime de MikroORM (capa relacional PostgreSQL).
 * La consumen tanto `MikroOrmModule.forRoot` (NestJS) como la CLI de MikroORM.
 * El generador de entidades por introspección (guía ORM §2.3) vive aparte, en
 * `mikro-orm-generator.config.ts`, para no cargar una devDependency en producción.
 */
const env = loadDatabaseEnv();

export default defineConfig({
  host: env.host,
  port: env.port,
  user: env.user,
  password: env.password,
  dbName: env.name,
  entities: ['dist/modules/**/entities/*.entity.js'],
  entitiesTs: ['src/modules/**/entities/*.entity.ts'],
  metadataProvider: TsMorphMetadataProvider,
  discovery: { warnWhenNoEntities: false },
  debug: env.debug,
});
