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
import { OrderSetsService } from '../services';
import {
  CreateOrderSetDto,
  ApplyOrderSetDto,
  OrderSetResponseDto,
  ApplyOrderSetResponseDto,
} from '../dto';

/**
 * Endpoints de plantillas de órdenes (`/order-sets`): creación de la plantilla
 * (admin) y aplicación con fan-out (UC-18-06). Capa fina sobre `OrderSetsService`.
 */
@ApiTags('clinical-ext-order-sets')
@ApiBearerAuth()
@Controller('order-sets')
export class OrderSetsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orderSetsService - Valor de order sets service requerido por la operación.
   */
  constructor(private readonly orderSetsService: OrderSetsService) {}

  /** Crea una plantilla de órdenes (precondición de UC-18-06). */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una plantilla de órdenes (order set) con sus ítems',
  })
  create(
    @Body() dto: CreateOrderSetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OrderSetResponseDto> {
    return this.orderSetsService.create(dto, actor);
  }

  /** UC-18-06. */
  @Post(':id/apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Aplicar un order set (fan-out de órdenes)' })
  apply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyOrderSetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ApplyOrderSetResponseDto> {
    return this.orderSetsService.apply(id, dto, actor);
  }
}
