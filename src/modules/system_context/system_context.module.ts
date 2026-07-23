import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SystemContextController } from './system_context.controller';
import { SystemContextService } from './system_context.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [SystemContextController],
  providers: [SystemContextService],
})
export class SystemContextModule {}
