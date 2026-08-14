import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ParseOptionalLimitPipe,
  Roles,
  requireTenantId,
} from '../../../common';
import { DiagnosticsOrdersService } from '../services';
import type { PatientDiagnosticOrdersResponseDto } from '../dto';

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
   */
  constructor(private readonly readService: DiagnosticsOrdersService) {}

  /**
   * Órdenes de laboratorio e imagenología del paciente, con sus informes.
   *
   * @param patientProfileId - Paciente cuyo circuito se lee.
   * @param limit - Tope por bloque (por defecto 50).
   * @returns Órdenes e informes diagnósticos.
   */
  @Get(':patientProfileId/orders')
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
}
