import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ReadModelsController } from './read_models.controller';
import { ReadModelsService } from './read_models.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ReadModelsController],
  providers: [ReadModelsService],
})
export class ReadModelsModule {}
