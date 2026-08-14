import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
  PractitionerProfileSummaryDto,
  UpdateOwnPractitionerProfileDto,
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

  /**
   * El perfil profesional propio.
   *
   * **Sin `@Roles`, y no es un olvido.** Cualquier sesión autenticada puede
   * pedirlo, porque lo único que puede pedir es *el suyo*: el sujeto lo resuelve
   * el servidor desde el vínculo persona-cuenta y no hay parámetro que apunte a
   * otro. Exigir `SECURITY_ADMIN` acá dejaría a los profesionales sin poder ver
   * su propio perfil, que es exactamente para quienes existe.
   *
   * Tampoco lleva `@RequiresVerifiedIdentity`, a diferencia del resumen del
   * paciente: la verificación de identidad de un profesional es la de su
   * matrícula y **vive en este mismo perfil**. Exigirla para leerlo dejaría a
   * quien todavía no la completó sin la pantalla donde se entera de qué le
   * falta.
   *
   * Va declarado antes que cualquier `practitioners/:profileId`: Nest resuelve
   * las rutas por orden de declaración y un parámetro capturaría `me`.
   */
  @Get('practitioners/me/summary')
  @ApiOperation({
    summary: 'Consultar el perfil profesional propio (trayectoria y actividad)',
  })
  getOwnPractitionerProfile(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerProfileSummaryDto> {
    return this.practitionersService.getOwnPractitionerProfile(actor);
  }

  /**
   * Editar el propio perfil profesional.
   *
   * Sin `@Roles` por lo mismo que la lectura: el sujeto lo resuelve el servidor
   * desde la sesión y no hay parámetro que apunte a otro, así que lo único que
   * se puede editar es lo propio.
   *
   * Lo editable es la **presentación** —título, biografía, disponibilidad—: el
   * estado de verificación y el de práctica los mueve el trámite de la
   * matrícula, y dejarlos acá convertiría el perfil en una declaración jurada de
   * uno mismo.
   */
  @Patch('practitioners/me')
  @ApiOperation({
    summary: 'Editar la presentación del propio perfil profesional',
  })
  updateOwnPractitionerProfile(
    @Body() dto: UpdateOwnPractitionerProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerProfileSummaryDto> {
    return this.practitionersService.updateOwnPractitionerProfile(dto, actor);
  }

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
