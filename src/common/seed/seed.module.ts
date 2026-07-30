import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  CatalogConcepts,
  CodeSystemVersions,
  CodeSystems,
  TerminologySources,
} from '../../modules/terminology/entities';
import { Tenants } from '../../modules/directory/entities';
import { ProcessingPurposes } from '../../modules/consent/entities';
import { TerminologySeedService } from './terminology-seed.service';

/**
 * Módulo de datos estructurales iniciales. Registra el seed del catálogo de
 * conceptos internos y lo exporta para que las pruebas de integración puedan
 * invocarlo tras materializar el esquema. Se importa una sola vez en `AppModule`.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      TerminologySources,
      CodeSystems,
      CodeSystemVersions,
      CatalogConcepts,
      Tenants,
      ProcessingPurposes,
    ]),
  ],
  providers: [TerminologySeedService],
  exports: [TerminologySeedService],
})
export class SeedModule {}
