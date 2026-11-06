import { Injectable } from '@nestjs/common';
import { ChangeAvailabilityUseCase } from './ops/use-cases/change-availability.use-case';
import {
  CancelBlockUseCase,
  EndBlockUseCase,
} from './ops/use-cases/close-block.use-cases';
import { ChangeHygieneUseCase } from './ops/use-cases/change-hygiene.use-case';
import { ChangeIsolationUseCase } from './ops/use-cases/change-isolation.use-case';
import { RunBlocksTickUseCase } from './ops/use-cases/run-blocks-tick.use-case';

/**
 * Fachada de la operación de espacios (F2, CONTRATO-F2-F5 §F2.3):
 * disponibilidad, bloqueos, higiene, aislamiento y el tick de bloqueos. Sin
 * reglas: cada operación es un caso de uso con su transacción.
 */
@Injectable()
export class CareSpaceOpsService {
  constructor(
    private readonly availabilityUseCase: ChangeAvailabilityUseCase,
    private readonly endBlockUseCase: EndBlockUseCase,
    private readonly cancelBlockUseCase: CancelBlockUseCase,
    private readonly hygieneUseCase: ChangeHygieneUseCase,
    private readonly isolationUseCase: ChangeIsolationUseCase,
    private readonly tickUseCase: RunBlocksTickUseCase,
  ) {}

  /** `POST /care-spaces/:id/availability`. */
  changeAvailability(
    ...args: Parameters<ChangeAvailabilityUseCase['execute']>
  ) {
    return this.availabilityUseCase.execute(...args);
  }

  /** `POST /care-space-blocks/:id/end`. */
  endBlock(...args: Parameters<EndBlockUseCase['execute']>) {
    return this.endBlockUseCase.execute(...args);
  }

  /** `POST /care-space-blocks/:id/cancel`. */
  cancelBlock(...args: Parameters<CancelBlockUseCase['execute']>) {
    return this.cancelBlockUseCase.execute(...args);
  }

  /** `POST /care-spaces/:id/hygiene`. */
  changeHygiene(...args: Parameters<ChangeHygieneUseCase['execute']>) {
    return this.hygieneUseCase.execute(...args);
  }

  /** `POST /care-spaces/:id/isolation`. */
  changeIsolation(...args: Parameters<ChangeIsolationUseCase['execute']>) {
    return this.isolationUseCase.execute(...args);
  }

  /** `POST /internal/practice/blocks-tick`. */
  runBlocksTick() {
    return this.tickUseCase.execute();
  }
}
