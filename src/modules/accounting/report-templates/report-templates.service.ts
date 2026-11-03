import { AccountingErrorReason } from '../accounting.error-reasons';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import {
  REPORT_COLUMNS,
  type CreateReportTemplateDto,
  type ReportTemplateQueryDto,
  type UpdateReportTemplateDto,
} from './report-templates.dto';
import { ReportTemplatesRepository } from './report-templates.repository';

@Injectable()
export class ReportTemplatesService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ReportTemplatesRepository,
  ) {}

  async list(query: ReportTemplateQueryDto) {
    const limit = query.limit ?? 25;
    const rows = await this.repo.list(this.em.fork(), query);
    const items = rows.slice(0, limit);
    return {
      items,
      nextCursor: rows.length > limit ? items.at(-1)!.id : null,
      limit,
    };
  }

  async get(id: string) {
    const found = await this.repo.get(this.em.fork(), id);
    if (!found)
      throw new ResourceNotFoundException(
        'La plantilla no existe',
        { id },
        AccountingErrorReason.REPORT_TEMPLATE_NOT_FOUND,
      );
    return found;
  }

  async create(dto: CreateReportTemplateDto, actor: AuthenticatedUser) {
    this.assertEditor(actor);
    this.assertColumns(dto);
    const created = await this.em.transactional((tx) =>
      this.repo.create(tx, dto, actor.id),
    );
    if (!created)
      throw new ConflictException(
        'Ya existe ese código para el tipo de usuario',
        undefined,
        AccountingErrorReason.REPORT_TEMPLATE_CODE_EXISTS,
      );
    return created;
  }

  async update(
    id: string,
    dto: UpdateReportTemplateDto,
    actor: AuthenticatedUser,
  ) {
    this.assertEditor(actor);
    this.assertColumns(dto);
    const updated = await this.em.transactional((tx) =>
      this.repo.update(tx, id, dto, actor.id),
    );
    if (updated) return updated;
    await this.get(id);
    throw new ConflictException(
      'La plantilla cambió: vuelva a leerla antes de editar',
      { id },
      AccountingErrorReason.REPORT_TEMPLATE_VERSION_CONFLICT,
    );
  }

  async end(id: string, version: number, actor: AuthenticatedUser) {
    this.assertEditor(actor);
    const updated = await this.em.transactional((tx) =>
      this.repo.end(tx, id, version, actor.id),
    );
    if (updated) return updated;
    const current = await this.get(id);
    if (!current.isActive) return current;
    throw new ConflictException(
      'La plantilla cambió: vuelva a leerla antes de desactivar',
      { id },
      AccountingErrorReason.REPORT_TEMPLATE_VERSION_CONFLICT,
    );
  }

  private assertEditor(actor: AuthenticatedUser) {
    if (!roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined))
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        reason: AccountingErrorReason.REPORT_TEMPLATE_GLOBAL_ADMIN_REQUIRED,
        message:
          'La edición del catálogo global requiere SUPERADMIN de plataforma',
      });
  }

  private assertColumns(
    dto: CreateReportTemplateDto | UpdateReportTemplateDto,
  ) {
    const keys = dto.columns.map((c) => c.key);
    const allowed: readonly string[] = REPORT_COLUMNS[dto.reportKind] ?? [];
    if (
      !keys.length ||
      new Set(keys).size !== keys.length ||
      keys.some((k) => !allowed.includes(k))
    )
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        reason: AccountingErrorReason.REPORT_TEMPLATE_INVALID_COLUMNS,
        message:
          'Las columnas deben ser únicas y pertenecer al reporte seleccionado',
      });
  }
}
