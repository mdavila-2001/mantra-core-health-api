import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { ConsentEvidenceService } from '../services';
import { ConsentEvidenceResponseDto, CreateConsentEvidenceDto } from '../dto';

/** Endpoints sobre `/consent/consent-evidence`. */
@ApiTags('consent-evidence')
@ApiBearerAuth()
@Controller('consent/consent-evidence')
export class ConsentEvidenceController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param evidenceService - Valor de evidence service requerido por la operación.
   */
  constructor(private readonly evidenceService: ConsentEvidenceService) {}

  /** UC-07-10. */
  @Audited({
    action: 'CONSENT_EVIDENCE_RECORDED',
    entity: 'consent_evidence',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar evidencia inmutable de consentimiento' })
  record(
    @Body() dto: CreateConsentEvidenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConsentEvidenceResponseDto> {
    return this.evidenceService.record(dto, actor);
  }
}
