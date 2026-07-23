import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SystemOpsController } from './system_ops.controller';
import { SystemOpsService } from './system_ops.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [SystemOpsController],
  providers: [SystemOpsService],
})
export class SystemOpsModule {}
