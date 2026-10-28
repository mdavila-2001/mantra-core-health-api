import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { TreatmentInformedConsentsService } from '../services';
import {
  ConsentEvidenceResponseDto,
  CreateTreatmentInformedConsentDto,
  ListTreatmentInformedConsentsQueryDto,
  PostEmergencyInformationDto,
  RecordTreatmentConsentEvidenceDto,
  TreatmentInformedConsentListDto,
  TreatmentInformedConsentResponseDto,
  WithdrawTreatmentInformedConsentDto,
} from '../dto';

/**
 * Endpoints sobre `/consent/treatment-informed-consents`.
 *
 * v4266: consentimiento **dirigido** (receta, orden, derivación, procedimiento,
 * plan de cuidados), con lectura, revocación, evidencia de firma y cierre de
 * la excepción de emergencia. `SECURITY_ADMIN` conserva su camino de alta; el
 * profesional entra con el paciente y el tenant del encuentro y la
 * autorización de escritura sobre la historia (mismo criterio que CL-77).
 */
@ApiTags('consent-treatment-informed-consents')
@ApiBearerAuth()
@Controller('consent/treatment-informed-consents')
export class TreatmentInformedConsentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param treatmentService - Valor de treatment service requerido por la operación.
   */
  constructor(
    private readonly treatmentService: TreatmentInformedConsentsService,
  ) {}

  /** UC-07-08. */
  @Audited({
    action: 'TREATMENT_INFORMED_CONSENT_SIGNED',
    entity: 'treatment_informed_consent',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN', 'CLINICIAN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Capturar consentimiento informado de tratamiento' })
  sign(
    @Body() dto: CreateTreatmentInformedConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    return this.treatmentService.create(dto, actor);
  }

  /** v4266: consentimientos de un paciente, opcionalmente por objeto. */
  @Get()
  @Roles('CLINICIAN', 'PRACTITIONER')
  @AccessLogged({ resourceType: 'TREATMENT_INFORMED_CONSENTS' })
  @ApiOperation({ summary: 'Listar consentimientos informados de tratamiento' })
  list(
    @Query() query: ListTreatmentInformedConsentsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentListDto> {
    return this.treatmentService.list(query, actor);
  }

  /** v4266: un consentimiento por id. */
  @Get(':id')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @AccessLogged({
    resourceType: 'TREATMENT_INFORMED_CONSENTS',
    resourceId: 'param:id',
  })
  @ApiOperation({ summary: 'Leer un consentimiento informado de tratamiento' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    return this.treatmentService.get(id, actor);
  }

  /** v4266: revocación (409 si ya estaba revocado). */
  @Audited({
    action: 'TREATMENT_INFORMED_CONSENT_WITHDRAWN',
    entity: 'treatment_informed_consent',
    entityId: 'param:id',
  })
  @Patch(':id/withdraw')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar un consentimiento informado de tratamiento',
  })
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawTreatmentInformedConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    return this.treatmentService.withdraw(id, dto, actor);
  }

  /** Enmienda 1: cierre de la excepción EMERGENCY. */
  @Audited({
    action: 'TREATMENT_INFORMED_CONSENT_POST_EMERGENCY_INFORMED',
    entity: 'treatment_informed_consent',
    entityId: 'param:id',
  })
  @Patch(':id/post-emergency-information')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar la información posterior a una emergencia',
  })
  postEmergencyInformation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostEmergencyInformationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    return this.treatmentService.recordPostEmergencyInformation(id, dto, actor);
  }

  /**
   * Enmienda 1: evidencia (firma, documento) del consentimiento, registrada con
   * el servicio de evidencia existente (`consent.consent_evidence`).
   */
  @Audited({
    action: 'CONSENT_EVIDENCE_RECORDED',
    entity: 'consent_evidence',
    entityId: 'result.id',
  })
  @Post(':id/evidence')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adjuntar evidencia de firma al consentimiento de tratamiento',
  })
  recordEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordTreatmentConsentEvidenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConsentEvidenceResponseDto> {
    return this.treatmentService.recordEvidence(id, dto, actor);
  }
}
