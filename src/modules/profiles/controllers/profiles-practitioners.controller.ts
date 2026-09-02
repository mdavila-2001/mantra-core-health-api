import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Put,
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
import { LinkableOrganizationsService } from '../services/linkable-organizations.service';
import {
  CreatePractitionerDto,
  PractitionerResponseDto,
  CreateJurisdictionAuthorizationDto,
  JurisdictionAuthorizationResponseDto,
  VerifyCredentialDto,
  CredentialResponseDto,
  AddSpecialtyDto,
  AddOwnCredentialDto,
  OwnCredentialResponseDto,
  SpecialtyResponseDto,
  CreateAffiliationDto,
  AffiliationResponseDto,
  ListAffiliationsResponseDto,
  PractitionerProfileSummaryDto,
  UpdateOwnPractitionerProfileDto,
  ListPractitionersResponseDto,
  SetPractitionerPhotoDto,
  PractitionerOnboardingDto,
  ListLinkableOrganizationsResponseDto,
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
   * @param linkableOrganizations - Buscador del padrón de establecimientos.
   */
  constructor(
    private readonly practitionersService: ProfilesPractitionersService,
    private readonly linkableOrganizations: LinkableOrganizationsService,
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
   * En qué punto del alta está el profesional de la sesión.
   *
   * Va **antes** de cualquier `practitioners/:profileId` por lo mismo que
   * `me/summary`: Nest resuelve por orden de declaración y un parámetro
   * capturaría `me`.
   *
   * Sin `@Roles`: el filtro real es tener perfil profesional, que es un dato de
   * la cuenta y no un rol. Si no lo tiene, el servicio lo dice con un 422.
   *
   * @param actor - Usuario autenticado.
   * @returns Las cinco etapas del alta y la primera incompleta.
   */
  @Get('practitioners/me/onboarding')
  @ApiOperation({
    summary: 'Qué le falta al profesional para completar su alta',
    description:
      'El paso se DERIVA de los datos que ya existen (matrícula, especialidad, ' +
      'foto, afiliación o agenda propia): no hay columna de progreso, así que ' +
      'retomar sale gratis y los perfiles anteriores aparecen completos sin migrar.',
  })
  getOwnOnboarding(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerOnboardingDto> {
    return this.practitionersService.getOwnOnboarding(actor);
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

  /**
   * Fijar la foto del perfil profesional.
   *
   * Va con `:profileId` y no con `me` a propósito: la misma ruta sirve al
   * titular y a la plataforma, y quién puede lo decide
   * `ProfileOwnershipService` —titular o rol de plataforma— en vez de
   * duplicarse en dos superficies que después divergen. Con `me` la intención
   * de un administrador que arregla la ficha de otro no quedaría escrita en
   * ningún lado.
   *
   * `PUT` porque el resultado no depende de cuántas veces se pida: el perfil
   * queda con esa foto.
   *
   * @param profileId - El perfil cuya foto se fija.
   * @param dto - El archivo ya subido que pasa a ser la foto.
   * @param actor - Quien pide la operación.
   * @returns El perfil releído, ya con su foto.
   */
  @Put('practitioners/:profileId/photo')
  @ApiOperation({ summary: 'Fijar la foto del perfil profesional' })
  setPractitionerPhoto(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: SetPractitionerPhotoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerProfileSummaryDto> {
    return this.practitionersService.setPractitionerPhoto(
      profileId,
      dto,
      actor,
    );
  }

  /**
   * Quitar la foto del perfil profesional.
   *
   * Quita la referencia; el archivo no se toca. Quien quiera borrar el archivo
   * del almacenamiento tiene el camino de `common/files`, que lleva su propio
   * borrado lógico.
   *
   * @param profileId - El perfil cuya foto se quita.
   * @param actor - Quien pide la operación.
   * @returns El perfil releído, ya sin foto.
   */
  @Delete('practitioners/:profileId/photo')
  @ApiOperation({ summary: 'Quitar la foto del perfil profesional' })
  removePractitionerPhoto(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerProfileSummaryDto> {
    return this.practitionersService.removePractitionerPhoto(profileId, actor);
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
   * El buscador de instituciones para declarar dónde se trabaja.
   *
   * ## Por qué vive en el perfil y no en un módulo propio
   *
   * Es el paso previo de `POST practitioners/me/affiliations`, y el profesional
   * declara dónde trabaja desde su perfil, no entrando por cada organización.
   * Dejarlo acá mantiene el circuito entero en una sola superficie.
   *
   * ## Sin `@Roles`, igual que el resto del historial laboral
   *
   * Devuelve el padrón oficial de establecimientos: un catálogo público, sin
   * `tenant_id` y sin PHI. Exigir un rol lo cerraría para el profesional que
   * todavía no lo tiene, que es justo quien está completando su perfil.
   *
   * @param q - Texto a buscar en el nombre del establecimiento.
   * @param municipality - Municipio exacto; separa los homónimos del padrón.
   * @param limit - Tope de resultados (por defecto 20).
   * @returns Los establecimientos que coinciden.
   */
  @Get('practitioners/me/linkable-organizations')
  @ApiOperation({
    summary: 'Buscar instituciones del padrón para declarar una afiliación',
    description:
      'El padrón cubre sólo Santa Cruz: fuera de ahí, el alta admite el nombre escrito a mano.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Texto del nombre' })
  @ApiQuery({
    name: 'municipality',
    required: false,
    description: 'Municipio exacto; distingue establecimientos homónimos',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope de resultados (por defecto 20)',
  })
  searchLinkableOrganizations(
    @Query('q') q?: string,
    @Query('municipality') municipality?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListLinkableOrganizationsResponseDto> {
    return this.linkableOrganizations.buscar({ query: q, municipality, limit });
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

  /**
   * Los títulos propios, uno por llamada.
   *
   * Va bajo `practitioners/me` y no bajo `practitioners/:profileId` porque el
   * sujeto sale de la sesión: así no existe la forma de escribir la formación
   * de otro profesional, ni siquiera equivocándose de id.
   */
  @Post('practitioners/me/credentials')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar un título propio (diplomado, maestría, doctorado…)',
    description:
      'Cada llamada agrega uno: el registro de procesos pide poder cargar varios de cada clase. Nace pendiente de verificación y admite el PDF o la foto del diploma, ya subido por POST /common/files/upload.',
  })
  addOwnCredential(
    @Body() dto: AddOwnCredentialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnCredentialResponseDto> {
    return this.practitionersService.addOwnCredential(dto, actor);
  }

  /**
   * Un consultorio de OTRO profesional — las fichas de directorio.
   *
   * Los profesionales que publican las redes de las aseguradoras no tienen
   * cuenta —no traen correo— y por eso no pueden declarar dónde atienden. Sin
   * esta ruta, un médico con tres consultorios se veía sin ninguno.
   *
   * Pide rol administrativo: escribir el historial laboral de alguien que no
   * está mirando es otra cosa que escribir el propio.
   */
  @Post('practitioners/:profileId/affiliations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un consultorio de un profesional sin cuenta',
    description:
      'Mismas reglas que el alta propia: no repite un vínculo ya declarado y respeta el estado inicial según la sede.',
  })
  addAffiliationFor(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: CreateAffiliationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    return this.practitionersService.addAffiliationFor(profileId, dto, actor);
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
