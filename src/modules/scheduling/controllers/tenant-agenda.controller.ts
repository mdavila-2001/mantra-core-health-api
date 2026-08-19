import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { SchedulingTenantAgendaService } from '../services';
import { TenantAgendaQueryDto, TenantAgendaResponseDto } from '../dto';

/**
 * La agenda de la organización (TP-5).
 *
 * ## Por qué cuelga de `/tenants/{id}` y no de `/scheduling`
 *
 * Porque la pregunta es de la organización —«¿quién viene hoy?»— y ahí es donde
 * la pantalla de la organización busca lo suyo, junto a sus miembros, sus
 * sucursales y sus solicitudes de médicos. `/scheduling` es el motor; esto es
 * una vista sobre él.
 *
 * ## Sin `@Roles`
 *
 * El permiso es la pertenencia a **esa** organización, no un rol global, y eso
 * lo comprueba el servicio con `assertCanRead`. Un rol global dejaría entrar al
 * administrador de otra clínica; y exigir uno dejaría fuera a la recepción, que
 * es para quien esta lectura existe.
 */
@ApiTags('scheduling-tenant-agenda')
@ApiBearerAuth()
@Controller('tenants')
export class TenantAgendaController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param agenda - La agenda de la organización.
   */
  constructor(private readonly agenda: SchedulingTenantAgendaService) {}

  /** Las citas de la organización en una ventana. */
  @Get(':tenantId/agenda')
  @ApiOperation({
    summary: 'La agenda de la organización',
    description:
      'Las citas de los recursos de esta organización en la ventana pedida. ' +
      'El motivo de consulta NO viaja: es del paciente y de su médico. El ' +
      'filtro por organización va en la consulta, no comprobado después.',
  })
  list(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: TenantAgendaQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantAgendaResponseDto> {
    return this.agenda.listar(tenantId, query, actor);
  }
}
