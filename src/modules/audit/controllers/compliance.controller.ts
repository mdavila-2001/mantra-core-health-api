import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ComplianceService } from '../services';
import { CreateAuditExportDto, AuditExportResultDto } from '../dto';

/** Endpoint de cumplimiento sobre `/compliance/*` (UC-10-07). */
@ApiTags('audit-compliance')
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /** UC-10-07. */
  @Post('audit-export')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Exportar evidencia de auditoría para cumplimiento',
  })
  exportEvidence(
    @Body() dto: CreateAuditExportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuditExportResultDto> {
    return this.complianceService.exportEvidence(dto, actor);
  }
}
