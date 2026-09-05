import {
  Delete,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
  ParseOptionalDatePipe,
  ParseOptionalLimitPipe,
  PreconditionFailedException,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  SchedulingCatalogService,
  SchedulingBookingsService,
  SchedulingDelayService,
  SchedulingWaitlistService,
} from '../services';
import {
  CreateResourceDto,
  ResourceResponseDto,
  CreateBookingPolicyDto,
  BookingPolicyResponseDto,
  CreateTemplateDto,
  AvailabilityExceptionListDto,
  RetireTemplateResponseDto,
  ReactivateTemplateResponseDto,
  TemplateListDto,
  TemplateResponseDto,
  GenerateSlotsDto,
  GenerateSlotsResponseDto,
  CreateExceptionDto,
  ExceptionResponseDto,
  ExceptionTypeListDto,
  ActivityTypeListDto,
  ShiftSlotsDto,
  CloseSlotsDto,
  UpdateExceptionDto,
  UpdateExceptionResponseDto,
  CloseSlotsResponseDto,
  ShiftSlotsResponseDto,
  CreateHoldDto,
  HoldResponseDto,
  ConfirmBookingDto,
  RequestBookingDto,
  BookingResponseDto,
  CreateWaitlistEntryDto,
  WaitlistEntryResponseDto,
  ResourceAgendaResponseDto,
  ListWaitlistQueryDto,
  ListWaitlistResponseDto,
  DelayResourceDto,
  DelayNoticeResponseDto,
  CreateDirectAppointmentDto,
  DirectAppointmentResponseDto,
} from '../dto';

/**
 * Configuración de agenda y apertura de reservas. Capa fina sobre los servicios;
 * la transacción y las reglas viven en el dominio.
 */
@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('scheduling')
export class SchedulingController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param catalogService - Valor de catalog service requerido por la operación.
   * @param bookingsService - Valor de bookings service requerido por la operación.
   * @param waitlistService - Valor de waitlist service requerido por la operación.
   * @param delayService - Avisos de demora del profesional (P8).
   */
  constructor(
    private readonly catalogService: SchedulingCatalogService,
    private readonly bookingsService: SchedulingBookingsService,
    private readonly waitlistService: SchedulingWaitlistService,
    private readonly delayService: SchedulingDelayService,
  ) {}

  /**
   * UC-41-14: agenda publicada del recurso en una ventana de tiempo.
   *
   * Es lo que permite pintar un calendario y elegir un hueco: devuelve el
   * `slotId` que después consume `POST /scheduling/slots/:id/holds`.
   *
   * @param id - Recurso cuya agenda se consulta.
   * @param from - Inicio de la ventana (ISO 8601, obligatorio).
   * @param to - Fin de la ventana (ISO 8601, obligatorio).
   * @param onlyAvailable - `false` para incluir también los slots sin cupo.
   * @param limit - Tope de slots (por defecto 200).
   * @returns Slots de la ventana, ordenados cronológicamente.
   */
  @Get('resources/:id/slots')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER', 'PATIENT')
  @ApiOperation({
    summary: 'UC-41-14: agenda publicada del recurso en una ventana',
  })
  @ApiQuery({
    name: 'from',
    required: true,
    description: 'Inicio de la ventana (ISO 8601)',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    description: 'Fin de la ventana (ISO 8601)',
  })
  @ApiQuery({
    name: 'onlyAvailable',
    required: false,
    description:
      'Por defecto `true`: sólo los slots con cupo. `false` devuelve la agenda completa, ocupados incluidos',
  })
  @ApiQuery({ name: 'limit', required: false })
  getResourceAgenda(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from', new ParseOptionalDatePipe()) from?: Date,
    @Query('to', new ParseOptionalDatePipe()) to?: Date,
    @Query('onlyAvailable') onlyAvailable?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ResourceAgendaResponseDto> {
    // La ventana es obligatoria: sin ella la consulta devolvería la agenda
    // completa del recurso, que crece sin techo con cada generación de slots.
    if (!from || !to) {
      throw new PreconditionFailedException(
        'Indique la ventana con from y to (ISO 8601)',
      );
    }
    return this.catalogService.getResourceAgenda(id, {
      from,
      to,
      onlyAvailable: onlyAvailable !== 'false',
      limit: limit ?? 200,
    });
  }

  /** UC-41-01. */
  @Post('resources')
  // `PRACTITIONER` entra acotado a sí mismo: el servicio verifica que el
  // recurso apunte a SU perfil (`assertPuedeCrearRecurso` /
  // `assertRecursoDelActor`) y que el tenant sea uno de los suyos. Sin esta
  // apertura, un profesional recién registrado no tenía forma de volverse
  // reservable: el asistente de alta de agenda moría con 403 en el primer paso.
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dar de alta un recurso agendable' })
  createResource(
    @Body() dto: CreateResourceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceResponseDto> {
    return this.catalogService.createResource(dto, actor);
  }

  /** UC-41-01. */
  @Post('booking-policies')
  // `PRACTITIONER` entra acotado a sí mismo: el servicio verifica que el
  // recurso apunte a SU perfil (`assertPuedeCrearRecurso` /
  // `assertRecursoDelActor`) y que el tenant sea uno de los suyos. Sin esta
  // apertura, un profesional recién registrado no tenía forma de volverse
  // reservable: el asistente de alta de agenda moría con 403 en el primer paso.
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir una política de reserva' })
  createPolicy(
    @Body() dto: CreateBookingPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingPolicyResponseDto> {
    return this.catalogService.createPolicy(dto, actor);
  }

  /** UC-41-02. */
  @Post('resources/:id/templates')
  // `PRACTITIONER` entra acotado a sí mismo: el servicio verifica que el
  // recurso apunte a SU perfil (`assertPuedeCrearRecurso` /
  // `assertRecursoDelActor`) y que el tenant sea uno de los suyos. Sin esta
  // apertura, un profesional recién registrado no tenía forma de volverse
  // reservable: el asistente de alta de agenda moría con 403 en el primer paso.
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar una plantilla de agenda con sus franjas' })
  createTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TemplateResponseDto> {
    return this.catalogService.createTemplate(id, dto, actor);
  }

  /**
   * UC-41-02 (lectura): las plantillas publicadas de un recurso.
   *
   * Vive junto a su POST hermano porque son las dos caras del mismo hecho. Sin
   * esta lectura, publicar un horario era escribirlo en un papel y tirarlo:
   * `scheduling` no tenía forma de volver a leer una plantilla, y por eso
   * «Mi agenda» no podía existir.
   *
   * Un recurso sin plantillas devuelve `[]` con 200, no 404: existe y todavía
   * no publicó horario.
   */
  @Get('resources/:id/templates')
  // Mismo alcance que el POST: el servicio verifica que el recurso sea del
  // actor (`assertRecursoDelActor`), así que un profesional sólo lee las suyas.
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @ApiOperation({ summary: 'Listar las plantillas de agenda de un recurso' })
  listTemplates(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TemplateListDto> {
    return this.catalogService.listTemplates(id, actor);
  }

  /**
   * Vuelve a poner en vigencia un horario pausado — «me fui de viaje y volví».
   *
   * `POST` y no `PATCH` porque es un acto con nombre, no la edición de un
   * campo: es la contraparte exacta de `retire`, y las dos se leen juntas en el
   * mismo controlador.
   */
  @Post('templates/:id/reactivate')
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reactivar un horario retirado',
    description:
      'Lo devuelve a vigente. No regenera los cupos: hay que llamar a generate-slots con la ventana que corresponda.',
  })
  reactivateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReactivateTemplateResponseDto> {
    return this.catalogService.reactivateTemplate(id, actor);
  }

  /**
   * Retirar un horario publicado (TAREA-10, punto 6).
   *
   * `DELETE` y no `PATCH` porque para quien lo usa **es** el botón de dar de
   * baja el horario; lo que cambia es qué significa dar de baja acá, y eso lo
   * dice el cuerpo de la respuesta. No es `@HttpCode(NO_CONTENT)` como el
   * borrado de una excepción: éste devuelve cuánto soltó y cuánto conservó.
   *
   * Responde **409 con la lista** cuando el horario tiene citas comprometidas:
   * no lo retira y nombra lo que hay que resolver primero.
   */
  @Delete('templates/:id')
  // Mismo alcance que publicar y generar: el servicio comprueba que el recurso
  // sea del actor con `assertRecursoDelActor`.
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Retirar una plantilla de agenda y soltar sus cupos libres',
    description:
      'La plantilla queda en TPL_RETIRED y deja de publicarse; los cupos con citas se conservan. Rechaza con 409 si tiene citas confirmadas o presentadas.',
  })
  retireTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetireTemplateResponseDto> {
    return this.catalogService.retireTemplate(id, actor);
  }

  /** UC-41-03. */
  @Post('templates/:id/generate-slots')
  // `PRACTITIONER` entra acotado a sí mismo: el servicio verifica que el
  // recurso apunte a SU perfil (`assertPuedeCrearRecurso` /
  // `assertRecursoDelActor`) y que el tenant sea uno de los suyos. Sin esta
  // apertura, un profesional recién registrado no tenía forma de volverse
  // reservable: el asistente de alta de agenda moría con 403 en el primer paso.
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Materializar los slots de la plantilla en una ventana',
    description:
      'Idempotente: los slots ya existentes se conservan y se cuentan como `skipped`.',
  })
  generateSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateSlotsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GenerateSlotsResponseDto> {
    return this.catalogService.generateSlots(id, dto, actor);
  }

  /**
   * UC-41-04 (lectura): las excepciones de un recurso en una ventana.
   *
   * El hueco gemelo del `GET` de plantillas: se podían crear excepciones y no
   * leerlas. Sin esto, el calendario del médico no puede distinguir un día
   * **bloqueado** de un día **sin agenda** —los dos aparecen sin cupos—, y ésa
   * es justamente la diferencia que hay que mostrarle.
   */
  @Get('resources/:id/exceptions')
  // `PATIENT` entra acotado por el servicio: sólo lee los bloqueos de un médico
  // con el que TIENE cita, y sólo ve el motivo catalogado — nunca el texto
  // libre que el profesional escribe al elegir «Otro».
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER', 'PATIENT')
  @ApiOperation({
    summary: 'Listar las excepciones de disponibilidad de un recurso',
    description:
      'El profesional ve el texto libre del motivo; un paciente con cita ve sólo la etiqueta catalogada.',
  })
  @ApiQuery({
    name: 'from',
    required: true,
    description: 'Inicio de la ventana (ISO 8601)',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    description: 'Fin de la ventana (ISO 8601)',
  })
  listExceptions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AvailabilityExceptionListDto> {
    return this.catalogService.listExceptions(
      id,
      new Date(from),
      new Date(to),
      actor,
    );
  }

  /**
   * Cierra cupos sueltos y deja el bloqueo que impide que vuelvan.
   *
   * Lo que el pedido pone entre paréntesis es su razón de ser: cerrar un cupo
   * **sin** dejar la excepción sirve hasta que alguien regenera, y ahí el rato
   * que el profesional había cerrado se ofrece otra vez.
   *
   * Un cupo con cita viva NO se cierra por acá: se rechaza entero y se nombran
   * cuáles. Cancelar el turno de alguien exige motivo y avisa a esa persona;
   * hacerlo de arrastre sería decidir por quien está esperando.
   */
  @Post('resources/:id/close-slots')
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar cupos sueltos, dejando el bloqueo que impide regenerarlos',
    description:
      'Bloquea los cupos nombrados y crea la excepción que cubre su rango. Rechaza si alguno tiene cita viva.',
  })
  closeSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseSlotsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CloseSlotsResponseDto> {
    return this.catalogService.closeSlots(id, dto, actor);
  }

  /**
   * Corre los cupos de una agenda N minutos — «mover horario» del carril 12.
   *
   * Distinto de «avisar demora», que **sólo avisa** y deja los cupos donde
   * estaban. Acá el turno de la persona pasa a ser otro, así que se escribe y
   * se avisa.
   *
   * Todo o nada: si un cupo no puede moverse porque su horario nuevo pisa otra
   * cita del mismo profesional, no se mueve ninguno. La colisión la rechaza la
   * base con `ex_appointments_practitioner_time`, no este código.
   */
  @Post('resources/:id/shift-slots')
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Correr los cupos de una agenda N minutos',
    description:
      'Mueve todos los cupos de la ventana, o sólo los que se nombren, y avisa a quien tenía turno. Todo o nada.',
  })
  shiftSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShiftSlotsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ShiftSlotsResponseDto> {
    return this.catalogService.shiftSlots(id, dto, actor);
  }

  /**
   * Las tipologías de actividad que la agenda sabe pintar (carril 12).
   *
   * El propietario lo pidió así: «con otros colores los otros procedimientos
   * (TURNOS, OPERACIONES, ETC.) catalogado por tipología raíz». La columna
   * existía y no había un solo concepto que ponerle.
   *
   * Manda `tone` y no un color: el color concreto es del sistema de diseño. Un
   * `#RRGGBB` desde el servidor obligaría a redesplegarlo para cambiar la
   * paleta y rompería el tema oscuro.
   */
  @Get('activity-types')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Listar las tipologías de actividad de la agenda',
    description:
      'Catálogo para pintar el día: clave, concepto, etiqueta en castellano y tono del sistema de diseño.',
  })
  listActivityTypes(): ActivityTypeListDto {
    return this.catalogService.listActivityTypes();
  }

  /**
   * Los motivos de bloqueo que el formulario puede ofrecer (TAREA-11, punto 4).
   *
   * Existe porque el catálogo estaba en la base y **no lo publicaba nadie**:
   * `exception_type_concept_id` es obligatoria y la pantalla no tenía de dónde
   * sacar las opciones, así que en la práctica todo bloqueo nacía con el mismo
   * valor.
   *
   * Es una lectura de catálogo, no de datos de nadie: sin filtro por tenant y
   * abierta a cualquiera que pueda crear una excepción.
   */
  @Get('exception-types')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Listar los motivos de bloqueo de agenda',
    description:
      'Catálogo para el formulario: clave, concepto, etiqueta en castellano, si exige texto libre y si bloquea u abre horario.',
  })
  listExceptionTypes(): ExceptionTypeListDto {
    return this.catalogService.listExceptionTypes();
  }

  /** UC-41-04. */
  @Post('resources/:id/exceptions')
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una excepción de disponibilidad',
    description:
      'Bloquea los slots libres que se solapan; las citas ya reservadas no se tocan.',
  })
  createException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExceptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExceptionResponseDto> {
    return this.catalogService.createException(id, dto, actor);
  }

  /**
   * Edita un bloqueo sin borrarlo (AC-11-7).
   *
   * **Agrandar el rango cierra los cupos nuevos; achicarlo no reabre ninguno.**
   * Es la P-11-3, y se resuelve por la consecuencia: cerrar de más ofrece menos
   * turnos y el profesional lo pidió; reabrir ofrecería turnos que nadie
   * decidió ofrecer.
   *
   * El módulo queda con una sola regla: **los cupos sólo los crea publicar el
   * horario.**
   */
  @Patch('exceptions/:id')
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Editar una excepción de disponibilidad',
    description:
      'Cambia rango, motivo y descripción conservando el id. Agrandar cierra cupos; achicar no los reabre.',
  })
  updateException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExceptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UpdateExceptionResponseDto> {
    return this.catalogService.updateException(id, dto, actor);
  }

  /**
   * Elimina una excepción de disponibilidad (el tiempo ocupado de AG-3).
   *
   * Borrar NO resucita los cupos que la excepción bloqueó: se regeneran con la
   * plantilla si corresponde. Es la semántica menos sorprendente y está
   * documentada en el servicio.
   */
  @Delete('exceptions/:id')
  // Mismo alcance que el POST hermano: el servicio verifica que el recurso de
  // la excepción sea del actor (`assertRecursoDelActor`).
  @Roles('SCHEDULING_ADMIN', 'PRACTITIONER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una excepción de disponibilidad',
    description:
      'Los cupos que la excepción bloqueó siguen bloqueados; se regeneran con la plantilla.',
  })
  removeException(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.catalogService.removeException(id, actor);
  }

  /**
   * AG-2 · La cita puntual: el doctor asigna, el paciente se entera.
   *
   * «Volvé el jueves a las 10» — lo que los consultorios hacen todos los días y
   * el sistema no permitía: toda cita nacía de un cupo publicado que el
   * paciente tomaba. Ésta nace CONFIRMADA (ya se acordó en persona), con
   * campana al paciente y la salida de «pedir cambio».
   */
  @Post('appointments/direct')
  // El profesional sólo en SU agenda (el servicio lo verifica); quien
  // administra agendas, en cualquiera.
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asignar una cita puntual a un paciente (nace confirmada)',
    description:
      'Cupo único + reserva en una transacción. Retira los horarios libres que pise y lo informa; la regla madre rechaza si el profesional ya está comprometido.',
  })
  createDirectAppointment(
    @Body() dto: CreateDirectAppointmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DirectAppointmentResponseDto> {
    return this.bookingsService.createDirectAppointment(dto, actor);
  }

  /** UC-41-05. */
  @Post('slots/:id/holds')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PATIENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reservar temporalmente un cupo del slot',
    description:
      'Anti-double-booking: el slot se bloquea con FOR UPDATE y el cupo se devuelve solo si el hold expira.',
  })
  placeHold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateHoldDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HoldResponseDto> {
    return this.bookingsService.placeHold(id, dto, actor);
  }

  /** UC-41-06. */
  @Post('holds/:holdToken/confirm')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PATIENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Confirmar la cita a partir de la reserva temporal',
  })
  confirmBooking(
    @Param('holdToken', ParseUUIDPipe) holdToken: string,
    @Body() dto: ConfirmBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.confirmBooking(holdToken, dto, actor);
  }

  /**
   * El paciente **solicita** el turno: queda pendiente de que el profesional lo
   * acepte (corrección #11).
   *
   * Es la otra salida de la misma retención: `confirm` compromete la agenda
   * —lo hace el mostrador— y `request` pide. Se declara como ruta propia y no
   * como una bandera del cuerpo porque son dos actos distintos con dos permisos
   * distintos, y una bandera que cambia quién puede hacer qué es una bandera que
   * tarde o temprano llega en `true` desde donde no debe.
   */
  @Post('holds/:holdToken/request')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PATIENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar la cita a partir de la reserva temporal',
    description:
      'La cita nace PENDING_CONFIRMATION: ocupa el cupo pero no está comprometida hasta que el profesional la acepta.',
  })
  requestBooking(
    @Param('holdToken', ParseUUIDPipe) holdToken: string,
    @Body() dto: RequestBookingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.requestBooking(holdToken, dto, actor);
  }

  /** UC-41-11. */
  @Post('waitlist')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PATIENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscribir a un paciente en la lista de espera' })
  enrollWaitlist(
    @Body() dto: CreateWaitlistEntryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<WaitlistEntryResponseDto> {
    return this.waitlistService.enroll(dto, actor);
  }

  /**
   * P8 · UC-41-11 (lectura): en qué listas de espera está un paciente.
   *
   * Faltaba: el módulo dejaba anotarse y no ofrecía forma de comprobarlo, así
   * que «estás en espera» sólo podía ser una suposición del cliente.
   */
  @Get('waitlist')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER', 'PATIENT')
  @ApiOperation({
    summary: 'Listar las entradas de lista de espera de un paciente',
  })
  @ApiQuery({ name: 'patientProfileId', required: true, format: 'uuid' })
  @ApiQuery({
    name: 'includeClosed',
    required: false,
    description: 'Incluye las cubiertas y canceladas (por omisión, no)',
  })
  @ApiQuery({ name: 'limit', required: false })
  listWaitlist(
    @Query() query: ListWaitlistQueryDto,
  ): Promise<ListWaitlistResponseDto> {
    return this.waitlistService.listForPatient(query);
  }

  /**
   * P8: «me demoro veinte minutos hoy».
   *
   * Es como el profesional lo dice en la práctica —la demora es de la jornada,
   * no de un turno suelto— y por eso cuelga del recurso. Alcanza a las citas
   * vigentes de la ventana informada; por omisión, de ahora al fin del día.
   */
  @Post('resources/:id/delay')
  @Roles('SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Informar una demora que alcanza a toda la agenda del recurso',
    description:
      'Avisa a los pacientes con cita vigente en la ventana. No mueve ningún turno ni toca los cupos.',
  })
  delayResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DelayResourceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DelayNoticeResponseDto> {
    return this.delayService.delayResource(id, dto, actor);
  }
}
