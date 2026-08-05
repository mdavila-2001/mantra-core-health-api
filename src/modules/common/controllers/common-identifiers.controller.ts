import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { IdentifiersService } from '../services';
import { CreateIdentifierDto, IdentifierResponseDto } from '../dto';

/** Endpoints de identificadores oficiales del módulo Common. */
@ApiTags('common/identifiers')
@ApiBearerAuth()
@Controller('common/identifiers')
export class CommonIdentifiersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param identifiersService - Valor de identifiers service requerido por la operación.
   */
  constructor(private readonly identifiersService: IdentifiersService) {}

  /** UC-02-01: registra un identificador oficial. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un identificador oficial (UC-02-01)' })
  create(
    @Body() dto: CreateIdentifierDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IdentifierResponseDto> {
    return this.identifiersService.create(dto, user);
  }
}
