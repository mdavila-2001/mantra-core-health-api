import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
