import { Module } from '@nestjs/common';
import { MutabilityController } from './controllers/mutability.controller';
import { MutabilityCatalogService } from './services/mutability-catalog.service';
import { MutabilityLookupService } from './services/mutability-lookup.service';
import { MutabilityRegistryReader } from './services/mutability-registry.reader';

/**
 * Gobierno de mutabilidad (lectura). Para activarlo basta con importar este módulo desde
 * `SystemOpsModule` (o `AppModule`); exporta `MutabilityLookupService` para la sonda de catalogación.
 */
@Module({
  controllers: [MutabilityController],
  providers: [
    MutabilityCatalogService,
    MutabilityLookupService,
    MutabilityRegistryReader,
  ],
  exports: [MutabilityLookupService, MutabilityCatalogService],
})
export class MutabilityModule {}
