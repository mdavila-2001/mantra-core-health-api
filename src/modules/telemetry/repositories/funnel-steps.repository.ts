import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FunnelSteps } from '../entities';

/** Datos de un paso de funnel (UC-28-10). */
export interface CreateFunnelStepData {
  funnelDefinitionId: string;
  stepNumber: number;
  eventSchemaDefinitionId: string;
  qualificationRuleJson?: unknown;
}

/** Acceso a `telemetry.funnel_steps`. */
@Injectable()
export class FunnelStepsRepository {
  create(em: EntityManager, data: CreateFunnelStepData): FunnelSteps {
    return em.create(
      FunnelSteps,
      {
        funnelDefinitionId: data.funnelDefinitionId,
        stepNumber: data.stepNumber,
        eventSchemaDefinitionId: data.eventSchemaDefinitionId,
        qualificationRuleJson: data.qualificationRuleJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
