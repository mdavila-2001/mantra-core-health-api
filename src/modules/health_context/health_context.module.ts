import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HealthContextController } from './health_context.controller';
import { HealthContextService } from './health_context.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [HealthContextController],
  providers: [HealthContextService],
})
export class HealthContextModule {}
