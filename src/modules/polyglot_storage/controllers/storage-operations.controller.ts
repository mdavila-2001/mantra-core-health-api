import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { StorageOperationsService } from '../services';
import {
  RecordHealthCheckDto,
  HealthCheckResponseDto,
  DefineIntegrityPolicyDto,
  IntegrityPolicyResponseDto,
  VerifyIntegrityDto,
  VerifyIntegrityResponseDto,
} from '../dto';

/**
 * Superficie de operación del almacenamiento políglota: la usan los workers de
 * salud e integridad, no los administradores de gobierno.
 */
@ApiTags('polyglot-ops')
@ApiBearerAuth()
@Controller('ops')
export class StorageOperationsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param operationsService - Valor de operations service requerido por la operación.
   */
  constructor(private readonly operationsService: StorageOperationsService) {}

  /** UC-54-11. */
  @Post('store-health-checks')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una comprobación de salud de la región',
    description:
      'El failover automático sólo ocurre si la política de replicación lo autoriza.',
  })
  recordHealthCheck(
    @Body() dto: RecordHealthCheckDto,
  ): Promise<HealthCheckResponseDto> {
    return this.operationsService.recordHealthCheck(dto);
  }

  /** UC-54-13. */
  @Post('integrity-policies')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir la política de integridad del dataset',
    description: 'Una por dataset: redefinirla la actualiza.',
  })
  defineIntegrityPolicy(
    @Body() dto: DefineIntegrityPolicyDto,
  ): Promise<IntegrityPolicyResponseDto> {
    return this.operationsService.defineIntegrityPolicy(dto);
  }

  /** UC-54-13. */
  @Post('integrity/:datasetId/verify')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar que la proyección cuadra con la fuente canónica',
    description:
      'No cuadrar cuarentena la colocación si la política lo ordena.',
  })
  verifyIntegrity(
    @Param('datasetId', ParseUUIDPipe) datasetId: string,
    @Body() dto: VerifyIntegrityDto,
  ): Promise<VerifyIntegrityResponseDto> {
    return this.operationsService.verifyIntegrity(datasetId, dto);
  }
}
