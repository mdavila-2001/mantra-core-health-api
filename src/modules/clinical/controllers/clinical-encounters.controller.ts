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
import { CareEpisodesService, EncountersService } from '../services';
import {
  CreateCareEpisodeDto,
  CareEpisodeResponseDto,
  CheckInEncounterDto,
  CloseEncounterDto,
  EncounterResponseDto,
} from '../dto';

/**
 * Endpoints de logística de encuentros: episodios de cuidado y ciclo de vida del
 * encuentro (check-in y cierre). Capa fina que delega en los servicios de dominio.
 */
@ApiTags('clinical-encounters')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('clinical')
export class ClinicalEncountersController {
  constructor(
    private readonly episodesService: CareEpisodesService,
    private readonly encountersService: EncountersService,
  ) {}

  /** UC-08-01. */
  @Post('care-episodes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir un episodio de cuidado' })
  openEpisode(
    @Body() dto: CreateCareEpisodeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareEpisodeResponseDto> {
    return this.episodesService.open(dto, actor);
  }

  /** UC-08-02. */
  @Post('encounters/check-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Check-in de un encuentro con participantes y ubicación',
  })
  checkIn(
    @Body() dto: CheckInEncounterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    return this.encountersService.checkIn(dto, actor);
  }

  /** UC-08-14. */
  @Post('encounters/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar un encuentro en curso (gatilla facturación)',
  })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseEncounterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    return this.encountersService.close(id, dto, actor);
  }
}
