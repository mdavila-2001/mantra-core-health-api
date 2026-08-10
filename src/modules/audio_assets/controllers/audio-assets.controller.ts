import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { AudioAssetsFacade } from '../audio-assets.facade';
import { AudioContentService } from '../audio-content.service';
import { ResolveAudioAssetDto } from '../dto/audio-assets.dto';

@ApiTags('audio-assets')
@ApiBearerAuth()
@Controller('audio-assets')
export class AudioAssetsController {
  constructor(private readonly facade: AudioAssetsFacade, private readonly content: AudioContentService) {}

  @Post('resolve')
  @ApiOperation({ summary: 'Resuelve un asset TTS desde caché o agenda su generación' })
  resolve(@Body() dto: ResolveAudioAssetDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.facade.resolve(dto, actor);
  }

  @Get(':assetId/content')
  @Header('Cache-Control', 'private, max-age=3600')
  @ApiOperation({ summary: 'Entrega bytes de un asset READY desde storage propio' })
  async contentById(
    @Param('assetId', new ParseUUIDPipe()) assetId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.content.get(assetId);
    response.setHeader('Content-Type', result.mimeType);
    if (result.checksum) response.setHeader('ETag', `"${result.checksum}"`);
    return new StreamableFile(result.buffer);
  }
}
