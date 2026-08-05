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
import { DeletionsService } from './deletions.service';
import {
  ExecuteDeletionDto,
  ExecuteDeletionResponseDto,
  VerifyDeletionDto,
  VerifyDeletionResponseDto,
} from './deletions.dto';

@ApiTags('deletions')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('deletions')
export class DeletionsController {
  constructor(private readonly service: DeletionsService) {}

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecutar un borrado en el backend destino (emulado)',
    description:
      'Refleja `DeletionExecutionProviderAdapter` de `DeletionPipelineJob`: decide succeeded/failed con la tasa configurada.',
  })
  execute(
    @Body() dto: ExecuteDeletionDto,
  ): Promise<ExecuteDeletionResponseDto> {
    return this.service.execute(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar la ausencia de un objetivo ya ejecutado (emulado)',
    description:
      'Refleja `DeletionVerificationProviderAdapter`: consistente con `execute` dentro de la misma corrida del emulador.',
  })
  verify(@Body() dto: VerifyDeletionDto): Promise<VerifyDeletionResponseDto> {
    return this.service.verify(dto);
  }
}
