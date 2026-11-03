import { Module } from '@nestjs/common';
import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
import { StudyCatalogController } from './controllers/study-catalog.controller';
import { StudyCatalogReaderGuard } from './guards/study-catalog-reader.guard';
import { StudyCatalogRepository } from './repositories/study-catalog.repository';
import { StudyCatalogService } from './services/study-catalog.service';

/**
 * Catálogo de estudios pedibles (laboratorio + imagenología) y su lectura para el
 * médico. Los datos viven en `terminology.*` y los carga
 * `tools/study-catalogs/load-study-catalogs.mjs`; los conceptos cerrados
 * (modalidades, regiones, contraste) los siembra el arranque desde
 * `study_catalog.concepts.ts`.
 */
@Module({
  imports: [DirectoryAuthorizationModule],
  controllers: [StudyCatalogController],
  providers: [
    StudyCatalogRepository,
    StudyCatalogService,
    StudyCatalogReaderGuard,
  ],
})
export class StudyCatalogModule {}
