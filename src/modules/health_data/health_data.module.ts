import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HealthDataController } from './health_data.controller';
import { HealthDataService } from './health_data.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [HealthDataController],
  providers: [HealthDataService],
})
export class HealthDataModule {}
