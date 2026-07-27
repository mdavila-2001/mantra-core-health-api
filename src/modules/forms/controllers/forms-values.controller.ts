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
import { FormsValuesService } from '../services';
import {
  CorrectValueDto,
  ImportValuesDto,
  IdListResponseDto,
  IdResponseDto,
} from '../dto';

/**
 * Curación de valores sobre `/forms/values`. Corrección con supersede (clínico) e
 * importación batch con procedencia (ETL). Capa fina que delega en
 * `FormsValuesService`.
 */
@ApiTags('forms-values')
@ApiBearerAuth()
@Controller('forms/values')
export class FormsValuesController {
  constructor(private readonly valuesService: FormsValuesService) {}

  /** UC-09-10. */
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar procedencia de valores importados (batch ETL)',
  })
  importValues(
    @Body() dto: ImportValuesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdListResponseDto> {
    return this.valuesService.importValues(dto, actor);
  }

  /** UC-09-09. */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Corregir valor con supersede y snapshot inmutable',
  })
  correctValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CorrectValueDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.valuesService.correctValue(id, dto, actor);
  }
}
