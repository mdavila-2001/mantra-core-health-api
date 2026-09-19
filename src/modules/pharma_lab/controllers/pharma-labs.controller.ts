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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  CreatePharmaLabDto,
  CreatedResourceDto,
  LinkStaffDto,
  TransitionResultDto,
  UnlinkDto,
  UpdatePharmaLabDto,
  UpdateStaffPermissionsDto,
} from '../dto';
import type {
  PharmaLabLinkEvents,
  PharmaLabStaff,
  PharmaLabs,
} from '../entities';
import { PharmaLabOrganizationService } from '../services';

/**
 * Organización laboratorio farmacéutico y su personal (UC-17-01 a UC-17-05).
 * Capa fina que delega en `PharmaLabOrganizationService`.
 */
@ApiTags('pharma-labs')
@ApiBearerAuth()
@Roles('PHARMA_LAB_ADMIN', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN')
@Controller('pharma-labs')
export class PharmaLabsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso de la organización.
   */
  constructor(private readonly service: PharmaLabOrganizationService) {}

  /** UC-17-01. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una organización laboratorio farmacéutico',
  })
  create(
    @Body() dto: CreatePharmaLabDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createLab(dto, actor);
  }

  /** Listado de laboratorios registrados. */
  @Get()
  @ApiOperation({ summary: 'Listar laboratorios farmacéuticos' })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<PharmaLabs[]> {
    return this.service.listLabs(actor);
  }

  /** Perfil institucional. */
  @Get(':pharmaLabId')
  @ApiOperation({ summary: 'Consultar el perfil de un laboratorio' })
  getOne(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmaLabs> {
    return this.service.getLab(pharmaLabId, actor);
  }

  /** UC-17-02. */
  @Patch(':pharmaLabId')
  @ApiOperation({ summary: 'Actualizar el perfil institucional' })
  update(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: UpdatePharmaLabDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.updateLab(pharmaLabId, dto, actor);
  }

  /** UC-17-03. */
  @Post(':pharmaLabId/staff')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vincular personal al laboratorio' })
  linkStaff(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: LinkStaffDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.linkStaff(pharmaLabId, dto, actor);
  }

  /** Listado del personal. */
  @Get(':pharmaLabId/staff')
  @ApiOperation({ summary: 'Listar el personal del laboratorio' })
  listStaff(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmaLabStaff[]> {
    return this.service.listStaff(pharmaLabId, actor);
  }

  /** UC-17-04. */
  @Patch(':pharmaLabId/staff/:staffId/permissions')
  @ApiOperation({ summary: 'Cambiar los permisos de un colaborador' })
  updatePermissions(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: UpdateStaffPermissionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.updateStaffPermissions(
      pharmaLabId,
      staffId,
      dto,
      actor,
    );
  }

  /** UC-17-05. */
  @Post(':pharmaLabId/staff/:staffId/unlink')
  @ApiOperation({ summary: 'Desvincular a un colaborador' })
  unlinkStaff(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: UnlinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.unlinkStaff(pharmaLabId, staffId, dto, actor);
  }

  /** Bitácora de vinculaciones y permisos (spec 5288). */
  @Get(':pharmaLabId/link-events')
  @ApiOperation({ summary: 'Historial de vinculaciones y permisos' })
  listLinkEvents(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmaLabLinkEvents[]> {
    return this.service.listLinkEvents(pharmaLabId, actor);
  }
}
