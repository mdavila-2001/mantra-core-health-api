import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  PeriopCasesService,
  PeriopPreopService,
  PeriopIntraopService,
} from '../services';
import {
  ScheduleCaseDto,
  CaseResponseDto,
  UpdateCaseDto,
  UpdateCaseResponseDto,
  ConfirmCaseResponseDto,
  AddDiagnosesDto,
  DiagnosesResponseDto,
  AssignTeamMemberDto,
  TeamMemberResponseDto,
  CreatePreopAssessmentDto,
  PreopAssessmentResponseDto,
  VerifyOrdersDto,
  VerifyOrdersResponseDto,
  SubmitChecklistPhaseDto,
  ChecklistPhaseResponseDto,
  CreateAnesthesiaPlanDto,
  AnesthesiaPlanResponseDto,
  ApprovePlanResponseDto,
  RecordAnesthesiaEventDto,
  AnesthesiaEventResponseDto,
  CreateOperativeStepDto,
  OperativeStepResponseDto,
  RecordFindingDto,
  FindingResponseDto,
  RecordImplantDto,
  ImplantResponseDto,
  RecordMedicationUseDto,
  RecordSpecimenDto,
  SuppliesResponseDto,
  DraftOperativeReportDto,
  OperativeReportResponseDto,
  SignReportDto,
  SignReportResponseDto,
  AdmitToPacuDto,
  PacuStayResponseDto,
  RecordPacuAssessmentDto,
  PacuAssessmentResponseDto,
  DischargePacuDto,
  DischargePacuResponseDto,
  CancelCaseDto,
  CancelCaseResponseDto,
  PostChargesDto,
  PostChargesResponseDto,
} from '../dto';

/** Endpoints del caso quirúrgico, desde la programación hasta el cierre. */
@ApiTags('procedure-cases')
@ApiBearerAuth()
@Controller()
export class PeriopController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param casesService - Valor de cases service requerido por la operación.
   * @param preopService - Valor de preop service requerido por la operación.
   * @param intraopService - Valor de intraop service requerido por la operación.
   */
  constructor(
    private readonly casesService: PeriopCasesService,
    private readonly preopService: PeriopPreopService,
    private readonly intraopService: PeriopIntraopService,
  ) {}

  /** UC-53-01. */
  @Post('procedure-cases')
  @Roles('SURGERY_SCHEDULER', 'SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Programar un caso quirúrgico y reservar el quirófano',
    description:
      'El solape de quirófano se comprueba dentro de la transacción.',
  })
  scheduleCase(
    @Body() dto: ScheduleCaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CaseResponseDto> {
    return this.casesService.scheduleCase(dto, actor);
  }

  /** C-13 (CAN-INT-001). */
  @Patch('procedure-cases/:id')
  @Roles('SURGERY_SCHEDULER', 'SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar el caso quirúrgico',
    description:
      'El paciente sólo puede corregirse con el caso en borrador y sin dependencias (CAN-INT-001).',
  })
  updateCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UpdateCaseResponseDto> {
    return this.casesService.updateCase(id, dto, actor);
  }

  /** C-14 (CAN-INT-002). */
  @Post('procedure-cases/:id/confirm')
  @Roles('SURGERY_SCHEDULER', 'SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Confirmar la intervención verificando las credenciales del equipo',
    description:
      'Bloquea la confirmación si algún integrante no tiene credencial profesional vigente (CAN-INT-002).',
  })
  confirmCase(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConfirmCaseResponseDto> {
    return this.casesService.confirmCase(id, actor);
  }

  /** UC-53-02. */
  @Post('procedure-cases/:id/diagnoses')
  @Roles('SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar los diagnósticos del caso',
    description: 'El caso admite un único diagnóstico principal.',
  })
  addDiagnoses(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddDiagnosesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DiagnosesResponseDto> {
    return this.casesService.addDiagnoses(id, dto, actor);
  }

  /** UC-53-02. */
  @Post('procedure-cases/:id/team-members')
  @Roles('SURGERY_SCHEDULER', 'SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar un miembro al equipo quirúrgico' })
  assignTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTeamMemberDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TeamMemberResponseDto> {
    return this.casesService.assignTeamMember(id, dto, actor);
  }

  /** UC-53-03. */
  @Post('procedure-cases/:id/preoperative-assessments')
  @Roles('ANESTHESIOLOGIST', 'SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Registrar la valoración preoperatoria y sus puntuaciones de riesgo',
    description:
      'Exige revisar alergias y medicación; las puntuaciones son inmutables.',
  })
  createAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePreopAssessmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PreopAssessmentResponseDto> {
    return this.preopService.createAssessment(id, dto, actor);
  }

  /** UC-53-04. */
  @Post('procedure-cases/:id/preoperative-orders/verify')
  @Roles('ANESTHESIOLOGIST', 'PERIOP_NURSE', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar las órdenes preoperatorias',
    description: 'El caso pasa a listo sólo cuando no queda ninguna pendiente.',
  })
  verifyOrders(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyOrdersDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VerifyOrdersResponseDto> {
    return this.preopService.verifyOrders(id, dto, actor);
  }

  /** UC-53-05. */
  @Post('procedure-cases/:id/safety-checklists/:checklistId/responses')
  @Roles('PERIOP_NURSE', 'SURGEON', 'ANESTHESIOLOGIST', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Responder una fase del checklist quirúrgico',
    description:
      'Las respuestas son inmutables; una excepción exige justificación.',
  })
  submitChecklistPhase(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Body() dto: SubmitChecklistPhaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ChecklistPhaseResponseDto> {
    return this.preopService.submitChecklistPhase(id, checklistId, dto, actor);
  }

  /** UC-53-06. */
  @Post('procedure-cases/:id/anesthesia-plans')
  @Roles('ANESTHESIOLOGIST', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el plan de anestesia y la valoración de vía aérea',
    description:
      'Anticipar vía aérea difícil obliga a declarar el plan de rescate.',
  })
  createAnesthesiaPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAnesthesiaPlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AnesthesiaPlanResponseDto> {
    return this.preopService.createAnesthesiaPlan(id, dto, actor);
  }

  /** UC-53-06. */
  @Post('procedure-cases/:id/anesthesia-plans/:planId/approve')
  @Roles('ANESTHESIOLOGIST', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar el plan de anestesia' })
  approveAnesthesiaPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ApprovePlanResponseDto> {
    return this.preopService.approveAnesthesiaPlan(id, planId, actor);
  }

  /** UC-53-07. */
  @Post('procedure-cases/:id/anesthesia-events')
  @Roles('ANESTHESIOLOGIST', 'PERIOP_NURSE', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Anotar un evento intraoperatorio de anestesia',
    description:
      'Log append-only; la inducción exige plan aprobado y abre el caso.',
  })
  recordAnesthesiaEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordAnesthesiaEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AnesthesiaEventResponseDto> {
    return this.preopService.recordAnesthesiaEvent(id, dto, actor);
  }

  /** UC-53-08. */
  @Post('procedure-cases/:id/operative-steps')
  @Roles('SURGEON', 'PERIOP_NURSE', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un paso operatorio' })
  createStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOperativeStepDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperativeStepResponseDto> {
    return this.intraopService.createStep(id, dto, actor);
  }

  /** UC-53-08. */
  @Post('procedure-cases/:id/findings')
  @Roles('SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un hallazgo operatorio',
    description:
      'Inmutable; su sitio anatómico se acumula en el procedimiento.',
  })
  recordFinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordFindingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FindingResponseDto> {
    return this.intraopService.recordFinding(id, dto, actor);
  }

  /** UC-53-09. */
  @Post('procedure-cases/:id/implants')
  @Roles('SURGEON', 'PERIOP_NURSE', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un implante con su trazabilidad UDI, lote o serie',
    description: 'Al menos un identificador es obligatorio.',
  })
  recordImplant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordImplantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImplantResponseDto> {
    return this.intraopService.recordImplant(id, dto, actor);
  }

  /** UC-53-10. */
  @Post('procedure-cases/:id/medication-uses')
  @Roles('ANESTHESIOLOGIST', 'PERIOP_NURSE', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el uso de un medicamento en la intervención',
  })
  recordMedicationUse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordMedicationUseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SuppliesResponseDto> {
    return this.intraopService.recordMedicationUse(id, dto, actor);
  }

  /** UC-53-10. */
  @Post('procedure-cases/:id/specimens')
  @Roles('SURGEON', 'PERIOP_NURSE', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una muestra tomada en la intervención' })
  recordSpecimen(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordSpecimenDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SuppliesResponseDto> {
    return this.intraopService.recordSpecimen(id, dto, actor);
  }

  /** UC-53-11. */
  @Post('procedure-cases/:id/operative-reports')
  @Roles('SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Redactar el reporte operatorio',
    description: 'Cada versión es inmutable; corregir es escribir una nueva.',
  })
  draftReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DraftOperativeReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperativeReportResponseDto> {
    return this.intraopService.draftReport(id, dto, actor);
  }

  /** UC-53-11. */
  @Post('procedure-cases/:id/operative-reports/:reportId/sign')
  @Roles('SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Firmar el reporte operatorio',
    description: 'Firmar cierra el caso quirúrgico.',
  })
  signReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: SignReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SignReportResponseDto> {
    return this.intraopService.signReport(id, reportId, dto, actor);
  }

  /** UC-53-12. */
  @Post('procedure-cases/:id/pacu-stays')
  @Roles('PERIOP_NURSE', 'ANESTHESIOLOGIST', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admitir al paciente en recuperación' })
  admitToPacu(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdmitToPacuDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PacuStayResponseDto> {
    return this.intraopService.admitToPacu(id, dto, actor);
  }

  /** UC-53-12. */
  @Post('pacu-stays/:stayId/assessments')
  @Roles('PERIOP_NURSE', 'ANESTHESIOLOGIST', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una valoración de recuperación',
    description: 'Informa si cumple el criterio de alta; no da el alta.',
  })
  recordPacuAssessment(
    @Param('stayId', ParseUUIDPipe) stayId: string,
    @Body() dto: RecordPacuAssessmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PacuAssessmentResponseDto> {
    return this.intraopService.recordPacuAssessment(stayId, dto, actor);
  }

  /** UC-53-12. */
  @Post('pacu-stays/:stayId/discharge')
  @Roles('ANESTHESIOLOGIST', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dar el alta de recuperación',
    description: 'Exige una valoración que cumpla el criterio de Aldrete.',
  })
  dischargeFromPacu(
    @Param('stayId', ParseUUIDPipe) stayId: string,
    @Body() dto: DischargePacuDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DischargePacuResponseDto> {
    return this.intraopService.dischargeFromPacu(stayId, dto, actor);
  }

  /** UC-53-13. */
  @Post('procedure-cases/:id/cancel')
  @Roles('SURGERY_SCHEDULER', 'SURGEON', 'PERIOP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar el caso quirúrgico',
    description: 'Libera el quirófano en la misma transacción.',
  })
  cancelCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelCaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CancelCaseResponseDto> {
    return this.casesService.cancelCase(id, dto, actor);
  }

  /** UC-53-14. */
  @Post('procedure-cases/:id/charge-items/post')
  @Roles('PERIOP_ADMIN', 'BILLING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generar los cargos y consolidar el uso del quirófano',
    description: 'Sólo se factura un caso completado.',
  })
  postCharges(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostChargesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PostChargesResponseDto> {
    return this.casesService.postCharges(id, dto, actor);
  }
}
