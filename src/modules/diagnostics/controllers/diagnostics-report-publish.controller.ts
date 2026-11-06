import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  NotAudited,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { LabStaffGuard } from '../guards';
import {
  PublishReportDraftDto,
  PublishedReportDto,
} from '../dto/report-draft-publish.dto';
import { ReportPublishService } from '../services/report-publish.service';

/** Preview and irreversible publication of a report draft. */
@ApiTags('diagnostics-report-drafts')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostics/report-drafts')
export class DiagnosticsReportPublishController {
  constructor(private readonly publisher: ReportPublishService) {}

  @NotAudited('Renders a watermarked preview; nothing is stored.')
  @Post(':id/preview')
  @HttpCode(HttpStatus.OK)
  @AccessLogged({ resourceType: 'DIAGNOSTIC_REPORT', resourceId: 'param:id' })
  @ApiOperation({ summary: 'Vista previa en PDF con marca de agua «BORRADOR»' })
  @ApiOkResponse({ description: 'application/pdf' })
  async preview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.publisher.preview(requireTenantId(), id, actor);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="borrador-informe.pdf"',
    );
    res.send(pdf);
  }

  @Audited({
    action: 'DIAGNOSTIC_REPORT_PUBLISHED',
    entity: 'diagnostic_report',
    entityId: 'result.reportId',
  })
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar el informe: versión inmutable, PDF oficial y liberación',
  })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishReportDraftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublishedReportDto> {
    return this.publisher.publish(requireTenantId(), id, dto, actor);
  }

  @Audited({
    action: 'DIAGNOSTIC_REPORT_SIGNATURE_REQUESTED',
    entity: 'report_draft',
    entityId: 'param:id',
  })
  @Post(':id/signature-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pedir al firmante elegido que revise y publique con su firma',
    description:
      'Solo el firmante publica con su propia firma (403 REPORT_SIGNER_MUST_PUBLISH ' +
      'para cualquier otro); quien prepara el borrador le avisa con esta ruta.',
  })
  requestSignature(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ readonly requested: true }> {
    return this.publisher.requestSignature(requireTenantId(), id, actor);
  }
}
