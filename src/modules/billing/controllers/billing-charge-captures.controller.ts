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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { CorrelationId } from '../../practice/http/request-decorators';
import {
  ChargeCaptureResponseDto,
  PendingChargesResponseDto,
  VoidChargeCaptureDto,
} from '../dto';
import { ChargeCapturesService } from '../services/charge-captures.service';

/**
 * Cargos devengados antes de facturar (día-cama y quirófano por tiempo).
 *
 * Sin `@Roles`: cada cargo se autoriza contra **su** cama (o su práctica), no contra
 * un id que mande el cliente. Un cargo de otro tenant responde 404 igual que uno
 * inexistente.
 */
@ApiTags('billing-charge-captures')
@ApiBearerAuth()
@Controller('billing')
export class BillingChargeCapturesController {
  /**
   * @param captures - Cargos devengados.
   */
  constructor(private readonly captures: ChargeCapturesService) {}

  /** Cargos pendientes del encuentro, para elegir al facturar. */
  @Get('encounters/:encounterId/pending-charges')
  @ApiOperation({ summary: 'Cargos devengados pendientes de un encuentro' })
  @ApiResponse({
    status: 404,
    description: 'Encuentro de otro tenant o fuera de alcance',
  })
  pending(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PendingChargesResponseDto> {
    return this.captures.pendingForEncounter(encounterId, actor);
  }

  /** Anulación con motivo: un cargo emitido no se edita. */
  @Audited({
    action: 'CHARGE_CAPTURE_VOIDED',
    entity: 'charge_capture',
    entityId: 'param:id',
  })
  @Post('charge-captures/:id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anular un cargo devengado con motivo' })
  @ApiResponse({ status: 409, description: 'CHARGE_ALREADY_VOIDED' })
  @ApiResponse({ status: 422, description: 'CHARGE_VOID_REASON_REQUIRED' })
  void(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidChargeCaptureDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ): Promise<ChargeCaptureResponseDto> {
    return this.captures.void(id, dto, actor, requestId);
  }
}
