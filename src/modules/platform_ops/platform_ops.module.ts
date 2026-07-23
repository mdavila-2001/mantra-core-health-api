import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PlatformOpsController } from './platform_ops.controller';
import { PlatformOpsService } from './platform_ops.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PlatformOpsController],
  providers: [PlatformOpsService],
})
export class PlatformOpsModule {}
