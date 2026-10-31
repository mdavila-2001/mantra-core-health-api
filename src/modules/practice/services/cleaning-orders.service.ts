import { Injectable } from '@nestjs/common';
import {
  AssignCleaningOrderUseCase,
  CancelCleaningOrderUseCase,
  CreateCleaningOrderUseCase,
  FinishCleaningOrderUseCase,
  InspectCleaningOrderUseCase,
  StartCleaningOrderUseCase,
} from './ops/use-cases/cleaning-order.use-cases';

/**
 * Fachada de la cola de limpieza (F2, CONTRATO-F2-F5 §F2.3): alta manual y
 * las cinco transiciones de una orden. Sin reglas.
 */
@Injectable()
export class CleaningOrdersService {
  constructor(
    private readonly createUseCase: CreateCleaningOrderUseCase,
    private readonly assignUseCase: AssignCleaningOrderUseCase,
    private readonly startUseCase: StartCleaningOrderUseCase,
    private readonly finishUseCase: FinishCleaningOrderUseCase,
    private readonly inspectUseCase: InspectCleaningOrderUseCase,
    private readonly cancelUseCase: CancelCleaningOrderUseCase,
  ) {}

  /** `POST /sites/:siteId/cleaning-orders`. */
  create(...args: Parameters<CreateCleaningOrderUseCase['execute']>) {
    return this.createUseCase.execute(...args);
  }

  /** `POST /cleaning-orders/:id/assign`. */
  assign(...args: Parameters<AssignCleaningOrderUseCase['execute']>) {
    return this.assignUseCase.execute(...args);
  }

  /** `POST /cleaning-orders/:id/start`. */
  start(...args: Parameters<StartCleaningOrderUseCase['execute']>) {
    return this.startUseCase.execute(...args);
  }

  /** `POST /cleaning-orders/:id/finish`. */
  finish(...args: Parameters<FinishCleaningOrderUseCase['execute']>) {
    return this.finishUseCase.execute(...args);
  }

  /** `POST /cleaning-orders/:id/inspect`. */
  inspect(...args: Parameters<InspectCleaningOrderUseCase['execute']>) {
    return this.inspectUseCase.execute(...args);
  }

  /** `POST /cleaning-orders/:id/cancel`. */
  cancel(...args: Parameters<CancelCleaningOrderUseCase['execute']>) {
    return this.cancelUseCase.execute(...args);
  }
}
