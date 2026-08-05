import { Module } from '@nestjs/common';
import { DocumentStoreController } from './controllers';
import { DocumentStoreService } from './services';
import { DocumentStoreRepository, MongoConnection } from './repositories';

/**
 * Módulo 55 — Document Store. Almacén de documentos flexibles
 * (JSON/semiestructurados) sobre MongoDB que complementa Postgres: borradores,
 * snapshots, payloads FHIR crudos, plantillas. No usa MikroORM; la conexión
 * Mongo la gestiona `MongoConnection` (perezosa y con cierre limpio en destroy).
 * Auth vía guards globales; `AuthModule` (global) aporta el contexto de usuario.
 */
@Module({
  controllers: [DocumentStoreController],
  providers: [MongoConnection, DocumentStoreRepository, DocumentStoreService],
  exports: [DocumentStoreService],
})
export class DocumentStoreModule {}
