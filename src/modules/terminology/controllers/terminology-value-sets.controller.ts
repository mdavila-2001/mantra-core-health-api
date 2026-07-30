import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ValueSetsService } from '../services';
import { CreateValueSetDto, ValueSetResponseDto } from '../dto';

/**
 * Endpoint de alta de conjuntos de valores (UC-03-07). Reservado a
 * `SECURITY_ADMIN`.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/value-sets')
export class TerminologyValueSetsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param valueSetsService - Valor de value sets service requerido por la operación.
   */
  constructor(private readonly valueSetsService: ValueSetsService) {}

  /**
   * Crea create value set.
   *
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create value set conforme al contrato `Promise<ValueSetResponseDto>`.
   */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-07: crea un conjunto de valores con versión y reglas',
  })
  createValueSet(
    @Body() dto: CreateValueSetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ValueSetResponseDto> {
    return this.valueSetsService.createValueSet(dto, user);
  }
}
