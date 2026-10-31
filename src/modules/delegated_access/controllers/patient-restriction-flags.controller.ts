import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  PatientRestrictionFlagsResponseDto,
  PutRestrictionFlagsDto,
} from '../dto';
import { PatientRestrictionFlagsService } from '../services/patient-restriction-flags.service';

/**
 * Banderas de restricción de un paciente (`VIP`, `CONFIDENTIAL`,
 * `STAFF_RELATIVE`, `PROTECTED`). `SECURITY_ADMIN` las ve y fija en toda la
 * organización; un doctor, solo las de los pacientes de su equipo (el servicio
 * responde 404 uniforme con un paciente ajeno).
 */
@ApiTags('delegated-access-governance')
@ApiBearerAuth()
@Controller('org/patients/:patientProfileId/restriction-flags')
export class PatientRestrictionFlagsController {
  /** @param flags - Banderas de pacientes. */
  constructor(private readonly flags: PatientRestrictionFlagsService) {}

  /** Banderas vigentes del paciente. */
  @Get()
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Banderas de restricción de un paciente' })
  get(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientRestrictionFlagsResponseDto> {
    return this.flags.get(patientProfileId, actor);
  }

  /** Reemplaza el conjunto de banderas del paciente. */
  @Audited({
    action: 'PATIENT_RESTRICTION_FLAGS_UPDATED',
    entity: 'patient_restriction_flag',
    entityId: 'param:patientProfileId',
  })
  @Put()
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reemplazar las banderas de restricción de un paciente',
  })
  put(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Body() dto: PutRestrictionFlagsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientRestrictionFlagsResponseDto> {
    return this.flags.put(patientProfileId, dto, actor);
  }
}
