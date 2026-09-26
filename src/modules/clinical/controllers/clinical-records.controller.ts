import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import type { FileLinkResponseDto } from '../../common/dto';
import { ClinicalRecordAccessGuard } from '../guards';
import {
  AllergyIntolerancesService,
  ConditionsService,
  ImmunizationsService,
  MedicationsService,
  ProceduresService,
} from '../services';
import {
  AllergyIntoleranceResponseDto,
  AttachFileToAllergyIntoleranceDto,
  AttachFileToConditionDto,
  AttachFileToMedicationRequestDto,
  AttachFileToProcedureDto,
  ChangeConditionClinicalStatusDto,
  ConditionResponseDto,
  CreateAllergyIntoleranceDto,
  CreateConditionDto,
  CreateImmunizationDto,
  CreateMedicationRecordDto,
  CreateMedicationRequestDto,
  CreateProcedureDto,
  EditMedicationRequestDraftDto,
  ImmunizationResponseDto,
  InvalidateMedicationRequestDto,
  MedicationRecordResponseDto,
  MedicationRequestResponseDto,
  ProcedureResponseDto,
  RenewMedicationRequestDto,
  ReplaceMedicationRequestDto,
} from '../dto';

/**
 * Endpoints del registro clínico del paciente: condiciones, alergias, medicación
 * (prescripción y administración), procedimientos e inmunizaciones.
 *
 * SEC-01: `ClinicalRecordAccessGuard` se monta **handler a handler**, no sobre
 * la clase. Sólo lo llevan las seis altas cuyo `patientProfileId` viaja en el
 * cuerpo, que son las que el guard puede evaluar. Las rutas de comando sobre un
 * recurso ya existente (`:id/sign`, `:id/issue`, `:id/change-status`…) conocen a
 * su paciente sólo después de cargarlo, y el guard no carga recursos: montarlo
 * ahí las dejaría con aspecto de protegidas mientras él las deja pasar sin
 * evaluar nada. Las autoriza cada servicio tras cargar el recurso, con la
 * política de escritura (MCH-007, cierre del GAP-3 de SEC-01).
 */
@ApiTags('clinical-records')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('clinical')
export class ClinicalRecordsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param conditionsService - Valor de conditions service requerido por la operación.
   * @param allergyService - Valor de allergy service requerido por la operación.
   * @param medicationsService - Valor de medications service requerido por la operación.
   * @param proceduresService - Valor de procedures service requerido por la operación.
   * @param immunizationsService - Valor de immunizations service requerido por la operación.
   */
  constructor(
    private readonly conditionsService: ConditionsService,
    private readonly allergyService: AllergyIntolerancesService,
    private readonly medicationsService: MedicationsService,
    private readonly proceduresService: ProceduresService,
    private readonly immunizationsService: ImmunizationsService,
  ) {}

  /** UC-08-08. */
  @Post('conditions')
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una condición/diagnóstico' })
  createCondition(
    @Body() dto: CreateConditionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConditionResponseDto> {
    return this.conditionsService.create(dto, actor);
  }

  /** Patch v4.0.8: transiciona el estado clínico de un diagnóstico ya registrado. */
  @Post('conditions/:id/change-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar el estado clínico de una condición' })
  changeConditionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeConditionClinicalStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConditionResponseDto> {
    return this.conditionsService.changeClinicalStatus(id, dto, actor);
  }

  /**
   * ALV-033 (reemplazo de ALV-032): liga un archivo ya subido a este
   * diagnóstico puntual. Subí el archivo antes con `POST /common/files`.
   */
  @Post('conditions/:id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un archivo ya subido a una condición' })
  attachFileToCondition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachFileToConditionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    return this.conditionsService.attachFile(id, dto, actor);
  }

  /** UC-08-09. */
  @Post('allergy-intolerances')
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una alergia con reacciones' })
  createAllergy(
    @Body() dto: CreateAllergyIntoleranceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AllergyIntoleranceResponseDto> {
    return this.allergyService.create(dto, actor);
  }

  /** P25 (BR-11): liga un archivo ya subido a esta alergia puntual. */
  @Post('allergy-intolerances/:id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un archivo ya subido a una alergia' })
  attachFileToAllergy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachFileToAllergyIntoleranceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    return this.allergyService.attachFile(id, dto, actor);
  }

  /** UC-08-10. */
  @Post('medication-requests')
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Prescribir medicación' })
  prescribeMedication(
    @Body() dto: CreateMedicationRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    return this.medicationsService.prescribe(dto, actor);
  }

  /**
   * P25 (BR-11): liga un archivo ya subido a esta receta puntual. Adjuntar no
   * reabre la inmutabilidad: el contenido sellado y su `content_hash` no cambian.
   */
  @Post('medication-requests/:id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un archivo ya subido a una receta' })
  attachFileToMedicationRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachFileToMedicationRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    return this.medicationsService.attachFile(id, dto, actor);
  }

  /** UC-08-11. */
  @Post('medication-records')
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Administrar/registrar medicación' })
  administerMedication(
    @Body() dto: CreateMedicationRecordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRecordResponseDto> {
    return this.medicationsService.administer(dto, actor);
  }

  /** CAN-RX: edita ítems clínicos de un borrador (solo DRAFT; comando, no PATCH genérico). */
  @Post('medication-requests/:id/edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar ítems de una receta en borrador (DRAFT)' })
  editMedicationDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditMedicationRequestDraftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    return this.medicationsService.editDraft(id, dto, actor);
  }

  /** ALOVIDA D-05: firma la receta en borrador (aditivo; habilita emitir bajo política). */
  @Post('medication-requests/:id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Firmar una receta en borrador (DRAFT)' })
  signMedicationRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    return this.medicationsService.sign(id, actor);
  }

  /** CAN-RX: emite la receta (DRAFT → ISSUED) y sella su contenido. */
  @Post('medication-requests/:id/issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Emitir una receta (la vuelve inmutable)' })
  issueMedicationRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<MedicationRequestResponseDto> {
    return this.medicationsService.issue(id, actor, idempotencyKey);
  }

  /** CAN-RX: invalida una receta emitida (motivo obligatorio; se conserva). */
  @Post('medication-requests/:id/invalidate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidar una receta emitida' })
  invalidateMedicationRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InvalidateMedicationRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    return this.medicationsService.invalidate(id, dto, actor);
  }

  /** CAN-RX: reemplaza una receta emitida y devuelve la nueva (DRAFT). */
  @Post('medication-requests/:id/replace')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reemplazar una receta emitida (crea la corrección)',
  })
  replaceMedicationRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceMedicationRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    return this.medicationsService.replace(id, dto, actor);
  }

  /** CAN-RX: renueva una receta copiando datos y devuelve la nueva (DRAFT). */
  @Post('medication-requests/:id/renew')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Renovar una receta (crea una nueva copiando datos)',
  })
  renewMedicationRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenewMedicationRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    return this.medicationsService.renew(id, dto, actor);
  }

  /** UC-08-12. */
  @Post('procedures')
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un procedimiento' })
  createProcedure(
    @Body() dto: CreateProcedureDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProcedureResponseDto> {
    return this.proceduresService.create(dto, actor);
  }

  /**
   * ALV-033 (odontología): liga un archivo ya subido a este procedimiento
   * puntual. Sirve también a los tratamientos odontológicos —son
   * `clinical.procedures` con categoría dental, ver `PeriopDentalService`—,
   * así que no hace falta un endpoint propio en ese módulo.
   */
  @Post('procedures/:id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un archivo ya subido a un procedimiento' })
  attachFileToProcedure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachFileToProcedureDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    return this.proceduresService.attachFile(id, dto, actor);
  }

  /** UC-08-13. */
  @Post('immunizations')
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una inmunización' })
  createImmunization(
    @Body() dto: CreateImmunizationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImmunizationResponseDto> {
    return this.immunizationsService.create(dto, actor);
  }
}
