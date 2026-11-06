import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  REPRESENTATIVE_ROLE_CODE,
  type RepresentativeRole,
} from '../legal-representatives';
import {
  RepresentativeNameResponseDto,
  UpdateRepresentativeNameDto,
} from '../dto/update-representative-name.dto';
import { TenantRepresentativeNameService } from '../services/tenant-representative-name.service';

/**
 * The people that represent an organization. `@Roles()` is empty on purpose:
 * the rule is OWNER/ADMIN membership of **that** organization (or the
 * platform), decided by the service — same as the rest of `/tenants/:id`.
 */
@ApiTags('directory-tenants')
@ApiBearerAuth()
@Controller('tenants/:tenantId/representatives')
export class TenantRepresentativesController {
  constructor(private readonly names: TenantRepresentativeNameService) {}

  @Audited({
    action: 'TENANT_REPRESENTATIVE_RENAMED',
    entity: 'tenant',
    entityId: 'param:tenantId',
  })
  @Patch(':role/name')
  @Roles()
  @ApiOperation({
    summary: 'Corregir el nombre del representante legal o de una gerencia',
    description:
      'role: LEGAL_REPRESENTATIVE, GENERAL_MANAGER, COMMERCIAL_MANAGER o ' +
      'MARKETING_MANAGER. Recibe las mismas cuatro partes que el registro.',
  })
  rename(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('role') role: string,
    @Body() dto: UpdateRepresentativeNameDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RepresentativeNameResponseDto> {
    if (!Object.hasOwn(REPRESENTATIVE_ROLE_CODE, role)) {
      throw new BadRequestException('Rol de representante desconocido');
    }
    return this.names.update(tenantId, role as RepresentativeRole, dto, actor);
  }
}
