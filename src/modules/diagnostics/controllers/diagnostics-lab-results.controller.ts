import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
  NotAudited,
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { LabStaffGuard } from '../guards';
import { LabPortalResultsService } from '../services/lab-portal-results.service';
import { LabPortalResultWritesService } from '../services/lab-portal-result-writes.service';
import {
  LabResultFileDto,
  LabResultFilePageDto,
  LabResultFileQueryDto,
  LabResultFileSearchDto,
  LabResultWithdrawalDto,
} from '../dto/lab-portal-results.dto';

/** Result files of the laboratory portal: list, search, download, withdraw. */
@ApiTags('diagnostics-lab-portal')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostics/lab')
export class DiagnosticsLabResultsController {
  constructor(
    private readonly results: LabPortalResultsService,
    private readonly writes: LabPortalResultWritesService,
  ) {}

  @Get('result-files')
  @AccessLogged({ resourceType: 'DIAGNOSTIC_RESULTS' })
  @ApiOperation({
    summary: 'Resultados subidos por el laboratorio',
    description:
      'Sin búsqueda por texto: puede ser un nombre de paciente y no viaja en ' +
      'la URL. Para buscar, `POST /diagnostics/lab/result-files/search`.',
  })
  listResultFiles(
    @Query() query: LabResultFileQueryDto,
  ): Promise<LabResultFilePageDto> {
    return this.results.list(requireTenantId(), query);
  }

  @NotAudited(
    'Read-only search sent as POST so patient names stay out of the URL.',
  )
  @Post('result-files/search')
  @AccessLogged({ resourceType: 'DIAGNOSTIC_RESULTS' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar entre los resultados subidos (filtros en el cuerpo)',
  })
  searchResultFiles(
    @Body() body: LabResultFileSearchDto,
  ): Promise<LabResultFilePageDto> {
    return this.results.list(requireTenantId(), body);
  }

  @Get('result-files/:id/content')
  @AccessLogged({ resourceType: 'DIAGNOSTIC_RESULTS', resourceId: 'param:id' })
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Descargar un resultado subido' })
  @ApiOkResponse({ description: 'Bytes del archivo' })
  async getResultContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.results.content(requireTenantId(), id);
    res.setHeader('Content-Type', content.mimeType);
    if (content.originalName) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(content.originalName)}`,
      );
    }
    res.send(content.buffer);
  }

  @Audited({
    action: 'LAB_RESULT_FILE_WITHDRAWN',
    entity: 'diagnostic_report_file',
    entityId: 'param:id',
  })
  @Post('result-files/:id/withdrawal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirar un resultado subido por error (queda en el historial)',
  })
  withdrawResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LabResultWithdrawalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LabResultFileDto> {
    return this.writes.withdraw(requireTenantId(), id, dto.reason, actor);
  }
}
