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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
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
  ListPractitionersResponseDto,
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
   * La guía de profesionales (carril R2-1).
   *
   * **Sin `@Roles`, siguiendo el criterio del propio módulo**: son datos
   * profesionales de presentación —lo que una guía médica publica—, no PHI, y
   * es el menú del PACIENTE el que la muestra. Exigir un rol dejaría la guía
   * exactamente para quienes no la necesitan.
   *
   * @param specialtyConceptId - Sólo quienes ejercen esta especialidad hoy.
   * @param cursor - Continuación de la página anterior.
   * @param limit - Tope de filas (por defecto 50).
   * @returns Página de la guía.
   */
  @Get('practitioners')
  @ApiOperation({
    summary: 'Listar profesionales para la guía, con sus especialidades',
  })
  @ApiQuery({
    name: 'specialtyConceptId',
    required: false,
    description: 'Filtra por especialidad vigente (concept id)',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope de resultados (por defecto 50)',
  })
  listPractitioners(
    @Query('specialtyConceptId', new ParseUUIDPipe({ optional: true }))
    specialtyConceptId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListPractitionersResponseDto> {
    return this.practitionersService.listPractitioners({
      specialtyConceptId,
      cursor,
      limit: limit ?? 50,
    });
  }

  /**
   * El perfil de un colega — la ficha que abre la guía (R2-1).
   *
   * Mismo shape que `me/summary`: mismo contrato, cambia de dónde sale el
   * sujeto. Sin `@Roles` por lo mismo que el listado. Va declarado DESPUÉS de
   * las rutas `practitioners/me/*`: Nest resuelve por orden de declaración y
   * el parámetro capturaría `me` (el pipe lo respondería 400).
   *
   * @param profileId - El profesional consultado.
   * @returns Su perfil completo de presentación.
   */
  @Get('practitioners/:profileId/summary')
  @ApiOperation({
    summary: 'Consultar el perfil profesional de un colega (ficha de la guía)',
  })
  getPractitionerSummary(
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ): Promise<PractitionerProfileSummaryDto> {
    return this.practitionersService.getPractitionerSummary(profileId);
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
