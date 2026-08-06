import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { ChartReadService } from '../services';
import {
  ChartNoteDetailDto,
  ListPatientNotesQueryDto,
  ListPatientNotesResponseDto,
} from '../dto';

/**
 * Lectura del expediente clínico.
 *
 * El módulo `chart` no exponía una sola operación de lectura: se podían crear
 * notas, versionarlas, firmarlas, enmendarlas y liberarlas, y ninguna pantalla
 * podía mostrarlas.
 */
@ApiTags('charts-read')
@ApiBearerAuth()
@Controller('charts')
export class ChartReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Valor de read service requerido por la operación.
   */
  constructor(private readonly readService: ChartReadService) {}

  /** Notas del paciente, de la más reciente a la más antigua. */
  @Get('patients/:patientProfileId/notes')
  @Roles('PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar las notas clínicas de un paciente' })
  listPatientNotes(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query() query: ListPatientNotesQueryDto,
  ): Promise<ListPatientNotesResponseDto> {
    return this.readService.listPatientNotes(patientProfileId, query);
  }

  /** Una nota con su versión vigente y el índice de versiones. */
  @Get('notes/:noteId')
  @Roles('PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Consultar una nota clínica',
    description:
      'Devuelve el cuerpo de la versión vigente y el índice de todas las versiones.',
  })
  getNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ): Promise<ChartNoteDetailDto> {
    return this.readService.getNote(noteId);
  }
}
