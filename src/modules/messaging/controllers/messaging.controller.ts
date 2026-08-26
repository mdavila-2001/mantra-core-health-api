import {
  Body,
  Controller,
  Get,
  Put,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
  InAppNotificationPageDto,
  MarkAllInAppReadResponseDto,
  MyNotificationsQueryDto,
  MyPreferencesDto,
  UpdateMyPreferencesDto,
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

  /**
   * Carril P1 · la bandeja de la campana.
   *
   * Es la lectura **del usuario final**, la que faltaba. El módulo tenía
   * `GET /internal/notifications/pending` —que reclama solicitudes para que un
   * worker las entregue— y nada con lo que dibujar una campana: se podía
   * marcar como leída una notificación cuyo id no había forma de conocer.
   *
   * `?unread=true&limit=1` alcanza para el badge; sin filtro es el centro de
   * notificaciones. Es la misma lectura porque es la misma bandeja.
   */
  @Get('notifications/me')
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({
    summary: 'Mis notificaciones in-app',
    description:
      'Bandeja propia con el total sin leer. Nadie lee la bandeja de otro.',
  })
  listMyNotifications(
    @Query() query: MyNotificationsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InAppNotificationPageDto> {
    return this.notificationsService.listMine(actor, query);
  }

  /**
   * Carril P1 · marcar todo como leído.
   *
   * Sin esto, bajar un badge de cuarenta exige abrir cuarenta notificaciones,
   * y quien tiene cuarenta avisos viejos no los abre: aprende a ignorar la
   * campana. Una campana que se ignora no notifica.
   */
  @Post('notifications/in-app/read-all')
  @Roles('USER', 'MESSAGING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar toda mi bandeja como leída',
    description: 'Acota el lote y devuelve cuántas quedaron sin leer.',
  })
  markAllInAppRead(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MarkAllInAppReadResponseDto> {
    return this.notificationsService.markAllInAppRead(actor);
  }

  /**
   * Carril P9 · qué avisos quiere recibir.
   *
   * Devuelve **siempre las cuatro categorías**, haya filas o no: quien nunca
   * las tocó las recibe todas aceptadas, que es lo que efectivamente le pasa.
   */
  @Get('notifications/preferences/me')
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({
    summary: 'Mis preferencias de notificación in-app',
    description: 'Las cuatro categorías y la ventana de silencio.',
  })
  readMyPreferences(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyPreferencesDto> {
    return this.notificationsService.readMyPreferences(actor);
  }

  /**
   * Carril P9 · guardar las preferencias.
   *
   * Reemplazo **por categoría**: lo que no viene no se toca. `quietHours`
   * ausente significa «no la toques» y `null`, «quitala».
   */
  @Put('notifications/preferences/me')
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({
    summary: 'Guardar mis preferencias de notificación in-app',
    description: 'Reemplaza sólo las categorías que vienen en el cuerpo.',
  })
  updateMyPreferences(
    @Body() dto: UpdateMyPreferencesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyPreferencesDto> {
    return this.notificationsService.updateMyPreferences(actor, dto);
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
