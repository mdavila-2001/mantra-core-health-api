import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import {
  MyDataAccessPageDto,
  MyDataAccessQueryDto,
} from '../dto/audit-query.dto';
import { AuditQueryService } from '../services/audit-query.service';

/**
 * «Quién vio mi historia» (PAC-HIST-004/005): el autoservicio del titular sobre
 * `audit.data_access_log`.
 *
 * **Sin `@Roles`**, patrón `charts/me`: el filtro real no es un rol sino tener perfil de paciente, y
 * el servidor lo toma del claim de la sesión (`actor.patientProfileId`). Ninguna ruta acepta un id
 * de paciente, de actor ni de tenant por parámetro: si lo aceptara, cualquiera podría pedir los
 * accesos a la historia de otro.
 */
@ApiTags('audit-me')
@ApiBearerAuth()
@Controller('audit/me')
export class AuditMeController {
  constructor(private readonly query: AuditQueryService) {}

  @Get('data-access')
  @ApiOperation({
    summary: 'Ver quién accedió a mi historia, a qué y con qué finalidad',
    description:
      'Accesos a los datos del titular registrados en `audit.data_access_log`: quién (cuenta), qué (tipo de dato y operación), para qué (finalidad) y cuándo. Más recientes primero, paginado por cursor. Sin rango, mira los últimos 30 días.',
  })
  @ApiResponse({ status: 200, type: MyDataAccessPageDto })
  @ApiResponse({
    status: 412,
    description: 'La sesión no tiene perfil de paciente',
  })
  myDataAccess(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() q: MyDataAccessQueryDto,
  ): Promise<MyDataAccessPageDto> {
    return this.query.myDataAccess(actor, q);
  }
}
