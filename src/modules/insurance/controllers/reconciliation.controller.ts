import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ReconciliationService } from '../services';
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
  constructor(private readonly service: ReconciliationService) {}

  /** UC-26-13a. */
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
