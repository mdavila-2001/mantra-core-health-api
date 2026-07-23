import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [SchedulingController],
  providers: [SchedulingService],
})
export class SchedulingModule {}
