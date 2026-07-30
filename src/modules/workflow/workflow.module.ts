import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { MessagingModule } from '../messaging/messaging.module';
import {
  WorkflowDefinitionsController,
  WorkflowTransitionsController,
  WorkflowInstancesController,
} from './controllers';
import {
  StateMachineDefinitionService,
  TransitionExecutionService,
  WorkflowInstancesService,
} from './services';
import {
  StateMachinesRepository,
  WorkflowRuntimeRepository,
  AggregateStateRepository,
} from './repositories';

/**
 * Módulo de máquinas de estado y flujos entre dominios (UC-32-01 … 13).
 *
 * Importa `MessagingModule` por `OutboxService`: cada transición publica sus
 * efectos en el outbox dentro de su propia transacción, que es lo que impide que
 * un consumidor vea el efecto de un cambio que acabó sin confirmarse.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    MessagingModule,
  ],
  controllers: [
    WorkflowDefinitionsController,
    WorkflowTransitionsController,
    WorkflowInstancesController,
  ],
  providers: [
    StateMachinesRepository,
    WorkflowRuntimeRepository,
    AggregateStateRepository,
    StateMachineDefinitionService,
    TransitionExecutionService,
    WorkflowInstancesService,
  ],
})
export class WorkflowModule {}
