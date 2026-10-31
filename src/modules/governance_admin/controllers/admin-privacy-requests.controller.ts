import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { TenantAgnostic } from '../../../common/tenant/tenant-agnostic.decorator';
import { GOVERNANCE_READ_ROLES } from '../governance_admin.constants';
import { IdParamDto, PrivacyRequestsQueryDto } from '../dto/governance-admin.query.dto';
import { PrivacyRequestsService } from '../services/privacy-requests.service';

/**
 * Lectura de las solicitudes de privacidad (DSAR). El alta y las transiciones siguen siendo
 * `POST /privacy/dsar` y `PATCH /privacy/dsar/:id` (`SECURITY_ADMIN`): esta vista no las duplica.
 */
@ApiTags('admin-governance-privacy')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('admin/governance/privacy-requests')
export class AdminPrivacyRequestsController {
  constructor(private readonly service: PrivacyRequestsService) {}

  @Get()
  @Roles(...GOVERNANCE_READ_ROLES)
  @ApiOperation({ summary: 'Solicitudes de privacidad, más antiguas primero, con conteo por estado' })
  list(@Query() q: PrivacyRequestsQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Roles(...GOVERNANCE_READ_ROLES)
  @ApiOperation({ summary: 'Una solicitud de privacidad y las transiciones que admite' })
  @ApiResponse({ status: 404, description: 'No existe la solicitud' })
  get(@Param() p: IdParamDto) {
    return this.service.get(p.id);
  }
}
