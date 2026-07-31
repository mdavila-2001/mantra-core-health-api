import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  RequiresVerifiedIdentity,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { ProfilesPatientsService } from '../services';
import {
  CreatePatientDto,
  PatientProfileResponseDto,
  LinkAccountDto,
  AccountLinkResponseDto,
  AddIdentityLinkDto,
  IdentityLinkResponseDto,
  MergePatientsDto,
  ReverseMergeDto,
  MergeEventResponseDto,
  AddRelatedPersonDto,
  RelatedPersonResponseDto,
  GrantPortalProxyDto,
  PortalProxyResponseDto,
  DeceasePersonDto,
  DeceaseResponseDto,
  PatientSummaryResponseDto,
} from '../dto';

/**
 * Endpoints de personas y pacientes. Capa fina: valida parámetros y delega en el
 * servicio de dominio.
 *
 * Las operaciones de gobierno exigen rol `SECURITY_ADMIN`. La excepción es
 * `GET /profiles/patients/me/summary`, que el propio paciente consulta sobre sí
 * mismo y que, en su lugar, exige tener la identidad verificada.
 */
@ApiTags('profiles-patients')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesPatientsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param patientsService - Valor de patients service requerido por la operación.
   */
  constructor(private readonly patientsService: ProfilesPatientsService) {}

  /**
   * Resumen del propio paciente. Ejemplo de función que sólo se habilita con la
   * identidad verificada: sin aserción vigente el guard responde 403.
   */
  @Get('patients/me/summary')
  @RequiresVerifiedIdentity()
  @ApiOperation({
    summary: 'Consultar el resumen propio (requiere identidad verificada)',
  })
  getOwnSummary(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientSummaryResponseDto> {
    return this.patientsService.getOwnSummary(actor);
  }

  /** UC-05-01. */
  @Post('patients')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de persona y perfil de paciente' })
  registerPatient(
    @Body() dto: CreatePatientDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientProfileResponseDto> {
    return this.patientsService.registerPatient(dto, actor);
  }

  /** UC-05-02. */
  @Post('persons/:personId/account-links')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vincular cuenta de portal a una persona' })
  linkAccount(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Body() dto: LinkAccountDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccountLinkResponseDto> {
    return this.patientsService.linkAccount(personId, dto, actor);
  }

  /** UC-05-07. */
  @Post('patients/:profileId/identity-links')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vincular identidad externa de paciente (MPI)' })
  addIdentityLink(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: AddIdentityLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdentityLinkResponseDto> {
    return this.patientsService.addIdentityLink(profileId, dto, actor);
  }

  /** UC-05-08. */
  @Post('patients/merge')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Fusionar pacientes duplicados' })
  mergePatients(
    @Body() dto: MergePatientsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MergeEventResponseDto> {
    return this.patientsService.mergePatients(dto, actor);
  }

  /** UC-05-09. */
  @Post('patients/merge/:eventId/reverse')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Revertir una fusión de pacientes' })
  reverseMerge(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: ReverseMergeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MergeEventResponseDto> {
    return this.patientsService.reverseMerge(eventId, dto, actor);
  }

  /** UC-05-10. */
  @Post('patients/:profileId/related-persons')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar persona relacionada / contacto de emergencia',
  })
  addRelatedPerson(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: AddRelatedPersonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RelatedPersonResponseDto> {
    return this.patientsService.addRelatedPerson(profileId, dto, actor);
  }

  /** UC-05-11. */
  @Post('patients/:profileId/portal-proxies')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Otorgar proxy de portal a un representante' })
  grantPortalProxy(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: GrantPortalProxyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PortalProxyResponseDto> {
    return this.patientsService.grantPortalProxy(profileId, dto, actor);
  }

  /** UC-05-12. */
  @Post('persons/:personId/decease')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar defunción y anonimización de una persona',
  })
  decease(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Body() dto: DeceasePersonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeceaseResponseDto> {
    return this.patientsService.decease(personId, dto, actor);
  }
}
