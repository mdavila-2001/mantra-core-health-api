import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { BackupService } from '../services';
import { CreateRestoreTestRunDto, RestoreTestRunResponseDto } from '../dto';

/**
 * Endpoint interno del worker de backup/restore (UC-11-10). Protegido por rol
 * admin al no existir un principal de servicio dedicado.
 */
@ApiTags('system-ops-restore')
@ApiBearerAuth()
@Controller('internal/ops')
export class RestoreTestController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: BackupService) {}

  /** UC-11-10. */
  @Audited({
    action: 'RESTORE_TEST_RECORDED',
    entity: 'restore_test_run',
    entityId: 'result.id',
  })
  @Post('restore-test-runs')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una prueba de restauración con evidencia',
  })
  recordRestoreTest(
    @Body() dto: CreateRestoreTestRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RestoreTestRunResponseDto> {
    return this.service.recordRestoreTest(dto, actor);
  }
}
