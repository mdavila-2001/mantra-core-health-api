import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InfrastructureReadService, SiteEstablishmentService } from '../services';
import {
  InfrastructureCatalogDto,
  SiteLicenseDto,
  UpdateSiteLicenseDto,
} from '../dto';

/**
 * Catálogo de infraestructura (F1, contrato §3). No lee datos de ningún
 * tenant —son conceptos y reglas globales—, pero sigue exigiendo sesión.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('practice')
export class InfrastructureCatalogController {
  constructor(private readonly read: InfrastructureReadService) {}

  /** Formas, funciones con su perfil, reglas, ciclo de vida y atributos. */
  @Get('infrastructure-catalog')
  @ApiOperation({ summary: 'Catálogo de infraestructura hospitalaria' })
  @ApiOkResponse({ type: InfrastructureCatalogDto })
  catalog(): Promise<InfrastructureCatalogDto> {
    return this.read.catalog();
  }
}

/** Habilitaciones por id (fachada sobre `organization_extensions.facility_licenses`). */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('site-licenses')
export class SiteLicensesController {
  constructor(private readonly establishment: SiteEstablishmentService) {}

  /** Editar una habilitación; el estado sólo lo cambia la plataforma. */
  @Audited({ action: 'SITE_LICENSE_UPDATED', entity: 'facility_license', entityId: 'param:id' })
  @Patch(':id')
  @ApiOperation({ summary: 'Editar una habilitación del establecimiento' })
  @ApiHeader({ name: 'If-Match', required: false, description: 'rowVersion; si viene y no coincide: 412' })
  @ApiOkResponse({ type: SiteLicenseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiteLicenseDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteLicenseDto> {
    return this.establishment.updateLicense(id, dto, ifMatch, actor, requireTenantId());
  }
}
