import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AutomationController],
  providers: [AutomationService],
})
export class AutomationModule {}
