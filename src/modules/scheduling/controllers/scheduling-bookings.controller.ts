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
  AcceptBookingDto,
  RejectBookingDto,
  RequestBookingInfoDto,
  ProposeScheduleDto,
  ProposeScheduleResponseDto,
  BookingDecisionResponseDto,
  RescheduleBookingDto,
  RescheduleResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  ScheduleRemindersDto,
  ScheduleRemindersResponseDto,
  BookingItemDto,
  SearchBookingsResponseDto,
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
   * El profesional acepta la solicitud (corrección #11): la cita queda
   * confirmada y recién ahí se programan sus recordatorios.
   */
  @Post(':id/accept')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar la solicitud de cita',
    description:
      'Solo la acepta quien atiende esa agenda (o quien administra la agenda de la organización).',
  })
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.bookingsService.accept(id, dto, actor);
  }

  /**
   * UC-41-18: el centro pide documentación, una orden médica o avisa cómo
   * prepararse, antes de aceptar — CARRIL 11.
   *
   * No la alcanza `PATIENT`: es el prestador el que pide. La persona lee lo que
   * le pidieron en el motivo de su propia cita.
   */
  @Post(':id/request-info')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pedir documentación u orden médica antes de aceptar',
    description:
      'No libera el cupo: pedir un papel no le quita el horario a nadie.',
  })
  requestInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestBookingInfoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.bookingsService.requestInfo(id, dto, actor);
  }

  /**
   * UC-41-19: el centro propone otro horario para la solicitud — CARRIL 11.
   *
   * Distinto de `reschedule`: aquélla mueve una cita **vigente** a pedido de
   * quien la tiene; ésta contrapropone sobre lo que todavía no se aceptó, y la
   * solicitud sigue pendiente de que la persona lo mire.
   */
  @Post(':id/propose-schedule')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Proponer otro horario para la solicitud' })
  proposeSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProposeScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProposeScheduleResponseDto> {
    return this.bookingsService.proposeSchedule(id, dto, actor);
  }

  /**
   * El profesional rechaza la solicitud, con motivo obligatorio
   * (correcciones #11 y #14).
   */
  @Post(':id/reject')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rechazar la solicitud de cita',
    description:
      'Libera el cupo y deja el motivo, que el paciente ve en el detalle de su turno.',
  })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.bookingsService.reject(id, dto, actor);
  }

  /**
   * Inicia la atención (corrección #15).
   *
   * **No valida la fecha**: una cita confirmada se empieza cuando el
   * profesional decide, no cuando el reloj lo permite.
   */
  @Post(':id/start')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar la atención',
    description:
      'Disponible sobre cualquier cita confirmada, en cualquier momento: no exige que haya llegado el día agendado.',
  })
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.bookingsService.start(id, actor);
  }

  /**
   * Completa la atención (corrección #15). El paciente ve «completada» apenas
   * ocurre, sin refresco artificial.
   */
  @Post(':id/complete')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar la atención',
    description:
      'Cierra la cita en curso. Tampoco valida el reloj: solo el estado y quién la opera.',
  })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    return this.bookingsService.complete(id, actor);
  }

  /** UC-41-08. */
  @Post(':id/reschedule')
  // `PRACTITIONER` desde la corrección #14: mover un turno es un acto del
  // profesional tanto como del mostrador, y ahora exige motivo en las dos
  // direcciones.
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER', 'PATIENT')
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
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER', 'PATIENT')
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
