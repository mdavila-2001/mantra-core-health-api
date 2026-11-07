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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ResolveMapLinkUseCase } from '../application/use-cases/resolve-map-link.use-case';
import {
  ResolveMapLinkDto,
  ResolveMapLinkResponseDto,
} from '../dto/resolve-map-link.dto';

/** Location helpers of the branch form. `@Roles()` empty: the use case decides. */
@ApiTags('directory-tenants')
@ApiBearerAuth()
@Controller('tenants/:tenantId/branches')
export class BranchLocationController {
  constructor(private readonly resolveLink: ResolveMapLinkUseCase) {}

  @Post('location-preview')
  @Roles()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Coordenadas de un enlace de Google Maps u OpenStreetMap',
    description:
      'Acepta enlaces largos y los cortos maps.app.goo.gl. No guarda nada: ' +
      'sirve para mostrar el pin antes de crear la sucursal.',
  })
  preview(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: ResolveMapLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResolveMapLinkResponseDto> {
    return this.resolveLink.execute(tenantId, dto.url, actor);
  }
}
