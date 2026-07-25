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
import { ComplianceService } from '../services';
import { CreateDsarDto, UpdateDsarDto, DsarResponseDto } from '../dto';

/** Endpoints DSAR del titular sobre `/privacy/*` (UC-10-08). */
@ApiTags('audit-privacy')
@ApiBearerAuth()
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly complianceService: ComplianceService) {}

  /** UC-10-08 (alta). */
  @Post('dsar')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tramitar DSAR (solicitud del titular)' })
  createDsar(
    @Body() dto: CreateDsarDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DsarResponseDto> {
    return this.complianceService.createDsar(dto, actor);
  }

  /** UC-10-08 (transición de estado). */
  @Patch('dsar/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avanzar la máquina de estados de una solicitud DSAR' })
  updateDsar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDsarDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DsarResponseDto> {
    return this.complianceService.updateDsar(id, dto, actor);
  }
}
