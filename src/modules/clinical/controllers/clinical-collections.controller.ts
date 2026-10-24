import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessLogged, Roles } from '../../../common';
import { ClinicalCollectionsService } from '../services';
import { ClinicalRecordAccessGuard } from '../guards';
import {
  DiagnosticReportPageDto,
  ImmunizationPageDto,
  ListDiagnosticReportsQueryDto,
  ListImmunizationsQueryDto,
  ListMedicationRecordsQueryDto,
  ListProceduresQueryDto,
  ListServiceRequestsQueryDto,
  MedicationRecordPageDto,
  ProcedurePageDto,
  ServiceRequestPageDto,
} from '../dto';

/**
 * `GET` de colección de `clinical` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('clinical-collections')
@ApiBearerAuth()
@Controller()
export class ClinicalCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: ClinicalCollectionsService) {}

  /** V08-03: listar los informes diagnósticos de un paciente. */
  @Get('clinical/patients/:patientProfileId/diagnostic-reports')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @UseGuards(ClinicalRecordAccessGuard)
  @AccessLogged({
    resourceType: 'DIAGNOSTIC_REPORTS',
    patient: 'param:patientProfileId',
  })
  @ApiOperation({ summary: 'Listar los informes diagnósticos de un paciente' })
  @ApiOkResponse({ type: DiagnosticReportPageDto })
  listDiagnosticReports(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query() query: ListDiagnosticReportsQueryDto,
  ): Promise<DiagnosticReportPageDto> {
    return this.collections.listDiagnosticReports(patientProfileId, query);
  }

  /** V08-09: listar las inmunizaciones de un paciente. */
  @Get('clinical/patients/:patientProfileId/immunizations')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @UseGuards(ClinicalRecordAccessGuard)
  @AccessLogged({
    resourceType: 'IMMUNIZATIONS',
    patient: 'param:patientProfileId',
  })
  @ApiOperation({ summary: 'Listar las inmunizaciones de un paciente' })
  @ApiOkResponse({ type: ImmunizationPageDto })
  listImmunizations(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query() query: ListImmunizationsQueryDto,
  ): Promise<ImmunizationPageDto> {
    return this.collections.listImmunizations(patientProfileId, query);
  }

  /** V08-10: listar los registros de medicación de un paciente. */
  @Get('clinical/patients/:patientProfileId/medication-records')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @UseGuards(ClinicalRecordAccessGuard)
  @AccessLogged({
    resourceType: 'MEDICATION_RECORDS',
    patient: 'param:patientProfileId',
  })
  @ApiOperation({
    summary: 'Listar los registros de medicación de un paciente',
  })
  @ApiOkResponse({ type: MedicationRecordPageDto })
  listMedicationRecords(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query() query: ListMedicationRecordsQueryDto,
  ): Promise<MedicationRecordPageDto> {
    return this.collections.listMedicationRecords(patientProfileId, query);
  }

  /** V08-11: listar los procedimientos de un paciente. */
  @Get('clinical/patients/:patientProfileId/procedures')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @UseGuards(ClinicalRecordAccessGuard)
  @AccessLogged({
    resourceType: 'PROCEDURES',
    patient: 'param:patientProfileId',
  })
  @ApiOperation({ summary: 'Listar los procedimientos de un paciente' })
  @ApiOkResponse({ type: ProcedurePageDto })
  listProcedures(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query() query: ListProceduresQueryDto,
  ): Promise<ProcedurePageDto> {
    return this.collections.listProcedures(patientProfileId, query);
  }

  /** V08-12: listar las solicitudes de servicio de un paciente. */
  @Get('clinical/patients/:patientProfileId/service-requests')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @UseGuards(ClinicalRecordAccessGuard)
  @AccessLogged({
    resourceType: 'SERVICE_REQUESTS',
    patient: 'param:patientProfileId',
  })
  @ApiOperation({
    summary: 'Listar las solicitudes de servicio de un paciente',
  })
  @ApiOkResponse({ type: ServiceRequestPageDto })
  listServiceRequests(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query() query: ListServiceRequestsQueryDto,
  ): Promise<ServiceRequestPageDto> {
    return this.collections.listServiceRequests(patientProfileId, query);
  }
}
