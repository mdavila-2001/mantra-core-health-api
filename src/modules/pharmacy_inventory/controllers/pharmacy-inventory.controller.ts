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
import {
  InventoryLocationsService,
  InventoryReservationsService,
  InventoryTransfersService,
  InventoryCountService,
  InventoryRecallService,
} from '../services';
import {
  CreateLocationDto,
  CreateReservationDto,
  CreateTransferDto,
  CreateCountSessionDto,
  ApproveCountSessionDto,
  CreateRecallHoldDto,
  ReleaseRecallHoldDto,
  IdResponseDto,
  MovementResponseDto,
  TransferResponseDto,
  CountSessionResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Operaciones de inventario de farmacia: ubicaciones (bootstrap), reservas
 * (UC-25-04), transferencias (UC-25-10), conteo cíclico (UC-25-06/07) y
 * recall/holds (UC-25-08/09).
 */
@ApiTags('pharmacy-inventory')
@ApiBearerAuth()
@Controller('pharmacy')
export class PharmacyInventoryController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param locations - Valor de locations requerido por la operación.
   * @param reservations - Valor de reservations requerido por la operación.
   * @param transfers - Valor de transfers requerido por la operación.
   * @param counts - Valor de counts requerido por la operación.
   * @param recalls - Valor de recalls requerido por la operación.
   */
  constructor(
    private readonly locations: InventoryLocationsService,
    private readonly reservations: InventoryReservationsService,
    private readonly transfers: InventoryTransfersService,
    private readonly counts: InventoryCountService,
    private readonly recalls: InventoryRecallService,
  ) {}

  /** Bootstrap: alta de ubicación de inventario. */
  @Post(':siteId/inventory-locations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una ubicación de inventario' })
  createLocation(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.locations.create(siteId, dto, actor);
  }

  /** UC-25-04: reservar stock. */
  @Post(':pharmacyId/reservations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reservar stock para una prescripción (UC-25-04)' })
  reserve(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreateReservationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    return this.reservations.reserve(pharmacyId, dto, actor);
  }

  /** UC-25-10: transferir stock entre ubicaciones. */
  @Post(':pharmacyId/transfers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Transferir stock entre ubicaciones (UC-25-10)' })
  transfer(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreateTransferDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.transfers.transfer(pharmacyId, dto, actor);
  }

  /** UC-25-06: abrir sesión de conteo cíclico. */
  @Post(':siteId/count-sessions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar y congelar una sesión de conteo (UC-25-06)',
  })
  openCountSession(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateCountSessionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CountSessionResponseDto> {
    return this.counts.openSession(siteId, dto, actor);
  }

  /** UC-25-07: aprobar conteo y ajustar por varianza. */
  @Post('count-sessions/:id/approve')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar conteo y ajustar ledger por varianza (UC-25-07)',
  })
  approveCountSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveCountSessionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CountSessionResponseDto> {
    return this.counts.approve(id, dto, actor);
  }

  /** UC-25-08: aplicar recall/hold sobre un lote. */
  @Post('recall-holds')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Aplicar retiro/recall de lote (UC-25-08)' })
  createRecallHold(
    @Body() dto: CreateRecallHoldDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.recalls.createHold(dto, actor);
  }

  /** UC-25-09: liberar recall y reactivar lote. */
  @Post('recall-holds/:id/release')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar recall y reactivar lote (UC-25-09)' })
  releaseRecallHold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReleaseRecallHoldDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.recalls.release(id, dto, actor);
  }
}
