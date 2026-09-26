import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { InsuranceCampaignsService } from '../services';
import {
  CreateInsuranceCampaignDto,
  InsuranceCampaignListQueryDto,
  InsuranceCampaignPageDto,
  InsuranceCampaignResponseDto,
  PatientCampaignDto,
  UpdateInsuranceCampaignStatusDto,
} from '../dto';

/**
 * Tarea 4 · M-06 — campañas preventivas de la aseguradora. Ver
 * `docs/contracts/insurer-preventive-campaigns.md`.
 *
 * Sin `@Roles` de clase: la autorización la resuelve el servicio por
 * pertenencia. La aseguradora se autoriza por membresía en el tenant activo
 * (OWNER/ADMIN para mutar, cualquier miembro para leer) y el afiliado por
 * titularidad de su perfil contra el JWT. Un rol clínico o de paciente que
 * intente mutar recibe 403 del servicio.
 */
@ApiTags('insurance-campaigns')
@ApiBearerAuth()
@Controller('insurance-campaigns')
export class InsuranceCampaignsController {
  constructor(private readonly service: InsuranceCampaignsService) {}

  @Post()
  @Roles()
  @ApiOperation({ summary: 'Crear una campaña preventiva de la aseguradora' })
  @ApiCreatedResponse({ type: InsuranceCampaignResponseDto })
  create(
    @Body() dto: CreateInsuranceCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignResponseDto> {
    return this.service.create(dto, actor);
  }

  @Get()
  @Roles()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar las campañas de la aseguradora activa' })
  @ApiOkResponse({ type: InsuranceCampaignPageDto })
  list(
    @Query() query: InsuranceCampaignListQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignPageDto> {
    return this.service.list(query, actor);
  }

  /**
   * Debe declararse ANTES de `GET :id`: si no, `patient` se leería como un id.
   * El perfil viaja en la URL para que un intento sobre el de otro afiliado sea
   * verificable y auditable.
   */
  @Get('patient/:patientProfileId')
  @Roles()
  @ApiOperation({
    summary:
      'Campañas vigentes de la aseguradora del afiliado (sólo el titular)',
  })
  @ApiOkResponse({ type: [PatientCampaignDto] })
  listForPatient(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientCampaignDto[]> {
    return this.service.listActiveForPatient(patientProfileId, actor);
  }

  @Get(':id')
  @Roles()
  @ApiOperation({ summary: 'Consultar una campaña de la aseguradora activa' })
  @ApiOkResponse({ type: InsuranceCampaignResponseDto })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignResponseDto> {
    return this.service.getById(id, actor);
  }

  @Patch(':id/status')
  @Roles()
  @ApiOperation({
    summary: 'Activar, pausar o finalizar una campaña (transiciones cerradas)',
  })
  @ApiOkResponse({ type: InsuranceCampaignResponseDto })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsuranceCampaignStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsuranceCampaignResponseDto> {
    return this.service.changeStatus(id, dto, actor);
  }
}
