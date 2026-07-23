import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { IntegrationContractsController } from './integration_contracts.controller';
import { IntegrationContractsService } from './integration_contracts.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [IntegrationContractsController],
  providers: [IntegrationContractsService],
})
export class IntegrationContractsModule {}
