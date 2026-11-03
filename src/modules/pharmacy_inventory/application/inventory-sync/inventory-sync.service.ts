import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type {
  CreateSyncBatchDto,
  ReconcileResponseDto,
  SyncBatchResponseDto,
} from '../../presentation/dto';
import { CreateInventorySyncBatchUseCase } from './create-inventory-sync-batch.use-case';
import { ReconcileInventorySyncBatchUseCase } from './reconcile-inventory-sync-batch.use-case';

/** Fachada pública de ingreso y reconciliación de lotes ERP. */
@Injectable()
export class InventorySyncService {
  constructor(
    private readonly createBatchUseCase: CreateInventorySyncBatchUseCase,
    private readonly reconcileBatchUseCase: ReconcileInventorySyncBatchUseCase,
    logger: PinoLogger,
  ) {
    logger.setContext(InventorySyncService.name);
  }

  createBatch(
    dto: CreateSyncBatchDto,
    actor: AuthenticatedUser,
  ): Promise<SyncBatchResponseDto> {
    return this.createBatchUseCase.execute(dto, actor);
  }

  reconcile(
    batchId: string,
    actor: AuthenticatedUser,
  ): Promise<ReconcileResponseDto> {
    return this.reconcileBatchUseCase.execute(batchId, actor);
  }
}
