import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { MessagingModule } from '../messaging/messaging.module';
import {
  AgentCatalogController,
  AutomationOrchestrationController,
} from './controllers';
import {
  AgentCatalogService,
  AutomationDefinitionService,
  AutomationExecutionService,
  RecordAutomationService,
} from './services';
import {
  AgentsRepository,
  AutomationGovernanceRepository,
  AutomationRunsRepository,
  TargetRecordRepository,
} from './repositories';

/**
 * Módulo de automatización y orquestación multiagente (UC-48-01 … 14).
 *
 * Importa `MessagingModule` por `OutboxService`: cada hecho de la automatización
 * —agente registrado, run arrancado, aprobación pedida, registro escrito— se
 * publica dentro de su propia transacción.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    MessagingModule,
  ],
  controllers: [AgentCatalogController, AutomationOrchestrationController],
  providers: [
    AgentsRepository,
    AutomationGovernanceRepository,
    AutomationRunsRepository,
    TargetRecordRepository,
    AgentCatalogService,
    AutomationDefinitionService,
    AutomationExecutionService,
    RecordAutomationService,
  ],
})
export class AutomationModule {}
