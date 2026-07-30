import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { HealthContextController } from './controllers';
import { ContextCollectionService, CountryContextService } from './services';
import { HealthContextRepository } from './repositories';

/**
 * Módulo de contexto de salud por país: agentes recolectores, fuentes con su
 * nivel de confianza, programaciones, corridas idempotentes, observaciones
 * inmutables, versiones con hechos y evidencia, revisión de calidad,
 * publicación, retiro y resolución para consumo (UC-44-01 … 12).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [HealthContextController],
  providers: [
    HealthContextRepository,
    ContextCollectionService,
    CountryContextService,
  ],
})
export class HealthContextModule {}
