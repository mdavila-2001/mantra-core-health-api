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
  OutboxService,
  QueuesService,
  NotificationsService,
} from '../services';
import {
  RunOutboxRelayDto,
  OutboxRelayResponseDto,
  DispatchEventDto,
  DispatchEventResponseDto,
  AckEventDeliveryDto,
  EventDeliveryResponseDto,
  ClaimJobsDto,
  ClaimJobsResponseDto,
  CompleteJobDto,
  JobResponseDto,
  FailJobDto,
  FailJobResponseDto,
  DeliverNotificationDto,
  DeliverNotificationResponseDto,
} from '../dto';

/**
 * Superficie interna de mensajería: la operan los workers, no los clientes.
 *
 * Va en un controlador aparte porque su prefijo (`/internal`) y su público son
 * distintos: mezclarla con las rutas de negocio invitaría a llamarla desde
 * fuera, y son operaciones que asumen un worker con su propio ciclo de vida.
 */
@ApiTags('messaging-internal')
@ApiBearerAuth()
@Controller('internal')
export class MessagingInternalController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param outboxService - Valor de outbox service requerido por la operación.
   * @param queuesService - Valor de queues service requerido por la operación.
   * @param notificationsService - Valor de notifications service requerido por la operación.
   */
  constructor(
    private readonly outboxService: OutboxService,
    private readonly queuesService: QueuesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** UC-35-02. */
  @Post('outbox/relay/run')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reclamar y publicar un lote del outbox',
    description: '`SKIP LOCKED`: varios relays corren a la vez sin estorbarse.',
  })
  runRelay(@Body() dto: RunOutboxRelayDto): Promise<OutboxRelayResponseDto> {
    return this.outboxService.runRelay(dto);
  }

  /** UC-35-03. */
  @Post('events/:domainEventId/dispatch')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Repartir el evento entre sus suscriptores',
    description:
      'Idempotente por suscripción: reintentar no duplica la entrega.',
  })
  dispatchEvent(
    @Param('domainEventId', ParseUUIDPipe) domainEventId: string,
    @Body() dto: DispatchEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DispatchEventResponseDto> {
    return this.outboxService.dispatchEvent(domainEventId, dto, actor);
  }

  /** UC-35-04. */
  @Post('event-deliveries/:id/ack')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar el acuse del consumidor sobre una entrega',
  })
  ackDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AckEventDeliveryDto,
  ): Promise<EventDeliveryResponseDto> {
    return this.outboxService.ackDelivery(id, dto);
  }

  /** UC-35-06. */
  @Post('queues/:code/claim')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reclamar un lote de trabajos de la cola',
    description:
      'El tiempo de visibilidad devuelve a la rueda lo de un worker caído.',
  })
  claimJobs(
    @Param('code') code: string,
    @Body() dto: ClaimJobsDto,
  ): Promise<ClaimJobsResponseDto> {
    return this.queuesService.claimJobs(code, dto);
  }

  /** UC-35-07. */
  @Post('jobs/:id/complete')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar el trabajo con éxito',
    description: 'Sólo lo cierra el worker que lo tiene reservado.',
  })
  completeJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteJobDto,
  ): Promise<JobResponseDto> {
    return this.queuesService.completeJob(id, dto);
  }

  /** UC-35-08. */
  @Post('jobs/:id/fail')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar el fallo del trabajo',
    description:
      'Reintenta con backoff exponencial, o va a cola muerta si agotó los intentos.',
  })
  failJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FailJobDto,
  ): Promise<FailJobResponseDto> {
    return this.queuesService.failJob(id, dto);
  }

  /** UC-35-11. */
  @Post('notifications/:requestId/deliver')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el intento de entrega ante el proveedor',
    description:
      'La llamada al proveedor la hace el worker fuera de esta transacción.',
  })
  deliverNotification(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: DeliverNotificationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeliverNotificationResponseDto> {
    return this.notificationsService.deliverNotification(requestId, dto, actor);
  }
}
