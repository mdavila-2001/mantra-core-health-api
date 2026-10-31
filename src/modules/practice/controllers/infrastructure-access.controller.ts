import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InfraAccessMeDto } from '../dto/infrastructure-access-me.dto';
import { InfrastructureAccessMeService } from '../services/infrastructure-access-me.service';

/** Lo que el actor puede hacer en la infraestructura del tenant activo. */
@ApiTags('practice-operations')
@ApiBearerAuth()
@Controller('practice/infrastructure-access')
export class InfrastructureAccessController {
  constructor(private readonly me: InfrastructureAccessMeService) {}

  /** Sedes, roles, asignaciones y acciones del actor (lo que la UI refleja). */
  @Get('me')
  @ApiOperation({
    summary: 'Acceso del actor a la infraestructura del tenant activo',
  })
  @ApiOkResponse({ type: InfraAccessMeDto })
  read(@CurrentUser() actor: AuthenticatedUser): Promise<InfraAccessMeDto> {
    return this.me.me(actor, requireTenantId());
  }
}
