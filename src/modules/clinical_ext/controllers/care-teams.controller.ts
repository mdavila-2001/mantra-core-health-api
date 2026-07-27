import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { CareTeamsService } from '../services';
import {
  CreateCareTeamDto,
  CareTeamResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints de equipos de cuidado (`/care-teams`). Capa fina: valida parámetros y
 * delega en `CareTeamsService`.
 */
@ApiTags('clinical-ext-care-teams')
@ApiBearerAuth()
@Controller('care-teams')
export class CareTeamsController {
  constructor(private readonly careTeamsService: CareTeamsService) {}

  /** UC-18-01. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un equipo de cuidado con sus miembros' })
  create(
    @Body() dto: CreateCareTeamDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareTeamResponseDto> {
    return this.careTeamsService.create(dto, actor);
  }

  /** UC-18-02. */
  @Patch(':id/members/:memberId/set-responsible')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Designar miembro responsable (transferir liderazgo)',
  })
  setResponsible(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.careTeamsService.setResponsible(id, memberId, actor);
  }
}
