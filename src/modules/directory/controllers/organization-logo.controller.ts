import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Put,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { SetOrganizationLogoDto } from '../dto/set-organization-logo.dto';
import { OrganizationLogoService } from '../services/organization-logo.service';

@ApiTags('directory-tenants')
@ApiBearerAuth()
@Controller('tenants/:tenantId/logo')
export class OrganizationLogoController {
  constructor(private readonly logos: OrganizationLogoService) {}

  @Get()
  @ApiOperation({ summary: 'Logo de la propia organización' })
  get(
    @Param('tenantId', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.logos.get(id, actor);
  }

  @Put()
  @ApiOperation({
    summary: 'Cambiar o quitar el logo como administrador de la organización',
  })
  set(
    @Param('tenantId', ParseUUIDPipe) id: string,
    @Body() dto: SetOrganizationLogoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.logos.set(id, dto.fileId, actor);
  }

  @Get('content')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Imagen del logo para miembros de la organización' })
  async content(
    @Param('tenantId', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.logos.content(id, actor);
    res.setHeader('Content-Type', content.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(content.buffer);
  }
}
