import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PlatformScopeOptional } from '../../../common/tenant/platform-scope';
import {
  CreateReportTemplateDto,
  EndReportTemplateDto,
  ReportTemplateListDto,
  ReportTemplateQueryDto,
  ReportTemplateResponseDto,
  UpdateReportTemplateDto,
} from './report-templates.dto';
import { ReportTemplatesService } from './report-templates.service';

/** Catálogo global de presentación; no ejecuta reportes ni modifica el mayor. */
@ApiTags('accounting-report-templates')
@ApiBearerAuth()
@PlatformScopeOptional()
@Controller('admin/accounting/report-templates')
export class ReportTemplatesController {
  constructor(private readonly service: ReportTemplatesService) {}

  @Get()
  @Roles(
    'SUPERADMIN',
    'SECURITY_ADMIN',
    'PLATFORM_ADMIN',
    'ACCOUNTING_APPROVER',
    'PRACTITIONER',
  )
  @ApiOperation({
    description:
      'Catálogo global paginado por UUID. La audiencia clasifica la presentación y no concede acceso a datos contables.',
    summary: 'Plantillas de presentación contable por tipo de usuario',
  })
  @ApiOkResponse({ type: ReportTemplateListDto })
  list(@Query() query: ReportTemplateQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Roles(
    'SUPERADMIN',
    'SECURITY_ADMIN',
    'PLATFORM_ADMIN',
    'ACCOUNTING_APPROVER',
    'PRACTITIONER',
  )
  @ApiOperation({
    description:
      'Devuelve columnas, rótulos, estado y versión. No devuelve saldos ni ejecuta el reporte.',
    summary: 'Leer una plantilla de presentación contable',
  })
  @ApiOkResponse({ type: ReportTemplateResponseDto })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  @Roles('SUPERADMIN')
  @Audited({
    action: 'ACCOUNTING_REPORT_TEMPLATE_CREATED',
    entity: 'report_presentation_template',
    entityId: 'result.id',
  })
  @ApiOperation({
    description:
      'Sólo SUPERADMIN global. Código único por audiencia y columnas limitadas al contrato del reporte.',
    summary: 'Crear una plantilla global sin modificar cuentas ni asientos',
  })
  @ApiCreatedResponse({ type: ReportTemplateResponseDto })
  create(
    @Body() dto: CreateReportTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.create(dto, actor);
  }

  @Put(':id')
  @Roles('SUPERADMIN')
  @Audited({
    action: 'ACCOUNTING_REPORT_TEMPLATE_UPDATED',
    entity: 'report_presentation_template',
    entityId: 'param:id',
  })
  @ApiOperation({
    description:
      'Compara expectedRowVersion en la escritura. Conserva código y audiencia; permite reactivar con isActive.',
    summary: 'Editar presentación con control de versión (409 si cambió)',
  })
  @ApiOkResponse({ type: ReportTemplateResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, actor);
  }

  @Post(':id/end')
  @HttpCode(200)
  @Roles('SUPERADMIN')
  @Audited({
    action: 'ACCOUNTING_REPORT_TEMPLATE_ENDED',
    entity: 'report_presentation_template',
    entityId: 'param:id',
  })
  @ApiOperation({
    description:
      'Conserva el registro y su auditoría. Repetir la desactivación no incrementa la versión.',
    summary: 'Desactivar una plantilla sin borrarla (idempotente)',
  })
  @ApiOkResponse({ type: ReportTemplateResponseDto })
  end(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndReportTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.end(id, dto.expectedRowVersion, actor);
  }
}
