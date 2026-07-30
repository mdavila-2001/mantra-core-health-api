import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { DataReleaseService } from '../services';
import {
  ExportBundleDto,
  ExportJobResponseDto,
  EverythingBundleResponseDto,
} from '../dto';

/**
 * Superficie FHIR R5 del módulo: las dos operaciones que el caso de uso publica
 * bajo `/fhir/r5`.
 *
 * Va en un controlador aparte porque su prefijo no es el del módulo: son rutas
 * de interoperabilidad, con la forma que un cliente FHIR espera encontrar, y
 * meterlas bajo `/health-data` las volvería inservibles para ese cliente.
 */
@ApiTags('fhir-r5')
@ApiBearerAuth()
@Controller('fhir/r5')
export class FhirR5Controller {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param releaseService - Valor de release service requerido por la operación.
   */
  constructor(private readonly releaseService: DataReleaseService) {}

  /** UC-52-12. */
  @Post('$export')
  @Roles('PRIVACY_OFFICER', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Exportar un Bundle FHIR interoperable con su manifiesto',
    description:
      'El propósito de uso es obligatorio y el hash sella lo entregado.',
  })
  exportBundle(
    @Body() dto: ExportBundleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExportJobResponseDto> {
    return this.releaseService.exportBundle(dto, actor);
  }

  /** UC-52-13. */
  @Get('Patient/:id/$everything')
  @Roles('INTEROP_CONSUMER', 'CLINICAL_INFORMATICIAN', 'HEALTH_DATA_ADMIN')
  @ApiOperation({
    summary: 'Servir la historia longitudinal del paciente',
    description:
      'La identidad se expande por el clúster del MPI: dos perfiles resueltos como la misma persona tienen una sola historia.',
  })
  @ApiQuery({
    name: 'custodian',
    required: false,
    format: 'uuid',
    description: 'Custodio por el que se acota la búsqueda',
  })
  serveEverything(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('custodian') custodian?: string,
  ): Promise<EverythingBundleResponseDto> {
    return this.releaseService.serveEverything(id, custodian, actor);
  }
}
