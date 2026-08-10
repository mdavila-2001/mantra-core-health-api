import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AudioGenerationUseCase } from '../application/audio-generation.use-case';
import { PregenerateAudioAssetsUseCase } from '../application/pregenerate-audio-assets.use-case';
import { FailedAudioAssetDto, GeneratedAudioAssetDto, PregenerateAudioAssetsDto } from '../dto/audio-assets.dto';

@ApiTags('audio-assets-internal')
@ApiBearerAuth()
@Roles('SYSTEM')
@Controller('internal/audio-assets')
export class AudioAssetsInternalController {
  constructor(
    private readonly generation: AudioGenerationUseCase,
    private readonly pregenerate: PregenerateAudioAssetsUseCase,
  ) {}

  @Post('pregenerate')
  @ApiOperation({ summary: 'Pre-genera STATIC, ENUMERATED y fallbacks de forma idempotente' })
  pregenerateAssets(@Body() dto: PregenerateAudioAssetsDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.pregenerate.execute(actor, dto.templateKeys);
  }

  @Post(':assetId/prepare-generation')
  prepare(@Param('assetId', new ParseUUIDPipe()) assetId: string) {
    return this.generation.prepare(assetId);
  }

  @Post(':assetId/generated')
  async generated(@Param('assetId', new ParseUUIDPipe()) assetId: string, @Body() dto: GeneratedAudioAssetDto) {
    await this.generation.generated({ assetId, ...dto });
    return { ok: true };
  }

  @Post(':assetId/generation-failed')
  async failed(@Param('assetId', new ParseUUIDPipe()) assetId: string, @Body() dto: FailedAudioAssetDto) {
    await this.generation.failed({ assetId, ...dto });
    return { ok: true };
  }
}
