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
  ParseOptionalLimitPipe,
  ParseOptionalDatePipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  SchedulingBookingsService,
  SchedulingWaitlistService,
} from '../services';
import {
  RescheduleBookingDto,
  RescheduleResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  ScheduleRemindersDto,
  ScheduleRemindersResponseDto,
  BookingItemDto,
  SearchBookingsResponseDto,
  DecideBookingDto,
  BookingDecisionResponseDto,
} from '../dto';

/** Operaciones sobre una cita ya confirmada. */
@ApiTags('scheduling-bookings')
@ApiBearerAuth()
@Controller('scheduling/bookings')
export class SchedulingBookingsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param bookingsService - Valor de bookings service requerido por la operación.
   * @param waitlistService - Valor de waitlist service requerido por la operación.
   */
  constructor(
    private readonly bookingsService: SchedulingBookingsService,
    private readonly waitlistService: SchedulingWaitlistService,
  ) {}

  /**
   * UC-41-15: listado de citas.
   *
   * Va declarado antes que las rutas `:id/...` porque Nest resuelve por orden
   * de declaración; `bookings/:id` no colisiona con ellas, pero mantener la
   * lectura arriba deja el orden explícito.
   *
   * @param patientProfileId - Paciente titular.
   * @param resourceId - Recurso (agenda).
   * @param from - Inicio de la ventana sobre el instante de la cita.
   * @param to - Fin de la ventana.
   * @param includeCancelled - `true` para incluir también las canceladas.
   * @param limit - Tope de filas (por defecto 100).
   * @returns Citas que casan con los filtros.
   */
  @Get()
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER', 'PATIENT')
  @ApiOperation({
    summary: 'UC-41-15: lista citas por paciente, recurso y/o ventana',
  })
  @ApiQuery({ name: 'patientProfileId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'resourceId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'from', required: false, description: 'Instante ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'Instante ISO 8601' })
  @ApiQuery({
    name: 'includeCancelled',
    required: false,
    description: 'Incluye las canceladas y no-show (por defecto, no)',
  })
  @ApiQuery({ name: 'limit', required: false })
  searchBookings(
    @Query('patientProfileId') patientProfileId?: string,
    @Query('resourceId') resourceId?: string,
    @Query('from', new ParseOptionalDatePipe()) from?: Date,
    @Query('to', new ParseOptionalDatePipe()) to?: Date,
    @Query('includeCancelled') includeCancelled?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<SearchBookingsResponseDto> {
    return this.bookingsService.searchBookings(
      {
        patientProfileId,
        resourceId,
        from,
        to,
        includeCancelled: includeCancelled === 'true',
      },
      limit ?? 100,
    );
  }

  /**
   * UC-41-15: una cita concreta.
   *
   * @param id - Cita a leer.
   * @returns La cita con su instante resuelto desde el slot.
   */
  @Get(':id')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER', 'PATIENT')
  @ApiOperation({ summary: 'UC-41-15: consulta una cita' })
  getBooking(@Param('id', ParseUUIDPipe) id: string): Promise<BookingItemDto> {
    return this.bookingsService.getBookingById(id);
  }

  /**
   * UC-41-17: la decisión del prestador sobre una solicitud.
   *
   * No la alcanza `PATIENT`: quien pide no puede aceptarse a sí mismo el
   * pedido. El paciente sigue teniendo `cancel` y `reschedule` para lo suyo, y
   * lee el motivo de la decisión en la propia cita.
   */
  @Post(':id/decision')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar, rechazar, proponer otro horario o pedir documentación',
    description:
      'Sólo sobre una solicitud pendiente. Rechazar nunca genera cargo.',
  })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.bookingsService.decideBooking(id, dto, actor);
  }

  /** UC-41-08. */
  @Post(':id/reschedule')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprogramar la cita a otro slot' })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RescheduleResponseDto> {
    return this.bookingsService.reschedule(id, dto, actor);
  }

  /** UC-41-09. */
  @Post(':id/cancel')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar la cita y liberar el cupo',
    description:
      'El cargo por inasistencia solo aplica si la política lo define y es un no-show.',
  })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.bookingsService.cancel(id, dto, actor);
  }

  /** UC-41-10. */
  @Post(':id/check-in')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar la llegada del paciente' })
  checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CheckInResponseDto> {
    return this.bookingsService.checkIn(id, actor);
  }

  /** UC-41-13. */
  @Post(':id/reminders')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Programar recordatorios para la cita' })
  scheduleReminders(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleRemindersDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ScheduleRemindersResponseDto> {
    return this.waitlistService.scheduleReminders(id, dto, actor);
  }
}
