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
import { IntegrationsMessagingService } from '../services';
import {
  EnqueueOutboundDto,
  DispatchMessageDto,
  OutboundMessageResponseDto,
  DispatchResultDto,
  RetryResultDto,
  DeadLetterResultDto,
  CorrelateResultDto,
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

  /** UC-12-06. Worker de envío. */
  @Post('messages/:id\\:dispatch')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Despachar un mensaje y registrar su respuesta' })
  dispatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispatchMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DispatchResultDto> {
    return this.messagingService.dispatch(id, dto, actor);
  }

  /** UC-12-07. Worker de reintentos. */
  @Post('messages/:id\\:retry')
  @Roles('SECURITY_ADMIN')
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
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar a dead-letter tras agotar reintentos' })
  deadLetter(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeadLetterResultDto> {
    return this.messagingService.deadLetter(id, actor);
  }

  /** UC-12-10. Worker de correlación ({id} = mensaje entrante). */
  @Post('messages/:id\\:correlate')
  @Roles('SECURITY_ADMIN')
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
