import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  SystemContextController,
  SystemContextCollectionsController,
} from './controllers';
import {
  DynamicEnumsService,
  SystemContextsService,
  SystemContextCollectionsService,
} from './services';
import { SystemContextRepository } from './repositories';

/**
 * Módulo de contexto de sistema: enumeraciones dinámicas versionadas con
 * binding y validación de escritura, y contextos de sistema con refresco
 * idempotente, procedencia, promoción, binding a consumidores y rollback
 * (UC-45-01 … 12).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [SystemContextController, SystemContextCollectionsController],
  providers: [
    SystemContextCollectionsService,
    SystemContextRepository,
    DynamicEnumsService,
    SystemContextsService,
  ],
})
export class SystemContextModule {}
