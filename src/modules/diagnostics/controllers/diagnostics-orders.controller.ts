import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ParseOptionalLimitPipe,
  Roles,
  requireTenantId,
  AccessLogged,
  servedContentHeaders,
} from '../../../common';
import {
  DiagnosticsOrdersService,
  DiagnosticsPractitionerResultsService,
} from '../services';
import { ClinicalRecordAccessGuard } from '../../clinical/guards';
import type { PatientDiagnosticOrdersResponseDto } from '../dto';
import { PractitionerDiagnosticResultDto } from '../dto';

/**
 * Lectura del circuito diagnóstico por paciente. Capa fina: valida parámetros y
 * delega en `DiagnosticsOrdersService`.
 *
 * Mismos roles que el resto del módulo: es PHI y lo consulta quien atiende.
 */
@ApiTags('diagnostics-orders')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('diagnostics/patients')
export class DiagnosticsOrdersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Servicio de lectura del circuito diagnóstico.
   * @param results - Resultado liberado de un informe, para quien atiende.
   */
  constructor(
    private readonly readService: DiagnosticsOrdersService,
    private readonly results: DiagnosticsPractitionerResultsService,
  ) {}

  /**
   * Órdenes de laboratorio e imagenología del paciente, con sus informes.
   *
   * @param patientProfileId - Paciente cuyo circuito se lee.
   * @param limit - Tope por bloque (por defecto 50).
   * @returns Órdenes e informes diagnósticos.
   */
  @Get(':patientProfileId/orders')
  // P40: la lectura devuelve las notas que motivan cada orden. El rol y el
  // tenant no alcanzan: el mismo guard que el alta (`POST
  // /clinical/service-requests`) exige acceso vigente a la historia.
  @UseGuards(ClinicalRecordAccessGuard)
  @AccessLogged({
    resourceType: 'DIAGNOSTIC_ORDERS',
    patient: 'param:patientProfileId',
  })
  @ApiOperation({
    summary:
      'Órdenes de laboratorio e imagenología del paciente, con sus informes',
    description:
      'Cierra el circuito del módulo: el alta de la orden es ' +
      'POST /clinical/service-requests y ésta es la lectura que la encuentra.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope aplicado a cada bloque (por defecto 50)',
  })
  getPatientOrders(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PatientDiagnosticOrdersResponseDto> {
    return this.readService.getPatientOrders(
      requireTenantId(),
      patientProfileId,
      limit ?? 50,
    );
  }

  /**
   * El resultado liberado de un informe del paciente: valores, conclusión y
   * archivos.
   *
   * Misma puerta que la lista de órdenes (`ClinicalRecordAccessGuard`, 403 sin
   * acceso a la historia). Pasada la puerta, inexistente, de otro paciente, de
   * otra organización o sin versión liberada responden el mismo 404.
   *
   * @param patientProfileId - Paciente cuya historia se lee.
   * @param reportId - Informe pedido.
   * @returns La versión liberada con sus valores y archivos.
   */
  @Get(':patientProfileId/reports/:reportId')
  @UseGuards(ClinicalRecordAccessGuard)
  @AccessLogged({
    resourceType: 'DIAGNOSTIC_REPORT',
    patient: 'param:patientProfileId',
    resourceId: 'param:reportId',
  })
  @ApiOperation({
    summary: 'Resultado liberado de un informe del paciente',
    description:
      'Valores con unidad, rango de referencia e interpretación, conclusión, ' +
      'fecha de liberación y archivos de la versión liberada vigente. Un ' +
      'informe sin liberar responde 404.',
  })
  @ApiOkResponse({ type: PractitionerDiagnosticResultDto })
  @ApiForbiddenResponse({ description: 'Sin acceso a la historia' })
  @ApiNotFoundResponse({
    description:
      'No existe, no es de ese paciente u organización, o no está liberado',
  })
  getReleasedResult(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<PractitionerDiagnosticResultDto> {
    return this.results.getReleasedResult(
      requireTenantId(),
      patientProfileId,
      reportId,
    );
  }

  /**
   * Los bytes de un archivo del resultado liberado.
   *
   * @param patientProfileId - Paciente cuya historia se lee.
   * @param reportId - Informe.
   * @param fileId - Archivo del informe.
   * @param res - Respuesta cruda: se envían bytes, no JSON.
   */
  @Get(':patientProfileId/reports/:reportId/files/:fileId/content')
  @UseGuards(ClinicalRecordAccessGuard)
  @AccessLogged({
    resourceType: 'DIAGNOSTIC_REPORT_FILE',
    patient: 'param:patientProfileId',
    resourceId: 'param:fileId',
  })
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Descargar un archivo del resultado liberado',
    description:
      'Autoriza por acceso a la historia, informe liberado del paciente y ' +
      'archivo de esa versión. Todo lo demás responde 404.',
  })
  @ApiOkResponse({ description: 'Bytes del archivo' })
  @ApiForbiddenResponse({ description: 'Sin acceso a la historia' })
  @ApiNotFoundResponse({
    description:
      'El informe no está disponible o el archivo no cuelga de su versión liberada',
  })
  async getReleasedResultFileContent(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.results.getReleasedResultFileContent(
      requireTenantId(),
      patientProfileId,
      reportId,
      fileId,
    );
    // El archivo lo subió un laboratorio: `servedContentHeaders` no confía en
    // el `mimeType` persistido (lista cerrada, `attachment` salvo imágenes
    // rasterizadas, `nosniff`), igual que la mensajería. `no-store`: es un
    // informe clínico y no debe quedar en cachés intermedias.
    for (const [name, value] of Object.entries(
      servedContentHeaders(content.mimeType, content.originalName),
    )) {
      res.setHeader(name, value);
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content.buffer);
  }
}
