import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalDatePipe,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PharmacyOrdersService } from '../services';
import {
  ConfirmPharmacyOrderDto,
  CreatePharmacyOrderDto,
  DispensePharmacyOrderDto,
  PharmacyOrderDto,
  PharmacyOrderListResponseDto,
  RejectPharmacyOrderDto,
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

  /**
   * FAR-E2: la bandeja del mostrador — los pedidos del tenant de la farmacia.
   *
   * `SECURITY_ADMIN` es **provisional**: no existe todavía un rol runtime de
   * farmacia; cuando FAR-E2 lo defina, se reemplaza acá. La protección real es
   * el tenant en el WHERE: una organización nunca ve pedidos de otra.
   */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Bandeja de pedidos de las farmacias del tenant (FAR-E2)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Código de estado (PINV_ORDER_*)',
  })
  @ApiQuery({ name: 'siteId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'from', required: false, description: 'Instante ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'Instante ISO 8601' })
  @ApiQuery({ name: 'limit', required: false })
  listForTenant(
    @Query('status') status?: string,
    @Query('siteId', new ParseUUIDPipe({ optional: true })) siteId?: string,
    @Query('from', new ParseOptionalDatePipe()) from?: Date,
    @Query('to', new ParseOptionalDatePipe()) to?: Date,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
    @CurrentUser() actor?: AuthenticatedUser,
  ): Promise<PharmacyOrderListResponseDto> {
    return this.orders.listForPharmacyTenant(
      { statusCode: status, siteId, from, to, limit },
      // El guard de roles garantiza el actor; el `?` es solo por la firma de
      // los parámetros opcionales de Nest.
      actor!,
    );
  }

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

  /* ── El mostrador (FAR-E2) — rol provisional SECURITY_ADMIN hasta que
     exista el rol runtime de farmacia; el tenant en el WHERE es la
     protección real en los cuatro. ─────────────────────────────────── */

  /** FAR-E2: recepcionar — `ENVIADO → EN_REVISION` (el «visto»). */
  @Post(':id/review')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Abrir revisión del pedido (FAR-E2)',
    description:
      'El paciente ve que la farmacia está mirando su pedido. Transición ilegal: 422.',
  })
  openReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    return this.orders.openReview(id, actor);
  }

  /** FAR-E2: confirmar sin sustituciones (proponer genérico: 422, bloqueado). */
  @Post(':id/confirm')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar el pedido (FAR-E2)',
    description:
      'Sella confirmed_at. Un ajuste NO_DISPONIBLE libera solo esa línea; PROPONER_GENERICO responde 422 porque la sustitución está bloqueada por modelo.',
  })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPharmacyOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    return this.orders.confirm(id, dto, actor);
  }

  /** FAR-E2: rechazar con motivo (el motivo aún no se persiste: viaja en el aviso). */
  @Post(':id/reject')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rechazar el pedido (FAR-E2)',
    description:
      'Libera el stock reservado. El motivo es obligatorio y viaja en el evento y la campana; no se persiste todavía (bloqueador de modelo).',
  })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPharmacyOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    return this.orders.reject(id, dto, actor);
  }

  /**
   * FAR-E2/E3: dejar listo en mostrador (habilitado por el modelo v4.2.1).
   * Exige que el pedido sea demostrablemente un RETIRO y que la sede ofrezca
   * mostrador; sella el código de retiro y renueva la reserva 48 h.
   */
  @Post(':id/ready')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar el pedido listo para retiro (FAR-E2/E3)',
    description:
      'CONFIRMADO|ACEPTADO → LISTO_PARA_RETIRO. Solo pedidos con modalidad RETIRO y sede con mostrador; sella el código de retiro (una sola vez) y renueva expires_at +48 h. Un pedido de envío o sin modalidad responde 422 tipificado sin efectos.',
  })
  ready(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    return this.orders.ready(id, actor);
  }

  /**
   * FAR-E3: la entrega en el mostrador, contra el código de retiro. Parcial
   * acumulativa: mientras quede saldo el pedido sigue LISTO_PARA_RETIRO con el
   * mismo código, y pasa a RETIRADO cuando la última línea se cubre.
   */
  @Post(':id/dispense')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dispensar el pedido en el mostrador (FAR-E3)',
    description:
      'Valida el código de retiro (insensible a mayúsculas; mismatch: 422 sin efectos) y entrega el saldo en pie — todo, o solo productIds. Acumula fulfilled_quantity por línea; con saldo cero el pedido pasa a RETIRADO. Repetir la idempotencyKey no duplica stock ni ledger.',
  })
  dispense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispensePharmacyOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    return this.orders.dispense(id, dto, actor);
  }
}
