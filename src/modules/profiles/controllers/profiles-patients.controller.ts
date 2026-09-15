import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
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
  ListMergeEventsQueryDto,
  ListMergeEventsResponseDto,
  SearchPatientsQueryDto,
  AddRelatedPersonDto,
  RelatedPersonResponseDto,
  GrantPortalProxyDto,
  PortalProxyResponseDto,
  DeceasePersonDto,
  DeceaseResponseDto,
  PatientSummaryResponseDto,
  SearchPatientsResponseDto,
  PatientDetailResponseDto,
  OwnPatientProfileResponseDto,
  UpdateOwnPatientProfileDto,
  SetOwnPatientPhotoDto,
  CreateDependentDto,
  DependentSummaryDto,
} from '../dto';

/**
 * Endpoints de personas y pacientes. Capa fina: valida parámetros y delega en el
 * servicio de dominio.
 *
 * Las operaciones de gobierno exigen rol `SECURITY_ADMIN`. La excepción son las
 * rutas `patients/me/*`, que el propio paciente ejerce sobre sí mismo y para las
 * que basta con la sesión: lo único que le piden es ser el titular de la cuenta,
 * y el sujeto lo resuelve el servidor —no hay parámetro que apunte a otro—.
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
   * Resumen del propio paciente. No exige identidad verificada: verificarse es
   * un trámite aparte, y el titular ve desde el alta lo que él mismo declaró. La
   * verificación sólo decide si el resumen incluye el código de paciente, y eso
   * lo resuelve el servicio (`identityVerified` en la respuesta).
   *
   * @param actor - Usuario autenticado.
   * @returns Datos básicos del paciente.
   */
  @Get('patients/me/summary')
  @ApiOperation({ summary: 'Consultar el resumen propio' })
  getOwnSummary(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientSummaryResponseDto> {
    return this.patientsService.getOwnSummary(actor);
  }

  /**
   * Los propios datos de filiación, tal como los declaró el paciente.
   *
   * Es la lectura que faltaba para poder editarlos: el resumen devuelve el
   * nombre ya compuesto, y con eso un formulario no puede corregir un apellido.
   * Acá viajan sus partes, la fecha de nacimiento, el sexo al nacer, la
   * ocupación, el teléfono vigente y el municipio del domicilio.
   *
   * Sin `@Roles` por lo mismo que el resumen: el sujeto lo resuelve el servidor
   * desde la sesión y no hay parámetro que apunte a otro.
   *
   * @param actor - Usuario autenticado, que es también el sujeto.
   * @returns Sus datos de filiación.
   */
  @Get('patients/me')
  @ApiOperation({ summary: 'Consultar los propios datos de filiación' })
  @ApiOkResponse({
    type: OwnPatientProfileResponseDto,
    description:
      'Lo que el paciente declaró al registrarse. Los campos que no declaró llegan ausentes, no `null`.',
  })
  getOwnProfile(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPatientProfileResponseDto> {
    return this.patientsService.getOwnProfile(actor);
  }

  /**
   * Editar los propios datos de filiación.
   *
   * Sin `@Roles` por lo mismo que la lectura. Lo editable es lo que la persona
   * **declara** sobre sí misma; el documento de identidad, el correo, la
   * contraseña, el código de paciente y los estados quedan fuera porque tienen
   * su propio circuito.
   *
   * @param dto - Los campos a cambiar; lo que no viene no se toca.
   * @param actor - Usuario autenticado, que es también el sujeto.
   * @returns El perfil releído, ya actualizado.
   */
  @Patch('patients/me')
  @ApiOperation({ summary: 'Editar los propios datos de filiación' })
  @ApiOkResponse({
    type: OwnPatientProfileResponseDto,
    description:
      'El perfil releído. Un cuerpo vacío es válido y devuelve el perfil sin cambios.',
  })
  updateOwnProfile(
    @Body() dto: UpdateOwnPatientProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPatientProfileResponseDto> {
    return this.patientsService.updateOwnProfile(dto, actor);
  }

  /**
   * Fijar la foto de perfil propia.
   *
   * Sin `@Roles` por lo mismo que el resto de `patients/me/*`: el sujeto lo
   * resuelve el servidor desde la sesión y no hay parámetro que apunte a otro.
   *
   * `PUT` porque el resultado no depende de cuántas veces se pida: la persona
   * queda con esa foto.
   *
   * @param dto - El archivo ya subido que pasa a ser la foto.
   * @param actor - Usuario autenticado, que es también el sujeto.
   * @returns El perfil releído, ya con su foto.
   */
  @Put('patients/me/photo')
  @ApiOperation({ summary: 'Fijar la propia foto de perfil' })
  setOwnPhoto(
    @Body() dto: SetOwnPatientPhotoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPatientProfileResponseDto> {
    return this.patientsService.setOwnPhoto(dto, actor);
  }

  /**
   * Quitar la foto de perfil propia.
   *
   * Quita la referencia; el archivo no se toca. Idempotente.
   *
   * @param actor - Usuario autenticado, que es también el sujeto.
   * @returns El perfil releído, ya sin foto.
   */
  @Delete('patients/me/photo')
  @ApiOperation({ summary: 'Quitar la propia foto de perfil' })
  removeOwnPhoto(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPatientProfileResponseDto> {
    return this.patientsService.removeOwnPhoto(actor);
  }

  /**
   * Los dependientes del titular: a quiénes puede representar en el portal.
   *
   * Sin `@Roles` por lo mismo que el resto de `patients/me/*`: el sujeto lo
   * resuelve el servidor desde la sesión y no hay parámetro que apunte a otro.
   *
   * @param actor - Usuario autenticado, que es quien representa.
   * @returns Sus dependientes; un arreglo vacío si no tiene ninguno.
   */
  @Get('patients/me/dependents')
  @ApiOperation({
    summary: 'Listar los dependientes a cargo del paciente autenticado',
  })
  @ApiOkResponse({
    type: [DependentSummaryDto],
    description:
      'Los pacientes que esta cuenta representa con apoderamiento vigente. Sin dependientes, `[]`.',
  })
  getOwnDependents(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DependentSummaryDto[]> {
    return this.patientsService.getOwnDependents(actor);
  }

  /**
   * Registrar a un dependiente: un menor o un adulto mayor a cargo.
   *
   * Crea su persona y su perfil de paciente, y deja al titular como su
   * representante. **No crea una cuenta**: el dependiente no inicia sesión, que
   * es justamente el caso.
   *
   * @param dto - Datos de filiación y parentesco declarado.
   * @param actor - Usuario autenticado, que pasa a representarlo.
   * @returns El dependiente recién creado.
   */
  @Post('patients/me/dependents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un dependiente (menor o adulto mayor tutelado)',
  })
  @ApiCreatedResponse({
    type: DependentSummaryDto,
    description:
      'El dependiente creado, ya con el apoderamiento que habilita a pedirle turno y a leer su historia.',
  })
  registerOwnDependent(
    @Body() dto: CreateDependentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DependentSummaryDto> {
    return this.patientsService.registerOwnDependent(dto, actor);
  }

  /**
   * UC-05-13: listado de pacientes.
   *
   * Va declarado **después** de `patients/me/summary` a propósito: Nest resuelve
   * las rutas por orden de declaración y `patients/:profileId` capturaría
   * `patients/me` si fuera antes.
   *
   * ## Quién puede buscar, y qué ve (TAREA-07, P-07-10 — 2026-09-02)
   *
   * Hasta acá el listado era exclusivo de `SECURITY_ADMIN`, con esta nota:
   * «la lista de todas las historias de una organización es exactamente el
   * dato que no debe existir como pantalla». El propietario pidió que quien
   * atiende (`CLINICIAN`, `PRACTITIONER`) también pueda buscar. Una primera
   * versión acotó ese acceso a la gente con actividad en su organización;
   * se revirtió el mismo día porque la búsqueda no es sólo para consultar a
   * quien ya se atendió — es para **registrar** a quien nunca se atendió, y
   * acotar por actividad le impide precisamente eso. Hoy los cuatro roles
   * ven el **mismo padrón sin acotar** (`resolvePatientSearchScope()`, en
   * `patient-search-scope.ts`).
   *
   * Lo que reemplaza al acotamiento: `CLINICIAN`/`PRACTITIONER` deben aportar
   * `q` o `nationalId` — sin ninguno de los dos, `422`
   * (`requiereCriterioDeBusqueda()`); sin este freno, listar sin criterio
   * sería enumerar el padrón, no buscar. `SECURITY_ADMIN`/`SUPERADMIN` siguen
   * listando libremente. Encontrar a alguien acá **no** abre su expediente
   * clínico: esa puerta la decide `ClinicalReadService` aparte (turno
   * confirmado hoy o relación asistencial aceptada vigente).
   *
   * @param query - Texto libre sobre código de paciente y nombre.
   * @param nationalId - Documento de identidad exacto (AC-07-1).
   * @param issuerAdministrativeAreaConceptId - Departamento que lo expidió,
   *   para desempatar un mismo número en dos departamentos (AC-07-2).
   * @param cursor - Cursor opaco de la página anterior.
   * @param limit - Tope de filas (por defecto 50).
   * @param actor - Quien pregunta; decide el alcance de la búsqueda.
   * @returns Página de pacientes.
   */
  @Get('patients')
  @Roles('SECURITY_ADMIN', 'SUPERADMIN', 'CLINICIAN', 'PRACTITIONER')
  @ApiOperation({ summary: 'UC-05-13: listado paginado de pacientes' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en el código de paciente o el nombre',
  })
  @ApiQuery({
    name: 'nationalId',
    required: false,
    description: 'Documento de identidad exacto (`common.identifiers.value`)',
  })
  @ApiQuery({
    name: 'issuerAdministrativeAreaConceptId',
    required: false,
    description:
      'Departamento que expidió el documento (VS_BO_DEPARTMENT); sólo tiene efecto junto a nationalId',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope de resultados (por defecto 50)',
  })
  searchPatients(
    @Query() query: SearchPatientsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SearchPatientsResponseDto> {
    return this.patientsService.searchPatients(
      {
        query: query.q,
        nationalId: query.nationalId,
        issuerAdministrativeAreaConceptId:
          query.issuerAdministrativeAreaConceptId,
        cursor: query.cursor,
        limit: query.limit ?? 50,
      },
      actor,
    );
  }

  /**
   * UC-05-09·L. Va **antes** que `patients/:profileId` en el archivo por lo de
   * siempre con las rutas de Nest: se resuelven por orden de declaración, y
   * `merge-events` encajaría en el parámetro y devolvería un 400 por uuid mal
   * formado en vez de la lista.
   */
  @Get('patients/merge-events')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar eventos de fusión de pacientes',
    description:
      'Devuelve el `id` que exige POST /profiles/patients/merge/{eventId}/reverse. Sin esta lectura, una fusión sólo era reversible mientras la respuesta del POST siguiera a la vista.',
  })
  listMergeEvents(
    @Query() query: ListMergeEventsQueryDto,
  ): Promise<ListMergeEventsResponseDto> {
    return this.patientsService.listMergeEvents(query);
  }

  /**
   * UC-05-14: ficha de filiación del paciente (F-01).
   *
   * @param profileId - Perfil de paciente a leer.
   * @returns Ficha de filiación, sin datos clínicos.
   */
  @Get('patients/:profileId')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'UC-05-14: ficha de filiación de un paciente (F-01)',
  })
  getPatient(
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ): Promise<PatientDetailResponseDto> {
    return this.patientsService.getPatientById(profileId);
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
