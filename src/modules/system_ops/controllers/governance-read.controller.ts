import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, TenantAgnostic } from '../../../common';
import { PORTAL_READ_ROLES } from '../../data_catalog/data_catalog.constants';
import {
  GovernancePiiPageDto,
  GovernancePolicyDetailDto,
  GovernancePolicyPageDto,
  ListGovernancePiiFieldsQueryDto,
  ListGovernancePoliciesQueryDto,
} from '../dto';
import { GovernanceReadService } from '../services';

/**
 * Lecturas de gobierno de datos para el portal administrativo: políticas y campos con datos
 * personales. Sólo lectura; los roles son los del portal de datos (`PORTAL_READ_ROLES`) y la
 * escritura de estas mismas políticas sigue en {@link GovernanceCatalogController}.
 */
@ApiTags('system-ops-governance')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('admin/governance')
export class GovernanceReadController {
  constructor(private readonly service: GovernanceReadService) {}

  @Get('policies')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary:
      'Listar las políticas de gobierno (escritura, retención, anonimización, clasificación y residencia)',
  })
  @ApiOkResponse({ type: GovernancePolicyPageDto })
  listPolicies(
    @Query() query: ListGovernancePoliciesQueryDto,
  ): Promise<GovernancePolicyPageDto> {
    return this.service.listPolicies(query);
  }

  @Get('policies/:id')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary:
      'Ver una política: atributos, a qué se aplica e historial de cambios',
  })
  @ApiOkResponse({ type: GovernancePolicyDetailDto })
  @ApiResponse({ status: 404, description: 'No existe esa política' })
  getPolicy(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GovernancePolicyDetailDto> {
    return this.service.getPolicy(id);
  }

  @Get('pii-fields')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary:
      'Inventario de campos con datos personales o secretos (catálogo de datos y registro de gobierno)',
  })
  @ApiOkResponse({ type: GovernancePiiPageDto })
  listPiiFields(
    @Query() query: ListGovernancePiiFieldsQueryDto,
  ): Promise<GovernancePiiPageDto> {
    return this.service.listPiiFields(query);
  }
}
