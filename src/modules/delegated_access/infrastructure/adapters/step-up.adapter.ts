import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../../common';
import { MfaFactors } from '../../../iam/entities';
import type { StepUpPort } from '../../../iam/application/ports/step-up.port';
import { StepUpStore } from '../../../iam/infrastructure/adapters/redis-step-up.store';
import { StepUpUnavailableError } from '../../../iam/application/ports/step-up.port';
import type { SupportStepUpPort } from '../../services/support-access-context.ports';

/**
 * Paso extra (segundo factor fresco) visto desde la política del personal de
 * apoyo. Adapta el puerto `StepUpPort` de `iam` SIN importar su módulo (`iam`
 * importa `profiles → directory → community → delegated_access`: importarlo
 * cerraría un ciclo): se provee el almacén de Redis (sin estado) en el módulo de
 * apoyo y este adaptador lo traduce.
 *
 * - `StepUpUnavailableError` (Redis caído o sin responder) → `undefined`: la
 *   política responde `DENY STEP_UP_UNAVAILABLE`, nunca «sin sello» ni «fresco».
 * - La inscripción del segundo factor (para guiar el desafío a «inscríbase»)
 *   se lee solo cuando hace falta (no hay sello vigente).
 */
@Injectable()
export class IamStepUpAdapter implements SupportStepUpPort {
  /**
   * @param store - Almacén del sello en Redis (puerto `StepUpPort` de `iam`).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly store: StepUpStore,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamStepUpAdapter.name);
  }

  async ageMinutes(sessionId: string): Promise<number | null | undefined> {
    try {
      return await (this.store as StepUpPort).ageMinutes(sessionId);
    } catch (err) {
      if (err instanceof StepUpUnavailableError) {
        this.logger.warn(
          { operation: 'delegated_access.step_up.read' },
          'No se pudo comprobar el paso extra; la decisión se niega',
        );
        return undefined;
      }
      throw err;
    }
  }

  async isEnrolled(em: EntityManager, userId: string): Promise<boolean> {
    const count = await em.count(MfaFactors, {
      userId,
      stateConceptId: CONCEPTS.STATE_VERIFIED,
    });
    return count > 0;
  }
}
