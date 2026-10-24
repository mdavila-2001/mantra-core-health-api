import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessLogged, Roles } from '../../../common';
import { ConsentCollectionsService } from '../services';
import {
  ConsentPageDto,
  HipaaAuthorizationPageDto,
  ListConsentsQueryDto,
  ListHipaaAuthorizationsQueryDto,
  ListPatientObjectionsQueryDto,
  ListPrivacyRestrictionsQueryDto,
  ListProcessingLegalBasesQueryDto,
  ListTreatmentInformedConsentsQueryDto,
  PatientObjectionPageDto,
  PrivacyRestrictionPageDto,
  ProcessingLegalBasisPageDto,
  TreatmentInformedConsentPageDto,
} from '../dto';

/**
 * `GET` de colección de `consent` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('consent-collections')
@ApiBearerAuth()
@Controller()
export class ConsentCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: ConsentCollectionsService) {}

  /** V07-01: listar los consentimientos del tenant. */
  @Get('consent/consents')
  @Roles('SECURITY_ADMIN')
  @AccessLogged({ resourceType: 'CONSENTS' })
  @ApiOperation({ summary: 'Listar los consentimientos del tenant' })
  @ApiOkResponse({ type: ConsentPageDto })
  listConsents(@Query() query: ListConsentsQueryDto): Promise<ConsentPageDto> {
    return this.collections.listConsents(query);
  }

  /** V07-03: listar las autorizaciones hipaa del tenant. */
  @Get('consent/hipaa-authorizations')
  @Roles('SECURITY_ADMIN')
  @AccessLogged({ resourceType: 'HIPAA_AUTHORIZATIONS' })
  @ApiOperation({ summary: 'Listar las autorizaciones HIPAA del tenant' })
  @ApiOkResponse({ type: HipaaAuthorizationPageDto })
  listHipaaAuthorizations(
    @Query() query: ListHipaaAuthorizationsQueryDto,
  ): Promise<HipaaAuthorizationPageDto> {
    return this.collections.listHipaaAuthorizations(query);
  }

  /** V07-04: listar las objeciones de paciente del tenant. */
  @Get('consent/patient-objections')
  @Roles('SECURITY_ADMIN')
  @AccessLogged({ resourceType: 'PATIENT_OBJECTIONS' })
  @ApiOperation({ summary: 'Listar las objeciones de paciente del tenant' })
  @ApiOkResponse({ type: PatientObjectionPageDto })
  listPatientObjections(
    @Query() query: ListPatientObjectionsQueryDto,
  ): Promise<PatientObjectionPageDto> {
    return this.collections.listPatientObjections(query);
  }

  /** V07-06: listar las restricciones de privacidad del tenant. */
  @Get('consent/privacy-restrictions')
  @Roles('SECURITY_ADMIN')
  @AccessLogged({ resourceType: 'PRIVACY_RESTRICTIONS' })
  @ApiOperation({
    summary: 'Listar las restricciones de privacidad del tenant',
  })
  @ApiOkResponse({ type: PrivacyRestrictionPageDto })
  listPrivacyRestrictions(
    @Query() query: ListPrivacyRestrictionsQueryDto,
  ): Promise<PrivacyRestrictionPageDto> {
    return this.collections.listPrivacyRestrictions(query);
  }

  /** V07-07: listar las bases legales de tratamiento del tenant. */
  @Get('consent/processing-legal-bases')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las bases legales de tratamiento del tenant',
  })
  @ApiOkResponse({ type: ProcessingLegalBasisPageDto })
  listProcessingLegalBases(
    @Query() query: ListProcessingLegalBasesQueryDto,
  ): Promise<ProcessingLegalBasisPageDto> {
    return this.collections.listProcessingLegalBases(query);
  }

  /** V07-08: listar los consentimientos informados de tratamiento del tenant. */
  @Get('consent/treatment-informed-consents')
  @Roles('SECURITY_ADMIN')
  @AccessLogged({ resourceType: 'TREATMENT_INFORMED_CONSENTS' })
  @ApiOperation({
    summary: 'Listar los consentimientos informados de tratamiento del tenant',
  })
  @ApiOkResponse({ type: TreatmentInformedConsentPageDto })
  listTreatmentInformedConsents(
    @Query() query: ListTreatmentInformedConsentsQueryDto,
  ): Promise<TreatmentInformedConsentPageDto> {
    return this.collections.listTreatmentInformedConsents(query);
  }
}
