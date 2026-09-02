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
  SchedulingDelayService,
  SchedulingWaitlistService,
} from '../services';
import {
  AcceptBookingDto,
  RejectBookingDto,
  SetPaymentStateDto,
  PaymentStateDto,
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
  DelayBookingDto,
  DelayNoticeResponseDto,
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
    private readonly delayService: SchedulingDelayService,
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
    @CurrentUser() actor?: AuthenticatedUser,
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
      actor,
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
  getBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingItemDto> {
    // El actor viaja para decidir si el motivo de consulta se incluye: sólo el
    // titular y su médico lo ven (TJ-2).
    return this.bookingsService.getBookingById(id, actor);
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
   * Marca el estado de pago de la cita — TAREA-13, punto 5.
   *
   * `PUT` y no `POST` porque es **idempotente**: hay una fila por cita y volver
   * a mandar el mismo estado deja exactamente el mismo resultado. Las otras
   * operaciones de este controlador son `POST` porque cada una es un acto
   * distinto —aceptar dos veces no es aceptar—; marcar un pago dos veces sí.
   *
   * Quién puede: los mismos que responden la solicitud. **El paciente no**:
   * decir que una cita está pagada es una afirmación del prestador, y dejársela
   * hacer a quien debe el dinero sería confiar en el campo equivocado.
   */
  @Put(':id/payment-state')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar el estado de pago de una cita',
    description:
      'Pendiente de pago, parcialmente pagada o pagada, más la marca separada de uso de seguro. Una cita cancelada o rechazada responde 422.',
  })
  setPaymentState(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPaymentStateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PaymentStateDto> {
    return this.bookingsService.setPaymentState(id, dto, actor);
  }

  /**
   * Lee el estado de pago de la cita.
   *
   * Devuelve `null` cuando nadie lo marcó todavía, que **no** es lo mismo que
   * «pendiente de pago»: pendiente es algo que alguien firmó.
   */
  @Get(':id/payment-state')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Leer el estado de pago de una cita',
    description:
      'Devuelve null si todavía nadie lo marcó: la ausencia de estado no es «pendiente».',
  })
  getPaymentState(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PaymentStateDto | null> {
    return this.bookingsService.getPaymentState(id, actor);
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

  /**
   * P8: el profesional avisa que se demora sobre **esta** cita.
   *
   * No cambia el estado de la cita ni toca su cupo: es comunicación. La demora
   * queda en el historial del turno —así el paciente la ve aunque no abra la
   * campana— y sale como aviso in-app.
   */
  @Post(':id/delay')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Informar una demora sobre una cita',
    description:
      'Sólo la informa quien atiende esa agenda. No mueve el turno: avisa que empieza más tarde.',
  })
  delay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DelayBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DelayNoticeResponseDto> {
    return this.delayService.delayBooking(id, dto, actor);
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
