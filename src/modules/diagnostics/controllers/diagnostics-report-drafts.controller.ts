import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { LabStaffGuard } from '../guards';
import { ReportDraftDto } from '../dto/report-draft.dto';
import {
  AttachReportDraftFileDto,
  CreateReportDraftDto,
  UpdateReportDraftDto,
} from '../dto/report-draft-write.dto';
import { ReportSignerListDto } from '../dto/report-signers.dto';
import { ReportDraftsService } from '../services/report-drafts.service';
import { ReportSignersService } from '../services/report-signers.service';
import { EntityManager } from '@mikro-orm/postgresql';

/**
 * Written report of one order (H1): the performer laboratory / imaging center
 * or the clinician of an order without performer writes it as a draft.
 */
@ApiTags('diagnostics-report-drafts')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostics/report-drafts')
export class DiagnosticsReportDraftsController {
  constructor(
    private readonly em: EntityManager,
    private readonly drafts: ReportDraftsService,
    private readonly signers: ReportSignersService,
  ) {}

  /** Declared before `:id`, so `signers` is never parsed as an id. */
  @Get('signers')
  @ApiOperation({ summary: 'Profesionales que pueden firmar informes' })
  async listSigners(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportSignerListDto> {
    const list = await this.signers.list(
      this.em.fork(),
      requireTenantId(),
      actor,
    );
    return {
      items: list.map(
        ({ profileId, name, registration, hasSignature, hasSeal }) => ({
          profileId,
          name,
          registration,
          hasSignature,
          hasSeal,
        }),
      ),
    };
  }

  @Audited({
    action: 'REPORT_DRAFT_OPENED',
    entity: 'report_draft',
    entityId: 'result.id',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Abrir (u obtener) el borrador del informe de una orden',
  })
  open(
    @Body() dto: CreateReportDraftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    return this.drafts.open(requireTenantId(), dto.serviceRequestId, actor);
  }

  @Get(':id')
  @AccessLogged({ resourceType: 'DIAGNOSTIC_REPORT', resourceId: 'param:id' })
  @ApiOperation({ summary: 'Borrador del informe' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    return this.drafts.get(requireTenantId(), id, actor);
  }

  @Audited({
    action: 'REPORT_DRAFT_UPDATED',
    entity: 'report_draft',
    entityId: 'param:id',
  })
  @Put(':id')
  @ApiOperation({
    summary: 'Guardar el borrador (409 si cambió o ya se publicó)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDraftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    return this.drafts.update(requireTenantId(), id, dto, actor);
  }

  @Audited({
    action: 'REPORT_DRAFT_FILE_ATTACHED',
    entity: 'report_draft',
    entityId: 'param:id',
  })
  @Post(':id/files')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar documento, audio o anexo al borrador' })
  attachFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachReportDraftFileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    return this.drafts.attachFile(requireTenantId(), id, dto, actor);
  }

  @Audited({
    action: 'REPORT_DRAFT_FILE_REMOVED',
    entity: 'report_draft',
    entityId: 'param:id',
  })
  @Delete(':id/files/:draftFileId')
  @ApiOperation({ summary: 'Quitar un archivo del borrador' })
  removeFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('draftFileId', ParseUUIDPipe) draftFileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    return this.drafts.removeFile(requireTenantId(), id, draftFileId, actor);
  }
}
