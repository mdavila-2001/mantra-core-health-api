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
import { QueuesService, NotificationsService } from '../services';
import {
  EnqueueJobDto,
  JobResponseDto,
  RedriveDeadLetterDto,
  RedriveResponseDto,
  CreateNotificationRequestDto,
  NotificationRequestResponseDto,
  InAppReadResponseDto,
} from '../dto';

/** Endpoints de mensajería que consumen los módulos de negocio y los usuarios. */
@ApiTags('messaging')
@ApiBearerAuth()
@Controller()
export class MessagingController {
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
}
