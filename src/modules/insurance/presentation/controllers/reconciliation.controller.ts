import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { ReconciliationService } from '../../application/services';
import {
  CreateReconciliationBatchDto,
  CreateReconciliationItemDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../dto';

/**
 * Conciliación de pagos vs adjudicación (UC-26-13). Capa fina que delega en
 * `ReconciliationService`.
 */
@ApiTags('insurance-reconciliation')
@ApiBearerAuth()
@Controller('reconciliation-batches')
export class ReconciliationController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: ReconciliationService) {}

  /** UC-26-13a. */
  @Audited({
    action: 'INSURANCE_RECONCILIATION_BATCH_CREATED',
    entity: 'insurance_reconciliation_batch',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir lote de conciliación' })
  createBatch(
    @Body() dto: CreateReconciliationBatchDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.createBatch(dto, actor);
  }

  /** UC-26-13b. */
  @Audited({
    action: 'INSURANCE_RECONCILIATION_ITEM_ADDED',
    entity: 'insurance_reconciliation_item',
    entityId: 'result.id',
  })
  @Post(':id/items')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar ítem de conciliación al lote' })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReconciliationItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.addItem(id, dto, actor);
  }
}
