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
import { DiagnosticUnitsService } from '../services';
import { AccreditationResponseDto, RenewAccreditationDto } from '../dto';

/**
 * Endpoint sobre `/diagnostic-unit-accreditations`: renovación de una
 * acreditación con nueva evidencia (UC-23-11).
 */
@ApiTags('diagnostic-unit-accreditations')
@ApiBearerAuth()
@Controller('diagnostic-unit-accreditations')
export class DiagnosticUnitAccreditationsController {
  constructor(private readonly unitsService: DiagnosticUnitsService) {}

  /** UC-23-11. */
  @Post(':id/renew')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Renovar/registrar acreditación con evidencia' })
  renew(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenewAccreditationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccreditationResponseDto> {
    return this.unitsService.renewAccreditation(id, dto, actor);
  }
}
