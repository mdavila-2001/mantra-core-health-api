import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import {
  PendingApprovalsPageDto,
  PendingApprovalsQueryDto,
  PractitionerGovernancePanelDto,
} from '../dto';
import { PractitionerGovernanceService } from '../services/practitioner-governance.service';

/**
 * Lo que espera al doctor en «Mi equipo»: el panel de «Para su atención» y las
 * aprobaciones que le tocan decidir. Solo lecturas.
 *
 * Sin tenant activo: un doctor atiende en varios hospitales y su equipo es de
 * todos. Cada consulta se limita a **su** equipo (`practitionerProfileId` del
 * token); sin perfil profesional la respuesta es vacía, no un error.
 */
@ApiTags('delegated-access-governance')
@ApiBearerAuth()
@Controller()
export class PractitionerGovernanceController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param governance - Lecturas del gobierno de accesos del doctor.
   */
  constructor(private readonly governance: PractitionerGovernanceService) {}

  /** Revisiones y alertas que esperan al doctor. */
  @Get('me/practitioner/governance-panel')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Panel «Para su atención» del doctor' })
  @ApiOkResponse({ type: PractitionerGovernancePanelDto })
  panel(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerGovernancePanelDto> {
    return this.governance.panel(actor);
  }

  /** Aprobaciones de cuatro ojos que el doctor puede decidir. */
  @Get('approvals/pending')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Aprobaciones que espera mi decisión' })
  @ApiOkResponse({ type: PendingApprovalsPageDto })
  pending(
    @Query() q: PendingApprovalsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PendingApprovalsPageDto> {
    return this.governance.pendingApprovals(actor, q);
  }
}
