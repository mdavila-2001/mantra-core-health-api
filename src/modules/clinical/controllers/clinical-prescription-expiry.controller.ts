import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
import {
  PrescriptionExpirySweepDto,
  PrescriptionExpirySweepResultDto,
} from '../dto';
import { PrescriptionExpiryNoticesService } from '../services';

/**
 * Disparador del aviso de receta por vencer (PAC-REC-002), pensado para el worker.
 *
 * Va bajo `/clinical/internal` y exige `SYSTEM`: recorre un lote de recetas de todas las
 * organizaciones y emite avisos sin un actor humano detrás. Es idempotente: reejecutarlo no repite
 * un aviso ya pedido.
 */
@ApiTags('clinical-prescription-expiry')
@ApiBearerAuth()
@Roles('SYSTEM', 'SYSTEM_WORKER')
@Controller('clinical/internal')
export class ClinicalPrescriptionExpiryController {
  /**
   * @param service - Barrido de avisos de vencimiento.
   */
  constructor(private readonly service: PrescriptionExpiryNoticesService) {}

  /** Avisa a los pacientes cuyas recetas vencen en los próximos días. */
  @Audited({
    action: 'PRESCRIPTION_EXPIRY_NOTICES_SWEPT',
    entity: 'medication_request',
  })
  @Post('prescription-expiry-notices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Avisar al paciente de las recetas por vencer (barrido)',
    description:
      'Recetas emitidas cuyo `valid_to` cae en los próximos 3 días y que todavía no tienen aviso. Un aviso por receta, por la bandeja in-app.',
  })
  @ApiOkResponse({ type: PrescriptionExpirySweepResultDto })
  sweep(
    @Body() dto: PrescriptionExpirySweepDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrescriptionExpirySweepResultDto> {
    return this.service.sweep(actor, dto.limit);
  }
}
