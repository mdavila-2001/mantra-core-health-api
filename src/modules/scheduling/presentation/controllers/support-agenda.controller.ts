import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AccessLogged,
  CurrentUser,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../../common';
import { SchedulingSupportAgendaService } from '../../application/agenda/scheduling-support-agenda.service';
import { SupportAgendaQueryDto, SupportAgendaResponseDto } from '../dto';

/**
 * Agenda combinada del personal de apoyo. Sin tenant activo: la persona puede
 * asistir a varias organizaciones y la que consulta sale de `org`, contrastada
 * con su vínculo por la política.
 */
@ApiTags('scheduling-support-agenda')
@ApiBearerAuth()
@Controller()
export class SupportAgendaController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param agenda - Agenda combinada.
   */
  constructor(private readonly agenda: SchedulingSupportAgendaService) {}

  /** Agenda combinada de la persona de apoyo. */
  // La lectura de la agenda (paciente y cita) queda en `audit.data_access_log`
  // ANTES de leer; el servicio además sella un asiento por permiso y doctor con
  // los que vio citas (`SUPPORT_SCHEDULE_VIEW`): son dos registros distintos
  // —quién abrió la agenda y con qué permiso— y ninguno repite al otro.
  @AccessLogged({ resourceType: 'SUPPORT_AGENDA' })
  @Get('me/support-agenda')
  @TenantAgnostic()
  @ApiOperation({
    summary: 'Agenda combinada del personal de apoyo, con la política resuelta',
  })
  list(
    @Query() query: SupportAgendaQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportAgendaResponseDto> {
    return this.agenda.list(query, actor);
  }
}
