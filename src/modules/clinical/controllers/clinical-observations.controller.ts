import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ClinicalRecordAccessGuard } from '../guards';
import { ObservationsService } from '../services';
import {
  AmendObservationDto,
  CreateObservationDto,
  ObservationResponseDto,
} from '../dto';

/**
 * Endpoints de observaciones clínicas (registro y enmienda).
 *
 * SEC-01: el alta lleva el guard del expediente —su `patientProfileId` viaja en
 * el cuerpo—; la enmienda no, porque su paciente sale de la observación ya
 * cargada (GAP-3, deuda abierta).
 */
@ApiTags('clinical-observations')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('clinical/observations')
export class ClinicalObservationsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param observationsService - Valor de observations service requerido por la operación.
   */
  constructor(private readonly observationsService: ObservationsService) {}

  /** UC-08-03. */
  @Post()
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una observación con componentes y ejecutantes',
  })
  record(
    @Body() dto: CreateObservationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ObservationResponseDto> {
    return this.observationsService.record(dto, actor);
  }

  /** UC-08-04. */
  @Patch(':id/amend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Corregir/enmendar una observación (value contract)',
  })
  amend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AmendObservationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ObservationResponseDto> {
    return this.observationsService.amend(id, dto, actor);
  }
}
