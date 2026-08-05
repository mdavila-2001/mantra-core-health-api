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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { IntegrationsMessagingService } from '../services';
import {
  EnqueueOutboundDto,
  DispatchMessageDto,
  OutboundMessageResponseDto,
  DispatchResultDto,
  RetryResultDto,
  DeadLetterResultDto,
  CorrelateResultDto,
  PendingDispatchResponseDto,
  PendingRetryResponseDto,
  PendingCorrelationResponseDto,
} from '../dto';

/**
 * Endpoints de mensajería saliente y correlación de callbacks. Las rutas de
 * acción (`messages:outbound`, `messages/{id}:dispatch`, …) usan el `:` literal
 * escapado (`\:`) admitido por Express 5 / path-to-regexp v8.
 */
@ApiTags('integrations-messages')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsMessagesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param messagingService - Valor de messaging service requerido por la operación.
   */
  constructor(
    private readonly messagingService: IntegrationsMessagingService,
  ) {}

  /** UC-12-05. Productor de negocio (usuario autenticado). */
  @Post('messages\\:outbound')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Encolar un mensaje saliente (idempotente)' })
  enqueueOutbound(
    @Body() dto: EnqueueOutboundDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OutboundMessageResponseDto> {
    return this.messagingService.enqueueOutbound(dto, actor);
  }

  /**
   * Descubrimiento para el worker de despacho (Fase 5 del plan de corrección
   * de workers): sin esto, `dispatch` no tenía forma de saber qué
   * `messageId` despachar.
   */
  @Get('messages/pending-dispatch')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar mensajes QUEUED listos para despachar' })
  listPendingDispatch(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PendingDispatchResponseDto> {
    return this.messagingService.listQueuedForDispatch(limit);
  }

  /** UC-12-06. Worker de envío: el rol `SYSTEM` sólo lo firma `SystemApiClient`. */
  @Post('messages/:id\\:dispatch')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Despachar un mensaje y registrar su respuesta' })
  dispatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispatchMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DispatchResultDto> {
    return this.messagingService.dispatch(id, dto, actor);
  }

  /**
   * Descubrimiento para el worker de reintentos (Fase 5): lista los mensajes
   * `FAILED` con si ya agotaron `MAX_ATTEMPTS`, para que el worker decida
   * entre `retry` y `deadLetter`.
   */
  @Get('messages/pending-retry')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar mensajes FAILED candidatos a reintento o dead-letter',
  })
  listPendingRetry(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PendingRetryResponseDto> {
    return this.messagingService.listFailedForRetry(limit);
  }

  /** UC-12-07. Worker de reintentos. */
  @Post('messages/:id\\:retry')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Programar un reintento con backoff exponencial' })
  retry(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetryResultDto> {
    return this.messagingService.retry(id, actor);
  }

  /** UC-12-08. Worker de reintentos. */
  @Post('messages/:id\\:dead-letter')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar a dead-letter tras agotar reintentos' })
  deadLetter(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeadLetterResultDto> {
    return this.messagingService.deadLetter(id, actor);
  }

  /**
   * Descubrimiento para el worker de correlación (Fase 5): sin esto,
   * `correlate` no tenía forma de saber qué `inboundMessageId` traer.
   */
  @Get('messages/pending-correlation')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar mensajes entrantes RECEIVED listos para correlacionar',
  })
  listPendingCorrelation(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PendingCorrelationResponseDto> {
    return this.messagingService.listReceivedForCorrelation(limit);
  }

  /** UC-12-10. Worker de correlación ({id} = mensaje entrante). */
  @Post('messages/:id\\:correlate')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar callback/respuesta asíncrona del proveedor',
  })
  correlate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CorrelateResultDto> {
    return this.messagingService.correlate(id, actor);
  }
}
