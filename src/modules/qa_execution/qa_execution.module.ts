import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { QaLabModule } from '../qa_lab/qa_lab.module';
import {
  QaExecutionController,
  QaExecutionInternalController,
} from './controllers/qa-execution.controller';
import { QaExecutionService } from './services/qa-execution.service';
import { GuardedHttpClient } from './infrastructure/guarded-http.client';

/**
 * Módulo 68 — plano de ejecución de QA en el servidor (ADR-0025). Orquesta los
 * casos de uso del módulo 36; no duplica su modelo de evidencia.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities)), QaLabModule],
  controllers: [QaExecutionController, QaExecutionInternalController],
  providers: [GuardedHttpClient, QaExecutionService],
})
export class QaExecutionModule {}
