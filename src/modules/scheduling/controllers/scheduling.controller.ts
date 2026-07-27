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
  SchedulingCatalogService,
  SchedulingBookingsService,
  SchedulingWaitlistService,
} from '../services';
import {
  CreateResourceDto,
  ResourceResponseDto,
  CreateBookingPolicyDto,
  BookingPolicyResponseDto,
  CreateTemplateDto,
  TemplateResponseDto,
  GenerateSlotsDto,
  GenerateSlotsResponseDto,
  CreateExceptionDto,
  ExceptionResponseDto,
  CreateHoldDto,
  HoldResponseDto,
  ConfirmBookingDto,
  BookingResponseDto,
  CreateWaitlistEntryDto,
  WaitlistEntryResponseDto,
} from '../dto';

/**
 * Configuración de agenda y apertura de reservas. Capa fina sobre los servicios;
 * la transacción y las reglas viven en el dominio.
 */
@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('scheduling')
export class SchedulingController {
  constructor(
    private readonly catalogService: SchedulingCatalogService,
    private readonly bookingsService: SchedulingBookingsService,
    private readonly waitlistService: SchedulingWaitlistService,
  ) {}

  /** UC-41-01. */
  @Post('resources')
  @Roles('SCHEDULING_ADMIN')
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
  @Roles('SCHEDULING_ADMIN')
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
  @Roles('SCHEDULING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar una plantilla de agenda con sus franjas' })
  createTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TemplateResponseDto> {
    return this.catalogService.createTemplate(id, dto, actor);
  }

  /** UC-41-03. */
  @Post('templates/:id/generate-slots')
  @Roles('SCHEDULING_ADMIN')
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
}
