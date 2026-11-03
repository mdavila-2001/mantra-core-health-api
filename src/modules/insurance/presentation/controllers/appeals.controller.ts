import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { AppealsService } from '../../application/services';
import { CreateAppealDecisionDto, CreatedResourceDto } from '../dto';

/**
 * Decisiones de apelación sobre disputas (UC-26-12). Capa fina que delega en
 * `AppealsService`.
 */
@ApiTags('insurance-appeals')
@ApiBearerAuth()
@Roles('BILLING', 'FINANCE')
@Controller('claim-disputes')
export class AppealsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: AppealsService) {}

  /** UC-26-12. */
  @Audited({
    action: 'CLAIM_APPEAL_DECIDED',
    entity: 'claim_appeal_decision',
    entityId: 'result.id',
  })
  @Post(':id/appeal-decisions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir decisión de apelación (inmutable)' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAppealDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.decide(id, dto, actor);
  }
}
