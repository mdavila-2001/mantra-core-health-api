import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [WorkflowController],
  providers: [WorkflowService],
})
export class WorkflowModule {}
