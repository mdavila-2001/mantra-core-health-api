import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PatientObjectionsService } from '../services';
import {
  CreatePatientObjectionDto,
  PatientObjectionResponseDto,
  ResolvePatientObjectionDto,
  StatusResultDto,
} from '../dto';

/** Endpoints sobre `/consent/patient-objections`. */
@ApiTags('consent-patient-objections')
@ApiBearerAuth()
@Controller('consent/patient-objections')
export class PatientObjectionsController {
  constructor(private readonly objectionsService: PatientObjectionsService) {}

  /** UC-07-03. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar objeción del paciente y materializar restricción' })
  raise(
    @Body() dto: CreatePatientObjectionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientObjectionResponseDto> {
    return this.objectionsService.raise(dto, actor);
  }

  /** UC-07-12. */
  @Post(':id/resolve')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver objeción del paciente' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolvePatientObjectionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.objectionsService.resolve(id, dto, actor);
  }
}
