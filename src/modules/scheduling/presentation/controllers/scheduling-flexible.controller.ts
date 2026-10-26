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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { SchedulingFlexibleBookingService } from '../../application';
import {
  CreateFlexibleHoldDto,
  FlexibleAvailabilityQueryDto,
  FlexibleAvailabilityResponseDto,
  FlexibleHoldResponseDto,
} from '../dto';

/**
 * Horario flexible, sin turnos fijos (P36): las horas que se pueden pedir y la
 * retención de la elegida. Capa fina sobre el servicio.
 *
 * La reserva se **confirma** con las rutas de las consultas
 * (`POST /scheduling/holds/{token}/confirm` y `/request`).
 */
@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('scheduling')
export class SchedulingFlexibleController {
  constructor(private readonly flexible: SchedulingFlexibleBookingService) {}

  @Get('resources/:id/flexible-availability')
  @Roles(
    'PATIENT',
    'PRACTITIONER',
    'CLINICIAN',
    'SCHEDULING_ADMIN',
    'SCHEDULING_AGENT',
  )
  @ApiOperation({
    summary: 'Horas que se pueden pedir en un horario flexible',
    description:
      'Se calculan en lectura a partir de las franjas de las plantillas flexibles de la agenda y del tiempo ocupado del profesional en todas sus sedes. No reserva nada. Una agenda sin horario flexible responde la lista vacía.',
  })
  availability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FlexibleAvailabilityQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FlexibleAvailabilityResponseDto> {
    return this.flexible.availability(id, query, actor);
  }

  @Audited({
    action: 'FLEXIBLE_HOLD_PLACED',
    entity: 'slot_hold',
    entityId: 'result.id',
  })
  @Post('resources/:id/flexible-holds')
  @Roles('PATIENT', 'SCHEDULING_ADMIN', 'SCHEDULING_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Retener una hora de un horario flexible',
    description:
      'Crea el cupo de la hora pedida, con el tiempo por paciente de la plantilla, y lo retiene bajo el candado del profesional. 409 si la hora ya no está libre; 422 si no cae en una franja flexible o ya pasó. Se confirma con POST /scheduling/holds/{token}/confirm o /request.',
  })
  placeHold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFlexibleHoldDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FlexibleHoldResponseDto> {
    return this.flexible.placeHold(id, dto, actor);
  }
}
