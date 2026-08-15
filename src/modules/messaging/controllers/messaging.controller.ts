import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { QueuesService, NotificationsService } from '../services';
import {
  EnqueueJobDto,
  JobResponseDto,
  RedriveDeadLetterDto,
  RedriveResponseDto,
  CreateNotificationRequestDto,
  NotificationRequestResponseDto,
  InAppReadResponseDto,
  ListChannelsResponseDto,
  ListPreferencesResponseDto,
  SetNotificationPreferenceDto,
  NotificationPreferenceDto,
  ListMyInAppResponseDto,
} from '../dto';

/** Endpoints de mensajería que consumen los módulos de negocio y los usuarios. */
@ApiTags('messaging')
@ApiBearerAuth()
@Controller()
export class MessagingController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param queuesService - Valor de queues service requerido por la operación.
   * @param notificationsService - Valor de notifications service requerido por la operación.
   */
  constructor(
    private readonly queuesService: QueuesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** UC-35-05. */
  @Post('queues/:code/jobs')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Encolar un trabajo',
    description:
      'La clave de deduplicación colapsa los encolados repetidos del productor.',
  })
  enqueueJob(
    @Param('code') code: string,
    @Body() dto: EnqueueJobDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JobResponseDto> {
    return this.queuesService.enqueueJob(code, dto, actor);
  }

  /** UC-35-09. */
  @Post('queues/dead-letter/:deadLetterJobId/redrive')
  @Roles('MESSAGING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reencolar un trabajo desde la cola muerta',
    description:
      'La entrada de cola muerta se conserva: es la evidencia del fallo.',
  })
  redriveDeadLetter(
    @Param('deadLetterJobId', ParseUUIDPipe) deadLetterJobId: string,
    @Body() dto: RedriveDeadLetterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RedriveResponseDto> {
    return this.queuesService.redriveDeadLetter(deadLetterJobId, dto, actor);
  }

  /** UC-35-10. */
  @Post('notifications/requests')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una solicitud de notificación',
    description:
      'Sin consentimiento o sin opt-in queda registrada como suprimida, no se entrega.',
  })
  createNotificationRequest(
    @Body() dto: CreateNotificationRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NotificationRequestResponseDto> {
    return this.notificationsService.createRequest(dto, actor);
  }

  /** UC-35-13. */
  @Post('notifications/in-app/:id/read')
  @Roles('USER', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar una notificación in-app como leída',
    description: 'Idempotente: se conserva la primera lectura.',
  })
  markInAppRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InAppReadResponseDto> {
    return this.notificationsService.markInAppRead(id, actor);
  }

  /** Carril 18 — canales disponibles para configurar preferencia. */
  @Get('notifications/channels')
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({ summary: 'Canales de notificación disponibles' })
  listChannels(): Promise<ListChannelsResponseDto> {
    return this.notificationsService.listChannels();
  }

  /** Carril 18 — mis preferencias de notificación. */
  @Get('notifications/preferences')
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({ summary: 'Mis preferencias de notificación' })
  getMyPreferences(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListPreferencesResponseDto> {
    return this.notificationsService.getMyPreferences(actor);
  }

  /** Carril 18 — fijar una preferencia (canal + categoría opcional). */
  @Put('notifications/preferences')
  @Roles('USER', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Configurar una preferencia de notificación',
    description:
      'Alta o actualización por (canal, categoría). Las categorías no promocionales no dependen de esta preferencia para las alertas críticas de seguridad — solo para las notificaciones ordinarias de esa categoría.',
  })
  setMyPreference(
    @Body() dto: SetNotificationPreferenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NotificationPreferenceDto> {
    return this.notificationsService.setMyPreference(dto, actor);
  }

  /** Carril 18 — mi bandeja de notificaciones in-app. */
  @Get('notifications/in-app')
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({ summary: 'Mis notificaciones in-app' })
  listMyInApp(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListMyInAppResponseDto> {
    return this.notificationsService.listMyInApp(actor, limit);
  }
}
