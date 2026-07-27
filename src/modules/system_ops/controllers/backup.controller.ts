import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { BackupService } from '../services';
import { CreateBackupPolicyDto, IdResultDto } from '../dto';

/** Endpoint de políticas de backup (UC-11-09). */
@ApiTags('system-ops-backup')
@ApiBearerAuth()
@Controller('admin/ops')
export class BackupController {
  constructor(private readonly service: BackupService) {}

  /** UC-11-09. */
  @Post('backup-policies')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una política de backup (RPO/RTO/inmutabilidad)',
  })
  createPolicy(
    @Body() dto: CreateBackupPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.createPolicy(dto, actor);
  }
}
