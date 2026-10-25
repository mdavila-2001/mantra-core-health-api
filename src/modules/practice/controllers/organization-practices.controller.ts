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
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { OrganizationPracticeProvisioningService } from '../services';
import {
  CreateOrganizationPracticeDto,
  OrganizationPracticeResponseDto,
} from '../dto';

/**
 * Práctica y sede de una organización, sobre `/tenants/{tenantId}/practices`
 * (CM-11).
 *
 * Sin `@Roles`: la regla es la membresía `OWNER`/`ADMIN` de **esa**
 * organización (o la plataforma), y la decide el servicio. Un rol global
 * `SECURITY_ADMIN` dejaría a la clínica recién registrada sin poder abrir su
 * propia práctica.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('tenants')
export class OrganizationPracticesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param provisioning - Alta de la práctica y su primera sede.
   */
  constructor(
    private readonly provisioning: OrganizationPracticeProvisioningService,
  ) {}

  /** Una organización verificada abre su práctica con la primera sede. */
  @Audited({
    action: 'PRACTICE_CREATED',
    entity: 'practice',
    entityId: 'result.practiceId',
  })
  @Post(':tenantId/practices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear la práctica y la primera sede de una organización',
    description:
      'Exige que la organización esté verificada (422 si no) y que el ' +
      'actor administre esa organización (403 si no). Dos prácticas con el ' +
      'mismo nombre en la misma organización responden 409.',
  })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateOrganizationPracticeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OrganizationPracticeResponseDto> {
    return this.provisioning.provision(tenantId, dto, actor);
  }
}
