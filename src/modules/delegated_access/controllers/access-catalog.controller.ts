import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  EngagementEffectiveResponseDto,
  EngagementSummaryResponseDto,
  PermissionCatalogResponseDto,
} from '../dto';
import { AccessSummaryService } from '../services/access-summary.service';

/**
 * Catálogo de permisos, resumen en lenguaje simple y permisos efectivos de un
 * vínculo (CONTRATO-GOBIERNO §8.3 A). `SECURITY_ADMIN` ve toda la organización;
 * un administrador delegado (`SUPPORT_STAFF`) necesita `team.members.view` y ve
 * solo a las personas de su alcance (lo decide el servicio).
 */
@ApiTags('delegated-access-governance')
@ApiBearerAuth()
@Controller('org')
export class AccessCatalogController {
  /** @param summary - Lecturas de catálogo, resumen y efectivos. */
  constructor(private readonly summary: AccessSummaryService) {}

  /** Los 73 permisos con sus metadatos, las categorías y los alias. */
  @Get('permission-catalog')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Catálogo de permisos del personal de apoyo' })
  catalog(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PermissionCatalogResponseDto> {
    return this.summary.catalog(actor);
  }

  /** Resumen en lenguaje simple de lo que puede hacer un vínculo. */
  @Get('support-engagements/:id/summary')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({
    summary: 'Resumen en lenguaje simple de los permisos de un vínculo',
  })
  summaryOf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EngagementSummaryResponseDto> {
    return this.summary.summary(id, actor);
  }

  /** Permisos efectivos de un vínculo, con su origen. */
  @Get('support-engagements/:id/effective')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({
    summary: 'Permisos efectivos de un vínculo (alias y átomos)',
  })
  effective(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EngagementEffectiveResponseDto> {
    return this.summary.effective(id, actor);
  }
}
