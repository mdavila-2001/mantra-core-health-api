import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AccessLogged } from '../../../common/audit-trail';
import {
  MyDataAccessPageDto,
  MyDataAccessQueryDto,
} from '../dto/my-data-access.dto';
import { MyDataAccessService } from '../services/my-data-access.service';

/**
 * Autoservicio del paciente sobre el registro de accesos a su historia (PAC-HIST-004/005).
 *
 * Cuelga de `me`: la persona sale de la cuenta y no hay identificador de paciente que comparar,
 * así que ninguna ruta puede apuntar a la historia de otro. `@Roles('PATIENT')` acota quién entra;
 * el aislamiento lo resuelve el servicio. No toca `GET /audit/data-access`, que sigue siendo la
 * vista de auditoría de plataforma.
 */
@ApiTags('audit-me')
@ApiBearerAuth()
@Roles('PATIENT')
@Controller('audit/me')
export class AuditMeController {
  /**
   * @param service - Lectura del registro de accesos del titular.
   */
  constructor(private readonly service: MyDataAccessService) {}

  /** Quién accedió a mi historia, cuándo, qué tipo de dato y con qué finalidad. */
  @Get('data-access')
  @AccessLogged({ resourceType: 'PATIENT_DATA_ACCESS_LOG', patient: 'actor' })
  @ApiOperation({
    summary: 'Quién accedió a mi historia y con qué finalidad',
    description:
      'Del más reciente al más antiguo, paginado por cursor. Cada acceso trae quién lo hizo (tipo y nombre), cuándo, la operación, el tipo de dato y la finalidad declarada. No trae contenido clínico, IP ni identificadores de otras cuentas. Consultar este registro es en sí un acceso y queda anotado.',
  })
  @ApiOkResponse({ type: MyDataAccessPageDto })
  @ApiNotFoundResponse({ description: 'La cuenta no es la de un paciente' })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: MyDataAccessQueryDto,
  ): Promise<MyDataAccessPageDto> {
    return this.service.list(actor, query);
  }
}
