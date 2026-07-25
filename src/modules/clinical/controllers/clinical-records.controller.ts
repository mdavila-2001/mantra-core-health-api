import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import {
  AllergyIntolerancesService,
  ConditionsService,
  ImmunizationsService,
  MedicationsService,
  ProceduresService,
} from '../services';
import {
  AllergyIntoleranceResponseDto,
  ConditionResponseDto,
  CreateAllergyIntoleranceDto,
  CreateConditionDto,
  CreateImmunizationDto,
  CreateMedicationRecordDto,
  CreateMedicationRequestDto,
  CreateProcedureDto,
  ImmunizationResponseDto,
  MedicationRecordResponseDto,
  MedicationRequestResponseDto,
  ProcedureResponseDto,
} from '../dto';

/**
 * Endpoints del registro clínico del paciente: condiciones, alergias, medicación
 * (prescripción y administración), procedimientos e inmunizaciones.
 */
@ApiTags('clinical-records')
@ApiBearerAuth()
@Controller('clinical')
export class ClinicalRecordsController {
  constructor(
    private readonly conditionsService: ConditionsService,
    private readonly allergyService: AllergyIntolerancesService,
    private readonly medicationsService: MedicationsService,
    private readonly proceduresService: ProceduresService,
    private readonly immunizationsService: ImmunizationsService,
  ) {}

  /** UC-08-08. */
  @Post('conditions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una condición/diagnóstico' })
  createCondition(
    @Body() dto: CreateConditionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConditionResponseDto> {
    return this.conditionsService.create(dto, actor);
  }

  /** UC-08-09. */
  @Post('allergy-intolerances')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una alergia con reacciones' })
  createAllergy(
    @Body() dto: CreateAllergyIntoleranceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AllergyIntoleranceResponseDto> {
    return this.allergyService.create(dto, actor);
  }

  /** UC-08-10. */
  @Post('medication-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Prescribir medicación' })
  prescribeMedication(
    @Body() dto: CreateMedicationRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    return this.medicationsService.prescribe(dto, actor);
  }

  /** UC-08-11. */
  @Post('medication-records')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Administrar/registrar medicación' })
  administerMedication(
    @Body() dto: CreateMedicationRecordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicationRecordResponseDto> {
    return this.medicationsService.administer(dto, actor);
  }

  /** UC-08-12. */
  @Post('procedures')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un procedimiento' })
  createProcedure(
    @Body() dto: CreateProcedureDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProcedureResponseDto> {
    return this.proceduresService.create(dto, actor);
  }

  /** UC-08-13. */
  @Post('immunizations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una inmunización' })
  createImmunization(
    @Body() dto: CreateImmunizationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImmunizationResponseDto> {
    return this.immunizationsService.create(dto, actor);
  }
}
