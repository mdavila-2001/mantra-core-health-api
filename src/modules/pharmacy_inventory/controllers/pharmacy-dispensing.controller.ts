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
import { MedicationDispensationsService } from '../services';
import {
  CreateDispensationDto,
  ReverseDispensationDto,
  MovementResponseDto,
  StatusResultDto,
} from '../dto';

/** Dispensación de medicamentos (UC-25-03) y su reversión (UC-25-11). */
@ApiTags('pharmacy-inventory')
@ApiBearerAuth()
@Controller('pharmacy')
export class PharmacyDispensingController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param dispensations - Valor de dispensations requerido por la operación.
   */
  constructor(private readonly dispensations: MedicationDispensationsService) {}

  /** UC-25-03: dispensar prescripción a paciente. */
  @Post(':pharmacyId/dispensations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Dispensar una prescripción a un paciente (UC-25-03)',
  })
  dispense(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreateDispensationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    return this.dispensations.dispense(pharmacyId, dto, actor);
  }

  /** UC-25-11: reversar dispensación (devolución). */
  @Post('dispensations/:id/reverse')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reversar una dispensación (UC-25-11)' })
  reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReverseDispensationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.dispensations.reverse(id, dto, actor);
  }
}
