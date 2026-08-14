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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ProfilesPractitionersService } from '../services';
import {
  CreatePractitionerDto,
  PractitionerResponseDto,
  CreateJurisdictionAuthorizationDto,
  JurisdictionAuthorizationResponseDto,
  VerifyCredentialDto,
  CredentialResponseDto,
  AddSpecialtyDto,
  SpecialtyResponseDto,
  CreateAffiliationDto,
  AffiliationResponseDto,
  ListAffiliationsResponseDto,
} from '../dto';

/**
 * Endpoints de la fuerza laboral de salud (profesionales y credenciales). Capa
 * fina que delega en `ProfilesPractitionersService`; exige rol `SECURITY_ADMIN`.
 */
@ApiTags('profiles-practitioners')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesPractitionersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param practitionersService - Valor de practitioners service requerido por la operación.
   */
  constructor(
    private readonly practitionersService: ProfilesPractitionersService,
  ) {}

  /** UC-05-03. */
  @Post('practitioners')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Alta de profesional de salud (workforce generalista)',
  })
  onboardPractitioner(
    @Body() dto: CreatePractitionerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerResponseDto> {
    return this.practitionersService.onboardPractitioner(dto, actor);
  }

  /** UC-05-04. */
  @Post('practitioners/:profileId/jurisdiction-authorizations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar/renovar autorización jurisdiccional (licencia)',
  })
  addJurisdictionAuthorization(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: CreateJurisdictionAuthorizationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JurisdictionAuthorizationResponseDto> {
    return this.practitionersService.addJurisdictionAuthorization(
      profileId,
      dto,
      actor,
    );
  }

  /**
   * UC-05-16·L: el historial laboral propio.
   *
   * Va antes que las rutas con `:profileId` a propósito: `me` no es un uuid y
   * `ParseUUIDPipe` lo rechazaría, pero el orden de declaración es lo que
   * garantiza que ni siquiera llegue a intentarlo.
   */
  @Get('practitioners/me/affiliations')
  @ApiOperation({
    summary: 'Historial laboral propio (instituciones donde trabajó)',
  })
  listOwnAffiliations(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListAffiliationsResponseDto> {
    return this.practitionersService.listOwnAffiliations(actor);
  }

  /** UC-05-16. */
  @Post('practitioners/me/affiliations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una afiliación institucional en el historial propio',
    description:
      'El sujeto sale de la sesión: no hay forma de escribir el historial de otro.',
  })
  addOwnAffiliation(
    @Body() dto: CreateAffiliationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    return this.practitionersService.addOwnAffiliation(dto, actor);
  }

  /** UC-05-06. */
  @Post('practitioners/:profileId/specialties')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar especialidad con credencial de soporte' })
  addSpecialty(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: AddSpecialtyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SpecialtyResponseDto> {
    return this.practitionersService.addSpecialty(profileId, dto, actor);
  }

  /** UC-05-05. */
  @Post('credentials/:credentialId/verify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar credencial profesional' })
  verifyCredential(
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
    @Body() dto: VerifyCredentialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CredentialResponseDto> {
    return this.practitionersService.verifyCredential(credentialId, dto, actor);
  }
}
