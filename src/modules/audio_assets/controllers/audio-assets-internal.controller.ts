import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AudioGenerationUseCase } from '../application/audio-generation.use-case';
import { AudioMaintenanceService } from '../application/audio-maintenance.service';
import { PregenerateAudioAssetsUseCase } from '../application/pregenerate-audio-assets.use-case';
import {
  AudioMaintenanceDto,
  FailedAudioAssetDto,
  GeneratedAudioAssetDto,
  PregenerateAudioAssetsDto,
} from '../dto/audio-assets.dto';

@ApiTags('audio-assets-internal')
@ApiBearerAuth()
@Roles('SYSTEM')
@Controller('internal/audio-assets')
export class AudioAssetsInternalController {
  constructor(
    private readonly generation: AudioGenerationUseCase,
    private readonly pregenerate: PregenerateAudioAssetsUseCase,
    private readonly maintenance: AudioMaintenanceService,
  ) {}

  @Get('status')
  @ApiOperation({
    summary:
      'Diagnóstico de audio sin convertir TTS en dependencia de readiness',
  })
  status() {
    return this.maintenance.status();
  }

  @Post('pregenerate')
  @ApiOperation({
    summary: 'Pre-genera STATIC, ENUMERATED y fallbacks de forma idempotente',
  })
  pregenerateAssets(
    @Body() dto: PregenerateAudioAssetsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.pregenerate.execute(actor, dto.templateKeys);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verifica existencia y checksum de assets READY' })
  verify(@Body() dto: AudioMaintenanceDto) {
    return this.maintenance.verify(dto.limit ?? 250);
  }

  @Post('garbage-collect')
  @ApiOperation({
    summary:
      'Elimina conservadoramente objetos de assets deprecados/permanentes',
  })
  garbageCollect(@Body() dto: AudioMaintenanceDto) {
    return this.maintenance.garbageCollect(dto.limit ?? 100);
  }

  @Post(':assetId/deprecate')
  @ApiOperation({
    summary: 'Depreca un asset no-fallback sin eliminarlo inmediatamente',
  })
  deprecate(@Param('assetId', new ParseUUIDPipe()) assetId: string) {
    return this.maintenance.deprecate(assetId);
  }

  @Post(':assetId/prepare-generation')
  prepare(@Param('assetId', new ParseUUIDPipe()) assetId: string) {
    return this.generation.prepare(assetId);
  }

  @Post(':assetId/generated')
  async generated(
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() dto: GeneratedAudioAssetDto,
  ) {
    await this.generation.generated({ assetId, ...dto });
    return { ok: true };
  }

  @Post(':assetId/generation-failed')
  async failed(
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Body() dto: FailedAudioAssetDto,
  ) {
    await this.generation.failed({ assetId, ...dto });
    return { ok: true };
  }
}
