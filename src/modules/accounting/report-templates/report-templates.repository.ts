import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import type {
  CreateReportTemplateDto,
  ReportTemplateQueryDto,
  ReportTemplateResponseDto,
  UpdateReportTemplateDto,
} from './report-templates.dto';

type Stored = {
  id: string;
  user_type: ReportTemplateResponseDto['userType'];
  code: string;
  name: string;
  report_kind: ReportTemplateResponseDto['reportKind'];
  presentation_json: { columns: ReportTemplateResponseDto['columns'] };
  is_active: boolean;
  row_version: number;
};
const toResponse = (r: Stored): ReportTemplateResponseDto => ({
  id: r.id,
  userType: r.user_type,
  code: r.code,
  name: r.name,
  reportKind: r.report_kind,
  columns: r.presentation_json.columns,
  isActive: r.is_active,
  rowVersion: r.row_version,
});

/** SQL parametrizado sobre el catálogo del modelo; no accede a cuentas ni asientos. */
@Injectable()
export class ReportTemplatesRepository {
  private async query(
    em: EntityManager,
    sql: string,
    params: unknown[],
  ): Promise<ReportTemplateResponseDto[]> {
    const rows = await em
      .getConnection()
      .execute<Stored[]>(sql, params, 'all', em.getTransactionContext());
    return rows.map(toResponse);
  }

  list(
    em: EntityManager,
    q: ReportTemplateQueryDto,
  ): Promise<ReportTemplateResponseDto[]> {
    return this.query(
      em,
      'select * from accounting.report_presentation_templates where (?::varchar is null or user_type=?::varchar) and (?::uuid is null or id>?::uuid) order by id limit ?',
      [
        q.userType ?? null,
        q.userType ?? null,
        q.after ?? null,
        q.after ?? null,
        (q.limit ?? 25) + 1,
      ],
    );
  }

  async get(
    em: EntityManager,
    id: string,
  ): Promise<ReportTemplateResponseDto | null> {
    return (
      (
        await this.query(
          em,
          'select * from accounting.report_presentation_templates where id=?::uuid',
          [id],
        )
      )[0] ?? null
    );
  }

  async create(
    em: EntityManager,
    dto: CreateReportTemplateDto,
    actorId: string,
  ): Promise<ReportTemplateResponseDto | null> {
    return (
      (
        await this.query(
          em,
          'insert into accounting.report_presentation_templates(id,user_type,code,name,report_kind,presentation_json,is_active,created_at,updated_at,created_by_user_id,updated_by_user_id,row_version) values(?::uuid,?,?,?,?,?::jsonb,true,now(),now(),?::uuid,?::uuid,1) on conflict(user_type,code) do nothing returning *',
          [
            randomUUID(),
            dto.userType,
            dto.code,
            dto.name,
            dto.reportKind,
            JSON.stringify({ columns: dto.columns }),
            actorId,
            actorId,
          ],
        )
      )[0] ?? null
    );
  }

  async update(
    em: EntityManager,
    id: string,
    dto: UpdateReportTemplateDto,
    actorId: string,
  ): Promise<ReportTemplateResponseDto | null> {
    return (
      (
        await this.query(
          em,
          'update accounting.report_presentation_templates set name=?,report_kind=?,presentation_json=?::jsonb,is_active=?,updated_at=now(),updated_by_user_id=?::uuid,row_version=row_version+1 where id=?::uuid and row_version=? returning *',
          [
            dto.name,
            dto.reportKind,
            JSON.stringify({ columns: dto.columns }),
            dto.isActive,
            actorId,
            id,
            dto.expectedRowVersion,
          ],
        )
      )[0] ?? null
    );
  }

  async end(
    em: EntityManager,
    id: string,
    version: number,
    actorId: string,
  ): Promise<ReportTemplateResponseDto | null> {
    return (
      (
        await this.query(
          em,
          'update accounting.report_presentation_templates set is_active=false,updated_at=now(),updated_by_user_id=?::uuid,row_version=row_version+1 where id=?::uuid and row_version=? and is_active=true returning *',
          [actorId, id, version],
        )
      )[0] ?? null
    );
  }
}
