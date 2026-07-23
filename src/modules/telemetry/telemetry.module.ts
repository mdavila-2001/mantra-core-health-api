import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [TelemetryController],
  providers: [TelemetryService],
})
export class TelemetryModule {}
