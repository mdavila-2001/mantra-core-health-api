import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { RetentionExecutionService } from '../services';
import { RetentionExecutionResponseDto, RunRetentionDto } from '../dto';

/**
 * Endpoint interno del worker de retención (UC-11-05). Protegido por rol admin al
 * no existir un principal de servicio dedicado en la plataforma.
 */
@ApiTags('system-ops-retention')
@ApiBearerAuth()
@Controller('internal/governance')
export class RetentionExecutionController {
  constructor(private readonly service: RetentionExecutionService) {}

  /** UC-11-05. */
  @Post('retention-executions/run')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Ejecutar un barrido de retención (excluye objetivos bajo legal hold)',
  })
  run(
    @Body() dto: RunRetentionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetentionExecutionResponseDto> {
    return this.service.run(dto, actor);
  }
}
