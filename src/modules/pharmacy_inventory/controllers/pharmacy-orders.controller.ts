import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PharmacyOrdersService } from '../services';
import {
  CreatePharmacyOrderDto,
  PharmacyOrderDto,
  PharmacyOrderListResponseDto,
} from '../dto';

/**
 * FAR-E1 · el pedido de farmacia del paciente: crear, leer los propios,
 * consultar uno y cancelarlo. La identidad del titular sale siempre del claim
 * `pid` del token; el cliente nunca dice de qué paciente es el pedido.
 */
@ApiTags('pharmacy-orders')
@ApiBearerAuth()
@Controller('pharmacy/orders')
export class PharmacyOrdersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orders - Casos de uso del pedido de farmacia.
   */
  constructor(private readonly orders: PharmacyOrdersService) {}

  /** FAR-E1: crear el pedido (nace `ENVIADO`, vence a las 48 h). */
  @Post()
  @Roles('PATIENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un pedido de farmacia (FAR-E1)',
    description:
      'El paciente sale del token. Reserva parcial: una línea sin stock queda SIN_STOCK y no tumba el pedido. Repetir la misma idempotencyKey devuelve el pedido ya creado.',
  })
  create(
    @Body() dto: CreatePharmacyOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    return this.orders.create(dto, actor);
  }

  /**
   * FAR-E1: los pedidos del titular.
   *
   * Declarado antes que `:id` para que «me» nunca caiga en el parámetro.
   */
  @Get('me')
  @Roles('PATIENT')
  @ApiOperation({
    summary: 'Mis pedidos de farmacia, más nuevos primero (FAR-E1)',
  })
  listMine(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderListResponseDto> {
    return this.orders.listMine(actor);
  }

  /** FAR-E1: un pedido (titular o staff del tenant; terceros: 404). */
  @Get(':id')
  @Roles('PATIENT', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Consultar un pedido de farmacia (FAR-E1)',
    description:
      'Lo ve su titular o el staff del tenant de la farmacia; cualquier tercero recibe el mismo 404.',
  })
  getOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    return this.orders.getOrder(id, actor);
  }

  /** FAR-E1: cancelar el propio pedido (libera el stock reservado). */
  @Post(':id/cancel')
  @Roles('PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar un pedido de farmacia (FAR-E1)',
    description:
      'Solo el titular, desde cualquier estado no terminal; un terminal responde 409 sin efectos.',
  })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    return this.orders.cancel(id, actor);
  }
}
