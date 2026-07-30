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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PracticeInventoryService } from '../services';
import { CreateMovementDto, MovementResponseDto } from '../dto';

/** Endpoints con raíz en `/inventory-items`: movimientos de stock. */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('inventory-items')
export class InventoryItemsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param inventoryService - Valor de inventory service requerido por la operación.
   */
  constructor(private readonly inventoryService: PracticeInventoryService) {}

  /** UC-14-11. */
  @Post(':itemId/movements')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un movimiento de inventario (ajuste de stock)',
  })
  recordMovement(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CreateMovementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    return this.inventoryService.recordMovement(itemId, dto, actor);
  }
}
