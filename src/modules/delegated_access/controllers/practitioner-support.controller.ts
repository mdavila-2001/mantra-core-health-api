import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Audited,
  CurrentUser,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import {
  CreatePractitionerSupportStaffDto,
  CreatedSupportStaffViewDto,
  PractitionerInviteSupportDto,
  SupportLinkListDto,
  SupportLinkReasonDto,
  SupportLinksCreatedDto,
  SupportLinkViewDto,
} from '../dto';
import { SupportStaffService } from '../services/support-staff.service';
import { SupportStaffProvisioningService } from '../services/support-staff-provisioning.service';

/**
 * El doctor y sus secretarias: ve su equipo, acepta o rechaza a quien pidió
 * asistirlo, invita y termina vínculos.
 *
 * Sin tenant activo: un doctor atiende en varios hospitales y su equipo es de
 * todos. Cada operación comprueba que el vínculo sea con **su** vinculación
 * (`practitionerProfileId` del token); uno ajeno responde 404.
 *
 * `POST /practitioner-delegates/:id/accept` y `GET /me/practitioner/support-team`
 * son las rutas del PR #1175; acá `:id` es el vínculo secretaria–doctor.
 */
@ApiTags('delegated-access-support-staff')
@ApiBearerAuth()
@Controller()
export class PractitionerSupportController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param support - Casos de uso de los vínculos de la secretaria.
   * @param provisioning - Provisión y alta directa de secretarias.
   */
  constructor(
    private readonly support: SupportStaffService,
    private readonly provisioning: SupportStaffProvisioningService,
  ) {}

  /** Sus secretarias, activas y pendientes. */
  @Get('me/practitioner/support-team')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Mi equipo de apoyo (secretarias)' })
  team(@CurrentUser() actor: AuthenticatedUser): Promise<SupportLinkListDto> {
    return this.support.practitionerTeam(actor);
  }

  /** Acepta a la secretaria que pidió asistirlo. */
  @Audited({
    action: 'SUPPORT_STAFF_ACCEPTED_BY_PRACTITIONER',
    entity: 'practitioner_support_assignment',
    entityId: 'param:id',
  })
  @Post('practitioner-delegates/:id/accept')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar a una secretaria' })
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.support.acceptForPractitioner(id, actor);
  }

  /** Rechaza a la secretaria que pidió asistirlo. */
  @Audited({
    action: 'SUPPORT_STAFF_REJECTED_BY_PRACTITIONER',
    entity: 'practitioner_support_assignment',
    entityId: 'param:id',
  })
  @Post('practitioner-delegates/:id/reject')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar a una secretaria' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: SupportLinkReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.support.rejectForPractitioner(id, actor);
  }

  /** Termina el vínculo con una secretaria suya. */
  @Audited({
    action: 'SUPPORT_STAFF_ENDED_BY_PRACTITIONER',
    entity: 'practitioner_support_assignment',
    entityId: 'param:id',
  })
  @Post('me/practitioner/support-team/:id/end')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar el vínculo con una secretaria' })
  end(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: SupportLinkReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.support.endForPractitioner(id, actor);
  }

  /** Invita a una secretaria registrada (por su documento) a asistirlo. */
  @Audited({
    action: 'SUPPORT_STAFF_INVITED_BY_PRACTITIONER',
    entity: 'practitioner_support_assignment',
    entityId: 'result.id',
  })
  @Post('me/practitioner/support-invitations')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invitar a una secretaria a asistirme' })
  invite(
    @Body() dto: PractitionerInviteSupportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportLinksCreatedDto> {
    return this.support.inviteForPractitioner(dto, actor);
  }

  /** Crea la cuenta de una secretaria y la vincula de inmediato con estado ACTIVE. */
  @Audited({
    action: 'SUPPORT_STAFF_PROVISIONED_BY_PRACTITIONER',
    entity: 'practitioner_support_assignment',
    entityId: 'result.linkId',
  })
  @Post('me/practitioner/support-staff')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear cuenta de secretaria y vincularla de inmediato',
  })
  createSecretary(
    @Body() dto: CreatePractitionerSupportStaffDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Ip() ip: string,
  ): Promise<CreatedSupportStaffViewDto> {
    return this.provisioning.provisionForPractitioner(dto, actor, ip);
  }
}
