import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ClinicalRecordAccessGuard } from '../../clinical/guards';
import { ChartNotesService, ChartNotesReadService } from '../services';
import {
  AddVersionDto,
  AmendNoteDto,
  ChartNotesListResponseDto,
  CosignVersionDto,
  CreateNoteDto,
  ExamFindingsDto,
  ExamFindingsResultDto,
  ListChartNotesQueryDto,
  NoteVersionResponseDto,
  ReleaseResultDto,
  ReleaseVersionDto,
  SignVersionDto,
  WithholdVersionDto,
} from '../dto';

/**
 * Endpoints de notas clínicas versionadas (`/charts/notes`). Capa fina: valida
 * parámetros y delega en `ChartNotesService`. La autenticación la impone el guard
 * global.
 *
 * SEC-01 (AC-SEC-02): el acceso por paciente **ya no** «se valida aguas arriba»
 * —no había nada aguas arriba—. La creación de la nota lleva
 * `ClinicalRecordAccessGuard`, que resuelve su `patientProfileId` del cuerpo
 * contra la política del expediente. Es la ruta real que la fuente de SEC-01
 * citaba como `POST /clinical/encounters/:id/notes`, que nunca existió.
 *
 * Las otras siete rutas mutantes (versiones, firma, cofirma, enmienda,
 * liberación, retención, hallazgos) **no** lo llevan: su paciente sólo se
 * conoce cargando la nota o la versión, y el guard no carga recursos. Es deuda
 * de seguridad abierta y trazada (GAP-3 de SEC-01), no un olvido.
 */
@ApiTags('chart-notes')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('charts/notes')
export class ChartNotesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param notesService - Valor de notes service requerido por la operación.
   */
  constructor(
    private readonly notesService: ChartNotesService,
    private readonly notesReadService: ChartNotesReadService,
  ) {}

  /** P18: colección de notas de evolución de un profesional. */
  @Get()
  @ApiOperation({
    summary:
      'Listar las notas de evolución de un profesional por ventana de fechas',
  })
  @ApiOkResponse({ type: ChartNotesListResponseDto })
  @ApiForbiddenResponse({
    description:
      'La sesión no tiene perfil profesional, o pide las notas de otro ' +
      'profesional sin ser SUPERADMIN.',
  })
  listNotes(
    @Query() query: ListChartNotesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ChartNotesListResponseDto> {
    return this.notesReadService.listNotes(query, actor);
  }

  /** UC-15-01. */
  @Post()
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nota clínica versionada (borrador SOAP)',
  })
  createNote(
    @Body() dto: CreateNoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    return this.notesService.createNote(dto, actor);
  }

  /** UC-15-02. */
  @Put(':noteId/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Editar borrador creando una nueva versión inmutable',
  })
  addVersion(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: AddVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    return this.notesService.addVersion(noteId, dto, actor);
  }

  /** UC-15-03. */
  @Post(':noteId/versions/:versionId/sign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Firmar una versión y sellar su contenido' })
  signVersion(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: SignVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    return this.notesService.signVersion(noteId, versionId, dto, actor);
  }

  /** UC-15-04. */
  @Post(':noteId/versions/:versionId/cosign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cofirmar una versión firmada (cadena de firmas)' })
  cosignVersion(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: CosignVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    return this.notesService.cosignVersion(noteId, versionId, dto, actor);
  }

  /** UC-15-05. */
  @Post(':noteId/amendments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enmendar una nota firmada (addendum versionado)' })
  amendNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: AmendNoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    return this.notesService.amendNote(noteId, dto, actor);
  }

  /** UC-15-06. */
  @Post('versions/:versionId/release')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Liberar una versión al paciente' })
  releaseVersion(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ReleaseVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReleaseResultDto> {
    return this.notesService.releaseVersion(versionId, dto, actor);
  }

  /** UC-15-07. */
  @Post('versions/:versionId/withhold')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Retener una versión del paciente (motivo legal)' })
  withholdVersion(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: WithholdVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReleaseResultDto> {
    return this.notesService.withholdVersion(versionId, dto, actor);
  }

  /** UC-15-08. */
  @Post('versions/:versionId/exam-findings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar hallazgos de examen físico' })
  recordExamFindings(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ExamFindingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExamFindingsResultDto> {
    return this.notesService.recordExamFindings(versionId, dto, actor);
  }
}
