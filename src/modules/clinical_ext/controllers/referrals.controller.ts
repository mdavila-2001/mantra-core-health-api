import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ReferralsService } from '../services';
import {
  CreateReferralDto,
  RespondReferralDto,
  ReferralResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints de referencias clínicas (`/referrals`): emisión (UC-18-07) y respuesta
 * del tenant destino (UC-18-08). Capa fina sobre `ReferralsService`.
 */
@ApiTags('clinical-ext-referrals')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('referrals')
export class ReferralsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param referralsService - Valor de referrals service requerido por la operación.
   */
  constructor(private readonly referralsService: ReferralsService) {}

  /** UC-18-07. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir una referencia desde un encuentro' })
  create(
    @Body() dto: CreateReferralDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    return this.referralsService.create(dto, actor);
  }

  /** UC-18-08. */
  @Patch(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Responder / aceptar una referencia inter-tenant' })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondReferralDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.referralsService.respond(id, dto, actor);
  }
}
