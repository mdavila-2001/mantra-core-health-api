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
  CurrentUser,
  Public,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { TrackingService } from '../services';
import {
  OpenSubjectDto,
  SubjectResponseDto,
  DefineMilestonesDto,
  MilestonesResponseDto,
  DispatchShipmentDto,
  DispatchResponseDto,
  RecordEventDto,
  EventResponseDto,
  CarrierWebhookDto,
  WebhookResponseDto,
  RecordHandoffDto,
  HandoffResponseDto,
  RecomputeEtaDto,
  EtaResponseDto,
  RecordDeliveryProofDto,
  DeliveryProofResponseDto,
  RecordExceptionDto,
  ExceptionResponseDto,
  CancelShipmentDto,
  CancelShipmentResponseDto,
  ScanSlaDto,
  ScanSlaResponseDto,
} from '../dto';

/** Endpoints de seguimiento: sujetos, envíos, eventos y entrega. */
@ApiTags('tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /** UC-37-01. */
  @Post('trackable-subjects')
  @Roles('TRACKING_ADMIN', 'LOGISTICS_OPERATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir un sujeto rastreable y su envío',
    description:
      'El número de seguimiento es opaco: no deja deducir qué se transporta.',
  })
  openSubject(
    @Body() dto: OpenSubjectDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SubjectResponseDto> {
    return this.trackingService.openSubject(dto, actor);
  }

  /** UC-37-02. */
  @Post('milestone-definitions')
  @Roles('TRACKING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir el catálogo de hitos esperados',
    description: 'Sólo puede haber un hito terminal por tipo de sujeto.',
  })
  defineMilestones(
    @Body() dto: DefineMilestonesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MilestonesResponseDto> {
    return this.trackingService.defineMilestones(dto, actor);
  }

  /** UC-37-03. */
  @Post('shipments/:id/dispatch')
  @Roles('LOGISTICS_OPERATOR', 'TRACKING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Despachar el envío',
    description: 'Exige transportista o mensajero asignado.',
  })
  dispatchShipment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispatchShipmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DispatchResponseDto> {
    return this.trackingService.dispatchShipment(id, dto, actor);
  }

  /** UC-37-04. */
  @Post('trackable-subjects/:id/events')
  @Roles('LOGISTICS_OPERATOR', 'COURIER', 'TRACKING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un evento y avanzar el hito',
    description: 'Log append-only; el hito terminal cierra el seguimiento.',
  })
  recordEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EventResponseDto> {
    return this.trackingService.recordEvent(id, dto, actor);
  }

  /** UC-37-05. */
  @Post('webhooks/carriers/:carrierCode')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ingerir el webhook del transportista',
    description:
      'Ruta pública: el transportista no presenta sesión. Idempotente por identificador del evento externo.',
  })
  ingestCarrierWebhook(
    @Param('carrierCode') carrierCode: string,
    @Body() dto: CarrierWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.trackingService.ingestCarrierWebhook(carrierCode, dto);
  }

  /** UC-37-06. */
  @Post('shipments/:id/handoffs')
  @Roles('LOGISTICS_OPERATOR', 'COURIER', 'TRACKING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el traspaso entre responsables',
    description: 'Actualiza quién responde del envío en la misma transacción.',
  })
  recordHandoff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordHandoffDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HandoffResponseDto> {
    return this.trackingService.recordHandoff(id, dto, actor);
  }

  /** UC-37-07. */
  @Post('shipments/:id/eta/recompute')
  @Roles('SYSTEM', 'LOGISTICS_OPERATOR', 'TRACKING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una estimación de llegada',
    description: 'Histórico append-only; sólo la más reciente pasa al envío.',
  })
  recomputeEta(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecomputeEtaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EtaResponseDto> {
    return this.trackingService.recomputeEta(id, dto, actor);
  }

  /** UC-37-08. */
  @Post('shipments/:id/delivery-proof')
  @Roles('COURIER', 'LOGISTICS_OPERATOR', 'TRACKING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la prueba de entrega y cerrar',
    description: 'La firma exige archivo de firma; la foto, foto.',
  })
  recordDeliveryProof(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordDeliveryProofDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeliveryProofResponseDto> {
    return this.trackingService.recordDeliveryProof(id, dto, actor);
  }

  /** UC-37-09. */
  @Post('shipments/:id/exception')
  @Roles('COURIER', 'LOGISTICS_OPERATOR', 'TRACKING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Marcar una excepción o reintento de entrega',
    description:
      'Sube la prioridad del sujeto y puede dejar constancia del intento fallido.',
  })
  recordException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordExceptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExceptionResponseDto> {
    return this.trackingService.recordException(id, dto, actor);
  }

  /** UC-37-10. */
  @Post('shipments/:id/cancel')
  @Roles('LOGISTICS_OPERATOR', 'TRACKING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar el envío y cerrar el sujeto',
    description: 'Un envío entregado no se cancela.',
  })
  cancelShipment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelShipmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CancelShipmentResponseDto> {
    return this.trackingService.cancelShipment(id, dto, actor);
  }

  /** UC-37-11. */
  @Post('sla/scan')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Barrer los compromisos de hito vencidos',
    description:
      'Toma con SKIP LOCKED; el incumplimiento sube la prioridad del sujeto.',
  })
  scanSla(
    @Body() dto: ScanSlaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ScanSlaResponseDto> {
    return this.trackingService.scanSla(dto, actor);
  }
}
