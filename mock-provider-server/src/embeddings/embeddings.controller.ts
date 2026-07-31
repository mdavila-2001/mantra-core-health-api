import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/api-key.guard';
import { EmbeddingsService } from './embeddings.service';
import {
  ComputeEmbeddingsDto,
  ComputeEmbeddingsResponseDto,
} from './embeddings.dto';

@ApiTags('embeddings')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly service: EmbeddingsService) {}

  @Post('compute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular embeddings de un lote de textos (emulado)',
    description:
      'Vectores deterministas sin significado semántico real: el mismo texto siempre produce el mismo vector.',
  })
  compute(
    @Body() dto: ComputeEmbeddingsDto,
  ): Promise<ComputeEmbeddingsResponseDto> {
    return this.service.compute(dto);
  }
}
