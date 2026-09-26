import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ParseOptionalLimitPipe,
  Roles,
  getCurrentTenantId,
} from '../../../common';
import { HealthContextListingService } from '../services/health-context-listing.service';
import {
  ListContextAgentsResponseDto,
  ListContextCollectionRunsResponseDto,
  ListContextSchedulesResponseDto,
  ListCountryHealthContextVersionsResponseDto,
  ListCountryHealthContextsResponseDto,
  ListHealthContextSourcesResponseDto,
} from '../dto/listings.dto';

/** CV-13: lecturas del hub de contexto de salud, con los roles que ya administran cada recurso. */
@ApiTags('health-context')
@ApiBearerAuth()
@Controller('health-context')
export class HealthContextListingController {
  constructor(private readonly service: HealthContextListingService) {}

  @Get('sources')
  @Roles('SOURCE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar las fuentes de contexto de salud' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listSources(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListHealthContextSourcesResponseDto> {
    return this.service.listSources({ cursor, limit });
  }

  @Get('agents')
  @Roles('SOURCE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar los agentes recolectores (de plataforma y del tenant)',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listAgents(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListContextAgentsResponseDto> {
    return this.service.listAgents(getCurrentTenantId(), { cursor, limit });
  }

  @Get('schedules')
  @Roles('CONTEXT_CURATOR', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar las programaciones de recolección' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listSchedules(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListContextSchedulesResponseDto> {
    return this.service.listSchedules({ cursor, limit });
  }

  @Get('contexts')
  @Roles('CONTEXT_CURATOR', 'QUALITY_REVIEWER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar los contextos de salud por país' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listContexts(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListCountryHealthContextsResponseDto> {
    return this.service.listContexts({ cursor, limit });
  }

  @Get('contexts/:contextId/versions')
  @Roles('CONTEXT_CURATOR', 'QUALITY_REVIEWER', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar las versiones de un contexto (sin payload)',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listContextVersions(
    @Param('contextId', ParseUUIDPipe) contextId: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListCountryHealthContextVersionsResponseDto> {
    return this.service.listContextVersions(contextId, { cursor, limit });
  }

  @Get('collection-runs')
  @Roles('CONTEXT_CURATOR', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar las corridas de recolección' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listCollectionRuns(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListContextCollectionRunsResponseDto> {
    return this.service.listCollectionRuns({ cursor, limit });
  }
}
