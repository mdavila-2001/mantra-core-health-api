import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { OrgextDataBoundariesService } from '../services';
import { CreateDataBoundaryDto, DataBoundaryResponseDto } from '../dto';

/**
 * Endpoint de fronteras de datos (residencia/RLS) (UC-22-08). Capa fina: valida
 * el cuerpo y delega en el servicio de dominio.
 */
@ApiTags('orgext-data-boundaries')
@ApiBearerAuth()
@Controller('orgext/data-boundaries')
export class OrgextDataBoundariesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param boundariesService - Valor de boundaries service requerido por la operación.
   */
  constructor(
    private readonly boundariesService: OrgextDataBoundariesService,
  ) {}

  /** UC-22-08. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir frontera de datos (residencia/RLS)' })
  define(
    @Body() dto: CreateDataBoundaryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DataBoundaryResponseDto> {
    return this.boundariesService.define(dto, actor);
  }
}
