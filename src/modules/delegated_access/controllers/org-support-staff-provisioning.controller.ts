import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Audited,
  CurrentUser,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { CreateOrgSupportStaffDto, CreatedSupportStaffViewDto } from '../dto';
import { SupportStaffProvisioningService } from '../services/support-staff-provisioning.service';

/**
 * Alta directa y vinculación automática de secretarias por parte de la organización.
 */
@ApiTags('delegated-access-support-staff')
@ApiBearerAuth()
@Controller()
export class OrgSupportStaffProvisioningController {
  constructor(private readonly provisioning: SupportStaffProvisioningService) {}

  /** Crea la cuenta de una secretaria y la vincula de inmediato con estado ACTIVE. */
  @Audited({
    action: 'SUPPORT_STAFF_PROVISIONED_BY_ORGANIZATION',
    entity: 'organization_user_assignment',
    entityId: 'result.linkId',
  })
  @Post('org/support-staff')
  @Roles()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Crear cuenta de secretaria y vincularla a la organización de inmediato',
    description:
      '`@Roles()` vacío: sin rol global. Lo decide el servicio, que exige ser ' +
      'OWNER/ADMIN activo de la organización del contexto o tener ' +
      'SECURITY_ADMIN/SUPERADMIN válido en ella (un rol acotado a otra ' +
      'organización no sirve).',
  })
  create(
    @Body() dto: CreateOrgSupportStaffDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Ip() ip: string,
  ): Promise<CreatedSupportStaffViewDto> {
    return this.provisioning.provisionForOrganization(
      requireTenantId(),
      dto,
      actor,
      ip,
    );
  }
}
