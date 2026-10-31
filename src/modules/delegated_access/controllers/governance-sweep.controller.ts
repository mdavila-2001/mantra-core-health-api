import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { GovernanceSweepService, type SweepResult } from '../services';
import { GovernanceSweepResultDto } from '../dto';

/**
 * Barridos del gobierno de accesos que dispara el programador externo (sin
 * cron propio): el diario a las 02:30 hora de La Paz y el de anomalías cada
 * hora al minuto 17. Idempotentes, acotados y por organización.
 */
@ApiTags('delegated-access-support-maintenance')
@ApiBearerAuth()
@Controller('delegated-access/support')
export class GovernanceSweepController {
  /**
   * @param sweep - Barridos.
   */
  constructor(private readonly sweep: GovernanceSweepService) {}

  /** Barrido diario: vencimientos, campañas, recertificación, remediación y retención. */
  @Audited({
    action: 'SUPPORT_GOVERNANCE_SWEPT',
    entity: 'access_review_campaign',
  })
  @Post('governance-sweep')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Barrido diario del gobierno de accesos' })
  @ApiOkResponse({ type: GovernanceSweepResultDto })
  governanceSweep(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SweepResult> {
    return this.sweep.runDaily(actor);
  }

  /** Barrido horario de anomalías de actividad. */
  @Audited({
    action: 'SUPPORT_ANOMALIES_SCANNED',
    entity: 'access_anomaly',
  })
  @Post('anomaly-scan')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Barrido horario de anomalías de actividad' })
  @ApiOkResponse({ type: GovernanceSweepResultDto })
  anomalyScan(): Promise<SweepResult> {
    return this.sweep.runAnomalyScan();
  }
}
