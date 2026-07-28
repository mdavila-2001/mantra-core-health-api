import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { StorageOperationsService } from '../services';
import { ConsolidateCostSnapshotDto, CostSnapshotResponseDto } from '../dto';

/**
 * Superficie financiera del almacenamiento: la consolidación de costes por
 * tenant y dataset. Va aparte porque su prefijo (`/finops`) y su público
 * —quien mira la factura— son distintos de los de gobierno y operación.
 */
@ApiTags('polyglot-finops')
@ApiBearerAuth()
@Controller('finops')
export class StorageFinOpsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param operationsService - Valor de operations service requerido por la operación.
   */
  constructor(private readonly operationsService: StorageOperationsService) {}

  /** UC-54-12. */
  @Post('storage-cost-snapshots')
  @Roles('SYSTEM', 'FINOPS_ANALYST', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Consolidar la instantánea de costes del periodo',
    description:
      'Idempotente por ámbito y periodo: reconsolidar actualiza, no duplica.',
  })
  consolidateCostSnapshot(
    @Body() dto: ConsolidateCostSnapshotDto,
  ): Promise<CostSnapshotResponseDto> {
    return this.operationsService.consolidateCostSnapshot(dto);
  }
}
