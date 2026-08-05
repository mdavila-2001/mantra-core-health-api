import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FunnelSteps } from '../entities';

/** Datos de un paso de funnel (UC-28-10). */
export interface CreateFunnelStepData {
  /**
   * Identificador asociado a funnel definition.
   */
  funnelDefinitionId: string;
  /**
   * Valor de step number mantenido por la instancia.
   */
  stepNumber: number;
  /**
   * Identificador asociado a event schema definition.
   */
  eventSchemaDefinitionId: string;
  /**
   * Valor de qualification rule json mantenido por la instancia.
   */
  qualificationRuleJson?: unknown;
}

/** Acceso a `telemetry.funnel_steps`. */
@Injectable()
export class FunnelStepsRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FunnelSteps`.
   */
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
