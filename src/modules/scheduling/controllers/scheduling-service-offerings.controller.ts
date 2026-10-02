import {
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  SchedulingServiceBookingService,
  SchedulingServiceOfferingsService,
} from '../services';
import {
  CreateServiceHoldDto,
  CreateServiceOfferingDto,
  ListServiceOfferingsQueryDto,
  ServiceAvailabilityQueryDto,
  ServiceAvailabilityResponseDto,
  ServiceHoldResponseDto,
  ServiceOfferingDto,
  ServiceOfferingListDto,
  UpdateServiceOfferingDto,
} from '../dto';

/**
 * Servicios con duración dinámica: la oferta del profesional, los horarios donde
 * cabe y la retención del turno. Capa fina sobre los servicios.
 *
 * La reserva se **confirma** con las rutas que ya existen para las consultas
 * (`POST /scheduling/holds/{token}/confirm` y `/request`): el cupo que nace al
 * retener es una reserva más para el resto del sistema.
 */
@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('scheduling')
export class SchedulingServiceOfferingsController {
  constructor(
    private readonly offerings: SchedulingServiceOfferingsService,
    private readonly booking: SchedulingServiceBookingService,
  ) {}

  @Get('service-offerings')
  @Roles(
    'PATIENT',
    'PRACTITIONER',
    'CLINICIAN',
    'SCHEDULING_ADMIN',
    'SCHEDULING_AGENT',
  )
  @ApiOperation({
    summary: 'Los servicios que ofrece un profesional',
    description:
      'Un paciente ve sólo lo activo y reservable. El profesional dueño ve todo lo suyo.',
  })
  list(
    @Query() query: ListServiceOfferingsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceOfferingListDto> {
    return this.offerings.list(query.practitionerProfileId, actor);
  }

  @Post('service-offerings')
  @Roles('PRACTITIONER', 'CLINICIAN', 'SCHEDULING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Declarar cómo ofrezco un servicio',
    description:
      'Duración mínima y máxima, preparación, limpieza, si el paciente puede pedirlo y si requiere aprobación.',
  })
  create(
    @Body() dto: CreateServiceOfferingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceOfferingDto> {
    return this.offerings.create(dto, actor);
  }

  @Patch('service-offerings/:id')
  @Roles('PRACTITIONER', 'CLINICIAN', 'SCHEDULING_ADMIN')
  @ApiOperation({ summary: 'Editar o apagar la oferta de un servicio' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceOfferingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceOfferingDto> {
    return this.offerings.update(id, dto, actor);
  }

  @Get('service-availability')
  @Roles(
    'PATIENT',
    'PRACTITIONER',
    'CLINICIAN',
    'SCHEDULING_ADMIN',
    'SCHEDULING_AGENT',
  )
  @ApiOperation({
    summary: 'Horarios donde cabe un servicio',
    description:
      'Se calculan en lectura a partir de las franjas que admiten servicios y del tiempo ocupado del profesional en todas sus sedes. No reserva nada.',
  })
  availability(
    @Query() query: ServiceAvailabilityQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceAvailabilityResponseDto> {
    return this.booking.availability(query, actor);
  }

  @Post('service-offerings/:id/holds')
  @Roles('PATIENT', 'SCHEDULING_ADMIN', 'SCHEDULING_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Retener el turno de un servicio',
    description:
      'Crea el cupo del turno con la duración máxima de la oferta y lo retiene bajo el candado del profesional. Se confirma con POST /scheduling/holds/{token}/confirm o /request.',
  })
  placeHold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceHoldDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceHoldResponseDto> {
    return this.booking.placeHold(id, dto, actor);
  }
}
